"use client";

import { useState } from "react";
import { runOnboardingAgent } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, GitBranch } from "lucide-react";
import {
  OnboardingReportView,
  parseOnboardingReport,
} from "@/components/OnboardingReport";

type RunState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "success"; status: string; result: unknown }
  | { kind: "error"; message: string };

export default function Index() {
  const [repoUrl, setRepoUrl] = useState("");
  const [role, setRole] = useState("");
  const [token, setToken] = useState("");
  const [state, setState] = useState<RunState>({ kind: "idle" });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    const trimmedRepoUrl = repoUrl.trim();
    const trimmedRole = role.trim();

    if (!trimmedRepoUrl || !trimmedRole) {
      setState({ kind: "error", message: "Repository URL and Developer role are required." });
      return;
    }

    setState({ kind: "loading" });
    try {
      const res = await runOnboardingAgent({
        repo_url: trimmedRepoUrl,
        developer_role: trimmedRole,
        ...(token.trim() ? { github_token: token.trim() } : {}),
      });
      if (res.ok) {
        setState({ kind: "success", status: res.status, result: res.result });
      } else {
        setState({ kind: "error", message: res.error });
      }
    } catch (err) {
      setState({ kind: "error", message: err instanceof Error ? err.message : "Failed" });
    }
  }

  return (
    <main className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-2xl mx-auto space-y-8">
        <header className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary">
            <GitBranch className="w-6 h-6" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight">Codebase Onboarding Agent</h1>
          <p className="text-muted-foreground">
            Point the agent at a repository and your role — get a tailored onboarding briefing.
          </p>
        </header>

        <Card>
          <CardHeader>
            <CardTitle>Run agent</CardTitle>
            <CardDescription>Powered by Lamatic workflow</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="repo">Repository URL</Label>
                <Input
                  id="repo"
                  type="url"
                  required
                  placeholder="https://github.com/owner/repo"
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Developer role</Label>
                <Input
                  id="role"
                  required
                  placeholder="e.g. Frontend Engineer"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="token">GitHub token (optional)</Label>
                <Input
                  id="token"
                  type="password"
                  placeholder="ghp_... (for private repos)"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                />
              </div>
              <Button type="submit" disabled={state.kind === "loading"} className="w-full">
                {state.kind === "loading" ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Running…
                  </>
                ) : (
                  "Run onboarding agent"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {state.kind === "error" && (
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive">Error</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{state.message}</p>
            </CardContent>
          </Card>
        )}

        {state.kind === "success" && (() => {
          const report = parseOnboardingReport(state.result);
          if (report) return <OnboardingReportView report={report} />;
          return (
            <Card>
              <CardHeader>
                <CardTitle>Result</CardTitle>
                <CardDescription>Status: {state.status}</CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="text-xs bg-muted rounded-md p-4 overflow-auto max-h-[480px] whitespace-pre-wrap">
                  {typeof state.result === "string"
                    ? state.result
                    : JSON.stringify(state.result, null, 2)}
                </pre>
              </CardContent>
            </Card>
          );
        })()}
      </div>
    </main>
  );
}
