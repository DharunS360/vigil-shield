"""
Vigil Shield - Incidents API with Case Management + File Upload.
"""
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import desc, func
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from pathlib import Path
import uuid

from app.core.database import get_db
from app.models.incident import Incident
from app.models.alert import Alert
from app.services.correlation import correlation_engine

router = APIRouter(prefix="/api/v1/incidents", tags=["incidents"])

# Upload directory
UPLOAD_DIR = Path(__file__).parent.parent.parent.parent / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)


# ============================================================
# Schemas
# ============================================================
class IncidentUpdate(BaseModel):
    status: Optional[str] = None
    assignee: Optional[str] = None
    triage_decision: Optional[str] = None
    triage_notes: Optional[str] = None
    priority: Optional[str] = None
    playbook_ref: Optional[str] = None


class TimelineEntry(BaseModel):
    event: str
    analyst: Optional[str] = "Analyst"


class EvidenceEntry(BaseModel):
    type: str
    description: str
    url: Optional[str] = None


# ============================================================
# GET /api/v1/incidents - List
# ============================================================
@router.get("")
def list_incidents(
    status: Optional[str] = Query(None),
    severity: Optional[str] = Query(None),
    limit: int = Query(100, le=500),
    db: Session = Depends(get_db),
):
    query = db.query(Incident)
    if status:
        query = query.filter(Incident.status == status)
    if severity:
        query = query.filter(func.lower(Incident.severity) == severity.lower())

    incidents = query.order_by(desc(Incident.detected_at)).limit(limit).all()
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
def incidents_stats(db: Session = Depends(get_db)):
    total = db.query(func.count(Incident.id)).scalar() or 0
    by_status = {}
    for status in ["open", "investigating", "resolved", "false_positive"]:
        by_status[status] = (
            db.query(func.count(Incident.id))
            .filter(Incident.status == status)
            .scalar() or 0
        )
    by_severity = {}
    for sev in ["critical", "high", "medium", "low"]:
        by_severity[sev] = (
            db.query(func.count(Incident.id))
            .filter(func.lower(Incident.severity) == sev)
            .scalar() or 0
        )
    return {
        "status": "success",
        "total": total,
        "by_status": by_status,
        "by_severity": by_severity,
    }


# ============================================================
# GET /api/v1/incidents/rules/correlation
# ============================================================
@router.get("/rules/correlation")
def correlation_rules():
    return {"status": "success", "stats": correlation_engine.stats()}


# ============================================================
# GET /api/v1/incidents/{incident_id}
# ============================================================
@router.get("/{incident_id}")
def get_incident(incident_id: int, db: Session = Depends(get_db)):
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    related_alerts = db.query(Alert).filter(Alert.incident_id == incident_id).all()
    data = incident.to_dict()
    data["alerts"] = [a.to_dict() for a in related_alerts]
    return {"status": "success", "data": data}


# ============================================================
# PUT /api/v1/incidents/{incident_id}
# ============================================================
@router.put("/{incident_id}")
def update_incident(
    incident_id: int,
    payload: IncidentUpdate,
    db: Session = Depends(get_db),
):
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    if payload.status:
        incident.status = payload.status
        if payload.status in ("resolved", "false_positive"):
            incident.resolved_at = datetime.utcnow()
        timeline = incident.timeline or []
        timeline.append({
            "time": datetime.utcnow().isoformat(),
            "event": f"Status changed to {payload.status}",
            "analyst": incident.assignee or "System",
        })
        incident.timeline = timeline

    if payload.assignee is not None:
        incident.assignee = payload.assignee
    if payload.triage_decision is not None:
        incident.triage_decision = payload.triage_decision
        timeline = incident.timeline or []
        timeline.append({
            "time": datetime.utcnow().isoformat(),
            "event": f"Triage decision: {payload.triage_decision}",
            "analyst": incident.assignee or "System",
        })
        incident.timeline = timeline
    if payload.triage_notes is not None:
        incident.triage_notes = payload.triage_notes
    if payload.priority:
        incident.priority = payload.priority
    if payload.playbook_ref is not None:
        incident.playbook_ref = payload.playbook_ref

    db.commit()
    db.refresh(incident)
    return {"status": "success", "data": incident.to_dict()}


# ============================================================
# POST /api/v1/incidents/{incident_id}/timeline
# ============================================================
@router.post("/{incident_id}/timeline")
def add_timeline_entry(
    incident_id: int,
    entry: TimelineEntry,
    db: Session = Depends(get_db),
):
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    timeline = incident.timeline or []
    timeline.append({
        "time": datetime.utcnow().isoformat(),
        "event": entry.event,
        "analyst": entry.analyst or "Analyst",
    })
    incident.timeline = timeline
    db.commit()
    db.refresh(incident)
    return {"status": "success", "timeline": incident.timeline}


# ============================================================
# POST /api/v1/incidents/{incident_id}/evidence
# ============================================================
@router.post("/{incident_id}/evidence")
def add_evidence(
    incident_id: int,
    entry: EvidenceEntry,
    db: Session = Depends(get_db),
):
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    evidence = incident.evidence or []
    evidence.append({
        "type": entry.type,
        "description": entry.description,
        "url": entry.url,
        "added_at": datetime.utcnow().isoformat(),
    })
    incident.evidence = evidence
    db.commit()
    db.refresh(incident)
    return {"status": "success", "evidence": incident.evidence}


# ============================================================
# POST /api/v1/incidents/{incident_id}/upload - File upload
# ============================================================
@router.post("/{incident_id}/upload")
async def upload_evidence_file(
    incident_id: int,
    file: UploadFile = File(...),
    description: str = Query(""),
    db: Session = Depends(get_db),
):
    """Upload a file as evidence."""
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    contents = await file.read()
    if len(contents) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large (max 10MB)")

    ext = Path(file.filename or "file").suffix
    unique_name = f"{uuid.uuid4().hex}{ext}"
    file_path = UPLOAD_DIR / unique_name

    with open(file_path, "wb") as f:
        f.write(contents)

    evidence = incident.evidence or []
    evidence.append({
        "type": "file",
        "description": description or file.filename or "Uploaded file",
        "url": f"/uploads/{unique_name}",
        "filename": file.filename,
        "size": len(contents),
        "content_type": file.content_type or "application/octet-stream",
        "added_at": datetime.utcnow().isoformat(),
    })
    incident.evidence = evidence
    db.commit()
    db.refresh(incident)

    return {
        "status": "success",
        "message": f"Uploaded {file.filename}",
        "evidence": incident.evidence,
    }


# ============================================================
# POST /api/v1/incidents/correlate
# ============================================================
@router.post("/correlate")
def run_correlation(db: Session = Depends(get_db)):
    """Run correlation engine and LINK ALERTS to incidents."""
    alerts = db.query(Alert).all()
    alerts_data = [a.to_dict() for a in alerts]

    if not alerts_data:
        return {
            "status": "success",
            "message": "No alerts to correlate",
            "incidents_created": 0,
        }

    incidents_data = correlation_engine.correlate(alerts_data)

    created = []
    for inc_data in incidents_data:
        corr_data = inc_data.get("correlation_data", {}) or {}
        alert_ids = inc_data.get("alert_ids", [])
        corr_data["alert_ids"] = alert_ids

        incident = Incident(
            title=inc_data["title"],
            description=inc_data["description"],
            severity=inc_data["severity"],
            status="open",
            priority="P2",
            rule_id=inc_data.get("rule_id"),
            rule_name=inc_data.get("rule_name"),
            correlation_data=corr_data,
            mitre_tactics=inc_data.get("mitre_tactics", []),
            mitre_techniques=inc_data.get("mitre_techniques", []),
            detected_at=datetime.utcnow(),
            timeline=[{
                "time": datetime.utcnow().isoformat(),
                "event": f"Incident created by {inc_data.get('rule_id')}",
                "analyst": "VigilShield Engine",
            }],
        )
        db.add(incident)
        db.flush()

        for aid in alert_ids:
            alert = db.query(Alert).filter(Alert.id == aid).first()
            if alert:
                alert.incident_id = incident.id
                print(f"✅ Linked alert #{aid} → incident #{incident.id}")

        created.append(incident.to_dict())

    db.commit()

    return {
        "status": "success",
        "message": f"Correlation complete: {len(created)} incidents created",
        "incidents_created": len(created),
        "total_alerts_analyzed": len(alerts_data),
        "incidents": created,
    }