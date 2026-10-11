from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime
from app.core.database import get_db
from app.models.alert import Alert
from app.models.incident import Incident
from app.services.correlation import correlation_engine

router = APIRouter()

@router.get("/correlate")
async def correlate_alerts(db: Session = Depends(get_db)):
    'Run correlation on real alerts from database and save incidents'
    
    # Get real alerts from database
    alerts = db.query(Alert).order_by(Alert.timestamp.desc()).limit(100).all()
    
    # Convert to dict
    alert_dicts = []
    for alert in alerts:
        alert_dicts.append({
            "id": alert.id,
            "timestamp": alert.timestamp.isoformat() if alert.timestamp else datetime.utcnow().isoformat(),
            "src_ip": alert.src_ip,
            "dst_ip": alert.dst_ip,
            "signature": alert.signature,
            "severity": alert.severity,
            "category": alert.category
        })
    
    # Run correlation engine
    incidents_data = correlation_engine.correlate(alert_dicts)
    
    # Save incidents to database
    saved_incidents = []
    for incident_data in incidents_data:
        # Check if incident already exists
        existing = db.query(Incident).filter(
            Incident.title == incident_data['title']
        ).first()
        
        if existing:
            # Update existing incident
            existing.risk_score = incident_data['risk_score']
            existing.alert_count = incident_data['alert_count']
            existing.updated_at = datetime.utcnow()
            db.commit()
            db.refresh(existing)
            saved_incidents.append(existing)
        else:
            # Create new incident
            incident = Incident(
                title=incident_data['title'],
                description=incident_data['description'],
                severity=incident_data['severity'],
                risk_score=incident_data['risk_score'],
                mitre_technique=incident_data['mitre_technique'],
                src_ip=incident_data['src_ip'],
                alert_count=incident_data['alert_count'],
                status='open',
                created_at=datetime.utcnow()
            )
            db.add(incident)
            db.commit()
            db.refresh(incident)
            saved_incidents.append(incident)
    
    # Return saved incidents with real IDs
    return {
        "status": "success",
        "correlated_alerts": len(alert_dicts),
        "incidents_created": len(saved_incidents),
        "data": [incident.to_dict() for incident in saved_incidents]
    }