/**
 * EDA Copilot — Lamatic SDK Configuration & Flow Definitions
 *
 * Uses the official `lamatic` npm SDK to call three sequential flows:
 *  1. Schema Analysis      → column types, data quality score
 *  2. Statistical Insights → distributions, correlations, outliers
 *  3. ML Readiness         → preprocessing recommendations, readiness score
 *
 * Install: npm install lamatic
 * Docs:    https://lamatic.ai/docs/api-integration/sdk
 */

import { Lamatic } from "lamatic";

export const lamatic = new Lamatic({
  endpoint:  process.env.LAMATIC_API_URL,
  projectId: process.env.LAMATIC_PROJECT_ID,
  apiKey:    process.env.LAMATIC_API_KEY,
});

/**
 * Flow definitions — IDs come from .env after deploying each flow in Lamatic Studio.
 * Each flow's input keys must match the payload you send via lamatic.executeFlow().
 */
export const flows = {
  /**
   * Flow 1 — Schema Analysis
   * Lamatic input schema:  datasetSummary (Object), fileName (String)
   * Lamatic output key:    generatedResponse (String — markdown)
   */
  schemaAnalysis: {
    id: process.env.EDA_SCHEMA_ANALYSIS_FLOW_ID,
    inputKeys: ["datasetSummary", "fileName"],
  },

  /**
   * Flow 2 — Statistical Insights
   * Lamatic input schema:  datasetSummary (Object), schemaInsights (String)
   * Lamatic output key:    generatedResponse (String — markdown)
   */
  statisticalInsights: {
    id: process.env.EDA_STATISTICAL_INSIGHTS_FLOW_ID,
    inputKeys: ["datasetSummary", "schemaInsights"],
    dependsOn: "schemaAnalysis",
  },

  /**
   * Flow 3 — ML Readiness
   * Lamatic input schema:  datasetSummary (Object), schemaInsights (String), statisticalInsights (String)
   * Lamatic output key:    generatedResponse (String — markdown)
   */
  mlReadiness: {
    id: process.env.EDA_ML_READINESS_FLOW_ID,
    inputKeys: ["datasetSummary", "schemaInsights", "statisticalInsights"],
    dependsOn: ["schemaAnalysis", "statisticalInsights"],
  },
};

export default flows;
