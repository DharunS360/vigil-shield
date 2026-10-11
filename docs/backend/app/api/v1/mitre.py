from fastapi import APIRouter

router = APIRouter()

MITRE_TECHNIQUES = [
    {"id": "T1046", "name": "Network Service Scanning", "tactic": "Reconnaissance", "severity": 40},
    {"id": "T1110", "name": "Brute Force", "tactic": "Credential Access", "severity": 80},
    {"id": "T1190", "name": "Exploit Public-Facing App", "tactic": "Initial Access", "severity": 85},
    {"id": "T1071", "name": "Application Layer Protocol", "tactic": "Command and Control", "severity": 85},
    {"id": "T1486", "name": "Data Encrypted for Impact", "tactic": "Impact", "severity": 100},
    {"id": "T1003", "name": "Credential Dumping", "tactic": "Credential Access", "severity": 95},
]

@router.get("/mitre/techniques")
async def get_mitre_techniques():
    'Get all MITRE ATT&CK techniques'
    return {"status": "success", "data": MITRE_TECHNIQUES, "total": len(MITRE_TECHNIQUES)}
