"use client";

import {
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Loader2,
} from "lucide-react";
import { useMemo, useState } from "react";

import {
  OUTCOME_OPTIONS,
  type CollectionOutcome,
  type RecordedOutcome,
} from "@/app/lib/outcomes";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface OutcomeCardProps {
  onOutcomeRecorded: (outcome: RecordedOutcome) => void;
}

export function OutcomeCard({ onOutcomeRecorded }: OutcomeCardProps) {
  const [selectedOutcome, setSelectedOutcome] = useState<
    CollectionOutcome | ""
  >("");
  const [note, setNote] = useState("");
  const [promiseDate, setPromiseDate] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const selectedOption = useMemo(
    () => OUTCOME_OPTIONS.find((option) => option.value === selectedOutcome),
    [selectedOutcome],
  );

  const requiresPromiseDate = selectedOutcome === "PROMISE_TO_PAY";
  const [today] = useState(() => {
    const now = new Date();
    const localDate = new Date(
      now.getTime() - now.getTimezoneOffset() * 60_000,
    );

    return localDate.toISOString().slice(0, 10);
  });

  const hasInvalidPromiseDate =
    requiresPromiseDate && (!promiseDate || promiseDate < today);

  const handleSave = async () => {
    if (!selectedOutcome || !selectedOption) {
      return;
    }

    if (hasInvalidPromiseDate) {
      return;
    }

    setIsSaving(true);
    setSaved(false);

    const recordedOutcome: RecordedOutcome = {
      id: crypto.randomUUID(),
      outcome: selectedOutcome,
      label: selectedOption.label,
      note: note.trim(),
      promiseDate: requiresPromiseDate ? promiseDate : undefined,
      createdAt: new Date().toISOString(),
    };

    await new Promise((resolve) => {
      setTimeout(resolve, 450);
    });

    onOutcomeRecorded(recordedOutcome);

    setIsSaving(false);
    setSaved(true);
    setSelectedOutcome("");
    setNote("");
    setPromiseDate("");

    setTimeout(() => {
      setSaved(false);
    }, 2000);
  };

  const isSaveDisabled = !selectedOutcome || isSaving || hasInvalidPromiseDate;

  return (
    <Card className="rounded-2xl border bg-background/80 p-6 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
          <ClipboardCheck className="size-5 text-primary" />
        </div>

        <div>
          <h3 className="text-xl font-semibold tracking-tight">
            Record collection outcome
          </h3>

          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Capture what happened after the accounts team followed the
            recommended strategy.
          </p>
        </div>
      </div>

      <div className="mt-6 space-y-5">
        <div className="space-y-2">
          <label htmlFor="collection-outcome" className="text-sm font-medium">
            Outcome
          </label>

          <Select
            value={selectedOutcome}
            onValueChange={(value) =>
              setSelectedOutcome(value as CollectionOutcome)
            }
          >
            <SelectTrigger id="collection-outcome" className="h-11">
              <SelectValue placeholder="Select collection outcome" />
            </SelectTrigger>

            <SelectContent>
              {OUTCOME_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedOption && (
            <p className="text-xs leading-5 text-muted-foreground">
              {selectedOption.description}
            </p>
          )}
        </div>

        {requiresPromiseDate && (
          <div className="space-y-2">
            <label htmlFor="promise-date" className="text-sm font-medium">
              Promise date
            </label>

            <div className="relative">
              <CalendarDays className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

              <input
                id="promise-date"
                type="date"
                min={today}
                value={promiseDate}
                onChange={(event) => setPromiseDate(event.target.value)}
                className="flex h-11 w-full rounded-md border border-input bg-background pl-10 pr-3 text-sm shadow-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              />
            </div>
          </div>
        )}

        <div className="space-y-2">
          <label htmlFor="outcome-note" className="text-sm font-medium">
            Notes
            <span className="ml-1 font-normal text-muted-foreground">
              optional
            </span>
          </label>

          <Textarea
            id="outcome-note"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Add any useful context about the interaction..."
            className="min-h-[110px] resize-none"
            disabled={isSaving}
          />
        </div>

        <Button
          type="button"
          onClick={handleSave}
          disabled={isSaveDisabled}
          className="h-11 w-full gap-2"
        >
          {isSaving ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Saving outcome
            </>
          ) : saved ? (
            <>
              <CheckCircle2 className="size-4" />
              Outcome recorded
            </>
          ) : (
            <>
              <ClipboardCheck className="size-4" />
              Save outcome
            </>
          )}
        </Button>
      </div>
    </Card>
  );
}
