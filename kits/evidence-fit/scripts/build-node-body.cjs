// Run after npm ci in ../apps. Bind node ids in the readable source before building.
// Usage: node build-node-body.cjs <source.ts> <output.js>
const fs = require("node:fs");
const path = require("node:path");
const { createRequire } = require("node:module");
const appRequire = createRequire(path.join(__dirname, "../apps/package.json"));
const esbuild = appRequire("esbuild");
const ts = appRequire("typescript");

function buildNodeBody(source) {
  // Select engine declarations reachable from the Lamatic glue. Scan the AST,
  // so comments cannot accidentally retain an unused engine function.
  const marker = "// ---- END VENDORED ----";
  if (source.includes(marker)) {
    const boundary = source.indexOf(marker) + marker.length;
    const engine = ts.createSourceFile("engine.ts", source.slice(0, boundary), ts.ScriptTarget.Latest, true);
    const glue = source.slice(boundary);
    const declarations = new Map();
    for (const statement of engine.statements) {
      if (statement.name) declarations.set(statement.name.text, statement);
      if (ts.isVariableStatement(statement)) {
        for (const declaration of statement.declarationList.declarations) declarations.set(declaration.name.text, statement);
      }
    }
    const kept = new Set();
    function visit(node) {
      if (ts.isIdentifier(node)) {
        const declaration = declarations.get(node.text);
        if (declaration && !kept.has(declaration)) {
          kept.add(declaration);
          ts.forEachChild(declaration, visit);
        }
      }
      ts.forEachChild(node, visit);
    }
    visit(ts.createSourceFile("glue.ts", glue, ts.ScriptTarget.Latest, true));
    source = engine.statements.filter(statement => kept.has(statement)).map(statement => statement.getText(engine)).join("\n") + glue;
  }
  const templates = [];
  let body = source.replace(/^export\s+/gm, "").replace(/\{\{[^}]*\}\}/g, (template) => {
    templates.push(template);
    return `__LAMATIC_TEMPLATE_${templates.length - 1}__`;
  });
  // Keep issue codes and context intact; node error messages use the code as
  // their short label. The app and vendored source retain their full guidance.
  const parsed = ts.createSourceFile("node.ts", body, ts.ScriptTarget.Latest, true);
  const transformed = ts.transform(parsed, [context => root => {
    const visit = node => {
      if (ts.isObjectLiteralExpression(node)) {
        const code = node.properties.find(p => ts.isPropertyAssignment(p) && p.name.getText(parsed) === "code" && ts.isStringLiteral(p.initializer));
        if (code) return ts.factory.updateObjectLiteralExpression(node, node.properties.map(p =>
          ts.isPropertyAssignment(p) && p.name.getText(parsed) === "message"
            ? ts.factory.updatePropertyAssignment(p, p.name, code.initializer) : ts.visitEachChild(p, visit, context)));
      }
      return ts.visitEachChild(node, visit, context);
    };
    return ts.visitNode(root, visit);
  }]);
  body = ts.createPrinter({ removeComments: true }).printFile(transformed.transformed[0]);
  transformed.dispose();
  // Local scope allows dead-code elimination and identifier mangling, while the
  // outer assignment preserves Lamatic's output contract. Source stays verbatim.
  const minified = esbuild.transformSync(`output=(()=>{let output;\n${body}\nreturn output})();`, {
    loader: "ts",
    target: "es2020",
    minify: true,
    treeShaking: true,
    legalComments: "none",
  }).code;

  return escapeRawNewlines(minified).replace(
    /__LAMATIC_TEMPLATE_(\d+)__/g,
    (_, i) => templates[Number(i)]
  );
}

/**
 * Minified output is one line, so any raw newline left in it sits inside a template
 * literal — esbuild rewrites the source's `"\n"` escape into a backtick literal holding
 * a real newline. That is a live bug rather than a cosmetic one: the byte then travels
 * through git's CRLF normalisation and a copy-paste into Studio's editor, and a `\n`
 * that arrives as `\r\n` turns a one-character Set member into a two-character string.
 * `CLAUSE_TERMINATORS.has(text[i])` tests one character at a time, so newline silently
 * stops being a clause terminator and clause-aware chunking changes shape.
 *
 * Escaping is semantics-preserving — inside a template literal `\n` and a raw newline
 * are the same character — but the result is verified to still parse before it is
 * returned, rather than trusted.
 */
function escapeRawNewlines(code) {
  // esbuild terminates its output with a newline. That one is outside any literal, so
  // it is dropped rather than escaped.
  const trimmed = code.replace(/\n$/, "");
  const escaped = trimmed.replace(/\r/g, "\\r").replace(/\n/g, "\\n");
  if (escaped === trimmed) return trimmed;
  try {
    new Function(escaped);
  } catch {
    throw new Error(
      "Escaping raw newlines produced unparsable output — a newline was emitted outside a " +
        "template literal. Inspect the minifier output before shipping this body."
    );
  }
  return escaped;
}

module.exports = { buildNodeBody };
if (require.main === module) {
  const [, , input, output] = process.argv;
  if (!input || !output) throw new Error("Usage: node build-node-body.cjs <source.ts> <output.js>");
  const body = buildNodeBody(fs.readFileSync(input, "utf8"));
  const bytes = Buffer.byteLength(body);
  // Enforce both interpretations of the platform's code-size limit.
  if (Math.max(body.length, bytes) > 10000) throw new Error(`Code body exceeds 10,000: ${body.length} characters, ${bytes} bytes`);
  fs.writeFileSync(output, body);
  console.log(`${path.basename(output)}: ${body.length} characters, ${bytes} bytes`);
}
