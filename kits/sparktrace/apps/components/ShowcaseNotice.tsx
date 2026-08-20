import { FlaskConical } from "lucide-react";

/**
 * Tells a first-time visitor exactly what this deployment does and does
 * not do, before they run anything.
 *
 * The public deployment runs demo mode, where the orchestration is real
 * but the five model tiers are replaced by a deterministic reasoner. A
 * visitor watching planner "reasoning" scroll past would reasonably
 * assume a model wrote it, so this states plainly that one did not. The
 * substitution is a deployment choice, not a limitation of the kit —
 * live mode is a config switch away — and saying so is more convincing
 * than letting someone discover it in the source.
 */
export function ShowcaseNotice() {
  return (
    <div className="rounded-xl border border-violet/30 bg-violet/5 p-4">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-violet/15 text-violet">
          <FlaskConical className="size-3.5" />
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <p className="text-sm font-medium text-foreground">
            This is a showcase deployment — the loop is real, the models are stubbed.
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Everything you are about to watch actually executes: the planner loop picks each next action, the
            generated SQL is real SQL, it is checked by the safety guard, and it runs against the bundled
            scenario. What is <em>not</em> running here is Claude — a deterministic reasoner stands in for the
            five model tiers so this page needs no API keys, no AWS account, and can be opened by anyone
            without spending anything.
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Each step below is tagged with the model tier that handles it in live mode. Point the kit at your
            own pipeline repo and Athena workgroup, and the same orchestration runs against real infrastructure
            — nothing about the loop changes.
          </p>
        </div>
      </div>
    </div>
  );
}
