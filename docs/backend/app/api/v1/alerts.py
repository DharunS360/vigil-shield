"""
Vigil Shield - Alerts API
List, filter, retrieve, create alerts with auto-enrichment.
"""
from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import desc, func
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import asyncio

from app.core.database import get_db
from app.models.alert import Alert
from app.services.ioc_enrichment import ioc_enricher
from app.websocket_manager import broadcast_event
from app.services import detection_engine

router = APIRouter(prefix="/api/v1/alerts", tags=["alerts"])


# ============================================================
# Pydantic Schemas
# ============================================================
class AlertCreate(BaseModel):
    src_ip: str
    dst_ip: Optional[str] = "0.0.0.0"
    src_port: Optional[int] = None
    dst_port: Optional[int] = None
    protocol: Optional[str] = None
    signature: Optional[str] = "Unknown"
    severity: str = "low"
    category: Optional[str] = "Unknown"
    mitre_technique: Optional[str] = None
    source_type: Optional[str] = "Manual"
    description: Optional[str] = None
    auto_enrich: Optional[bool] = True


# ============================================================
# Helper: Auto-enrich alert
# ============================================================
async def auto_enrich_alert(alert_id: int, ip: str, db: Session):
    """Background task to enrich alert with threat intelligence."""
    try:
        if not ip or ip in ("0.0.0.0", "127.0.0.1"):
            return

        # Run enrichment
        enrichment = await ioc_enricher.enrich_ip(ip)

        # Update DB
        alert = db.query(Alert).filter(Alert.id == alert_id).first()
        if alert:
            alert.enrichment_data = enrichment
            alert.enriched_at = datetime.utcnow()
            alert.risk_score = enrichment.get("risk_score", 0)
            alert.risk_level = enrichment.get("risk_level", "low")
            db.commit()
            print(f"✅ Auto-enriched alert #{alert_id} (IP: {ip})")
    except Exception as e:
        print(f"❌ Auto-enrich failed for alert #{alert_id}: {e}")


# ============================================================
# GET /api/v1/alerts - List all alerts
# ============================================================
@router.get("")
def list_alerts(
    severity: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    limit: int = Query(500, le=1000), # ✅ Increased from 100 to 500
    offset: int = Query(0),
    db: Session = Depends(get_db),
):
    """List alerts with optional filters."""
    query = db.query(Alert)

    if severity:
        query = query.filter(func.lower(Alert.severity) == severity.lower())
    if status:
        query = query.filter(Alert.status == status)

    alerts = (
        query.order_by(desc(Alert.timestamp)).offset(offset).limit(limit).all()
    )

    total = db.query(func.count(Alert.id)).scalar()

    return {
        "status": "success",
        "total": total,
        "count": len(alerts),
        "data": [a.to_dict() for a in alerts],
    }


# ============================================================
# GET /api/v1/alerts/stats/summary
# ============================================================
@router.get("/stats/summary")
def get_stats_summary(db: Session = Depends(get_db)):
    """Get alert statistics summary."""
    total = db.query(func.count(Alert.id)).scalar() or 0

    breakdown = {}
    for sev in ["critical", "high", "medium", "low"]:
        count = (
            db.query(func.count(Alert.id))
            .filter(func.lower(Alert.severity) == sev)
            .scalar()
            or 0
        )
        breakdown[sev] = count

    enriched_count = (
        db.query(func.count(Alert.id)).filter(Alert.enriched_at.isnot(None)).scalar()
        or 0
    )

    return {
        "status": "success",
        "total": total,
        "enriched": enriched_count,
        "breakdown": breakdown,
    }


# ============================================================
# GET /api/v1/alerts/{alert_id}
# ============================================================
@router.get("/{alert_id}")
def get_alert(alert_id: int, db: Session = Depends(get_db)):
    """Get a single alert by ID."""
    alert = db.query(Alert).filter(Alert.id == alert_id).first()

    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    return {"status": "success", "data": alert.to_dict()}


# ============================================================
# POST /api/v1/alerts - Create new alert (WITH AUTO-ENRICH)
# ============================================================
@router.post("", status_code=201)
async def create_alert(
    payload: AlertCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    """Create a new alert and optionally auto-enrich it."""
    try:
        new_alert = Alert(
            src_ip=payload.src_ip,
            dst_ip=payload.dst_ip or "0.0.0.0",
            src_port=payload.src_port,
            dst_port=payload.dst_port,
            protocol=payload.protocol,
            signature=payload.signature or "Unknown",
            severity=payload.severity.lower(),
            category=payload.category or "Unknown",
            mitre_technique=payload.mitre_technique,
            source_type=payload.source_type or "Manual",
            timestamp=datetime.utcnow(),
            risk_score=0,
            status="new",
        )

        db.add(new_alert)
        db.commit()
        db.refresh(new_alert)

        # Broadcast live event
        try:
            asyncio.create_task(broadcast_event("alert_created", new_alert.to_dict()))
        except Exception:
            pass

        # Run detection engine (auto severity / MITRE mapping)
        try:
            if hasattr(detection_engine, "run_detection"):
                detection_engine.run_detection(db, new_alert)
            elif hasattr(detection_engine, "detect"):
                detection_engine.detect(db, new_alert)
        except Exception as e:
            print(f"Detection engine error: {e}")

        # Schedule auto-enrichment as background task
        if payload.auto_enrich and new_alert.src_ip:
            background_tasks.add_task(
                auto_enrich_alert, new_alert.id, new_alert.src_ip, db
            )

        return {
            "status": "success",
            "message": "Alert created" + (
                " (enrichment running in background)" if payload.auto_enrich else ""
            ),
            "data": new_alert.to_dict(),
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500, detail=f"Failed to create alert: {str(e)}"
        )


# ============================================================
# POST /api/v1/alerts/{alert_id}/enrich - Manual enrichment
# ============================================================
@router.post("/{alert_id}/enrich")
async def enrich_alert_manually(alert_id: int, db: Session = Depends(get_db)):
    """Manually trigger enrichment for an alert."""
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    if not alert.src_ip or alert.src_ip in ("0.0.0.0", "127.0.0.1"):
        raise HTTPException(
            status_code=400, detail="Invalid source IP for enrichment"
        )

    try:
        enrichment = await ioc_enricher.enrich_ip(alert.src_ip)
        alert.enrichment_data = enrichment
        alert.enriched_at = datetime.utcnow()
        alert.risk_score = enrichment.get("risk_score", 0)
        alert.risk_level = enrichment.get("risk_level", "low")
        db.commit()
        db.refresh(alert)

        return {"status": "success", "data": alert.to_dict()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Enrichment failed: {str(e)}")


# ============================================================
# PUT /api/v1/alerts/{alert_id}/status
# ============================================================
@router.put("/{alert_id}/status")
def update_alert_status(
    alert_id: int,
    status: str = Query(..., description="New status"),
    db: Session = Depends(get_db),
):
    """Update an alert's status."""
    alert = db.query(Alert).filter(Alert.id == alert_id).first()

    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    alert.status = status
    db.commit()
    db.refresh(alert)

    return {
        "status": "success",
        "message": f"Alert {alert_id} status updated to '{status}'",
        "data": alert.to_dict(),
    }