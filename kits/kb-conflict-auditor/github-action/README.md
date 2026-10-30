# GitHub Action: audit docs on every pull request

Runs the deployed `audit-kb` flow against your repo's `docs/` folder, comments the findings on the PR, and fails the check when a finding is serious enough. Suggested replacement text is advisory and should be reviewed by a person.

## Set up (about 10 minutes)

1. **Deploy** the `audit-kb` flow in Lamatic Studio.
2. Collect four values: the API endpoint, project ID and flow ID (flow canvas → *Connect to your project*) and an API key (Studio → Settings → API Keys).
3. In the repo you want to audit: *Settings → Secrets and variables → Actions*, add:
   `LAMATIC_API_URL`, `LAMATIC_PROJECT_ID`, `LAMATIC_API_KEY`, `LAMATIC_FLOW_ID`.
4. Copy `kb-audit.mjs` to `.github/kb-audit/kb-audit.mjs` and `kb-audit.yml` to `.github/workflows/kb-audit.yml`.
5. Open a pull request that changes a file under `docs/`.

## Behaviour

- Only findings that touch a file changed in the PR are shown, so reviews stay focused.
- The check fails for severity `High` or above. Change `FAIL_ON` in the workflow (`Critical`, `High`, `Medium`, `Low` or `none`).
- Changed documents are prioritized within the 200-document limit. If any eligible documents are skipped or any document exceeds 200,000 characters, the report marks the audit incomplete and the check fails.
- Candidate extraction reviews at most 10 pairs. Reports and the web app disclose when additional candidate pairs were found.
- Pull requests from forks have no access to secrets, so the audit is skipped with a notice instead of failing. Missing credentials on same-repository pulls fail the check.
- If the Lamatic service cannot be reached, the check is skipped with a warning and never blocks a PR.
- The workflow uses `pull_request`, not `pull_request_target`, and runs the audit script from the trusted base revision rather than the pull request checkout.

## Try it without any credentials

```
mkdir -p /tmp/demo/docs && cd /tmp/demo
printf '# API\nThe request timeout = 30s.\n' > docs/api.md
printf '# SDK\nThe default request timeout is 60 seconds.\n' > docs/sdk.md
KB_AUDIT_MOCK_RESPONSE=/path/to/sample-response.json node /path/to/kb-audit.mjs
```

## Tests

`node --test kb-audit.test.mjs audit-flow.test.mjs`
