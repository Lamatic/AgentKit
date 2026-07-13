"use client"

import { useMemo, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { AlertCircle, Loader2, Play, Shield, ShieldAlert, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SecurityScorecard } from "@/components/security-scorecard"
import { AttackResultsTable } from "@/components/attack-results-table"
import { runRedTeamScan } from "@/actions/orchestrate"
import { ALL_CATEGORIES, ATTACK_LIBRARY, CATEGORY_LABELS, SAMPLE_HARDENED_SYSTEM_PROMPT, SAMPLE_WEAK_SYSTEM_PROMPT } from "@/lib/attacks"
import { cn } from "@/lib/utils"
import type { AttackCategory, SecurityAggregate } from "@/lib/types"

const categoryEnum = z.enum(ALL_CATEGORIES as [AttackCategory, ...AttackCategory[]])

const formSchema = z.object({
  systemPrompt: z.string().trim().min(1, "Enter a system prompt to test."),
  categories: z.array(categoryEnum).min(1, "Select at least one attack category."),
  threshold: z.number().min(0).max(100),
})

type FormValues = z.infer<typeof formSchema>

export default function AgentRedTeamPage() {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    mode: "onChange",
    defaultValues: { systemPrompt: "", categories: ALL_CATEGORIES, threshold: 90 },
  })

  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<SecurityAggregate | null>(null)
  const [runError, setRunError] = useState("")

  const selectedCategories = watch("categories") ?? []
  const selectedAttacks = useMemo(
    () => ATTACK_LIBRARY.filter((a) => selectedCategories.includes(a.category)),
    [selectedCategories],
  )

  const toggleCategory = (category: AttackCategory) => {
    const current = new Set(selectedCategories)
    if (current.has(category)) current.delete(category)
    else current.add(category)
    setValue("categories", Array.from(current), { shouldValidate: true })
  }

  const loadExample = (variant: "weak" | "hardened") => {
    setValue("systemPrompt", variant === "weak" ? SAMPLE_WEAK_SYSTEM_PROMPT : SAMPLE_HARDENED_SYSTEM_PROMPT, { shouldValidate: true })
    setRunError("")
  }

  const onSubmit = async (values: FormValues) => {
    setRunError("")
    setIsLoading(true)
    setResult(null)
    try {
      const attacks = ATTACK_LIBRARY.filter((a) => values.categories.includes(a.category))
      const res = await runRedTeamScan(values.systemPrompt, attacks, values.threshold)
      if (res.success && res.data) {
        setResult(res.data)
      } else {
        setRunError(res.error || "Red-team scan failed.")
      }
    } catch (e) {
      setRunError(e instanceof Error ? e.message : "Red-team scan failed.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute inset-x-0 -top-40 h-80 bg-[radial-gradient(60%_100%_at_50%_0%,rgba(244,63,94,0.15),transparent)]" />

      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-white/5 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-6 py-3.5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-orange-500 shadow-lg shadow-rose-500/25">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-[15px] font-semibold leading-tight">Agent Red-Team Harness</h1>
              <p className="text-xs text-muted-foreground">Jailbreak & guardrail resistance testing for agent prompts</p>
            </div>
          </div>
          <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-muted-foreground">powered by Lamatic</span>
        </div>
      </header>

      <main className="relative mx-auto grid max-w-6xl gap-6 px-6 py-8 lg:grid-cols-[400px_1fr]">
        {/* Configuration */}
        <section className="lg:sticky lg:top-24 lg:self-start">
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 shadow-2xl shadow-black/20"
          >
            <h2 className="text-sm font-semibold">Configuration</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">Paste the prompt you're about to ship, pick your attack battery, run the scan.</p>

            <div className="mt-5 space-y-5">
              {/* System prompt */}
              <div className="space-y-2">
                <Label htmlFor="system-prompt" className="text-xs uppercase tracking-wide text-muted-foreground">
                  System prompt under test
                </Label>
                <Textarea
                  id="system-prompt"
                  placeholder="You are a support agent for…"
                  className="min-h-[140px] max-h-[260px] resize-y overflow-y-auto [field-sizing:fixed] bg-black/20"
                  disabled={isLoading}
                  aria-invalid={!!errors.systemPrompt}
                  {...register("systemPrompt")}
                />
                {errors.systemPrompt && (
                  <p className="flex items-start gap-1.5 text-xs text-rose-400">
                    <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    {errors.systemPrompt.message}
                  </p>
                )}
                <div className="flex gap-2">
                  <Button type="button" variant="ghost" size="sm" onClick={() => loadExample("weak")} disabled={isLoading} className="gap-1.5 text-muted-foreground hover:text-foreground">
                    <Sparkles className="h-3.5 w-3.5" />
                    Load weak example
                  </Button>
                  <Button type="button" variant="ghost" size="sm" onClick={() => loadExample("hardened")} disabled={isLoading} className="gap-1.5 text-muted-foreground hover:text-foreground">
                    <Sparkles className="h-3.5 w-3.5" />
                    Load hardened example
                  </Button>
                </div>
              </div>

              {/* Attack categories */}
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                  Attack categories ({selectedAttacks.length} of {ATTACK_LIBRARY.length} attacks selected)
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  {ALL_CATEGORIES.map((category) => {
                    const active = selectedCategories.includes(category)
                    return (
                      <button
                        key={category}
                        type="button"
                        onClick={() => toggleCategory(category)}
                        disabled={isLoading}
                        aria-pressed={active}
                        className={cn(
                          "rounded-lg border px-3 py-2 text-left text-xs font-medium transition-colors",
                          active ? "border-rose-500/30 bg-rose-500/10 text-foreground" : "border-white/10 bg-white/[0.02] text-muted-foreground",
                        )}
                      >
                        {CATEGORY_LABELS[category]}
                      </button>
                    )
                  })}
                </div>
                {errors.categories && (
                  <p className="flex items-start gap-1.5 text-xs text-rose-400">
                    <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    {errors.categories.message}
                  </p>
                )}
              </div>

              {/* Threshold */}
              <div className="space-y-2">
                <Label htmlFor="threshold" className="text-xs uppercase tracking-wide text-muted-foreground">
                  Gate threshold — % of attacks that must be resisted
                </Label>
                <div className="relative w-24">
                  <Input
                    id="threshold"
                    type="number"
                    min={0}
                    max={100}
                    className="bg-black/20 pr-7"
                    disabled={isLoading}
                    {...register("threshold", { valueAsNumber: true })}
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
                </div>
              </div>

              {runError && (
                <p className="flex items-start gap-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-400">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  {runError}
                </p>
              )}

              <Button
                type="submit"
                disabled={isLoading || !isValid}
                className="w-full gap-2 bg-gradient-to-r from-rose-500 to-orange-500 text-white shadow-lg shadow-rose-500/20 hover:from-rose-400 hover:to-orange-400"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Scanning…
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" />
                    Run red-team scan
                  </>
                )}
              </Button>
            </div>
          </form>
        </section>

        {/* Results */}
        <section className="space-y-4">
          {result ? (
            <>
              <SecurityScorecard
                gatePassed={result.gatePassed}
                passRate={result.passRate}
                threshold={result.threshold}
                passed={result.passed}
                total={result.total}
                byCategory={result.byCategory}
              />
              <AttackResultsTable results={result.results} />
            </>
          ) : (
            <div className="flex min-h-[460px] items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.01]">
              <div className="max-w-sm px-6 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03]">
                  {isLoading ? (
                    <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
                  ) : (
                    <ShieldAlert className="h-7 w-7 text-muted-foreground" />
                  )}
                </div>
                <p className="font-medium">{isLoading ? "Scanning…" : "No scan yet"}</p>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  {isLoading ? (
                    "Running the attack battery against your prompt — this can take a minute since attacks run one at a time."
                  ) : (
                    <>
                      Paste a system prompt and run the scan — or click <span className="font-medium text-foreground">Load weak example</span> to see a
                      prompt get compromised.
                    </>
                  )}
                </p>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
