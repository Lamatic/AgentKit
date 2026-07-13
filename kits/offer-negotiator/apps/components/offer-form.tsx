"use client";

import { useForm, type Control } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Sparkles } from "lucide-react";

import { emptyOffer, type OfferInput } from "@/lib/types";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

const offerSchema = z.object({
  role: z.string().trim().min(1, "Add the role you were offered."),
  company: z.string(),
  location: z.string(),
  seniority: z.string(),
  current_base: z.string(),
  current_bonus: z.string(),
  current_equity: z.string(),
  offered_base: z.string().trim().min(1, "Add the base salary on the table."),
  offered_bonus: z.string(),
  offered_equity: z.string(),
  competing_offers: z.string(),
  priorities: z.string().trim().min(1, "Tell us what matters most to you."),
  constraints: z.string(),
});

type FieldKey = keyof OfferInput;

function OfferField({
  control,
  name,
  label,
  placeholder,
  numeric,
  required,
  textarea,
  rows,
}: {
  control: Control<OfferInput>;
  name: FieldKey;
  label: string;
  placeholder?: string;
  numeric?: boolean;
  required?: boolean;
  textarea?: boolean;
  rows?: number;
}) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>
            {label}
            {required ? (
              <span style={{ color: "var(--brass)" }}> *</span>
            ) : null}
          </FormLabel>
          <FormControl>
            {textarea ? (
              <Textarea
                {...field}
                placeholder={placeholder}
                rows={rows ?? 2}
                required={required}
                aria-required={required}
              />
            ) : (
              <Input
                {...field}
                placeholder={placeholder}
                className={numeric ? "field-num" : undefined}
                required={required}
                aria-required={required}
              />
            )}
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

export function OfferForm({
  onSubmit,
  loading,
}: {
  onSubmit: (offer: OfferInput) => void;
  loading: boolean;
}) {
  const form = useForm<OfferInput>({
    resolver: zodResolver(offerSchema),
    defaultValues: emptyOffer,
    mode: "onSubmit",
  });

  const { control } = form;

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((values) => onSubmit(values))}
        className="card p-6 sm:p-8"
        noValidate
      >
        <div className="space-y-8">
          <section className="space-y-4">
            <div className="section-label">The role</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <OfferField control={control} name="role" label="Role" placeholder="Senior Software Engineer" required />
              <OfferField control={control} name="company" label="Company" placeholder="Acme Corp" />
              <OfferField control={control} name="location" label="Location" placeholder="London, UK" />
              <OfferField control={control} name="seniority" label="Seniority" placeholder="Senior" />
            </div>
          </section>

          <section className="space-y-4">
            <div className="section-label">On the table</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
              <div className="space-y-4">
                <p className="eyebrow">Your current pay</p>
                <OfferField control={control} name="current_base" label="Base" placeholder="£85,000" numeric />
                <OfferField control={control} name="current_bonus" label="Bonus" placeholder="10%" numeric />
                <OfferField control={control} name="current_equity" label="Equity" placeholder="none" numeric />
              </div>
              <div className="space-y-4">
                <p className="eyebrow">The offer</p>
                <OfferField control={control} name="offered_base" label="Base" placeholder="£95,000" numeric required />
                <OfferField control={control} name="offered_bonus" label="Bonus" placeholder="10%" numeric />
                <OfferField control={control} name="offered_equity" label="Equity" placeholder="0.02% over 4 years" numeric />
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <div className="section-label">Your hand</div>
            <div className="space-y-4">
              <OfferField
                control={control}
                name="priorities"
                label="What matters most to you"
                placeholder="Higher base, remote flexibility"
                textarea
                required
              />
              <OfferField
                control={control}
                name="competing_offers"
                label="Competing offers or outside options"
                placeholder="One other final-stage interview, no offer yet"
                textarea
              />
              <OfferField
                control={control}
                name="constraints"
                label="Constraints or notes"
                placeholder="Need to decide within a week"
                textarea
              />
            </div>
          </section>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-1">
            <Button type="submit" variant="primary" disabled={loading}>
              {loading ? (
                <Loader2 size={18} className="animate-spin" aria-hidden="true" />
              ) : (
                <Sparkles size={18} aria-hidden="true" />
              )}
              {loading ? "Building your brief…" : "Build my negotiation brief"}
            </Button>
            <p className="text-sm" style={{ color: "var(--muted)" }}>
              <span style={{ color: "var(--brass)" }}>*</span> Role, offered base,
              and priorities are required.
            </p>
          </div>
        </div>
      </form>
    </Form>
  );
}
