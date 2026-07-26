// Read upstream node outputs
const variables = {{variablesNode_734.output}};
const router = {{codeNode_776.output}};
const vectors = {{vectorizeNode_681.output.vectors}};

const ticket = variables.full_ticket;

let metadataProps = [];

for (const idx in vectors) {

  let metadata = {};

  metadata["cluster_id"] = router.cluster_id;
  metadata["ticket_id"] = ticket.id;
  metadata["subject"] = ticket.subject;
  metadata["description"] = ticket.description;
  metadata["github_issue_number"] = null;
  metadata["accounts"] = router.updated_accounts;
  metadata["ticket_ids"] = router.updated_ticket_ids;
  metadata["severity"] = router.severity;

  metadataProps.push(metadata);
}

console.log(vectors);

output = {
  metadata: metadataProps,
  vectors: vectors
};