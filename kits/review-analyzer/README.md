# Review Analyzer Kit

An AI-powered Chrome Extension that scrapes product reviews from e-commerce sites (like Amazon) and uses [Lamatic.ai](https://lamatic.ai) to synthesize customer consensus, extract key pros/cons, and calculate a Trust Score to identify fake or low-effort reviews.

## 🚀 Overview
Review Analyzer is built with Next.js and Tailwind CSS, communicating with a Lamatic AI flow backend. By loading the Chrome Extension, users can trigger review scraping with a single click. The scraped data is securely passed to a Next.js server, which runs the reasoning agent workflow on Lamatic AI to generate the summary dashboard.

## 🛠️ Folder Structure
```
kits/review-analyzer/
├── lamatic.config.ts         # Metadata definition
├── config.json               # Legacy config to pass CI validation
├── agent.md                  # Agent capability & setup document
├── README.md                 # This guide
├── constitutions/
│   └── default.md            # LLM behavior guide
├── flows/
│   └── review-analyzer.ts    # Flow config exported from Lamatic Studio
└── apps/                     # Next.js web application & Chrome Extension
    ├── package.json          # Next.js dependencies
    ├── app/                  # Next.js page router (iframe popup view)
    ├── lib/                  # Library files (lamatic client)
    ├── actions/              # Server Actions calling Lamatic flow
    └── extension/            # Chrome Extension (manifest, scripts, popup iframe)
```

---

## 🔑 Setup & Installation

### Step 1: Clone the Repo & Install Dependencies
First, clone your fork and install Next.js dependencies:
```bash
cd kits/review-analyzer/apps
npm install
```

### Step 2: Set up Environment Variables
Create a `.env.local` file inside the `apps` directory with the following keys:
```bash
# Lamatic Flow ID
REVIEW_ANALYZER_FLOW_ID="your-flow-id"

# Lamatic Credentials (Get from Settings in Lamatic Studio)
LAMATIC_API_URL="https://studio.lamatic.ai/api/your-project-url"
LAMATIC_PROJECT_ID="your-project-id"
LAMATIC_API_KEY="your-api-key"
```

### Step 3: Run the Next.js App
Start the Next.js server locally to act as the backend API bridge for the Chrome Extension:
```bash
npm run dev
```
The Next.js dashboard will be running at `http://localhost:3000`.

### Step 4: Install the Chrome Extension
1. Open Google Chrome and navigate to `chrome://extensions/`.
2. Enable **Developer mode** using the toggle switch in the top-right corner.
3. Click the **Load unpacked** button in the top-left corner.
4. Select the `kits/review-analyzer/apps/extension` folder from your local directory.
5. The extension is now active in your browser.

---

## 🧠 Lamatic Flow Workflow Setup

In the [Lamatic Cloud Studio](https://studio.lamatic.ai):
1. Create a new flow named `review-analyzer`.
2. **Define the Input**: Set the trigger to API (GraphQL). The input schema should take an array of strings (e.g. `reviews: [String]`).
3. **Add LLM Node**: Use Claude 3.5 Sonnet or GPT-4o. Set the system prompt to analyze the reviews, compile a consensus summary, isolate key pros & cons, and detect suspicious patterns (such as exact text duplication, excessively short phrasing, or repetitive reviews) to assign a **Trust Score (0 to 100)**.
4. **Define the Output**: Map the output to a GraphQL schema returning the following fields:
   - `summary`: string
   - `pros`: string[]
   - `cons`: string[]
   - `trustScore`: int
   - `trustLabel`: string
   - `analysisDetail`: string
5. **Deploy**: Deploy the flow to retrieve your Flow ID and Project details, and populate `.env.local`.

---

## 🤝 Contributing
Feel free to open issues or PRs! To submit your changes to the AgentKit repo, ensure your PR is labeled with `agentkit-challenge`.
