/* KB Conflict Auditor - Code Node 2: verify the LLM's verdicts.
 * The LLM advises; this code decides what is trusted.
 * Authority comes from dates, patches must quote text that really exists, unknown IDs are dropped.
 */
const SEVERITIES = ['Critical', 'High', 'Medium', 'Low'];
const norm = (s) => String(s || '').replace(/\s+/g, ' ').trim().toLowerCase();

function toValue(raw) {
  if (typeof raw !== 'string') return raw;
  const t = raw.replace(/^\s*```(?:json)?/i, '').replace(/```\s*$/, '').trim();
  try { return JSON.parse(t); } catch (e) { return null; }
}

function toResults(llmRaw) {
  const v = toValue(llmRaw);
  if (Array.isArray(v)) return v;
  if (v && typeof v === 'object') {
    const r = toValue(v.results);
    return Array.isArray(r) ? r : [];
  }
  return [];
}

const kind = (v) => (Array.isArray(v) ? 'array' : v === null ? 'null' : typeof v);

function verify(llmRaw, candidatesRaw, documentsRaw) {
  const candidatesV = toValue(candidatesRaw);
  const docsV = toValue(documentsRaw);
  const candidates = Array.isArray(candidatesV) ? candidatesV : [];
  const docs = Array.isArray(docsV) ? docsV : [];
  const results = toResults(llmRaw);

  const byId = new Map(candidates.map((c) => [c.id, c]));
  const content = new Map(docs.map((d) => [d.path, String(d.content || '')]));
  const stats = { candidates: candidates.length, judged: results.length, confirmed: 0, dismissed: 0, discarded_unknown: 0, authority_overridden: 0, patches_withheld: 0 };
  const findings = [];
  const seen = new Set();

  for (const r of results) {
    const c = byId.get(r && r.candidate_id);
    if (!c) { stats.discarded_unknown++; continue; }
    if (seen.has(c.id)) continue;
    seen.add(c.id);
    if (!r.is_real_conflict) { stats.dismissed++; continue; }

    const dated = c.docA.date && c.docB.date && c.docA.date !== c.docB.date;
    const authority = dated ? (c.docA.date > c.docB.date ? c.docA.path : c.docB.path) : 'unclear';
    const overridden = r.authoritative_source !== authority;
    if (overridden) stats.authority_overridden++;
    const stale = authority === 'unclear' ? '' : (authority === c.docA.path ? c.docB.path : c.docA.path);

    const p = r.suggested_patch || {};
    let patch = null;
    let patchNote = '';
    if (authority === 'unclear') patchNote = 'No patch: dates do not settle which document is right. A human must decide.';
    else if (p.file_to_update !== stale) patchNote = 'Patch withheld: it did not target the outdated file.';
    else if (
      typeof p.current_text !== 'string' ||
      !p.current_text.trim() ||
      !content.get(stale)?.includes(p.current_text) ||
      !String(stale === c.docA.path ? c.docA.text : c.docB.text).includes(p.current_text)
    ) patchNote = 'Patch withheld: the exact quoted text was not found on the conflicting line in the file.';
    else if (typeof p.replacement_text !== 'string' || !p.replacement_text.trim()) patchNote = 'Patch withheld: no replacement text was suggested.';
    else patch = { file_to_update: stale, current_text: p.current_text, replacement_text: p.replacement_text };
    if (!patch) stats.patches_withheld++;

    stats.confirmed++;
    findings.push({
      id: c.id,
      key: c.key,
      severity: SEVERITIES.includes(r.severity) ? r.severity : 'Medium',
      summary: r.conflict_summary || '',
      authoritative_source: authority,
      authority_basis: dated ? 'newer last_updated date' : 'undetermined',
      authority_overridden: overridden,
      reasoning: r.reasoning || '',
      evidence: { docA: c.docA, docB: c.docB },
      patch,
      patch_note: patchNote,
    });
  }
  findings.sort((a, b) => SEVERITIES.indexOf(a.severity) - SEVERITIES.indexOf(b.severity));
  return {
    findings,
    findings_json: JSON.stringify(findings),
    stats,
    debug: { llm_input: kind(llmRaw), candidates_input: kind(candidatesRaw), documents_input: kind(documentsRaw) },
  };
}

// ---- Studio adapter ----
const llmRaw = {{InstructorLLMNode_148.output.results}};
const candidatesRaw = {{codeNode_344.output.candidates_json}};
const documentsRaw = {{triggerNode_1.output.documents_json}};
output = verify(llmRaw, candidatesRaw, documentsRaw);