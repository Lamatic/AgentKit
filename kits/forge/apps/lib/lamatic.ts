export async function callFlow(flowId: string, payload: Record<string, string>) {
  const res = await fetch('/api/flow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ flowId, payload }),
  });
  if (!res.ok) throw new Error('Flow call failed');
  return res.json();
}
