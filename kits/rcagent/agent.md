# Root Cause Analysis Agent (RCAgent)

## Overview
RCAgent is a specialized SRE and debugging assistant built on AgentKit that investigates software incidents by orchestrating three collaborative reasoning stages: planning, code/log analysis, and postmortem synthesis. It takes an incident report, log traces, and git reference details, then executes target-specific analysis flows before returning a comprehensive markdown Root Cause Analysis report with remediation steps.

---

## Purpose
The primary objective of this kit is to automate incident troubleshooting for developers and SREs. Instead of manually inspecting files, checking git changelogs, comparing package locks, and hunting through log stack traces, the RCAgent does the heavy lifting:
1. **Plan:** The `rcagent-planner` determines what files, commit changes, and systems are suspect.
2. **Analyze:** The `rcagent-analyzer` inspects git history, configuration files, and log dumps for fault patterns.
3. **Synthesize:** The `rcagent-synthesizer` forms a postmortem, identifies the culprit commit or dependency, and suggests prevention actions.

---

## Flows

### `rcagent-planner`
* **Trigger:** Invoked via API/GraphQL (`graphqlNode`).
* **Input Schema:**
  * `incidentTitle`: string
  * `alertDetails`: string
  * `logsOrSymptoms`: string
* **Purpose:** Analyzes the raw alert and error logs to generate a custom step-by-step diagnostic checklist.
* **Output:** `steps` (a text list of files, variables, and history areas to investigate).

### `rcagent-analyzer`
* **Trigger:** Invoked via API/GraphQL (`graphqlNode`).
* **Input Schema:**
  * `steps`: string (plan from `rcagent-planner`)
  * `gitDiff`: string (optional, context from local repository status)
  * `configSettings`: string (optional, context from environment setups)
* **Purpose:** Performs deep-dive analysis of stack traces, git logs, and configuration values to isolate anomalies.
* **Output:** `research` (evidence and fault descriptions).

### `rcagent-synthesizer`
* **Trigger:** Invoked via API/GraphQL (`graphqlNode`).
* **Input Schema:**
  * `incidentTitle`: string
  * `research`: string (findings from `rcagent-analyzer`)
* **Purpose:** Synthesizes final root cause analysis postmortem and outlines remediation/prevention actions.
* **Output:** `postmortem` (markdown formatted RCA report).
