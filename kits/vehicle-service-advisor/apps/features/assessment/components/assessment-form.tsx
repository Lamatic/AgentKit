"use client";

import type { FormEvent } from "react";
import type {
  AssessmentInput,
  Drivability,
} from "@/features/assessment/types/assessment";

interface AssessmentFormProps {
  isLoading: boolean;
  onSubmit: (input: AssessmentInput) => Promise<void>;
  onShowSample: () => void;
}

function getField(formData: FormData, name: string): string {
  return String(formData.get(name) ?? "").trim();
}

function mapFormData(formData: FormData): AssessmentInput {
  return {
    make: getField(formData, "make"),
    model: getField(formData, "model"),
    year: getField(formData, "year"),
    mileage: getField(formData, "mileage"),
    fuelType: getField(formData, "fuelType"),
    symptoms: getField(formData, "symptoms"),
    warningLights: getField(formData, "warningLights"),
    recentService: getField(formData, "recentService"),
    drivability: getField(formData, "drivability") as Drivability,
  };
}

export function AssessmentForm({
  isLoading,
  onSubmit,
  onShowSample,
}: AssessmentFormProps) {
  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    await onSubmit(mapFormData(new FormData(event.currentTarget)));
  }

  return (
    <form className="assessment-form" onSubmit={handleSubmit}>
      <div className="section-heading">
        <span className="eyebrow">Vehicle intake</span>
        <h2>Tell us what the vehicle is doing</h2>
        <p>Share observations—not guesses. The advisor will organize the evidence.</p>
      </div>

      <div className="field-grid field-grid-three">
        <label>
          Make
          <input name="make" placeholder="Honda" required maxLength={80} />
        </label>
        <label>
          Model
          <input name="model" placeholder="City" required maxLength={80} />
        </label>
        <label>
          Year
          <input name="year" inputMode="numeric" placeholder="2018" pattern="\d{4}" required />
        </label>
      </div>

      <div className="field-grid field-grid-three">
        <label>
          Mileage
          <input name="mileage" placeholder="74,000 km" required maxLength={40} />
        </label>
        <label>
          Fuel type
          <select name="fuelType" defaultValue="petrol">
            <option value="petrol">Petrol</option>
            <option value="diesel">Diesel</option>
            <option value="hybrid">Hybrid</option>
            <option value="electric">Electric</option>
            <option value="other">Other</option>
          </select>
        </label>
        <label>
          Drivability
          <select name="drivability" defaultValue="normal">
            <option value="normal">Normal</option>
            <option value="limited">Limited</option>
            <option value="immobile">Immobile</option>
          </select>
        </label>
      </div>

      <label>
        Symptoms
        <textarea
          name="symptoms"
          placeholder="Describe noises, smells, vibrations, leaks, when the issue occurs, and what changed."
          required
          minLength={10}
          maxLength={2000}
          rows={5}
        />
      </label>

      <div className="field-grid">
        <label>
          Warning lights
          <textarea name="warningLights" placeholder="Names, colors, and when they appeared" maxLength={2000} rows={3} />
        </label>
        <label>
          Recent service or repairs
          <textarea name="recentService" placeholder="What was done and approximately when" maxLength={2000} rows={3} />
        </label>
      </div>

      <div className="form-actions">
        <button className="primary-button" disabled={isLoading} type="submit">
          {isLoading ? "Assessing vehicle…" : "Create triage report"}
        </button>
        <button
          className="secondary-button"
          disabled={isLoading}
          onClick={onShowSample}
          type="button"
        >
          Preview sample report
        </button>
      </div>
      <p className="form-note">No VIN or personal information is needed.</p>
    </form>
  );
}
