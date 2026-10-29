"""
Vigil Shield - Incidents API
List, filter, retrieve, create, update incidents.
Correlation, evidence upload, timeline, risk scoring.
"""
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Form
from sqlalchemy.orm import Session
from sqlalchemy import desc, func
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from pathlib import Path
import uuid
import shutil

from app.core.database import get_db
from app.models.incident import Incident
from app.models.alert import Alert
from app.services.correlation import correlation_engine

router = APIRouter(prefix="/api/v1/incidents", tags=["incidents"])

# Upload directory
UPLOAD_DIR = Path(__file__).parent.parent.parent.parent / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)


# ============================================================
# Pydantic Schemas
# ============================================================
class IncidentCreate(BaseModel):
    title: str
    description: Optional[str] = None
    severity: str = "medium"
    priority: str = "P3"
    assignee: Optional[str] = None


class IncidentUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    severity: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    assignee: Optional[str] = None
    triage_decision: Optional[str] = None
    triage_notes: Optional[str] = None


class TimelineEvent(BaseModel):
    event: str
    analyst: Optional[str] = "Analyst"


class EvidenceItem(BaseModel):
    type: str
    url: str
    description: Optional[str] = None


# ============================================================
# GET /api/v1/incidents - List all incidents
# ============================================================
@router.get("")
def list_incidents(
    severity: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    limit: int = Query(100, le=500),
    offset: int = Query(0),
    db: Session = Depends(get_db),
):
    query = db.query(Incident)

    if severity:
        query = query.filter(func.lower(Incident.severity) == severity.lower())
    if status:
        query = query.filter(Incident.status == status)

    incidents = (
        query.order_by(desc(Incident.created_at)).offset(offset).limit(limit).all()
    )
    total = db.query(func.count(Incident.id)).scalar()

    return {
        "status": "success",
        "total": total,
        "count": len(incidents),
        "data": [i.to_dict() for i in incidents],
    }


# ============================================================
# GET /api/v1/incidents/stats/summary
# ============================================================
@router.get("/stats/summary")
def get_incident_stats(db: Session = Depends(get_db)):
    total = db.query(func.count(Incident.id)).scalar() or 0

    breakdown = {}
    for sev in ["critical", "high", "medium", "low"]:
        count = (
            db.query(func.count(Incident.id))
            .filter(func.lower(Incident.severity) == sev)
            .scalar()
            or 0
        )
        breakdown[sev] = count

    open_count = (
        db.query(func.count(Incident.id))
        .filter(Incident.status == "open")
        .scalar()
        or 0
    )
    resolved_count = (
        db.query(func.count(Incident.id))
        .filter(Incident.status == "resolved")
        .scalar()
        or 0
    )

    return {
        "status": "success",
        "total": total,
        "open": open_count,
        "resolved": resolved_count,
        "breakdown": breakdown,
    }


# ============================================================
# GET /api/v1/incidents/{incident_id}
# ============================================================
@router.get("/{incident_id}")
def get_incident(incident_id: int, db: Session = Depends(get_db)):
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    data = incident.to_dict()
    data["alerts"] = [a.to_dict() for a in (incident.alerts or [])]
    return {"status": "success", "data": data}


# ============================================================
# POST /api/v1/incidents - Create new incident
# ============================================================
@router.post("", status_code=201)
def create_incident(payload: IncidentCreate, db: Session = Depends(get_db)):
    try:
        incident = Incident(
            title=payload.title,
            description=payload.description,
            severity=payload.severity.lower(),
            priority=payload.priority,
            status="open",
            assignee=payload.assignee,
            risk_score=0.0,
            confidence=0.5,
            detected_at=datetime.utcnow(),
            timeline=[{
                "time": datetime.utcnow().isoformat(),
                "event": "Incident created manually",
                "analyst": "Analyst",
            }],
        )
        db.add(incident)
        db.commit()
        db.refresh(incident)

        return {"status": "success", "data": incident.to_dict()}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create incident: {str(e)}")


# ============================================================
# PUT /api/v1/incidents/{incident_id} - Update incident
# ============================================================
@router.put("/{incident_id}")
def update_incident(
    incident_id: int, payload: IncidentUpdate, db: Session = Depends(get_db)
):
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    for field, value in payload.dict(exclude_unset=True).items():
        setattr(incident, field, value)

    incident.updated_at = datetime.utcnow()

    timeline = incident.timeline or []
    timeline.append({
        "time": datetime.utcnow().isoformat(),
        "event": "Incident updated",
        "analyst": "Analyst",
    })
    incident.timeline = timeline

    db.commit()
    db.refresh(incident)
    return {"status": "success", "data": incident.to_dict()}


# ============================================================
# DELETE /api/v1/incidents/{incident_id}
# ============================================================
@router.delete("/{incident_id}")
def delete_incident(incident_id: int, db: Session = Depends(get_db)):
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    db.delete(incident)
    db.commit()
    return {"status": "success", "message": f"Incident {incident_id} deleted"}


# ============================================================
# POST /api/v1/incidents/{incident_id}/timeline - Add timeline event
# ============================================================
@router.post("/{incident_id}/timeline")
def add_timeline_event(
    incident_id: int, payload: TimelineEvent, db: Session = Depends(get_db)
):
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    timeline = incident.timeline or []
    timeline.append({
        "time": datetime.utcnow().isoformat(),
        "event": payload.event,
        "analyst": payload.analyst or "Analyst",
    })
    incident.timeline = timeline
    incident.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(incident)
    return {"status": "success", "data": incident.to_dict()}


# ============================================================
# POST /api/v1/incidents/{incident_id}/evidence - Add evidence
# ============================================================
@router.post("/{incident_id}/evidence")
def add_evidence(
    incident_id: int, payload: EvidenceItem, db: Session = Depends(get_db)
):
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    evidence = incident.evidence or []
    evidence.append({
        "type": payload.type,
        "url": payload.url,
        "description": payload.description or "",
        "added_at": datetime.utcnow().isoformat(),
    })
    incident.evidence = evidence
    incident.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(incident)
    return {"status": "success", "data": incident.to_dict()}


# ============================================================
# POST /api/v1/incidents/{incident_id}/upload - Upload evidence file
# ============================================================
@router.post("/{incident_id}/upload")
async def upload_evidence_file(
    incident_id: int,
    file: UploadFile = File(...),
    description: Optional[str] = Form(None),
    db: Session = Depends(get_db),
):
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    ext = Path(file.filename or "file").suffix
    unique_name = f"{uuid.uuid4().hex}{ext}"
    file_path = UPLOAD_DIR / unique_name

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    evidence = incident.evidence or []
    evidence.append({
        "type": "file",
        "filename": file.filename,
        "url": f"/uploads/{unique_name}",
        "description": description or file.filename or "Uploaded file",
        "added_at": datetime.utcnow().isoformat(),
    })
    incident.evidence = evidence
    incident.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(incident)

    return {
        "status": "success",
        "message": f"Uploaded {file.filename}",
        "evidence": incident.evidence,
    }


# ============================================================
# POST /api/v1/incidents/correlate - Run correlation engine
# ============================================================
@router.post("/correlate")
def run_correlation(db: Session = Depends(get_db)):
    alerts = db.query(Alert).all()
    alerts_data = [a.to_dict() for a in alerts]

    if not alerts_data:
        return {
            "status": "success",
            "message": "No alerts to correlate",
            "incidents_created": 0,
            "incidents_updated": 0,
        }

    incidents_data = correlation_engine.correlate(alerts_data)

    created = []
    updated = []
    for inc_data in incidents_data:
        corr_data = inc_data.get("correlation_data", {}) or {}
        alert_ids = inc_data.get("alert_ids", [])
        corr_data["alert_ids"] = alert_ids

        rule_id = inc_data.get("rule_id")
        src_ip = inc_data.get("src_ip")

        existing = None
        if rule_id and src_ip:
            candidates = (
                db.query(Incident)
                .filter(Incident.rule_id == rule_id)
                .filter(Incident.status.in_(["open", "in_progress"]))
                .all()
            )
            for inc in candidates:
                if (inc.correlation_data or {}).get("source_ip") == src_ip:
                    existing = inc
                    break

        if existing:
            existing.description = inc_data["description"]
            existing.severity = inc_data["severity"]
            existing.correlation_data = corr_data
            existing.mitre_tactics = inc_data.get("mitre_tactics", [])
            existing.mitre_techniques = inc_data.get("mitre_techniques", [])
            existing.updated_at = datetime.utcnow()

            timeline = existing.timeline or []
            timeline.append({
                "time": datetime.utcnow().isoformat(),
                "event": f"Re-correlated by {rule_id}: {len(alert_ids)} alerts",
                "analyst": "VigilShield Engine",
            })
            existing.timeline = timeline

            for aid in alert_ids:
                alert = db.query(Alert).filter(Alert.id == aid).first()
                if alert and alert.incident_id != existing.id:
                    alert.incident_id = existing.id

            updated.append(existing.to_dict())
        else:
            sev = (inc_data.get("severity") or "medium").lower()
            sev_map = {"critical": 90.0, "high": 75.0, "medium": 50.0, "low": 25.0}
            base_risk = sev_map.get(sev, 50.0)
            count_bonus = min(len(alert_ids) * 2, 10)
            risk_score = min(base_risk + count_bonus, 100.0)

            techs = inc_data.get("mitre_techniques", []) or []
            confidence = min(0.5 + (len(techs) * 0.1) + (min(len(alert_ids), 5) * 0.05), 1.0)

            incident = Incident(
                title=inc_data["title"],
                description=inc_data["description"],
                severity=inc_data["severity"],
                status="open",
                priority="P2",
                risk_score=risk_score,
                confidence=round(confidence, 2),
                rule_id=rule_id,
                rule_name=inc_data.get("rule_name"),
                correlation_data=corr_data,
                mitre_tactics=inc_data.get("mitre_tactics", []),
                mitre_techniques=inc_data.get("mitre_techniques", []),
                detected_at=datetime.utcnow(),
                timeline=[{
                    "time": datetime.utcnow().isoformat(),
                    "event": f"Incident created by {rule_id}",
                    "analyst": "VigilShield Engine",
                }],
            )
            db.add(incident)
            db.flush()

            for aid in alert_ids:
                alert = db.query(Alert).filter(Alert.id == aid).first()
                if alert:
                    alert.incident_id = incident.id

            created.append(incident.to_dict())

    db.commit()

    return {
        "status": "success",
        "message": f"Correlation complete: {len(created)} created, {len(updated)} updated",
        "incidents_created": len(created),
        "incidents_updated": len(updated),
        "total_alerts_analyzed": len(alerts_data),
        "incidents": created + updated,
    }