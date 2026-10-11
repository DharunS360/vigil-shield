from sqlalchemy import Column, Integer, String, DateTime, Float, Text, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base

class Incident(Base):
    __tablename__ = "incidents"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(500), nullable=False)
    description = Column(Text)
    severity = Column(String(20), index=True, nullable=False)
    risk_score = Column(Float, default=0.0)
    confidence = Column(Float, default=0.0)
    mitre_technique = Column(String(20))
    mitre_tactic = Column(String(50))
    src_ip = Column(String(45), index=True)
    affected_assets = Column(JSON, default=list)
    alert_count = Column(Integer, default=0)
    status = Column(String(20), default="open")
    assigned_to = Column(String(100))
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)
    tags = Column(JSON, default=list)
    notes = Column(Text)
    investigation_summary = Column(Text)
    
    alerts = relationship("Alert", back_populates="incident")
    
    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "severity": self.severity,
            "risk_score": self.risk_score or 0,
            "confidence": self.confidence or 0,
            "mitre_technique": self.mitre_technique,
            "mitre_tactic": self.mitre_tactic,
            "src_ip": self.src_ip,
            "affected_assets": self.affected_assets or [],
            "alert_count": self.alert_count or 0,
            "status": self.status or "open",
            "assigned_to": self.assigned_to,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "resolved_at": self.resolved_at.isoformat() if self.resolved_at else None,
            "tags": self.tags or [],
            "notes": self.notes,
            "investigation_summary": self.investigation_summary
        }