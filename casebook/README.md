# VigilShield Casebook

### 50 Real SOC Alert Triage Cases

A comprehensive collection of security alert investigations, triage decisions, and incident response actions — demonstrating production-grade SOC Analyst workflow using the VigilShield SIEM platform.

---

## Overview

This casebook documents **50 real security alerts** triaged using the **VigilShield SIEM platform**. Each case study demonstrates industry-standard SOC analyst workflow.

**What Each Case Includes:**
- Alert investigation (Multi-step analysis)
- IOC enrichment (VirusTotal + AbuseIPDB)
- Triage decisions (TP/FP with rationale)
- MITRE ATT&CK mapping
- Response actions
- Evidence collection
- Lessons learned

**Skills Demonstrated:**
- Alert Triage (50+ cases)
- Threat Intelligence (IOC analysis)
- Incident Response
- Documentation
- SIEM Operations
- Correlation Analysis

---

## Case Statistics

| Category | Cases | Critical | High | Medium | Low |
|---|---|---|---|---|---|
| Authentication | 10 | 3 | 5 | 2 | 0 |
| Malware | 10 | 3 | 6 | 1 | 0 |
| Credential Access | 10 | 5 | 4 | 1 | 0 |
| Lateral Movement | 10 | 3 | 7 | 0 | 0 |
| Impact | 10 | 8 | 2 | 0 | 0 |
| **TOTAL** | **50** | **22** | **24** | **4** | **0** |

---

## Case Index

### Authentication (001-010)

| # | Title | Severity | MITRE |
|---|---|---|---|
| [001](./001-ssh-brute-force/) | SSH Brute Force Attack | HIGH | T1110 |
| [002](./002-rdp-brute-force/) | RDP Brute Force Attack | HIGH | T1110 |
| [003](./003-failed-login-spike/) | Failed Login Spike | MEDIUM | T1110.001 |
| [004](./004-password-spraying/) | Password Spraying | HIGH | T1110.003 |
| [005](./005-credential-stuffing/) | Credential Stuffing | HIGH | T1110.004 |
| [006](./006-default-credentials/) | Default Credentials | MEDIUM | T1078.001 |
| [007](./007-ssh-key-attack/) | SSH Key-Based Attack | HIGH | T1098.004 |
| [008](./008-kerberos-attack/) | Kerberoasting | CRITICAL | T1558.003 |
| [009](./009-ntlm-relay/) | NTLM Relay | CRITICAL | T1557.001 |
| [010](./010-mfa-bypass/) | MFA Bypass | CRITICAL | T1556.006 |

### Malware (011-020)

| # | Title | Severity | MITRE |
|---|---|---|---|
| [011](./011-powershell-encoded/) | PowerShell Encoded Command | CRITICAL | T1059.001 |
| [012](./012-macro-execution/) | Malicious Macro | HIGH | T1204.002 |
| [013](./013-script-dropper/) | Script Dropper | HIGH | T1059 |
| [014](./014-base64-payload/) | Base64 Payload | HIGH | T1027 |
| [015](./015-suspicious-dll/) | Suspicious DLL | MEDIUM | T1574 |
| [016](./016-process-injection/) | Process Injection | CRITICAL | T1055 |
| [017](./017-fileless-malware/) | Fileless Malware | CRITICAL | T1027.004 |
| [018](./018-mshta-abuse/) | MSHTA Abuse | HIGH | T1218.005 |
| [019](./019-regsvr32-abuse/) | Regsvr32 Abuse | HIGH | T1218.010 |
| [020](./020-rundll32-abuse/) | Rundll32 Abuse | HIGH | T1218.011 |

### Credential Access (021-030)

| # | Title | Severity | MITRE |
|---|---|---|---|
| [021](./021-lsass-access/) | LSASS Memory Access | CRITICAL | T1003.001 |
| [022](./022-mimikatz-detected/) | Mimikatz Execution | CRITICAL | T1003 |
| [023](./023-sam-dump/) | SAM Database Access | HIGH | T1003.002 |
| [024](./024-ntds-dump/) | NTDS.dit Extraction | CRITICAL | T1003.003 |
| [025](./025-dcsync/) | DCSync Attack | CRITICAL | T1003.006 |
| [026](./026-credential-manager/) | Credential Manager | HIGH | T1555 |
| [027](./027-browser-creds/) | Browser Credential Theft | HIGH | T1555.003 |
| [028](./028-keylogger-detected/) | Keylogger | HIGH | T1056.001 |
| [029](./029-cached-creds/) | Cached Credentials | MEDIUM | T1003.005 |
| [030](./030-password-filter-abuse/) | Password Filter Abuse | CRITICAL | T1556.002 |

### Lateral Movement (031-040)

| # | Title | Severity | MITRE |
|---|---|---|---|
| [031](./031-smb-lateral/) | SMB Lateral Movement | HIGH | T1021.002 |
| [032](./032-psexec-execution/) | PsExec Execution | HIGH | T1021.002 |
| [033](./033-wmi-lateral/) | WMI Lateral Movement | HIGH | T1047 |
| [034](./034-rdp-lateral/) | RDP Lateral Movement | HIGH | T1021.001 |
| [035](./035-ssh-lateral/) | SSH Lateral Movement | MEDIUM | T1021.004 |
| [036](./036-smb-admin-share/) | SMB Admin Share Access | HIGH | T1021.002 |
| [037](./037-remote-service/) | Remote Service Creation | HIGH | T1021.002 |
| [038](./038-winrm-lateral/) | WinRM Lateral Movement | HIGH | T1021.006 |
| [039](./039-pass-the-hash/) | Pass-the-Hash | CRITICAL | T1550.002 |
| [040](./040-pass-the-ticket/) | Pass-the-Ticket | CRITICAL | T1550.003 |

### Impact (041-050)

| # | Title | Severity | MITRE |
|---|---|---|---|
| [041](./041-ransomware/) | Ransomware Encryption | CRITICAL | T1486 |
| [042](./042-shadow-copy-delete/) | Shadow Copy Deletion | CRITICAL | T1490 |
| [043](./043-data-exfiltration/) | Data Exfiltration | CRITICAL | T1041 |
| [044](./044-dns-tunneling/) | DNS Tunneling | CRITICAL | T1071.004 |
| [045](./045-disk-wipe/) | Disk Wipe | CRITICAL | T1561 |
| [046](./046-defacement/) | Website Defacement | HIGH | T1491 |
| [047](./047-dos-attack/) | DoS Attack | HIGH | T1498 |
| [048](./048-resource-hijack/) | Resource Hijacking | HIGH | T1496 |
| [049](./049-data-destruction/) | Data Destruction | CRITICAL | T1485 |
| [050](./050-apt-chain/) | Full APT Attack Chain | CRITICAL | T1110 |

---

## Methodology

Each case follows a standardized SOC triage workflow:

1. Alert Detection & Ingestion
2. Alert Verification
3. Source Analysis
4. IOC Enrichment
5. Impact Assessment
6. Triage Decision (TP/FP)
7. Response Actions
8. Documentation

---

## Tools Used

- VigilShield SIEM (Alert triage platform)
- VirusTotal API (File/IP enrichment)
- AbuseIPDB API (IP reputation)
- MITRE ATT&CK (Threat framework)

---

## Metrics

| Metric | Value |
|---|---|
| Total Cases | 50 |
| True Positives | 45 |
| False Positives | 3 |
| Benign | 2 |
| Avg. MTTR | 15 minutes |
| Escalation Rate | 20% |

---

## References

- [MITRE ATT&CK Framework](https://attack.mitre.org/)
- [NIST Incident Response Guide](https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-61r2.pdf)
- [VigilShield SIEM Platform](../README.md)

---

**Built by:** Dharun S | SOC L1 Analyst
**Platform:** VigilShield SIEM
**Date:** 2026-10-11