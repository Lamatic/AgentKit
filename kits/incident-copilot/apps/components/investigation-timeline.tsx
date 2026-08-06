// Visualises the investigation's evidence-gathering + reasoning steps. Because the
// flow runs server-side as one call, we advance the steps on a short timer while the
// request is in flight to show *what* the agent is doing (retrieve runbooks, check
// GitHub, recall prior context, reason) rather than a bare spinner.

const STEPS = [
  "Reading alert",
  "Retrieving runbooks",
  "Checking recent changes",
  "Recalling this incident",
  "Ranking hypotheses"
];

export function InvestigationTimeline({ activeStep }: { activeStep: number }) {
  return (
    <div className="timeline" aria-label="Investigation progress">
      {STEPS.map((label, i) => {
        const state = i < activeStep ? "done" : i === activeStep ? "active" : "";
        return (
          <div key={label} className={`step ${state}`}>
            <span className="dot" />
            {label}
          </div>
        );
      })}
    </div>
  );
}

export const TIMELINE_STEP_COUNT = STEPS.length;
