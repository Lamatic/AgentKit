<a href="https://studio.lamatic.ai/template/dependency-risk-analyzer" target="_blank" style="text-decoration:none;">
  <div align="right">
    <span style="display:inline-block;background:#e63946;color:#fff;border-radius:6px;padding:10px 22px;font-size:16px;font-weight:bold;letter-spacing:0.5px;text-align:center;transition:background 0.2s;box-shadow:0 2px 8px 0 #0001;">Deploy on Lamatic</span>
  </div>
</a>

# Dependency Risk Analyzer

## About This Flow

**Paste a `package.json` or `requirements.txt` → Get instant security analysis!**

This flow provides comprehensive dependency risk analysis for npm (Node.js) and Python projects. It automatically detects:
- 🏚️ **Abandoned packages** (last updated > 365 days)
- 🔓 **Known CVEs** (from OSV.dev vulnerability database)
- ⚖️ **License risks** (GPL, AGPL detection)
- 👤 **Bus factor** (single-maintainer packages)

**Why use this?**
- ✅ **Free** (unlike Snyk)
- ✅ **Comprehensive** (more than Dependabot's version-only checks)
- ✅ **Multi-ecosystem** (npm + Python support)
- ✅ **AI-powered** (generates human-readable markdown reports)

This flow uses **18 nodes** working together to analyze dependencies, check vulnerabilities, calculate risk scores, and generate professional security reports.

## Flow Architecture

### 11-Node Pipeline Design

1. **API Request (Trigger)** → Entry point accepting dependency file content
2. **Classifier Node** → Detects npm vs Python and routes accordingly
3. **Parser Code Nodes (2x)** → Extracts package names and versions
4. **Loop Node** → Iterates over each package
5. **Registry API Nodes (npm/PyPI)** → Fetches package metadata
6. **OSV.dev CVE API Nodes** → Checks vulnerability database
7. **Risk Scoring Code Nodes** → Calculates 0-100 risk scores
8. **Loop End Node** → Collects all risk analysis results
9. **Generate Text Nodes (LLM, 2x)** → Creates markdown security reports
10. **Merge Code Node** → Combines npm/Python branch outputs
11. **API Response Node** → Returns final report

### Risk Scoring System

Each package receives a risk score based on:

| Risk Signal | Detection Method | Points |
|------------|------------------|--------|
| 🏚️ Abandonment | Last updated > 365 days | +30 |
| 👤 Bus Factor | Only 1 maintainer | +20 |
| 🔓 CVEs | Known vulnerabilities | +15 per CVE |
| ⚖️ Risky License | GPL, AGPL detected | +20 |

**Risk Levels:**
- 🟢 **LOW (0-19):** Safe to use
- 🟡 **MEDIUM (20-39):** Monitor closely
- 🟠 **HIGH (40-69):** Review urgently
- 🔴 **CRITICAL (70-100):** Immediate action required

## Flow Components

This workflow includes the following node types:
- API Request
- Classifier
- Code
- Loop
- API
- Loop End
- Generate Text
- API Response

## Configuration Requirements

This flow requires configuration for **3 node(s)** with private inputs:
- LLM API keys for report generation
- OSV.dev API access (free, no key required)
- npm/PyPI registry access (public APIs)

All required configurations are documented in the `inputs.json` file.

## Example Usage

### Input (npm - package.json):
```json
{
  "dependencies": {
    "express": "^4.18.2",
    "lodash": "^4.17.11",
    "react": "^18.2.0"
  }
}
```

### Input (Python - requirements.txt):
```
flask==2.3.2
requests==2.31.0
django==4.2.0
```

### Output:
A professional markdown security report containing:
- Executive summary of risks found
- Per-package risk scores and levels
- CVE details with severity ratings
- Actionable recommendations
- Links to vulnerability databases

## Use Cases

- 🔒 **Security Audits** — Regular dependency risk assessments
- 📊 **CI/CD Integration** — Automated security checks in pipelines
- 🎯 **Compliance** — License risk detection for legal requirements
- 🛡️ **Maintenance Planning** — Identify abandoned packages before issues arise

## Files Included

- **config.json** - Complete flow structure with 18 nodes and connections
- **inputs.json** - LLM and API configurations
- **meta.json** - Flow metadata and information
- **README.md** - This documentation

## How to Use

1. **Import into Lamatic Studio**
   - Click the "Deploy on Lamatic" button above
   - Or manually import via Templates → Import

2. **Configure Providers**
   - Add your LLM API key (OpenAI, Anthropic, etc.)
   - No configuration needed for OSV.dev or package registries

3. **Test the Flow**
   - Paste a `package.json` or `requirements.txt` content
   - Hit "Test" to see the security report

4. **Deploy & Use**
   - Deploy the flow to get an API endpoint
   - Integrate into your CI/CD pipeline
   - Or use manually for security audits

## Tags

Security, DevOps, Automation, Analysis, npm, Python, CVE, Vulnerability Scanning

---
*Exported from Lamatic Flow Editor*
*Generated on 03/04/2026*
*Flow ID: dependency-risk-analyzer*
