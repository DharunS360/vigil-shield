"""
Vigil Shield - Correlation Engine
Groups related alerts into incidents using correlation rules.
"""
import logging
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from collections import defaultdict

logger = logging.getLogger(__name__)


def parse_ts(value: Any) -> Optional[datetime]:
    """Parse timestamp from various formats."""
    if not value:
        return None
    if isinstance(value, datetime):
        return value
    if isinstance(value, str):
        try:
            return datetime.fromisoformat(value.replace("Z", "+00:00").replace("+00:00", ""))
        except Exception:
            return None
    return None


class CorrelationRule:
    """Base correlation rule."""

    def __init__(self, rule_id: str, name: str, description: str):
        self.rule_id = rule_id
        self.name = name
        self.description = description

    def matches(self, alerts: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        return []


class BruteForceRule(CorrelationRule):
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
            if "brute" in sig or "brute" in cat or "failed" in sig or "failed" in cat:
                by_ip[alert.get("src_ip")].append(alert)

        for src_ip, ip_alerts in by_ip.items():
            ip_alerts_sorted = sorted(
                [a for a in ip_alerts if parse_ts(a.get("timestamp"))],
                key=lambda a: parse_ts(a.get("timestamp"))
            )

            matched_ids = []
            n = len(ip_alerts_sorted)
            for i in range(n):
                window_start = parse_ts(ip_alerts_sorted[i].get("timestamp"))
                window_end = window_start + timedelta(seconds=self.window_seconds)
                window_alerts = [
                    a for a in ip_alerts_sorted[i:]
                    if parse_ts(a.get("timestamp")) <= window_end
                ]
                if len(window_alerts) >= self.threshold:
                    matched_ids = [a.get("id") for a in window_alerts]
                    break

            if matched_ids:
                incidents.append({
                    "rule_id": self.rule_id,
                    "rule_name": self.name,
                    "title": f"Brute Force Attack from {src_ip}",
                    "description": f"{len(matched_ids)} failed login attempts from {src_ip} within {self.window_seconds}s",
                    "severity": "high",
                    "alert_ids": matched_ids,
                    "src_ip": src_ip,
                    "mitre_tactics": ["credential_access"],
                    "mitre_techniques": ["T1110"],
                    "correlation_data": {
                        "rule": self.rule_id,
                        "count": len(matched_ids),
                        "source_ip": src_ip,
                        "window_seconds": self.window_seconds,
                    },
                })

        return incidents


class MultiStageAttackRule(CorrelationRule):
    def __init__(self, min_techniques: int = 3, window_seconds: int = 3600):
        super().__init__(
            "COR-002",
            "Multi-Stage Attack",
            f"Detects same source with {min_techniques}+ different MITRE techniques in {window_seconds}s",
        )
        self.min_techniques = min_techniques
        self.window_seconds = window_seconds

    def matches(self, alerts):
        incidents = []
        by_ip = defaultdict(list)

        for alert in alerts:
            if alert.get("mitre_technique"):
                by_ip[alert.get("src_ip")].append(alert)

        for src_ip, ip_alerts in by_ip.items():
            ip_sorted = sorted(
                [a for a in ip_alerts if parse_ts(a.get("timestamp"))],
                key=lambda a: parse_ts(a.get("timestamp"))
            )

            matched_ids = []
            n = len(ip_sorted)
            for i in range(n):
                start = parse_ts(ip_sorted[i].get("timestamp"))
                end = start + timedelta(seconds=self.window_seconds)
                window_alerts = [
                    a for a in ip_sorted[i:]
                    if parse_ts(a.get("timestamp")) <= end
                ]
                techniques = set(a.get("mitre_technique") for a in window_alerts if a.get("mitre_technique"))
                if len(techniques) >= self.min_techniques:
                    matched_ids = [a.get("id") for a in window_alerts]
                    break

            if matched_ids:
                techniques = set(
                    a.get("mitre_technique") for a in ip_alerts
                    if a.get("mitre_technique") and a.get("id") in matched_ids
                )
                incidents.append({
                    "rule_id": self.rule_id,
                    "rule_name": self.name,
                    "title": f"Multi-Stage Attack from {src_ip}",
                    "description": f"Detected {len(techniques)} different techniques: {', '.join(techniques)}",
                    "severity": "critical",
                    "alert_ids": matched_ids,
                    "src_ip": src_ip,
                    "mitre_tactics": list(set(
                        t for a in ip_alerts
                        if a.get("id") in matched_ids
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
    def __init__(self, window_seconds: int = 3600):
        super().__init__(
            "COR-003",
            "Credential Access + Lateral Movement",
            "Detects credential dumping followed by lateral movement",
        )
        self.window_seconds = window_seconds

    def matches(self, alerts):
        incidents = []
        by_ip = defaultdict(list)

        for alert in alerts:
            tech = alert.get("mitre_technique") or ""
            cat = (alert.get("category") or "").lower()
            if "T1003" in tech or "credential" in cat or "T1021" in tech or "lateral" in cat:
                by_ip[alert.get("src_ip")].append(alert)

        for src_ip, ip_alerts in by_ip.items():
            ip_sorted = sorted(
                [a for a in ip_alerts if parse_ts(a.get("timestamp"))],
                key=lambda a: parse_ts(a.get("timestamp"))
            )

            n = len(ip_sorted)
            matched_ids = []
            for i in range(n):
                start = parse_ts(ip_sorted[i].get("timestamp"))
                end = start + timedelta(seconds=self.window_seconds)
                window_alerts = [
                    a for a in ip_sorted[i:]
                    if parse_ts(a.get("timestamp")) <= end
                ]
                techs = set(a.get("mitre_technique") for a in window_alerts if a.get("mitre_technique"))
                has_cred = any("T1003" in (t or "") for t in techs)
                has_lateral = any("T1021" in (t or "") for t in techs)
                if has_cred and has_lateral:
                    matched_ids = [a.get("id") for a in window_alerts]
                    break

            if matched_ids:
                techs = set(
                    a.get("mitre_technique") for a in ip_alerts
                    if a.get("mitre_technique") and a.get("id") in matched_ids
                )
                incidents.append({
                    "rule_id": self.rule_id,
                    "rule_name": self.name,
                    "title": f"Credential Theft + Lateral Movement from {src_ip}",
                    "description": f"Detected credential access and lateral movement from {src_ip}",
                    "severity": "critical",
                    "alert_ids": matched_ids,
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
    def __init__(self, threshold: int = 2, window_seconds: int = 600):
        super().__init__(
            "COR-004",
            "Data Exfiltration Detected",
            f"Detects {threshold}+ exfiltration alerts from same source in {window_seconds}s",
        )
        self.threshold = threshold
        self.window_seconds = window_seconds

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
            ip_sorted = sorted(
                [a for a in ip_alerts if parse_ts(a.get("timestamp"))],
                key=lambda a: parse_ts(a.get("timestamp"))
            )

            n = len(ip_sorted)
            matched_ids = []
            for i in range(n):
                start = parse_ts(ip_sorted[i].get("timestamp"))
                end = start + timedelta(seconds=self.window_seconds)
                window_alerts = [
                    a for a in ip_sorted[i:]
                    if parse_ts(a.get("timestamp")) <= end
                ]
                if len(window_alerts) >= self.threshold:
                    matched_ids = [a.get("id") for a in window_alerts]
                    break

            if matched_ids:
                total_bytes = sum(
                    (a.get("correlation_data") or {}).get("bytes", 0)
                    for a in ip_alerts if a.get("id") in matched_ids
                )
                incidents.append({
                    "rule_id": self.rule_id,
                    "rule_name": self.name,
                    "title": f"Data Exfiltration from {src_ip}",
                    "description": f"Detected {len(matched_ids)} exfiltration indicators from {src_ip}",
                    "severity": "critical",
                    "alert_ids": matched_ids,
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
    def __init__(self):
        self.rules: List[CorrelationRule] = [
            BruteForceRule(threshold=3, window_seconds=300),
            MultiStageAttackRule(min_techniques=3, window_seconds=3600),
            CredentialAccessRule(window_seconds=3600),
            DataExfiltrationRule(threshold=2, window_seconds=600),
        ]

    def correlate(self, alerts: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
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
                {"id": r.rule_id, "name": r.name, "description": r.description}
                for r in self.rules
            ],
        }


correlation_engine = CorrelationEngine()
