# Receipt Budget Tracker Kit

This is the **Receipt Budget Tracker** kit. It uses Vision AI to scan physical receipt images, extract itemized breakdowns (descriptions, prices, totals, vendor, date, category), and track monthly budget limits. It includes a beautiful, premium Next.js dashboard built with shadcn/ui primitives.

## Features
- **Smart Receipt Upload**: Drag-and-drop or click to upload receipt images (under 5MB).
- **Automated Extraction**: Uses Lamatic.ai orchestration and an Instructor LLM node to return structured JSON.
- **Optional Gemini OCR**: Built-in Gemini OCR pre-processing to extract text from images before running the flow, saving tokens and improving speed.
- **Budget Dashboard**: Visual indicators showing total spent, budget target limit ($500.00), and remaining budget.
- **Interactive Breakdown**: Click any receipt in history to inspect its itemized digital thermal receipt view.
- **Simulated Fallback**: Fully functional demo buttons to test the interface instantly if API keys are not yet configured.

---

## Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- A [Lamatic.ai](https://lamatic.ai/) account with a project and flow set up.
- (Optional) A [Google AI Studio](https://aistudio.google.com/) API Key for Gemini OCR.

---

## Required Environment Variables
Create a `.env` file inside `apps/` using the `.env.example` template:
```env
# Lamatic API Configuration
LAMATIC_API_KEY=your_lamatic_api_key_here
LAMATIC_API_URL=https://api.lamatic.ai
LAMATIC_PROJECT_ID=your_lamatic_project_id_here

# Flow ID for the Receipt Budget Tracker Flow
RECEIPT_TRACKER_FLOW_ID=your_receipt_tracker_flow_id_here

# Gemini API Key for OCR extraction (optional)
GEMINI_API_KEY=your_gemini_api_key_here

# Gated logging (optional, defaults to false)
DEBUG_RECEIPT=false
```

---

## Setup & Running Locally

1. **Install dependencies**:
   ```bash
   cd apps
   npm install
   ```

2. **Run in development mode**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

3. **Verify the flow**:
   You can also test the Lamatic endpoint trigger using the built-in test script:
   ```bash
   node test-lamatic.js
   ```

---

## Usage Examples

### 1. Running Simulated Demo Receipts (No API Keys needed)
Click any of the quick-action buttons on the header (☕ Starbucks, 🛒 Walmart, 🚗 Uber Ride, ⚡ City Power). The dashboard will simulate a vision analysis step and add the structured items to your history.

### 2. Scanning a Real Receipt Image
1. Drag and drop any image file of a receipt onto the dashed zone, or click to browse.
2. The UI will transition into an analyzing state.
3. If successful, the new itemized receipt appears at the top of your history list and displays in the thermal receipt panel on the right.
