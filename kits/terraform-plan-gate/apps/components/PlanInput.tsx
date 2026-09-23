"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { FileJson, Network, Play, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export type SampleName = "routine-plan" | "risky-plan" | "real-vpc-plan";

interface Props {
  value: string;
  onChange: (v: string) => void;
  onLoadSample: (name: SampleName) => void;
  onReview: () => void;
  busy: boolean;
}

// Only the shape is checked here; the parser does the real work server-side.
// This catches the two common mistakes (pasting `terraform plan` text, or a
// state file) before a round trip.
const schema = z.object({
  plan: z
    .string()
    .trim()
    .min(1, "Paste the plan JSON first.")
    .superRefine((text, ctx) => {
      let doc: unknown;
      try {
        doc = JSON.parse(text);
      } catch {
        ctx.addIssue({ code: "custom", message: "This is not valid JSON. Use `terraform show -json tfplan`, not the plan text." });
        return;
      }
      const isObject = !!doc && typeof doc === "object" && !Array.isArray(doc);
      const d = isObject ? (doc as Record<string, unknown>) : {};
      if (!isObject || !Array.isArray(d.resource_changes)) {
        ctx.addIssue({ code: "custom", message: "This does not look like a Terraform plan: expected an object with a `resource_changes` array." });
      }
    }),
});

type FormValues = z.infer<typeof schema>;

export function PlanInput({ value, onChange, onLoadSample, onReview, busy }: Props) {
  const { register, handleSubmit, setValue, getValues, formState } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { plan: value },
    mode: "onSubmit",
    reValidateMode: "onChange",
  });
  const error = formState.errors.plan?.message;

  // A loaded sample arrives through the `value` prop; keep the form in step.
  useEffect(() => {
    if (getValues("plan") !== value) setValue("plan", value, { shouldValidate: formState.isSubmitted });
  }, [value, getValues, setValue, formState.isSubmitted]);

  const planField = register("plan", { onChange: (e) => onChange(e.target.value) });

  return (
    <section className="rounded-lg border border-border bg-panel p-4">
      <form onSubmit={handleSubmit(() => onReview())} noValidate>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <Label htmlFor="plan-json">Plan JSON</Label>
          <span className="text-xs text-muted">
            terraform plan -out tfplan &amp;&amp; terraform show -json tfplan &gt; plan.json
          </span>
          <div className="ml-auto flex gap-2">
            <Button variant="outline" size="sm" disabled={busy} onClick={() => onLoadSample("routine-plan")}>
              <FileJson aria-hidden="true" />
              Load routine example
            </Button>
            <Button variant="outline" size="sm" disabled={busy} onClick={() => onLoadSample("risky-plan")}>
              <ShieldAlert aria-hidden="true" />
              Load risky example
            </Button>
            <Button variant="outline" size="sm" disabled={busy} onClick={() => onLoadSample("real-vpc-plan")}>
              <Network aria-hidden="true" />
              Load real VPC plan
            </Button>
          </div>
        </div>
        <Textarea
          id="plan-json"
          className="h-64 resize-y leading-5"
          spellCheck={false}
          disabled={busy}
          placeholder='{ "format_version": "1.2", "resource_changes": [ ... ] }'
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "plan-json-error" : undefined}
          {...planField}
        />
        {error && (
          <p id="plan-json-error" role="alert" className="mt-2 text-xs text-block">
            {error}
          </p>
        )}
        <div className="mt-3 flex items-center gap-3">
          <Button type="submit" disabled={busy || value.trim().length === 0}>
            <Play aria-hidden="true" />
            {busy ? "Reviewing…" : "Review plan"}
          </Button>
          <span className="text-xs text-muted">Sensitive attributes are stripped before anything leaves this app.</span>
        </div>
      </form>
    </section>
  );
}
