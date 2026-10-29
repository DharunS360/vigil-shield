"""
Vigil Shield SIEM - Main Application Entry Point
"""
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path

from app.core.database import engine, Base
from app.api.v1 import (
    alerts,
    incidents,
    correlation,
    mitre,
    reports,
    enrichment,
    detection,
    casebook,
)
from app.websocket_manager import manager

# Create Database Tables
Base.metadata.create_all(bind=engine)

# FastAPI App
app = FastAPI(
    title="Vigil Shield SIEM API",
    description="SOC Alert Triage & Incident Management Platform",
    version="1.0.0",
)

# CORS Middleware (Updated to allow 3001, 3002)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:3002",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
        "http://127.0.0.1:3002",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================
# API Routers
# ============================================================
app.include_router(alerts.router)
app.include_router(incidents.router)
app.include_router(correlation.router)
app.include_router(mitre.router)
app.include_router(reports.router)
app.include_router(enrichment.router)
app.include_router(detection.router)
app.include_router(casebook.router)

# ============================================================
# Static Files - Uploads
# ============================================================
UPLOAD_DIR = Path(__file__).parent.parent.parent.parent / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")


# ============================================================
# WebSocket Endpoint
# ============================================================
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        print(f"WebSocket error: {e}")
        manager.disconnect(websocket)


# ============================================================
# Root & Health
# ============================================================
@app.get("/")
def root():
    return {
        "message": "Vigil Shield SIEM API",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs",
        "websocket": "ws://localhost:8000/ws",
        "features": [
            "alerts",
            "incidents",
            "correlation",
            "mitre",
            "reports",
            "enrichment",
            "detection",
            "casebook",
        ],
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "vigilshield-siem",
        "active_websocket_connections": len(manager.active_connections),
    }
