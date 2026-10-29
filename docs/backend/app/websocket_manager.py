"""
Vigil Shield - WebSocket Connection Manager
Handles live connections and broadcasting.
"""
import asyncio
import logging
from typing import List, Dict, Any
from fastapi import WebSocket

logger = logging.getLogger(__name__)


class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self._lock = asyncio.Lock()

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        async with self._lock:
            self.active_connections.append(websocket)
        logger.info(f"✅ WebSocket connected. Total: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        logger.info(f"❌ WebSocket disconnected. Total: {len(self.active_connections)}")

    async def broadcast(self, message: Dict[str, Any]):
        """Broadcast a message to all active connections."""
        if not self.active_connections:
            return
        dead = []
        for connection in list(self.active_connections):
            try:
                await connection.send_json(message)
            except Exception as e:
                logger.warning(f"Broadcast failed: {e}")
                dead.append(connection)
        for d in dead:
            self.disconnect(d)

    async def broadcast_safe(self, message: Dict[str, Any]):
        """Fire-and-forget broadcast (never raises)."""
        try:
            await self.broadcast(message)
        except Exception as e:
            logger.error(f"broadcast_safe error: {e}")


manager = ConnectionManager()


async def broadcast_event(event_type: str, data: Dict[str, Any]):
    """Helper to broadcast a structured event."""
    await manager.broadcast_safe({
        "type": event_type,
        "data": data,
        "timestamp": __import__("datetime").datetime.utcnow().isoformat(),
    })
