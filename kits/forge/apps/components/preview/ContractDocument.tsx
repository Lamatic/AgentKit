"use client";

interface Props {
  contract: Record<string, { heading: string; body: string }>;
  signature: string | null;
  freelancerName: string;
  clientName: string;
}

const SECTION_ORDER = [
  "parties",
  "recitals",
  "scope_of_work",
  "timeline",
  "payment_terms",
  "intellectual_property",
  "confidentiality",
  "revision_policy",
  "late_payment",
  "termination",
  "governing_law",
  "dispute_resolution",
];

export default function ContractDocument({
  contract,
  signature,
  freelancerName,
  clientName,
}: Props) {
  const today = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div
      id="contract-document"
      className="document-surface p-10 sm:p-14 rounded-lg shadow-xl"
    >
      {/* Title */}
      <div className="text-center mb-10 border-b border-gray-300 pb-8">
        <h1 className="text-2xl font-bold tracking-wide uppercase text-gray-800 mb-2">
          Services Agreement
        </h1>
        <p className="text-sm text-gray-500">{today}</p>
      </div>

      {/* Sections */}
      {SECTION_ORDER.map((key) => {
        const section = contract[key];
        if (!section) return null;

        return (
          <div key={key} className="mb-8">
            <h2 className="text-base font-bold text-gray-800 mb-3 uppercase tracking-wide">
              {section.heading}
            </h2>
            <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">
              {section.body}
            </p>
          </div>
        );
      })}

      {/* Signatures — interactive UI (LLM signatures section is skipped above) */}
      <div className="mt-12 pt-8 border-t border-gray-300">
        <h2 className="text-base font-bold text-gray-800 mb-6 uppercase tracking-wide">
          Signatures
        </h2>
        <div className="grid grid-cols-2 gap-10 mt-8">
          {/* Freelancer */}
          <div className="space-y-3">
            <p className="text-sm font-semibold text-gray-700">{freelancerName}</p>
            <div className="h-16 border-b border-gray-400 flex items-end pb-1">
              {signature ? (
                <img src={signature} alt="Signature" className="h-14 object-contain" />
              ) : (
                <span className="text-xs text-gray-400 italic">Awaiting signature</span>
              )}
            </div>
            <p className="text-xs text-gray-500">Date: {today}</p>
            <p className="text-xs text-gray-500">Role: Freelancer</p>
          </div>

          {/* Client */}
          <div className="space-y-3">
            <p className="text-sm font-semibold text-gray-700">{clientName}</p>
            <div className="h-16 border-b border-gray-400 flex items-end pb-1" />
            <p className="text-xs text-gray-500">Date: ___________</p>
            <p className="text-xs text-gray-500">Role: Client</p>
          </div>
        </div>
      </div>
    </div>
  );
}
