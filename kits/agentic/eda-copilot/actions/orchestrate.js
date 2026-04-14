/**
 * EDA Copilot — Lamatic Flow Orchestration
 *
 * Defines three sequential flows that power the EDA Copilot agent:
 *  1. Schema Analysis  — understands column types, data quality issues
 *  2. Statistical Insights — interprets distributions, correlations, outliers
 *  3. ML Readiness — scores dataset and recommends preprocessing steps
 */

export const apiConfig = {
  endpoint: process.env.LAMATIC_API_URL,
  projectId: process.env.LAMATIC_PROJECT_ID,
  apiKey: process.env.LAMATIC_API_KEY,
};

export const flows = {
  /**
   * Flow 1: Schema Analysis
   * Input:  { datasetSummary: DatasetSummary, fileName: string }
   * Output: { schemaInsights: string, dataQualityScore: number, columnAnnotations: object[] }
   */
  schemaAnalysis: {
    id: process.env.EDA_SCHEMA_ANALYSIS_FLOW_ID,
    description: "Analyzes column schema, data types, and overall data quality",
    inputs: ["datasetSummary", "fileName"],
  },

  /**
   * Flow 2: Statistical Insights
   * Input:  { datasetSummary: DatasetSummary, schemaInsights: string }
   * Output: { distributionInsights: string, correlationInsights: string, outlierInsights: string }
   */
  statisticalInsights: {
    id: process.env.EDA_STATISTICAL_INSIGHTS_FLOW_ID,
    description: "Generates narrative insights on distributions, correlations, and anomalies",
    inputs: ["datasetSummary", "schemaInsights"],
    dependsOn: ["schemaAnalysis"],
  },

  /**
   * Flow 3: ML Readiness Assessment
   * Input:  { datasetSummary: DatasetSummary, schemaInsights: string, statisticalInsights: string }
   * Output: { mlReadinessScore: number, recommendations: string[], preprocessingSteps: string[] }
   */
  mlReadiness: {
    id: process.env.EDA_ML_READINESS_FLOW_ID,
    description: "Produces ML readiness score and actionable preprocessing recommendations",
    inputs: ["datasetSummary", "schemaInsights", "statisticalInsights"],
    dependsOn: ["schemaAnalysis", "statisticalInsights"],
  },
};

export default flows;
