import { PromptAnalysisOutput } from "@/types";
import RiskBadge from "./RiskBadge";

interface Props {
  data: PromptAnalysisOutput;
}

export default function AnalysisResult({
  data,
}: Props) {

  const a = data.analysis;

  return (
    <div className="space-y-6">

      <div className="grid grid-cols-2 gap-4">

        <div className="rounded-xl border p-5">

          <h3 className="text-sm text-gray-500">
            Risk Score
          </h3>

          <p className="text-4xl font-bold">
            {a.risk_score}
          </p>

        </div>

        <div className="rounded-xl border p-5">

          <h3 className="text-sm text-gray-500">
            Severity
          </h3>

          <RiskBadge severity={a.severity} />

        </div>

      </div>

      <div className="rounded-xl border p-5">

        <h3 className="font-bold mb-3">
          Attack Types
        </h3>

        <div className="flex flex-wrap gap-2">

          {a.attack_types.map((type) => (

            <span
              key={type}
              className="rounded-full bg-blue-100 px-3 py-1 text-sm"
            >
              {type}
            </span>

          ))}

        </div>

      </div>

      <div className="rounded-xl border p-5">

        <h3 className="font-bold">
          Explanation
        </h3>

        <p className="mt-3 text-gray-700">
          {a.explanation}
        </p>

      </div>

      <div className="rounded-xl border p-5">

        <h3 className="font-bold">
          Recommendation
        </h3>

        <p className="mt-3 text-gray-700">
          {a.recommendation}
        </p>

      </div>

      <div className="rounded-xl border p-5">

        <h3 className="font-bold">
          Sanitized Prompt
        </h3>

        <pre className="mt-3 whitespace-pre-wrap rounded-lg bg-gray-100 p-3">
          {a.sanitized_prompt || "No sanitized prompt generated."}
        </pre>

      </div>

    </div>
  );
}