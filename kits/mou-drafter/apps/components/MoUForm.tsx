"use client";

import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  mouFormSchema,
  type MoUFormData,
  ENGAGEMENT_TYPES,
  PAYMENT_SCHEDULES,
  PAYMENT_PRESETS,
  IP_OWNERSHIP_OPTIONS,
  TERMINATION_PRESETS,
  DISPUTE_RESOLUTION_OPTIONS,
} from "@/lib/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Plus,
  Trash2,
  Loader2,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
} from "lucide-react";
import { useState } from "react";

// ── Human-friendly labels for enum values ─────────────────────────────
const ENGAGEMENT_LABELS: Record<string, string> = {
  services: "Services",
  venue: "Venue Hire",
  catering: "Catering",
  "av-equipment": "AV Equipment",
  photography: "Photography",
  design: "Design",
  sponsorship: "Sponsorship",
  other: "Other",
};

const PAYMENT_SCHEDULE_LABELS: Record<string, string> = {
  "milestone-based": "Milestone-based (recommended)",
  "lump-sum": "Lump sum",
};

const PAYMENT_PRESET_LABELS: Record<string, string> = {
  "30-net-15": "30% deposit, net-15",
  "50-net-30": "50% deposit, net-30",
  "25-net-7": "25% deposit, net-7",
  custom: "Custom terms",
};

const IP_LABELS: Record<string, string> = {
  engager: "Engager owns IP",
  vendor: "Vendor retains IP",
  joint: "Joint ownership",
  "not-applicable": "Not applicable",
};

const TERMINATION_LABELS: Record<string, string> = {
  "standard-30-7": "Standard (30-day notice, 7-day cure)",
  "short-14-3": "Short (14-day notice, 3-day cure)",
  "extended-60-14": "Extended (60-day notice, 14-day cure)",
};

const DISPUTE_LABELS: Record<string, string> = {
  "mediation-then-arbitration": "Mediation then arbitration",
  "arbitration-only": "Arbitration only",
  courts: "Courts",
};

// ── Select helper (custom Radix Select with Controller) ───────────────
function FormSelect({
  id,
  label,
  options,
  labels,
  control,
  error,
  required,
}: {
  id: string;
  label: string;
  options: readonly string[];
  labels: Record<string, string>;
  control: any;
  error?: string;
  required?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
      <Controller
        name={id as any}
        control={control}
        render={({ field }) => (
          <Select
            onValueChange={field.onChange}
            value={field.value?.toString() || ""}
          >
            <SelectTrigger id={id} className="w-full">
              <SelectValue placeholder={`Select ${label.toLowerCase()}`} />
            </SelectTrigger>
            <SelectContent>
              {options.map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {labels[opt] || opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

// ── Toggle helper ─────────────────────────────────────────────────────
function FormToggle({
  id,
  label,
  description,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-1.5">
      <div>
        <Label htmlFor={id} className="text-sm font-medium cursor-pointer">
          {label}
        </Label>
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
      <button
        type="button"
        role="switch"
        id={id}
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
          checked ? "bg-primary" : "bg-input"
        }`}
      >
        <span
          className={`pointer-events-none block h-4 w-4 rounded-full bg-background shadow-lg ring-0 transition-transform ${
            checked ? "translate-x-4" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}

// ── Input field helper ─────────────────────────────────────────────────
function FormField({
  id,
  label,
  error,
  required,
  ...props
}: {
  id: string;
  label: string;
  error?: string;
  required?: boolean;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
      <Input id={id} {...props} />
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

// ── Party sub-form ────────────────────────────────────────────────────
function PartyFields({
  prefix,
  title,
  register,
  control,
  errors,
}: {
  prefix: "partyA" | "partyB";
  title: string;
  register: any;
  control: any;
  errors: any;
}) {
  const e = errors?.[prefix] || {};
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
        {title}
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <FormField
          id={`${prefix}.name`}
          label="Name"
          placeholder="Acme Corp"
          required
          error={e.name?.message}
          {...register(`${prefix}.name`)}
        />
        <FormSelect
          id={`${prefix}.type`}
          label="Entity type"
          options={["org", "individual", "corp", "llc", "llp", "partnership", "trust"]}
          labels={{
            org: "Organisation",
            individual: "Individual",
            corp: "Corporation",
            llc: "LLC",
            llp: "LLP",
            partnership: "Partnership",
            trust: "Trust",
          }}
          control={control}
          error={e.type?.message}
        />
        <FormField
          id={`${prefix}.address`}
          label="Address"
          placeholder="123 Main St, Bangalore, Karnataka, India"
          required
          error={e.address?.message}
          {...register(`${prefix}.address`)}
        />
        <FormField
          id={`${prefix}.email`}
          label="Email"
          type="email"
          placeholder="contact@acme.com"
          required
          error={e.email?.message}
          {...register(`${prefix}.email`)}
        />
        <FormField
          id={`${prefix}.signatory`}
          label="Signatory name"
          placeholder="Priya Sharma"
          required
          error={e.signatory?.message}
          {...register(`${prefix}.signatory`)}
        />
        <FormField
          id={`${prefix}.signatoryRole`}
          label="Signatory role"
          placeholder="Managing Director"
          required
          error={e.signatoryRole?.message}
          {...register(`${prefix}.signatoryRole`)}
        />
      </div>
    </div>
  );
}

// ── Main form component ──────────────────────────────────────────────
interface MoUFormProps {
  onSubmit: (data: MoUFormData) => void;
  isSubmitting: boolean;
}

export default function MoUForm({ onSubmit, isSubmitting }: MoUFormProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    formState: { errors },
  } = useForm<MoUFormData>({
    resolver: zodResolver(mouFormSchema) as any,
    defaultValues: {
      agreementTitle: "",
      effectiveDate: "",
      engagementType: "services",
      partyA: {
        name: "",
        type: "org",
        address: "",
        signatory: "",
        signatoryRole: "",
        email: "",
      },
      partyB: {
        name: "",
        type: "org",
        address: "",
        signatory: "",
        signatoryRole: "",
        email: "",
      },
      scopeOfWork: "",
      deliverables: [{ label: "", dueDate: "", acceptanceCriteria: "" }],
      totalFeeAmount: 0,
      totalFeeCurrency: "INR",
      paymentSchedule: "milestone-based",
      paymentPreset: "30-net-15",
      eventStart: "",
      eventEnd: "",
      confidentialityRequired: true,
      confidentialitySurvivalYears: 3,
      ipOwnership: "engager",
      ipPortfolioRights: true,
      terminationPreset: "standard-30-7",
      insuranceRequired: false,
      insuranceGenLiab: 0,
      insuranceProfIndem: 0,
      dataProtectionRequired: false,
      subcontractingAllowed: false,
      noPublicityRequired: true,
      liabilityCapMultiplier: 1,
      governingLaw: "",
      disputeResolution: "mediation-then-arbitration",
      disputeVenue: "",
      additionalContext: "",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "deliverables",
  });

  const paymentSchedule = watch("paymentSchedule");
  const paymentPreset = watch("paymentPreset");
  const confidentialityRequired = watch("confidentialityRequired");
  const insuranceRequired = watch("insuranceRequired");
  const engagementType = watch("engagementType");

  // Event-type engagement types that need dates
  const needsDates = ["venue", "catering", "av-equipment", "photography"].includes(
    engagementType
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* ── Section 1: Agreement Basics ────────────────────────── */}
      <Card className="glass-card">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Agreement Basics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              id="agreementTitle"
              label="Agreement title"
              placeholder="Catering Services MoU — AEON 2025"
              required
              error={errors.agreementTitle?.message}
              {...register("agreementTitle")}
            />
            <FormField
              id="effectiveDate"
              label="Effective date"
              type="date"
              required
              error={errors.effectiveDate?.message}
              {...register("effectiveDate")}
            />
          </div>
          <FormSelect
            id="engagementType"
            label="Engagement type"
            options={ENGAGEMENT_TYPES}
            labels={ENGAGEMENT_LABELS}
            control={control}
            required
            error={errors.engagementType?.message}
          />
        </CardContent>
      </Card>

      {/* ── Section 2: Parties ─────────────────────────────────── */}
      <Card className="glass-card">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Parties</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <PartyFields
            prefix="partyA"
            title="Party A — Engager"
            register={register}
            control={control}
            errors={errors}
          />
          <Separator />
          <PartyFields
            prefix="partyB"
            title="Party B — Vendor"
            register={register}
            control={control}
            errors={errors}
          />
        </CardContent>
      </Card>

      {/* ── Section 3: Scope & Deliverables ────────────────────── */}
      <Card className="glass-card">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Scope & Deliverables</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="scopeOfWork">
              Scope of work
              <span className="text-destructive ml-1">*</span>
            </Label>
            <Textarea
              id="scopeOfWork"
              placeholder="Describe the services, goods, or engagement in detail..."
              rows={4}
              {...register("scopeOfWork")}
            />
            {errors.scopeOfWork && (
              <p className="text-xs text-destructive">
                {errors.scopeOfWork.message}
              </p>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Deliverables</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  append({ label: "", dueDate: "", acceptanceCriteria: "" })
                }
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Add
              </Button>
            </div>
            {fields.map((field, index) => (
              <div
                key={field.id}
                className="deliverable-row grid grid-cols-1 md:grid-cols-[1fr_140px_1fr_auto] gap-2 items-end p-3"
              >
                <FormField
                  id={`deliverables.${index}.label`}
                  label="Deliverable"
                  placeholder="Menu planning"
                  required
                  error={
                    errors.deliverables?.[index]?.label?.message
                  }
                  {...register(`deliverables.${index}.label`)}
                />
                <FormField
                  id={`deliverables.${index}.dueDate`}
                  label="Due date"
                  type="date"
                  required
                  error={
                    errors.deliverables?.[index]?.dueDate?.message
                  }
                  {...register(`deliverables.${index}.dueDate`)}
                />
                <FormField
                  id={`deliverables.${index}.acceptanceCriteria`}
                  label="Acceptance criteria"
                  placeholder="Approved by event coordinator"
                  required
                  error={
                    errors.deliverables?.[index]?.acceptanceCriteria?.message
                  }
                  {...register(
                    `deliverables.${index}.acceptanceCriteria`
                  )}
                />
                {fields.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive/80 h-9"
                    onClick={() => remove(index)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── Section 4: Commercials ─────────────────────────────── */}
      <Card className="glass-card">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Commercials</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              id="totalFeeAmount"
              label="Total fee"
              type="number"
              placeholder="100000"
              required
              error={errors.totalFeeAmount?.message}
              {...register("totalFeeAmount")}
            />
            <FormField
              id="totalFeeCurrency"
              label="Currency"
              placeholder="INR"
              maxLength={3}
              error={errors.totalFeeCurrency?.message}
              {...register("totalFeeCurrency")}
            />
            <FormSelect
              id="paymentSchedule"
              label="Payment schedule"
              options={PAYMENT_SCHEDULES}
              labels={PAYMENT_SCHEDULE_LABELS}
              control={control}
              error={errors.paymentSchedule?.message}
            />
          </div>

          {paymentSchedule === "lump-sum" && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Lump-sum payment removes leverage to fix bad delivery.
                Milestone-based is lower risk. Your choice is honoured.
              </AlertDescription>
            </Alert>
          )}

          {paymentSchedule !== "lump-sum" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormSelect
                id="paymentPreset"
                label="Payment terms"
                options={PAYMENT_PRESETS}
                labels={PAYMENT_PRESET_LABELS}
                control={control}
                error={errors.paymentPreset?.message}
              />
              {paymentPreset === "custom" && (
                <>
                  <FormField
                    id="customDepositPct"
                    label="Deposit %"
                    type="number"
                    min={1}
                    max={100}
                    {...register("customDepositPct")}
                  />
                  <FormField
                    id="customPaymentDays"
                    label="Net payment days"
                    type="number"
                    min={1}
                    max={180}
                    {...register("customPaymentDays")}
                  />
                </>
              )}
            </div>
          )}

          {needsDates && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                id="eventStart"
                label="Event start date"
                type="date"
                error={errors.eventStart?.message}
                {...register("eventStart")}
              />
              <FormField
                id="eventEnd"
                label="Event end date"
                type="date"
                error={errors.eventEnd?.message}
                {...register("eventEnd")}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Section 5: Jurisdiction ────────────────────────────── */}
      <Card className="glass-card">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Jurisdiction</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              id="governingLaw"
              label="Governing law"
              placeholder="Karnataka, India"
              required
              error={errors.governingLaw?.message}
              {...register("governingLaw")}
            />
            <FormField
              id="disputeVenue"
              label="Dispute venue"
              placeholder="Bangalore"
              required
              error={errors.disputeVenue?.message}
              {...register("disputeVenue")}
            />
          </div>
          <FormSelect
            id="disputeResolution"
            label="Dispute resolution"
            options={DISPUTE_RESOLUTION_OPTIONS}
            labels={DISPUTE_LABELS}
            control={control}
            error={errors.disputeResolution?.message}
          />
        </CardContent>
      </Card>

      {/* ── Section 6: Risk & Protection (collapsible) ─────────── */}
      <Card className="glass-card">
        <CardHeader
          className="pb-4 cursor-pointer select-none"
          onClick={() => setShowAdvanced(!showAdvanced)}
        >
          <CardTitle className="text-lg flex items-center gap-2">
            {showAdvanced ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
            Risk & Protection
            <span className="text-xs font-normal text-muted-foreground ml-2">
              Clause toggles — sensible defaults pre-selected
            </span>
          </CardTitle>
        </CardHeader>
        {showAdvanced && (
          <CardContent className="space-y-4">
            <FormToggle
              id="confidentialityRequired"
              label="Confidentiality clause"
              description="NDA with survival period after termination"
              checked={confidentialityRequired}
              onChange={(v) => setValue("confidentialityRequired", v)}
            />
            {confidentialityRequired && (
              <div className="pl-4 border-l-2 border-muted">
                <FormField
                  id="confidentialitySurvivalYears"
                  label="Survival period (years)"
                  type="number"
                  min={1}
                  max={10}
                  {...register("confidentialitySurvivalYears")}
                />
              </div>
            )}

            <Separator />

            <FormSelect
              id="ipOwnership"
              label="IP ownership"
              options={IP_OWNERSHIP_OPTIONS}
              labels={IP_LABELS}
              control={control}
            />
            <FormToggle
              id="ipPortfolioRights"
              label="Vendor portfolio rights"
              description="Vendor may use deliverables in their portfolio with your consent"
              checked={watch("ipPortfolioRights")}
              onChange={(v) => setValue("ipPortfolioRights", v)}
            />

            <Separator />

            <FormSelect
              id="terminationPreset"
              label="Termination terms"
              options={TERMINATION_PRESETS}
              labels={TERMINATION_LABELS}
              control={control}
            />

            <Separator />

            <FormToggle
              id="insuranceRequired"
              label="Require vendor insurance"
              description="General liability and professional indemnity minimums"
              checked={insuranceRequired}
              onChange={(v) => setValue("insuranceRequired", v)}
            />
            {insuranceRequired && (
              <div className="pl-4 border-l-2 border-muted grid grid-cols-1 md:grid-cols-2 gap-3">
                <FormField
                  id="insuranceGenLiab"
                  label="General liability minimum"
                  type="number"
                  placeholder="1000000"
                  {...register("insuranceGenLiab")}
                />
                <FormField
                  id="insuranceProfIndem"
                  label="Professional indemnity minimum"
                  type="number"
                  placeholder="500000"
                  {...register("insuranceProfIndem")}
                />
              </div>
            )}

            <Separator />

            <FormToggle
              id="dataProtectionRequired"
              label="Data protection (DPA-lite)"
              description="Lawful-basis, 72h breach notice, deletion on termination"
              checked={watch("dataProtectionRequired")}
              onChange={(v) => setValue("dataProtectionRequired", v)}
            />
            <FormToggle
              id="subcontractingAllowed"
              label="Allow subcontracting"
              description="If off, vendor needs prior written consent to subcontract"
              checked={watch("subcontractingAllowed")}
              onChange={(v) => setValue("subcontractingAllowed", v)}
            />
            <FormToggle
              id="noPublicityRequired"
              label="No-publicity clause"
              description="Vendor can't use your name in marketing without consent"
              checked={watch("noPublicityRequired")}
              onChange={(v) => setValue("noPublicityRequired", v)}
            />

            <Separator />

            <FormSelect
              id="liabilityCapMultiplier"
              label="Liability cap multiplier"
              options={["1", "2", "3"]}
              labels={{
                "1": "1× total fee",
                "2": "2× total fee",
                "3": "3× total fee",
              }}
              control={control}
              error={errors.liabilityCapMultiplier?.message}
            />
          </CardContent>
        )}
      </Card>

      {/* ── Section 7: Additional Context ──────────────────────── */}
      <Card className="glass-card">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Additional Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            id="additionalContext"
            placeholder="Any extra context for the drafter (optional, max 2000 chars)..."
            rows={3}
            maxLength={2000}
            {...register("additionalContext")}
          />
        </CardContent>
      </Card>

      {/* ── Submit ─────────────────────────────────────────────── */}
      <div className="flex justify-end">
        <Button
          type="submit"
          size="lg"
          disabled={isSubmitting}
          className="min-w-[200px]"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Generating draft...
            </>
          ) : (
            "Generate MoU Draft"
          )}
        </Button>
      </div>
    </form>
  );
}
