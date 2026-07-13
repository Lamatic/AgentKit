import type { Suite, Run } from '@/types';

/**
 * In-memory store for suites, runs, and the baseline pointer. The core path
 * deliberately needs NO external database: eval infrastructure must be
 * reproducible, and hidden persistence in judge flows would poison comparisons.
 * Runs export/import as JSON. A Supabase adapter can sit behind this interface
 * later (STORAGE=memory|supabase) without touching callers.
 */

interface DB {
  suites: Map<string, Suite>;
  runs: Map<string, Run>;
  baselineBySuiteVersion: Map<string, string>; // `${suiteId}@${version}` -> runId
}

// Survive Next.js hot reloads in dev by stashing on globalThis.
const g = globalThis as unknown as { __flowguardDB?: DB };
const db: DB =
  g.__flowguardDB ??
  (g.__flowguardDB = {
    suites: new Map(),
    runs: new Map(),
    baselineBySuiteVersion: new Map(),
  });

const svKey = (suiteId: string, version: number) => `${suiteId}@${version}`;

export const store = {
  saveSuite(s: Suite) {
    db.suites.set(s.id, s);
    return s;
  },
  getSuite(id: string) {
    return db.suites.get(id) ?? null;
  },
  listSuites() {
    return [...db.suites.values()];
  },

  saveRun(r: Run) {
    db.runs.set(r.id, r);
    return r;
  },
  getRun(id: string) {
    return db.runs.get(id) ?? null;
  },
  listRuns(suiteId?: string) {
    const all = [...db.runs.values()];
    return suiteId ? all.filter((r) => r.suiteId === suiteId) : all;
  },

  setBaseline(run: Run) {
    db.baselineBySuiteVersion.set(svKey(run.suiteId, run.suiteVersion), run.id);
    for (const r of db.runs.values()) {
      if (r.suiteId === run.suiteId && r.suiteVersion === run.suiteVersion) {
        r.isBaseline = r.id === run.id;
      }
    }
  },
  getBaseline(suiteId: string, version: number): Run | null {
    const id = db.baselineBySuiteVersion.get(svKey(suiteId, version));
    return id ? db.runs.get(id) ?? null : null;
  },

  exportAll() {
    return {
      suites: [...db.suites.values()],
      runs: [...db.runs.values()],
      baselines: [...db.baselineBySuiteVersion.entries()],
    };
  },
  importAll(data: {
    suites?: Suite[];
    runs?: Run[];
    baselines?: [string, string][];
  }) {
    (data.suites ?? []).forEach((s) => db.suites.set(s.id, s));
    (data.runs ?? []).forEach((r) => db.runs.set(r.id, r));
    (data.baselines ?? []).forEach(([k, v]) => db.baselineBySuiteVersion.set(k, v));
  },
};
