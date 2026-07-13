# Release Notes Generator — Agent Capabilities

## What it does
Transforms raw git commit messages and pull request titles into clean, categorized,
human-readable release notes in Markdown.

## Capabilities
- Groups changes into **Features**, **Fixes**, **Breaking Changes**, and **Maintenance**.
- Understands [Conventional Commit](https://www.conventionalcommits.org/) prefixes
  (`feat:`, `fix:`, `chore:`, `refactor:`, `docs:`, `ci:`, `build:`, `!`, `BREAKING CHANGE`).
- Rewrites terse commit text into concise, past-tense, user-facing sentences.
- Merges duplicates and drops noise (`wip`, `typo`, `merge branch …`).

## Inputs
| Field | Type | Required | Description |
|---|---|---|---|
| `changes` | `string` | Yes | Newline-separated commit messages and/or PR titles. |

## Outputs
| Field | Type | Description |
|---|---|---|
| `releaseNotes` | `string` | Categorized release notes in Markdown. |

## Example
**Input (`changes`):**
```text
feat: add dark mode toggle to settings
fix: crash when uploading empty file
chore: bump dependencies
feat!: drop support for Node 16
docs: update README
```

**Output (`releaseNotes`):**
```markdown
This release adds dark mode, fixes an upload crash, and drops Node 16 support.

### 🚀 Features
- Added a dark mode toggle in Settings.

### 🐛 Fixes
- Fixed a crash that occurred when uploading an empty file.

### ⚠️ Breaking Changes
- Dropped support for Node 16.

### 🔧 Maintenance
- Bumped project dependencies.
- Updated the README.
```

## Guardrails
Behavior is bounded by [`constitutions/default.md`](./constitutions/default.md): no fabricated
features, no PII handling, and refusal of prompt-injection attempts.
