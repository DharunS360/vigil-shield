from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime

from app.core.database import get_db
from app.models.incident import Incident

router = APIRouter()

@router.get("/incidents")
async def get_incidents(
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    'Get all incidents with optional status filter'
    query = db.query(Incident)
    if status:
        query = query.filter(Incident.status == status)
    incidents = query.order_by(Incident.created_at.desc()).all()
    return {
        "status": "success",
        "data": [i.to_dict() for i in incidents]
    }

@router.get("/incidents/{incident_id}")
async def get_incident(incident_id: int, db: Session = Depends(get_db)):
    'Get single incident by ID'
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    return {
        "status": "success",
        "data": incident.to_dict()
    }

@router.put("/incidents/{incident_id}")
async def update_incident_status(
    incident_id: int,
    status: str,
    db: Session = Depends(get_db)
):
    'Update incident status (open, investigating, resolved, false_positive)'
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    
    incident.status = status
    incident.updated_at = datetime.utcnow()
    
    if status == "resolved":
        incident.resolved_at = datetime.utcnow()
    
    db.commit()
    db.refresh(incident)
    
    return {
        "status": "success",
        "message": f"Incident status updated to {status}",
        "data": incident.to_dict()
    }