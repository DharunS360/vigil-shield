from fastapi import APIRouter
from app.api.v1 import alerts, incidents, correlation, mitre

router = APIRouter()

router.include_router(alerts.router, tags=["alerts"])
router.include_router(incidents.router, tags=["incidents"])
router.include_router(correlation.router, tags=["correlation"])
router.include_router(mitre.router, tags=["mitre"])
