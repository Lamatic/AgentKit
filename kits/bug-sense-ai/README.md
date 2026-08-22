# BugSense AI

## Overview

BugSense AI is an AI-powered software debugging assistant built using Lamatic AgentKit.

It helps developers quickly understand software errors by identifying the root cause, explaining the issue in simple language, and suggesting step-by-step fixes.

---

## Features

- Supports multiple programming languages
- Explains compiler and runtime errors
- Identifies the root cause
- Provides step-by-step debugging instructions
- Suggests best practices
- Recommends official documentation whenever possible

---

## How it Works

1. User enters an error message or stack trace.
2. The AI analyzes the error.
3. It identifies the programming language and error category.
4. It explains the root cause.
5. It suggests fixes and debugging steps.
6. It recommends best practices and official documentation.

---

## Built With

- Lamatic Studio
- Groq Llama 3
- Chat Widget
- Lamatic AI AgentKit

---

## Setup Guide

### Prerequisites

Before getting started, ensure you have:

- Node.js 20 or later
- npm
- A Lamatic account
- A Groq API key

### Installation

Navigate to the application directory and install the dependencies:

```bash
cd kits/bug-sense-ai/apps
npm install
```

### Environment Setup

Copy the example environment file and configure the required environment variables with your API keys.

```bash
cp .env.example .env
```

### Run Locally

Start the development server:

```bash
npm run dev
```

### Deployment

1. Open Lamatic Studio.
2. Import the **BugSense AI** kit.
3. Configure the required environment variables.
4. Deploy the application from the Lamatic dashboard.