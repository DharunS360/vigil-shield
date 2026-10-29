"""
Vigil Shield - Detection Rules API
Manage and execute detection rules.
"""
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import Optional

from app.core.database import get_db
from app.models.alert import Alert
from app.services.detection_engine import detection_engine

router = APIRouter(prefix="/api/v1/detection", tags=["detection"])


@router.get("/rules")
def list_rules():
    """List all detection rules."""
    return {
        "status": "success",
        "total": len(detection_engine.rules),
        "rules": detection_engine.get_rules(),
    }


@router.get("/rules/stats")
def rule_stats():
    """Get rule statistics."""
    return {
        "status": "success",
        "stats": detection_engine.stats(),
    }


@router.get("/rules/{rule_id}")
def get_rule(rule_id: str):
    """Get a single rule by ID."""
    rule = detection_engine.get_rule(rule_id)
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    return {"status": "success", "rule": rule.to_dict()}


@router.post("/reload")
def reload_rules():
    """Reload rules from disk."""
    count = detection_engine.reload()
    return {
        "status": "success",
        "message": f"Reloaded {count} rules",
        "total": count,
    }


@router.post("/test/{alert_id}")
def test_alert_rules(alert_id: int, db: Session = Depends(get_db)):
    """Run all detection rules against a specific alert."""
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    alert_dict = alert.to_dict()
    matches = detection_engine.test_alert(alert_dict)

    return {
        "status": "success",
        "alert_id": alert_id,
        "matches_count": len(matches),
        "matched_rules": matches,
    }


@router.post("/test-all")
def test_all_alerts(db: Session = Depends(get_db)):
    """Run detection rules against all alerts."""
    alerts = db.query(Alert).all()

    results = []
    for alert in alerts:
        matches = detection_engine.test_alert(alert.to_dict())
        if matches:
            results.append({
                "alert_id": alert.id,
                "signature": alert.signature,
                "severity": alert.severity,
                "matches_count": len(matches),
                "matched_rules": [m["id"] for m in matches],
            })

    return {
        "status": "success",
        "total_alerts": len(alerts),
        "matched_alerts": len(results),
        "results": results,
    }