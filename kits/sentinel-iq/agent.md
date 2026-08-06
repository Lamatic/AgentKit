# SentinalIQ

SentinalIQ triages raw secuity alerts

Given an alert of (SIEM export, EDR alert, phishing report, log snippet), it returns severnity, confidence, MITRE ATT&CK mapping, a summary, and remediation steps

## Capabilities

- Extract IOCs (IPs, domain, hashes and usernames ) from raw alert text
- Classifies severnity with P1-P4 with a confidence score
- Maps the alert to MITRE ATT&CK tactics and techniques
- Generates a remediation checklist

## Non Goals

- Does not connect to a live SIEM or execute remediation actions
- Enrichment is illustrative, not a real threat-intel lookup
- Not a replacement for analyst judgment on ambiguous alerts