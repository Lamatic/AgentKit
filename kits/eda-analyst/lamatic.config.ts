export default {
  "name": "EDA Analyst",
  "description": "An autonomous exploratory-data-analysis agent. Point it at a CSV and it profiles the data, cleans it (impute / drop / dedupe) behind a validation gate that reverts on any regression, plans and runs a set of analyses with a conditional re-plan, and renders a self-contained interactive dashboard. Every statistic is computed in code; the LLM only makes decisions.",
  "version": "1.0.0",
  "type": "kit" as const,
  "author": {
    "name": "Rishabh Rajput",
    "email": "rishabhrajput081@gmail.com"
  },
  "tags": ["agentic", "data-analysis", "eda", "dashboard", "visualization", "data-cleaning"],
  "steps": [
    {
      "id": "eda-analyst",
      "type": "mandatory" as const,
      "envKey": "EDA_ANALYST"
    }
  ],
  "links": {
    "github": "https://github.com/Lamatic/AgentKit/tree/main/kits/eda-analyst",
    "deploy": "https://vercel.com/new/clone?repository-url=https://github.com/Lamatic/AgentKit&root-directory=kits%2Feda-analyst%2Fapps&env=EDA_ANALYST,LAMATIC_API_URL,LAMATIC_PROJECT_ID,LAMATIC_API_KEY&envDescription=Your%20Lamatic%20keys%20and%20the%20EDA%20Analyst%20flow%20ID%20are%20required."
  }
};
