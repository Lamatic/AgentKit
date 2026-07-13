import type { CommsResult } from "@/lib/types";

export function CommsPanel({ comms }: { comms: CommsResult }) {
  return (
    <div className="comms">
      <div>
        <h3>Slack update</h3>
        <pre className="draft">{comms.slackUpdate || "—"}</pre>
      </div>
      <div>
        <h3>Postmortem skeleton</h3>
        <pre className="draft">{comms.postmortem || "—"}</pre>
      </div>
    </div>
  );
}
