# Case #028 -- Keylogger Detected

## Alert Metadata

| Field | Value |
|---|---|
| Case ID | VS-CB-028 |
| Date | 2026-10-11 |
| Analyst | Dharun S (SOC L1) |
| Alert Source | EDR |
| Rule ID | VS-028 |
| Severity | HIGH |
| Status | Closed |

---

## Alert Details

**Alert Type:** Credential Access

**MITRE ATT&CK:**
- Tactic: Collection
- Technique: T1056.001

---

## Investigation

### Step 1: Alert Verification
- Confirmed alert from EDR
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
Keylogger Detected confirmed by multiple sources. MITRE technique T1056.001 mapped.

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
| Collection | T1056.001 |

**Reference:** [MITRE T1056.001](https://attack.mitre.org/techniques/T1056.001/)

---

## Playbook Reference

- [MITRE T1056.001](https://attack.mitre.org/techniques/T1056.001/)

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
