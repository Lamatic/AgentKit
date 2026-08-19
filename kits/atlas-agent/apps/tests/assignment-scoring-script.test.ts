import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

type Candidate = {
  memberId: string;
  disqualified: boolean;
  score: number;
  breakdown: Record<string, number>;
  reason?: string;
};

type Scorecard = {
  recommended: Candidate | null;
  excluded: Candidate[];
};

const task = {
  id: "TASK-1",
  title: "Implement API",
  description: "Build the project API",
  priority: "HIGH",
  complexity: "COMPLEX",
  requiredSkills: ["python", "api"]
};

async function score(members: Array<Record<string, unknown>>): Promise<Scorecard> {
  const source = await readFile(
    new URL("../../scripts/atlas-recommend-assignment_score.ts", import.meta.url),
    "utf8"
  );
  const executable = source
    .replace("{{triggerNode_1.output.task}}", JSON.stringify(task))
    .replace("{{triggerNode_1.output.members}}", JSON.stringify(members));

  return Function(`${executable}\nreturn output;`)() as Scorecard;
}

function member(overrides: Record<string, unknown> = {}) {
  return {
    memberId: "M-1",
    name: "Arun",
    role: "TEAM_LEAD",
    skills: ["python", "api"],
    currentOpenTasks: 2,
    currentHighPriorityTasks: 0,
    ...overrides
  };
}

test("normal numeric workloads preserve the existing score", async () => {
  const result = await score([member()]);
  assert.equal(result.recommended?.score, 89);
  assert.deepEqual(result.recommended?.breakdown, {
    skillMatch: 40,
    roleFit: 25,
    capacity: 14,
    dependencyFit: 5,
    priorityFit: 5
  });
});

test("finite numeric strings retain numeric workload behavior", async () => {
  const result = await score([
    member({ currentOpenTasks: "2", currentHighPriorityTasks: "0" })
  ]);
  assert.equal(result.recommended?.score, 89);
});

test("non-numeric workloads cannot produce NaN scores", async () => {
  const result = await score([
    member({ memberId: "BAD", currentOpenTasks: "not-a-number" })
  ]);
  const invalid = result.excluded[0];
  assert.equal(invalid.score, 0);
  assert.ok(Number.isFinite(invalid.score));
  assert.ok(Object.values(invalid.breakdown).every(Number.isFinite));
});

test("a candidate with invalid workload data is excluded", async () => {
  const result = await score([
    member({ memberId: "BAD", currentHighPriorityTasks: "unknown" }),
    member({ memberId: "GOOD" })
  ]);
  assert.equal(result.recommended?.memberId, "GOOD");
  assert.equal(result.excluded[0]?.memberId, "BAD");
  assert.equal(result.excluded[0]?.reason, "Invalid workload data");
});

test("negative workload values are excluded", async () => {
  const result = await score([
    member({ memberId: "NEGATIVE", currentOpenTasks: -1 })
  ]);
  assert.equal(result.recommended, null);
  assert.equal(result.excluded[0]?.memberId, "NEGATIVE");
  assert.equal(result.excluded[0]?.reason, "Invalid workload data");
});
