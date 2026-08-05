import type {
  AssessmentReport,
  Urgency,
} from "@/features/assessment/types/assessment";

const URGENCY_LABELS: Record<Urgency, string> = {
  stop_now: "Stop driving",
  urgent: "Urgent inspection",
  soon: "Service soon",
  monitor: "Monitor",
};

interface AssessmentReportProps {
  report: AssessmentReport;
  onClear: () => void;
}

function ReportList({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <section className="report-section">
      <h3>{title}</h3>
      <ul className="plain-list">
        {items.map((item) => <li key={item}>{item}</li>)}
      </ul>
    </section>
  );
}

function PossibleCauses({ report }: { report: AssessmentReport }) {
  return (
    <section className="report-section">
      <h3>Possible causes</h3>
      <div className="cause-list">
        {report.possibleCauses.map((item) => (
          <article className="cause-card" key={item.cause}>
            <div><strong>{item.cause}</strong><span>{item.likelihood}</span></div>
            <p>{item.evidence}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function InspectionPlan({ report }: { report: AssessmentReport }) {
  return (
    <section className="report-section">
      <h3>Inspection plan</h3>
      <ol className="inspection-list">
        {report.inspectionPlan.map((step) => (
          <li key={`${step.priority}-${step.action}`}>
            <span className="step-number">{step.priority}</span>
            <div>
              <strong>{step.action}</strong>
              <span className="performed-by">{step.performedBy}</span>
              <p>{step.reason}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function AssessmentReportView({ report, onClear }: AssessmentReportProps) {
  return (
    <article className="report-card" aria-live="polite">
      <header className={`report-header urgency-${report.urgency}`}>
        <div>
          <span className="eyebrow">Triage result</span>
          <h2>{URGENCY_LABELS[report.urgency]}</h2>
        </div>
        <span className="confidence">{report.confidence} confidence</span>
      </header>

      <div className="report-body">
        <p className="report-summary">{report.summary}</p>
        <div className={`safety-callout ${report.stopDriving ? "danger" : ""}`}>
          <strong>{report.stopDriving ? "Do not drive" : "Safety guidance"}</strong>
          <p>{report.safetyMessage}</p>
        </div>
        <PossibleCauses report={report} />
        <InspectionPlan report={report} />
        <ReportList title="Safe owner actions" items={report.ownerActions} />
        <ReportList title="Questions to clarify" items={report.clarifyingQuestions} />

        <section className="mechanic-brief">
          <span className="eyebrow">Mechanic handoff</span>
          <p>{report.mechanicBrief}</p>
        </section>
        <p className="limitations">{report.limitations}</p>
        <button className="secondary-button" onClick={onClear} type="button">
          Start another assessment
        </button>
      </div>
    </article>
  );
}
