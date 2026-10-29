"""
Vigil Shield - Correlation Engine
Groups related alerts into incidents using correlation rules.
"""
import logging
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from collections import defaultdict

logger = logging.getLogger(__name__)


class CorrelationRule:
    """Base correlation rule."""

    def __init__(self, rule_id: str, name: str, description: str):
        self.rule_id = rule_id
        self.name = name
        self.description = description

    def matches(self, alerts: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Return list of incident candidates."""
        return []


class BruteForceRule(CorrelationRule):
    """Detect brute force attacks (multiple failed logins from same IP)."""

    def __init__(self, threshold: int = 3, window_seconds: int = 300):
        super().__init__(
            "COR-001",
            "Brute Force Detection",
            f"Detects {threshold}+ failed logins from same IP in {window_seconds}s",
        )
        self.threshold = threshold
        self.window_seconds = window_seconds

    def matches(self, alerts):
        incidents = []
        by_ip = defaultdict(list)

        for alert in alerts:
            sig = (alert.get("signature") or "").lower()
            cat = (alert.get("category") or "").lower()
            if "brute" in sig or "brute" in cat or "failed" in sig:
                by_ip[alert.get("src_ip")].append(alert)

        for src_ip, ip_alerts in by_ip.items():
            if len(ip_alerts) >= self.threshold:
                incidents.append({
                    "rule_id": self.rule_id,
                    "rule_name": self.name,
                    "title": f"Brute Force Attack from {src_ip}",
                    "description": f"{len(ip_alerts)} failed login attempts from {src_ip}",
                    "severity": "high",
                    "alert_ids": [a.get("id") for a in ip_alerts],
                    "src_ip": src_ip,
                    "mitre_tactics": ["credential_access"],
                    "mitre_techniques": ["T1110"],
                    "correlation_data": {
                        "rule": self.rule_id,
                        "count": len(ip_alerts),
                        "source_ip": src_ip,
                    },
                })

        return incidents


class MultiStageAttackRule(CorrelationRule):
    """Detect multi-stage attacks (same IP with multiple MITRE techniques)."""

    def __init__(self, min_techniques: int = 3):
        super().__init__(
            "COR-002",
            "Multi-Stage Attack",
            f"Detects same source with {min_techniques}+ different MITRE techniques",
        )
        self.min_techniques = min_techniques

    def matches(self, alerts):
        incidents = []
        by_ip = defaultdict(list)

        for alert in alerts:
            if alert.get("mitre_technique"):
                by_ip[alert.get("src_ip")].append(alert)

        for src_ip, ip_alerts in by_ip.items():
            techniques = set(a.get("mitre_technique") for a in ip_alerts)
            if len(techniques) >= self.min_techniques:
                incidents.append({
                    "rule_id": self.rule_id,
                    "rule_name": self.name,
                    "title": f"Multi-Stage Attack from {src_ip}",
                    "description": f"Detected {len(techniques)} different techniques: {', '.join(techniques)}",
                    "severity": "critical",
                    "alert_ids": [a.get("id") for a in ip_alerts],
                    "src_ip": src_ip,
                    "mitre_tactics": list(set(
                        t for a in ip_alerts
                        for t in (a.get("mitre_tactics") or [])
                    )),
                    "mitre_techniques": list(techniques),
                    "correlation_data": {
                        "rule": self.rule_id,
                        "techniques": list(techniques),
                        "source_ip": src_ip,
                    },
                })

        return incidents


class CredentialAccessRule(CorrelationRule):
    """Detect credential access + lateral movement chain."""

    def __init__(self):
        super().__init__(
            "COR-003",
            "Credential Access + Lateral Movement",
            "Detects credential dumping followed by lateral movement",
        )

    def matches(self, alerts):
        incidents = []
        by_ip = defaultdict(list)

        for alert in alerts:
            tech = alert.get("mitre_technique") or ""
            cat = (alert.get("category") or "").lower()
            if "T1003" in tech or "credential" in cat or "T1021" in tech or "lateral" in cat:
                by_ip[alert.get("src_ip")].append(alert)

        for src_ip, ip_alerts in by_ip.items():
            techs = set(a.get("mitre_technique") for a in ip_alerts if a.get("mitre_technique"))
            has_cred = any("T1003" in (t or "") for t in techs)
            has_lateral = any("T1021" in (t or "") for t in techs)

            if has_cred and has_lateral:
                incidents.append({
                    "rule_id": self.rule_id,
                    "rule_name": self.name,
                    "title": f"Credential Theft + Lateral Movement from {src_ip}",
                    "description": f"Detected credential access and lateral movement from {src_ip}",
                    "severity": "critical",
                    "alert_ids": [a.get("id") for a in ip_alerts],
                    "src_ip": src_ip,
                    "mitre_tactics": ["credential_access", "lateral_movement"],
                    "mitre_techniques": list(techs),
                    "correlation_data": {
                        "rule": self.rule_id,
                        "source_ip": src_ip,
                        "stages": ["credential_access", "lateral_movement"],
                    },
                })

        return incidents


class DataExfiltrationRule(CorrelationRule):
    """Detect data exfiltration patterns."""

    def __init__(self):
        super().__init__(
            "COR-004",
            "Data Exfiltration Detected",
            "Detects multiple exfiltration-related alerts from same source",
        )

    def matches(self, alerts):
        incidents = []
        by_ip = defaultdict(list)

        for alert in alerts:
            sig = (alert.get("signature") or "").lower()
            cat = (alert.get("category") or "").lower()
            tech = alert.get("mitre_technique") or ""
            if "exfil" in sig or "exfil" in cat or "T1041" in tech or "T1071" in tech:
                by_ip[alert.get("src_ip")].append(alert)

        for src_ip, ip_alerts in by_ip.items():
            if len(ip_alerts) >= 1:
                total_bytes = sum(
                    (a.get("correlation_data") or {}).get("bytes", 0)
                    for a in ip_alerts
                )
                incidents.append({
                    "rule_id": self.rule_id,
                    "rule_name": self.name,
                    "title": f"Data Exfiltration from {src_ip}",
                    "description": f"Detected {len(ip_alerts)} exfiltration indicators from {src_ip}",
                    "severity": "critical",
                    "alert_ids": [a.get("id") for a in ip_alerts],
                    "src_ip": src_ip,
                    "mitre_tactics": ["exfiltration"],
                    "mitre_techniques": ["T1041", "T1071"],
                    "correlation_data": {
                        "rule": self.rule_id,
                        "source_ip": src_ip,
                        "total_bytes": total_bytes,
                    },
                })

        return incidents


class CorrelationEngine:
    """Main correlation engine."""

    def __init__(self):
        self.rules: List[CorrelationRule] = [
            BruteForceRule(threshold=3),
            MultiStageAttackRule(min_techniques=2),
            CredentialAccessRule(),
            DataExfiltrationRule(),
        ]

    def correlate(self, alerts: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Run all correlation rules against alerts."""
        all_incidents = []

        for rule in self.rules:
            try:
                incidents = rule.matches(alerts)
                all_incidents.extend(incidents)
                if incidents:
                    logger.info(f"✅ {rule.name}: {len(incidents)} incident(s)")
            except Exception as e:
                logger.error(f"Rule {rule.rule_id} failed: {e}")

        return all_incidents

    def stats(self) -> Dict[str, Any]:
        return {
            "total_rules": len(self.rules),
            "rules": [
                {
                    "id": r.rule_id,
                    "name": r.name,
                    "description": r.description,
                }
                for r in self.rules
            ],
        }


# Singleton
correlation_engine = CorrelationEngine()