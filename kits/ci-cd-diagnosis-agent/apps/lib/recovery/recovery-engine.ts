import type { Diagnosis, RecoveryPlan } from "@/lib/types";

/**
 * Synthesizes an autonomous, actionable recovery plan tailored to the AI diagnosis category
 */
export function generateRecoveryPlan(diagnosis: Diagnosis): RecoveryPlan {
  const category = diagnosis.classification.category || "Infrastructure";
  const fixSnippet = diagnosis.resolution.fixes[0];
  const fixCode = fixSnippet?.code || "export NODE_OPTIONS=\"--max-old-space-size=4096\"";

  if (category.toLowerCase().includes("dependency") || category.toLowerCase().includes("peer")) {
    return {
      estimatedSuccessRate: 96,
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
          title: "Verify CI/CD Build",
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
        commitMessage: "fix(ci): resolve peer dependency conflict in build workflow",
        prTitle: "fix(ci): bypass peer dependency check using --legacy-peer-deps",
        prDescription: `## 🤖 AI Recovery Plan Overview
- **Issue**: Dependency resolution failure during CI/CD build execution.
- **Root Cause**: ${diagnosis.analysis.root_cause_summary}
- **Resolution**: Updated CI workflow step to use \`npm ci --legacy-peer-deps\` to resolve peer tree mismatches.`,
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

  // Infrastructure / Memory / Default Recovery Plan
  return {
    estimatedSuccessRate: 98,
    overallRiskLevel: "Low",
    steps: [
      {
        stepNumber: 1,
        title: "Export V8 Memory Heap Allocation Limit",
        command: "export NODE_OPTIONS=\"--max-old-space-size=4096\"",
        expectedOutcome: "Increases Node.js RAM ceiling from 1.4 GB to 4 GB",
        riskLevel: "Low",
      },
      {
        stepNumber: 2,
        title: "Update Production Build Container Config",
        command: fixCode,
        expectedOutcome: "Allocates required RAM inside Docker / runner container",
        riskLevel: "Low",
      },
      {
        stepNumber: 3,
        title: "Execute Build Verification Probe",
        command: "npm run build",
        expectedOutcome: "Build succeeds without triggering V8 OOM killer",
        riskLevel: "Low",
      },
    ],
    gitPatch: {
      targetFilename: "Dockerfile",
      patchDiff: `--- a/Dockerfile
+++ b/Dockerfile
@@ -4,2 +4,3 @@ WORKDIR /app
 COPY . .
+ENV NODE_OPTIONS="--max-old-space-size=4096"
 RUN npm run build`,
      commitMessage: "fix(docker): allocate 4GB V8 heap space to prevent OOM SIGKILL",
      prTitle: "fix(docker): resolve V8 OOM build crash by increasing max-old-space-size",
      prDescription: `## 🤖 AI Recovery Plan Overview
- **Issue**: V8 JavaScript heap Out of Memory crash (Exit Code 137).
- **Root Cause**: ${diagnosis.analysis.root_cause_summary}
- **Resolution**: Configured \`NODE_OPTIONS="--max-old-space-size=4096"\` in build container to allocate required heap space.`,
    },
    rollbackSteps: [
      "git checkout Dockerfile",
      "unset NODE_OPTIONS",
    ],
    verificationChecklist: [
      "Verify container build passes without OOM termination.",
      "Check runner memory usage metrics in System Health Probe.",
    ],
  };
}
