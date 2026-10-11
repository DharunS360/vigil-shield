from sqlalchemy import Column, Integer, String, DateTime, Float, JSON, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    src_ip = Column(String(45), index=True)
    dst_ip = Column(String(45), index=True)
    src_port = Column(Integer)
    dst_port = Column(Integer)
    protocol = Column(String(10))
    signature = Column(String(500), index=True)
    severity = Column(String(20), index=True)
    category = Column(String(100))
    mitre_technique = Column(String(20))
    source_type = Column(String(50))
    raw_data = Column(JSON)
    risk_score = Column(Float, default=0.0)

    # Enrichment
    enrichment_data = Column(JSON, nullable=True)
    enriched_at = Column(DateTime, nullable=True)
    risk_level = Column(String(20), nullable=True)

    # Incident linking
    incident_id = Column(
        Integer, ForeignKey("incidents.id", ondelete="SET NULL"), nullable=True
    )
    incident = relationship("Incident", back_populates="alerts")

    status = Column(String(20), default="new")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None,
            "src_ip": self.src_ip,
            "dst_ip": self.dst_ip,
            "src_port": self.src_port,
            "dst_port": self.dst_port,
            "protocol": self.protocol,
            "signature": self.signature,
            "severity": self.severity,
            "category": self.category,
            "mitre_technique": self.mitre_technique,
            "source_type": self.source_type,
            "risk_score": self.risk_score or 0,
            "risk_level": self.risk_level,
            "enrichment_data": self.enrichment_data,
            "enriched_at": self.enriched_at.isoformat() if self.enriched_at else None,
            "incident_id": self.incident_id,
            "status": self.status or "new",
        }