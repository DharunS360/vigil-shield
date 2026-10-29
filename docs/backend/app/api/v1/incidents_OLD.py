from sqlalchemy import Column, Integer, String, DateTime, Float, JSON, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base


class Incident(Base):
    __tablename__ = "incidents"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(500), nullable=False)
    description = Column(Text)
    severity = Column(String(20), index=True, default="medium")
    status = Column(String(30), index=True, default="open")
    priority = Column(String(20), default="P3")

    # Risk score & confidence
    risk_score = Column(Float, default=0.0)
    confidence = Column(Float, default=0.5)

    # Assignment & Triage
    assignee = Column(String(100), nullable=True)
    triage_decision = Column(String(20), nullable=True)
    triage_notes = Column(Text, nullable=True)

    # Correlation
    rule_id = Column(String(50), nullable=True)
    rule_name = Column(String(200), nullable=True)
    correlation_data = Column(JSON, nullable=True)

    # MITRE
    mitre_tactics = Column(JSON, nullable=True)
    mitre_techniques = Column(JSON, nullable=True)

    # Timeline & Evidence
    timeline = Column(JSON, nullable=True)
    evidence = Column(JSON, nullable=True)
    playbook_ref = Column(String(200), nullable=True)

    # Timestamps
    detected_at = Column(DateTime, default=datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    alerts = relationship("Alert", back_populates="incident")

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "severity": self.severity,
            "status": self.status,
            "priority": self.priority,
            "risk_score": self.risk_score or 0.0,
            "confidence": self.confidence or 0.0,
            "assignee": self.assignee,
            "triage_decision": self.triage_decision,
            "triage_notes": self.triage_notes,
            "rule_id": self.rule_id,
            "rule_name": self.rule_name,
            "correlation_data": self.correlation_data,
            "mitre_tactics": self.mitre_tactics or [],
            "mitre_techniques": self.mitre_techniques or [],
            "timeline": self.timeline or [],
            "evidence": self.evidence or [],
            "playbook_ref": self.playbook_ref,
            "detected_at": self.detected_at.isoformat() if self.detected_at else None,
            "resolved_at": self.resolved_at.isoformat() if self.resolved_at else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "alert_count": len(self.alerts) if self.alerts else 0,
        }