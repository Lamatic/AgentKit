#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────
// Script 2: migrate-flows.mjs
// Converts flow folders → flat .ts files.
// Merges config.json + meta.json + inputs.json → <flow-name>.ts
// Extracts inline system prompts → prompts/<name>.md
// Creates flows.md as human+agent readable index.
//
// Run AFTER migrate-apps.mjs on the new kits/<name>/ structure.
//
// Usage:
//   node scripts/migrate-flows.mjs --dry-run         # Preview
//   node scripts/migrate-flows.mjs                   # Execute
//   node scripts/migrate-flows.mjs --kit deep-search # One kit
// ─────────────────────────────────────────────────────────────

import fs from 'fs';
import path from 'path';

const REPO_ROOT = path.resolve(import.meta.dirname, '..');
const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const kitIdx = args.indexOf('--kit');
const SINGLE_KIT = kitIdx !== -1 ? args[kitIdx + 1] : null;

// ── Colors ──
const c = {
  red: s => `\x1b[31m${s}\x1b[0m`,
  green: s => `\x1b[32m${s}\x1b[0m`,
  yellow: s => `\x1b[33m${s}\x1b[0m`,
  blue: s => `\x1b[34m${s}\x1b[0m`,
};

const errors = [];
const warnings = [];
let flowsConverted = 0;
let promptsExtracted = 0;

function logInfo(msg)  { console.log(`${c.blue('[INFO]')} ${msg}`); }
function logOk(msg)    { console.log(`${c.green('[OK]')} ${msg}`); }
function logWarn(msg)  { console.log(`${c.yellow('[WARN]')} ${msg}`); warnings.push(msg); }
function logErr(msg)   { console.log(`${c.red('[ERROR]')} ${msg}`); errors.push(msg); }
function logDry(msg)   { console.log(`${c.yellow('[DRY-RUN]')} ${msg}`); }

// ── Slugify a node name for prompt file naming ──
function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

// ── Convert a single flow folder → flat .ts ──
function convertFlow(flowDir, kitDir) {
  const flowName = path.basename(flowDir);
  const flowTsPath = path.join(path.dirname(flowDir), `${flowName}.ts`);
  const configPath = path.join(flowDir, 'config.json');

  if (!fs.existsSync(configPath)) {
    logWarn(`  ${flowName}: No config.json — skipping`);
    return;
  }

  // Read source files
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  let meta = {};
  let inputs = {};
  try { meta = JSON.parse(fs.readFileSync(path.join(flowDir, 'meta.json'), 'utf8')); } catch {}
  try { inputs = JSON.parse(fs.readFileSync(path.join(flowDir, 'inputs.json'), 'utf8')); } catch {}

  // Count inline system prompts
  let inlinePrompts = [];
  for (const node of (config.nodes || [])) {
    for (const prompt of (node.data?.values?.prompts || [])) {
      if (prompt.role === 'system' && prompt.content && prompt.content.length > 50) {
        const nodeName = node.data?.values?.nodeName || node.id || 'prompt';
        inlinePrompts.push({ node, prompt, nodeName });
      }
    }
  }

  if (DRY_RUN) {
    logDry(`  flows/${flowName}/ → flows/${flowName}.ts`);
    logDry(`    meta.json → merged into .ts`);
    logDry(`    inputs.json → merged into .ts`);
    logDry(`    config.json (${(config.nodes || []).length} nodes, ${(config.edges || []).length} edges) → merged into .ts`);
    if (inlinePrompts.length > 0) {
      logDry(`    ${inlinePrompts.length} system prompt(s) → extracted to prompts/`);
      for (const p of inlinePrompts) {
        logDry(`      "${p.nodeName}" → prompts/${slugify(p.nodeName)}-system.md`);
      }
    }
    logDry(`    flows/${flowName}/ folder → deleted`);
    flowsConverted++;
    return;
  }

  // ── Execute ──
  const promptsDir = path.join(kitDir, 'prompts');
  fs.mkdirSync(promptsDir, { recursive: true });

  // Extract inline prompts
  const references = { constitutions: { default: '@constitutions/default.md' } };
  const promptRefs = {};

  for (const { node, prompt, nodeName } of inlinePrompts) {
    const slug = slugify(nodeName);
    const promptFileName = `${slug}-system.md`;
    const promptPath = path.join(promptsDir, promptFileName);

    fs.writeFileSync(promptPath, prompt.content);
    promptsExtracted++;

    const refKey = slug.replace(/-/g, '_') + '_system';
    promptRefs[refKey] = `@prompts/${promptFileName}`;
    prompt.content = `@prompts/${promptFileName}`;
  }

  if (Object.keys(promptRefs).length > 0) {
    references.prompts = promptRefs;
  }

  // Build .ts file
  const tsContent = `// Flow: ${flowName}
// When @lamatic/sdk ships: import { defineFlow } from '@lamatic/sdk'

// ── Meta ──────────────────────────────────────────────
export const meta = ${JSON.stringify(meta, null, 2)};

// ── Inputs ────────────────────────────────────────────
export const inputs = ${JSON.stringify(inputs, null, 2)};

// ── References ────────────────────────────────────────
// Resources this flow depends on — each lives in its own directory
export const references = ${JSON.stringify(references, null, 2)};

// ── Nodes & Edges (exact Lamatic Studio export) ───────
export const nodes = ${JSON.stringify(config.nodes || [], null, 2)};

export const edges = ${JSON.stringify(config.edges || [], null, 2)};

export default { meta, inputs, references, nodes, edges };
`;

  fs.writeFileSync(flowTsPath, tsContent);
  logOk(`  ${flowName} → flows/${flowName}.ts`);
  if (inlinePrompts.length > 0) {
    logOk(`    ${inlinePrompts.length} prompt(s) extracted to prompts/`);
  }

  // Delete old flow folder
  fs.rmSync(flowDir, { recursive: true });
  flowsConverted++;
}

// ── Generate flows.md ──
function generateFlowsMd(kitDir) {
  const kitName = path.basename(kitDir);
  const flowsDir = path.join(kitDir, 'flows');
  const flowsMdPath = path.join(flowsDir, 'flows.md');

  if (DRY_RUN) {
    logDry(`  Would generate: flows/flows.md`);
    return;
  }

  // Read kit description
  let description = '';
  const lcPath = path.join(kitDir, 'lamatic.config.ts');
  if (fs.existsSync(lcPath)) {
    const content = fs.readFileSync(lcPath, 'utf8');
    const match = content.match(/description:\s*['"]([^'"]+)['"]/);
    if (match) description = match[1];
  }

  let md = `# Flows\n\n`;
  if (description) md += `${description}\n\n`;

  // List all .ts flow files
  const flowFiles = fs.readdirSync(flowsDir)
    .filter(f => f.endsWith('.ts'))
    .sort();

  for (const file of flowFiles) {
    const fname = file.replace('.ts', '');
    const filePath = path.join(flowsDir, file);
    const content = fs.readFileSync(filePath, 'utf8');

    // Extract description from meta
    let flowDesc = '';
    const descMatch = content.match(/"description":\s*"([^"]+)"/);
    if (descMatch) flowDesc = descMatch[1];

    // Extract node names for summary
    const nodeNames = [];
    const nodeMatches = content.matchAll(/"nodeName":\s*"([^"]+)"/g);
    for (const m of nodeMatches) nodeNames.push(m[1]);

    md += `## ${fname}\n`;
    if (flowDesc) md += `${flowDesc}\n`;
    if (nodeNames.length > 0) md += `**Nodes:** ${nodeNames.join(' → ')}\n`;
    md += `\n`;
  }

  fs.writeFileSync(flowsMdPath, md);
  logOk(`  Generated flows/flows.md (${flowFiles.length} flows documented)`);
}

// ── Process a single kit ──
function processKit(kitName) {
  const kitDir = path.join(REPO_ROOT, 'kits', kitName);

  logInfo('━'.repeat(50));
  logInfo(`Processing flows in: kits/${kitName}`);

  const flowsDir = path.join(kitDir, 'flows');
  if (!fs.existsSync(flowsDir)) {
    logWarn(`kits/${kitName}: No flows/ directory — skipping`);
    return;
  }

  // Find flow folders (directories with config.json)
  const entries = fs.readdirSync(flowsDir, { withFileTypes: true });
  let flowDirCount = 0;

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const flowDir = path.join(flowsDir, entry.name);
    if (!fs.existsSync(path.join(flowDir, 'config.json'))) continue;
    convertFlow(flowDir, kitDir);
    flowDirCount++;
  }

  if (flowDirCount === 0) {
    logInfo(`  No flow folders to convert (may already be flat .ts files)`);
  }

  // Generate flows.md
  generateFlowsMd(kitDir);

  // ── Verify ──
  if (!DRY_RUN) {
    // Check no flow folders remain
    const remaining = fs.readdirSync(flowsDir, { withFileTypes: true })
      .filter(e => e.isDirectory() && fs.existsSync(path.join(flowsDir, e.name, 'config.json')));
    if (remaining.length > 0) {
      logErr(`  ${remaining.length} flow folder(s) still remain`);
    }

    // Count .ts files
    const tsFiles = fs.readdirSync(flowsDir).filter(f => f.endsWith('.ts'));
    if (tsFiles.length > 0) {
      logOk(`  ${tsFiles.length} flow .ts file(s)`);
    }

    // Check flows.md
    if (fs.existsSync(path.join(flowsDir, 'flows.md'))) {
      logOk(`  flows/flows.md exists`);
    }
  }
}

// ── Main ──
console.log('');
console.log('╔══════════════════════════════════════════════════════╗');
console.log('║   AgentKit — Flow Separation Script (Script 2)      ║');
console.log(`║   MODE: ${DRY_RUN ? 'DRY RUN (no changes)' : 'EXECUTE (files modified)'}${''.padEnd(DRY_RUN ? 14 : 14)}║`);
console.log('╚══════════════════════════════════════════════════════╝');
console.log('');

if (SINGLE_KIT) {
  if (!fs.existsSync(path.join(REPO_ROOT, 'kits', SINGLE_KIT))) {
    logErr(`Kit not found: kits/${SINGLE_KIT}`);
    process.exit(1);
  }
  processKit(SINGLE_KIT);
} else {
  // Process all kits that have a flows/ directory
  const kitsDir = path.join(REPO_ROOT, 'kits');
  for (const entry of fs.readdirSync(kitsDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const kitPath = path.join(kitsDir, entry.name);
    // Only process migrated kits (have flows/ at root level, not nested under category)
    if (!fs.existsSync(path.join(kitPath, 'flows'))) continue;
    // Skip category directories (they have subdirectories that are kits, not flows)
    const subEntries = fs.readdirSync(kitPath, { withFileTypes: true });
    const hasLamaticConfig = subEntries.some(e => e.name === 'lamatic.config.ts');
    if (!hasLamaticConfig) continue;
    processKit(entry.name);
  }
}

// ── Summary ──
console.log('');
console.log('━'.repeat(50));
console.log(`  Flows converted:    ${c.green(flowsConverted)}`);
console.log(`  Prompts extracted:  ${c.green(promptsExtracted)}`);
console.log(`  Warnings:           ${c.yellow(warnings.length)}`);
console.log(`  Errors:             ${c.red(errors.length)}`);
console.log('━'.repeat(50));

if (warnings.length) { console.log('\nWarnings:'); warnings.forEach(w => console.log(`  ⚠ ${w}`)); }
if (errors.length) { console.log('\nErrors:'); errors.forEach(e => console.log(`  ✗ ${e}`)); process.exit(1); }
if (DRY_RUN) { console.log('\nThis was a dry run. Run without --dry-run to execute.'); }
