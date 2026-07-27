---
id: github-actions-yaml-syntax-error
title: GitHub Actions — YAML Syntax and Configuration Errors
domain: platforms
technology: github-actions
severity: medium
keywords: YAML, syntax error, invalid workflow, mapping values, workflow file, unexpected, tab character, indentation
last_updated: 2025-01-01
---

## Problem Overview
GitHub Actions workflow files must be valid YAML. Syntax errors prevent the workflow from being parsed and will cause an immediate failure before any steps are executed.

## Typical Error Messages
```text
Invalid workflow file: .github/workflows/ci.yml
You have an error in your yaml syntax on line 14
mapping values are not allowed here
could not parse the workflow file
tab character not allowed
```

## Root Causes
1. **Incorrect Indentation:** YAML uses spaces, not tabs. A single tab character causes a parse failure.
2. **Missing Colon or Quotes:** Action parameters must be quoted if they contain special characters (`:`, `#`, `{`).
3. **Invalid `on:` Trigger:** Misspelling event names (`pushs` instead of `push`) causes silent failures.
4. **Wrong `uses:` Reference:** Referencing a private or non-existent Action (e.g., wrong tag version).

## Diagnosis Steps
- Paste the workflow YAML into [yaml.info](https://yaml.info/learn/validate.html) or use `yamllint` locally.
- Run `yamllint .github/workflows/ci.yml` from the repo root.
- Check the exact line number in the error message.

## Recommended Fixes

### Fix 1: Replace tabs with spaces
```bash
# Detect and replace all tab characters with 2 spaces
sed -i 's/\t/  /g' .github/workflows/ci.yml
```

### Fix 2: Quote strings containing special characters
```yaml
# WRONG
- run: echo hello: world

# CORRECT
- run: "echo 'hello: world'"
```

### Fix 3: Validate with yamllint in CI
```yaml
- name: Lint workflow files
  run: |
    pip install yamllint
    yamllint .github/workflows/
```

## Verification Steps
- Commit the fix and push to the branch.
- Confirm the "Actions" tab shows the workflow is queued (not failing at parse stage).

## References
- [GitHub Docs: Workflow Syntax](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions)
- [yamllint](https://yamllint.readthedocs.io/)
