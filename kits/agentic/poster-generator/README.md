# Agent Kit Poster Generator

This README is focused on app setup and usage. For full flow documentation, provider setup details, examples, and screenshots, see [`flows/poster-generator/README.md`](flows/poster-generator/README.md).

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy env template:

   ```bash
   cp .env.example .env
   ```

3. Configure Lamatic values in `.env` (or `.env.local`):

   ```bash
   LAMATIC_PROJECT_ENDPOINT=
   LAMATIC_FLOW_ID=
   LAMATIC_PROJECT_ID=
   LAMATIC_PROJECT_API_KEY=
   ```

4. Import and deploy the flow from [`flows/poster-generator/config.json`](flows/poster-generator/config.json), then update env values with your deployed details.

5. Start development server:

   ```bash
   npm run dev
   ```

6. Open `http://localhost:3000`.

## Usage

1. Enter a poster prompt in the UI.
2. Generate the poster.
3. Preview and export in HTML, PNG, JPG, or SVG.

### API usage

```bash
curl -X POST http://localhost:3000/api/generate-poster \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Art deco film festival poster with gold accents and dramatic lighting"}'
```

Expected response shape:

```json
{
  "is_valid": true,
  "validation_issues": [],
  "html_code": "<!doctype html>...",
  "poster_name": "art-deco-film-festival"
}
```

## Useful scripts

```bash
npm run lint
npm run typecheck
npm run build
npm run start
```
