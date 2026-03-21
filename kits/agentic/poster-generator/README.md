# Agent Kit Poster Generator

`poster-generator` is a Next.js app + Lamatic flow that turns a natural-language idea into a finished poster HTML file, then lets you preview and export it as HTML, PNG, JPG, or SVG.

## What this kit does (and the problem it solves)

Designing posters from scratch usually needs multiple tools and repeated back-and-forth between concept, design spec, and implementation. This kit compresses that process into one pipeline:

1. Parse user intent from a prompt
2. Build a detailed design specification
3. Generate production-ready poster HTML code

This helps teams move from “rough idea” to “exportable visual output” quickly, without manually coordinating copywriting, art direction, and front-end implementation.

## Prerequisites and required providers

- Node.js `>= 20` and npm
- A Lamatic account and project
- A deployed Lamatic workflow based on `flows/poster-generator`
- A configured **text generation model provider** in Lamatic for all 3 Instructor nodes (for example Gemini/OpenAI/Anthropic-compatible text models)

### Flow files in this kit

- `flows/poster-generator/config.json` — workflow graph
- `flows/poster-generator/inputs.json` — private model/provider inputs
- `flows/poster-generator/meta.json` — flow metadata

## Environment variables

Create `.env.local` (or `.env`) in this folder:

```bash
LAMATIC_PROJECT_ENDPOINT=
LAMATIC_FLOW_ID=
LAMATIC_AGENT_ID=
LAMATIC_PROJECT_ID=
LAMATIC_PROJECT_API_KEY=
```

### Required

- `LAMATIC_PROJECT_ENDPOINT` — Lamatic GraphQL endpoint URL
- `LAMATIC_PROJECT_ID` — Lamatic project id (sent as `x-project-id`)
- `LAMATIC_PROJECT_API_KEY` — Lamatic API key (Bearer token)
- `LAMATIC_FLOW_ID` — deployed workflow id for this poster flow

### Optional / currently unused by app runtime

- `LAMATIC_AGENT_ID` — present in `.env.example` but not read by current server code

## Setup and run instructions

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy environment template and fill values:

   ```bash
   cp .env.example .env
   ```

3. In Lamatic:
   - Import/open the flow from `flows/poster-generator/config.json`
   - Configure private inputs from `flows/poster-generator/inputs.json` (3 model selections)
   - Deploy the flow
   - Copy endpoint, project id, API key, and flow id into `.env.local`

4. Start local dev server:

   ```bash
   npm run dev
   ```

5. Open `http://localhost:3000`.

### Useful scripts

```bash
npm run lint
npm run typecheck
npm run build
npm run start
```

## Usage examples

### Example prompts in UI

- `A retro 70s jazz concert poster in Tokyo, moody orange/blue palette, bold typography.`
- `Minimalist climate awareness poster for subway display, urgent but hopeful tone.`
- `Cyberpunk startup launch poster for social media, neon palette, high contrast.`

### Example API call

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

## Screenshots

![Home Page](public/docs/home-page.png)

```md
prompt: Subhi Dairy and Sweets proudly announces a festive Diwali offer of 10% discount on bulk orders. This special limited-time promotion is designed to add more sweetness to your Diwali celebrations, making it perfect for family gatherings, gifting, and festive events.

The poster features a vibrant Diwali-themed design with glowing diyas, decorative lights, and traditional festive patterns in rich shades of gold, orange, and red. The brand name Subhi Dairy and Sweets is prominently displayed at the top in bold, elegant lettering.

At the center, the main message reads: “Enjoy 10% Discount on Bulk Orders this Diwali!” in large, eye-catching typography. Just below it, the offer validity is clearly mentioned:
“Valid for a special 10-day festive period including Diwali.”
This indicates that the offer will be active for a continuous 10-day span covering days before and after Diwali (exact dates to be announced).

At the bottom of the poster, three store locations are listed for customer convenience:

Shop No. 1, Gopi Talav Road, Nanpura, Surat, Gujarat

24, Varachha Main Road, Near Baroda Prestige, Surat, Gujarat

A-5, Adajan Gam Circle, Adajan, Surat, Gujarat

The poster concludes with a warm festive message: “Celebrate Diwali with the Sweetness of Subhi Dairy and Sweets!” along with contact details for bulk order inquiries.

Overall, the design creates a bright, festive, and welcoming atmosphere while clearly communicating the 10% bulk discount offer and its 10-day Diwali validity period.
```

![Generated Poster Export](public/docs/subhi-dairy-diwali-bulk-promotion-poster.png)
