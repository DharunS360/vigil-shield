# Case #047 -- Denial of Service

## Alert Metadata

| Field | Value |
|---|---|
| Case ID | VS-CB-047 |
| Date | 2026-10-11 |
| Analyst | Dharun S (SOC L1) |
| Alert Source | Network Monitor |
| Rule ID | VS-047 |
| Severity | HIGH |
| Status | Closed |

---

## Alert Details

**Alert Type:** Impact

**MITRE ATT&CK:**
- Tactic: Impact
- Technique: T1498

---

## Investigation

### Step 1: Alert Verification
- Confirmed alert from Network Monitor
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
Denial of Service confirmed by multiple sources. MITRE technique T1498 mapped.

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
| Impact | T1498 |

**Reference:** [MITRE T1498](https://attack.mitre.org/techniques/T1498/)

---

## Playbook Reference

- [MITRE T1498](https://attack.mitre.org/techniques/T1498/)

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
