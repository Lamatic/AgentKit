# Security Threat Intelligence Agent

A powerful security analytics agent that performs comprehensive IP address threat analysis by querying multiple threat intelligence sources in parallel and synthesizing results using LLM-powered analysis.

## Overview

The Security Threat Intelligence Agent provides real-time threat assessment for IP addresses by aggregating data from three industry-leading threat intelligence platforms:

- **VirusTotal** - Malware and URL scanning
- **AbuseIPDB** - IP abuse and spam reporting
- **Shodan** - Internet-connected device discovery

The agent orchestrates parallel API calls to all three services, then leverages an LLM to synthesize the raw data into a structured, actionable threat report with risk scoring and recommended actions.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           Next.js Frontend (UI Layer)                           │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │  Threat Intelligence Dashboard                                          │    │
│  │  - IP Address Input                                                     │    │
│  │  - Real-time Scan Status                                                │    │
│  │  - Color-coded Risk Visualization                                       │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      │ POST /graphql
                                      │ Query: executeWorkflow
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         Lamatic GraphQL Gateway                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │  Workflow Orchestrator                                                  │    │
│  │  - Authentication & Authorization                                       │    │
│  │  - Request Validation                                                   │    │
│  │  - Workflow Execution Engine                                            │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      │ Fan-out (Parallel Execution)
                                      │
              ┌───────────────────────┼───────────────────────┐
              │                       │                       │
              ▼                       ▼                       ▼
┌─────────────────────────┐ ┌─────────────────────┐ ┌─────────────────────────┐
│     VirusTotal API      │ │    AbuseIPDB API    │ │      Shodan API         │
│  - Malware detections   │ │  - Abuse reports    │ │  - Open ports           │
│  - URL relationships    │ │  - Confidence score │ │  - Service banners      │
│  - Community votes      │ │  - Category tags    │ │  - Vulnerability data   │
└─────────────────────────┘ └─────────────────────┘ └─────────────────────────┘
              │                       │                       │
              └───────────────────────┼───────────────────────┘
                                      │
                                      │ Fan-in (Aggregation)
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         LLM Synthesis Layer                                     │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │  Threat Analysis Prompt                                                 │    │
│  │  - Aggregate all scan results                                           │    │
│  │  - Calculate composite risk score (0-100)                               │    │
│  │  - Determine risk level (CRITICAL/HIGH/MEDIUM/LOW)                      │    │
│  │  - Generate executive summary                                           │    │
│  │  - Provide recommended actions                                          │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      │ JSON Response
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           Response Schema                                       │
│  {                                                                              │
│    "indicator": "8.8.8.8",                                                      │
│    "risk_score": 0,                                                             │
│    "risk_level": "LOW",                                                         │
│    "summary": "...",                                                            │
│    "recommended_action": "SAFE"                                                 │
│  }                                                                              │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## Prerequisites

Before deploying this agent, ensure you have the following:

- **Node.js** v18.17 or later
- **npm** or **yarn** package manager
- **Lamatic Account** with API access
- **API Keys** for the following services (configured in your Lamatic workflow):
  - VirusTotal API key
  - AbuseIPDB API key
  - Shodan API key

## Setup & Installation

### 1. Clone the AgentKit Repository

```bash
git clone https://github.com/Lamatic/AgentKit.git
cd AgentKit/kits/agentic/security-threat-intel
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Copy the example environment file and add your Lamatic API key:

```bash
cp .env.example .env.local
```

Edit `.env.local` and add your credentials:

```env
NEXT_PUBLIC_LAMATIC_API_KEY=lt-your-api-key-here
```

### 4. Import the Workflow Configuration

1. Log in to your [Lamatic Dashboard](https://app.lamatic.ai)
2. Navigate to **Workflows** → **Import**
3. Upload the `lamatic-config.json` file included in this kit
4. Note the generated **Workflow ID** after import

### 5. Update Workflow ID

Open `app/page.tsx` and update the workflow ID:

```typescript
variables: {
  workflowId: "your-workflow-id-here", // Replace with your imported workflow ID
  payload: { sampleInput: ipAddress },
}
```

### 6. Run the Development Server

```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000)

### 7. Build for Production

```bash
npm run build
npm start
```

## Usage

1. Navigate to the Threat Intelligence Dashboard
2. Enter an IP address in the search field (e.g., `8.8.8.8`)
3. Click **Scan IP** to initiate the threat analysis
4. Review the generated threat report including:
   - **Risk Score** (0-100)
   - **Risk Level** (CRITICAL/HIGH/MEDIUM/LOW)
   - **Summary** of findings across all sources
   - **Recommended Action** based on threat assessment

## Project Structure

```
security-threat-intel/
├── app/
│   ├── page.tsx              # Main dashboard component
│   ├── layout.tsx            # Root layout
│   └── globals.css           # Global styles
├── public/                   # Static assets
├── .env.example              # Environment template
├── .env.local                # Local environment (gitignored)
├── lamatic-config.json       # Lamatic workflow definition
├── next.config.js            # Next.js configuration
├── package.json              # Dependencies
├── postcss.config.js         # PostCSS configuration
├── tailwind.config.ts        # Tailwind CSS configuration
├── tsconfig.json             # TypeScript configuration
└── README.md                 # This file
```

## API Response Format

The agent returns a standardized JSON threat report:

```json
{
  "indicator": "8.8.8.8",
  "risk_score": 0,
  "risk_level": "LOW",
  "summary": "The IP address 8.8.8.8 is Google's public DNS resolver...",
  "recommended_action": "SAFE"
}
```

### Risk Level Thresholds

| Risk Level | Score Range | Color Code |
|------------|-------------|------------|
| CRITICAL   | 75-100      | Red        |
| HIGH       | 50-74       | Orange     |
| MEDIUM     | 25-49       | Yellow     |
| LOW        | 0-24        | Green      |

## Customization

### Adding New Threat Sources

To integrate additional threat intelligence APIs:

1. Add a new node in `lamatic-config.json`
2. Configure the API endpoint and authentication
3. Update the LLM synthesis prompt to include the new data source
4. Re-import the workflow to Lamatic

### Modifying Risk Scoring

Adjust the risk scoring logic by editing the LLM synthesis prompt in `lamatic-config.json`. The prompt defines how raw API responses are weighted and combined.

## Troubleshooting

### "No threat report returned from API"

- Verify your Lamatic API key is correct in `.env.local`
- Ensure the workflow ID matches your imported workflow
- Check that all external API keys are configured in the Lamatic dashboard

### GraphQL Errors

- Confirm the endpoint URL is correct
- Verify the `x-project-id` header matches your Lamatic project

## Contributing

Contributions are welcome! Please read the [Contributing Guidelines](../../../CONTRIBUTING.md) before submitting a pull request.

## License

This kit is licensed under the MIT License. See the [LICENSE](../../../LICENSE) file for details.

## Support

For issues, questions, or feature requests, please open an issue in the main [AgentKit repository](https://github.com/Lamatic/AgentKit/issues).

---

**Built with ❤️ for the Lamatic Community**
