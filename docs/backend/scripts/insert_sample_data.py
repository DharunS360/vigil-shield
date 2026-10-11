import json
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from datetime import datetime
from app.core.database import SessionLocal
from app.models.alert import Alert

def map_severity(sev):
    if isinstance(sev, str):
        if sev.lower() in ['critical', '4']:
            return 'critical'
        elif sev.lower() in ['high', '3']:
            return 'high'
        elif sev.lower() in ['medium', '2']:
            return 'medium'
        elif sev.lower() in ['low', '1']:
            return 'low'
    elif isinstance(sev, int):
        if sev >= 4:
            return 'critical'
        elif sev == 3:
            return 'high'
        elif sev == 2:
            return 'medium'
        elif sev == 1:
            return 'low'
    return 'medium'

def insert_alerts():
    db = SessionLocal()
    
    try:
        # Clear existing alerts
        db.query(Alert).delete()
        db.commit()
        
        with open("../logs/eve.json", "r") as f:
            logs = [json.loads(line) for line in f]
        
        print(f"📊 Found {len(logs)} logs to insert")
        
        count = 0
        for log in logs:
            severity = log["alert"]["severity"]
            mapped_severity = map_severity(severity)
            
            alert = Alert(
                timestamp=datetime.fromisoformat(log["timestamp"]),
                src_ip=log["src_ip"],
                dst_ip=log["dst_ip"],
                src_port=log["src_port"],
                dst_port=log["dst_port"],
                protocol=log["proto"],
                signature=log["alert"]["signature"],
                severity=mapped_severity,
                category=log["alert"]["category"],
                mitre_technique=log["alert"].get("mitre", ""),
                source_type=log["source_type"],
                raw_data=log
            )
            db.add(alert)
            count += 1
        
        db.commit()
        print(f"✅ Inserted {count} alerts into database!")
        
        # Show severity distribution
        critical = db.query(Alert).filter(Alert.severity == 'critical').count()
        high = db.query(Alert).filter(Alert.severity == 'high').count()
        medium = db.query(Alert).filter(Alert.severity == 'medium').count()
        low = db.query(Alert).filter(Alert.severity == 'low').count()
        
        print(f"📊 Severity Distribution:")
        print(f"   Critical: {critical}")
        print(f"   High: {high}")
        print(f"   Medium: {medium}")
        print(f"   Low: {low}")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    insert_alerts()
