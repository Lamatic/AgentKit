const task = {{triggerNode_1.output.approvedTask}};
const requirements = Array.isArray({{triggerNode_1.output.requirements}}) ? {{triggerNode_1.output.requirements}} : [];
const documents = Array.isArray({{triggerNode_1.output.documents}}) ? {{triggerNode_1.output.documents}} : [];
const linkedIds = Array.isArray(task.requirementIds) ? task.requirementIds : [];
const linkedRequirements = requirements.filter((requirement) => linkedIds.includes(requirement.id));
const linkedDocumentIds = [...new Set(linkedRequirements.map((requirement) => requirement.documentId).filter(Boolean))];

output = {
  approved: true,
  task,
  requirements: linkedRequirements,
  documents: documents.filter((document) => linkedDocumentIds.includes(document.id)),
  deliveryStatus: "READY_FOR_AUTHORIZED_DELIVERY",
  note: "This flow assembles context only. The calling application owns external delivery."
};
