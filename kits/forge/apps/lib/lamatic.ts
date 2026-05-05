export async function callFlow(flowId: string, payload: Record<string, string>) {
  const res = await fetch('/api/flow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ flowId, payload }),
  });
  if (!res.ok) {
    let message = 'Flow call failed';
    try {
      const body = await res.json();
      if (body && typeof body.error === 'string' && body.error.trim()) {
        message = `Flow call failed: ${body.error}`;
      }
    } catch {
      // Ignore parse errors and keep the generic fallback message.
    }
    throw new Error(message);
  }
  return res.json();
}
