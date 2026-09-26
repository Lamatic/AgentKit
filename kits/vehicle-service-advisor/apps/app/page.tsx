"use client";

import { AssessmentForm } from "@/features/assessment/components/assessment-form";
import { AssessmentReportView } from "@/features/assessment/components/assessment-report";
import { useAssessment } from "@/features/assessment/hooks/use-assessment";

export default function HomePage() {
  const assessment = useAssessment();

  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Vehicle Service Advisor home">
          <span className="brand-mark">VS</span>
          <span>Vehicle Service Advisor</span>
        </a>
        <span className="status-pill"><i /> Powered by Lamatic</span>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy">
          <span className="eyebrow">From symptom to service brief</span>
          <h1>Know what to do before you reach the workshop.</h1>
          <p>
            Turn warning lights, noises, smells, and recent service history into a
            safety-first triage report—without pretending an AI can inspect your car.
          </p>
        </div>
        <div className="hero-facts" aria-label="Product principles">
          <span><strong>01</strong> Safety prioritized</span>
          <span><strong>02</strong> Uncertainty explained</span>
          <span><strong>03</strong> Mechanic-ready handoff</span>
        </div>
      </section>

      <section className="workspace">
        <div className="form-panel">
          <AssessmentForm
            isLoading={assessment.isLoading}
            onSubmit={assessment.submitAssessment}
            onShowSample={assessment.showSampleReport}
          />
          {assessment.error && <div className="error-banner" role="alert">{assessment.error}</div>}
        </div>

        <div className="result-panel">
          {assessment.report ? (
            <AssessmentReportView report={assessment.report} onClear={assessment.clearReport} />
          ) : (
            <div className="empty-state">
              <span className="empty-icon">↗</span>
              <h2>Your triage report will appear here</h2>
              <p>Possible causes, urgency, safe next steps, and a concise workshop brief.</p>
            </div>
          )}
        </div>
      </section>

      <footer>
        Educational triage only. Always follow your manufacturer guidance and a qualified technician’s advice.
      </footer>
    </main>
  );
}
