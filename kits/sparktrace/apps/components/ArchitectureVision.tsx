import { Coins, ListTree, ShieldCheck, Workflow } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { MODEL_TIERS } from "../lib/model-tiers";

/**
 * The argument behind the product, for a reader who never presses Run.
 *
 * A reviewer's first question about any agent demo is "what did the
 * model actually decide, and what would stop it doing something dumb?"
 * — so this section leads with the loop shape and the two deterministic
 * layers, then explains the tiering. It sits below the fold: someone who
 * came to try it is not made to read an essay first.
 */
export function ArchitectureVision() {
  return (
    <section className="space-y-6">
      <div className="space-y-1.5">
        <h2 className="text-base font-semibold tracking-tight">How SparkTrace works</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          A data engineer debugging a silent pipeline regression spends most of their time on the same loop:
          form a guess, write a query to test it, read the result, guess again. The knowledge is rarely the
          bottleneck — the round trips are. SparkTrace runs that loop as an agent, and keeps a human-readable
          record of why it did each thing.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Workflow className="size-4 text-muted-foreground" />
              A planner decides every turn
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed text-muted-foreground">
              There is no scripted plan. Each turn the planner sees the symptom, the pipeline, and the evidence
              gathered so far, then picks one action: read the repo, generate a diagnostic query, or conclude.
              An investigation that finds its answer in two steps stops in two steps.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <ShieldCheck className="size-4 text-muted-foreground" />
              Two layers the model cannot skip
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Every generated query passes a deterministic guard before execution — read-only, no exceptions,
              rejections are recorded and never run. Every result is compacted to a bounded digest before the
              analyst sees it, so a query returning a million rows can never blow up a prompt.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Coins className="size-4 text-muted-foreground" />
            The right model per step, not one big model
          </CardTitle>
          <CardDescription>
            Deciding what to investigate is hard reasoning. Reading a digest and saying what it shows is not.
            Paying top-tier rates for both is how agent demos become too expensive to run in production.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {MODEL_TIERS.map((tier) => (
              <li key={tier.flow} className="flex flex-col gap-1.5 border-b border-border pb-3 last:border-0 last:pb-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium text-foreground">{tier.role}</span>
                  <Badge variant="violet" className="font-mono text-[11px]">
                    {tier.shortModel}
                  </Badge>
                  <code className="text-[11px] text-muted-foreground">{tier.flow}</code>
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground">{tier.rationale}</p>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <ListTree className="size-4 text-muted-foreground" />
            What changes in live mode
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm leading-relaxed text-muted-foreground">
            The orchestrator only ever talks to interfaces, so live mode swaps four implementations and changes
            nothing else: the deterministic reasoner becomes the five deployed Lamatic flows, the bundled CSVs
            become your Athena workgroup, the fixed schema becomes your Glue catalog, and the sample scenario
            becomes a clone of your pipeline repo.
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            That is also why this page can exist. The same loop you are watching is the loop that runs in
            production — it is being fed by fixtures instead of by AWS.
          </p>
        </CardContent>
      </Card>
    </section>
  );
}
