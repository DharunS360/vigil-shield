"""
Vigil Shield - IOC Enrichment API Endpoints
"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from datetime import datetime

from app.core.database import get_db
from app.models.alert import Alert
from app.services.ioc_enrichment import ioc_enricher

router = APIRouter(prefix="/api/v1/enrichment", tags=["enrichment"])


class EnrichRequest(BaseModel):
    ioc_type: str
    value: str


@router.get("/status")
def enrichment_status():
    return ioc_enricher.status()


@router.post("/lookup")
async def enrich_ioc(req: EnrichRequest):
    try:
        if req.ioc_type == "ip":
            return await ioc_enricher.enrich_ip(req.value)
        elif req.ioc_type == "hash":
            return await ioc_enricher.enrich_hash(req.value)
        elif req.ioc_type == "domain":
            return await ioc_enricher.enrich_domain(req.value)
        else:
            raise HTTPException(
                status_code=400,
                detail="Invalid ioc_type. Use: ip, hash, or domain",
            )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/ip/{ip}")
async def enrich_ip_endpoint(ip: str):
    return await ioc_enricher.enrich_ip(ip)


@router.get("/hash/{file_hash}")
async def enrich_hash_endpoint(file_hash: str):
    return await ioc_enricher.enrich_hash(file_hash)


@router.get("/domain/{domain}")
async def enrich_domain_endpoint(domain: str):
    return await ioc_enricher.enrich_domain(domain)


# ============================================================
# BULK ENRICHMENT
# ============================================================
@router.post("/bulk")
async def bulk_enrich_alerts(db: Session = Depends(get_db)):
    """Enrich all un-enriched alerts in database."""
    alerts = (
        db.query(Alert)
        .filter(Alert.enriched_at.is_(None))
        .filter(Alert.src_ip.isnot(None))
        .all()
    )

    if not alerts:
        return {
            "status": "success",
            "message": "No un-enriched alerts found",
            "total": 0,
            "enriched": 0,
            "failed": 0,
        }

    enriched = 0
    failed = 0
    results = []

    for alert in alerts:
        try:
            if alert.src_ip in ("0.0.0.0", "127.0.0.1"):
                failed += 1
                results.append({
                    "id": alert.id,
                    "src_ip": alert.src_ip,
                    "status": "skipped",
                    "reason": "Invalid IP",
                })
                continue

            enrichment = await ioc_enricher.enrich_ip(alert.src_ip)
            alert.enrichment_data = enrichment
            alert.enriched_at = datetime.utcnow()
            alert.risk_score = enrichment.get("risk_score", 0)
            alert.risk_level = enrichment.get("risk_level", "low")
            enriched += 1
            results.append({
                "id": alert.id,
                "src_ip": alert.src_ip,
                "status": "success",
                "risk_score": enrichment.get("risk_score", 0),
                "risk_level": enrichment.get("risk_level", "low"),
            })
        except Exception as e:
            failed += 1
            results.append({
                "id": alert.id,
                "src_ip": alert.src_ip,
                "status": "failed",
                "error": str(e),
            })

    db.commit()

    return {
        "status": "success",
        "total": len(alerts),
        "enriched": enriched,
        "failed": failed,
        "results": results,
    }