/**
 * Shared VM harness for the benchmarks and the regression tests.
 *
 * The browser scripts are plain, build-free files, so we load them into a
 * single VM context in order. Callers pass the script list they need (order
 * is preserved) and read globals out of the context's lexical scope.
 */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.join(__dirname, "..");

// Minimal set needed to run the rule engine (used by the benchmarks).
const ENGINE_SCRIPTS = [
  "rules/core.js", "rules/tool_failure.js", "rules/hallucination.js",
  "rules/rag.js", "rules/prompt.js", "rules/wrong_tool.js", "js/engine.js"
];

function createSandbox(scripts = ENGINE_SCRIPTS) {
  const sandbox = { console, module: { exports: {} } };
  vm.createContext(sandbox);
  for (const f of scripts) {
    vm.runInContext(fs.readFileSync(path.join(ROOT, f), "utf8"), sandbox, { filename: f });
  }
  // consts live in the context's lexical scope, so read them by evaluating the name
  const get = name => vm.runInContext(name, sandbox);
  return { sandbox, get };
}

module.exports = { createSandbox, ENGINE_SCRIPTS, ROOT };
