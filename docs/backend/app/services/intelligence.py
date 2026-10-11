import requests
import os
from dotenv import load_dotenv

load_dotenv()

ABUSEIPDB_API_KEY = os.getenv("ABUSEIPDB_API_KEY", "")

def check_ip_abuse(ip: str):
    \"\"\"Check IP against AbuseIPDB\"\"\"
    
    if not ABUSEIPDB_API_KEY:
        return None
    
    url = "https://api.abuseipdb.com/api/v2/check"
    
    headers = {
        "Accept": "application/json",
        "Key": ABUSEIPDB_API_KEY
    }
    
    params = {
        "ipAddress": ip,
        "maxAgeInDays": 90
    }
    
    try:
        response = requests.get(url, headers=headers, params=params)
        data = response.json()
        
        if response.status_code == 200:
            return data["data"]
        else:
            print(f"Error: {data}")
            return None
    except Exception as e:
        print(f"Exception: {e}")
        return None

def enrich_alerts_with_threat_intel(alerts):
    \"\"\"Enrich alerts with threat intel\"\"\"
    
    enriched = []
    for alert in alerts:
        intel = check_ip_abuse(alert.src_ip)
        if intel:
            alert["threat_intel"] = {
                "reputation": intel.get("abuseConfidenceScore", 0),
                "total_reports": intel.get("totalReports", 0),
                "country": intel.get("countryCode", "Unknown"),
                "is_malicious": intel.get("abuseConfidenceScore", 0) > 50
            }
        enriched.append(alert)
    
    return enriched
