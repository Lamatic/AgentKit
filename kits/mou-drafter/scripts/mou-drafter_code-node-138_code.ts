// Code: Assemble LaTeX
// Flow: mou-drafter
//
// Final code node before the response. This script:
//   - parses the LLM's JSON output (tolerant of markdown fences and stray prose)
//   - LaTeX-escapes every user-supplied scalar (party names, addresses, etc.)
//     before token substitution (defends against \input{}, \write18, etc.)
//   - selectively escapes stray & $ _ # % in model-produced clause prose
//     while preserving intended LaTeX commands (\textsc{}, \begin{}, etc.)
//     and % PATTERN: verification anchors
//   - scrubs dangerous primitives from the model-produced LaTeX (clauses,
//     recitals, signature block) — pdfTeX in SwiftLaTeX runs without shell-escape
//     but stripping these still guards against document corruption
//   - fills a hand-maintained LaTeX template (inlined per PLAN.md §18 risk #2)
//   - computes the *expected* set of pattern anchors from the gating rules in
//     PLAN.md §8, then greps the rendered LaTeX for `% PATTERN:<anchor>` comments
//     and emits warnings for expected-but-missing and unexpected-but-present
//   - merges upstream warnings (from validate-input) with assembly warnings
//   - returns { latex, clauseJson, warnings, patternReport } for the response node
//
// Placeholder node IDs (codeNode_validate_input, LLMNode_clause_generator) must
// be reconciled to actual Studio node IDs after export. See validate-input.ts
// for the same caveat.

// ── Inputs from upstream nodes ───────────────────────────────────────────
let v = {{codeNode_316.output}};
let llmRaw = {{LLMNode_842.output.generatedResponse}};

if (typeof v !== 'object' || v === null) { v = {}; }

let upstreamWarnings = Array.isArray(v.warnings) ? v.warnings.slice() : [];
let warnings = upstreamWarnings.slice();

// ── Parse LLM JSON, tolerant of fences and stray prose ──────────────────
function parseClauseJson(raw) {
  if (raw && typeof raw === 'object') return raw;
  if (typeof raw !== 'string') return null;
  let cleaned = raw.replace(/```json/gi, '').replace(/```/g, '').trim();

  // Defend against LLMs that underescape backslashes for multi-letter LaTeX
  // commands. Gemini Flash emits `\textsc{}` with only 1 backslash, which
  // JSON.parse interprets as TAB + `extsc{}` (because `\t` is the JSON tab
  // escape). This silently corrupts every defined-term marker in the output.
  //
  // Rule: any backslash NOT already preceded by a backslash, followed by 2+
  // letters, is treated as an under-escaped LaTeX command and double-escaped.
  // - `\textsc`  → `\\textsc`  → JSON.parse → `\textsc`  (correct)
  // - `\\begin`  → unchanged   → JSON.parse → `\begin`   (correct)
  // - `\n`, `\t` standalone → 1 letter only, not matched → JSON escape kept
  // Repair under-escaped LaTeX commands, but ONLY a known whitelist. A broad
  // \\[a-zA-Z]{2,} rule wrongly catches JSON escapes like \n when immediately
  // followed by a word (e.g. "\nEach"), doubling it into a literal \n that
  // breaks the LaTeX compile. The whitelist leaves \n (newline) alone while
  // still repairing \textsc, \begin, etc. when the model under-escapes them.
  let LATEX_CMDS = 'textsc|textbf|textit|emph|begin|end|item|vspace|rule|noindent|hfill|newline|section|textbackslash|textasciitilde|textasciicircum';
  let cmdRe = new RegExp('(?<!\\\\)\\\\(' + LATEX_CMDS + ')', 'g');
  cleaned = cleaned.replace(cmdRe, '\\\\$1');

  let start = cleaned.indexOf('{');
  let end = cleaned.lastIndexOf('}');
  if (start === -1 || end === -1) return null;
  let sliced = cleaned.substring(start, end + 1);
  try { return JSON.parse(sliced); } catch (e1) {
    try {
      let escaped = sliced.replace(/\r/g, '').replace(/\n/g, '\\n');
      return JSON.parse(escaped);
    } catch (e2) { return null; }
  }
}

let clauseJson = parseClauseJson(llmRaw);
if (!clauseJson) {
  warnings.push('FATAL: LLM output could not be parsed as JSON. Returning raw output as latex field for debugging.');
  clauseJson = { recitals: '', definitions: [], clauses: {}, signatureBlock: '', metadata: {} };
}

// ── Contract check: clauses MUST be an OBJECT keyed by anchor strings ──
// Arrays are also typeof 'object' in JS, so without this check the script
// silently iterates array indices ("0", "1", ...) as keys via for...in,
// produces clauseKey("0") = "0", and pattern verification reports all 13
// expected anchors missing while the API response looks superficially OK.
// This is the single most consequential contract violation; flag it loudly
// so the symptom matches the cause. The system prompt is the primary
// enforcement — this is the backstop when the model defaults to array shape.
if (clauseJson && Array.isArray(clauseJson.clauses)) {
  warnings.push(
    'FATAL: LLM emitted `clauses` as an ARRAY, but the contract requires an OBJECT ' +
    'keyed by anchor strings (e.g. "payment-milestones", "acceptance-window"). ' +
    'Pattern verification will report all expected clauses missing because array ' +
    'indices (0, 1, 2, ...) do not match any anchor. Fix the system prompt to ' +
    'emit `clauses: { "<anchor>": "<text>", ... }` not `clauses: [...]`. ' +
    'See PLAN.md §7 (JSON schema) and §8 (anchor names).'
  );
}

// Model may emit an explicit refusal payload — surface it and stop assembly.
// NOTE: The early `return;` assumes the script body is wrapped in a function at
// runtime. founder-lens makes the same assumption. Will verify in smoke-test.
if (clauseJson && clauseJson.error) {
  output = {
    latex: '% LLM refused to draft. See clauseJson.error.',
    clauseJson: clauseJson,
    warnings: warnings.concat(['LLM refused to draft: ' + String(clauseJson.error)]),
    patternReport: { expected: [], found: [], missing: [], unexpected: [] }
  };
  return;
}

// ── LaTeX escape for user-supplied scalars ──────────────────────────────
function texEscape(v) {
  if (v == null) return '';
  let s = (typeof v === 'string') ? v : String(v);
  // Order matters: replace backslash first so subsequent escapes don't double up.
  s = s.replace(/\\/g, '\\textbackslash{}');
  s = s.replace(/\{/g, '\\{');
  s = s.replace(/\}/g, '\\}');
  s = s.replace(/&/g, '\\&');
  s = s.replace(/%/g, '\\%');
  s = s.replace(/\$/g, '\\$');
  s = s.replace(/#/g, '\\#');
  s = s.replace(/_/g, '\\_');
  s = s.replace(/\^/g, '\\textasciicircum{}');
  s = s.replace(/~/g, '\\textasciitilde{}');
  return s;
}

// ── Scrub model-produced LaTeX for dangerous primitives ─────────────────
// SwiftLaTeX pdfTeX runs with no-shell-escape so \write18 is inert, but
// stripping these still prevents document corruption and silent file access.
// The 30s compile timeout in useLatexCompile.ts is the backstop for hang
// macros (\loop \iftrue \repeat); scrubbing is the first defense.
let DANGEROUS_MACROS = [
  '\\write18', '\\write 18',
  '\\input ', '\\input{',
  '\\include{', '\\include ',
  '\\InputIfFileExists',
  '\\openout', '\\openin', '\\read',
  '\\catcode',
  '\\immediate\\write',
  '\\immediate\\write18',
  '\\directlua', '\\luaexec',
  '\\loop', '\\iftrue', '\\repeat',
  '\\def', '\\csname'
];

function scrubModelLatex(text) {
  if (typeof text !== 'string') return '';
  let scrubbed = text;
  let removedAny = false;
  for (let i = 0; i < DANGEROUS_MACROS.length; i++) {
    let macro = DANGEROUS_MACROS[i];
    if (scrubbed.indexOf(macro) !== -1) {
      // Replace with a visible LaTeX comment so the operator can see what happened
      let safe = scrubbed.split(macro).join('% [SCRUBBED: dangerous macro removed]');
      scrubbed = safe;
      removedAny = true;
    }
  }
  if (removedAny) {
    warnings.push('Model output contained one or more LaTeX primitives that were removed during assembly (\\input/\\write18/\\catcode/\\loop/\\def/etc.). Check the rendered .tex for [SCRUBBED] markers.');
  }
  return scrubbed;
}

// ── Selective LaTeX escape for model-emitted clause prose ───────────────
// Model prose may contain stray & $ _ # % chars (e.g. "at least &10,000"
// when the model hallucinated & for $). We must escape those, but preserve:
//   - \textsc{...}, \textbf{...}, \textit{...}, \emph{...} — command syntax
//     preserved, but content INSIDE the braces is still escaped (so
//     \textsc{Vendor & Client} → \textsc{Vendor \& Client})
//   - % PATTERN:<anchor> (verification comments) — preserved entirely
//   - Structural commands: \begin{...}, \end{...}, \vspace{...}, \rule{...}{...}
//     — command AND braced content preserved (env names, lengths)
//   - Bare commands: \item, \item[...], \noindent, \hfill, \\, \newline
//
// Implementation: character-by-character linear parser, no regex split.
// We only escape the five dangerous chars (& $ _ # %) — backslashes and
// braces are left alone so that LaTeX commands the model emits (including
// ones we don't explicitly whitelist) survive.

function texEscapeModelProse(text) {
  if (typeof text !== 'string') return '';

  // Normalize over-escaped newlines. Gemini Flash intermittently emits \\n
  // (which JSON-parses to a literal \n) instead of \n (a real newline). A
  // literal \n that is NOT the start of \noindent or \newline is a botched
  // newline; convert it to an actual newline so the .tex doesn't contain an
  // undefined control sequence that kills the pdflatex compile.
  // The negative lookahead protects \noindent and \newline — the only
  // whitelisted commands that begin with \n.
  text = text.replace(/\\n(?!oindent|ewline)/g, '\n');

  // Convert straight double-quotes to LaTeX directional quotes.
  // The model reliably emits " for defined-term references like "Engager"
  // rather than LaTeX's ``...'' convention. A straight " in pdfTeX renders
  // as a diaeresis accent on the next character (e.g. "E → \u00cbngager),
  // which is a visible bug in every recital and clause the model writes.
  // Strategy: replace "word" with ``word''. We use a simple open/close
  // alternation — even-numbered occurrences are opening quotes, odd are
  // closing — which is correct for well-formed prose (no nested quotes).
  // This runs AFTER the \n normaliser so we operate on clean text.
  (function () {
    var count = 0;
    text = text.replace(/"/g, function () {
      return (count++ % 2 === 0) ? '``' : "''";
    });
  })();

  // Commands whose braced content is model prose → escape content
  let PROSE_CMDS = ['\\textsc', '\\textbf', '\\textit', '\\emph'];
  // Commands whose braced content is structural (env names, lengths) → preserve
  let STRUCT_CMDS = ['\\begin', '\\end', '\\vspace', '\\rule'];
  // Commands with no brace argument to consume
  let BARE_CMDS = ['\\noindent', '\\hfill', '\\newline'];

  // Escape the five dangerous chars in a plain string
  function escFive(s) {
    let out = '';
    for (let j = 0; j < s.length; j++) {
      var ch = s[j];
      if (ch === '&') { out += '\\&'; }
      else if (ch === '$') { out += '\\$'; }
      else if (ch === '_') { out += '\\_'; }
      else if (ch === '#') { out += '\\#'; }
      else if (ch === '%') {
        // % at start-of-line is a LaTeX comment — preserve
        if (j === 0 || s[j - 1] === '\n') { out += '%'; }
        else { out += '\\%'; }
      }
      else { out += ch; }
    }
    return out;
  }

  // Extract braced content starting at text[pos] === '{', respecting depth.
  // Returns { content: string, end: number } where end is index AFTER '}'.
  function extractBraced(pos) {
    if (pos >= text.length || text[pos] !== '{') return null;
    var depth = 1;
    var k = pos + 1;
    while (k < text.length && depth > 0) {
      if (text[k] === '{') depth++;
      else if (text[k] === '}') depth--;
      k++;
    }
    return { content: text.substring(pos + 1, k - 1), end: k };
  }

  // Check if text starting at pos matches a string prefix
  function startsWith(pos, str) {
    if (pos + str.length > text.length) return false;
    return text.substring(pos, pos + str.length) === str;
  }

  var result = '';
  var i = 0;

  while (i < text.length) {
    // ── % PATTERN: comment at start of line → preserve entire line ──
    if (text[i] === '%' && (i === 0 || text[i - 1] === '\n')) {
      var lineEnd = text.indexOf('\n', i);
      if (lineEnd === -1) lineEnd = text.length;
      var line = text.substring(i, lineEnd);
      if (/^%\s*PATTERN:[a-z0-9-]+/.test(line)) {
        result += line;
        i = lineEnd;
        continue;
      }
      // Regular % at start of line → LaTeX comment, preserve
      result += '%';
      i++;
      continue;
    }

    // ── \\ (line break) → preserve ──
    // ── Already-escaped LaTeX special: \% \& \# \$ \_ \{ \} → preserve as-is ──
    // The model correctly escapes these for LaTeX. Without this branch, the
    // generic backslash handler preserves the backslash and the char handler
    // re-escapes the symbol, producing \\% (line break + comment) from \%.
    if (text[i] === '\\' && i + 1 < text.length && '%&#$_{}'.indexOf(text[i + 1]) !== -1) {
      result += '\\' + text[i + 1];
      i += 2;
      continue;
    }

    // ── \item with optional [...] → preserve ──
    if (startsWith(i, '\\item')) {
      result += '\\item';
      i += 5;
      if (i < text.length && text[i] === '[') {
        var close = text.indexOf(']', i);
        if (close !== -1) {
          result += text.substring(i, close + 1);
          i = close + 1;
        }
      }
      continue;
    }

    // ── Backslash commands ──
    if (text[i] === '\\') {
      var found = false;

      // Prose commands: preserve command, escape braced content
      for (var p = 0; p < PROSE_CMDS.length; p++) {
        var cmd = PROSE_CMDS[p];
        if (startsWith(i, cmd)) {
          var afterCmd = i + cmd.length;
          var braced = extractBraced(afterCmd);
          if (braced) {
            result += cmd + '{' + escFive(braced.content) + '}';
            i = braced.end;
            found = true;
            break;
          }
        }
      }
      if (found) continue;

      // Structural commands: preserve command AND braced content as-is
      for (var s = 0; s < STRUCT_CMDS.length; s++) {
        var cmd = STRUCT_CMDS[s];
        if (startsWith(i, cmd)) {
          result += cmd;
          i += cmd.length;
          // Consume successive {...} groups (e.g. \rule{6em}{0.4pt})
          while (i < text.length && text[i] === '{') {
            var braced = extractBraced(i);
            if (braced) {
              result += '{' + braced.content + '}';
              i = braced.end;
            } else {
              break;
            }
          }
          found = true;
          break;
        }
      }
      if (found) continue;

      // Bare commands: preserve
      for (var b = 0; b < BARE_CMDS.length; b++) {
        if (startsWith(i, BARE_CMDS[b])) {
          result += BARE_CMDS[b];
          i += BARE_CMDS[b].length;
          found = true;
          break;
        }
      }
      if (found) continue;

      // Unknown backslash sequence — preserve the backslash (likely a LaTeX
      // command we don't know about; escaping it would break the document)
      result += '\\';
      i++;
      continue;
    }

    // ── Regular character — escape if special ──
    if (text[i] === '&') { result += '\\&'; i++; continue; }
    if (text[i] === '$') { result += '\\$'; i++; continue; }
    if (text[i] === '_') { result += '\\_'; i++; continue; }
    if (text[i] === '#') { result += '\\#'; i++; continue; }
    if (text[i] === '%') { result += '\\%'; i++; continue; }

    // Everything else passes through
    result += text[i];
    i++;
  }

  return result;
}

// ── Compute expected pattern anchors from gating rules (PLAN.md §8) ─────
// IMPORTANT: These gating rules are duplicated in English in the system prompt
// (prompts/mou-drafter_clause-generator_system.md). If you change a gating
// condition here, you MUST update the prompt's pattern checklist to match,
// and vice versa. See PLAN.md §8 for the canonical table.
let PATTERN_ALL = [
  'event-logistics',
  'payment-milestones',
  'taxes-and-fees',
  'cancellation-charges',
  'guest-count-adjustments',
  'food-safety-compliance',
  'allergen-handling',
  'acceptance-window',
  'liquidated-damages',
  'indemnity-mutual-cap',
  'liability-cap',
  'ip-work-for-hire',
  'termination-dual',
  'force-majeure-carveouts',
  'confidentiality-survival',
  'no-subcontract-consent',
  'insurance-named-insured',
  'data-protection-dpa-lite',
  'modifications-in-writing',
  'governing-law-venue-severability',
  'no-publicity'
];

function computeExpectedPatterns(p) {
  let expected = {};
  // Mandatory always
  expected['acceptance-window'] = 1;
  expected['indemnity-mutual-cap'] = 1;
  expected['liability-cap'] = 1;
  expected['termination-dual'] = 1;
  expected['force-majeure-carveouts'] = 1;
  expected['modifications-in-writing'] = 1;
  expected['governing-law-venue-severability'] = 1;
  expected['taxes-and-fees'] = 1; // always — every contract has tax treatment
  // payment-milestones: applies if schedule != lump-sum
  if (p.paymentSchedule !== 'lump-sum') expected['payment-milestones'] = 1;
  // liquidated-damages: only us-canada jurisdiction family
  if (p.jurisdictionFamily === 'us-canada') expected['liquidated-damages'] = 1;
  // ip-work-for-hire: only when ipOwnership is meaningful
  if (p.ipOwnership && p.ipOwnership !== 'not-applicable') expected['ip-work-for-hire'] = 1;
  // confidentiality-survival: when confidentiality required
  if (p.confidentialityRequired) expected['confidentiality-survival'] = 1;
  // no-subcontract-consent: when subcontracting is NOT allowed
  if (p.subcontractingAllowed === false) expected['no-subcontract-consent'] = 1;
  // insurance-named-insured: when insurance required
  if (p.insuranceRequired) expected['insurance-named-insured'] = 1;
  // data-protection-dpa-lite: when data-protection required
  if (p.dataProtectionRequired) expected['data-protection-dpa-lite'] = 1;
  // no-publicity: when no-publicity required
  if (p.noPublicityRequired) expected['no-publicity'] = 1;
  // cancellation-charges: any policy other than 'none'
  if (p.cancellationPolicy && p.cancellationPolicy !== 'none') expected['cancellation-charges'] = 1;
  // guest-count-adjustments: catering with either a final-date or extra-guest rate
  if (p.engagementType === 'catering' && (p.guestCountFinalDate || (p.extraGuestRate && p.extraGuestRate > 0))) {
    expected['guest-count-adjustments'] = 1;
  }
  // food-safety-compliance
  if (p.foodSafetyRequired) expected['food-safety-compliance'] = 1;
  // allergen-handling
  if (p.allergyHandlingRequired) expected['allergen-handling'] = 1;
  // event-logistics: event-type engagements with at least a start date or venue
  let eventTypes = { 'venue': 1, 'catering': 1, 'av-equipment': 1, 'photography': 1 };
  if (eventTypes[p.engagementType] && (p.eventStart || p.eventVenue)) {
    expected['event-logistics'] = 1;
  }
  let arr = [];
  for (let k in expected) { arr.push(k); }
  return arr;
}

let expectedPatterns = computeExpectedPatterns(v);

// ── Build CLAUSES_BLOCK and DEFINITIONS_BLOCK from clauseJson ───────────
function clauseTitleFromAnchor(anchor) {
  // Friendly fallback titles if the model didn't supply a title key
  let map = {
    'event-logistics': 'Event Logistics',
    'payment-milestones': 'Payment and Milestones',
    'taxes-and-fees': 'Taxes and Late Payment',
    'cancellation-charges': 'Cancellation Charges',
    'guest-count-adjustments': 'Guest Count Adjustments',
    'food-safety-compliance': 'Food Safety and Licensing',
    'allergen-handling': 'Allergen and Dietary Handling',
    'acceptance-window': 'Acceptance Criteria',
    'liquidated-damages': 'Late Delivery Credits',
    'indemnity-mutual-cap': 'Mutual Indemnification',
    'liability-cap': 'Limitation of Liability',
    'ip-work-for-hire': 'Intellectual Property',
    'termination-dual': 'Termination',
    'force-majeure-carveouts': 'Force Majeure',
    'confidentiality-survival': 'Confidentiality',
    'no-subcontract-consent': 'Subcontracting',
    'insurance-named-insured': 'Insurance',
    'data-protection-dpa-lite': 'Data Protection',
    'modifications-in-writing': 'Modifications',
    'governing-law-venue-severability': 'Governing Law and Dispute Resolution',
    'no-publicity': 'Publicity and Use of Name'
  };
  return map[anchor] || anchor;
}

// The model may emit clauses keyed by anchor or by camelCase. Normalise.
function clauseKey(k) {
  return String(k).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

let clausesByAnchor = {};
let llmClauses = (clauseJson && typeof clauseJson.clauses === 'object' && clauseJson.clauses !== null) ? clauseJson.clauses : {};
for (let rawKey in llmClauses) {
  let normKey = clauseKey(rawKey);
  clausesByAnchor[normKey] = llmClauses[rawKey];
}

// ── Pattern-anchor verification (PLAN.md §13 layer 3) ───────────────────
// Run BEFORE building clausesBlock and warningsBanner so that pattern
// warnings appear in the PDF's drafting-notes section, not just the API response.
// Since the defensive anchor insertion (below) guarantees that every clause key
// in JSON gets a % PATTERN:<anchor> comment in rendered LaTeX, checking JSON
// keys gives identical semantics to grepping the rendered document.
let foundPatterns = {};
for (let k in clausesByAnchor) {
  foundPatterns[k] = 1;
}
let foundList = [];
for (let k in foundPatterns) foundList.push(k);

let missing = [];
for (let i = 0; i < expectedPatterns.length; i++) {
  if (!foundPatterns[expectedPatterns[i]]) missing.push(expectedPatterns[i]);
}
let unexpected = [];
let expectedSet = {};
for (let i = 0; i < expectedPatterns.length; i++) expectedSet[expectedPatterns[i]] = 1;
for (let k in foundPatterns) {
  if (!expectedSet[k] && PATTERN_ALL.indexOf(k) !== -1) unexpected.push(k);
}

if (missing.length > 0) {
  warnings.push('Draft is missing expected clause patterns: ' + missing.join(', ') + '. Review the rendered document and consider regenerating.');
}
if (unexpected.length > 0) {
  warnings.push('Draft contains clause patterns not triggered by the input: ' + unexpected.join(', ') + '. Verify these clauses match your intent or remove them.');
}

// Order clauses by PATTERN_ALL canonical order (so docs render consistently
// across regenerations, regardless of model output order).
let clausesBlockParts = [];
for (let i = 0; i < PATTERN_ALL.length; i++) {
  let anchor = PATTERN_ALL[i];
  let c = clausesByAnchor[anchor];
  if (!c) continue;
  let title = (typeof c === 'object' && c.title) ? String(c.title) : clauseTitleFromAnchor(anchor);
  let text = (typeof c === 'object' && c.text) ? String(c.text) : (typeof c === 'string' ? c : '');
  text = scrubModelLatex(text);
  text = texEscapeModelProse(text);
  // Defensive: ensure the pattern anchor comment is present even if the model omitted it.
  if (text.indexOf('% PATTERN:' + anchor) === -1) {
    text = text + '\n% PATTERN:' + anchor;
  }
  clausesBlockParts.push('\\section{' + texEscape(title) + '}\n' + text + '\n');
}
let clausesBlock = clausesBlockParts.join('\n');

// Definitions: array of {term, definition} or {term, def}
let defs = Array.isArray(clauseJson.definitions) ? clauseJson.definitions : [];
let definitionsBlock = '';
if (defs.length > 0) {
  let lines = ['\\begin{description}[leftmargin=1.5em,style=nextline]'];
  for (let i = 0; i < defs.length; i++) {
    let d = defs[i] || {};
    let term = texEscape(d.term || d.name || '');
    let body = texEscapeModelProse(scrubModelLatex(String(d.definition || d.def || d.body || '')));
    if (!term) continue;
    lines.push('  \\item[\\textsc{' + term + '}] ' + body);
  }
  lines.push('\\end{description}');
  definitionsBlock = lines.join('\n');
} else {
  definitionsBlock = '\\textit{No additional definitions.}';
}

// Recitals come from the model. Scrub and selectively escape.
let recitals = texEscapeModelProse(scrubModelLatex(String((clauseJson && clauseJson.recitals) || '')));
if (!recitals) {
  recitals = 'The parties wish to set out the terms on which Vendor will provide the services described herein to Engager.';
}

// Commercial terms (lump-sum standalone paragraph). Empty string for milestone-based.
let commercialTermsRaw = String((clauseJson && clauseJson.commercialTerms) || '');
let commercialTerms = commercialTermsRaw.trim()
  ? texEscapeModelProse(scrubModelLatex(commercialTermsRaw))
  : '';

// If lump-sum was chosen but the LLM didn't emit commercialTerms, flag it.
if (v.paymentSchedule === 'lump-sum' && !commercialTerms) {
  warnings.push(
    'paymentSchedule is lump-sum but the model did not emit a `commercialTerms` paragraph. ' +
    'The rendered document will have no operative payment-timing clause. Regenerate or fill manually.'
  );
}

// Build the LaTeX block for commercial terms (only when populated).
let commercialTermsBlock = commercialTerms
  ? '\\section{Commercial Terms}\n' + commercialTerms + '\n'
  : '';

// Always use the script-controlled signature block. Model-generated signature
// blocks have proven unreliable: contradictory escape levels produce malformed
// LaTeX where names get corrupted (e.g. "Rohith Banoth" renders as "nRohith
// Banoth" when `\\\\n` is misread as a line break + literal "n"). The party
// data flows through the fallback template via tokens where escaping is
// controlled by texEscape(), so we lose nothing by ignoring the model here.
// The system prompt instructs the model to always emit `""` for signatureBlock,
// but even if the model disobeys, this code discards the value.
let signatureBlock =
  '\\vspace{2em}\n' +
  '\\noindent\\begin{minipage}[t]{0.45\\textwidth}\n' +
  '\\textbf{For <<PARTY_A_NAME>>}\\\\[1em]\n' +
  'Signature: \\rule{14em}{0.4pt}\\\\[1.2em]\n' +
  'Name: <<PARTY_A_SIGNATORY>>\\\\[0.4em]\n' +
  'Title: <<PARTY_A_SIGNATORY_ROLE>>\\\\[0.4em]\n' +
  'Date: \\rule{10em}{0.4pt}\\\\[0.4em]\n' +
  'Place: \\rule{10em}{0.4pt}\n' +
  '\\end{minipage}\\hfill\n' +
  '\\begin{minipage}[t]{0.45\\textwidth}\n' +
  '\\textbf{For <<PARTY_B_NAME>>}\\\\[1em]\n' +
  'Signature: \\rule{14em}{0.4pt}\\\\[1.2em]\n' +
  'Name: <<PARTY_B_SIGNATORY>>\\\\[0.4em]\n' +
  'Title: <<PARTY_B_SIGNATORY_ROLE>>\\\\[0.4em]\n' +
  'Date: \\rule{10em}{0.4pt}\\\\[0.4em]\n' +
  'Place: \\rule{10em}{0.4pt}\n' +
  '\\end{minipage}\n' +
  '\\par\\vspace*{4em}\n' +
  '\\noindent\\begin{minipage}[t]{0.45\\textwidth}\n' +
  '\\textbf{Witness 1}\\\\[1em]\n' +
  'Signature: \\rule{14em}{0.4pt}\\\\[1.2em]\n' +
  'Name: \\rule{14em}{0.4pt}\n' +
  '\\end{minipage}\\hfill\n' +
  '\\begin{minipage}[t]{0.45\\textwidth}\n' +
  '\\textbf{Witness 2}\\\\[1em]\n' +
  'Signature: \\rule{14em}{0.4pt}\\\\[1.2em]\n' +
  'Name: \\rule{14em}{0.4pt}\n' +
  '\\end{minipage}';

let disclaimer = (clauseJson && clauseJson.metadata && clauseJson.metadata.disclaimer)
  ? String(clauseJson.metadata.disclaimer)
  : 'This draft is a starting point produced by software. It is not legal advice. Have it reviewed by a qualified attorney in your jurisdiction before signing.';

// Drafting-warnings used to be rendered into the PDF as a visible banner.
// They are now surfaced only through the API response (`warnings[]`), where
// the UI shows them as an "out-of-document" note. Keeping the PDF clean means
// it is ready to send/sign without needing manual scrubbing of internal notes.

// ── LaTeX template (inlined per PLAN.md §18 risk #2 fallback) ───────────
// Layout intent:
//   - All major headings use unnumbered `\section*{}` for uniform look
//     (Parties / Recitals / Definitions / Commercial Terms / Clauses /
//     Signatures). Numbered enumeration inside individual clauses is OK.
//   - Generous spacing before headings so they don't feel cramped.
//   - Slightly larger bottom margin (1.1in) so the footer has breathing room.
//   - Signature block: explicit \vspace*{} between signatory minipages and
//     witness minipages so witnesses never sit on top of the Place field.
let TEMPLATE =
  '\\documentclass[11pt,letterpaper]{article}\n' +
  '\\usepackage[top=1in,bottom=1.1in,left=1in,right=1in]{geometry}\n' +
  '\\usepackage{parskip}\n' +
  '\\usepackage{enumitem}\n' +
  '\\usepackage{titlesec}\n' +
  '\\usepackage{fancyhdr}\n' +
  '\n' +
  '\\pagestyle{fancy}\n' +
  '\\fancyhf{}\n' +
  '\\setlength{\\footskip}{36pt}\n' +
  '\\renewcommand{\\headrulewidth}{0pt}\n' +
  '\\renewcommand{\\footrulewidth}{0.4pt}\n' +
  '\\lfoot{\\footnotesize\\itshape CONFIDENTIAL}\n' +
  '\\cfoot{\\footnotesize <<AGREEMENT_TITLE>>}\n' +
  '\\rfoot{\\footnotesize Page \\thepage}\n' +
  '\n' +
  '\\titleformat{\\section}{\\normalsize\\bfseries\\uppercase}{\\thesection.}{0.6em}{}\n' +
  '\\titlespacing*{\\section}{0pt}{2.2em}{0.8em}\n' +
  '\n' +
  '\\title{<<AGREEMENT_TITLE>>}\n' +
  '\\date{}\n' +
  '\n' +
  '\\begin{document}\n' +
  '\\begin{center}\n' +
  '{\\Large\\bfseries <<AGREEMENT_TITLE>>}\\\\[0.6em]\n' +
  '\\textit{Effective <<EFFECTIVE_DATE>>}\n' +
  '\\end{center}\n' +
  '\n' +
  '\\section{Parties}\n' +
  'This <<AGREEMENT_TITLE>> (the ``Agreement\'\') is entered into as of <<EFFECTIVE_DATE>> between:\n' +
  '\\begin{itemize}[leftmargin=1.2em]\n' +
  '\\item \\textbf{<<PARTY_A_NAME>>} (``Engager\'\'), <<PARTY_A_TYPE>>, principal address <<PARTY_A_ADDRESS>>, represented by <<PARTY_A_SIGNATORY>>, <<PARTY_A_SIGNATORY_ROLE>>; and\n' +
  '\\item \\textbf{<<PARTY_B_NAME>>} (``Vendor\'\'), <<PARTY_B_TYPE>>, principal address <<PARTY_B_ADDRESS>>, represented by <<PARTY_B_SIGNATORY>>, <<PARTY_B_SIGNATORY_ROLE>>.\n' +
  '\\end{itemize}\n' +
  '\n' +
  '\\section{Recitals}\n' +
  '<<RECITALS>>\n' +
  '\n' +
  '\\section{Definitions}\n' +
  '<<DEFINITIONS_BLOCK>>\n' +
  '\n' +
  '<<COMMERCIAL_TERMS_BLOCK>>\n' +
  '\n' +
  '<<CLAUSES_BLOCK>>\n' +
  '\n' +
  '\\section*{Signatures}\n' +
  '<<SIGNATURE_BLOCK>>\n' +
  '\n' +
  '\\vfill\n' +
  '\\noindent\\hrulefill\\\\[0.4em]\n' +
  '{\\footnotesize\\textit{<<DISCLAIMER>>}}\n' +
  '\n' +
  '\\end{document}\n';

// ── Token replacements ──────────────────────────────────────────────────
// Bucket A (escaped): raw user values
// Bucket B (model output, not escaped, already scrubbed): recitals, clauses, etc.
let tokens = {
  'AGREEMENT_TITLE': texEscape(v.agreementTitle),
  'EFFECTIVE_DATE': texEscape(v.effectiveDate),
  'PARTY_A_NAME': texEscape(v.partyAName),
  'PARTY_A_TYPE': texEscape(v.partyAType),
  'PARTY_A_ADDRESS': texEscape(v.partyAAddress),
  'PARTY_A_SIGNATORY': texEscape(v.partyASignatory),
  'PARTY_A_SIGNATORY_ROLE': texEscape(v.partyASignatoryRole),
  'PARTY_B_NAME': texEscape(v.partyBName),
  'PARTY_B_TYPE': texEscape(v.partyBType),
  'PARTY_B_ADDRESS': texEscape(v.partyBAddress),
  'PARTY_B_SIGNATORY': texEscape(v.partyBSignatory),
  'PARTY_B_SIGNATORY_ROLE': texEscape(v.partyBSignatoryRole),
  'RECITALS': recitals,
  'DEFINITIONS_BLOCK': definitionsBlock,
  'COMMERCIAL_TERMS_BLOCK': commercialTermsBlock,
  'CLAUSES_BLOCK': clausesBlock,
  'SIGNATURE_BLOCK': signatureBlock,
  'DISCLAIMER': texEscape(disclaimer)
};

// Two-pass replacement: signatureBlock may itself contain <<PARTY_*>> tokens
// (the fallback template does), so we substitute tokens iteratively until
// no token-shaped pattern remains in the document.
function applyTokens(template, tokens) {
  let out = template;
  let safety = 4;
  while (safety-- > 0) {
    let before = out;
    for (let key in tokens) {
      let needle = '<<' + key + '>>';
      // Split-join is safer than regex when the value may contain $&, $1, etc.
      out = out.split(needle).join(tokens[key]);
    }
    if (out === before) break;
  }
  return out;
}

let latex = applyTokens(TEMPLATE, tokens);

// Strip any remaining unfilled <<TOKEN>> placeholders so the doc still compiles
let stillUnfilled = latex.match(/<<[A-Z_]+>>/g);
if (stillUnfilled && stillUnfilled.length > 0) {
  warnings.push('Unfilled template tokens after assembly: ' + stillUnfilled.join(', '));
  latex = latex.replace(/<<[A-Z_]+>>/g, '');
}

// (Pattern verification was already done above, before warningsBanner assembly.)

// ── Compose response ────────────────────────────────────────────────────
output = {
  latex: latex,
  clauseJson: clauseJson,
  warnings: warnings,
  patternReport: {
    expected: expectedPatterns,
    found: foundList,
    missing: missing,
    unexpected: unexpected
  }
};
