"use client";

import { useState } from "react";
import {
  getProjectIdeas,
  getBlueprint,
  getExecutionPlan,
  type ProjectIdea,
  type Blueprint,
  type ExecutionPlan,
} from "@/actions/orchestrate";

type Stage = "form" | "ideas" | "blueprint" | "execution";

export default function Home() {
  const [stage, setStage] = useState<Stage>("form");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    branch: "",
    interest: "",
    skillLevel: "Beginner",
    duration: "3 months",
    teamType: "Individual",
  });

  const [ideas, setIdeas] = useState<ProjectIdea[]>([]);
  const [selectedIdea, setSelectedIdea] = useState<string>("");
  const [blueprint, setBlueprint] = useState<Blueprint | null>(null);
  const [executionPlan, setExecutionPlan] = useState<ExecutionPlan | null>(null);

  async function handleGetIdeas(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await getProjectIdeas(form);
    setLoading(false);
    if (res.success && res.data) {
      setIdeas(res.data);
      setStage("ideas");
    } else {
      setError(res.error || "Failed to generate ideas");
    }
  }

  async function handleSelectIdea(title: string) {
    setSelectedIdea(title);
    setLoading(true);
    setError(null);
    const res = await getBlueprint({ selectedIdea: title, skillLevel: form.skillLevel });
    setLoading(false);
    if (res.success && res.data) {
      setBlueprint(res.data);
      setStage("blueprint");
    } else {
      setError(res.error || "Failed to generate blueprint");
    }
  }

  async function handleGenerateExecutionPlan() {
    if (!blueprint) return;
    setLoading(true);
    setError(null);
    const res = await getExecutionPlan({
      selectedIdea,
      blueprint: JSON.stringify(blueprint),
      duration: form.duration,
    });
    setLoading(false);
    if (res.success && res.data) {
      setExecutionPlan(res.data);
      setStage("execution");
    } else {
      setError(res.error || "Failed to generate execution plan");
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-1">ProjectPilot AI</h1>
        <p className="text-gray-600 mb-8">
          Your AI mentor for final year project selection, planning, and execution.
        </p>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-md">
            {error}
          </div>
        )}

        {/* STAGE 1: FORM */}
        {stage === "form" && (
          <form onSubmit={handleGetIdeas} className="bg-white p-6 rounded-lg shadow space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Engineering Branch</label>
              <input
                required
                className="w-full border rounded-md px-3 py-2"
                placeholder="e.g. CSE, AIML, ECE, IT"
                value={form.branch}
                onChange={(e) => setForm({ ...form, branch: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Area of Interest</label>
              <input
                required
                className="w-full border rounded-md px-3 py-2"
                placeholder="e.g. AI/ML, Web Development, IoT"
                value={form.interest}
                onChange={(e) => setForm({ ...form, interest: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Skill Level</label>
                <select
                  className="w-full border rounded-md px-3 py-2"
                  value={form.skillLevel}
                  onChange={(e) => setForm({ ...form, skillLevel: e.target.value })}
                >
                  <option>Beginner</option>
                  <option>Intermediate</option>
                  <option>Advanced</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Duration</label>
                <select
                  className="w-full border rounded-md px-3 py-2"
                  value={form.duration}
                  onChange={(e) => setForm({ ...form, duration: e.target.value })}
                >
                  <option>1 month</option>
                  <option>3 months</option>
                  <option>6 months</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Team Type</label>
                <select
                  className="w-full border rounded-md px-3 py-2"
                  value={form.teamType}
                  onChange={(e) => setForm({ ...form, teamType: e.target.value })}
                >
                  <option>Individual</option>
                  <option>Team</option>
                </select>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-black text-white rounded-md py-2.5 font-medium disabled:opacity-50"
            >
              {loading ? "Generating ideas..." : "Get Project Ideas"}
            </button>
          </form>
        )}

        {/* STAGE 2: IDEAS */}
        {stage === "ideas" && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Pick a project idea</h2>
            {ideas.map((idea, i) => (
              <div key={i} className="bg-white p-5 rounded-lg shadow flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-lg">{idea.title}</h3>
                  <div className="flex gap-3 text-sm text-gray-600 mt-1">
                    <span>Difficulty: {idea.difficulty}</span>
                    <span>Industry Relevance: {idea.industryRelevance}</span>
                    <span>Innovation: {idea.innovationScore}/10</span>
                  </div>
                </div>
                <button
                  onClick={() => handleSelectIdea(idea.title)}
                  disabled={loading}
                  className="bg-black text-white rounded-md px-4 py-2 text-sm font-medium disabled:opacity-50 shrink-0 ml-4"
                >
                  {loading && selectedIdea === idea.title ? "Building..." : "Select"}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* STAGE 3: BLUEPRINT */}
        {stage === "blueprint" && blueprint && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Technical Blueprint</h2>
            <div className="bg-white p-6 rounded-lg shadow space-y-3">
              <p><strong>Project:</strong> {selectedIdea}</p>
              <p><strong>Frontend:</strong> {blueprint.frontend}</p>
              <p><strong>Backend:</strong> {blueprint.backend}</p>
              <p><strong>Database:</strong> {blueprint.database}</p>
              <p><strong>AI Frameworks:</strong> {blueprint.aiFrameworks}</p>
              <p><strong>Deployment:</strong> {blueprint.deployment}</p>
              <p><strong>Architecture:</strong> {blueprint.architectureExplanation}</p>
              <div>
                <strong>Datasets/APIs:</strong>
                <ul className="list-disc list-inside text-sm text-gray-700 mt-1">
                  {(blueprint.datasets || []).map((d, i) => (
                    <li key={i}>{d}</li>
                  ))}
                </ul>
              </div>
            </div>
            <button
              onClick={handleGenerateExecutionPlan}
              disabled={loading}
              className="w-full bg-black text-white rounded-md py-2.5 font-medium disabled:opacity-50"
            >
              {loading ? "Building roadmap..." : "Generate Roadmap & Documentation"}
            </button>
          </div>
        )}

        {/* STAGE 4: EXECUTION PLAN */}
        {stage === "execution" && executionPlan && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Execution Plan</h2>
            <div className="bg-white p-6 rounded-lg shadow space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Abstract</h3>
                <p className="text-sm text-gray-700">{executionPlan.abstract}</p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Roadmap</h3>
                <ul className="space-y-1 text-sm">
                  {executionPlan.roadmap.map((r, i) => (
                    <li key={i}>
                      <strong>Week {r.week}:</strong> {r.task}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Viva Questions</h3>
                <ul className="list-disc list-inside text-sm space-y-1">
                  {executionPlan.vivaQuestions.map((q, i) => (
                    <li key={i}>{q}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Resume Bullets</h3>
                <ul className="list-disc list-inside text-sm space-y-1">
                  {executionPlan.resumeBullets.map((b, i) => (
                    <li key={i}>{b}</li>
                  ))}
                </ul>
              </div>
            </div>
            <button
              onClick={() => setStage("form")}
              className="w-full border border-gray-300 rounded-md py-2.5 font-medium"
            >
              Start Over
            </button>
          </div>
        )}
      </div>
    </main>
  );
}