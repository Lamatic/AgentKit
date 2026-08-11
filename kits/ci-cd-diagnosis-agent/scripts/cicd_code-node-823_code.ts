const job_id = {{triggerNode_1.output.job_id}}
const ciProvider = {{triggerNode_1.output.ciProvider}}

const class_node = {{LLMNode_526.output}}
const analysis_node = {{LLMNode_487.output}}
const fixes_node = {{LLMNode_683.output}}
const verify_node = {{LLMNode_660.output}}
const risk_node = {{LLMNode_906.output}}

const classification = JSON.parse(class_node.generatedResponse || "{}");
const analysis = JSON.parse(analysis_node.generatedResponse || "{}");
const fixes_obj = JSON.parse(fixes_node.generatedResponse || "{}");
const verify_obj = JSON.parse(verify_node.generatedResponse || "{}");
const risk = JSON.parse(risk_node.generatedResponse || "{}");

output = {
  metadata: { 
    job_id: job_id || "unknown", 
    timestamp: new Date().toISOString(), 
    ci_provider: ciProvider || "unknown" 
  },
  classification: classification,
  analysis: analysis,
  resolution: { 
    is_fix_valid: verify_obj.is_fix_valid, 
    verification_notes: verify_obj.verification_notes, 
    fixes: fixes_obj.fixes, 
    security_warnings: risk.warning 
  },
  risk: risk
};
