// Code: Context Assembly (Browser Use)
// Flow: interview-prep-generator
//
// This is the flow's "browser use" arm: it runs a hosted Browser Use v4
// agent (https://docs.browser-use.com) against the open web to gather live,
// factual context about the target company's interview process and
// engineering culture - official careers page, engineering blog, recent
// news - as an independent research source alongside the Fact Lookup
// (Tavily search) branch. The Supervisor can reach for structured search,
// live browsing, or both; Merge Research Context (codeNode_729) combines
// whatever came back before it reaches the generation prompt.
//
// Requires the Lamatic secret BROWSER_USE_API_KEY (see README / agent.md).
// If the secret is missing, the API errors, or the run doesn't finish
// within the poll budget, this node fails soft: it returns an empty
// context summary rather than throwing, so the pipeline still produces an
// interview prep kit without live company research.
//
// ASSUMPTION FLAGGED FOR LIVE VERIFICATION: this relies on the Lamatic
// codeNode runtime supporting `fetch` and top-level `await`. If the
// runtime doesn't allow outbound network calls from codeNode, move this
// logic to a small external proxy and call it from an apiNode instead.

const companyName = `{{triggerNode_1.output.company_name}}`.trim();

const BROWSER_USE_API_KEY = `{{secrets.BROWSER_USE_API_KEY}}`;
const BASE_URL = 'https://api.browser-use.com/api/v4';
const POLL_INTERVAL_MS = 4000;
const MAX_POLLS = 12; // ~48s wall-clock budget
const MODEL = 'gpt-5.6-luna';

async function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runBrowserUseTask(task) {
    const createRes = await fetch(`${BASE_URL}/runs`, {
          method: 'POST',
          headers: {
                  'X-Browser-Use-API-Key': BROWSER_USE_API_KEY,
                  'Content-Type': 'application/json'
          },
          body: JSON.stringify({ task, model: MODEL })
    });

  if (!createRes.ok) {
        throw new Error(`create run failed: ${createRes.status}`);
  }

  const created = await createRes.json();
    const runId = created.id || created.run_id;
    if (!runId) throw new Error('create run response had no run id');

  for (let i = 0; i < MAX_POLLS; i++) {
        await sleep(POLL_INTERVAL_MS);

      const statusRes = await fetch(`${BASE_URL}/runs/${runId}/status`, {
              headers: { 'X-Browser-Use-API-Key': BROWSER_USE_API_KEY }
      });
        if (!statusRes.ok) continue;

      const statusBody = await statusRes.json();
        const status = statusBody.status;

      if (status === 'completed') {
              const fullRes = await fetch(`${BASE_URL}/runs/${runId}`, {
                        headers: { 'X-Browser-Use-API-Key': BROWSER_USE_API_KEY }
              });
              if (!fullRes.ok) throw new Error(`fetch run failed: ${fullRes.status}`);
              const full = await fullRes.json();
              return full.result || full.output || '';
      }

      if (status === 'failed' || status === 'cancelled') {
              throw new Error(`run ended with status ${status}`);
      }
  }

  throw new Error('polling budget exhausted before run finished');
}

if (!companyName) {
    output = { contextSummary: '', source: 'none', skipped: true, error: '' };
} else if (!BROWSER_USE_API_KEY) {
    output = { contextSummary: '', source: 'none', skipped: true, error: 'BROWSER_USE_API_KEY not configured' };
} else {
    try {
          const task = `Research ${companyName}'s software engineering interview process and engineering culture using only publicly accessible pages (official careers page, engineering blog, and similar). Summarize in under 200 words, factual only, no speculation: (1) known interview stages or format, (2) engineering culture and stated values, (3) any relevant company news from the last 12 months. If you can't find reliable public information, say so plainly instead of guessing.`;

      const result = await runBrowserUseTask(task);

      output = {
              contextSummary: typeof result === 'string' ? result : JSON.stringify(result),
              source: 'browser-use',
              skipped: false,
              error: ''
      };
    } catch (e) {
          output = {
                  contextSummary: '',
                  source: 'none',
                  skipped: false,
                  error: String(e && e.message ? e.message : e)
          };
    }
}
