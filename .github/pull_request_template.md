## PR Checklist

### 1. Select Contribution Type
- [ ] Kit (`kits/<category>/<kit-name>/`)
- [ ] Bundle (`bundles/<bundle-name>/`)
- [ ] Template (`templates/<template-name>/`)

---

### 2. General Requirements
- [ ] PR is for **one project only** (no unrelated changes)
- [ ] No secrets, API keys, or real credentials are committed
- [ ] Folder name uses `kebab-case` and matches the flow ID
- [ ] All changes are documented in `README.md` (purpose, setup, usage)

---

### 3. File Structure (Check what applies)
- [ ] `config.json` present with valid metadata (name, description, tags, steps, author, env keys)
- [ ] All flows in `flows/<flow-name>/` (where applicable) include:
  - `config.json` (Lamatic flow export)
  - `inputs.json`
  - `meta.json`
  - `README.md`
- [ ] `.env.example` with placeholder values only (kits only)
- [ ] No hand‑edited flow `config.json` node graphs (changes via Lamatic Studio export)

---

### 4. Validation
- [ ] `npm install && npm run dev` works locally (kits: UI runs; bundles/templates: flows are valid)
- [ ] PR title is clear (e.g., `[kit] Add <name> for <use case>`)
- [ ] GitHub Actions workflows pass (all checks are green)
- [ ] All **CodeRabbit** or other PR review comments are addressed and resolved
- [ ] No unrelated files or projects are modified
