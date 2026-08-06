import { AssessmentData } from '../types';

export const SAMPLE_VENDOR_TEXTS = {
  cloudProvider: `Vendor Name: ApexCloud Solutions Inc.
Product: Enterprise Cloud Hosting & Infrastructure Services

Certifications & Audits:
- SOC 2 Type II Report (Audited 2025 by Deloitte) covering Security, Availability, Confidentiality.
- ISO 27001:2022 Certified.
- GDPR, CCPA, and HIPAA Compliance Statement verified.
- PCI-DSS Level 1 Service Provider.

Security Controls:
- AES-256 encryption at rest, TLS 1.3 in transit with forced HSTS.
- Multi-Factor Authentication (MFA) and SAML 2.0 / Okta Single Sign-On required for all administrative access.
- Role-Based Access Control (RBAC) with quarterly access review logs.
- Continuous automated vulnerability scanning and annual third-party penetration testing (latest by Bishop Fox in Nov 2025).
- 24/7 Managed SOC & Incident Response team with SLA < 15 minute MTTR for P1 incidents.

Financial & Operational Information:
- Annual Recurring Revenue: $140M+, Series D funded ($85M raised in 2024), profitable for 4 consecutive quarters.
- 99.99% SLA uptime commitment with multi-region failover and active-active data center redundancy.
- Disaster Recovery (DR) RPO < 5 minutes, RTO < 15 minutes. Tested semi-annually.

Legal & Compliance:
- Standard Data Processing Agreement (DPA) included with EU Standard Contractual Clauses (SCCs).
- Limitation of liability capped at 12 months of fees paid.
- Cyber Liability Insurance coverage: $10,000,000 policy through Chubb.

Missing / Pending Details:
- Fourth-party / subprocessor security assessment reports not attached.
- Business Continuity Plan (BCP) full audit execution logs for Q4 not provided.`,

  fintechApp: `Vendor Name: NovaPay Gateway Corp.
Services: B2B Payment API & Merchant Settlement Infrastructure

Certifications:
- PCI-DSS v4.0 Level 1 certified.
- SOC 1 Type II and SOC 2 Type II available under NDA.

Security Controls:
- Tokenized vault architecture with HSM key management.
- Web Application Firewall (Cloudflare Enterprise) with DDoS mitigation.
- Static and dynamic code analysis integrated into CI/CD pipeline.
- End-to-end encrypted payload routing.

Financial & Legal:
- Series B startup ($28M total funding), cash runway estimated at 18 months.
- Insurance coverage: $5M cyber insurance policy.
- Pending litigation: Minor contractual dispute in Delaware state court with former integration partner.

Missing Information:
- SOC 2 subservice organization oversight reports missing.
- Disaster recovery failover drill logs from past 12 months not included.`,
};

export const SAMPLE_ANALYSIS_RESULT: AssessmentData = {
  vendorInfo: {
    vendor_name: 'ApexCloud Solutions Inc.',
    vendorName: 'ApexCloud Solutions Inc.',
    certifications: [
      'SOC 2 Type II (Security, Availability, Confidentiality)',
      'ISO 27001:2022',
      'GDPR & CCPA Compliant',
      'HIPAA Compliant',
      'PCI-DSS Level 1 Service Provider',
    ],
    security_controls: [
      'AES-256 Encryption at Rest & TLS 1.3 in Transit',
      'Mandatory MFA & SAML 2.0 SSO Integration',
      'Continuous Automated Vulnerability Scanning',
      'Annual Penetration Testing (Bishop Fox - Nov 2025)',
      '24/7 Managed SOC & Incident Response (<15m MTTR)',
      'Role-Based Access Control (RBAC) with Quarterly Audits',
    ],
    securityControls: [
      'AES-256 Encryption at Rest & TLS 1.3 in Transit',
      'Mandatory MFA & SAML 2.0 SSO Integration',
      'Continuous Automated Vulnerability Scanning',
      'Annual Penetration Testing (Bishop Fox - Nov 2025)',
      '24/7 Managed SOC & Incident Response (<15m MTTR)',
      'Role-Based Access Control (RBAC) with Quarterly Audits',
    ],
    compliance: [
      'ISO 27001 Certification active through 2027',
      'SOC 2 Type II audit conducted by Deloitte',
      'EU Standard Contractual Clauses (SCCs) in place',
      'PCI-DSS v4.0 Attestation of Compliance (AoC)',
    ],
    financial_information:
      'Annual Recurring Revenue > $140M. Series D funded ($85M in 2024). Profitable for 4 consecutive quarters. Low financial insolvency risk.',
    financialInformation:
      'Annual Recurring Revenue > $140M. Series D funded ($85M in 2024). Profitable for 4 consecutive quarters. Low financial insolvency risk.',
    operational_information:
      '99.99% Uptime SLA commitment. Multi-region active-active failover architecture. RPO < 5 minutes, RTO < 15 minutes with semi-annual DR testing.',
    operationalInformation:
      '99.99% Uptime SLA commitment. Multi-region active-active failover architecture. RPO < 5 minutes, RTO < 15 minutes with semi-annual DR testing.',
    legal_information:
      'Standard DPA provided. Liability cap set to 12 months of contract fees paid. Cyber liability insurance policy active at $10,000,000 coverage with Chubb.',
    legalInformation:
      'Standard DPA provided. Liability cap set to 12 months of contract fees paid. Cyber liability insurance policy active at $10,000,000 coverage with Chubb.',
    missing_information: [
      'Fourth-party / Sub-processor security assessment reports',
      'Q4 Business Continuity Plan (BCP) full audit execution logs',
      'Detailed SOC 2 carve-out subservice vendor management evidence',
    ],
    missingInformation: [
      'Fourth-party / Sub-processor security assessment reports',
      'Q4 Business Continuity Plan (BCP) full audit execution logs',
      'Detailed SOC 2 carve-out subservice vendor management evidence',
    ],
  },
  riskAssessment: {
    overallRiskScore: 18,
    overallRiskLevel: 'Low',
    categories: [
      {
        category: 'Security Risk',
        riskLevel: 'Low',
        score: 12,
        reason:
          'Strong perimeter, transit, and data-at-rest encryption paired with independent annual penetration testing and a 24/7 dedicated SOC team.',
        evidence:
          'Deloitte SOC 2 Type II report confirms controls; Bishop Fox pen-test completed Nov 2025 with zero unmitigated critical vulnerabilities.',
      },
      {
        category: 'Compliance Risk',
        riskLevel: 'Low',
        score: 15,
        reason:
          'Comprehensive compliance coverage including ISO 27001, SOC 2 Type II, GDPR, HIPAA, and PCI-DSS Level 1.',
        evidence:
          'Valid ISO 27001 certificate and Deloitte auditor attestation provided in security pack.',
      },
      {
        category: 'Financial Risk',
        riskLevel: 'Low',
        score: 20,
        reason:
          'Solid financial standing with profitability over the past four quarters and strong backing from top-tier institutional investors.',
        evidence:
          '$140M+ ARR with 4 quarters profitability and $85M Series D capital injection.',
      },
      {
        category: 'Operational Risk',
        riskLevel: 'Medium',
        score: 28,
        reason:
          'High operational reliability, but missing full Q4 BCP audit execution evidence and subprocessor governance logs.',
        evidence:
          '99.99% uptime SLA and 5-min RPO documented, but Q4 BCP test execution proof was not submitted in initial packet.',
      },
      {
        category: 'Legal Risk',
        riskLevel: 'Low',
        score: 16,
        reason:
          'Standard DPA with EU SCCs in place. Comprehensive $10M cyber liability insurance policy mitigates potential financial damages.',
        evidence:
          'Chubb Cyber Policy active certificate (#CYB-88391-2025) and standard 12-month fee liability cap.',
      },
    ],
  },
  recommendations: {
    executiveSummary:
      'ApexCloud Solutions presents a Low overall third-party risk profile. Their technical security infrastructure and compliance posture are robust, backed by independent tier-1 audits. Minor operational follow-ups regarding sub-processor oversight are recommended prior to final contract execution.',
    positiveFindings: [
      'Comprehensive SOC 2 Type II audit report issued by Deloitte with zero noted exceptions.',
      'Robust encryption standards (AES-256 & TLS 1.3) and required MFA/SSO enforcement.',
      'Active $10,000,000 Chubb cyber insurance policy in good standing.',
      'Sustained operational profitability and strong revenue growth ($140M+ ARR).',
    ],
    priorityActions: [
      'Request Q4 Business Continuity Plan (BCP) drill logs and failover test output from the vendor.',
      'Obtain sub-processor / fourth-party security oversight policy and audit reports.',
      'Confirm security incident notification timeline SLA (target: <= 24 hours for security incidents).',
    ],
    recommendations: [
      'Approve for tier-1 data processing subject to standard sub-processor clause addition.',
      'Schedule annual vendor risk review aligned with their 2026 SOC 2 audit release cycle.',
      'Incorporate SLA uptime penalty credit clauses into the final Master Services Agreement (MSA).',
    ],
    nextSteps: [
      'Send missing information request to ApexCloud Vendor Relations contact.',
      'Review sub-processor notification rights with Legal team.',
      'Finalize Risk Assessment sign-off with CISO office.',
    ],
  },
};
