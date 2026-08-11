---
id: permission-denied-script
title: Permission Denied — Shell Script Not Executable
domain: security
technology: bash
severity: low
keywords: permission denied, EACCES, chmod, entrypoint, bash script, executable bit, +x
last_updated: 2025-01-01
---

## Problem Overview
When a shell script (e.g., `entrypoint.sh`, `build.sh`) does not have the executable bit set in the Git repository, CI runners fail with "Permission denied" when trying to execute it.

## Typical Error Messages
```text
/entrypoint.sh: Permission denied
bash: ./scripts/build.sh: Permission denied
Error: Process completed with exit code 126.
permission denied (os error 13)
```

## Root Causes
1. **Executable Bit Not Committed to Git:** The file was created or modified without the executable bit, and Git did not track it.
2. **File Created on Windows:** Windows filesystems do not natively support Unix executable bits, so scripts created on Windows are never committed as executable.

## Diagnosis Steps
- Run `git ls-files --stage scripts/build.sh` locally. A mode of `100644` means NOT executable; `100755` means executable.
- Check if the script was recently added or renamed.

## Recommended Fixes

### Fix 1: Set the executable bit in Git (permanent fix)
```bash
git update-index --chmod=+x entrypoint.sh
git commit -m "chore: make entrypoint.sh executable"
git push
```

### Fix 2: Run chmod in the CI step (temporary workaround)
```yaml
- name: Make script executable
  run: chmod +x ./scripts/build.sh

- name: Run build
  run: ./scripts/build.sh
```

## Verification Steps
- Run `git ls-files --stage entrypoint.sh` and confirm the mode is `100755`.
- Re-trigger the pipeline. The `Permission denied` error should not appear.

## References
- [Git: git update-index](https://git-scm.com/docs/git-update-index)
