from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime

from app.core.database import get_db
from app.models.alert import Alert

router = APIRouter()

@router.get("/alerts")
async def get_alerts(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    severity: Optional[str] = None,
    db: Session = Depends(get_db)
):
    'Get all alerts with pagination and filters'
    query = db.query(Alert)
    if severity:
        query = query.filter(Alert.severity == severity)
    total = query.count()
    alerts = query.order_by(Alert.timestamp.desc()).offset(skip).limit(limit).all()
    return {
        "status": "success",
        "data": [a.to_dict() for a in alerts],
        "pagination": {"skip": skip, "limit": limit, "total": total}
    }

@router.post("/alerts")
async def create_alert(
    alert_data: dict,
    db: Session = Depends(get_db)
):
    'Create a new alert for testing/simulation'
    try:
        alert = Alert(
            timestamp=datetime.utcnow(),
            src_ip=alert_data.get('src_ip', '0.0.0.0'),
            dst_ip=alert_data.get('dst_ip', '0.0.0.0'),
            signature=alert_data.get('signature', 'Unknown'),
            severity=alert_data.get('severity', 'medium'),
            category=alert_data.get('category', 'Unknown'),
            source_type=alert_data.get('source_type', 'test'),
            status='new'
        )
        db.add(alert)
        db.commit()
        db.refresh(alert)
        return {
            "status": "success",
            "message": "Alert created successfully",
            "data": alert.to_dict()
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/alerts/stats/summary")
async def get_alert_stats(db: Session = Depends(get_db)):
    'Get alert statistics for dashboard'
    total = db.query(Alert).count()
    critical = db.query(Alert).filter(Alert.severity == "critical").count()
    high = db.query(Alert).filter(Alert.severity == "high").count()
    medium = db.query(Alert).filter(Alert.severity == "medium").count()
    low = db.query(Alert).filter(Alert.severity == "low").count()
    return {
        "status": "success",
        "data": {
            "total": total,
            "critical": critical,
            "high": high,
            "medium": medium,
            "low": low
        }
    }

@router.get("/alerts/{alert_id}")
async def get_alert(alert_id: int, db: Session = Depends(get_db)):
    'Get single alert by ID'
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    return {
        "status": "success",
        "data": alert.to_dict()
    }

@router.put("/alerts/{alert_id}/status")
async def update_alert_status(
    alert_id: int,
    status: str,
    db: Session = Depends(get_db)
):
    'Update alert status (investigating, resolved, false_positive)'
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    alert.status = status
    alert.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(alert)
    return {
        "status": "success",
        "message": f"Alert status updated to {status}",
        "data": alert.to_dict()
    }