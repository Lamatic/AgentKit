/**
 * Demo output used only when DEMO_MODE=true. This lets the UI be explored
 * locally (or by a reviewer) without a deployed Lamatic flow or credentials.
 * In normal operation the real flow generates the notes; this is never used.
 */
export function buildDemoNotes(version?: string, date?: string): string {
  const heading = version || date ? `# ${[version, date].filter(Boolean).join(" — ")}\n\n` : "";
  return `${heading}## 📌 Highlights
This is **demo output** (DEMO_MODE is on). It adds dark mode and more reliable webhook delivery, and renames the \`apiKey\` configuration option to \`token\` (breaking). Deploy the flow in Lamatic Studio and set your credentials to generate notes from your own input.

## ✨ Features
- Add a dark mode toggle to the settings page (#412)
- Add automatic retry with backoff to webhook delivery (#421)

## 🐛 Fixes
- Fix a crash when uploading an empty CSV file (#419)

## ⚠️ Breaking Changes
- Rename the \`apiKey\` configuration option to \`token\`

## 🧹 Chore & Internal
- Upgrade Next.js from 15.1 to 16.0`;
}
