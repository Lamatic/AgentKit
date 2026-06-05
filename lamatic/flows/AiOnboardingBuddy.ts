const flowConfig = {
  "id": "6b527c8d-3cc2-4ad0-abfd-2787b9d37252",
  "name": "Ai Onboarding Buddy",
  "edges": [],
  "status": "active",
  "created_at": "2026-06-05T11:37:38.228956+00:00",
  "trigger_id": null,
  "nodes": [
    {
      "id": "triggerNode_1",
      "data": {},
      "type": "triggerNode",
      "position": {
        "x": 0,
        "y": 0
      }
    }
  ]
};

export async function getNodesAndEdges(): Promise<{
    nodes: Record<string, any>[],
    edges: Record<string, any>[],
}> {
    return {
        nodes: flowConfig.nodes,
        edges: flowConfig.edges,
    }
}

export async function getFlowConfig(): Promise<Record<string, any>> {
    return flowConfig;
}