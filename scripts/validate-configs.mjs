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

// ── Find original config.json for cross-reference ──
function findOriginalConfig(kitName) {
  // Check old kit locations
  const kitPaths = [
    `kits/agentic/${kitName}/config.json`,
    `kits/automation/${kitName}/config.json`,
    `kits/embed/${kitName}/config.json`,
    `kits/assistant/${kitName}/config.json`,
    `kits/sample/${kitName}/config.json`,
    `kits/special/${kitName}/config.json`,
  ];
  // Handle renames
  const renameMap = {
    'embed-chat': 'kits/embed/chat/config.json',
    'embed-search': 'kits/embed/search/config.json',
    'embed-sheets': 'kits/embed/sheets/config.json',
    'content-generation': 'kits/sample/content-generation/config.json',
    'halloween-costume-generator': 'kits/special/halloween-costume-generator/config.json',
  };
  if (renameMap[kitName]) kitPaths.unshift(renameMap[kitName]);

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
    fail('lamatic.config.ts does not exist');
    totalChecked++;
    checks.forEach(c => printCheck(c));
    return;
  }
  pass('lamatic.config.ts exists');

  // ── Check 2: Parseable ──
  config = parseConfig(configPath);
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

// ── Main ──
console.log('');
console.log('╔══════════════════════════════════════════════════════╗');
console.log('║   AgentKit — Config Validation                      ║');
console.log(`║   MODE: ${AUTO_FIX ? 'VALIDATE + AUTO-FIX' : 'VALIDATE ONLY'}${''.padEnd(AUTO_FIX ? 13 : 19)}║`);
console.log('╚══════════════════════════════════════════════════════╝');

if (SINGLE) {
  validateKit(SINGLE);
} else {
  // Find all kits with lamatic.config.ts
  const kitsDir = path.join(REPO_ROOT, 'kits');
  const entries = fs.readdirSync(kitsDir, { withFileTypes: true })
    .filter(e => e.isDirectory())
    .filter(e => fs.existsSync(path.join(kitsDir, e.name, 'lamatic.config.ts')))
    .map(e => e.name)
    .sort();

  console.log(`\nFound ${entries.length} kits with lamatic.config.ts`);

  for (const kitName of entries) {
    validateKit(kitName);
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
