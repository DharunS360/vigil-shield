from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from app.api.v1 import router
from app.websocket_manager import manager

load_dotenv()

app = FastAPI(
    title="VigilShield SIEM",
    version="1.0.0",
    description="Enterprise SIEM Solution - Always Watching, Always Safe"
)

# CORS - Allow multiple origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:5173",
        "http://192.168.1.36:3000",
        "http://192.168.1.36:3001",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(router, prefix="/api/v1")

@app.websocket("/ws/alerts")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)

@app.get("/")
async def root():
    return {"message": "VigilShield SIEM API", "status": "running", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "version": "1.0.0", "database": "connected"}