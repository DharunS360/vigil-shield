"""
Vigil Shield - IOC Enrichment Service
"""
import os
import httpx
import logging
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

VIRUSTOTAL_API_KEY = os.getenv("VIRUSTOTAL_API_KEY", "")
ABUSEIPDB_API_KEY = os.getenv("ABUSEIPDB_API_KEY", "")

_cache: Dict[str, Dict[str, Any]] = {}
CACHE_TTL = timedelta(hours=1)


class IOCEnricher:
    def __init__(self):
        self.vt_key = VIRUSTOTAL_API_KEY
        self.abuse_key = ABUSEIPDB_API_KEY
        self.enabled = bool(self.vt_key and self.abuse_key)
        if self.enabled:
            logger.info("✅ IOC Enrichment enabled")
        else:
            logger.warning("⚠️  IOC Enrichment disabled - API keys missing")

    def _cache_key(self, ioc_type: str, value: str) -> str:
        return f"{ioc_type}:{value}"

    def _get_from_cache(self, key: str) -> Optional[Dict[str, Any]]:
        if key in _cache:
            entry = _cache[key]
            if datetime.now() - entry["timestamp"] < CACHE_TTL:
                return entry["data"]
            else:
                del _cache[key]
        return None

    def _set_cache(self, key: str, data: Dict[str, Any]):
        _cache[key] = {"data": data, "timestamp": datetime.now()}

    async def enrich_ip(self, ip: str) -> Dict[str, Any]:
        cache_key = self._cache_key("ip", ip)
        cached = self._get_from_cache(cache_key)
        if cached:
            return cached

        result = {
            "ioc_type": "ip",
            "value": ip,
            "virustotal": {},
            "abuseipdb": {},
            "risk_score": 0,
            "risk_level": "low",
            "enriched_at": datetime.now().isoformat(),
        }

        if not self.enabled:
            result["error"] = "Enrichment disabled - API keys missing"
            return result

        # VirusTotal
        try:
            async with httpx.AsyncClient(timeout=15) as client:
                r = await client.get(
                    f"https://www.virustotal.com/api/v3/ip_addresses/{ip}",
                    headers={"x-apikey": self.vt_key},
                )
                if r.status_code == 200:
                    data = r.json().get("data", {}).get("attributes", {})
                    stats = data.get("last_analysis_stats", {})
                    result["virustotal"] = {
                        "malicious": stats.get("malicious", 0),
                        "suspicious": stats.get("suspicious", 0),
                        "harmless": stats.get("harmless", 0),
                        "undetected": stats.get("undetected", 0),
                        "total_engines": sum(stats.values()) if stats else 0,
                        "country": data.get("country", "Unknown"),
                        "as_owner": data.get("as_owner", "Unknown"),
                        "reputation": data.get("reputation", 0),
                    }
                elif r.status_code == 404:
                    result["virustotal"] = {"error": "IP not found in VirusTotal"}
                else:
                    result["virustotal"] = {"error": f"HTTP {r.status_code}"}
        except Exception as e:
            logger.error(f"VirusTotal error: {e}")
            result["virustotal"] = {"error": str(e)}

        # AbuseIPDB
        try:
            async with httpx.AsyncClient(timeout=15) as client:
                r = await client.get(
                    "https://api.abuseipdb.com/api/v2/check",
                    params={"ipAddress": ip, "maxAgeInDays": 90},
                    headers={
                        "Key": self.abuse_key,
                        "Accept": "application/json",
                    },
                )
                if r.status_code == 200:
                    data = r.json().get("data", {})
                    result["abuseipdb"] = {
                        "abuse_confidence_score": data.get("abuseConfidenceScore", 0),
                        "total_reports": data.get("totalReports", 0),
                        "country_code": data.get("countryCode", "Unknown"),
                        "isp": data.get("isp", "Unknown"),
                        "domain": data.get("domain", "Unknown"),
                        "is_whitelisted": data.get("isWhitelisted", False),
                        "usage_type": data.get("usageType", "Unknown"),
                    }
                else:
                    result["abuseipdb"] = {"error": f"HTTP {r.status_code}"}
        except Exception as e:
            logger.error(f"AbuseIPDB error: {e}")
            result["abuseipdb"] = {"error": str(e)}

        # Risk score
        vt = result["virustotal"]
        abuse = result["abuseipdb"]

        vt_score = 0
        if vt.get("malicious", 0) > 0:
            total = vt.get("total_engines", 1)
            vt_score = min(100, (vt["malicious"] / max(total, 1)) * 100)

        abuse_score = abuse.get("abuse_confidence_score", 0)
        result["risk_score"] = round(max(vt_score, abuse_score), 1)

        if result["risk_score"] >= 70:
            result["risk_level"] = "critical"
        elif result["risk_score"] >= 40:
            result["risk_level"] = "high"
        elif result["risk_score"] >= 20:
            result["risk_level"] = "medium"
        else:
            result["risk_level"] = "low"

        self._set_cache(cache_key, result)
        return result

    async def enrich_hash(self, file_hash: str) -> Dict[str, Any]:
        result = {
            "ioc_type": "hash",
            "value": file_hash,
            "virustotal": {},
            "risk_score": 0,
            "risk_level": "low",
            "enriched_at": datetime.now().isoformat(),
        }

        if not self.enabled:
            result["error"] = "Enrichment disabled"
            return result

        try:
            async with httpx.AsyncClient(timeout=15) as client:
                r = await client.get(
                    f"https://www.virustotal.com/api/v3/files/{file_hash}",
                    headers={"x-apikey": self.vt_key},
                )
                if r.status_code == 200:
                    data = r.json().get("data", {}).get("attributes", {})
                    stats = data.get("last_analysis_stats", {})
                    result["virustotal"] = {
                        "malicious": stats.get("malicious", 0),
                        "suspicious": stats.get("suspicious", 0),
                        "harmless": stats.get("harmless", 0),
                        "undetected": stats.get("undetected", 0),
                        "total_engines": sum(stats.values()) if stats else 0,
                        "type_description": data.get("type_description", "Unknown"),
                        "names": data.get("names", [])[:5],
                        "threat_label": data.get(
                            "popular_threat_classification", {}
                        ).get("suggested_threat_label", "Unknown"),
                    }
                    if stats.get("malicious", 0) > 0:
                        total = sum(stats.values())
                        result["risk_score"] = round(
                            (stats["malicious"] / max(total, 1)) * 100, 1
                        )
                elif r.status_code == 404:
                    result["virustotal"] = {"error": "Hash not found"}
                else:
                    result["virustotal"] = {"error": f"HTTP {r.status_code}"}
        except Exception as e:
            result["virustotal"] = {"error": str(e)}

        if result["risk_score"] >= 70:
            result["risk_level"] = "critical"
        elif result["risk_score"] >= 40:
            result["risk_level"] = "high"
        elif result["risk_score"] >= 20:
            result["risk_level"] = "medium"
        else:
            result["risk_level"] = "low"

        return result

    async def enrich_domain(self, domain: str) -> Dict[str, Any]:
        result = {
            "ioc_type": "domain",
            "value": domain,
            "virustotal": {},
            "risk_score": 0,
            "risk_level": "low",
            "enriched_at": datetime.now().isoformat(),
        }

        if not self.enabled:
            result["error"] = "Enrichment disabled"
            return result

        try:
            async with httpx.AsyncClient(timeout=15) as client:
                r = await client.get(
                    f"https://www.virustotal.com/api/v3/domains/{domain}",
                    headers={"x-apikey": self.vt_key},
                )
                if r.status_code == 200:
                    data = r.json().get("data", {}).get("attributes", {})
                    stats = data.get("last_analysis_stats", {})
                    result["virustotal"] = {
                        "malicious": stats.get("malicious", 0),
                        "suspicious": stats.get("suspicious", 0),
                        "harmless": stats.get("harmless", 0),
                        "total_engines": sum(stats.values()) if stats else 0,
                        "registrar": data.get("registrar", "Unknown"),
                    }
                    if stats.get("malicious", 0) > 0:
                        total = sum(stats.values())
                        result["risk_score"] = round(
                            (stats["malicious"] / max(total, 1)) * 100, 1
                        )
                elif r.status_code == 404:
                    result["virustotal"] = {"error": "Domain not found"}
                else:
                    result["virustotal"] = {"error": f"HTTP {r.status_code}"}
        except Exception as e:
            result["virustotal"] = {"error": str(e)}

        if result["risk_score"] >= 70:
            result["risk_level"] = "critical"
        elif result["risk_score"] >= 40:
            result["risk_level"] = "high"
        elif result["risk_score"] >= 20:
            result["risk_level"] = "medium"
        else:
            result["risk_level"] = "low"

        return result

    def status(self) -> Dict[str, Any]:
        return {
            "enabled": self.enabled,
            "virustotal_configured": bool(self.vt_key),
            "abuseipdb_configured": bool(self.abuse_key),
            "cache_size": len(_cache),
        }


ioc_enricher = IOCEnricher()