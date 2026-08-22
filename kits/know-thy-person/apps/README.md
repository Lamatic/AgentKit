# Know Thy Person — app

The runnable Next.js app for the **Know Thy Person** kit. Enter an email + name (and,
optionally, a LinkedIn / X / company or personal site link) and get a fully-sourced
meeting-prep dossier.

See the kit README — [`../README.md`](../README.md) — for what it does, the flow, the output
schema, and honest limitations.

## Run locally

```bash
cp .env.example .env.local   # fill in real values from Lamatic Studio
npm install --legacy-peer-deps
npm run dev                  # http://localhost:3000
```

- `npm run test` — run the dossier-normalizer unit tests (Vitest).
- `npm run build` — production build.

### Environment

| Var | Where |
| --- | --- |
| `KNOW_THY_PERSON` | deployed flow ID (Studio → Flow → Details) |
| `LAMATIC_API_URL` / `LAMATIC_PROJECT_ID` / `LAMATIC_API_KEY` | Studio → Settings → API Keys |

The OpenRouter, Serper, and Firecrawl keys are configured in **Lamatic Studio**, not here.

## License

MIT License — see [LICENSE](../../../LICENSE).
