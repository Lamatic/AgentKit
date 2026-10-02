# Proposal Tailor

## Overview

The Proposal Tailor is an agentic kit designed to automatically generate customized, professional proposals by analyzing specific client requirements and dynamically adapting base templates.

## Prerequisites

- Node.js (v18+)
- Lamatic Studio account
- Lamatic API Key

## Setup

1. Clone the repository and navigate to `kits/proposal-tailor`.
2. Run `npm install` to install dependencies.
3. Copy `.env.example` to `.env` and add your `LAMATIC_API_KEY`.
4. Run `npm run dev` to start the application.

## Usage

This kit operates via an API flow. You can trigger the proposal generation by sending a request with the following JSON payload:

```json
{
  "job_description": "Enter the raw client project requirements here.",
  "freelancer_skills": "Enter your relevant skills, case studies, and experience here."
}
```
