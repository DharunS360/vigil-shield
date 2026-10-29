"""
Vigil Shield - Casebook API
Serves SOC casebook cases and IR playbooks.
"""
from fastapi import APIRouter, HTTPException
from pathlib import Path
from typing import Dict, Any
import re

router = APIRouter(prefix="/api/v1/casebook", tags=["casebook"])

# ============================================================
# Casebook Directory - FULL PATH
# ============================================================
CASEBOOK_DIR = Path(__file__).resolve().parent.parent.parent.parent.parent.parent / "casebook"


def parse_case_metadata(content: str) -> Dict[str, Any]:
    """Extract metadata from case markdown."""
    metadata = {
        "case_id": "",
        "severity": "medium",
        "mitre": "",
        "tactic": "",
        "status": "closed",
    }

    id_match = re.search(r"Case ID \| (VS-CB-\d+)", content)
    if id_match:
        metadata["case_id"] = id_match.group(1)

    sev_match = re.search(r"Severity \| (CRITICAL|HIGH|MEDIUM|LOW)", content)
    if sev_match:
        metadata["severity"] = sev_match.group(1).lower()

    mitre_match = re.search(r"Technique: (T\d+(?:\.\d+)?)", content)
    if mitre_match:
        metadata["mitre"] = mitre_match.group(1)

    tactic_match = re.search(r"Tactic: ([\w\s]+)", content)
    if tactic_match:
        metadata["tactic"] = tactic_match.group(1).strip()

    return metadata


def classify_category(slug: str) -> str:
    """Classify case into category based on slug."""
    slug_lower = slug.lower()
    auth_keywords = [
        "ssh", "rdp", "login", "spray", "stuffing", "default-credentials",
        "ssh-key", "kerberos", "ntlm", "mfa",
    ]
    mal_keywords = [
        "powershell", "macro", "script", "base64", "suspicious-dll",
        "injection", "fileless", "mshta", "regsvr32", "rundll32",
    ]
    cred_keywords = [
        "lsass", "mimikatz", "sam", "ntds", "dcsync", "credential-manager",
        "browser", "keylogger", "cached", "password-filter",
    ]
    lat_keywords = [
        "smb", "psexec", "wmi", "rdp-lateral", "ssh-lateral",
        "remote-service", "winrm", "pass-the",
    ]

    if any(k in slug_lower for k in auth_keywords):
        return "Authentication"
    if any(k in slug_lower for k in mal_keywords):
        return "Malware"
    if any(k in slug_lower for k in cred_keywords):
        return "Credential Access"
    if any(k in slug_lower for k in lat_keywords):
        return "Lateral Movement"
    return "Impact"


# ============================================================
# GET /api/v1/casebook/cases - List all cases
# ============================================================
@router.get("/cases")
def list_cases():
    """List all casebook cases."""
    cases = []

    if not CASEBOOK_DIR.exists():
        return {
            "status": "success",
            "total": 0,
            "cases": [],
            "debug": f"Casebook dir not found: {CASEBOOK_DIR}",
        }

    for case_dir in sorted(CASEBOOK_DIR.iterdir()):
        if (
            not case_dir.is_dir()
            or case_dir.name.startswith("_")
            or case_dir.name == "playbooks"
        ):
            continue

        readme = case_dir / "README.md"
        if not readme.exists():
            continue

        try:
            content = readme.read_text(encoding="utf-8")

            title_match = re.search(r"# Case #(\d+) -- (.+)", content)
            if title_match:
                case_num = title_match.group(1)
                title = title_match.group(2).strip()
            else:
                case_num = case_dir.name.split("-")[0]
                title = case_dir.name.replace("-", " ").title()

            metadata = parse_case_metadata(content)

            cases.append({
                "id": case_num,
                "slug": case_dir.name,
                "title": title,
                "case_id": metadata["case_id"],
                "severity": metadata["severity"],
                "mitre": metadata["mitre"],
                "tactic": metadata["tactic"],
                "category": classify_category(case_dir.name),
                "status": metadata["status"],
            })
        except Exception as e:
            print(f"Error parsing {case_dir}: {e}")

    return {"status": "success", "total": len(cases), "cases": cases}


# ============================================================
# GET /api/v1/casebook/cases/{slug} - Get single case
# ============================================================
@router.get("/cases/{slug}")
def get_case(slug: str):
    """Get a single case by slug."""
    case_dir = CASEBOOK_DIR / slug
    if not case_dir.exists():
        raise HTTPException(status_code=404, detail="Case not found")

    readme = case_dir / "README.md"
    if not readme.exists():
        raise HTTPException(status_code=404, detail="Case content not found")

    content = readme.read_text(encoding="utf-8")
    return {
        "status": "success",
        "slug": slug,
        "content": content,
        "metadata": parse_case_metadata(content),
    }


# ============================================================
# GET /api/v1/casebook/stats - Statistics
# ============================================================
@router.get("/stats")
def casebook_stats():
    """Get casebook statistics."""
    cases_response = list_cases()
    cases = cases_response["cases"]

    by_category: Dict[str, int] = {}
    by_severity: Dict[str, int] = {}
    by_tactic: Dict[str, int] = {}

    for case in cases:
        cat = case["category"]
        by_category[cat] = by_category.get(cat, 0) + 1
        by_severity[case["severity"]] = by_severity.get(case["severity"], 0) + 1
        if case["tactic"]:
            by_tactic[case["tactic"]] = by_tactic.get(case["tactic"], 0) + 1

    return {
        "status": "success",
        "total": len(cases),
        "by_category": by_category,
        "by_severity": by_severity,
        "by_tactic": by_tactic,
    }


# ============================================================
# GET /api/v1/casebook/playbooks - List playbooks
# ============================================================
@router.get("/playbooks")
def list_playbooks():
    """List all playbooks."""
    playbooks_dir = CASEBOOK_DIR / "playbooks"
    playbooks = []

    if not playbooks_dir.exists():
        return {"status": "success", "total": 0, "playbooks": []}

    for pb_file in sorted(playbooks_dir.glob("*.md")):
        playbooks.append({
            "name": pb_file.stem,
            "title": pb_file.stem.replace("-", " ").title(),
        })

    return {"status": "success", "total": len(playbooks), "playbooks": playbooks}


# ============================================================
# GET /api/v1/casebook/playbooks/{name} - Get playbook
# ============================================================
@router.get("/playbooks/{name}")
def get_playbook(name: str):
    """Get a playbook by name."""
    pb_file = CASEBOOK_DIR / "playbooks" / f"{name}.md"
    if not pb_file.exists():
        raise HTTPException(status_code=404, detail="Playbook not found")

    content = pb_file.read_text(encoding="utf-8")
    return {"status": "success", "name": name, "content": content}

