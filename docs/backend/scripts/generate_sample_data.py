import json
import random
from datetime import datetime, timedelta
import os

SURICATA_SIGNATURES = [
    {"sig": "ET SCAN Suspicious Port Scan", "severity": 2, "category": "Scan", "mitre": "T1046"},
    {"sig": "ET EXPLOIT Attempt", "severity": 3, "category": "Exploit", "mitre": "T1190"},
    {"sig": "ET MALWARE C2 Communication", "severity": 3, "category": "Malware", "mitre": "T1071"},
    {"sig": "ET Ransomware Activity", "severity": 4, "category": "Malware", "mitre": "T1486"},
    {"sig": "ET SSH Brute Force", "severity": 2, "category": "Brute Force", "mitre": "T1110"},
]

def generate_logs(num=100):
    print(f"Generating {num} sample logs...")
    logs = []
    base = datetime.utcnow() - timedelta(hours=24)
    
    for i in range(num):
        sig = random.choice(SURICATA_SIGNATURES)
        src = f"192.168.{random.randint(1,255)}.{random.randint(1,255)}"
        dst = f"{random.randint(1,255)}.{random.randint(0,255)}.{random.randint(0,255)}.{random.randint(1,255)}"
        
        logs.append({
            "timestamp": (base + timedelta(minutes=i)).isoformat(),
            "src_ip": src,
            "dst_ip": dst,
            "src_port": random.randint(1024, 65535),
            "dst_port": random.choice([22, 80, 443, 3389]),
            "proto": random.choice(["TCP", "UDP"]),
            "alert": {
                "signature": sig["sig"],
                "severity": sig["severity"],
                "category": sig["category"]
            },
            "source_type": "suricata"
        })
    
    os.makedirs("../logs", exist_ok=True)
    with open("../logs/eve.json", "w") as f:
        for log in logs:
            f.write(json.dumps(log) + "\n")
    
    print(f"✅ Generated {num} logs")
    print(f"📁 Saved to: logs/eve.json")

if __name__ == "__main__": 
    print("=" * 50)
    print("VigilShield SIEM - Sample Data Generator")
    print("=" * 50)
    generate_logs(100)
    print("=" * 50)
