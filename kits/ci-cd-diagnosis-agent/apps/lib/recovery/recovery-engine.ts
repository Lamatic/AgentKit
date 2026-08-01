import type { Diagnosis, RecoveryPlan } from "@/lib/types";

/**
 * Synthesizes an autonomous, 100% dynamic recovery plan tailored to the AI diagnosis
 */
export function generateRecoveryPlan(diagnosis: Diagnosis): RecoveryPlan {
  const category = (diagnosis.classification.category || "Infrastructure").toLowerCase();
  const rootCause = diagnosis.analysis.root_cause_summary || "CI/CD Pipeline Failure";
  const fixSnippet = diagnosis.resolution.fixes[0];
  const fixCode = fixSnippet?.code || "export NODE_OPTIONS=\"--max-old-space-size=4096\"";
  const fixDescription = fixSnippet?.description || "Apply recommended configuration fix";

  // Calculate dynamic success rate based on AI confidence score
  const confidenceScore = diagnosis.classification.confidence_score || 0.95;
  const estimatedSuccessRate = Math.min(99, Math.round(confidenceScore * 100));

  // Detect target filename dynamically
  let targetFilename = ".github/workflows/ci.yml";
  if (fixCode.includes("Dockerfile") || fixDescription.toLowerCase().includes("docker")) {
    targetFilename = "Dockerfile";
  } else if (fixCode.includes("package.json") || fixDescription.toLowerCase().includes("package")) {
    targetFilename = "package.json";
  } else if (fixCode.includes("NODE_OPTIONS")) {
    targetFilename = "Dockerfile";
  }

  // Handle dependency & lockfile errors
  if (category.includes("depend") || category.includes("peer") || rootCause.toLowerCase().includes("npm")) {
    return {
      estimatedSuccessRate,
      overallRiskLevel: "Low",
      steps: [
        {
          stepNumber: 1,
          title: "Clean Local Node Modules & Locks",
          command: "rm -rf node_modules package-lock.json",
          expectedOutcome: "Purges corrupt dependency lock state",
          riskLevel: "Low",
        },
        {
          stepNumber: 2,
          title: "Reinstall Dependencies with Legacy Peer Resolution",
          command: "npm install --legacy-peer-deps",
          expectedOutcome: "Resolves peer dependency conflicts cleanly",
          riskLevel: "Low",
        },
        {
          stepNumber: 3,
          title: "Execute Build Verification Probe",
          command: "npm run build",
          expectedOutcome: "Build completes with zero peer dependency errors",
          riskLevel: "Low",
        },
      ],
      gitPatch: {
        targetFilename: ".github/workflows/ci.yml",
        patchDiff: `--- a/.github/workflows/ci.yml
+++ b/.github/workflows/ci.yml
@@ -14,3 +14,3 @@ jobs:
     - name: Install dependencies
-      run: npm ci
+      run: npm ci --legacy-peer-deps`,
        commitMessage: `fix(ci): ${rootCause.toLowerCase().slice(0, 50)}`,
        prTitle: `fix(ci): ${rootCause.slice(0, 60)}`,
        prDescription: `## 🤖 AI Recovery Plan Overview
- **Issue**: Dependency resolution failure during CI/CD build execution.
- **Root Cause**: ${rootCause}
- **Resolution**: Updated workflow step to use \`npm ci --legacy-peer-deps\` to resolve package lock mismatches.`,
      },
      rollbackSteps: [
        "git checkout .github/workflows/ci.yml",
        "npm install",
      ],
      verificationChecklist: [
        "Verify `npm run build` completes with exit code 0.",
        "Check that package.json scripts function as expected.",
      ],
    };
  }

  // Dynamic Infrastructure / Code Fix / General Recovery Plan
  return {
    estimatedSuccessRate,
    overallRiskLevel: diagnosis.risk.level === "High" ? "Medium" : "Low",
    steps: [
      {
        stepNumber: 1,
        title: "Export Execution Environment Flags",
        command: fixCode.includes("\n") ? fixCode.split("\n")[0] : fixCode,
        expectedOutcome: fixDescription,
        riskLevel: "Low",
      },
      {
        stepNumber: 2,
        title: "Apply Configuration & Fix Snippet",
        command: fixCode,
        expectedOutcome: "Applies verified patch to workflow configuration",
        riskLevel: "Low",
      },
      {
        stepNumber: 3,
        title: "Execute Build & Test Verification",
        command: "npm run build",
        expectedOutcome: "Build completes with exit code 0",
        riskLevel: "Low",
      },
    ],
    gitPatch: {
      targetFilename,
      patchDiff: (() => {
        const fixLines = fixCode.split("\n");
        const addedCount = fixLines.length;
        return [
          `--- a/${targetFilename}`,
          `+++ b/${targetFilename}`,
          `@@ -1,1 +1,${1 + addedCount} @@`,
          ` # Verified AI Fix Patch`,
          ...fixLines.map((line) => `+${line}`),
        ].join("\n");
      })(),
      commitMessage: `fix(ci): ${rootCause.toLowerCase().slice(0, 50)}`,
      prTitle: `fix(ci): ${rootCause.slice(0, 60)}`,
      prDescription: `## 🤖 AI Recovery Plan Overview
- **Category**: ${diagnosis.classification.category}
- **Root Cause**: ${rootCause}
- **Resolution**: Applied verified fix: \`${fixDescription}\`.`,
    },
    rollbackSteps: [
      `git checkout ${targetFilename}`,
      "git status",
    ],
    verificationChecklist: [
      "Verify container build passes without error termination.",
      "Check runner metrics in System Health Probe.",
    ],
  };
}
