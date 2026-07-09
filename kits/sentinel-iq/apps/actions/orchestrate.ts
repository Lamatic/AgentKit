"use server";

import { lamaticConfig, getFlowId } from "../lib/lamatic-client";

export async function triageAlert(alertText: string) {
  const flowId = getFlowId("sentinel-triage");

  const res = await fetch(`${lamaticConfig.apiUrl}/v1/flows/${flowId}/execute`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${lamaticConfig.apiKey}`
    },
    body: JSON.stringify({ alert_text: alertText })
  });

  if (!res.ok) throw new Error(`Flow execution failed: ${res.status}`);
  return res.json();
}