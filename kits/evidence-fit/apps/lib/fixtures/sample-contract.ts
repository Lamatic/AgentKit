/**
 * Sample experiment used by the "Load sample contract experiment" button
 * in the demo app.
 *
 * This is SYNTHETIC commercial-contract boilerplate written for this demo.
 * It is structured in the style of the public CUAD corpus (Contract
 * Understanding Atticus Dataset) — clause numbering, defined terms, the
 * kinds of questions a reviewer would ask of a Master Services Agreement —
 * but it contains no CUAD text and is not drawn from any real agreement.
 * Treat it as a synthetic fixture for exercising the evidence engine, not
 * as a CUAD excerpt or evaluation result.
 *
 * The document is deliberately sized so that at the default 500-character /
 * 50-character-overlap baseline configuration, one required evidence span
 * (the liability-cap case, see below) is cut by a chunk boundary and
 * severed. That severance is the whole point of the demo: it is what the
 * "candidate" clause-aware configuration is meant to fix.
 *
 * Want real-corpus numbers instead? Swap DOCUMENT below for genuine CUAD
 * excerpts and rewrite the acceptance cases' `quote` fields to match
 * verbatim spans in that text (see apps/lib/evidence/core.ts for the
 * verbatim / unique-occurrence rules quotes must satisfy). CUAD is
 * licensed CC BY 4.0 — https://www.atticusprojectai.org/cuad — so any
 * excerpts you embed must carry attribution to the Atticus Project.
 */

export const SAMPLE_DOCUMENT = `MASTER SERVICES AGREEMENT

1. Term. This Agreement commences on the Effective Date and continues for an initial period of three (3) years, and shall renew automatically for successive one (1) year periods unless either party gives written notice of non-renewal at least ninety (90) days before the end of the then-current term.

2. Fees and Payment. Customer shall pay all undisputed invoices within thirty (30) days of receipt. Late amounts accrue interest at the lesser of one and one-half percent (1.5%) per month or the maximum rate permitted by law. Provider may suspend the Services if any undisputed invoice remains unpaid for more than sixty (60) days after written notice of non-payment has been delivered to Customer.

3. Limitation of Liability. Except for breaches of confidentiality, indemnification obligations, and Customer's payment obligations, neither party's aggregate liability arising out of or related to this Agreement shall exceed the total fees paid or payable by Customer to Provider during the twelve (12) months immediately preceding the event giving rise to the claim.

4. Termination for Convenience. Customer may terminate this Agreement for convenience upon sixty (60) days prior written notice to Provider, provided that Customer shall remain responsible for all fees accrued through the effective date of termination and shall not be entitled to any refund of prepaid fees.

5. Governing Law. This Agreement shall be governed by and construed in accordance with the laws of the State of Delaware, without regard to its conflict of laws principles.`;

export const SAMPLE_EXPERIMENT = {
  experimentId: "sample-msa-001",
  documentId: "sample-msa",
  documentText: SAMPLE_DOCUMENT,
  topK: 5,
  cases: [
    {
      id: "renewal-notice",
      question: "How much notice is required to prevent automatic renewal?",
      evidence: [
        {
          quote:
            "unless either party gives written notice of non-renewal at least ninety (90) days before the end of the then-current term",
        },
      ],
    },
    {
      id: "suspension-trigger",
      question: "When may Provider suspend the Services for non-payment?",
      evidence: [
        {
          quote:
            "Provider may suspend the Services if any undisputed invoice remains unpaid for more than sixty (60) days after written notice of non-payment has been delivered to Customer",
        },
      ],
    },
    {
      id: "liability-cap",
      question: "What is the cap on aggregate liability, and what is carved out of it?",
      evidence: [
        {
          quote:
            "Except for breaches of confidentiality, indemnification obligations, and Customer's payment obligations",
        },
        {
          // The complete cap statement. At the 500/50 baseline this clause
          // straddles the seam between chunk [450,950) and chunk [900,1400),
          // so no single baseline chunk contains it and it is severed.
          quote:
            "neither party's aggregate liability arising out of or related to this Agreement shall exceed the total fees paid or payable by Customer to Provider during the twelve (12) months immediately preceding the event giving rise to the claim",
        },
      ],
    },
    {
      id: "termination-convenience",
      question: "Can Customer terminate for convenience, and on what notice?",
      evidence: [
        {
          quote:
            "Customer may terminate this Agreement for convenience upon sixty (60) days prior written notice to Provider",
        },
      ],
    },
    {
      id: "governing-law",
      question: "Which law governs this agreement?",
      evidence: [{ quote: "governed by and construed in accordance with the laws of the State of Delaware" }],
    },
  ],
};
