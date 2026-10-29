"""
Vigil Shield - Detection Rule Engine
Loads and executes detection rules against alerts.
"""
import os
import yaml
import logging
from pathlib import Path
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
import re

logger = logging.getLogger(__name__)

# Rules directory
RULES_DIR = Path(__file__).parent.parent.parent / "detection_rules"


class DetectionRule:
    """Represents a single detection rule."""

    def __init__(self, rule_data: Dict[str, Any], source_file: str = ""):
        self.id = rule_data.get("id", "unknown")
        self.title = rule_data.get("title", "Untitled Rule")
        self.description = rule_data.get("description", "")
        self.severity = rule_data.get("level", "medium").lower()
        self.status = rule_data.get("status", "experimental")
        self.mitre_tactics = rule_data.get("tags", [])
        self.mitre_techniques = [
            t for t in rule_data.get("tags", []) if t.startswith("attack.t")
        ]
        self.detection = rule_data.get("detection", {})
        self.logsource = rule_data.get("logsource", {})
        self.references = rule_data.get("references", [])
        self.author = rule_data.get("author", "Unknown")
        self.source_file = source_file

    def matches(self, alert: Dict[str, Any]) -> bool:
        """Check if an alert matches this rule."""
        detection = self.detection
        if not detection:
            return False

        # Selection criteria
        selection = detection.get("selection", {})
        if not isinstance(selection, dict):
            return False

        for field, expected in selection.items():
            if not self._field_matches(alert, field, expected):
                return False

        # Condition (basic support)
        condition = detection.get("condition", "selection")
        if "and" in condition.lower():
            return True  # All selections must match (simplified)

        return True

    def _field_matches(self, alert: Dict[str, Any], field: str, expected: Any) -> bool:
        """Check if a field in alert matches expected value(s)."""
        # Get field value from alert
        value = alert.get(field)
        if value is None:
            # Try common field mappings
            field_map = {
                "Image": "signature",
                "CommandLine": "signature",
                "SourceIp": "src_ip",
                "DestinationIp": "dst_ip",
                "SourcePort": "src_port",
                "DestinationPort": "dst_port",
                "EventType": "category",
            }
            mapped = field_map.get(field)
            if mapped:
                value = alert.get(mapped)

        if value is None:
            return False

        value_str = str(value).lower()

        # Handle different expected types
        if isinstance(expected, list):
            # OR condition
            return any(self._single_match(value_str, str(e)) for e in expected)
        elif isinstance(expected, str):
            # Support wildcards
            if "*" in expected:
                pattern = expected.lower().replace("*", ".*")
                return bool(re.search(pattern, value_str))
            return expected.lower() in value_str
        else:
            return str(expected).lower() == value_str

    def _single_match(self, value: str, expected: str) -> bool:
        """Match single value with wildcard support."""
        expected = expected.lower()
        if "*" in expected:
            pattern = expected.replace("*", ".*")
            return bool(re.search(pattern, value))
        return expected in value

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "severity": self.severity,
            "status": self.status,
            "mitre_tactics": self.mitre_tactics,
            "mitre_techniques": self.mitre_techniques,
            "author": self.author,
            "source_file": self.source_file,
        }


class DetectionEngine:
    """Loads and executes detection rules."""

    def __init__(self):
        self.rules: List[DetectionRule] = []
        self._load_rules()

    def _load_rules(self):
        """Load all YAML rules from detection_rules directory."""
        self.rules = []

        if not RULES_DIR.exists():
            logger.warning(f"⚠️  Rules directory not found: {RULES_DIR}")
            return

        for subfolder in ["sigma", "custom"]:
            folder = RULES_DIR / subfolder
            if not folder.exists():
                continue

            for rule_file in folder.glob("*.yml"):
                try:
                    with open(rule_file, "r", encoding="utf-8") as f:
                        data = yaml.safe_load(f)
                        if data:
                            rule = DetectionRule(data, str(rule_file.name))
                            self.rules.append(rule)
                except Exception as e:
                    logger.error(f"Failed to load {rule_file}: {e}")
                except:
                    pass

        logger.info(f"✅ Loaded {len(self.rules)} detection rules")

    def reload(self):
        """Reload rules from disk."""
        self._load_rules()
        return len(self.rules)

    def get_rules(self) -> List[Dict[str, Any]]:
        """Get all rules as dicts."""
        return [r.to_dict() for r in self.rules]

    def get_rule(self, rule_id: str) -> Optional[DetectionRule]:
        """Get a single rule by ID."""
        for rule in self.rules:
            if rule.id == rule_id:
                return rule
        return None

    def test_alert(self, alert: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Run all rules against an alert. Returns matching rules."""
        matches = []
        for rule in self.rules:
            try:
                if rule.matches(alert):
                    matches.append(rule.to_dict())
            except Exception as e:
                logger.error(f"Rule {rule.id} error: {e}")
        return matches

    def stats(self) -> Dict[str, Any]:
        """Get rule statistics."""
        by_severity = {}
        by_status = {}
        by_tactic = {}

        for r in self.rules:
            by_severity[r.severity] = by_severity.get(r.severity, 0) + 1
            by_status[r.status] = by_status.get(r.status, 0) + 1
            for t in r.mitre_tactics:
                by_tactic[t] = by_tactic.get(t, 0) + 1

        return {
            "total": len(self.rules),
            "by_severity": by_severity,
            "by_status": by_status,
            "by_tactic": by_tactic,
        }


# Singleton
detection_engine = DetectionEngine()