# Case #046 -- Website Defacement

## Alert Metadata

| Field | Value |
|---|---|
| Case ID | VS-CB-046 |
| Date | 2026-10-11 |
| Analyst | Dharun S (SOC L1) |
| Alert Source | Web Server Logs |
| Rule ID | VS-046 |
| Severity | HIGH |
| Status | Closed |

---

## Alert Details

**Alert Type:** Impact

**MITRE ATT&CK:**
- Tactic: Impact
- Technique: T1491

---

## Investigation

### Step 1: Alert Verification
- Confirmed alert from Web Server Logs
- Verified timestamp and affected host

### Step 2: Source IP Analysis
- Source IP: [ATTACKER_IP]
- GeoIP: [Country]
- AS Owner: [ISP]

### Step 3: IOC Enrichment (VigilShield)

| Source | Result |
|---|---|
| VirusTotal | -- / 92 engines |
| AbuseIPDB | -- percent confidence |
| Risk Level | HIGH |

### Step 4: System Impact
- Affected Hosts: [List]
- Compromised Accounts: None detected

### Step 5: Log Correlation
- Related Alerts: [IDs]
- Correlation Rule: COR-XXX

---

## Triage Decision

**Decision:** TRUE POSITIVE

**Rationale:**
Website Defacement confirmed by multiple sources. MITRE technique T1491 mapped.

**Confidence Level:** HIGH

---

## Response Actions

| Action | Status | Timestamp |
|---|---|---|
| Blocked source IP at firewall | Done | 2026-10-11 11:00 |
| Isolated affected endpoint | Done | 2026-10-11 11:05 |
| Escalated to SOC L2 | Done | 2026-10-11 11:10 |
| Documented in casebook | Done | 2026-10-11 11:15 |

---

## MITRE ATT&CK Mapping

| Tactic | Technique |
|---|---|
| Impact | T1491 |

**Reference:** [MITRE T1491](https://attack.mitre.org/techniques/T1491/)

---

## Playbook Reference

- [MITRE T1491](https://attack.mitre.org/techniques/T1491/)

---

## Lessons Learned

**What went well:**
- VigilShield detected pattern quickly
- IOC enrichment confirmed malicious activity

**Recommendations:**
- Update detection rules with new IOCs
- Share threat intel with SOC team

---

## Analyst Notes

Case documented by Dharun S (SOC L1 Analyst) using VigilShield SIEM.

---

**Case Status:** CLOSED
**Resolution Time:** XX minutes
**Escalated:** No
