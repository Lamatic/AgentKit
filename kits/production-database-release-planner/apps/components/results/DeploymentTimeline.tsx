import StatusBadge from "./StatusBadge";

type DeploymentTimelineProps = {
  steps: string[];
};

export default function DeploymentTimeline({ steps }: DeploymentTimelineProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-4">
      <ol className="space-y-3">
        {steps.map((step, index) => (
          <li
            key={`${step}-${index}`}
            className="flex items-start gap-3 text-sm text-slate-700"
          >
            <div className="flex flex-col items-center pt-0.5">
              <StatusBadge tone="blue">{index + 1}</StatusBadge>
              {index < steps.length - 1 ? (
                <span className="mt-2 h-full w-px flex-1 bg-slate-200" aria-hidden="true" />
              ) : null}
            </div>
            <span className="pt-0.5 font-medium text-slate-900">{step}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}