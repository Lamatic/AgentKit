# UpgradeX

UpgradeX is an AgentKit for analyzing the risk of upgrading an npm dependency in a GitHub repository.

It examines repository dependency usage and target package release information to produce a structured compatibility assessment.

## What It Analyzes

UpgradeX identifies:

- current dependency version
- target dependency version
- dependency usage in repository source files
- documented breaking changes
- repository-specific compatibility evidence
- upgrade risk
- recommended upgrade steps
- validation steps
- rollback steps

## Input

```json
{
  "repoUrl": "https://github.com/owner/repository",
  "dependency": "axios",
  "targetVersion": "2.0.0"
}
```

## Analysis Flow

```text
GitHub Repository
       |
       v
Repository Metadata
       |
       v
Repository File Tree
       |
       v
package.json
       |
       v
Current Dependency Version
       |
       v
Source Usage Analysis
       |
       v
npm Package Metadata
       |
       v
Target Release Notes
       |
       v
Breaking Change Analysis
       |
       v
Compatibility Analysis
       |
       v
Risk Assessment
       |
       v
Upgrade + Validation + Rollback Plan
```

## Output

The AgentKit returns structured information including:

```text
Dependency
Current Version
Target Version
Risk Level
Risk Score
Breaking Changes
Affected Files
Evidence
Upgrade Plan
Validation Plan
Rollback Plan
```

## Example Output

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

## Safety

UpgradeX is an analysis-only tool.

It does not:

- modify the target repository
- commit changes
- create pull requests
- automatically upgrade dependencies
- rewrite source files

The risk assessment is based on the evidence available during analysis.

## Project Structure

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

## Limitations

UpgradeX analyzes publicly accessible GitHub repositories and package-release information.

A lack of detected repository evidence does not guarantee that an upgrade is safe. The generated validation plan should be executed before merging a dependency change.
