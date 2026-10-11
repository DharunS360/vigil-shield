import json
import hashlib
from datetime import datetime, timedelta
from typing import List, Dict, Any

class CorrelationEngine:
    def __init__(self):
        self.rules = self.load_rules()
        self.mitre_map = self.load_mitre_map()
    
    def load_rules(self) -> List[Dict]:
        'Correlation Rules'
        return [
            {"id": "RULE-001", "name": "Ransomware Activity", "keywords": ["ransomware"], "severity": "critical", "mitre_technique": "T1486", "risk_score": 95, "window": 600, "min_count": 1},
            {"id": "RULE-002", "name": "Port Scan Detection", "keywords": ["port scan", "scan"], "severity": "high", "mitre_technique": "T1046", "risk_score": 70, "window": 300, "min_count": 3},
            {"id": "RULE-003", "name": "Brute Force Attack", "keywords": ["brute force", "ssh", "login"], "severity": "high", "mitre_technique": "T1110", "risk_score": 80, "window": 60, "min_count": 5},
            {"id": "RULE-004", "name": "Web Attack", "keywords": ["sql injection", "xss", "web attack"], "severity": "critical", "mitre_technique": "T1190", "risk_score": 90, "window": 300, "min_count": 1},
            {"id": "RULE-005", "name": "Sudo Exploit", "keywords": ["sudo", "privilege", "escalation"], "severity": "high", "mitre_technique": "T1548", "risk_score": 85, "window": 300, "min_count": 1},
        ]
    
    def load_mitre_map(self) -> Dict[str, Dict]:
        'MITRE ATT&CK Technique Mapping'
        return {
            "ransomware": {"id": "T1486", "name": "Data Encrypted for Impact", "tactic": "Impact"},
            "port scan": {"id": "T1046", "name": "Network Service Scanning", "tactic": "Reconnaissance"},
            "scan": {"id": "T1046", "name": "Network Service Scanning", "tactic": "Reconnaissance"},
            "brute force": {"id": "T1110", "name": "Brute Force", "tactic": "Credential Access"},
            "ssh": {"id": "T1110", "name": "Brute Force", "tactic": "Credential Access"},
            "login": {"id": "T1110", "name": "Brute Force", "tactic": "Credential Access"},
            "exploit": {"id": "T1190", "name": "Exploit Public-Facing App", "tactic": "Initial Access"},
            "web attack": {"id": "T1190", "name": "Exploit Public-Facing App", "tactic": "Initial Access"},
            "sql injection": {"id": "T1190", "name": "Exploit Public-Facing App", "tactic": "Initial Access"},
            "sudo": {"id": "T1548", "name": "Abuse Elevation Control", "tactic": "Privilege Escalation"},
            "malware": {"id": "T1071", "name": "Application Layer Protocol", "tactic": "Command and Control"},
            "c2": {"id": "T1071", "name": "Application Layer Protocol", "tactic": "Command and Control"},
        }
    
    def map_to_mitre(self, signature: str) -> Dict:
        'Automatically map alert signature to MITRE ATT&CK technique'
        signature_lower = signature.lower()
        for keyword, technique in self.mitre_map.items():
            if keyword in signature_lower:
                return {
                    "technique_id": technique["id"],
                    "technique_name": technique["name"],
                    "tactic": technique["tactic"]
                }
        return {"technique_id": "T0000", "technique_name": "Unknown", "tactic": "Unknown"}
    
    def correlate(self, alerts: List[Dict]) -> List[Dict]:
        'Correlate real alerts and create incidents'
        incidents = []
        grouped = {}
        
        # Group alerts by source IP
        for alert in alerts:
            src_ip = alert.get('src_ip', 'unknown')
            if src_ip not in grouped:
                grouped[src_ip] = []
            grouped[src_ip].append(alert)
        
        # Check each group against rules
        for src_ip, ip_alerts in grouped.items():
            for rule in self.rules:
                if self.check_rule(ip_alerts, rule):
                    incident = self.create_incident(src_ip, ip_alerts, rule)
                    incidents.append(incident)
                    break
        
        return incidents
    
    def check_rule(self, alerts: List[Dict], rule: Dict) -> bool:
        'Check if alerts match rule pattern'
        now = datetime.utcnow()
        window = timedelta(seconds=rule.get('window', 300))
        
        recent = []
        for a in alerts:
            try:
                alert_time = datetime.fromisoformat(a['timestamp'])
                if alert_time > now - window:
                    recent.append(a)
            except:
                continue
        
        matches = 0
        for alert in recent:
            signature = alert.get('signature', '').lower()
            for keyword in rule.get('keywords', []):
                if keyword.lower() in signature:
                    matches += 1
                    break
        
        return matches >= rule.get('min_count', 1)
    
    def create_incident(self, src_ip: str, alerts: List[Dict], rule: Dict) -> Dict:
        'Create incident from correlated alerts'
        mitre = self.map_to_mitre(rule['name'])
        
        # Generate unique ID
        incident_id = int(hashlib.md5(f"{src_ip}{rule['id']}".encode()).hexdigest()[:8], 16)
        
        return {
            "id": incident_id,
            "title": f"{rule['name']} - {src_ip}",
            "description": f"Detected {rule['name']} from source {src_ip}. {len(alerts)} related alerts found.",
            "severity": rule['severity'],
            "risk_score": rule['risk_score'],
            "mitre_technique": rule['mitre_technique'],
            "mitre_name": mitre["technique_name"],
            "mitre_tactic": mitre["tactic"],
            "src_ip": src_ip,
            "alerts": alerts[:5],
            "alert_count": len(alerts),
            "status": "open",
            "created_at": datetime.utcnow().isoformat()
        }

correlation_engine = CorrelationEngine()