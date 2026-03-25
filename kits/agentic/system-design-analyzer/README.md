# System Design Analyzer

A modern, AI-powered web application that analyzes system design specifications and provides comprehensive insights using Lamatic flows.

## Features

- 🤖 **AI-Powered Analysis** - Get intelligent insights on your system architecture
- ⚡ **Real-time Processing** - Get instant feedback on your design specifications
- 🎨 **Modern UI** - Clean, responsive interface built with Next.js and Tailwind CSS
- 📋 **Example Designs** - Quick-start examples to explore the tool
- 📋 **Copy Results** - Easily copy analysis results to clipboard

## Tech Stack

- **Frontend**: Next.js 15, React 18, TypeScript
- **Styling**: Tailwind CSS v4, custom components
- **API**: Lamatic SDK (`lamatic` npm package)
- **Form Handling**: React Hook Form + Zod validation
- **Icons**: Lucide React

## Prerequisites

- Node.js 18+ and npm
- A Lamatic API Key
- Lamatic Project ID and API URL

## Installation

### 1. Clone or Navigate to the Kit

```bash
cd kits/agentic/system-design-analyzer
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

Copy the example environment file and fill in your Lamatic credentials:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your Lamatic credentials:

```env
LAMATIC_API_URL = "YOUR_LAMATIC_API_URL"
LAMATIC_PROJECT_ID = "YOUR_PROJECT_ID"
LAMATIC_API_KEY = "YOUR_API_KEY"
SYSTEM_DESIGN_ANALYZER_FLOW_ID = "YOUR_FLOW_ID"
NEXT_PUBLIC_APP_NAME = "System Design Analyzer"
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `LAMATIC_API_URL` | Lamatic GraphQL endpoint | ✅ |
| `LAMATIC_PROJECT_ID` | Your Lamatic Project ID | ✅ |
| `LAMATIC_API_KEY` | Your Lamatic API Key | ✅ |
| `SYSTEM_DESIGN_ANALYZER_FLOW_ID` | Flow ID for system design analysis | ✅ |
| `NEXT_PUBLIC_APP_NAME` | Application name | ✅ |

## Flows

### System Design Analyzer Flow

- **Flow ID**: `2392ad97-51e9-4954-8d38-bc668e644818`
- **Type**: Synchronous
- **Input**: `system_design` (string) - The system design specification
- **Output**: `status` (string), `result` (string) - Analysis status and results

## Usage

1. **Enter Design Specification**: Paste or type your system design requirements in the text area
2. **Click Analyze**: Submit your design for AI analysis
3. **View Results**: Get comprehensive insights and recommendations
4. **Copy Results**: Use the copy button to save results to clipboard

### Example Designs

The app comes with example designs that you can quickly load:

- Design a scalable distributed cache system like Redis
- Build a real-time notification system for a mobile app
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
import { Lamatic } from 'lamatic';

const lamaticClient = new Lamatic({
  endpoint: process.env.LAMATIC_API_URL,
  projectId: process.env.LAMATIC_PROJECT_ID,
  apiKey: process.env.LAMATIC_API_KEY,
});

await lamaticClient.executeFlow(SYSTEM_DESIGN_ANALYZER_FLOW_ID, {
  system_design: userInput,
});
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
   - `LAMATIC_API_URL`
   - `LAMATIC_PROJECT_ID`
   - `LAMATIC_API_KEY`
   - `SYSTEM_DESIGN_ANALYZER_FLOW_ID`
5. Deploy

## Troubleshooting

**Issue**: "LAMATIC_API_KEY is not set"
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
