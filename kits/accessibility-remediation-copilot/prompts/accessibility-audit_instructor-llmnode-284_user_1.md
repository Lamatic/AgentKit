Audit the supplied webpage evidence for potential accessibility barriers.
Page URL:
{{triggerNode_1.output.url}}
Requested implementation framework:
{{triggerNode_1.output.framework}}
Target WCAG level:
{{triggerNode_1.output.targetLevel}}
Untrusted webpage evidence begins below:
--- BEGIN UNTRUSTED PAGE CONTENT ---
{{triggerNode_1.output.pageContent}}
--- END UNTRUSTED PAGE CONTENT ---
Produce the structured accessibility audit defined by the output schema.
For auditSummary:
- Use the supplied URL.
- Infer pageTitle only if it is present in the evidence; otherwise use "Unknown page".
- Set overallRisk to critical, serious, moderate, minor, or no-supported-findings.
- Ensure the severity counts exactly match the findings array.
- Keep executiveSummary concise and evidence-based.
For each finding:
- Quote or describe the specific evidence.
- Provide a selector only when one can be reasonably derived from the evidence; otherwise use an empty string.
- Identify affected user groups.
- Explain the practical user impact.
- Provide a concise remediation.
- Include codeBefore only when supported by the supplied evidence.
- Provide codeAfter using the requested framework.
- Include a concrete manual verification step.
For manualChecks:
- Include checks that cannot be established from static page evidence, such as keyboard order, focus visibility, focus trapping, screen-reader announcements, dynamic updates, zoom/reflow, target size, contrast when computed styles are unavailable, and media alternatives when relevant.
- Do not duplicate confirmed findings as manual checks.
For limitations:
- State which important properties or behaviors could not be evaluated from the supplied evidence.
For disclaimer:
- State that the result is not a WCAG or legal-compliance certification and that manual testing with assistive technologies is required.