#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────
// validate-configs.mjs
// Validates all lamatic.config.ts files across migrated kits.
//
// Checks:
//   1. File exists and is parseable
//   2. Required fields present (name, type, author, steps, links)
//   3. GitHub URL points to correct path (kits/<name>)
//   4. Deploy URL has correct root-directory param
//   5. Steps reference flows that actually exist in flows/
//   6. Type matches what's actually present (apps/ → kit, etc.)
//   7. Tags are clean (no emojis, lowercase)
//   8. Author has name and email
//   9. Cross-reference with original config.json to catch data loss
//  10. lamatic.config.ts exists for every kit-like directory
//  11. agent.md exists (generated with --fix if missing)
//
// Usage:
//   node scripts/validate-configs.mjs           # validate all
//   node scripts/validate-configs.mjs --kit deep-search  # one kit
//   node scripts/validate-configs.mjs --fix     # auto-fix what's fixable
// ─────────────────────────────────────────────────────────────

import fs from 'fs';
import path from 'path';

const REPO_ROOT = path.resolve(import.meta.dirname, '..');
const args = process.argv.slice(2);
const kitIdx = args.indexOf('--kit');
const SINGLE = kitIdx !== -1 ? args[kitIdx + 1] : null;
const AUTO_FIX = args.includes('--fix');

const c = {
  red: s => `\x1b[31m${s}\x1b[0m`,
  green: s => `\x1b[32m${s}\x1b[0m`,
  yellow: s => `\x1b[33m${s}\x1b[0m`,
  blue: s => `\x1b[34m${s}\x1b[0m`,
  dim: s => `\x1b[2m${s}\x1b[0m`,
  bold: s => `\x1b[1m${s}\x1b[0m`,
};

let totalChecked = 0;
let totalPassed = 0;
let totalWarnings = 0;
let totalErrors = 0;
let totalFixed = 0;

function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

// ── Parse lamatic.config.ts (it's a TS file, not JSON) ──
function parseConfig(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');

  // Extract the default export object using regex
  // This handles: export default { ... };
  const match = content.match(/export\s+default\s+(\{[\s\S]*\})\s*;?\s*$/);
  if (!match) return null;

  let objStr = match[1];
  // Remove TS type assertions: 'kit' as const → 'kit'
  objStr = objStr.replace(/\s+as\s+const/g, '');
  // Remove trailing commas before } or ]
  objStr = objStr.replace(/,(\s*[}\]])/g, '$1');

  try {
    // Use Function constructor to evaluate the object literal
    const fn = new Function(`return (${objStr})`);
    return fn();
  } catch (e) {
    return null;
  }
}

// ── Check if a directory is a category directory (contains kit subdirs, not a kit itself) ──
function isCategoryDir(dirPath) {
  if (!fs.existsSync(dirPath)) return false;
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  // A category dir has NO flows/, apps/, app/, or lamatic.config.ts at its level
  // but has subdirectories that look like kits
  const hasFlows = entries.some(e => e.name === 'flows');
  const hasApps = entries.some(e => e.name === 'apps');
  const hasApp = entries.some(e => e.name === 'app');
  const hasConfig = entries.some(e => e.name === 'lamatic.config.ts');
  if (hasFlows || hasApps || hasApp || hasConfig) return false;

  // Check if subdirectories contain kit-like structures
  const subdirs = entries.filter(e => e.isDirectory());
  for (const sub of subdirs) {
    const subPath = path.join(dirPath, sub.name);
    const subEntries = fs.readdirSync(subPath, { withFileTypes: true });
    const subHasFlows = subEntries.some(e => e.name === 'flows');
    const subHasApps = subEntries.some(e => e.name === 'apps' || e.name === 'app');
    if (subHasFlows || subHasApps) return true;
  }
  return false;
}

// ── Check if a directory is a kit-like directory (has flows/, apps/, or app/) ──
function isKitLikeDir(dirPath) {
  if (!fs.existsSync(dirPath)) return false;
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  const hasFlows = entries.some(e => e.name === 'flows');
  const hasApps = entries.some(e => e.name === 'apps');
  const hasApp = entries.some(e => e.name === 'app');
  return hasFlows || hasApps || hasApp;
}

// ── Find original config.json for cross-reference ──
function findOriginalConfig(kitName) {
  // Check old kit locations (both kits/ and oldKits/)
  const categories = ['agentic', 'automation', 'embed', 'assistant', 'sample', 'special'];
  const kitPaths = [];
  for (const base of ['oldKits', 'kits']) {
    for (const cat of categories) {
      kitPaths.push(`${base}/${cat}/${kitName}/config.json`);
    }
  }
  // Handle renames
  const renameMap = {
    'embed-chat': ['kits/embed/chat/config.json', 'oldKits/embed/chat/config.json'],
    'embed-search': ['kits/embed/search/config.json', 'oldKits/embed/search/config.json'],
    'embed-sheets': ['kits/embed/sheets/config.json', 'oldKits/embed/sheets/config.json'],
    'content-generation': ['kits/sample/content-generation/config.json', 'oldKits/sample/content-generation/config.json'],
    'halloween-costume-generator': ['kits/special/halloween-costume-generator/config.json', 'oldKits/special/halloween-costume-generator/config.json'],
  };
  if (renameMap[kitName]) kitPaths.unshift(...renameMap[kitName]);

  // Check bundle locations
  kitPaths.push(`bundles/${kitName}/config.json`);

  // Check template locations (meta.json, not config.json)
  kitPaths.push(`templates/${kitName}/meta.json`);

  for (const p of kitPaths) {
    const full = path.join(REPO_ROOT, p);
    if (fs.existsSync(full)) {
      try { return { path: p, data: JSON.parse(fs.readFileSync(full, 'utf8')) }; }
      catch { continue; }
    }
  }
  return null;
}

/**
 * Generate agent.md content from available meta info.
 */
function generateAgentMd(kitName, kitDir) {
  let name = kitName;
  let description = '';
  let type = 'kit';
  let author = { name: '', email: '' };
  let flows = [];

  // Try to read lamatic.config.ts
  const configPath = path.join(kitDir, 'lamatic.config.ts');
  if (fs.existsSync(configPath)) {
    const config = parseConfig(configPath);
    if (config) {
      name = config.name || kitName;
      description = config.description || '';
      type = config.type || 'kit';
      author = config.author || author;
    }
  }

  // Try to read flow info
  const flowsDir = path.join(kitDir, 'flows');
  if (fs.existsSync(flowsDir)) {
    const flowFiles = fs.readdirSync(flowsDir).filter(f => f.endsWith('.ts'));
    for (const file of flowFiles) {
      const fname = file.replace('.ts', '');
      const filePath = path.join(flowsDir, file);
      let flowDesc = '';
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        const descMatch = content.match(/"description":\s*"([^"]+)"/);
        if (descMatch) flowDesc = descMatch[1];
      } catch {}
      flows.push({ name: fname, description: flowDesc || 'No description' });
    }
  }

  // Try to get a summary from README
  let whatThisDoes = description;
  const readmePath = path.join(kitDir, 'README.md');
  if (fs.existsSync(readmePath)) {
    const readme = fs.readFileSync(readmePath, 'utf8');
    const lines = readme.split('\n');
    let summaryLines = [];
    let pastTitle = false;
    for (const line of lines) {
      if (!pastTitle) {
        if (line.startsWith('#')) { pastTitle = true; continue; }
        continue;
      }
      if (line.trim() === '') {
        if (summaryLines.length > 0) break;
        continue;
      }
      if (line.startsWith('#')) break;
      summaryLines.push(line.trim());
    }
    if (summaryLines.length > 0) {
      whatThisDoes = summaryLines.join(' ');
    }
  }

  let flowList = '';
  if (flows.length > 0) {
    flowList = flows.map(f => `- **${f.name}**: ${f.description}`).join('\n');
  }

  const authorStr = author?.name
    ? `${author.name}${author.email ? ` (${author.email})` : ''}`
    : 'Unknown';

  return `# ${name}

${description}

## Type
${type}

## What This Does
${whatThisDoes}

## Flows
${flowList || 'No flows documented.'}

## Author
${authorStr}
`;
}

/**
 * Generate a minimal lamatic.config.ts for a kit-like directory that's missing one.
 */
function generateMinimalConfig(kitName, kitDir) {
  let name = kitName;
  let description = '';
  let author = { name: '', email: '' };
  let type = 'kit';
  let tags = [];

  // Try to read README.md for info
  const readmePath = path.join(kitDir, 'README.md');
  if (fs.existsSync(readmePath)) {
    const readme = fs.readFileSync(readmePath, 'utf8');
    // Extract title
    const titleMatch = readme.match(/^#\s+(.+)/m);
    if (titleMatch) name = titleMatch[1].trim();
    // Extract first paragraph as description
    const lines = readme.split('\n');
    let summaryLines = [];
    let pastTitle = false;
    for (const line of lines) {
      if (!pastTitle) {
        if (line.startsWith('#')) { pastTitle = true; continue; }
        continue;
      }
      if (line.trim() === '') {
        if (summaryLines.length > 0) break;
        continue;
      }
      if (line.startsWith('#')) break;
      summaryLines.push(line.trim());
    }
    if (summaryLines.length > 0) {
      description = summaryLines.join(' ');
    }
  }

  // Try to read flow meta for author info
  const flowsDir = path.join(kitDir, 'flows');
  if (fs.existsSync(flowsDir)) {
    // Check for .ts files first (already flattened)
    const tsFiles = fs.readdirSync(flowsDir).filter(f => f.endsWith('.ts'));
    // Check for flow subdirs with meta.json
    const flowDirs = fs.readdirSync(flowsDir, { withFileTypes: true })
      .filter(e => e.isDirectory());
    for (const dir of flowDirs) {
      const metaPath = path.join(flowsDir, dir.name, 'meta.json');
      if (fs.existsSync(metaPath)) {
        try {
          const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
          if (meta.author) author = meta.author;
          if (meta.tags) {
            const rawTags = Array.isArray(meta.tags) ? meta.tags : [meta.tags];
            tags = rawTags.map(t =>
              typeof t === 'string' ? t.replace(/^[^\w]+/, '').trim().toLowerCase() : String(t)
            );
          }
          if (meta.description && !description) description = meta.description;
        } catch {}
      }
    }
  }

  // Determine type
  const hasApps = fs.existsSync(path.join(kitDir, 'apps'));
  const hasApp = fs.existsSync(path.join(kitDir, 'app'));
  if (!hasApps && !hasApp) {
    const flowCount = fs.existsSync(flowsDir)
      ? fs.readdirSync(flowsDir).filter(f => f.endsWith('.ts')).length +
        fs.readdirSync(flowsDir, { withFileTypes: true }).filter(e => e.isDirectory()).length
      : 0;
    if (flowCount <= 1) type = 'template';
    else type = 'bundle';
  }

  // Build steps from flows
  const steps = [];
  if (fs.existsSync(flowsDir)) {
    const tsFiles = fs.readdirSync(flowsDir).filter(f => f.endsWith('.ts'));
    const flowDirs = fs.readdirSync(flowsDir, { withFileTypes: true })
      .filter(e => e.isDirectory() && fs.existsSync(path.join(flowsDir, e.name, 'config.json')));
    const allFlows = [
      ...tsFiles.map(f => f.replace('.ts', '')),
      ...flowDirs.map(d => d.name),
    ];
    for (const flowId of allFlows) {
      steps.push({ id: flowId, type: 'mandatory' });
    }
  }

  const links = {
    github: `https://github.com/Lamatic/AgentKit/tree/main/kits/${kitName}`,
  };

  const ts = `export default {
  name: ${JSON.stringify(name)},
  description: ${JSON.stringify(description)},
  version: '1.0.0',
  type: ${JSON.stringify(type)} as const,
  author: ${JSON.stringify(author)},
  tags: ${JSON.stringify(tags)},
  steps: ${JSON.stringify(steps, null, 4)},
  links: ${JSON.stringify(links, null, 4)},
};
`;
  return ts;
}

// ── Validate a single kit ──
function validateKit(kitName) {
  const kitDir = path.join(REPO_ROOT, 'kits', kitName);
  const configPath = path.join(kitDir, 'lamatic.config.ts');
  const checks = [];
  let needsRewrite = false;
  let config = null;

  function pass(msg) { checks.push({ status: 'pass', msg }); }
  function warn(msg) { checks.push({ status: 'warn', msg }); totalWarnings++; }
  function fail(msg) { checks.push({ status: 'fail', msg }); totalErrors++; }
  function fixed(msg) { checks.push({ status: 'fixed', msg }); totalFixed++; }

  console.log(`\n${c.bold(`kits/${kitName}/`)}`);

  // ── Check 1: File exists ──
  if (!fs.existsSync(configPath)) {
    if (AUTO_FIX && isKitLikeDir(kitDir)) {
      // Generate a minimal lamatic.config.ts
      const configContent = generateMinimalConfig(kitName, kitDir);
      fs.writeFileSync(configPath, configContent);
      fixed('lamatic.config.ts created (was missing)');
      config = parseConfig(configPath);
    } else {
      fail('lamatic.config.ts does not exist');
      totalChecked++;
      checks.forEach(c => printCheck(c));
      return;
    }
  }
  if (!checks.some(ch => ch.status === 'fixed' && ch.msg.includes('lamatic.config.ts created'))) {
    pass('lamatic.config.ts exists');
  }

  // ── Check 2: Parseable ──
  if (!config) config = parseConfig(configPath);
  if (!config) {
    fail('lamatic.config.ts could not be parsed');
    totalChecked++;
    checks.forEach(c => printCheck(c));
    return;
  }
  pass('Parseable');

  // ── Check 3: Required fields ──
  const requiredFields = ['name', 'type', 'author', 'steps'];
  for (const field of requiredFields) {
    if (config[field] === undefined || config[field] === null) {
      fail(`Missing required field: ${field}`);
    }
  }
  if (config.links === undefined) {
    warn('Missing links object');
  }

  // ── Check 4: Name is non-empty ──
  if (!config.name || config.name === 'Unnamed' || config.name === 'Unnamed Kit') {
    warn(`Name is placeholder: "${config.name}"`);
  } else {
    pass(`Name: "${config.name}"`);
  }

  // ── Check 5: Type is valid ──
  const validTypes = ['kit', 'bundle', 'template'];
  if (!validTypes.includes(config.type)) {
    fail(`Invalid type: "${config.type}" (must be kit|bundle|template)`);
  }

  // ── Check 6: Type matches actual structure ──
  const hasApps = fs.existsSync(path.join(kitDir, 'apps'));
  const hasApp = fs.existsSync(path.join(kitDir, 'app'));
  const flowsDir = path.join(kitDir, 'flows');
  let flowCount = 0;
  if (fs.existsSync(flowsDir)) {
    flowCount = fs.readdirSync(flowsDir).filter(f => f.endsWith('.ts')).length;
  }

  if (config.type === 'kit' && !hasApps && !hasApp) {
    warn('Type is "kit" but no apps/ or app/ directory found');
  }
  if (config.type === 'template' && flowCount > 1) {
    warn(`Type is "template" but has ${flowCount} flow files (expected 1)`);
  }
  if (config.type === 'bundle' && flowCount < 2) {
    warn(`Type is "bundle" but has ${flowCount} flow files (expected 2+)`);
  }
  pass(`Type: "${config.type}"`);

  // ── Check 7: Author has name and email ──
  if (!config.author?.name) {
    warn('Author name is empty');
  }
  if (!config.author?.email) {
    warn('Author email is empty');
  }

  // ── Check 8: GitHub URL correctness ──
  const expectedGithub = `https://github.com/Lamatic/AgentKit/tree/main/kits/${kitName}`;
  if (config.links?.github) {
    if (config.links.github === expectedGithub) {
      pass('GitHub URL correct');
    } else if (config.links.github.includes('/Lamatic/AgentKit')) {
      // Points to Lamatic repo but wrong path
      fail(`GitHub URL has wrong path\n      Current:  ${config.links.github}\n      Expected: ${expectedGithub}`);
      if (AUTO_FIX) {
        config.links.github = expectedGithub;
        needsRewrite = true;
        fixed('GitHub URL auto-fixed');
      }
    } else {
      // Points to a fork or different repo
      warn(`GitHub URL points to non-Lamatic repo: ${config.links.github}`);
    }
  } else {
    warn('No GitHub URL in links');
    if (AUTO_FIX) {
      if (!config.links) config.links = {};
      config.links.github = expectedGithub;
      needsRewrite = true;
      fixed('GitHub URL added');
    }
  }

  // ── Check 9: Deploy URL correctness (kits only) ──
  if (config.type === 'kit' && config.links?.deploy) {
    const deployUrl = config.links.deploy;

    // Check root-directory param
    if (deployUrl.includes('root-directory=')) {
      const rootDirMatch = deployUrl.match(/root-directory=([^&]+)/);
      if (rootDirMatch) {
        const rootDir = decodeURIComponent(rootDirMatch[1]);
        const expectedRootDir = `kits/${kitName}/apps`;

        if (rootDir === expectedRootDir) {
          pass('Deploy URL root-directory correct');
        } else {
          fail(`Deploy URL root-directory wrong\n      Current:  ${rootDir}\n      Expected: ${expectedRootDir}`);
          if (AUTO_FIX) {
            config.links.deploy = deployUrl.replace(
              /root-directory=[^&]+/,
              `root-directory=${encodeURIComponent(expectedRootDir)}`
            );
            needsRewrite = true;
            fixed('Deploy URL root-directory auto-fixed');
          }
        }
      }
    }

    // Check repository-url param
    if (deployUrl.includes('repository-url=')) {
      const repoMatch = deployUrl.match(/repository-url=([^&]+)/);
      if (repoMatch) {
        const repoUrl = decodeURIComponent(repoMatch[1]);
        if (repoUrl === 'https://github.com/Lamatic/AgentKit') {
          pass('Deploy URL repository correct');
        } else {
          warn(`Deploy URL points to: ${repoUrl} (not Lamatic/AgentKit)`);
        }
      }
    }
  } else if (config.type === 'template' && config.links?.deploy) {
    // Templates deploy via studio
    if (config.links.deploy.includes('studio.lamatic.ai')) {
      pass('Deploy URL points to Lamatic Studio');
    }
  }

  // ── Check 10: Tags are clean ──
  if (Array.isArray(config.tags)) {
    const dirtyTags = config.tags.filter(t => /[^\w\s-]/.test(t));
    if (dirtyTags.length > 0) {
      warn(`Tags have non-alphanumeric chars: ${JSON.stringify(dirtyTags)}`);
      if (AUTO_FIX) {
        config.tags = config.tags.map(t =>
          t.replace(/^[^\w]+/, '').trim().toLowerCase()
        );
        needsRewrite = true;
        fixed('Tags cleaned');
      }
    } else {
      pass(`Tags: ${JSON.stringify(config.tags)}`);
    }
  }

  // ── Check 11: Steps reference existing flows ──
  if (Array.isArray(config.steps)) {
    for (const step of config.steps) {
      if (step.type === 'mandatory' && step.id) {
        const flowFile = path.join(flowsDir, `${step.id}.ts`);
        const flowDir = path.join(flowsDir, step.id);
        if (fs.existsSync(flowFile)) {
          pass(`Step "${step.id}" → flows/${step.id}.ts exists`);
        } else if (fs.existsSync(flowDir)) {
          pass(`Step "${step.id}" → flows/${step.id}/ exists (not yet flattened)`);
        } else {
          warn(`Step "${step.id}" has no matching flow file`);
        }
      }
      if (step.type === 'any-of' && step.options) {
        for (const opt of step.options) {
          const optFlow = path.join(flowsDir, `${opt.id}.ts`);
          const optDir = path.join(flowsDir, opt.id);
          if (!fs.existsSync(optFlow) && !fs.existsSync(optDir)) {
            warn(`Step option "${opt.id}" has no matching flow`);
          }
        }
      }
    }
  }

  // ── Check 12: Cross-reference with original ──
  const original = findOriginalConfig(kitName);
  if (original) {
    const orig = original.data;
    // Check name wasn't lost
    if (orig.name && config.name !== orig.name) {
      // Allow for cleaned names
      if (config.name === 'Unnamed' || config.name === 'Unnamed Kit') {
        warn(`Name was lost during migration (original: "${orig.name}")`);
      }
    }
    // Check deploy URL wasn't lost (for kits)
    const origDeploy = orig.deployUrl || orig.deploy;
    if (origDeploy && !config.links?.deploy) {
      warn(`Deploy URL existed in original but missing in migrated config`);
    }
    // Check author wasn't lost
    if (orig.author?.name && !config.author?.name) {
      warn(`Author name was lost (original: "${orig.author.name}")`);
    }
    pass(`Cross-referenced with ${original.path}`);
  } else {
    warn('No original config found for cross-reference');
  }

  // ── Check 13: agent.md exists ──
  const agentMdPath = path.join(kitDir, 'agent.md');
  if (fs.existsSync(agentMdPath)) {
    pass('agent.md exists');
  } else {
    warn('agent.md is missing');
    if (AUTO_FIX) {
      const agentMd = generateAgentMd(kitName, kitDir);
      fs.writeFileSync(agentMdPath, agentMd);
      fixed('agent.md generated');
    }
  }

  // ── Check 14: flows/flows.md exists ──
  const flowsMdPath = path.join(kitDir, 'flows', 'flows.md');
  if (fs.existsSync(flowsMdPath)) {
    pass('flows/flows.md exists');
  } else {
    warn('flows/flows.md is missing');
  }

  // ── Check 15: constitutions/default.md exists ──
  const constitutionPath = path.join(kitDir, 'constitutions', 'default.md');
  if (fs.existsSync(constitutionPath)) {
    pass('constitutions/default.md exists');
  } else {
    warn('constitutions/default.md is missing');
  }

  // ── Check 16: Flow .ts files have correct exports ──
  if (fs.existsSync(flowsDir)) {
    const flowTsFiles = fs.readdirSync(flowsDir).filter(f => f.endsWith('.ts'));
    for (const file of flowTsFiles) {
      const content = fs.readFileSync(path.join(flowsDir, file), 'utf8');
      const hasMeta = content.includes('export const meta');
      const hasInputs = content.includes('export const inputs');
      const hasReferences = content.includes('export const references');
      const hasNodes = content.includes('export const nodes');
      const hasEdges = content.includes('export const edges');
      const hasDefault = content.includes('export default');

      if (hasMeta && hasInputs && hasReferences && hasNodes && hasEdges && hasDefault) {
        pass(`flows/${file}: all exports present (meta, inputs, references, nodes, edges)`);
      } else {
        const missing = [];
        if (!hasMeta) missing.push('meta');
        if (!hasInputs) missing.push('inputs');
        if (!hasReferences) missing.push('references');
        if (!hasNodes) missing.push('nodes');
        if (!hasEdges) missing.push('edges');
        if (!hasDefault) missing.push('default export');
        warn(`flows/${file}: missing exports: ${missing.join(', ')}`);
      }
    }
  }

  // ── Check 17: Prompts referenced in flows actually exist ──
  if (fs.existsSync(flowsDir)) {
    const flowTsFiles = fs.readdirSync(flowsDir).filter(f => f.endsWith('.ts'));
    for (const file of flowTsFiles) {
      const content = fs.readFileSync(path.join(flowsDir, file), 'utf8');
      const promptRefs = content.matchAll(/@prompts\/([^\s"']+)/g);
      for (const match of promptRefs) {
        const promptFile = path.join(kitDir, 'prompts', match[1]);
        if (fs.existsSync(promptFile)) {
          pass(`@prompts/${match[1]} exists`);
        } else {
          fail(`@prompts/${match[1]} referenced but file missing`);
        }
      }
      const scriptRefs = content.matchAll(/@scripts\/([^\s"']+)/g);
      for (const match of scriptRefs) {
        const scriptFile = path.join(kitDir, 'scripts', match[1]);
        if (fs.existsSync(scriptFile)) {
          pass(`@scripts/${match[1]} exists`);
        } else {
          fail(`@scripts/${match[1]} referenced but file missing`);
        }
      }
    }
  }

  // ── Auto-fix: rewrite file ──
  if (needsRewrite && AUTO_FIX) {
    rewriteConfig(configPath, config);
  }

  // ── Print results ──
  checks.forEach(ch => printCheck(ch));
  totalChecked++;

  const hasErrors = checks.some(ch => ch.status === 'fail');
  const hasWarnings = checks.some(ch => ch.status === 'warn');
  if (!hasErrors && !hasWarnings) totalPassed++;
}

function printCheck(ch) {
  const icons = {
    pass: c.green('  ✓'),
    warn: c.yellow('  ⚠'),
    fail: c.red('  ✗'),
    fixed: c.blue('  ⚡'),
  };
  console.log(`${icons[ch.status]} ${ch.msg}`);
}

function rewriteConfig(filePath, config) {
  const ts = `export default {
  name: ${JSON.stringify(config.name)},
  description: ${JSON.stringify(config.description || '')},
  version: ${JSON.stringify(config.version || '1.0.0')},
  type: ${JSON.stringify(config.type)} as const,
  author: ${JSON.stringify(config.author || { name: '', email: '' })},
  tags: ${JSON.stringify(config.tags || [])},
  steps: ${JSON.stringify(config.steps || [], null, 4)},
  links: ${JSON.stringify(config.links || {}, null, 4)},
};
`;
  fs.writeFileSync(filePath, ts);
}

/**
 * Recursively discover all kit-like directories under kits/.
 * Skips category directories themselves but processes their children.
 */
function discoverKitDirs(baseDir) {
  const results = [];
  if (!fs.existsSync(baseDir)) return results;

  const entries = fs.readdirSync(baseDir, { withFileTypes: true })
    .filter(e => e.isDirectory())
    .map(e => e.name)
    .sort();

  for (const name of entries) {
    const fullPath = path.join(baseDir, name);
    if (isCategoryDir(fullPath)) {
      // Recurse into category directories
      const subKits = discoverKitDirs(fullPath);
      results.push(...subKits);
    } else if (isKitLikeDir(fullPath) || fs.existsSync(path.join(fullPath, 'lamatic.config.ts'))) {
      // Compute the relative kit name from the kits/ root
      const kitsRoot = path.join(REPO_ROOT, 'kits');
      const relName = path.relative(kitsRoot, fullPath);
      results.push({ name: relName, path: fullPath });
    }
  }

  return results;
}

// ── Main ──
console.log('');
console.log('╔══════════════════════════════════════════════════════╗');
console.log('║   AgentKit — Config Validation                      ║');
console.log(`║   MODE: ${AUTO_FIX ? 'VALIDATE + AUTO-FIX' : 'VALIDATE ONLY'}${''.padEnd(AUTO_FIX ? 13 : 19)}║`);
console.log('╚══════════════════════════════════════════════════════╝');

if (SINGLE) {
  validateKit(SINGLE);
} else {
  const kitsDir = path.join(REPO_ROOT, 'kits');

  // Discover all kit-like directories (including nested under categories)
  const allKits = discoverKitDirs(kitsDir);

  // Also find top-level kits with lamatic.config.ts that might not have flows/apps
  const topLevel = fs.readdirSync(kitsDir, { withFileTypes: true })
    .filter(e => e.isDirectory())
    .filter(e => fs.existsSync(path.join(kitsDir, e.name, 'lamatic.config.ts')))
    .map(e => ({ name: e.name, path: path.join(kitsDir, e.name) }));

  // Merge and deduplicate
  const kitMap = new Map();
  for (const kit of [...allKits, ...topLevel]) {
    kitMap.set(kit.path, kit);
  }
  const kits = Array.from(kitMap.values()).sort((a, b) => a.name.localeCompare(b.name));

  console.log(`\nFound ${kits.length} kit(s) to validate`);

  for (const kit of kits) {
    validateKit(kit.name);
  }
}

// ── Summary ──
console.log('');
console.log('━'.repeat(50));
console.log(`  Checked:  ${c.bold(totalChecked)}`);
console.log(`  Passed:   ${c.green(totalPassed)} (no issues)`);
console.log(`  Warnings: ${c.yellow(totalWarnings)}`);
console.log(`  Errors:   ${c.red(totalErrors)}`);
if (AUTO_FIX) console.log(`  Fixed:    ${c.blue(totalFixed)}`);
console.log('━'.repeat(50));

if (totalErrors > 0) {
  console.log(`\n${c.red('Some checks failed.')} Run with ${c.bold('--fix')} to auto-fix what's possible.`);
  process.exit(1);
} else if (totalWarnings > 0) {
  console.log(`\n${c.yellow('Warnings found.')} Review above and fix manually or run with ${c.bold('--fix')}.`);
} else {
  console.log(`\n${c.green('All configs valid!')}`);
}
