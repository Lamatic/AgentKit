"use client";

import { FileText } from "lucide-react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import type { AssessmentInput } from "@/features/assessment/types/assessment";

interface AssessmentFormProps {
  isLoading: boolean;
  onSubmit: (input: AssessmentInput) => Promise<void>;
  onShowSample: () => void;
}

const DEFAULT_VALUES: Pick<AssessmentInput, "fuelType" | "drivability"> = {
  fuelType: "petrol",
  drivability: "normal",
};

export function AssessmentForm({
  isLoading,
  onSubmit,
  onShowSample,
}: AssessmentFormProps) {
  const { handleSubmit, register } = useForm<AssessmentInput>({
    defaultValues: DEFAULT_VALUES,
    shouldUseNativeValidation: true,
  });

  return (
    <form className="assessment-form" onSubmit={handleSubmit(onSubmit)}>
      <div className="section-heading">
        <span className="eyebrow">Vehicle intake</span>
        <h2>Tell us what the vehicle is doing</h2>
        <p>Share observations—not guesses. The advisor will organize the evidence.</p>
      </div>

      <div className="field-grid field-grid-three">
        <label>
          Make
          <input
            placeholder="Honda"
            maxLength={80}
            {...register("make", { required: "Enter the vehicle make" })}
          />
        </label>
        <label>
          Model
          <input
            placeholder="City"
            maxLength={80}
            {...register("model", { required: "Enter the vehicle model" })}
          />
        </label>
        <label>
          Year
          <input
            inputMode="numeric"
            placeholder="2018"
            pattern="\d{4}"
            {...register("year", { required: "Enter a four-digit year" })}
          />
        </label>
      </div>

      <div className="field-grid field-grid-three">
        <label>
          Mileage
          <input
            placeholder="74,000 km"
            maxLength={40}
            {...register("mileage", { required: "Enter the current mileage" })}
          />
        </label>
        <label>
          Fuel type
          <select {...register("fuelType")}>
            <option value="petrol">Petrol</option>
            <option value="diesel">Diesel</option>
            <option value="hybrid">Hybrid</option>
            <option value="electric">Electric</option>
            <option value="other">Other</option>
          </select>
        </label>
        <label>
          Drivability
          <select {...register("drivability")}>
            <option value="normal">Normal</option>
            <option value="limited">Limited</option>
            <option value="immobile">Immobile</option>
          </select>
        </label>
      </div>

      <label>
        Symptoms
        <textarea
          placeholder="Describe noises, smells, vibrations, leaks, when the issue occurs, and what changed."
          minLength={10}
          maxLength={2000}
          rows={5}
          {...register("symptoms", {
            required: "Describe the symptoms",
            minLength: { value: 10, message: "Add at least 10 characters" },
          })}
        />
      </label>

      <div className="field-grid">
        <label>
          Warning lights
          <textarea
            placeholder="Names, colors, and when they appeared"
            maxLength={2000}
            rows={3}
            {...register("warningLights")}
          />
        </label>
        <label>
          Recent service or repairs
          <textarea
            placeholder="What was done and approximately when"
            maxLength={2000}
            rows={3}
            {...register("recentService")}
          />
        </label>
      </div>

      <div className="form-actions">
        <Button className="primary-button" disabled={isLoading} type="submit">
          {isLoading ? "Assessing vehicle…" : "Create triage report"}
        </Button>
        <Button
          className="secondary-button"
          disabled={isLoading}
          onClick={onShowSample}
          type="button"
          variant="outline"
        >
          <FileText aria-hidden="true" size={16} />
          Preview sample report
        </Button>
      </div>
      <p className="form-note">No VIN or personal information is needed.</p>
    </form>
  );
}
