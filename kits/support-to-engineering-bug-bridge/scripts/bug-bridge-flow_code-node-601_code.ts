const variables = {{variablesNode_734.output}};
const router = {{codeNode_776.output}};

const ticket = variables.full_ticket;

output = {
  text: [ticket.description],
  metadata_payload: [
    {
      cluster_id: String(router.cluster_id),
      subject: String(ticket.subject),
      description: String(ticket.description),
      github_issue_number: String(router.gh_issue_number),
      accounts: String(router.updated_accounts),
      ticket_ids: String(router.updated_ticket_ids),
      severity: String(router.severity)
    }
  ]
};