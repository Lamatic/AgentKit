"use client";

import { useState, useTransition } from "react";
import { Loader2, ScanLine } from "lucide-react";
import { scanMenu, uploadMenuPhoto, type ScanReport } from "@/actions/orchestrate";
import { DisclaimerBanner } from "@/components/disclaimer-banner";
import { DishCard } from "@/components/dish-card";
import { PartyPanel } from "@/components/party-panel";
import { TablePlanView } from "@/components/table-plan-view";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Budget, Diner, ServingModel } from "@/lib/types";

const LANGUAGES = [
  "English",
  "Spanish",
  "French",
  "German",
  "Portuguese",
  "Hindi",
  "Japanese",
  "Mandarin",
  "Arabic",
];

function initialDiners(): Diner[] {
  return [
    { id: "diner-1", label: "Me", avoidAllergens: [], diet: null, dislikes: [] },
  ];
}

export default function HomePage() {
  const [imageUrl, setImageUrl] = useState("");
  const [targetLanguage, setTargetLanguage] = useState("English");
  const [diners, setDiners] = useState<Diner[]>(initialDiners);
  const [budget, setBudget] = useState<Budget | null>(null);
  const [servingModel, setServingModel] = useState<ServingModel>("shared");

  const [report, setReport] = useState<ScanReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [pending, startTransition] = useTransition();

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);
    const result = await uploadMenuPhoto(formData);

    setUploading(false);
    if (result.ok) {
      setImageUrl(result.url);
    } else {
      // Uploads are optional infrastructure; the URL field always works, so a
      // failure here is a nudge rather than a dead end.
      setError(result.error);
    }
  }

  function handleScan() {
    setError(null);
    startTransition(async () => {
      const response = await scanMenu({
        imageUrl,
        targetLanguage,
        diners,
        budget,
        servingModel,
      });

      if (response.ok) {
        setReport(response.report);
      } else {
        setReport(null);
        setError(response.error);
      }
    });
  }

  const busy = pending || uploading;
  const canScan = imageUrl.trim() !== "" && diners.length > 0 && !busy;

  return (
    <main>
      <DisclaimerBanner />

      <div className="mx-auto max-w-4xl space-y-4 px-4 py-6">
        <header>
          <h1 className="text-2xl font-semibold tracking-tight">Orderly</h1>
          <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
            Photograph a menu in any language. Get one order for your table that
            respects every allergy, every diet, and your budget.
          </p>
        </header>

        {/* ── The menu photo ── */}
        <section className="rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-4">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)]">
            The menu
          </h2>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="photo" className="mb-1.5 block text-xs">
                Take or choose a photo
              </Label>
              <input
                id="photo"
                type="file"
                accept="image/*"
                // Opens the rear camera on a phone, which is where this app is used.
                capture="environment"
                disabled={busy}
                onChange={(event) => handleFile(event.target.files?.[0])}
                className="w-full text-sm file:mr-3 file:rounded-md file:border file:border-[var(--color-border)] file:bg-[var(--color-muted)] file:px-3 file:py-1.5 file:text-sm"
              />
            </div>

            <div>
              <Label htmlFor="image-url" className="mb-1.5 block text-xs">
                …or paste an image URL
              </Label>
              <Input
                id="image-url"
                type="url"
                inputMode="url"
                placeholder="https://example.com/menu.jpg"
                value={imageUrl}
                disabled={busy}
                onChange={(event) => setImageUrl(event.target.value)}
                className="h-9"
              />
            </div>
          </div>

          <div className="mt-3">
            <Label htmlFor="language" className="mb-1.5 block text-xs">
              Explain it in
            </Label>
            <select
              id="language"
              value={targetLanguage}
              disabled={busy}
              onChange={(event) => setTargetLanguage(event.target.value)}
              className="h-9 rounded-md border border-[var(--color-input)] bg-transparent px-2 text-sm"
            >
              {LANGUAGES.map((language) => (
                <option key={language} value={language}>
                  {language}
                </option>
              ))}
            </select>
          </div>

          {imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt="The menu to be read"
              className="mt-3 max-h-56 rounded-md border border-[var(--color-border)] object-contain"
            />
          )}
        </section>

        <PartyPanel
          diners={diners}
          onDinersChange={setDiners}
          budget={budget}
          onBudgetChange={setBudget}
          servingModel={servingModel}
          onServingModelChange={setServingModel}
          disabled={busy}
        />

        <Button onClick={handleScan} disabled={!canScan} className="w-full" size="lg">
          {busy ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
              {uploading ? "Uploading photo…" : "Reading the menu…"}
            </>
          ) : (
            <>
              <ScanLine className="mr-2 h-4 w-4" aria-hidden="true" />
              Plan our order
            </>
          )}
        </Button>

        {error && (
          <p
            role="alert"
            className="rounded-md border border-[var(--color-avoid-border)] bg-[var(--color-avoid-bg)] px-3 py-2 text-sm text-[var(--color-avoid)]"
          >
            {error}
          </p>
        )}

        {report && (
          <>
            <TablePlanView plan={report.plan} diners={diners} />

            <section>
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)]">
                The whole menu
                {report.meta.detectedLanguage !== "unknown" && (
                  <span className="ml-2 font-normal normal-case">
                    · read as {report.meta.detectedLanguage}
                  </span>
                )}
              </h2>

              {report.meta.notes && (
                <p className="mb-2 text-xs text-[var(--color-muted-foreground)]">
                  {report.meta.notes}
                </p>
              )}

              {report.dishes.length === 0 ? (
                <p className="rounded-lg border border-[var(--color-border)] p-4 text-sm text-[var(--color-muted-foreground)]">
                  No dishes could be read from that image. Try a straighter,
                  better-lit photo with the whole menu in frame.
                </p>
              ) : (
                <div className="space-y-2">
                  {report.dishes.map((dish) => (
                    <DishCard key={dish.id} dish={dish} diners={diners} />
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}
