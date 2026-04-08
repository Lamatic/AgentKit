#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────
// extract-resources.mjs
// Extracts resources from flow .ts files into separate dirs
// AND cross-references them back into the flow .ts via @refs.
//
// What it extracts:
//   1. model-configs/ — LLM, RAG, ImageGen model params
//      Cross-referenced: inline values → @model-configs/<file>
//   2. triggers/widgets/ — ONLY chatConfig + searchConfig
//      (domains, colors, UI settings)
//      NOT cross-referenced — just saved separately for editing
//      Schemas (advance_schema, responeType) STAY in flow
//   3. memory/ — memory node configs
//      Cross-referenced: inline values → @memory/<file>
//   4. tools/ — tool ID arrays
//      Cross-referenced: inline array → @tools/<file>
//
// NOT extracted (stays in flow .ts):
//   - graphqlNode (API request) — schemas are flow logic
//   - webhookTriggerNode — no widget settings
//   - Input/output mappings
//   - Condition logic
//   - Code nodes (already in scripts/)
//
// Usage:
//   node scripts/extract-resources.mjs --dry-run
//   node scripts/extract-resources.mjs
//   node scripts/extract-resources.mjs --kit deep-search
//   node scripts/extract-resources.mjs --force
//   node scripts/extract-resources.mjs --clean  # remove old webhook triggers
// ─────────────────────────────────────────────────────────────

import fs from 'fs';
import path from 'path';

const SCRIPT_ROOT = path.resolve(import.meta.dirname, '..');
const REPO_ROOT = fs.existsSync(path.join(SCRIPT_ROOT, 'kits')) ? SCRIPT_ROOT
  : fs.existsSync(path.join(SCRIPT_ROOT, 'AgentKit', 'kits')) ? path.join(SCRIPT_ROOT, 'AgentKit')
  : SCRIPT_ROOT;
const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const FORCE = args.includes('--force');
const CLEAN = args.includes('--clean');
const kitIdx = args.indexOf('--kit');
const SINGLE = kitIdx !== -1 ? args[kitIdx + 1] : null;

const c = {
  red: s => `\x1b[31m${s}\x1b[0m`,
  green: s => `\x1b[32m${s}\x1b[0m`,
  yellow: s => `\x1b[33m${s}\x1b[0m`,
  blue: s => `\x1b[34m${s}\x1b[0m`,
  bold: s => `\x1b[1m${s}\x1b[0m`,
  gray: s => `\x1b[90m${s}\x1b[0m`,
};

const errors = [];
const warnings = [];
let promptsExtracted = 0;
let codeExtracted = 0;
let modelConfigsExtracted = 0;
let widgetSettingsSaved = 0;
let memoryExtracted = 0;
let toolsExtracted = 0;
let flowsRewritten = 0;
let kitsProcessed = 0;
let webhooksCleaned = 0;

function logInfo(m) { console.log(`${c.blue('[INFO]')} ${m}`); }
function logOk(m)   { console.log(`${c.green('[OK]')} ${m}`); }
function logWarn(m)  { console.log(`${c.yellow('[WARN]')} ${m}`); warnings.push(m); }
function logErr(m)   { console.log(`${c.red('[ERR]')} ${m}`); errors.push(m); }
function logDry(m)   { console.log(`${c.yellow('[DRY]')} ${m}`); }
function logClean(m) { console.log(`${c.gray('[CLEAN]')} ${m}`); }

function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

// ── Fields to extract per resource type ──
const MODEL_CONFIG_FIELDS = [
  'generativeModelName', 'embeddingModelName', 'imageGenModelName',
  'credentials', 'limit', 'certainty', 'memories', 'messages', 'attachments'
];

// Widget settings ONLY — UI/appearance that gets edited independently
const WIDGET_SETTINGS_FIELDS = ['chatConfig', 'searchConfig', 'domains'];

const MEMORY_CONFIG_FIELDS = [
  'memoryCollection', 'uniqueId', 'sessionId', 'memoryValue',
  'searchQuery', 'limit', 'filters', 'embeddingModelName', 'generativeModelName'
];

/**
 * Clean up old webhook trigger files + restore inline values in flows.
 */
function cleanWebhookTriggers(kitDir, kitName) {
  const webhooksDir = path.join(kitDir, 'triggers', 'webhooks');
  if (!fs.existsSync(webhooksDir)) return;

  const files = fs.readdirSync(webhooksDir);
  if (files.length === 0) return;

  logInfo(`  Cleaning triggers/webhooks/ (${files.length} files)`);

  if (!DRY_RUN) {
    // Delete all webhook trigger files
    for (const f of files) {
      fs.unlinkSync(path.join(webhooksDir, f));
      logClean(`  Deleted triggers/webhooks/${f}`);
      webhooksCleaned++;
    }
    // Remove empty dir
    try { fs.rmdirSync(webhooksDir); } catch {}
    // Remove triggers/ if empty
    const triggersDir = path.join(kitDir, 'triggers');
    try {
      const remaining = fs.readdirSync(triggersDir);
      if (remaining.length === 0) fs.rmdirSync(triggersDir);
    } catch {}
  } else {
    for (const f of files) {
      logDry(`  Would delete triggers/webhooks/${f}`);
      webhooksCleaned++;
    }
  }
}

/**
 * Restore any cross-referenced trigger values back to their original inline form.
 * Finds values like "@triggers/webhooks/..." and replaces with original values from
 * the trigger file (if it still exists) or empty defaults.
 */
function restoreTriggerRefs(nodes) {
  let restored = false;
  for (const node of nodes) {
    const values = node.data?.values || {};
    for (const [key, val] of Object.entries(values)) {
      if (typeof val === 'string' && val.startsWith('@triggers/')) {
        // Restore to sensible defaults based on field type
        if (key === 'advance_schema') values[key] = '';
        else if (key === 'responeType') values[key] = 'realtime';
        else if (key === 'domains') values[key] = [];
        else if (key === 'chat' || key === 'search') values[key] = '';
        else values[key] = '';
        restored = true;
      }
    }
  }
  return restored;
}

/**
 * Process a single flow .ts file.
 */
function processFlow(flowPath, kitDir, kitName) {
  const flowFile = path.basename(flowPath);
  const flowName = flowFile.replace('.ts', '');
  const content = fs.readFileSync(flowPath, 'utf8');

  // Parse nodes
  let nodes;
  try {
    const nodesMatch = content.match(/export const nodes = (\[[\s\S]*?\n\]);/);
    if (!nodesMatch) return false;
    nodes = new Function(`return ${nodesMatch[1]}`)();
  } catch (e) {
    logWarn(`  ${flowName}: Could not parse nodes — ${e.message}`);
    return false;
  }

  // Parse existing references
  let existingRefs = {};
  try {
    const refsMatch = content.match(/export const references = (\{[\s\S]*?\n\});/);
    if (refsMatch) existingRefs = new Function(`return ${refsMatch[1]}`)();
  } catch {}

  const newRefs = { prompts: {}, scripts: {}, modelConfigs: {}, triggers: {}, memory: {}, tools: {} };
  let flowModified = false;

  // If --clean, restore any old trigger refs first
  if (CLEAN) {
    const restored = restoreTriggerRefs(nodes);
    if (restored) {
      flowModified = true;
      logClean(`  ${flowName}: Restored inline trigger values`);
    }
    // Also remove trigger refs from references export
    if (existingRefs.triggers) {
      delete existingRefs.triggers;
      flowModified = true;
    }
  }

  for (const node of nodes) {
    const nodeId = node.data?.nodeId || '';
    const values = node.data?.values || {};
    const nodeName = values.nodeName || node.id || nodeId;
    const nodeSlug = slugify(nodeName);

    // ── Prompts (cross-referenced) ──
    if (Array.isArray(values.prompts) && values.prompts.length > 0) {
      for (const prompt of values.prompts) {
        if (!prompt.content || typeof prompt.content !== 'string') continue;
        // Skip already extracted
        if (prompt.content.startsWith('@prompts/')) continue;

        const role = prompt.role || 'system';
        const fileName = `${flowName}_${nodeSlug}_${role}.md`;
        const refPath = `@prompts/${fileName}`;
        const targetDir = path.join(kitDir, 'prompts');

        if (DRY_RUN) {
          logDry(`  prompts/${fileName} → ref in ${flowName}.ts`);
        } else {
          fs.mkdirSync(targetDir, { recursive: true });
          fs.writeFileSync(path.join(targetDir, fileName), prompt.content);
          prompt.content = refPath;
          logOk(`  prompts/${fileName}`);
        }

        const refKey = `${flowName}_${nodeSlug}_${role}`.replace(/-/g, '_');
        newRefs.prompts[refKey] = refPath;
        promptsExtracted++;
        flowModified = true;
      }
    }

    // ── Code Nodes (cross-referenced) ──
    if (typeof values.code === 'string' && values.code.length > 0 && !values.code.startsWith('@scripts/')) {
      const fileName = `${flowName}_${nodeSlug}.ts`;
      const refPath = `@scripts/${fileName}`;
      const targetDir = path.join(kitDir, 'scripts');

      if (DRY_RUN) {
        logDry(`  scripts/${fileName} → ref in ${flowName}.ts`);
      } else {
        fs.mkdirSync(targetDir, { recursive: true });
        // Write code with {{}} variables preserved — Lamatic resolves at runtime
        fs.writeFileSync(path.join(targetDir, fileName),
          `// Code: ${nodeName}\n// Flow: ${flowName}\n\n${values.code}\n`);
        values.code = refPath;
        logOk(`  scripts/${fileName}`);
      }

      const refKey = `${flowName}_${nodeSlug}`.replace(/-/g, '_');
      newRefs.scripts[refKey] = refPath;
      codeExtracted++;
      flowModified = true;
    }

    // ── Model Configs (cross-referenced) ──
    if (['LLMNode', 'InstructorLLMNode', 'multiModalLLMNode', 'RAGNode', 'ImageGenNode'].includes(nodeId)) {
      const fileName = `${flowName}_${nodeSlug}.ts`;
      const refPath = `@model-configs/${fileName}`;
      const targetDir = path.join(kitDir, 'model-configs');

      // Check if already extracted (value is already a @ref)
      const alreadyExtracted = MODEL_CONFIG_FIELDS.some(f =>
        typeof values[f] === 'string' && values[f].startsWith('@model-configs/')
      );
      if (alreadyExtracted && !FORCE) continue;

      const extracted = {};
      for (const field of MODEL_CONFIG_FIELDS) {
        if (values[field] !== undefined) extracted[field] = values[field];
      }

      if (DRY_RUN) {
        logDry(`  model-configs/${fileName} → ref in ${flowName}.ts`);
      } else {
        fs.mkdirSync(targetDir, { recursive: true });
        fs.writeFileSync(path.join(targetDir, fileName),
          `// Model config: ${nodeName} (${nodeId})\n// Flow: ${flowName}\n\nexport default ${JSON.stringify(extracted, null, 2)};\n`);
        // Replace inline → reference
        for (const field of MODEL_CONFIG_FIELDS) {
          if (values[field] !== undefined) values[field] = refPath;
        }
        logOk(`  model-configs/${fileName}`);
      }

      newRefs.modelConfigs[`${flowName}_${nodeSlug}`.replace(/-/g, '_')] = refPath;
      modelConfigsExtracted++;
      flowModified = true;
    }

    // ── Widget Settings (extracted + cross-referenced) ──
    // Only chatTriggerNode and searchTriggerNode — NOT graphqlNode, NOT webhookTriggerNode
    if (['chatTriggerNode', 'searchTriggerNode'].includes(nodeId)) {
      const widgetType = nodeId === 'chatTriggerNode' ? 'chat' : 'search';
      const fileName = `${flowName}_${nodeSlug}.ts`;
      const refPath = `@triggers/widgets/${fileName}`;
      const targetDir = path.join(kitDir, 'triggers', 'widgets');

      // Check if already extracted
      const alreadyExtracted = WIDGET_SETTINGS_FIELDS.some(f =>
        typeof values[f] === 'string' && values[f].startsWith('@triggers/')
      );
      if (alreadyExtracted && !FORCE) continue;

      const extracted = {};
      let hasSettings = false;
      for (const field of WIDGET_SETTINGS_FIELDS) {
        if (values[field] !== undefined) {
          extracted[field] = values[field];
          hasSettings = true;
        }
      }

      if (!hasSettings) continue;

      if (DRY_RUN) {
        logDry(`  triggers/widgets/${fileName} → ref in ${flowName}.ts`);
      } else {
        fs.mkdirSync(targetDir, { recursive: true });
        fs.writeFileSync(path.join(targetDir, fileName),
          `// Widget settings: ${nodeName} (${widgetType})\n// Flow: ${flowName}\n// Widget UI/appearance — domains, colors, layout.\n\nexport default ${JSON.stringify(extracted, null, 2)};\n`);
        // Replace inline → reference
        for (const field of WIDGET_SETTINGS_FIELDS) {
          if (values[field] !== undefined) values[field] = refPath;
        }
        logOk(`  triggers/widgets/${fileName}`);
      }

      const refKey = `${flowName}_${nodeSlug}`.replace(/-/g, '_');
      newRefs.triggers[refKey] = refPath;
      widgetSettingsSaved++;
      flowModified = true;
    }

    // ── Memory (cross-referenced) ──
    if (['memoryNode', 'memoryRetrieveNode'].includes(nodeId)) {
      const fileName = `${flowName}_${nodeSlug}.ts`;
      const refPath = `@memory/${fileName}`;
      const targetDir = path.join(kitDir, 'memory');

      const alreadyExtracted = MEMORY_CONFIG_FIELDS.some(f =>
        typeof values[f] === 'string' && values[f].startsWith('@memory/')
      );
      if (alreadyExtracted && !FORCE) continue;

      const extracted = {};
      for (const field of MEMORY_CONFIG_FIELDS) {
        if (values[field] !== undefined) extracted[field] = values[field];
      }

      if (DRY_RUN) {
        logDry(`  memory/${fileName} → ref in ${flowName}.ts`);
      } else {
        fs.mkdirSync(targetDir, { recursive: true });
        fs.writeFileSync(path.join(targetDir, fileName),
          `// Memory config: ${nodeName} (${nodeId})\n// Flow: ${flowName}\n\nexport default ${JSON.stringify(extracted, null, 2)};\n`);
        for (const field of MEMORY_CONFIG_FIELDS) {
          if (values[field] !== undefined) values[field] = refPath;
        }
        logOk(`  memory/${fileName}`);
      }

      newRefs.memory[`${flowName}_${nodeSlug}`.replace(/-/g, '_')] = refPath;
      memoryExtracted++;
      flowModified = true;
    }

    // ── Tools (cross-referenced) ──
    if (Array.isArray(values.tools) && values.tools.length > 0) {
      const fileName = `${flowName}_${nodeSlug}_tools.ts`;
      const refPath = `@tools/${fileName}`;
      const targetDir = path.join(kitDir, 'tools');

      if (DRY_RUN) {
        logDry(`  tools/${fileName} (${values.tools.length} tools) → ref in ${flowName}.ts`);
      } else {
        fs.mkdirSync(targetDir, { recursive: true });
        fs.writeFileSync(path.join(targetDir, fileName),
          `// Tools for: ${nodeName}\n// Flow: ${flowName}\n\nexport default ${JSON.stringify(values.tools, null, 2)};\n`);
        values.tools = refPath;
        logOk(`  tools/${fileName}`);
      }

      newRefs.tools[`${flowName}_${nodeSlug}_tools`.replace(/-/g, '_')] = refPath;
      toolsExtracted++;
      flowModified = true;
    }
  }

  if (!flowModified) return false;
  if (DRY_RUN) return true;

  // ── Merge refs ──
  const mergedRefs = { ...existingRefs };
  if (Object.keys(newRefs.prompts).length > 0)
    mergedRefs.prompts = { ...(mergedRefs.prompts || {}), ...newRefs.prompts };
  if (Object.keys(newRefs.scripts).length > 0)
    mergedRefs.scripts = { ...(mergedRefs.scripts || {}), ...newRefs.scripts };
  if (Object.keys(newRefs.modelConfigs).length > 0)
    mergedRefs.modelConfigs = { ...(mergedRefs.modelConfigs || {}), ...newRefs.modelConfigs };
  if (Object.keys(newRefs.triggers).length > 0)
    mergedRefs.triggers = { ...(mergedRefs.triggers || {}), ...newRefs.triggers };
  if (Object.keys(newRefs.memory).length > 0)
    mergedRefs.memory = { ...(mergedRefs.memory || {}), ...newRefs.memory };
  if (Object.keys(newRefs.tools).length > 0)
    mergedRefs.tools = { ...(mergedRefs.tools || {}), ...newRefs.tools };

  // ── Rewrite flow .ts ──
  let meta = {}, inputs = {}, edges = [];
  try { const m = content.match(/export const meta = (\{[\s\S]*?\n\});/); if (m) meta = new Function(`return ${m[1]}`)(); } catch {}
  try { const m = content.match(/export const inputs = (\{[\s\S]*?\n\});/); if (m) inputs = new Function(`return ${m[1]}`)(); } catch {}
  try { const m = content.match(/export const edges = (\[[\s\S]*?\n\]);/); if (m) edges = new Function(`return ${m[1]}`)(); } catch {}

  const newContent = `// Flow: ${flowName}

// ── Meta ──────────────────────────────────────────────
export const meta = ${JSON.stringify(meta, null, 2)};

// ── Inputs ────────────────────────────────────────────
export const inputs = ${JSON.stringify(inputs, null, 2)};

// ── References ────────────────────────────────────────
// Cross-references to extracted resources in their own directories
// NOTE: Trigger widget settings are saved to triggers/widgets/ but NOT cross-referenced here
export const references = ${JSON.stringify(mergedRefs, null, 2)};

// ── Nodes & Edges ─────────────────────────────────────
export const nodes = ${JSON.stringify(nodes, null, 2)};

export const edges = ${JSON.stringify(edges, null, 2)};

export default { meta, inputs, references, nodes, edges };
`;

  fs.writeFileSync(flowPath, newContent);
  flowsRewritten++;
  logOk(`  ${flowName}.ts rewritten`);
  return true;
}

/**
 * Process a single kit.
 */
function processKit(kitName) {
  const kitDir = path.join(REPO_ROOT, 'kits', kitName);
  const flowsDir = path.join(kitDir, 'flows');
  if (!fs.existsSync(flowsDir)) return;

  const flowFiles = fs.readdirSync(flowsDir).filter(f => f.endsWith('.ts'));
  if (flowFiles.length === 0) return;

  logInfo('━'.repeat(50));
  logInfo(`Processing: kits/${kitName} (${flowFiles.length} flows)`);

  // Clean old webhook triggers if --clean
  if (CLEAN) cleanWebhookTriggers(kitDir, kitName);

  let kitHasWork = false;
  for (const file of flowFiles) {
    const result = processFlow(path.join(flowsDir, file), kitDir, kitName);
    if (result) kitHasWork = true;
  }

  if (!kitHasWork && !CLEAN) logInfo(`  No extractable resources found`);
  kitsProcessed++;
}

// ── Main ──
console.log('');
console.log('╔═══════════════════════════════════════════════════════╗');
console.log('║   AgentKit — Resource Extraction + Cross-Reference    ║');
console.log(`║   MODE: ${DRY_RUN ? 'DRY RUN' : CLEAN ? 'CLEAN + EXTRACT' : 'EXTRACT'}${''.padEnd(DRY_RUN ? 35 : CLEAN ? 28 : 37)}║`);
console.log('╚═══════════════════════════════════════════════════════╝');
if (CLEAN) logInfo('--clean: will remove triggers/webhooks/ and restore inline values\n');
console.log('');

if (SINGLE) {
  processKit(SINGLE);
} else {
  const kitsDir = path.join(REPO_ROOT, 'kits');
  const kits = fs.readdirSync(kitsDir, { withFileTypes: true })
    .filter(e => e.isDirectory() && fs.existsSync(path.join(kitsDir, e.name, 'flows')))
    .filter(e => fs.existsSync(path.join(kitsDir, e.name, 'lamatic.config.ts')))
    .map(e => e.name)
    .sort();

  logInfo(`Found ${kits.length} kits to process\n`);
  for (const kit of kits) processKit(kit);
}

// ── Summary ──
console.log('');
console.log('━'.repeat(50));
console.log(`  Kits processed:       ${c.bold(kitsProcessed)}`);
console.log(`  Prompts extracted:    ${c.green(promptsExtracted)} ${c.gray('(cross-referenced)')}`);
console.log(`  Code extracted:       ${c.green(codeExtracted)} ${c.gray('(cross-referenced)')}`);
console.log(`  Model configs:        ${c.green(modelConfigsExtracted)} ${c.gray('(cross-referenced)')}`);
console.log(`  Widget settings:      ${c.green(widgetSettingsSaved)} ${c.gray('(cross-referenced)')}`);
console.log(`  Memory configs:       ${c.green(memoryExtracted)} ${c.gray('(cross-referenced)')}`);
console.log(`  Tool refs:            ${c.green(toolsExtracted)} ${c.gray('(cross-referenced)')}`);
console.log(`  Flows rewritten:      ${c.blue(flowsRewritten)}`);
if (CLEAN) console.log(`  Webhook files cleaned: ${c.gray(webhooksCleaned)}`);
console.log(`  Warnings:             ${c.yellow(warnings.length)}`);
console.log(`  Errors:               ${c.red(errors.length)}`);
console.log('━'.repeat(50));
if (warnings.length) { console.log('\nWarnings:'); warnings.forEach(w => console.log(`  ⚠ ${w}`)); }
if (errors.length) { console.log('\nErrors:'); errors.forEach(e => console.log(`  ✗ ${e}`)); process.exit(1); }
if (DRY_RUN) console.log('\nDry run. Run without --dry-run to execute.');
else console.log('\nDone. All extracted resources cross-referenced in flow .ts files.');
