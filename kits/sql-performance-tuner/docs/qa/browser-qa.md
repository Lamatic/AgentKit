# Browser QA Notes

Date: 2026-09-02

Local app URL used during verification: `http://localhost:3017`

## Saved screenshots

- Desktop shell: `docs/qa/sql-tuner-shell-desktop.png`
- Mobile shell: `docs/qa/sql-tuner-shell-mobile.png`

Both screenshots were captured through the Codex in-app browser after reading
the browser testing instructions. DOM audits reported no horizontal overflow at
`1280x900` or `390x844`.

## Functional smoke coverage

The dynamic tuning states were verified through the app API because this
session's in-app browser control surface loaded and screenshot the page, but did
not dispatch the React button click handler. The API checks exercise the same
Next.js route and tuning runtime used by the interface.

| Scenario | Result |
|---|---|
| Demo improved run | `200`, `status: improved`, reviewer output present |
| Live Lamatic improved run | `200`, `status: improved`, reviewer output present, measured `1.44x` conclusion |
| No-improvement query | `200`, `status: no-proven-improvement`, recommendation says keep original query |
| Uploaded SQLite database | `200`, reviewer output present, uploaded fixture evaluated |
| Invalid SQL input | `400`, Lamatic not invoked |
| Invalid SQLite upload | `400`, rejected as non-SQLite |
| Guard-rejected experiment path | Covered by automated runner test using an unsafe partial index proposal |

## Commands

```bash
npm run check:contracts
npm run typecheck -- --incremental false
npm test
npm run build
```

All commands passed.
