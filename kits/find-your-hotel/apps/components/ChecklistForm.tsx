"use client";

import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const TRIP_TYPES = [
  { value: "city-break", label: "City break" },
  { value: "beach", label: "Beach" },
  { value: "hiking", label: "Hiking" },
  { value: "business", label: "Business" },
  { value: "winter-sports", label: "Winter sports" },
] as const;

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

const FormSchema = z
  .object({
    destination: z.string().trim().min(1, "Destination is required."),
    startDate: z.string().min(1, "Depart date is required."),
    endDate: z.string().min(1, "Return date is required."),
    tripType: z.string().min(1, "Trip type is required."),
    travelers: z
      .array(
        z.object({
          name: z.string().trim().min(1, "Name cannot be empty."),
          tag: z.enum(["adult", "child"]),
        })
      )
      .min(1, "At least one traveler is required."),
  })
  .superRefine((data, ctx) => {
    const today = todayStr();
    if (data.startDate && data.startDate < today) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Depart date must be today or in the future.",
        path: ["startDate"],
      });
    }
    if (data.endDate && data.endDate < today) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Return date must be today or in the future.",
        path: ["endDate"],
      });
    }
    if (data.startDate && data.endDate && data.startDate === data.endDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Depart and return cannot be the same date.",
        path: ["endDate"],
      });
    }
    if (data.startDate && data.endDate && data.endDate < data.startDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Return must be after depart.",
        path: ["endDate"],
      });
    }
  });

export type FormValues = z.infer<typeof FormSchema>;

export default function ChecklistForm({
  onSubmit,
  loading,
  defaultValues,
}: {
  onSubmit: (values: FormValues) => void;
  loading: boolean;
  defaultValues?: Partial<Pick<FormValues, "destination" | "startDate" | "endDate">>;
}) {
  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      destination: defaultValues?.destination ?? "",
      startDate: defaultValues?.startDate ?? "",
      endDate: defaultValues?.endDate ?? "",
      tripType: "city-break",
      travelers: [{ name: "You", tag: "adult" }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "travelers",
  });

  const watchedStartDate = useWatch({ control, name: "startDate" });

  function onValid(values: FormValues) {
    onSubmit(values);
  }

  return (
    <form
      onSubmit={handleSubmit(onValid)}
      className="perforated bg-white/60 border border-ink/10 rounded-xl p-6 md:p-8 shadow-sm"
    >
      <div className="flex items-center justify-between mb-6">
        <span className="font-mono text-xs uppercase tracking-[0.2em] text-pine/70">
          Boarding Details
        </span>
        <div className="barcode w-24 text-ink" />
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        <Label className="block">
          <span className="mb-1 block">Destination</span>
          <Input
            {...register("destination")}
            placeholder="Lisbon, Portugal"
          />
          {errors.destination && (
            <p className="mt-1 font-mono text-xs text-stamp">{errors.destination.message}</p>
          )}
        </Label>

        <Label className="block">
          <span className="mb-1 block">Trip type</span>
          <Select
            defaultValue="city-break"
            onValueChange={(val) => setValue("tripType", val, { shouldValidate: true })}
          >
            <SelectTrigger aria-label="Select trip type">
              <SelectValue placeholder="Select trip type" />
            </SelectTrigger>
            <SelectContent>
              {TRIP_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.tripType && (
            <p className="mt-1 font-mono text-xs text-stamp">{errors.tripType.message}</p>
          )}
        </Label>

        <Label className="block">
          <span className="mb-1 block">Depart</span>
          <Input
            {...register("startDate")}
            type="date"
            min={todayStr()}
          />
          {errors.startDate && (
            <p className="mt-1 font-mono text-xs text-stamp">{errors.startDate.message}</p>
          )}
        </Label>

        <Label className="block">
          <span className="mb-1 block">Return</span>
          <Input
            {...register("endDate")}
            type="date"
            min={watchedStartDate || todayStr()}
          />
          {errors.endDate && (
            <p className="mt-1 font-mono text-xs text-stamp">{errors.endDate.message}</p>
          )}
        </Label>
      </div>

      <div className="mt-7">
        <span className="font-mono text-xs uppercase tracking-wide text-ink/60">Travelers</span>
        <div className="mt-2 space-y-2">
          {fields.map((field, idx) => (
            <div key={field.id} className="flex items-center gap-2">
              <Input
                {...register(`travelers.${idx}.name`)}
                aria-label={`Traveler ${idx + 1} name`}
                className="flex-1"
              />
              <Select
                defaultValue={field.tag}
                onValueChange={(val) =>
                  setValue(`travelers.${idx}.tag`, val as "adult" | "child", {
                    shouldValidate: true,
                  })
                }
              >
                <SelectTrigger
                  aria-label={`Traveler ${idx + 1} tag`}
                  className="w-28"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="adult">Adult</SelectItem>
                  <SelectItem value="child">Child</SelectItem>
                </SelectContent>
              </Select>
              {fields.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => remove(idx)}
                  aria-label={`Remove ${field.name}`}
                  className="shrink-0 text-stamp/70 hover:text-stamp"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
          {errors.travelers && (
            <p className="font-mono text-xs text-stamp">
              {errors.travelers.message || errors.travelers.root?.message}
            </p>
          )}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => append({ name: `Traveler ${fields.length + 1}`, tag: "adult" })}
          className="mt-3 text-pine hover:text-pine/70"
        >
          <Plus className="h-4 w-4 mr-1" />
          Add traveler
        </Button>
      </div>

      <Button
        type="submit"
        disabled={loading}
        className="mt-8 w-full"
      >
        {loading ? "Generating…" : "Generate packing list"}
      </Button>
    </form>
  );
}
