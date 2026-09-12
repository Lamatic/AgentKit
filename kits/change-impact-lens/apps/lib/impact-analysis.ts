/**
 * impact-analysis.ts — the reusable version of Stage 1's analyze.js.
 *
 * Same core logic (build graph → invert → BFS traversal), but as a
 * function that RETURNS data instead of printing to a terminal, so
 * orchestrate.ts (the server action) can call it directly.
 */

// @ts-ignore — madge has no official TypeScript types; treated as untyped, safe since we only call documented methods
import madge from "madge";
import path from "path";
import fs from "fs";

export interface DependentResult {
  file: string;
  hops: number;
}

export interface ImpactAnalysisResult {
  targetFile: string;
  maxHops: number;
  found: boolean;
  dependents: DependentResult[];
  warnings: Record<string, unknown>;
  availableFilesSample?: string[]; // only populated if targetFile wasn't found — helps debugging
}

async function buildDependentsGraph(targetFolder: string) {
  const tsConfigPath = path.join(targetFolder, "tsconfig.json");
  const jsConfigPath = path.join(targetFolder, "jsconfig.json");

  const madgeOptions: Record<string, unknown> = {
    fileExtensions: ["js", "jsx", "ts", "tsx"],
    // .next/ is Next.js's own auto-generated build output — never
    // hand-written source, and including it just adds noise (or worse,
    // false "impact" results) to what should be a developer-facing tool.
    excludeRegExp: [/(^|\/)\.next\//],
  };

  if (fs.existsSync(tsConfigPath)) {
    madgeOptions.tsConfig = tsConfigPath;
  } else if (fs.existsSync(jsConfigPath)) {
    madgeOptions.tsConfig = jsConfigPath;
  } else {
    // Fallback to the standard Next.js "@/*" -> project root convention.
    // Forward slashes used deliberately — confirmed necessary on Windows
    // paths during Stage 1 testing (see analyze.js history).
    const normalizedBaseUrl = targetFolder.split(path.sep).join("/");
    madgeOptions.tsConfig = {
      compilerOptions: {
        baseUrl: normalizedBaseUrl,
        paths: { "@/*": ["./*"] },
      },
    };
  }

  const result = await madge(targetFolder, madgeOptions as any);
  const dependencyGraph = result.obj();

  const dependentsGraph: Record<string, string[]> = {};
  for (const file of Object.keys(dependencyGraph)) {
    dependentsGraph[file] = [];
  }
  for (const [file, imports] of Object.entries(dependencyGraph)) {
    for (const imported of imports as string[]) {
      if (!dependentsGraph[imported]) dependentsGraph[imported] = [];
      dependentsGraph[imported].push(file);
    }
  }

  return { dependencyGraph, dependentsGraph, warnings: result.warnings() };
}

function findTransitiveDependents(
  dependentsGraph: Record<string, string[]>,
  targetFile: string,
  maxHops: number
): DependentResult[] {
  const visited = new Map<string, number>();
  const queue: { file: string; hops: number }[] = [{ file: targetFile, hops: 0 }];
  visited.set(targetFile, 0);

  while (queue.length > 0) {
    const { file, hops } = queue.shift()!;
    if (hops >= maxHops) continue;

    const directDependents = dependentsGraph[file] || [];
    for (const dependent of directDependents) {
      if (!visited.has(dependent)) {
        visited.set(dependent, hops + 1);
        queue.push({ file: dependent, hops: hops + 1 });
      }
    }
  }

  visited.delete(targetFile);
  return [...visited.entries()]
    .map(([file, hops]) => ({ file, hops }))
    .sort((a, b) => a.hops - b.hops);
}

/**
 * Main entry point other code should call.
 *
 * @param targetFolder absolute path to a kit's apps/ folder to analyze
 * @param targetFile relative path (e.g. "lib/utils.ts") within that folder
 * @param maxHops how many hops of indirect impact to trace (default 3)
 */
export async function analyzeImpact(
  targetFolder: string,
  targetFile: string,
  maxHops = 3
): Promise<ImpactAnalysisResult> {
  const { dependencyGraph, dependentsGraph, warnings } = await buildDependentsGraph(targetFolder);

  if (!(targetFile in dependencyGraph)) {
    return {
      targetFile,
      maxHops,
      found: false,
      dependents: [],
      warnings,
      availableFilesSample: Object.keys(dependencyGraph).slice(0, 20),
    };
  }

  const dependents = findTransitiveDependents(dependentsGraph, targetFile, maxHops);

  return {
    targetFile,
    maxHops,
    found: true,
    dependents,
    warnings,
  };
}