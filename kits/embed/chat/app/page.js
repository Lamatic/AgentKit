import LamaticChat from "@/components/LamaticChat";
import HeroActions from "@/components/HeroActions";
import TranscriptPlayground from "@/components/TranscriptPlayground";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const features = [
  "Extract action items automatically",
  "Identify risks and blockers",
  "Generate follow-up summaries",
  "Send insights to Slack",
];

const transcript = [
  "Maya: Enterprise onboarding is taking too long because legal review starts late in the cycle.",
  "Jordan: We can shorten turnaround if customer success collects the security questionnaire before kickoff.",
  "Priya: Slack alerts should notify the account team whenever a deal slips past the implementation target date.",
  "Alex: Let's send a concise follow-up summary with owners, due dates, and unresolved blockers after every client meeting.",
];

const actionItems = [
  "Customer Success to collect the security questionnaire before kickoff.",
  "Operations to add Slack alerts for delayed implementation milestones.",
  "Account team to send a post-meeting summary with owners and deadlines.",
];

const risks = [
  "Late legal review is extending onboarding timelines.",
  "No proactive alerting exists when implementation targets slip.",
];

export default function Home() {
  const lamaticConfig = {
    projectId: process.env.NEXT_PUBLIC_LAMATIC_PROJECT_ID || "",
    flowId: process.env.NEXT_PUBLIC_LAMATIC_FLOW_ID || "",
    apiUrl: process.env.NEXT_PUBLIC_LAMATIC_API_URL || "",
  };

  const missingEnvVars = Object.entries({
    NEXT_PUBLIC_LAMATIC_PROJECT_ID: lamaticConfig.projectId,
    NEXT_PUBLIC_LAMATIC_FLOW_ID: lamaticConfig.flowId,
    NEXT_PUBLIC_LAMATIC_API_URL: lamaticConfig.apiUrl,
  })
    .filter(([, value]) => !value)
    .map(([key]) => key);

  const isLamaticReady = missingEnvVars.length === 0;

  return (
    <>
      <main className="min-h-screen bg-background text-foreground">
        <div className="relative overflow-hidden border-b border-border/60">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.28),_transparent_40%),radial-gradient(circle_at_20%_60%,_rgba(16,185,129,0.16),_transparent_40%)]" />
          <div className="relative mx-auto max-w-6xl px-6 pb-16 pt-16 sm:pb-20 sm:pt-20">
            <div className="mx-auto max-w-3xl text-center">
              <div className="flex flex-wrap items-center justify-center gap-2">
                <Badge className="bg-primary/15 text-primary hover:bg-primary/15">AI Powered</Badge>
                <Badge className="bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/15">Slack Integrated ⚡</Badge>
              </div>

              <h1 className="mt-6 text-balance text-4xl font-semibold tracking-tight sm:text-6xl">
                AI Meeting Intelligence Copilot
              </h1>
              <p className="mx-auto mt-5 max-w-2xl text-balance text-lg text-muted-foreground sm:text-xl">
                Turn meeting transcripts into actionable insights instantly
              </p>

              <HeroActions isLamaticReady={isLamaticReady} />

              <p className="mt-4 text-sm text-muted-foreground">
                {isLamaticReady ? "Lamatic assistant ready" : "Add Lamatic env vars to enable the assistant"}
              </p>
            </div>

            <div className="mt-12 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
              <Card className="border-border/60 bg-card/70 backdrop-blur">
                <CardHeader>
                  <CardTitle className="text-lg">Core capabilities</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="grid gap-3 sm:grid-cols-2">
                    {features.map((feature) => (
                      <li key={feature} className="rounded-xl border border-border/60 bg-background/60 px-4 py-3 text-sm">
                        {feature}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-border/60 bg-card/70 backdrop-blur">
                <CardHeader>
                  <CardTitle className="text-lg">Widget status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                  <div className="rounded-xl border border-border/60 bg-background/60 px-4 py-3">
                    <p className="font-medium text-foreground">
                      {isLamaticReady ? "Configuration complete" : "Configuration required"}
                    </p>
                    <p className="mt-1">
                      {isLamaticReady
                        ? "Open Copilot from the button in the bottom-right."
                        : "Set the required Lamatic variables in `.env.local` before the widget can render."}
                    </p>
                  </div>

                  {!isLamaticReady && (
                    <div className="rounded-xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-amber-700">
                      <p className="font-medium">Missing environment variables</p>
                      <ul className="mt-2 space-y-2 font-mono text-xs">
                        {missingEnvVars.map((envVar) => (
                          <li key={envVar} className="rounded-lg bg-black/5 px-3 py-2">
                            {envVar}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        <section id="meeting-demo" className="bg-slate-50 px-6 py-20 text-slate-900 sm:py-24">
          <div className="mx-auto max-w-6xl">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-sky-700">Demo Preview</p>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">See how meeting insights are structured</h2>
              <p className="mt-4 text-base leading-7 text-slate-600">
                Capture raw discussion on the left and instantly convert it into an executive-ready summary on the right.
              </p>
            </div>

            <div className="mt-10">
              <TranscriptPlayground />
            </div>

            <div className="mt-12 grid gap-6 lg:grid-cols-[1fr_1.1fr]">
              <article className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm shadow-slate-200/60">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-slate-900">Example Input</h3>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                    Meeting Transcript
                  </span>
                </div>
                <div className="mt-6 space-y-4">
                  {transcript.map((line) => (
                    <div key={line} className="rounded-2xl bg-slate-50 px-4 py-4 text-sm leading-6 text-slate-700">
                      {line}
                    </div>
                  ))}
                </div>
              </article>

              <article className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm shadow-slate-200/60">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-slate-900">Example Output</h3>
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                    Generated Insights
                  </span>
                </div>

                <div className="mt-6 grid gap-4">
                  <div className="rounded-2xl bg-slate-950 p-5 text-slate-100">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-300">Summary</p>
                    <p className="mt-3 text-sm leading-6 text-slate-300">
                      The team identified delayed legal review as the primary cause of slow onboarding and aligned on
                      collecting security materials earlier, adding Slack alerts for slippage, and standardizing
                      follow-up summaries after customer meetings.
                    </p>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">Action Items</p>
                      <ul className="mt-3 space-y-3 text-sm leading-6 text-slate-700">
                        {actionItems.map((item) => (
                          <li key={item} className="rounded-xl bg-white px-3 py-3 shadow-sm shadow-slate-200/50">
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rose-700">Risks &amp; Blockers</p>
                      <ul className="mt-3 space-y-3 text-sm leading-6 text-slate-700">
                        {risks.map((item) => (
                          <li key={item} className="rounded-xl bg-white px-3 py-3 shadow-sm shadow-slate-200/50">
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </article>
            </div>
          </div>
        </section>

        <footer className="border-t border-slate-200 bg-white px-6 py-8 text-center text-sm text-slate-500">
          Built by Vijayshree
        </footer>
      </main>

      <LamaticChat disabled={!isLamaticReady} />
    </>
  );
}