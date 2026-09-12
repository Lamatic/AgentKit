export const config = {
api: {
endpoint: process.env.LAMATIC_API_URL ?? "",
projectId: process.env.LAMATIC_PROJECT_ID ?? "",
apiKey: process.env.LAMATIC_API_KEY ?? "",
},
flows: {
changeImpact: {
name: "Change Impact Analysis",
workflowId: process.env.CHANGE_IMPACT_ANALYSIS_FLOW ?? "",
inputSchema: {
target_file: "string",
dependents_evidence: "string",
},
},
},
};