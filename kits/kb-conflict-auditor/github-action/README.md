# GitHub Action: audit docs on every pull request

Runs the deployed `audit-kb` flow against your repo's `docs/` folder, comments the findings on the PR, and fails the check when a finding is serious enough.

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
- Pull requests from forks have no access to secrets, so the audit is skipped with a notice instead of failing.
- If the Lamatic service cannot be reached, the check is skipped with a warning and never blocks a PR.
- The workflow uses `pull_request`, not `pull_request_target`, so untrusted code never sees your secrets.

## Try it without any credentials

```
mkdir -p /tmp/demo/docs && cd /tmp/demo
printf '# API\nThe request timeout = 30s.\n' > docs/api.md
printf '# SDK\nThe default request timeout is 60 seconds.\n' > docs/sdk.md
KB_AUDIT_MOCK_RESPONSE=/path/to/sample-response.json node /path/to/kb-audit.mjs
```

## Tests

`node --test kb-audit.test.mjs`
