"""
Vigil Shield - Correlation API (redirects to incidents correlate)
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.v1.incidents import run_correlation

router = APIRouter(prefix="/api/v1/correlate", tags=["correlation"])


@router.get("")
def correlate_alerts(db: Session = Depends(get_db)):
    """Run correlation on real alerts from database and save incidents."""
    return run_correlation(db)