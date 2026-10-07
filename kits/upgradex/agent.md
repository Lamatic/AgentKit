# UpgradeX

## Overview

UpgradeX is an AgentKit that analyzes the compatibility risk of upgrading an npm dependency in a GitHub repository.

It analyzes repository and package-release evidence and produces a structured assessment of:

- current and target dependency versions
- dependency usage inside the repository
- documented breaking changes
- repository-specific compatibility evidence
- upgrade recommendations
- validation steps
- rollback steps

## Purpose

Dependency upgrades can introduce compatibility problems that are difficult to identify from the version number alone.

UpgradeX combines two sources of evidence:

1. Repository evidence
2. Package release evidence

Repository evidence includes dependency manifests and source-file usage.

Package release evidence includes npm package metadata, target release metadata, and release notes.

The collected evidence is then used to produce a deterministic compatibility and risk assessment.

## Flow

The UpgradeX flow follows this pipeline:

```text
Repository + dependency + target version
                    |
                    v
          Repository metadata
                    |
                    v
             Repository tree
                    |
                    v
              package.json
                    |
                    v
        Current dependency version
                    |
                    v
          Version comparison
                    |
                    v
          Source-file analysis
                    |
                    v
        npm package metadata
                    |
                    v
         Target release notes
                    |
                    v
       Breaking-change analysis
                    |
                    v
      Repository compatibility
                    |
                    v
             Risk scoring
                    |
                    v
       Upgrade / validation /
          rollback plan
```

## Inputs

The flow accepts the following input:

```json
{
  "repoUrl": "https://github.com/owner/repository",
  "dependency": "axios",
  "targetVersion": "2.0.0"
}
```

### repoUrl

Public GitHub repository URL to analyze.

### dependency

The npm dependency whose upgrade is being evaluated.

### targetVersion

The target npm package version.

## Output

UpgradeX produces a structured result containing:

```json
{
  "dependency": {
    "name": "axios",
    "currentVersion": "1.7.0",
    "targetVersion": "2.0.0"
  },
  "risk": {
    "level": "HIGH",
    "score": 82,
    "summary": "..."
  },
  "breakingChanges": [],
  "upgradePlan": [],
  "validationPlan": [],
  "rollbackPlan": []
}
```

## Guardrails

UpgradeX is an analysis-only tool.

It does not:

- modify the target repository
- commit dependency changes
- create pull requests
- automatically upgrade dependencies
- delete or rewrite source files

Risk conclusions are based on the evidence collected during the analysis.

When repository-specific evidence is insufficient, the result should communicate that limitation rather than treating the upgrade as confirmed safe.

## Evidence Sources

The flow uses public sources including:

- GitHub repository metadata
- GitHub repository trees
- raw GitHub source files
- npm registry package metadata
- GitHub release metadata

## Risk Analysis

UpgradeX combines version-change information with repository-specific evidence.

Major version changes receive a higher initial risk contribution than minor or patch changes.

Additional risk can be introduced when documented breaking changes have repository evidence associated with them.

The final result includes both the risk classification and the evidence summary used to derive it.

## Validation

UpgradeX generates a validation plan for the proposed dependency change.

Typical validation includes:

- installing the target dependency version in an isolated branch
- running the existing test suite
- running the project build
- running linting and type checking when configured
- verifying affected repository files
- checking application startup
- checking dependency-related functionality
- reviewing new errors or warnings

Major upgrades may require additional regression testing.

## Rollback

UpgradeX generates a rollback plan that restores the previous dependency version if validation fails.

The plan includes restoring the dependency version, reinstalling dependencies from the restored lockfile, rerunning tests, and verifying that affected functionality returns to the previous working state.

## Repository Structure

```text
kits/upgradex/
├── constitutions/
│   └── default.md
├── flows/
│   └── upgrade-analyzer.ts
├── scripts/
│   └── upgrade-analyzer_code-node-*.ts
├── agent.md
├── lamatic.config.ts
└── README.md
```
