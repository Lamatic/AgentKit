# DebugPilot AI

AI-powered debugging workflow for faster incident triage and root cause analysis.

---

## 🚀 Live Demo

**Production Deployment:**
[Live Demo](https://debugpilot-ai.vercel.app/)

**GitHub Repository:**
[GitHub Repository](https://github.com/Yashyr190/debugpilot-ai)
---

## 📌 Overview

DebugPilot AI is a lightweight AI-powered debugging assistant designed for developers working with modern full-stack applications.

Developers often lose significant time manually reading logs, tracing stack errors, and identifying the actual subsystem responsible for failures. DebugPilot AI transforms raw logs, runtime exceptions, deployment failures, and API errors into structured debugging reports with actionable engineering insights.

The goal of the project is not to replace developers, but to accelerate the first triage pass by converting noisy debugging data into a clean workflow-oriented report.

---

## ❗ Problem Statement

Debugging production and development issues usually starts with scattered context:

* Stack traces
* CI/CD failures
* Browser console errors
* Runtime exceptions
* API response failures
* Authentication issues
* Infrastructure logs

Most debugging workflows are repetitive and unstructured. Developers spend time:

* identifying the subsystem
* estimating severity
* finding root causes
* determining immediate next steps
* deciding what to check first

This slows engineering velocity and increases debugging fatigue.

---

## ✅ Solution

DebugPilot AI provides a structured debugging workflow that converts raw technical failures into practical engineering reports.

The application analyzes developer input and generates:

* Error categorization
* Severity classification
* Likely subsystem detection
* Root cause analysis
* Immediate next debugging step
* Suggested fixes
* Debugging checklists
* Prevention guidance
* Confidence scoring

Instead of returning long generic AI responses, the app focuses on concise, engineering-oriented outputs that resemble real incident triage workflows.

---

## 🧠 Core Features

### 🔍 AI-Powered Incident Triage

Transforms stack traces, logs, and deployment failures into structured debugging reports.

### ⚠️ Severity Detection

Classifies issues into:

* Low
* Medium
* High
* Critical

### 🏗️ Likely Subsystem Identification

Identifies the most relevant engineering layer involved in the issue.

Examples:

* Frontend API Layer
* React Rendering Layer
* Deployment Build Pipeline
* Backend Validation Layer
* Database Connection Layer

### 🛠️ Root Cause Analysis

Provides concise and actionable debugging explanations.

### 🚀 Immediate Next Step

Suggests the most practical first debugging action.

### 📋 Debugging Checklist

Generates operational debugging steps for developers.

### 🛡️ Prevention Guidance

Provides engineering practices to reduce recurring failures.

### 📊 Confidence Score

Estimates confidence in the generated debugging report.

### 🎨 Modern Developer-Focused UI

Built with a clean dark interface optimized for developer workflows.

---

## ⚙️ Workflow

```text
Input Error/Logs
        ↓
Issue Classification
        ↓
Severity Detection
        ↓
Subsystem Identification
        ↓
Root Cause Analysis
        ↓
Fix Suggestions
        ↓
Debugging Checklist
        ↓
Prevention Guidance
```

---

## 🧪 Example Supported Issues

DebugPilot AI can analyze:

* React rendering failures
* API response errors
* Authentication token failures
* Deployment/build pipeline failures
* Database connection timeouts
* Runtime exceptions
* TypeScript build errors
* Infrastructure-related logs

---

## 🖼️ Screenshots

### Landing Interface

<img width="1460" height="938" alt="Screenshot 2026-05-12 at 6 44 22 PM" src="https://github.com/user-attachments/assets/ee3064e8-cccf-4c86-a0a1-31e6b9e9ee13" />

### Structured Debugging Report

<img width="627" height="844" alt="Screenshot 2026-05-12 at 6 42 01 PM" src="https://github.com/user-attachments/assets/f27df661-4068-4d05-b192-fd7f8f033aee" />
<img width="602" height="511" alt="Screenshot 2026-05-12 at 6 43 03 PM" src="https://github.com/user-attachments/assets/03c3765a-748c-49f2-9300-dad122c4321c" />

### Deployment Failure Analysis

<img width="1470" height="956" alt="Screenshot 2026-05-12 at 6 45 46 PM" src="https://github.com/user-attachments/assets/c8d453f2-2130-4ba9-a63e-338264a0d0f4" />

---

## 🛠️ Tech Stack

### Frontend

* Next.js 14
* TypeScript
* Tailwind CSS

### UI/UX

* Glassmorphism-inspired interface
* Responsive layout
* Animated report transitions
* Loading shimmer states

### AI Workflow

* Structured debugging pipeline
* Heuristic fallback analyzer
* Confidence scoring system
* Workflow-oriented response generation

---

## 🧱 Architecture

The application uses a lightweight Next.js API route as the analysis boundary.

If an AI API key is configured, the system can generate structured debugging responses using an LLM. If no key is configured, the app falls back to a local heuristic analyzer to ensure the application remains fully functional during demos and local development.

This approach keeps the application:

* lightweight
* reliable
* demo-friendly
* deployment-safe

---

## 🚀 Getting Started

### Clone the repository

```bash
git clone https://github.com/Yashyr190/debugpilot-ai.git
```

### Navigate into the project

```bash
cd debugpilot-ai
```

### Install dependencies

```bash
npm install
```

### Start development server

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

---

## 🔐 Environment Variables

Optional:

```env
OPENAI_API_KEY=your_api_key
```

The application can also run completely without external AI APIs using the built-in local heuristic analysis mode.

---

## 🌱 Future Improvements

Potential future enhancements include:

* GitHub repository context analysis
* CI/CD log ingestion
* Slack integration
* AI-generated pull request fixes
* Repository-aware debugging
* Multi-agent debugging workflows
* Real-time production incident monitoring

---

## 🎯 Why This Project

The focus of DebugPilot AI was not building a massive platform, but designing a focused developer workflow that feels practical, realistic, and immediately useful.

The project emphasizes:

* workflow design
* engineering usability
* structured outputs
* practical debugging
* AI-native product thinking

---

## 📹 Demo Video

(https://drive.google.com/file/d/1B6vfclYXRypmdNDDFDD16DtDiTtuYRL2/view?usp=sharing)

---

## 🙌 Acknowledgements

Built as part of the Lamatic AgentKit Challenge.

---

## 📄 License

MIT License

