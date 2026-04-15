# System Design Analyzer

A modern, AI-powered agentic kit that analyzes system design specifications and provides comprehensive insights to help engineers and candidates prepare for system design interviews.

---

## What This Kit Does

System Design Analyzer provides **real-time AI-powered analysis** of system design proposals. It identifies architectural issues by category and severity, suggests improvements with priority rankings, and delivers overall architecture scores—perfect for interview preparation and architecture reviews.

## Providers & Prerequisites

**External Providers:**
- **Lamatic AI** - Orchestration and agentic reasoning
- **LLM Integration** - Architecture analysis using your configured LLM

**Development Requirements:**
- Node.js 18+ and npm 9+
- Lamatic account with API credentials
- Lamatic project with configured `check-your-saas` flow

## How to Run Locally

```bash
# 1. Navigate to kit
cd kits/agentic/system-design-analyzer

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env.local
# Edit with your Lamatic credentials

# 4. Start dev server
npm run dev
# Opens at http://localhost:3000
```

## Live Preview

https://system-designer-mocha.vercel.app/

## Lamatic Flow

- **Flow ID:** `check-your-saas` (`2392ad97-51e9-4954-8d38-bc668e644818`)
- **Type:** Agentic Reasoning
- **Input:** `system_design` (string) - System design specification
- **Output:** `issues`, `recommendations`, `summary` - Structured analysis results

---

## 🎯 Problem Statement

System design interviews are challenging, and candidates often struggle to get feedback on their architecture proposals in real-time. This kit provides instant, AI-powered analysis to identify issues, suggest improvements, and help refine designs before interviews.

## ✨ Features

- 🤖 **AI-Powered Analysis** - LLM-driven reasoning to analyze architecture decisions
- 🏗️ **Issue Identification** - Detects architectural flaws categorized by severity (critical/high/medium/low)
- 💡 **Smart Recommendations** - Suggests improvements with impact assessment
- ⚡ **Real-time Feedback** - Instant analysis without long wait times
- 📊 **Scoring System** - Overall architecture scores and strength/weakness identification
- 🎨 **Modern UI** - Clean, intuitive interface built with Next.js and Tailwind CSS
- 📋 **Example Designs** - Quick-start examples to explore the tool
- 💾 **Copy Results** - Easily copy analysis results to clipboard

## 🛠️ Tech Stack

- **Framework**: Next.js 15.5.14 (security-patched)
- **Language**: TypeScript 5.4.5
- **Frontend**: React 18.3.1
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui (Radix primitives)
- **API Integration**: Lamatic SDK (`lamatic` ^0.3.2)
- **Form Handling**: React Hook Form + Zod validation
- **Icons**: Lucide React
- **HTTP Client**: axios 1.14.0

## 📋 Prerequisites

- Node.js 18+ and npm 9+
- A [Lamatic.ai](https://studio.lamatic.ai) account
- Lamatic API Key, Project ID, and API Endpoint
- A Lamatic flow configured for system design analysis

## 🚀 Installation & Setup

### 1. Clone or Navigate to the Kit

```bash
cd kits/agentic/system-design-analyzer
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

Copy the example environment file:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your Lamatic credentials:

```env
LAMATIC_PROJECT_ENDPOINT="https://your-organization.lamatic.dev/graphql"
LAMATIC_FLOW_ID="your-flow-id-here"
LAMATIC_PROJECT_ID="your-project-id-here"
LAMATIC_PROJECT_API_KEY="lt-your-api-key-here"
NEXT_PUBLIC_APP_NAME="System Design Analyzer"
```

**Find your credentials:**
1. Go to [studio.lamatic.ai](https://studio.lamatic.ai)
2. Navigate to your project settings
3. Copy the Endpoint, Project ID, and API Key
4. Use the flow ID of your system design analysis flow

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Build for Production

```bash
npm run build
npm run start
```

## ⚙️ Configuration

### Environment Variables

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `LAMATIC_PROJECT_ENDPOINT` | Lamatic GraphQL endpoint | `https://org.lamatic.dev/graphql` | ✅ |
| `LAMATIC_FLOW_ID` | Flow ID for analysis | `2392ad97-51e9-4954-8d38-bc668e644818` | ✅ |
| `LAMATIC_PROJECT_ID` | Lamatic Project ID | `92d387df-59be-4563-acec-02288b4d8d95` | ✅ |
| `LAMATIC_PROJECT_API_KEY` | Lamatic API Key | `lt-179eec6bd2220b84bcaac6a2a0ad76d4` | ✅ |
| `NEXT_PUBLIC_APP_NAME` | App name for branding | `System Design Analyzer` | ✅ |

## 📊 Flow Architecture

### System Design Analyzer Flow

- **Type**: Agentic Reasoning Flow
- **Mode**: Synchronous
- **Input Schema**:
  - `system_design` (string, required) - The system design specification (min 10 characters)
- **Output Schema**:
  - `issues` (array) - Architectural issues with severity levels
  - `recommendations` (array) - Improvement suggestions with priority
  - `summary` (object) - Overall score, strengths, weaknesses, and next steps

### LLM Node Configuration

The flow uses an agentic reasoning node that:
1. Analyzes the input design specification
2. Identifies architectural issues
3. Provides structured recommendations
4. Generates an overall assessment

## 💻 Usage Guide

### Basic Workflow

1. **Navigate to Home** - Open the app at `http://localhost:3000`
2. **Enter Design** - Paste your system design description (minimum 10 characters)
3. **Click Analyze** - Submit for AI-powered analysis
4. **Review Results** - Examine identified issues and recommendations
5. **Copy Output** - Save results to clipboard for use in interviews

### Input Requirements

- Minimum 10 characters
- Can include:
  - System architecture diagrams (textual description)
  - Technology choices and justifications
  - Scalability considerations
  - Data flow descriptions
  - Deployment strategies

### Understanding Results

**Issues Section:**
- Categorized by area (scalability, reliability, security, etc.)
- Severity levels: Critical → High → Medium → Low
- Each issue includes description and recommendation

**Recommendations Section:**
- Priority-ranked improvements (High → Medium → Low)
- Impact assessment for each suggestion
- Actionable next steps

**Summary Section:**
- Overall architecture score (0-100)
- Key strengths identified
- Areas for improvement
- Interview-focused next steps

## 🧪 Testing

### Local Testing

```bash
# Start dev server
npm run dev

# Then visit http://localhost:3000 in your browser
# Enter a system design description and click "Analyze"
# Results will appear below the input form
```

### Production Build Validation

```bash
npm run build
# Should complete with: ✓ Compiled successfully
```

## 🚢 Deployment

### Vercel (Recommended)

1. Push to GitHub (already done at `Trishix/AgentKit`)
2. Connect to Vercel at [vercel.com/import](https://vercel.com/import)
3. Select `GitHub` as source
4. Choose repository: `Trishix/AgentKit`
5. Set Root Directory: `./kits/agentic/system-design-analyzer`
6. Add environment variables
7. Click Deploy

### Environment Setup for Production

Set these in Vercel project settings:
- `LAMATIC_PROJECT_ENDPOINT`
- `LAMATIC_FLOW_ID`
- `LAMATIC_PROJECT_ID`
- `LAMATIC_PROJECT_API_KEY`

## 📈 Performance

- **Build Size**: 28.1 kB (main) + 102 kB (shared chunks)
- **First Load JS**: ~130 kB
- **Pages**: App Router page prerendered as static content
- **TypeScript**: Full type safety with zero errors
- **Security**: 0 vulnerabilities (npm audit clean)

## 🔒 Security

- ✅ Next.js 15.5.14 (all critical CVEs patched)
- ✅ axios 1.14.0 (SSRF/DoS vulnerabilities fixed)
- ✅ No hardcoded secrets in source code
- ✅ All environment variables use placeholders in `.env.example`
- ✅ Secure error handling with user-friendly messages

## 🐛 Error Handling

### Common Errors & Solutions

**"LAMATIC_FLOW_ID is not set"**
- Ensure `.env.local` exists with all required variables
- Verify you've copied the correct flow ID from Lamatic Studio

**Rate Limit (429) Error**
- The API has temporarily exceeded rate limits
- A friendly modal with retry instructions appears
- Wait a moment and try again

**Flow Execution Failed**
- Check that the flow is deployed in Lamatic Studio
- Verify all flow nodes are properly configured
- Ensure the flow outputs the expected result structure

**TypeScript Errors**
- Run `npm run build` to ensure compilation
- Check that environment variables are set correctly

## 📚 Related Resources

- [Lamatic Flows Documentation](https://lamatic.ai/docs)
- [Next.js 15 Docs](https://nextjs.org/docs)
- [Tailwind CSS v4 Guide](https://tailwindcss.com/docs)
- [React Hook Form Documentation](https://react-hook-form.com/)
- [shadcn/ui Components](https://ui.shadcn.com/)

## 🎯 Use Cases

- **Interview Preparation**: Get feedback on designs before interviews
- **Architecture Review**: Quick validation of system designs
- **Learning Tool**: Understand architectural considerations
- **Team Collaboration**: Share analysis results with team members
- **Design Documentation**: Export analysis for documentation
- Create a URL shortener service like bit.ly
- Design a video streaming platform like YouTube

## Building for Production

```bash
npm run build
npm run start
```

## API Integration

The application uses the **Lamatic SDK** (`lamatic` npm package) to execute flows. The integration is handled through server actions in `actions/orchestrate.ts`.

### Server Action

The `analyzeSystemDesign()` server action in `actions/orchestrate.ts` handles the API communication:

```typescript
import { lamaticClient } from '@/lib/lamatic-client';

const { LAMATIC_FLOW_ID } = process.env;

export async function analyzeSystemDesign(
  systemDesign: string
): Promise<ServerActionResponse<SystemDesignAnalysis>> {
  const response = await lamaticClient.executeFlow(LAMATIC_FLOW_ID, {
    system_design: systemDesign,
  });
  
  return response;
}
```

## Project Structure

```
system-design-analyzer/
├── app/
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Main page
│   └── globals.css         # Global styles
├── actions/
│   └── orchestrate.ts      # Server action for API calls
├── components/
│   └── ui/                 # Reusable UI components
│       ├── button.tsx
│       ├── card.tsx
│       ├── input.tsx
│       └── textarea.tsx
├── flows/
│   └── system-design-analyzer/  # Flow configuration
│       ├── config.json
│       ├── inputs.json
│       ├── meta.json
│       └── README.md
├── public/                 # Static assets
├── styles/                 # Additional styles
├── .env.example            # Example environment variables
├── .env.local              # Local environment variables
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.mjs
└── README.md
```

## Design Theme

The application follows Lamatic's modern design system:

- **Colors**: White (#ffffff) background, Black (#000000) text, Red (#dc2626) accent
- **Typography**: Inter font family with variable weights
- **Components**: Clean, minimalist design with focus on usability
- **Responsiveness**: Fully responsive mobile and tablet support

## Error Handling

The application handles various error scenarios:

- Input validation errors (minimum 10 characters)
- Network errors during API calls
- Server errors from Lamatic flows
- Missing API credentials in environment variables

All errors are displayed to the user with clear, actionable messages in the error section of the form.

## License

This project is part of the Lamatic AgentKit and follows the same license.

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import the repository in Vercel
3. Set the root directory to `kits/agentic/system-design-analyzer`
4. Add environment variables in Vercel Dashboard:
   - `LAMATIC_PROJECT_ENDPOINT`
   - `LAMATIC_FLOW_ID`
   - `LAMATIC_PROJECT_ID`
   - `LAMATIC_PROJECT_API_KEY`
5. Deploy

## Troubleshooting

**Issue**: "LAMATIC_FLOW_ID is not set"
- **Solution**: Check `.env.local` has all required variables

**Issue**: Flow returns object instead of string
- **Solution**: Ensure the flow response is properly serialized in `actions/orchestrate.ts`

**Issue**: Port 3000 already in use
- **Solution**: Use `PORT=3001 npm run dev` to run on a different port

## Support

For issues or questions:
1. Check the [Lamatic documentation](https://lamatic.ai/docs)
2. Review the [AgentKit README](https://github.com/Lamatic/AgentKit)
3. Open an issue in the [GitHub repository](https://github.com/Lamatic/AgentKit/issues)

## Contributing

Contributions are welcome! Please follow the [AgentKit contribution guidelines](https://github.com/Lamatic/AgentKit/blob/main/CONTRIBUTING.md).
