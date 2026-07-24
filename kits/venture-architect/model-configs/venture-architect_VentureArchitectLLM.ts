/**
 * NOTE: provider/model identifiers below are placeholders — Lamatic's
 * documented guide doesn't specify the exact provider string values it
 * expects. Set these to match whatever your Studio project has configured
 * under Settings → Providers before deploying (e.g. your Groq or OpenAI
 * connection name and an available model from that provider).
 */
export default {
  provider: "groq",
  model: "llama-3.3-70b-versatile",
  temperature: 0.85,
  maxTokens: 4000,
};
