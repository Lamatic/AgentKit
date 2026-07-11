import React, { useState } from "react";

interface IncidentFormProps {
  onSubmit: (data: {
    incidentTitle: string;
    alertDetails: string;
    logsOrSymptoms: string;
    gitDiff: string;
    configSettings: string;
  }) => void;
  isLoading: boolean;
}

export default function IncidentForm({ onSubmit, isLoading }: IncidentFormProps) {
  const [incidentTitle, setIncidentTitle] = useState("HTTP 500: Auth Token Verification Failure");
  const [alertDetails, setAlertDetails] = useState("Datadog Alert: elevated 5xx error rate on /auth/verify endpoint.");
  const [logsOrSymptoms, setLogsOrSymptoms] = useState(
    "TypeError: Cannot read properties of undefined (reading 'split')\n" +
    "    at verifyToken (c:\\Users\\project\\src\\controllers\\auth.ts:45:32)\n" +
    "    at processTicksAndRejections (node:internal/process/task_queues:95:5)\n" +
    "    at async verifyAuthHeader (c:\\Users\\project\\src\\middlewares\\auth.ts:12:5)"
  );
  const [gitDiff, setGitDiff] = useState(
    "diff --git a/src/controllers/auth.ts b/src/controllers/auth.ts\n" +
    "--- a/src/controllers/auth.ts\n" +
    "+++ b/src/controllers/auth.ts\n" +
    "@@ -42,3 +42,3 @@\n" +
    "-  const secret = process.env.JWT_SECRET;\n" +
    "+  const secret = process.env.JWT_SECRET_KEY;\n" +
    "   const token = authHeader.split(' ')[1];"
  );
  const [configSettings, setConfigSettings] = useState(
    "DEPLOYMENT ENVIRONMENT CONFIG:\n" +
    "PORT=3000\n" +
    "DB_URL=postgresql://localhost:5432/mydb\n" +
    "JWT_SECRET=super-secret-auth-key-12345"
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ incidentTitle, alertDetails, logsOrSymptoms, gitDiff, configSettings });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-xl">
      <div className="space-y-2">
        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Incident Title</label>
        <input
          type="text"
          value={incidentTitle}
          onChange={(e) => setIncidentTitle(e.target.value)}
          required
          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-500 transition"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Alert Details</label>
        <textarea
          rows={2}
          value={alertDetails}
          onChange={(e) => setAlertDetails(e.target.value)}
          required
          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-500 transition text-sm font-mono"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Error Logs / Stack Trace</label>
        <textarea
          rows={4}
          value={logsOrSymptoms}
          onChange={(e) => setLogsOrSymptoms(e.target.value)}
          required
          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-500 transition text-xs font-mono"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Git Diff / Recent Changes</label>
          <textarea
            rows={5}
            value={gitDiff}
            onChange={(e) => setGitDiff(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-500 transition text-xs font-mono"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Environment Config / Manifests</label>
          <textarea
            rows={5}
            value={configSettings}
            onChange={(e) => setConfigSettings(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-500 transition text-xs font-mono"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-3 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-950 font-semibold rounded-xl hover:opacity-90 active:scale-95 transition disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
      >
        {isLoading ? "Running Diagnostic Pipeline..." : "Start Root Cause Investigation"}
      </button>
    </form>
  );
}
