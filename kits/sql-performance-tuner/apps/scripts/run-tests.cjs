const assert = require("node:assert/strict");
const fs = require("node:fs");
const ts = require("typescript");

require.extensions[".ts"] = (module, filename) => {
  const source = fs.readFileSync(filename, "utf8");
  const output = ts.transpileModule(source, {
    compilerOptions: {
      esModuleInterop: true,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
    fileName: filename,
  });
  module._compile(output.outputText, filename);
};

const {
  AGENT_CONTRACT_VERSION,
  MAX_REQUEST_BODY_BYTES,
  MAX_RESULT_BYTES,
  strategistInputSchema,
} = require("../lib/contracts.ts");
const { createDemoDatabase, DEMO_QUERY } = require("../lib/demo-database.ts");
const { chooseNextExperiment, normalizeReviewerOutput } = require("../lib/planner.ts");
const {
  checkLocalRateLimit,
  checkRedisRateLimit,
  RateLimitConfigurationError,
} = require("../lib/rate-limit.ts");
const {
  InvalidRequestBodyError,
  readBoundedJsonBody,
  RequestBodyTooLargeError,
} = require("../lib/request-body.ts");
const { queryHasExplicitOrder, validateReadOnlyQuery } = require("../lib/sql-safety.ts");
const { getSqlJs } = require("../lib/sqlite-engine.ts");
const { runSqlWorkerTask } = require("../lib/sql-worker.ts");
const { selectWinningExperiment, tuneQuery, tuneQueryWithDependencies } = require("../lib/tuner.ts");
const { POST } = require("../app/api/tune/route.ts");

const benchmark = {
  warmupRuns: 1,
  measuredRuns: [10, 11, 10, 9, 10],
  medianMs: 10,
};

const result = {
  columns: ["customer_id", "revenue"],
  rowCount: 2,
  ordered: false,
  hash: "fixture-result-hash",
  exceededRowLimit: false,
};

const baseline = {
  query: DEMO_QUERY,
  plan: [{ id: 1, parentId: 0, detail: "SCAN orders" }],
  result,
  benchmark,
};

const schema = [{
  name: "orders",
  columns: [
    { name: "customer_id", declaredType: "INTEGER", nullable: false, primaryKeyPosition: 0 },
    { name: "created_at", declaredType: "TEXT", nullable: false, primaryKeyPosition: 0 },
    { name: "total", declaredType: "REAL", nullable: false, primaryKeyPosition: 0 },
    { name: "status", declaredType: "TEXT", nullable: false, primaryKeyPosition: 0 },
  ],
  indexes: [],
}];

const baseAdaptation = {
  learnedFromEvidence: "The prior evidence was considered.",
  differsFromPrevious: "This candidate changes the tested access path.",
};

function decision(overrides = {}) {
  return {
    contractVersion: AGENT_CONTRACT_VERSION,
    action: "create_index",
    strategy: "filter_first_index",
    hypothesis: "A filter-first index should reduce scanned rows.",
    expectedPlanChange: "SCAN orders -> SEARCH orders USING COVERING INDEX",
    indexSql: "CREATE INDEX idx_orders_created_customer_total ON orders(created_at, customer_id, total);",
    adaptation: {
      learnedFromEvidence: "No prior measured evidence was available.",
      differsFromPrevious: "This is the first proposed experiment.",
    },
    stopConditions: ["Stop if the candidate is unsafe, changes results, or is not at least 1.10x faster."],
    ...overrides,
  };
}

function reviewer() {
  return async (_mode, input) => ({
    contractVersion: AGENT_CONTRACT_VERSION,
    headline: input.deterministicOutcome === "improved" ? "Improvement proven" : "No measured improvement was proven",
    evidenceSummary: `${input.experiments.length} experiment(s) were evaluated.`,
    recommendation: input.winningExperimentNumber
      ? `Use experiment ${input.winningExperimentNumber}.`
      : "Keep the original query.",
    limitations: ["Validate against representative production data."],
    citedExperiments: input.experiments.map((experiment) => experiment.number),
  });
}

function plannerFrom(decisions) {
  let callCount = 0;
  return {
    get calls() {
      return callCount;
    },
    chooseNextExperiment: async (mode, input) => {
      callCount += 1;
      return decisions(input, callCount, mode);
    },
  };
}

async function main() {
  const firstInput = strategistInputSchema.parse({
    contractVersion: AGENT_CONTRACT_VERSION,
    originalQuery: DEMO_QUERY,
    schema,
    baseline,
    experiments: [],
    attemptedStrategies: [],
    remainingExperiments: 5,
  });
  assert.equal(strategistInputSchema.safeParse({
    ...firstInput,
    remainingExperiments: 4,
  }).success, false, "Under-counted experiment budgets must be rejected.");

  assert.deepEqual(
    await readBoundedJsonBody(new Request("http://localhost/api/tune", {
      method: "POST",
      body: JSON.stringify({ query: "SELECT 1" }),
    })),
    { query: "SELECT 1" },
  );
  const oversizedStream = new ReadableStream({
    start(controller) {
      controller.enqueue(new Uint8Array([1, 2, 3, 4]));
      controller.enqueue(new Uint8Array([5, 6, 7, 8]));
      controller.close();
    },
  });
  await assert.rejects(
    readBoundedJsonBody(new Request("http://localhost/api/tune", {
      method: "POST",
      body: oversizedStream,
      duplex: "half",
    }), 6),
    RequestBodyTooLargeError,
    "Chunked request bodies must be capped even without Content-Length.",
  );
  await assert.rejects(
    readBoundedJsonBody(new Request("http://localhost/api/tune", {
      method: "POST",
      headers: { "content-length": String(MAX_REQUEST_BODY_BYTES + 1) },
      body: "{}",
    })),
    RequestBodyTooLargeError,
    "Oversized declared bodies must be rejected before parsing.",
  );
  await assert.rejects(
    readBoundedJsonBody(new Request("http://localhost/api/tune", {
      method: "POST",
      body: "{not-json}",
    })),
    InvalidRequestBodyError,
    "Malformed JSON must be classified as invalid input.",
  );
  await assert.rejects(
    readBoundedJsonBody(new Request("http://localhost/api/tune", {
      method: "POST",
      body: new Uint8Array([0xc3, 0x28]),
    })),
    InvalidRequestBodyError,
    "Invalid UTF-8 must be classified as invalid input.",
  );
  assert.equal((await POST(new Request("http://localhost/api/tune", {
    method: "POST",
    body: "{not-json}",
  }))).status, 400, "Malformed JSON must return HTTP 400.");

  const globalStyles = fs.readFileSync(`${__dirname}/../app/globals.css`, "utf8");
  assert.match(globalStyles, /\.source-chip:focus-within\s*\{/);
  assert.match(globalStyles, /\.editor-wrap:focus-within\s*\{/);
  const firstProposal = await chooseNextExperiment("demo", firstInput);
  assert.equal(firstProposal.action, "create_index", "No previous experiments should produce a safe first proposal.");
  assert.equal(firstProposal.strategy, "filter_first_index");
  assert.match(firstProposal.indexSql, /^CREATE INDEX/i);

  const liveEnvironmentKeys = [
    "SQL_TUNER_ALLOW_LIVE",
    "LAMATIC_API_URL",
    "LAMATIC_PROJECT_ID",
    "LAMATIC_API_KEY",
    "SQL_TUNER_STRATEGIST_FLOW_ID",
  ];
  const originalLiveEnvironment = Object.fromEntries(
    liveEnvironmentKeys.map((key) => [key, process.env[key]]),
  );
  const originalFetch = global.fetch;
  const originalConsoleError = console.error;
  const errorLogs = [];
  try {
    process.env.SQL_TUNER_ALLOW_LIVE = "true";
    process.env.LAMATIC_API_URL = "https://lamatic.invalid/graphql";
    process.env.LAMATIC_PROJECT_ID = "test-project";
    process.env.LAMATIC_API_KEY = "test-api-key";
    process.env.SQL_TUNER_STRATEGIST_FLOW_ID = "test-flow";
    let liveFetchOptions;
    global.fetch = async (_url, options) => {
      liveFetchOptions = options;
      return new Response(JSON.stringify({
        errors: [{ message: "apiKey=super-secret; SELECT customer_id FROM orders" }],
      }), {
        status: 500,
        statusText: "Internal Server Error",
        headers: { "x-request-id": "safe-request-id" },
      });
    };
    console.error = (...args) => errorLogs.push(args);
    await assert.rejects(
      chooseNextExperiment("live", firstInput),
      /request failed with HTTP 500/,
    );
    assert.equal(liveFetchOptions.redirect, "error", "Credential-bearing Lamatic calls must reject redirects.");

    process.env.LAMATIC_API_URL = "http://lamatic.invalid/graphql";
    let insecureFetchCalled = false;
    global.fetch = async () => {
      insecureFetchCalled = true;
      throw new Error("Fetch must not be called for an insecure endpoint.");
    };
    await assert.rejects(
      chooseNextExperiment("live", firstInput),
      /must use HTTPS/,
      "Lamatic credentials must never be sent over HTTP.",
    );
    assert.equal(insecureFetchCalled, false);
  } finally {
    global.fetch = originalFetch;
    console.error = originalConsoleError;
    for (const key of liveEnvironmentKeys) {
      const value = originalLiveEnvironment[key];
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
  assert.equal(errorLogs.length, 1, "An upstream HTTP failure should produce one server log entry.");
  const serializedErrorLog = JSON.stringify(errorLogs[0]);
  assert.match(serializedErrorLog, /safe-request-id/);
  assert.match(serializedErrorLog, /\[REDACTED\]/);
  assert.doesNotMatch(serializedErrorLog, /super-secret|SELECT customer_id/);

  const exhausted = await chooseNextExperiment("demo", { ...firstInput, remainingExperiments: 0 });
  assert.equal(exhausted.action, "conclude", "Remaining budget 0 should conclude.");
  assert.equal(exhausted.conclusionCode, "budget_exhausted");

  const adaptivePlanner = plannerFrom((input, call) => {
    if (call === 1) {
      return decision({
        strategy: "grouping_first_index",
        indexSql: "CREATE INDEX idx_orders_customer_total ON orders(customer_id, total);",
      });
    }
    assert.equal(input.experiments[0]?.strategy, "grouping_first_index");
    assert.ok(input.experiments[0]?.observation, "Measured observation should be supplied to the next planner turn.");
    if (call === 2) {
      return decision({
        strategy: "filter_first_index",
        adaptation: {
          learnedFromEvidence: "The grouping-first candidate did not prove a win.",
          differsFromPrevious: "This puts the WHERE column before grouping and aggregate columns.",
          respondsToExperiment: 1,
        },
      });
    }
    return {
      contractVersion: AGENT_CONTRACT_VERSION,
      action: "conclude",
      strategy: "conclude",
      conclusionCode: "winner_found",
      reasoning: "Enough evidence was collected.",
      evidenceUsed: input.experiments.map((experiment) => experiment.number),
    };
  });
  const adaptiveReport = await tuneQueryWithDependencies(DEMO_QUERY, "demo", {
    chooseNextExperiment: adaptivePlanner.chooseNextExperiment,
    reviewTuningOutcome: reviewer(),
  });
  assert.equal(adaptiveReport.experiments[0]?.strategy, "grouping_first_index");
  assert.equal(adaptiveReport.experiments[1]?.strategy, "filter_first_index");
  assert.match(adaptiveReport.experiments[1]?.adaptation?.differsFromPrevious ?? "", /WHERE column|filter/i);

  const pivotPlanner = plannerFrom((input, call) => {
    if (call === 1) {
      return decision({
        strategy: "partial_index",
        indexSql: "CREATE INDEX idx_orders_partial ON orders(created_at) WHERE status = 'paid';",
      });
    }
    if (call === 2) {
      return decision({
        strategy: "grouping_first_index",
        indexSql: "CREATE INDEX idx_orders_unknown ON orders(not_a_column);",
        adaptation: baseAdaptation,
      });
    }
    if (call === 3) {
      return decision({
        action: "rewrite_query",
        strategy: "query_rewrite",
        sql: DEMO_QUERY,
        adaptation: {
          learnedFromEvidence: "Two index candidates were rejected by deterministic guards.",
          differsFromPrevious: "This changes query shape instead of adding another index.",
          respondsToExperiment: 2,
        },
      });
    }
    return {
      contractVersion: AGENT_CONTRACT_VERSION,
      action: "conclude",
      strategy: "conclude",
      conclusionCode: "no_safe_distinct_experiment",
      reasoning: "Stop after the rewrite attempt.",
      evidenceUsed: input.experiments.map((experiment) => experiment.number),
    };
  });
  const pivotReport = await tuneQueryWithDependencies(DEMO_QUERY, "demo", {
    chooseNextExperiment: pivotPlanner.chooseNextExperiment,
    reviewTuningOutcome: reviewer(),
  });
  assert.equal(pivotReport.experiments[0]?.verdict, "guard-rejected", "Unsafe SQL should be guard-rejected.");
  assert.equal(pivotReport.experiments[1]?.verdict, "guard-rejected");
  assert.equal(pivotReport.experiments[2]?.kind, "rewrite_query", "Two unsuccessful indexes should lead to a rewrite, revision, or conclusion.");

  const duplicatePlanner = plannerFrom((_input, call) => {
    if (call === 1) {
      return decision({
        indexSql: "CREATE INDEX idx_orders_a ON orders(created_at, customer_id, total);",
      });
    }
    return decision({
      indexSql: "CREATE INDEX idx_orders_b ON orders(total, customer_id, created_at);",
      adaptation: {
        learnedFromEvidence: "The prior index was already tested.",
        differsFromPrevious: "Only the column order changed.",
        respondsToExperiment: 1,
      },
    });
  });
  const duplicateReport = await tuneQueryWithDependencies(DEMO_QUERY, "demo", {
    chooseNextExperiment: duplicatePlanner.chooseNextExperiment,
    reviewTuningOutcome: reviewer(),
  });
  assert.equal(duplicatePlanner.calls, 3);
  assert.equal(duplicateReport.experiments.length, 2, "Different index column orders must be evaluated independently.");

  const exactDuplicatePlanner = plannerFrom((_input, call) => decision({
    indexSql: call === 1
      ? "CREATE INDEX idx_orders_first ON orders(created_at, customer_id, total);"
      : "CREATE INDEX idx_orders_second ON orders(created_at, customer_id, total);",
  }));
  const exactDuplicateReport = await tuneQueryWithDependencies(DEMO_QUERY, "demo", {
    chooseNextExperiment: exactDuplicatePlanner.chooseNextExperiment,
    reviewTuningOutcome: reviewer(),
  });
  assert.equal(exactDuplicateReport.experiments.length, 1, "Equivalent index column ordering should execute only once.");

  const nonEquivalentPlanner = plannerFrom((_input, call) => call === 1
    ? decision({
      action: "rewrite_query",
      strategy: "query_rewrite",
      sql: "SELECT customer_id FROM orders WHERE created_at >= '2026-01-01'",
    })
    : {
      contractVersion: AGENT_CONTRACT_VERSION,
      action: "conclude",
      strategy: "conclude",
      conclusionCode: "no_safe_distinct_experiment",
      reasoning: "The rewrite changed result shape.",
      evidenceUsed: [1],
    });
  const nonEquivalentReport = await tuneQueryWithDependencies(DEMO_QUERY, "demo", {
    chooseNextExperiment: nonEquivalentPlanner.chooseNextExperiment,
    reviewTuningOutcome: reviewer(),
  });
  assert.equal(nonEquivalentReport.experiments[0]?.verdict, "non-equivalent", "Non-equivalent rewrites should be rejected.");

  const belowThreshold = {
    number: 1,
    kind: "create_index",
    strategy: "filter_first_index",
    hypothesis: "Synthetic near-improvement.",
    candidateSql: "CREATE INDEX idx_orders_created_at ON orders(created_at);",
    expectedPlanChange: "SEARCH orders USING INDEX",
    verdict: "improved",
    failureClass: "none",
    summary: "Synthetic fixture.",
    observation: "Measured only 1.09x faster.",
    equivalence: true,
    speedup: 1.09,
  };
  assert.equal(selectWinningExperiment([belowThreshold]), undefined, "Improvements below 1.10x should not be winners.");

  const reviewInput = {
    contractVersion: AGENT_CONTRACT_VERSION,
    originalQuery: DEMO_QUERY,
    baseline,
    experiments: duplicateReport.experiments,
    deterministicOutcome: "no-proven-improvement",
  };
  assert.throws(
    () => normalizeReviewerOutput({
      outcome: "improved",
      headline: "Use it",
      evidenceSummary: "Contradiction.",
      recommendation: "Use a candidate.",
      limitationsText: "Fixture.",
      citedExperimentsCsv: "3",
    }, reviewInput),
    /contradicted/,
    "Reviewer cannot contradict deterministic outcome.",
  );
  assert.deepEqual(
    normalizeReviewerOutput({
      outcome: "no_proven_improvement",
      headline: "No measured improvement was proven",
      evidenceSummary: "No winner.",
      recommendation: "Keep the original query.",
      limitationsText: "Fixture.",
      citedExperimentsCsv: 1,
    }, reviewInput).citedExperiments,
    [1],
    "Reviewer CSV fields should normalize numeric values.",
  );
  assert.deepEqual(
    normalizeReviewerOutput({
      outcome: "no_proven_improvement",
      headline: "No measured improvement was proven",
      evidenceSummary: "No winner.",
      recommendation: "Keep the original query.",
      limitationsText: "Fixture.",
      citedExperimentsCsv: "1, 2, 2",
    }, reviewInput).citedExperiments,
    [1, 2],
    "Reviewer CSV fields should normalize string values.",
  );

  assert.throws(
    () => normalizeReviewerOutput({
      outcome: "no_proven_improvement",
      headline: "No measured improvement was proven",
      evidenceSummary: "No winner.",
      recommendation: "Keep the original query.",
      limitationsText: "Fixture.",
      citedExperimentsCsv: "1, nope",
    }, reviewInput),
    /malformed/,
    "Malformed reviewer citations must be rejected.",
  );

  assert.throws(
    () => normalizeReviewerOutput({
      outcome: "no_proven_improvement",
      headline: "No measured improvement was proven",
      evidenceSummary: "No winner.",
      recommendation: "Use an unrelated experiment.",
      limitationsText: "Fixture.",
      citedExperimentsCsv: "3",
    }, reviewInput),
    /not supplied/,
    "Reviewer citations must refer to supplied experiments.",
  );

  assert.throws(
    () => validateReadOnlyQuery("WITH RECURSIVE counter(x) AS (SELECT 1 UNION ALL SELECT x + 1 FROM counter) SELECT x FROM counter"),
    /Recursive CTEs/,
  );
  assert.throws(
    () => validateReadOnlyQuery("WITH counter(x) AS (SELECT 1 UNION ALL SELECT x + 1 FROM counter) SELECT x FROM counter"),
    /Recursive CTEs/,
    "SQLite recursive CTEs must be rejected even without the optional RECURSIVE keyword.",
  );
  assert.throws(
    () => validateReadOnlyQuery('WITH "counter"(x) AS (SELECT 1 UNION ALL SELECT x + 1 FROM "counter") SELECT x FROM "counter"'),
    /Recursive CTEs/,
    "Quoted recursive CTE names must also be rejected.",
  );
  assert.doesNotThrow(
    () => validateReadOnlyQuery('WITH "recursive" AS (SELECT 1) SELECT * FROM "recursive"'),
    "A quoted CTE named recursive must not be treated as the RECURSIVE keyword.",
  );
  for (const currentTimeQuery of [
    "SELECT datetime()",
    "SELECT date('now')",
    "SELECT unixepoch('subsec')",
    "SELECT strftime('%s')",
    "SELECT strftime('%s', 'now')",
    "SELECT datetime('n' || 'ow')",
  ]) {
    assert.throws(
      () => validateReadOnlyQuery(currentTimeQuery),
      /Non-deterministic/,
      `${currentTimeQuery} must be rejected as a current-time expression.`,
    );
  }
  assert.doesNotThrow(() => validateReadOnlyQuery("SELECT date('2026-01-01')"));
  for (const deterministicQuotedIdentifierQuery of [
    'SELECT 1 AS "CURRENT_TIMESTAMP"',
    'SELECT 1 AS "CURRENT_DATE"',
    'SELECT 1 AS "CURRENT_TIME"',
    'SELECT 1 AS "RANDOM"',
    'SELECT 1 AS "RANDOMBLOB"',
    'SELECT 1 AS "ZEROBLOB"',
    "SELECT 1 AS `CURRENT_TIMESTAMP`",
    "SELECT 1 AS [CURRENT_TIMESTAMP]",
  ]) {
    assert.doesNotThrow(
      () => validateReadOnlyQuery(deterministicQuotedIdentifierQuery),
      `${deterministicQuotedIdentifierQuery} must treat the quoted name as an identifier, not an unsafe expression.`,
    );
  }
  for (const nondeterministicLiteralQuery of [
    "SELECT CURRENT_TIMESTAMP",
    "SELECT CURRENT_DATE",
    "SELECT CURRENT_TIME",
  ]) {
    assert.throws(
      () => validateReadOnlyQuery(nondeterministicLiteralQuery),
      /Non-deterministic/,
      `${nondeterministicLiteralQuery} must reject SQLite's bare current-time literal.`,
    );
  }
  for (const quotedNondeterministicQuery of [
    'SELECT "random"()',
    'SELECT "randomblob"(67108864)',
    "SELECT `randomblob`(67108864)",
    "SELECT [randomblob](67108864)",
    'SELECT "date"("now")',
    'SELECT "time"("now")',
    'SELECT "datetime"("now")',
    'SELECT "julianday"("now")',
    'SELECT "unixepoch"("subsec")',
    'SELECT "strftime"("%s", "now")',
  ]) {
    assert.throws(
      () => validateReadOnlyQuery(quotedNondeterministicQuery),
      /Non-deterministic/,
      `${quotedNondeterministicQuery} must not bypass function safety through quoted identifiers.`,
    );
  }
  assert.throws(
    () => validateReadOnlyQuery("SELECT zeroblob(67108864)"),
    /Result-expanding SQL functions/,
    "Unbounded single-cell result constructors must be rejected before execution.",
  );
  assert.throws(
    () => validateReadOnlyQuery('SELECT "ZEROBLOB"(67108864)'),
    /Result-expanding SQL functions/,
    "Quoted result-expanding function names must be rejected before execution.",
  );
  assert.throws(() => validateReadOnlyQuery("SELECT `ZEROBLOB`(67108864)"), /Result-expanding SQL functions/);
  assert.throws(() => validateReadOnlyQuery("SELECT [ZEROBLOB](67108864)"), /Result-expanding SQL functions/);
  assert.equal(queryHasExplicitOrder("SELECT 'order by', id FROM orders"), false);
  assert.equal(queryHasExplicitOrder("SELECT * FROM (SELECT id FROM orders ORDER BY id)"), false);
  assert.equal(queryHasExplicitOrder("SELECT id FROM orders ORDER BY id"), true);
  assert.throws(() => validateReadOnlyQuery("SELECT * FROM orders CROSS JOIN orders AS other"), /Cartesian joins/);
  assert.throws(() => validateReadOnlyQuery("SELECT * FROM orders, orders AS other"), /Cartesian joins/);
  assert.throws(
    () => validateReadOnlyQuery(
      "SELECT * FROM orders WHERE customer_id IN (SELECT first.customer_id FROM orders AS first, orders AS second)",
    ),
    /Cartesian joins/,
    "Cartesian joins in nested queries must be rejected.",
  );
  assert.throws(
    () => validateReadOnlyQuery("SELECT * FROM orders JOIN orders AS other"),
    /Cartesian joins/,
    "JOIN without ON or USING must be rejected.",
  );
  assert.doesNotThrow(() => validateReadOnlyQuery("SELECT * FROM orders JOIN customers ON customers.id = orders.customer_id"));
  assert.doesNotThrow(
    () => validateReadOnlyQuery("SELECT 'comma, JOIN, DROP TABLE -- text' AS note FROM orders"),
    "Keywords and punctuation inside literals must not affect structural validation.",
  );
  assert.doesNotThrow(
    () => validateReadOnlyQuery(
      "SELECT * FROM (SELECT customer_id, total FROM orders) AS filtered JOIN customers ON customers.id = filtered.customer_id",
    ),
    "Commas in nested SELECT lists must not be mistaken for Cartesian joins.",
  );

  const localLimitKey = `test-${Date.now()}`;
  for (let request = 0; request < 5; request += 1) {
    assert.equal(checkLocalRateLimit(localLimitKey, 1_000).allowed, true);
  }
  assert.deepEqual(
    checkLocalRateLimit(localLimitKey, 1_000),
    { allowed: false, retryAfterSeconds: 60 },
    "The local development limiter must reject requests over the window limit.",
  );
  assert.equal(
    checkLocalRateLimit(localLimitKey, 61_001).allowed,
    true,
    "Expired local rate-limit entries must be removed and reset.",
  );

  const originalRedisEnvironment = {
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  };
  try {
    process.env.UPSTASH_REDIS_REST_URL = "http://redis.invalid";
    process.env.UPSTASH_REDIS_REST_TOKEN = "test-token";
    let redisFetchCalled = false;
    global.fetch = async () => {
      redisFetchCalled = true;
      throw new Error("Fetch must not be called for an insecure Redis endpoint.");
    };
    await assert.rejects(
      checkRedisRateLimit("test-client"),
      RateLimitConfigurationError,
      "Redis tokens must never be sent over HTTP.",
    );
    assert.equal(redisFetchCalled, false);

    process.env.UPSTASH_REDIS_REST_URL = "https://redis.invalid";
    global.fetch = async (_url, options) => new Promise((_resolve, reject) => {
      options.signal.addEventListener("abort", () => reject(options.signal.reason), { once: true });
    });
    await assert.rejects(
      checkRedisRateLimit("test-client", undefined, 5),
      /timed out/,
      "Redis calls need an independent deadline.",
    );

    global.fetch = async (_url, options) => new Response(new ReadableStream({
      start(controller) {
        options.signal.addEventListener("abort", () => controller.error(options.signal.reason), { once: true });
      },
    }), { status: 200 });
    await assert.rejects(
      checkRedisRateLimit("test-client", undefined, 5),
      /timed out/,
      "The Redis deadline must remain active while its response body is parsed.",
    );

    let redisFetchOptions;
    global.fetch = async (_url, options) => {
      redisFetchOptions = options;
      return new Response(JSON.stringify({ result: [1, 60_000] }), { status: 200 });
    };
    assert.equal((await checkRedisRateLimit("test-client")).allowed, true);
    assert.equal(redisFetchOptions.redirect, "error", "Credential-bearing Redis calls must reject redirects.");
  } finally {
    global.fetch = originalFetch;
    if (originalRedisEnvironment.url === undefined) delete process.env.UPSTASH_REDIS_REST_URL;
    else process.env.UPSTASH_REDIS_REST_URL = originalRedisEnvironment.url;
    if (originalRedisEnvironment.token === undefined) delete process.env.UPSTASH_REDIS_REST_TOKEN;
    else process.env.UPSTASH_REDIS_REST_TOKEN = originalRedisEnvironment.token;
  }

  const SQL = await getSqlJs();
  const workerFixture = createDemoDatabase(SQL);
  const workerFixtureBytes = workerFixture.export();
  workerFixture.close();
  await assert.rejects(
    runSqlWorkerTask({
      databaseBytes: workerFixtureBytes,
      query: DEMO_QUERY,
      ordered: false,
    }, undefined, 1),
    /safety deadline/,
    "SQLite work must be terminable by a server-side deadline.",
  );

  const resultLimitDatabase = new SQL.Database();
  resultLimitDatabase.run("CREATE TABLE payloads(value BLOB NOT NULL)");
  resultLimitDatabase.run(
    "INSERT INTO payloads(value) VALUES (?)",
    [new Uint8Array(Math.floor(MAX_RESULT_BYTES / 3))],
  );
  const resultLimitDatabaseBytes = resultLimitDatabase.export();
  resultLimitDatabase.close();
  await assert.rejects(
    runSqlWorkerTask({
      databaseBytes: resultLimitDatabaseBytes,
      query: "SELECT value FROM payloads UNION ALL SELECT value FROM payloads",
      ordered: false,
    }),
    /byte safety limit/,
    "Repeated large cells must be stopped by the serialized-result byte limit.",
  );

  let receivedSignal;
  const abortController = new AbortController();
  const cancellationPlanner = plannerFrom((_input, _call, _mode) => {
    receivedSignal = abortController.signal;
    abortController.abort();
    return decision();
  });
  const cancelledReport = await tuneQueryWithDependencies(DEMO_QUERY, "demo", {
    chooseNextExperiment: async (mode, input, signal) => {
      receivedSignal = signal;
      abortController.abort();
      return cancellationPlanner.chooseNextExperiment(mode, input);
    },
    reviewTuningOutcome: reviewer(),
  }, undefined, abortController.signal);
  assert.equal(receivedSignal, abortController.signal, "The request abort signal must reach planner calls.");
  assert.match(cancelledReport.conclusion, /cancelled/i);

  const reviewerFailurePlanner = plannerFrom((input, call) => call === 1
    ? decision()
    : {
      contractVersion: AGENT_CONTRACT_VERSION,
      action: "conclude",
      strategy: "conclude",
      conclusionCode: "no_safe_distinct_experiment",
      reasoning: "One experiment is enough for this fixture.",
      evidenceUsed: input.experiments.map((item) => item.number),
    });
  const reviewerFailure = await tuneQueryWithDependencies(DEMO_QUERY, "demo", {
    chooseNextExperiment: reviewerFailurePlanner.chooseNextExperiment,
    reviewTuningOutcome: async () => {
      throw new Error("Reviewer unavailable.");
    },
  });
  assert.equal(reviewerFailure.status, "failed");
  assert.ok(reviewerFailure.experiments.length > 0, "Completed evidence must survive a reviewer failure.");

  const demoReport = await tuneQuery(DEMO_QUERY, "demo");
  assert.ok(demoReport.review, "Demo tuning should return reviewer output.");
  assert.ok(demoReport.review.recommendation.length > 0);

  let invoked = false;
  const invalidReport = await tuneQueryWithDependencies("DROP TABLE orders", "live", {
    chooseNextExperiment: async () => {
      invoked = true;
      throw new Error("Planner should not run for invalid input.");
    },
    reviewTuningOutcome: reviewer(),
  });
  assert.equal(invalidReport.status, "invalid-input");
  assert.equal(invoked, false, "Invalid input should be handled without invoking Lamatic.");

  console.log("SQL tuner tests passed.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
