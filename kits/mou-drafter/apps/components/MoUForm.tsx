"use client";

import { useForm, useFieldArray, Controller, type Control, type UseFormRegister, type FieldErrors } from "react-hook-form";
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
  PAYMENT_TIMING_OPTIONS,
  CANCELLATION_POLICY_OPTIONS,
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Plus,
  Trash2,
  Loader2,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  Info,
} from "lucide-react";
import { useState, type ReactNode } from "react";

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

const PAYMENT_TIMING_LABELS: Record<string, string> = {
  "advance-full": "Full payment in advance (before event)",
  "advance-partial": "Deposit in advance, balance after",
  "after-event": "Full payment after completion",
  "milestone-tied": "Tied to milestone acceptance",
  custom: "Custom timing",
};

const CANCELLATION_LABELS: Record<string, string> = {
  none: "No cancellation policy",
  "sliding-scale": "Sliding scale (tiered by notice period)",
  "flat-fee": "Flat cancellation fee",
  custom: "Custom terms",
};

// ── Helper text shown in the info-icon tooltips ────────────────────────
// Plain-English explanations for non-lawyer users. Kept short. For
// dropdowns we include a one-liner per option since dynamic per-option
// help would be hard to discover.
const HELP = {
  agreementTitle: "A short name for the agreement that appears on the cover and footer (e.g. 'Catering Services MoU — Annual Summit 2026').",
  effectiveDate: "The date the agreement starts being in force. Usually the date both parties sign.",
  engagementType: (
    <div className="space-y-1">
      <p>What the vendor is being engaged to do. Picks the right set of clauses.</p>
      <ul className="list-disc list-inside text-[11px] space-y-0.5">
        <li><b>Services</b> — general consulting / professional services</li>
        <li><b>Venue</b> — renting a space</li>
        <li><b>Catering</b> — food &amp; beverage</li>
        <li><b>AV Equipment</b> — audio / video / staging rental</li>
        <li><b>Photography</b> — photo / video coverage</li>
        <li><b>Design</b> — graphics, branding, creative</li>
        <li><b>Sponsorship</b> — paid sponsorship arrangement</li>
        <li><b>Other</b> — anything else</li>
      </ul>
    </div>
  ),
  entityType: (
    <div className="space-y-1">
      <p>What kind of legal entity this party is.</p>
      <ul className="list-disc list-inside text-[11px] space-y-0.5">
        <li><b>Organisation</b> — generic catch-all if unsure</li>
        <li><b>Individual</b> — a single human, not a company</li>
        <li><b>Corporation</b> — incorporated company</li>
        <li><b>LLC</b> — limited liability company</li>
        <li><b>LLP</b> — limited liability partnership</li>
        <li><b>Partnership</b> — general / traditional partnership</li>
        <li><b>Trust</b> — a trust entity</li>
      </ul>
    </div>
  ),
  signatory: "The actual human who will sign on behalf of this party.",
  signatoryRole: "Their job title (e.g. 'Managing Director', 'Head of Operations'). Appears next to their name and in the signature block.",
  scopeOfWork: "Describe in plain English what the vendor will do — the more specific, the better the draft. Mention quantities, attendee counts, deliverables.",
  deliverables: "Concrete things the vendor must produce or do (e.g. 'Approved menu', 'On-site catering for 200 guests'). Each one becomes a milestone if you're paying by milestones.",
  totalFee: "The total amount you're agreeing to pay the vendor.",
  currency: "3-letter ISO code: INR, USD, EUR, GBP, etc.",
  paymentSchedule: (
    <div className="space-y-1">
      <p>How payment is structured.</p>
      <ul className="list-disc list-inside text-[11px] space-y-0.5">
        <li><b>Milestone-based</b> — pay in tranches as deliverables are accepted. Safer for you.</li>
        <li><b>Lump sum</b> — single payment. Simpler but less leverage if delivery goes wrong.</li>
      </ul>
    </div>
  ),
  paymentPreset: (
    <div className="space-y-1">
      <p>Industry-standard payment terms. Format: deposit% + net-days.</p>
      <ul className="list-disc list-inside text-[11px] space-y-0.5">
        <li><b>30% deposit, net-15</b> — 30% on signing, balance within 15 days of acceptance</li>
        <li><b>50% deposit, net-30</b> — bigger deposit, longer pay window</li>
        <li><b>25% deposit, net-7</b> — smaller deposit, faster pay</li>
        <li><b>Custom</b> — set your own deposit % and pay window</li>
      </ul>
    </div>
  ),
  paymentTiming: (
    <div className="space-y-1">
      <p>When the lump-sum payment is due relative to the event/delivery.</p>
      <ul className="list-disc list-inside text-[11px] space-y-0.5">
        <li><b>Full in advance</b> — pay everything before the event</li>
        <li><b>Deposit advance, balance after</b> — partial upfront, rest on completion</li>
        <li><b>After completion</b> — pay nothing upfront</li>
        <li><b>Tied to milestones</b> — pick this only if you have milestones</li>
        <li><b>Custom</b> — describe it yourself</li>
      </ul>
    </div>
  ),
  taxesIncluded: "ON = the fee already includes GST/VAT/etc. OFF = tax is added on top of the fee on invoices.",
  taxRatePct: "The applicable tax rate (e.g. 18 for India GST, 20 for UK VAT). Leave 0 if unsure — the clause will say 'as per applicable law'.",
  lateFeePctPerMonth: "If the engager pays late, this is the interest charged per month. Common: 1–2%. Leave 0 to default to statutory interest.",
  cancellationPolicy: (
    <div className="space-y-1">
      <p>What happens if the engagement is cancelled.</p>
      <ul className="list-disc list-inside text-[11px] space-y-0.5">
        <li><b>None</b> — no cancellation fee</li>
        <li><b>Sliding scale</b> — fee depends on how close to the event you cancel (more notice = less penalty)</li>
        <li><b>Flat fee</b> — single fixed cancellation amount</li>
        <li><b>Custom</b> — write your own terms</li>
      </ul>
      <p className="text-[11px] italic">For events, a sliding scale is the most common.</p>
    </div>
  ),
  eventDates: "When the event happens. Used in date-anchored clauses like cancellation and force majeure.",
  eventVenue: "Where the event happens. Optional, but appears in the Event Logistics clause if filled in.",
  guestCountFinalDate: "Cutoff date for confirming the final guest count. After this date, headcount is locked.",
  extraGuestRate: "Per-head charge if more guests show up than the confirmed count. Vendor uses this to recover ingredient/staff costs.",
  foodSafetyRequired: "Adds a clause requiring the vendor to comply with food-safety / licensing rules (FSSAI in India, FDA in US, etc.).",
  allergyHandlingRequired: "Adds a clause covering allergen labelling, dedicated vegan/gluten-free preparation, and disclosure responsibilities.",
  governingLaw: "The state/country whose laws govern the contract (e.g. 'Karnataka, India' or 'Delaware'). Drives which jurisdiction-specific clauses apply.",
  disputeVenue: "Which city's courts/arbitration centre handles disputes (e.g. 'Bangalore', 'New York').",
  disputeResolution: (
    <div className="space-y-1">
      <p>How disputes get resolved.</p>
      <ul className="list-disc list-inside text-[11px] space-y-0.5">
        <li><b>Mediation then arbitration</b> — try to settle first, then arbitrate. Cheapest, fastest.</li>
        <li><b>Arbitration only</b> — skip mediation, go straight to arbitration</li>
        <li><b>Courts</b> — litigate in regular courts. Slow and expensive.</li>
      </ul>
    </div>
  ),
  confidentiality: "Adds an NDA-style clause protecting non-public info shared between the parties.",
  confidentialitySurvivalYears: "How many years the confidentiality obligation lasts AFTER the agreement ends. Common: 2–5 years.",
  ipOwnership: (
    <div className="space-y-1">
      <p>Who owns any IP (designs, code, photos, etc.) created during the engagement.</p>
      <ul className="list-disc list-inside text-[11px] space-y-0.5">
        <li><b>Engager owns</b> — you own everything the vendor creates (typical for paid work)</li>
        <li><b>Vendor retains</b> — vendor keeps ownership, gives you a licence to use</li>
        <li><b>Joint</b> — both parties co-own</li>
        <li><b>Not applicable</b> — no IP is being created (catering, venue, etc.)</li>
      </ul>
    </div>
  ),
  ipPortfolioRights: "Lets the vendor showcase the deliverables in their portfolio (with your consent). Common for design/photo work.",
  terminationPreset: (
    <div className="space-y-1">
      <p>How either party can end the agreement.</p>
      <ul className="list-disc list-inside text-[11px] space-y-0.5">
        <li><b>Standard (30-day notice, 7-day cure)</b> — default for most engagements</li>
        <li><b>Short (14-day, 3-day cure)</b> — fast exit. Risky for events with sunk costs.</li>
        <li><b>Extended (60-day, 14-day cure)</b> — slow, safer for longer engagements</li>
      </ul>
      <p className="text-[11px] italic">'Cure' = window for the breaching party to fix the issue before termination.</p>
    </div>
  ),
  insuranceRequired: "Requires the vendor to carry insurance with minimum coverage you specify, and name you as additional insured.",
  insuranceGenLiab: "Minimum cover for general accidents/damage (e.g. someone trips at the event). Common for events: 500K–5M INR.",
  insuranceProfIndem: "Minimum cover for professional mistakes (e.g. food poisoning, bad design). Common: 250K–2.5M INR.",
  dataProtectionRequired: "Adds a DPA-lite clause: lawful processing, 72h breach notice, deletion on termination. Use if the vendor handles personal data.",
  subcontractingAllowed: "If OFF, the vendor needs your written consent before bringing in subcontractors.",
  noPublicityRequired: "Stops the vendor from using your name/logo in marketing without your written consent.",
  liabilityCapMultiplier: "Caps each party's total liability at this multiple of the Total Fee. 1× is tight; 2–3× is more typical.",
  additionalContext: "Anything else worth mentioning that doesn't fit the structured fields — context for the drafter.",
} as const;

// ── Info-icon tooltip beside a field label ─────────────────────────────
// Click/focus the icon → tooltip with helper text. Not hover-only because
// we want it discoverable on touch + accessible by keyboard.
function FieldLabel({
  htmlFor,
  label,
  required,
  info,
}: {
  htmlFor: string;
  label: string;
  required?: boolean;
  info?: ReactNode;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <Label htmlFor={htmlFor}>
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
      {info && (
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              aria-label={`Help: ${label}`}
              className="text-muted-foreground/70 hover:text-foreground transition-colors focus-visible:outline-none focus-visible:text-foreground"
            >
              <Info className="h-3 w-3" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs text-left leading-snug">
            {info}
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}

// ── Select helper (custom Radix Select with Controller) ───────────────
function FormSelect({
  id,
  label,
  options,
  labels,
  control,
  error,
  required,
  info,
}: {
  id: string;
  label: string;
  options: readonly string[];
  labels: Record<string, string>;
  control: Control<MoUFormData>;
  error?: string;
  required?: boolean;
  info?: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <FieldLabel htmlFor={id} label={label} required={required} info={info} />
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
  info,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  description?: string;
  info?: ReactNode;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-1.5">
      <div>
        <div className="flex items-center gap-1.5">
          <Label htmlFor={id} className="text-sm font-medium cursor-pointer">
            {label}
          </Label>
          {info && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  aria-label={`Help: ${label}`}
                  className="text-muted-foreground/70 hover:text-foreground transition-colors focus-visible:outline-none focus-visible:text-foreground"
                >
                  <Info className="h-3 w-3" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs text-left leading-snug">
                {info}
              </TooltipContent>
            </Tooltip>
          )}
        </div>
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
        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${checked ? "bg-primary" : "bg-input"
          }`}
      >
        <span
          className={`pointer-events-none block h-4 w-4 rounded-full bg-background shadow-lg ring-0 transition-transform ${checked ? "translate-x-4" : "translate-x-0"
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
  info,
  ...props
}: {
  id: string;
  label: string;
  error?: string;
  required?: boolean;
  info?: ReactNode;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="space-y-1.5">
      <FieldLabel htmlFor={id} label={label} required={required} info={info} />
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
  register: UseFormRegister<MoUFormData>;
  control: Control<MoUFormData>;
  errors: FieldErrors<MoUFormData>;
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
          info={HELP.entityType}
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
          info={HELP.signatory}
          error={e.signatory?.message}
          {...register(`${prefix}.signatory`)}
        />
        <FormField
          id={`${prefix}.signatoryRole`}
          label="Signatory role"
          placeholder="Managing Director"
          required
          info={HELP.signatoryRole}
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
  initialValues?: Partial<MoUFormData>;
}

export default function MoUForm({ onSubmit, isSubmitting, initialValues }: MoUFormProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const advancedPanelId = "risk-protection-panel";

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
      eventStartTime: "",
      eventEndTime: "",
      eventVenue: "",
      paymentTiming: "milestone-tied",
      paymentTimingCustom: "",
      taxesIncluded: false,
      taxRatePct: 0,
      lateFeePctPerMonth: 0,
      cancellationPolicy: "none",
      cancellationTerms: "",
      guestCountFinalDate: "",
      extraGuestRate: 0,
      foodSafetyRequired: false,
      allergyHandlingRequired: false,
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
      ...initialValues,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "deliverables",
  });

  const paymentSchedule = watch("paymentSchedule");
  const paymentPreset = watch("paymentPreset");
  const paymentTiming = watch("paymentTiming");
  const confidentialityRequired = watch("confidentialityRequired");
  const insuranceRequired = watch("insuranceRequired");
  const taxesIncluded = watch("taxesIncluded");
  const cancellationPolicy = watch("cancellationPolicy");
  const engagementType = watch("engagementType");

  // Event-type engagement types that need dates
  const needsDates = ["venue", "catering", "av-equipment", "photography"].includes(
    engagementType
  );
  const isCatering = engagementType === "catering";

  return (
    <TooltipProvider delayDuration={150}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* ── Section 1: Agreement Basics ────────────────────────── */}
        <Card className="glass-card">
          <CardHeader className="pb-1">
            <CardTitle className="text-lg">Agreement Basics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                id="agreementTitle"
                label="Agreement title"
                placeholder="Catering Services MoU — AEON 2025"
                required
                info={HELP.agreementTitle}
                error={errors.agreementTitle?.message}
                {...register("agreementTitle")}
              />
              <FormField
                id="effectiveDate"
                label="Effective date"
                type="date"
                required
                info={HELP.effectiveDate}
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
              info={HELP.engagementType}
              error={errors.engagementType?.message}
            />
          </CardContent>
        </Card>

        {/* ── Section 2: Parties ─────────────────────────────────── */}
        <Card className="glass-card">
          <CardHeader className="pb-1">
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
          <CardHeader className="pb-1">
            <CardTitle className="text-lg">Scope & Deliverables</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <FieldLabel
                htmlFor="scopeOfWork"
                label="Scope of work"
                required
                info={HELP.scopeOfWork}
              />
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
                <FieldLabel
                  htmlFor="deliverables"
                  label="Deliverables"
                  info={HELP.deliverables}
                />
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
                      aria-label={`Remove deliverable ${index + 1}`}
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
          <CardHeader className="pb-1">
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
                info={HELP.totalFee}
                error={errors.totalFeeAmount?.message}
                {...register("totalFeeAmount")}
              />
              <FormField
                id="totalFeeCurrency"
                label="Currency"
                placeholder="INR"
                maxLength={3}
                info={HELP.currency}
                error={errors.totalFeeCurrency?.message}
                {...register("totalFeeCurrency")}
              />
              <FormSelect
                id="paymentSchedule"
                label="Payment schedule"
                options={PAYMENT_SCHEDULES}
                labels={PAYMENT_SCHEDULE_LABELS}
                control={control}
                info={HELP.paymentSchedule}
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
                  info={HELP.paymentPreset}
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

            {paymentSchedule === "lump-sum" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormSelect
                  id="paymentTiming"
                  label="Payment timing"
                  options={PAYMENT_TIMING_OPTIONS}
                  labels={PAYMENT_TIMING_LABELS}
                  control={control}
                  info={HELP.paymentTiming}
                  error={errors.paymentTiming?.message}
                />
                {paymentTiming === "custom" && (
                  <FormField
                    id="paymentTimingCustom"
                    label="Custom timing description"
                    placeholder="e.g. 50% on signing, 50% on event date"
                    {...register("paymentTimingCustom")}
                  />
                )}
              </div>
            )}

            <Separator />

            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Taxes & late payment
              </h3>
              <FormToggle
                id="taxesIncluded"
                label="Total fee is INCLUSIVE of taxes"
                description="Off = taxes added on top of the fee (will be invoiced separately)"
                info={HELP.taxesIncluded}
                checked={taxesIncluded}
                onChange={(v) => setValue("taxesIncluded", v)}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  id="taxRatePct"
                  label="Applicable tax rate (%)"
                  type="number"
                  step="0.01"
                  placeholder="18 for GST"
                  info={HELP.taxRatePct}
                  {...register("taxRatePct")}
                />
                <FormField
                  id="lateFeePctPerMonth"
                  label="Late-payment interest (% per month)"
                  type="number"
                  step="0.01"
                  placeholder="1.5"
                  info={HELP.lateFeePctPerMonth}
                  {...register("lateFeePctPerMonth")}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Event Details (date/time/venue) ──────────────────────── */}
        {needsDates && (
          <Card className="glass-card">
            <CardHeader className="pb-1">
              <CardTitle className="text-lg">Event Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  id="eventStart"
                  label="Event start date"
                  type="date"
                  info={HELP.eventDates}
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
                <FormField
                  id="eventStartTime"
                  label="Event start time"
                  type="time"
                  {...register("eventStartTime")}
                />
                <FormField
                  id="eventEndTime"
                  label="Event end time"
                  type="time"
                  {...register("eventEndTime")}
                />
              </div>
              <FormField
                id="eventVenue"
                label="Venue / location"
                placeholder="Banquet Hall, Cyber Heights, HITEC City, Hyderabad"
                info={HELP.eventVenue}
                {...register("eventVenue")}
              />
            </CardContent>
          </Card>
        )}

        {/* ── Cancellation Policy ─────────────────────────────────── */}
        <Card className="glass-card">
          <CardHeader className="pb-1">
            <CardTitle className="text-lg">Cancellation Policy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormSelect
              id="cancellationPolicy"
              label="Policy"
              options={CANCELLATION_POLICY_OPTIONS}
              labels={CANCELLATION_LABELS}
              control={control}
              info={HELP.cancellationPolicy}
            />
            {(cancellationPolicy === "flat-fee" ||
              cancellationPolicy === "custom") && (
                <div className="space-y-1.5">
                  <Label htmlFor="cancellationTerms">
                    {cancellationPolicy === "flat-fee"
                      ? "Flat fee amount or formula"
                      : "Custom cancellation terms"}
                  </Label>
                  <Textarea
                    id="cancellationTerms"
                    rows={3}
                    placeholder={
                      cancellationPolicy === "flat-fee"
                        ? "e.g. 25,000 INR or 15% of Total Fee"
                        : "Describe the cancellation terms in plain English..."
                    }
                    {...register("cancellationTerms")}
                  />
                </div>
              )}
          </CardContent>
        </Card>

        {/* ── Catering-specific ───────────────────────────────────── */}
        {isCatering && (
          <Card className="glass-card">
            <CardHeader className="pb-1">
              <CardTitle className="text-lg">Catering Specifics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  id="guestCountFinalDate"
                  label="Guest count finalisation date"
                  type="date"
                  info={HELP.guestCountFinalDate}
                  {...register("guestCountFinalDate")}
                />
                <FormField
                  id="extraGuestRate"
                  label="Per-head rate for extra guests"
                  type="number"
                  step="0.01"
                  placeholder="800"
                  info={HELP.extraGuestRate}
                  {...register("extraGuestRate")}
                />
              </div>
              <FormToggle
                id="foodSafetyRequired"
                label="Food safety & licensing clause"
                description="Vendor warrants compliance with FSSAI / local equivalent"
                info={HELP.foodSafetyRequired}
                checked={watch("foodSafetyRequired")}
                onChange={(v) => setValue("foodSafetyRequired", v)}
              />
              <FormToggle
                id="allergyHandlingRequired"
                label="Allergen & dietary handling clause"
                description="Labelling, dedicated vegan/GF tracks, allergen disclosure"
                info={HELP.allergyHandlingRequired}
                checked={watch("allergyHandlingRequired")}
                onChange={(v) => setValue("allergyHandlingRequired", v)}
              />
            </CardContent>
          </Card>
        )}

        {/* ── Section 5: Jurisdiction ────────────────────────────── */}
        <Card className="glass-card">
          <CardHeader className="pb-1">
            <CardTitle className="text-lg">Jurisdiction</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                id="governingLaw"
                label="Governing law"
                placeholder="Karnataka, India"
                required
                info={HELP.governingLaw}
                error={errors.governingLaw?.message}
                {...register("governingLaw")}
              />
              <FormField
                id="disputeVenue"
                label="Dispute venue"
                placeholder="Bangalore"
                required
                info={HELP.disputeVenue}
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
              info={HELP.disputeResolution}
              error={errors.disputeResolution?.message}
            />
          </CardContent>
        </Card>

        {/* ── Section 6: Risk & Protection (collapsible) ─────────── */}
        <Card className="glass-card">
          <CardHeader
            className="pb-1 cursor-pointer select-none"
            role="button"
            tabIndex={0}
            aria-expanded={showAdvanced}
            aria-controls={advancedPanelId}
            onClick={() => setShowAdvanced((value) => !value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                setShowAdvanced((value) => !value);
              }
            }}
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
            <CardContent id={advancedPanelId} className="space-y-4">
              <FormToggle
                id="confidentialityRequired"
                label="Confidentiality clause"
                description="NDA with survival period after termination"
                info={HELP.confidentiality}
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
                    info={HELP.confidentialitySurvivalYears}
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
                info={HELP.ipOwnership}
              />
              <FormToggle
                id="ipPortfolioRights"
                label="Vendor portfolio rights"
                description="Vendor may use deliverables in their portfolio with your consent"
                info={HELP.ipPortfolioRights}
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
                info={HELP.terminationPreset}
              />

              <Separator />

              <FormToggle
                id="insuranceRequired"
                label="Require vendor insurance"
                description="General liability and professional indemnity minimums"
                info={HELP.insuranceRequired}
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
                    info={HELP.insuranceGenLiab}
                    {...register("insuranceGenLiab")}
                  />
                  <FormField
                    id="insuranceProfIndem"
                    label="Professional indemnity minimum"
                    type="number"
                    placeholder="500000"
                    info={HELP.insuranceProfIndem}
                    {...register("insuranceProfIndem")}
                  />
                </div>
              )}

              <Separator />

              <FormToggle
                id="dataProtectionRequired"
                label="Data protection (DPA-lite)"
                description="Lawful-basis, 72h breach notice, deletion on termination"
                info={HELP.dataProtectionRequired}
                checked={watch("dataProtectionRequired")}
                onChange={(v) => setValue("dataProtectionRequired", v)}
              />
              <FormToggle
                id="subcontractingAllowed"
                label="Allow subcontracting"
                description="If off, vendor needs prior written consent to subcontract"
                info={HELP.subcontractingAllowed}
                checked={watch("subcontractingAllowed")}
                onChange={(v) => setValue("subcontractingAllowed", v)}
              />
              <FormToggle
                id="noPublicityRequired"
                label="No-publicity clause"
                description="Vendor can't use your name in marketing without consent"
                info={HELP.noPublicityRequired}
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
                info={HELP.liabilityCapMultiplier}
                error={errors.liabilityCapMultiplier?.message}
              />
            </CardContent>
          )}
        </Card>

        {/* ── Section 7: Additional Context ──────────────────────── */}
        <Card className="glass-card">
          <CardHeader className="pb-1">
            <CardTitle className="text-lg flex items-center gap-1.5">
              Additional Notes
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    aria-label="Help: Additional Notes"
                    className="text-muted-foreground/70 hover:text-foreground transition-colors focus-visible:outline-none focus-visible:text-foreground"
                  >
                    <Info className="h-3 w-3" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs text-left leading-snug">
                  {HELP.additionalContext}
                </TooltipContent>
              </Tooltip>
            </CardTitle>
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
            className="min-w-50"
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
    </TooltipProvider>
  );
}
