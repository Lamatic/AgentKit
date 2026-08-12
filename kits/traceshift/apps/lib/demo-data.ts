import Papa from "papaparse";

type DemoRow = Record<string, string | number>;

const iso = (base: number, seconds: number) => new Date(base + seconds * 1000).toISOString();

export function generateDemoCsv(): string {
  const rows: DemoRow[] = [];
  const base = Date.parse("2026-08-01T10:00:00.000Z");
  const products = ["sku-A", "sku-B", "sku-C", "sku-D"];

  for (let runIndex = 0; runIndex < 32; runIndex += 1) {
    const requestId = `demo-request-${String(runIndex + 1).padStart(2, "0")}`;
    const startedAt = base + runIndex * 60_000;
    const failed = runIndex >= 29;
    const alternate = runIndex >= 24;
    const product = products[runIndex % products.length];
    const route = alternate ? "policy" : "catalog";
    const totalSeconds = failed ? 1.05 : alternate ? 4.35 : 6.15 + (runIndex % 3) * 0.18;

    rows.push({
      id: `${requestId}-start`,
      requestId,
      workflowId: "wf-traceshift-demo",
      workflowName: "Commerce Support Agent",
      event_message: "StartedExecution",
      status: "200",
      timestamp: iso(startedAt, 0),
      timeTakenSeconds: "0",
      severity_text: "INFO",
    });

    rows.push({
      id: `${requestId}-router`,
      requestId,
      workflowId: "wf-traceshift-demo",
      workflowName: "Commerce Support Agent",
      event_message: "NodeExecution",
      nodeSlug: "intent-router",
      nodeName: "Intent Router",
      nodeId: "LLMNode",
      status: "200",
      timestamp: iso(startedAt, 0.2),
      timeTakenSeconds: "0.72",
      input: JSON.stringify({ message: `Question ${runIndex + 1}`, product }),
      output: JSON.stringify({ route }),
      model_usage: JSON.stringify({ prompt_tokens: 75, completion_tokens: 5, total_tokens: 80 }),
      model_cost: JSON.stringify({ total_cost: 0.0006 }),
      severity_text: "INFO",
    });

    if (!alternate && !failed) {
      rows.push({
        id: `${requestId}-catalog`,
        requestId,
        workflowId: "wf-traceshift-demo",
        workflowName: "Commerce Support Agent",
        event_message: "NodeExecution",
        nodeSlug: "catalog-lookup",
        nodeName: "Catalog Lookup",
        nodeId: "ToolNode",
        status: "200",
        timestamp: iso(startedAt, 1.1),
        timeTakenSeconds: "1.75",
        input: JSON.stringify({ product }),
        output: JSON.stringify({ product, stock: product === "sku-D" ? 0 : 18, currency: "USD" }),
        model_usage: "{}",
        model_cost: "{}",
        severity_text: "INFO",
      });
    }

    if (alternate && !failed) {
      rows.push({
        id: `${requestId}-policy`,
        requestId,
        workflowId: "wf-traceshift-demo",
        workflowName: "Commerce Support Agent",
        event_message: "NodeExecution",
        nodeSlug: "policy-check",
        nodeName: "Policy Check",
        nodeId: "codeNode",
        status: "200",
        timestamp: iso(startedAt, 1.1),
        timeTakenSeconds: "0.28",
        input: JSON.stringify({ region: runIndex % 2 ? "US" : "EU" }),
        output: JSON.stringify({ eligible: true }),
        model_usage: "{}",
        model_cost: "{}",
        severity_text: "INFO",
      });
    }

    if (!failed) {
      rows.push({
        id: `${requestId}-draft`,
        requestId,
        workflowId: "wf-traceshift-demo",
        workflowName: "Commerce Support Agent",
        event_message: "NodeExecution",
        nodeSlug: "draft-answer",
        nodeName: "Draft Answer",
        nodeId: "LLMNode",
        status: "200",
        timestamp: iso(startedAt, 3.05),
        timeTakenSeconds: alternate ? "3.05" : "3.68",
        input: JSON.stringify({ route, product, questionId: runIndex + 1 }),
        output: JSON.stringify({ answer: `Grounded response ${runIndex + 1} for ${product}` }),
        model_usage: JSON.stringify({ prompt_tokens: 420, completion_tokens: 80, total_tokens: 500 }),
        model_cost: JSON.stringify({ total_cost: 0.0048 }),
        severity_text: "INFO",
      });
    }

    rows.push({
      id: `${requestId}-finish`,
      requestId,
      workflowId: "wf-traceshift-demo",
      workflowName: "Commerce Support Agent",
      event_message: "FinishedExecution",
      status: failed ? "500" : "200",
      timestamp: iso(startedAt, totalSeconds),
      timeTakenSeconds: String(totalSeconds),
      severity_text: failed ? "ERROR" : "INFO",
      output: failed ? JSON.stringify({ error: "Synthetic upstream timeout" }) : "{}",
    });
  }

  return Papa.unparse(rows, {
    columns: [
      "id",
      "requestId",
      "workflowId",
      "nodeSlug",
      "nodeName",
      "nodeId",
      "status",
      "workflowName",
      "timeTakenSeconds",
      "event_message",
      "timestamp",
      "severity_text",
      "input",
      "output",
      "model_usage",
      "model_cost",
    ],
  });
}
