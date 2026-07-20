(async () => {

  // Mapped node outputs
  const validation = {{codeNode_286.output}};
  const variables = {{variablesNode_734.output}};
  const vector = {{searchNode_833.output}};

  const route = validation.route || "hold";
  const currentTicket = variables.full_ticket || {};

  const searchResults = vector.searchResults || [];

  const matchedId =
    validation.data && validation.data.matched_cluster_id
      ? validation.data.matched_cluster_id
      : null;

  let existingCluster = null;
  let routingAnomaly = null;

  if (matchedId) {
    existingCluster =
      searchResults.find(r => r.cluster_id === matchedId) || null;

    if (!existingCluster) {
      routingAnomaly =
        `matched_cluster_id '${matchedId}' not found in searchResults`;

      console.error(`[Node 6] Routing anomaly: ${routingAnomaly}`);
    }
  }

  let existingAccounts = [];
  let existingTicketIds = [];
  let ghIssueNumber = null;
  let clusterId = `cluster_${currentTicket.id}`;

  if (existingCluster) {
  existingAccounts = existingCluster.accounts
    ? existingCluster.accounts.split(",").filter(Boolean)
    : [];

  existingTicketIds = existingCluster.ticket_ids
    ? existingCluster.ticket_ids.split(",").filter(Boolean)
    : [];

  ghIssueNumber = existingCluster.github_issue_number || null;
  clusterId = existingCluster.cluster_id || clusterId;
}

  // Use Zendesk requester_id as account identifier
  const accountId = currentTicket.requester_id
    ? currentTicket.requester_id.toString()
    : (
        currentTicket.submitter_id
          ? currentTicket.submitter_id.toString()
          : "unknown"
      );

  const updatedAccounts = [
    ...new Set([...existingAccounts, accountId])
  ];

  const updatedTicketIds = [
    ...new Set([
      ...existingTicketIds,
      String(currentTicket.id)
    ])
  ];

  // Severity
  let severity = "P4";

  if (updatedAccounts.length >= 7) severity = "P1";
  else if (updatedAccounts.length >= 4) severity = "P2";
  else if (updatedAccounts.length >= 2) severity = "P3";

  let finalAction = "hold";

  if (routingAnomaly) {
    finalAction = "hold";
  }

  else if (route === "update_cluster" && !existingCluster) {
    console.warn("Inconsistent state.");
    finalAction = "hold";
  }

  else if (route === "hold") {
    finalAction = "hold";
  }

  else if (route === "create_singleton") {
    finalAction = "index_singleton";
  }
else if (route === "update_cluster") {

  if (ghIssueNumber === null && updatedAccounts.length < 2) {
    finalAction = "update_singleton";
  }

  else if (ghIssueNumber === null) {
    finalAction = "create";
  }

  else {
    finalAction = "update";
  }
}

  output = {
    final_route: finalAction,
    severity: severity,
    cluster_id: clusterId,
    gh_issue_number: ghIssueNumber,
    updated_accounts: updatedAccounts.join(","),
    updated_ticket_ids: updatedTicketIds.join(",")
  };

})();