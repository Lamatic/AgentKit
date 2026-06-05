# Meeting Preparation Agent

## Overview

Meeting Preparation Agent is an AI-powered interview preparation assistant that helps candidates prepare for upcoming interviews by generating structured preparation guides based on the target company and role.

The agent provides:

* Company overview and background
* Interview preparation tips
* Technical interview questions
* Behavioral interview questions
* Suggested questions to ask the interviewer
* A focused 30-minute preparation plan

## Prerequisites

* Lamatic.ai workspace
* Access to a supported generative AI model
* Valid model credentials configured in your Lamatic environment

## Setup

1. Import the template into your Lamatic workspace.
2. Configure a supported generative model.
3. Connect the required credentials in your environment.
4. Deploy the flow.

## Environment Variables

Configure the following environment variables in your Lamatic workspace or deployment environment before running the agent.

| Variable            | Purpose                                            | Example         |
| ------------------- | -------------------------------------------------- | --------------- |
| `LAMATIC_API_KEY`   | API key used to authenticate with Lamatic services | `lam_xxxxxxxxx` |
| `LAMATIC_WORKSPACE` | Lamatic workspace identifier                       | `my-workspace`  |
| `MODEL_NAME`        | Generative AI model used by the agent              | `gpt-4o`        |
| `OPENAI_API_KEY`    | API key for OpenAI models (if applicable)          | `sk-xxxxxxxx`   |
| `FLOW_ID`           | Deployed Lamatic flow identifier                   | `flow_12345`    |
| `DEPLOY_ENV`        | Deployment environment                             | `production`    |

Example configuration:

```bash
export LAMATIC_API_KEY="lam_xxxxxxxxx"
export LAMATIC_WORKSPACE="my-workspace"
export MODEL_NAME="gpt-4o"
export OPENAI_API_KEY="sk-xxxxxxxx"
export FLOW_ID="flow_12345"
export DEPLOY_ENV="production"
```

These variables are required during the Setup and Deployment steps described above.

## Usage

Provide an interview request containing details such as:

```text
Company: Google
Role: Backend Developer Intern
```

The agent will generate a complete interview preparation package tailored to the provided role and company.

## Example Output

* Company Overview
* Interview Preparation Tips
* 5 Technical Questions
* 5 Behavioral Questions
* Questions to Ask the Interviewer
* 30-Minute Preparation Plan

## License

This template is provided for educational and demonstration purposes.
