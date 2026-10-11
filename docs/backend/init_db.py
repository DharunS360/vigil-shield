import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import engine, Base
from app.models import Alert, Incident

def init_database():
    print("=" * 50)
    print("VigilShield SIEM - Database Initializer")
    print("=" * 50)
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("✅ Database initialized successfully!")
    print("📊 Tables created: alerts, incidents")
    print("=" * 50)

if __name__ == "__main__": 
    init_database()
