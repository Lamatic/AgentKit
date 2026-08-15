"use client";

import { useMemo, useState } from "react";
import { executeAtlasFlow } from "@/actions/orchestrate";
import { approveExecutionContext, deliverApprovedExecutionContext } from "@/actions/approval";
import { canApproveTasks, canScoreAssignment, clearedDownstreamState } from "@/lib/workflow-state";

const demoDocument = `# Customer Support Portal

## Authentication
Users must sign in with email and password. Users must be able to reset a forgotten password using a time-limited link.

## Support tickets
Customers must create and track support tickets. Team members should update status and add internal notes.

## Admin analytics
Managers should see ticket volume and resolution status without exposing unrelated customer data.`;

const demoMembers = [
  { memberId: "M-1", name: "Arun", role: "TEAM_LEAD", skills: ["python", "api", "authentication"], currentOpenTasks: 2, currentHighPriorityTasks: 0 },
  { memberId: "M-2", name: "Priya", role: "SENIOR_DEVELOPER", skills: ["react", "api", "authentication"], currentOpenTasks: 3, currentHighPriorityTasks: 1 },
  { memberId: "M-3", name: "Kumar", role: "JUNIOR_DEVELOPER", skills: ["python", "react", "testing"], currentOpenTasks: 1, currentHighPriorityTasks: 0 },
  { memberId: "M-4", name: "Nila", role: "INTERN", skills: ["documentation", "testing"], currentOpenTasks: 1, currentHighPriorityTasks: 0 }
];

function unwrap(value: unknown, key: string): unknown {
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    if (key in record) return record[key];
    if (record.output && typeof record.output === "object" && key in (record.output as Record<string, unknown>)) return (record.output as Record<string, unknown>)[key];
  }
  return value;
}

export default function AtlasAgentPage() {
  const [documentText, setDocumentText] = useState(demoDocument);
  const [requirements, setRequirements] = useState<unknown>(null);
  const [proposals, setProposals] = useState<unknown>(null);
  const [recommendation, setRecommendation] = useState<unknown>(null);
  const [executionContext, setExecutionContext] = useState<unknown>(null);
  const [tasksApproved, setTasksApproved] = useState(false);
  const [assignmentApproved, setAssignmentApproved] = useState(false);
  const [approvalToken, setApprovalToken] = useState<string | null>(null);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  const proposalList = useMemo(() => {
    const value = unwrap(proposals, "proposals");
    return Array.isArray(value) ? value : [];
  }, [proposals]);

  const selectedTask = proposalList[0] as Record<string, unknown> | undefined;

  function clearDownstream() {
    const cleared = clearedDownstreamState();
    setTasksApproved(cleared.tasksApproved);
    setRecommendation(cleared.recommendation);
    setAssignmentApproved(cleared.assignmentApproved);
    setApprovalToken(cleared.approvalToken);
    setExecutionContext(cleared.executionContext);
  }

  async function run(label: string, action: () => Promise<void>) {
    setBusy(label); setError("");
    try { await action(); } catch (cause) { setError(cause instanceof Error ? cause.message : "Flow failed"); }
    finally { setBusy(""); }
  }

  const extract = () => run("extract", async () => {
    const result = await executeAtlasFlow("extractRequirements", { documentName: "Customer Support Portal PRD", documentText });
    if (!result.success) throw new Error(result.error);
    setRequirements(result.data); setProposals(null); clearDownstream();
  });

  const generate = () => run("proposals", async () => {
    const result = await executeAtlasFlow("generateTaskProposals", { requirements: unwrap(requirements, "requirements") });
    if (!result.success) throw new Error(result.error);
    setProposals(result.data); clearDownstream();
  });

  const recommend = () => run("assignment", async () => {
    if (!selectedTask || !canScoreAssignment(proposalList, tasksApproved)) throw new Error("Approve at least one real task proposal before scoring");
    const result = await executeAtlasFlow("recommendAssignment", { task: selectedTask, members: demoMembers });
    if (!result.success) throw new Error(result.error);
    setRecommendation(result.data); setAssignmentApproved(false);
  });

  const approveAssignment = () => run("approval", async () => {
    if (!selectedTask || recommendation === null) throw new Error("A task recommendation is required before approval");
    const reqs = unwrap(requirements, "requirements");
    const result = await approveExecutionContext({
      approvedTask: selectedTask,
      requirements: Array.isArray(reqs) ? reqs : [],
      documents: [{ id: "DOC-1", name: "Customer Support Portal PRD", url: "https://example.test/customer-support-prd" }]
    });
    if (!result.success) throw new Error(result.error);
    setApprovalToken(result.token);
    setAssignmentApproved(true);
  });

  const deliver = () => run("context", async () => {
    const result = await deliverApprovedExecutionContext(approvalToken ?? undefined);
    if (!result.success) throw new Error(result.error);
    setExecutionContext(result.data);
  });

  return <main className="shell">
    <div className="eyebrow">Lamatic AgentKit · Human-in-the-loop</div>
    <h1>From project document to accountable execution.</h1>
    <p className="lead">Atlas extracts traceable requirements, proposes work, scores candidates with deterministic rules, and pauses before every consequential action.</p>

    <section className="pipeline" aria-label="Atlas workflow">
      <div className="step"><strong>01 · Interpret</strong>Requirements with source evidence</div>
      <div className="step"><strong>02 · Propose</strong>Tasks linked to requirement IDs</div>
      <div className="step"><strong>03 · Recommend</strong>Explainable 100-point scoring</div>
      <div className="step"><strong>04 · Execute</strong>Approved, focused context</div>
    </section>

    <div className="grid">
      <section className="card">
        <h2>Project document</h2>
        <p className="hint">Use synthetic or non-sensitive text. Document instructions are treated as untrusted data.</p>
        <textarea value={documentText} onChange={(event) => setDocumentText(event.target.value)} aria-label="Project document" />
        <div className="actions">
          <button className="primary" disabled={!!busy || !documentText.trim()} onClick={extract}>{busy === "extract" ? "Extracting…" : "Extract requirements"}</button>
          <button className="secondary" disabled={!!busy || !requirements} onClick={generate}>{busy === "proposals" ? "Generating…" : "Generate proposals"}</button>
        </div>
        {error && <p className="boundary">{error}</p>}
        {requirements !== null && <pre>{JSON.stringify(requirements, null, 2)}</pre>}
      </section>

      <section className="card">
        <h2>Review gates</h2>
        <p className="hint">The model cannot activate either approval. These controls represent authorized application actions.</p>

        <div className={requirements !== null ? "status done" : "status"}><span className="dot"/><div><strong>Requirements extracted</strong><div className="hint">Source-grounded interpretation</div></div></div>
        <div className={proposals !== null ? "status done" : "status"}><span className="dot"/><div><strong>Task proposals generated</strong><div className="hint">Still non-operational</div></div></div>
        <div className={canApproveTasks(proposalList) && !tasksApproved ? "status waiting" : tasksApproved ? "status done" : "status"}><span className="dot"/><div><strong>Human task approval</strong><div className="hint">Required before assignment analysis</div>{canApproveTasks(proposalList) && !tasksApproved && <button className="secondary" onClick={() => setTasksApproved(true)}>Approve proposed work</button>}</div></div>
        <div className={recommendation !== null ? "status done" : "status"}><span className="dot"/><div><strong>Assignment recommendation</strong><div className="hint">Deterministic score + model explanation</div>{canScoreAssignment(proposalList, tasksApproved) && recommendation === null && <button className="secondary" disabled={!!busy} onClick={recommend}>{busy === "assignment" ? "Scoring…" : "Score candidates"}</button>}</div></div>
        <div className={recommendation !== null && !assignmentApproved ? "status waiting" : assignmentApproved ? "status done" : "status"}><span className="dot"/><div><strong>Human assignment approval</strong><div className="hint">Required before execution context</div>{recommendation !== null && !assignmentApproved && <button className="secondary" disabled={!!busy} onClick={approveAssignment}>{busy === "approval" ? "Approving…" : "Approve assignment"}</button>}</div></div>
        <div className={executionContext !== null ? "status done" : "status"}><span className="dot"/><div><strong>Execution context ready</strong><div className="hint">Only linked requirements and documents</div>{assignmentApproved && executionContext === null && <button className="primary" disabled={!!busy} onClick={deliver}>{busy === "context" ? "Assembling…" : "Assemble context"}</button>}</div></div>

        {(proposals !== null || recommendation !== null || executionContext !== null) && <pre>{JSON.stringify(executionContext ?? recommendation ?? proposals, null, 2)}</pre>}
      </section>
    </div>
    <footer>Built by Pradeep Nagarajan · Product reference: <a href="https://github.com/Pradeeprdncas/Synapse.ai">Synapse.ai / Atlas CRM</a></footer>
  </main>;
}
