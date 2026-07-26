"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DigestView } from "@/components/digest-view";
import { UrlChipList } from "@/components/url-chip-list";
import { HoverTip } from "@/components/hover-tip";
import {
  indexSingleArticle,
  synthesizeDigest,
  type DigestResult,
  type IndexResult,
} from "@/actions/orchestrate";
import { checkUrlReachability } from "@/actions/check-url";
import { normalizeArticleUrl, parseUrlCandidates } from "@/lib/url-validation";
import {
  SOURCE_TEMPLATES,
  newChipId,
  type SourceTemplate,
  type UrlChip,
} from "@/lib/source-templates";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  BookOpen,
  Info,
  Loader2,
  Search,
  Sparkles,
} from "lucide-react";

const SOURCE_BOX_TIP =
  "Paste https://www.… article URLs here, or pick one template below. Bubbles appear inside this box. Only one template can be active at a time — switching replaces the URLs. After you index, this box locks.";

const QUERY_BOX_TIP =
  "The motion / research question follows the active template, or you can type a custom one before indexing. After sources are indexed, this field locks so the brief matches what you indexed.";

const MAX_SOURCES_TIP =
  "Max sources is the number of URLs that passed a live check (final HTTP 200) and were indexed. It cannot be edited — change sources on Add sources and index again.";

function TemplateToggles({
  activeId,
  disabled,
  onSelect,
}: {
  activeId: string | null;
  disabled?: boolean;
  onSelect: (template: SourceTemplate) => void;
}) {
  return (
    <div className="space-y-2 border-t border-border/60 pt-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-medium text-muted-foreground">Templates</p>
        {activeId ? (
          <p className="text-[11px] text-muted-foreground">
            Active:{" "}
            <span className="font-medium text-foreground">
              {SOURCE_TEMPLATES.find((t) => t.id === activeId)?.label ??
                activeId}
            </span>
          </p>
        ) : (
          <p className="text-[11px] text-muted-foreground">Custom / none</p>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {SOURCE_TEMPLATES.map((t) => {
          const isActive = activeId === t.id;
          return (
            <Button
              key={t.id}
              type="button"
              size="sm"
              variant={isActive ? "secondary" : "outline"}
              className={`h-8 text-xs ${
                isActive
                  ? "pointer-events-none opacity-55 grayscale"
                  : ""
              }`}
              disabled={disabled || isActive}
              aria-pressed={isActive}
              onClick={() => onSelect(t)}
            >
              {t.label}
            </Button>
          );
        })}
      </div>
      <p className="text-[11px] text-muted-foreground">
        One template at a time. The active pack fills this box and the Build
        brief question. Click another pack to switch.
      </p>
    </div>
  );
}

function chipsFromTemplate(template: SourceTemplate): UrlChip[] {
  return template.urls.map((url) => ({
    id: newChipId(),
    url: normalizeArticleUrl(url),
    origin: "template" as const,
    status: "pending" as const,
  }));
}

export default function Home() {
  const [tab, setTab] = useState("index");
  const [chips, setChips] = useState<UrlChip[]>([]);
  const [draft, setDraft] = useState("");
  const [query, setQuery] = useState("");
  const [maxSources, setMaxSources] = useState(0);
  const [activeTemplateId, setActiveTemplateId] = useState<string | null>(
    null
  );
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [indexResult, setIndexResult] = useState<IndexResult | null>(null);
  const [sourcesLocked, setSourcesLocked] = useState(false);
  const [digest, setDigest] = useState<DigestResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [indexing, setIndexing] = useState(false);
  const [indexDone, setIndexDone] = useState(0);
  const [indexTotal, setIndexTotal] = useState(0);
  const [synthesizing, setSynthesizing] = useState(false);
  const checkingRef = useRef(new Set<string>());
  const draftInputRef = useRef<HTMLInputElement>(null);

  const allChipsOk =
    chips.length > 0 && chips.every((c) => c.status === "ok");
  const canBuildBrief = query.trim().length > 0 && maxSources >= 1;
  const urlsEditable = !indexing && !sourcesLocked;
  const queryEditable = !sourcesLocked && !synthesizing;
  const activeTemplate =
    SOURCE_TEMPLATES.find((t) => t.id === activeTemplateId) ?? null;

  const runReachability = useCallback(async (id: string, url: string) => {
    setChips((prev) =>
      prev.map((c) =>
        c.id === id
          ? {
              ...c,
              status: "checking",
              message: "Checking…",
              httpStatus: undefined,
            }
          : c
      )
    );
    try {
      const result = await checkUrlReachability(url);
      setChips((prev) =>
        prev.map((c) => {
          if (c.id !== id) return c;
          if (result.ok) {
            return {
              ...c,
              url: normalizeArticleUrl(result.finalUrl || url),
              status: "ok",
              httpStatus: result.status ?? 200,
              message: undefined,
            };
          }
          return {
            ...c,
            status: "error",
            httpStatus: result.status ?? undefined,
            message: result.message || "Unreachable",
          };
        })
      );
    } catch (e) {
      setChips((prev) =>
        prev.map((c) =>
          c.id === id
            ? {
                ...c,
                status: "error",
                message: e instanceof Error ? e.message : "Check failed",
              }
            : c
        )
      );
    } finally {
      checkingRef.current.delete(id);
    }
  }, []);

  useEffect(() => {
    const capacity = Math.max(0, 4 - checkingRef.current.size);
    if (capacity === 0) return;

    let started = 0;
    for (const chip of chips) {
      if (started >= capacity) break;
      if (chip.status === "pending" && !checkingRef.current.has(chip.id)) {
        checkingRef.current.add(chip.id);
        started += 1;
        void runReachability(chip.id, chip.url);
      }
    }
  }, [chips, runReachability]);

  function clearChecking() {
    checkingRef.current.clear();
  }

  function addCustomFromText(text: string) {
    if (!urlsEditable) return;
    const candidates = parseUrlCandidates(text);
    if (!candidates.length) return;

    setActiveTemplateId(null);
    setChips((prev) => {
      const existing = new Set(
        prev.map((c) => normalizeArticleUrl(c.url).toLowerCase())
      );
      const additions: UrlChip[] = [];

      for (const cand of candidates) {
        if (cand.ok === true) {
          const key = normalizeArticleUrl(cand.url).toLowerCase();
          if (existing.has(key)) continue;
          existing.add(key);
          additions.push({
            id: newChipId(),
            url: normalizeArticleUrl(cand.url),
            origin: "custom",
            status: "pending",
          });
        } else if (cand.ok === false) {
          additions.push({
            id: newChipId(),
            url: cand.raw,
            origin: "custom",
            status: "error",
            message: cand.error,
          });
        }
      }

      return additions.length ? [...prev, ...additions] : prev;
    });
  }

  function commitDraft() {
    if (!urlsEditable) return;
    const text = draft.trim();
    if (!text) return;
    addCustomFromText(text);
    setDraft("");
  }

  function applyTemplate(template: SourceTemplate) {
    if (!urlsEditable) return;
    if (activeTemplateId === template.id) return;

    clearChecking();
    setEditingId(null);
    setEditValue("");
    setDraft("");
    setActiveTemplateId(template.id);
    setQuery(template.query);
    setChips(chipsFromTemplate(template));
  }

  function removeChip(id: string) {
    if (!urlsEditable) return;
    checkingRef.current.delete(id);
    setChips((prev) => {
      const next = prev.filter((c) => c.id !== id);
      return next;
    });
    setActiveTemplateId(null);
    if (editingId === id) {
      setEditingId(null);
      setEditValue("");
    }
  }

  function startEdit(chip: UrlChip) {
    if (!urlsEditable) return;
    setEditingId(chip.id);
    setEditValue(chip.url);
  }

  function commitEdit() {
    if (!editingId || !urlsEditable) return;
    const id = editingId;
    const candidates = parseUrlCandidates(editValue);
    setEditingId(null);
    setEditValue("");
    setActiveTemplateId(null);

    if (!candidates.length) {
      setChips((prev) =>
        prev.map((c) =>
          c.id === id
            ? {
                ...c,
                status: "error",
                message: "Enter a valid https://www.… URL",
                httpStatus: undefined,
              }
            : c
        )
      );
      return;
    }

    setChips((prev) => {
      const existing = new Set(
        prev
          .filter((c) => c.id !== id)
          .map((c) => normalizeArticleUrl(c.url).toLowerCase())
      );
      const additions: UrlChip[] = [];
      let edited: UrlChip | null = null;
      const original = prev.find((c) => c.id === id);

      for (let i = 0; i < candidates.length; i++) {
        const cand = candidates[i];
        if (cand.ok === false) {
          if (i === 0) {
            edited = {
              id,
              url: cand.raw,
              origin: "custom",
              status: "error",
              message: cand.error,
            };
          } else {
            additions.push({
              id: newChipId(),
              url: cand.raw,
              origin: "custom",
              status: "error",
              message: cand.error,
            });
          }
          continue;
        }

        const normalized = normalizeArticleUrl(cand.url);
        const key = normalized.toLowerCase();
        if (existing.has(key)) {
          if (i === 0) {
            edited = {
              id,
              url: normalized,
              origin: "custom",
              status: "error",
              message: "Duplicate URL — already in the list",
              httpStatus: undefined,
            };
          }
          // Extra pasted duplicates are skipped rather than adding more error chips.
          continue;
        }
        existing.add(key);

        if (i === 0) {
          edited = {
            id,
            url: normalized,
            origin: "custom",
            status: "pending",
            message: undefined,
            httpStatus: undefined,
          };
        } else {
          additions.push({
            id: newChipId(),
            url: normalized,
            origin: "custom",
            status: "pending",
          });
        }
      }

      return prev.flatMap((c) => {
        if (c.id !== id) return [c];
        const replacement = edited ?? original ?? c;
        return additions.length ? [replacement, ...additions] : [replacement];
      });
    });
  }

  async function handleIndex() {
    if (!allChipsOk || sourcesLocked) return;

    const urls = chips
      .filter((c) => c.status === "ok")
      .map((c) => normalizeArticleUrl(c.url));
    setError(null);
    setDigest(null);
    setIndexResult(null);
    setIndexing(true);
    setIndexDone(0);
    setIndexTotal(urls.length);

    let totalIndexed = 0;
    const errors: unknown[] = [];
    const failedUrls: string[] = [];
    let successCount = 0;
    // Leave headroom under serverless maxDuration (300s) for the final return.
    const deadline = Date.now() + 270_000;

    try {
      for (let i = 0; i < urls.length; i++) {
        if (Date.now() >= deadline) {
          for (const remaining of urls.slice(i)) {
            failedUrls.push(remaining);
            errors.push({
              url: remaining,
              message:
                "Indexing stopped: approached the serverless time limit.",
            });
          }
          setIndexDone(urls.length);
          break;
        }

        try {
          const one = await indexSingleArticle(urls[i]);
          totalIndexed += one.indexed_count;
          if (one.errors?.length) errors.push(...one.errors);
          successCount += 1;
        } catch (e) {
          failedUrls.push(urls[i]);
          errors.push({
            url: urls[i],
            message: e instanceof Error ? e.message : String(e),
          });
        }
        setIndexDone(i + 1);
      }

      if (failedUrls.length === urls.length) {
        const first = errors[0];
        const msg =
          first &&
          typeof first === "object" &&
          first !== null &&
          "message" in first
            ? String((first as { message: unknown }).message)
            : "All URLs failed to index.";
        throw new Error(msg);
      }

      setMaxSources(successCount);
      setSourcesLocked(true);
      setIndexResult({
        indexed_count: totalIndexed,
        collection: "configured",
        errors,
        failed_urls: failedUrls.length ? failedUrls : undefined,
      });
      setTab("digest");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Indexing failed");
    } finally {
      setIndexing(false);
    }
  }

  function handleStartOver() {
    clearChecking();
    setSourcesLocked(false);
    setChips([]);
    setDraft("");
    setActiveTemplateId(null);
    setEditingId(null);
    setEditValue("");
    setQuery("");
    setDigest(null);
    setIndexResult(null);
    setMaxSources(0);
    setError(null);
    setIndexDone(0);
    setIndexTotal(0);
    setTab("index");
  }

  async function handleSynthesize() {
    if (!canBuildBrief) return;
    setSynthesizing(true);
    setError(null);
    try {
      const result = await synthesizeDigest(query, maxSources);
      setDigest(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Synthesis failed");
    } finally {
      setSynthesizing(false);
    }
  }

  const progressPct =
    indexTotal > 0 ? Math.round((indexDone / indexTotal) * 100) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-muted/40 to-background">
      <header className="border-b bg-background/80 backdrop-blur">
        <div className="max-w-5xl mx-auto px-6 py-5 flex items-center gap-3">
          <BookOpen className="size-6 text-primary" />
          <div>
            <h1 className="text-xl font-semibold tracking-tight">
              Point Proven
            </h1>
            <p className="text-sm text-muted-foreground">
              Index your sources, get a cited brief for debate prep
            </p>
          </div>
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        <Tabs value={tab} onValueChange={setTab} className="space-y-6">
          <TabsList>
            <TabsTrigger value="index">1. Add sources</TabsTrigger>
            <TabsTrigger value="digest">2. Build brief</TabsTrigger>
          </TabsList>

          <TabsContent value="index">
            <Card className="p-6 space-y-5">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Label htmlFor="url-draft">Source URLs</Label>
                  <HoverTip tip={SOURCE_BOX_TIP}>
                    <span className="inline-flex cursor-help rounded-full p-0.5 text-muted-foreground transition-colors hover:text-foreground">
                      <Info className="size-3.5" aria-hidden />
                      <span className="sr-only">Source URLs help</span>
                    </span>
                  </HoverTip>
                  {sourcesLocked ? (
                    <span className="rounded-full border bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                      Locked after index
                    </span>
                  ) : null}
                </div>

                <div
                  className={`w-full rounded-lg border bg-background transition-colors ${
                    urlsEditable
                      ? "hover:border-primary/40 focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-ring/30"
                      : "cursor-not-allowed opacity-80"
                  }`}
                >
                  <div className="space-y-3 p-3">
                    <HoverTip tip={SOURCE_BOX_TIP} className="block w-full">
                      <div
                        className="min-h-[4.5rem] space-y-2 rounded-md"
                        onClick={() => {
                          if (urlsEditable) draftInputRef.current?.focus();
                        }}
                      >
                        {chips.length > 0 ? (
                          <UrlChipList
                            chips={chips}
                            editingId={editingId}
                            editValue={editValue}
                            locked={!urlsEditable}
                            onStartEdit={startEdit}
                            onEditChange={setEditValue}
                            onCommitEdit={commitEdit}
                            onCancelEdit={() => {
                              setEditingId(null);
                              setEditValue("");
                            }}
                            onRemove={removeChip}
                          />
                        ) : null}

                        {urlsEditable ? (
                          <input
                            ref={draftInputRef}
                            id="url-draft"
                            value={draft}
                            onChange={(e) => setDraft(e.target.value)}
                            onBlur={commitDraft}
                            onPaste={(e) => {
                              const text = e.clipboardData.getData("text");
                              if (text && /[\s,]/.test(text.trim())) {
                                e.preventDefault();
                                addCustomFromText(text);
                                setDraft("");
                              }
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                commitDraft();
                              }
                            }}
                            className="w-full bg-transparent font-mono text-sm outline-none placeholder:text-muted-foreground"
                            placeholder={
                              chips.length
                                ? "Add another URL…"
                                : "Paste article URLs, or pick a template below…"
                            }
                          />
                        ) : chips.length === 0 ? (
                          <p className="text-sm text-muted-foreground">
                            No sources indexed.
                          </p>
                        ) : null}
                      </div>
                    </HoverTip>

                    <TemplateToggles
                      activeId={activeTemplateId}
                      disabled={!urlsEditable}
                      onSelect={applyTemplate}
                    />
                  </div>
                </div>

                <p className="text-xs text-muted-foreground">
                  Press Enter to commit a URL. Index stays locked until every
                  bubble is green (HTTP 200). Hover the box for details.
                </p>
              </div>

              {indexing && (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>
                      Indexing {indexDone} of {indexTotal}…
                    </span>
                    <span>{progressPct}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      role="progressbar"
                      aria-valuenow={progressPct}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      className="h-full rounded-full bg-primary transition-[width] duration-300"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={handleIndex}
                  disabled={indexing || sourcesLocked || !allChipsOk}
                  className="gap-2"
                >
                  {indexing ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Indexing…
                    </>
                  ) : sourcesLocked ? (
                    <>
                      <Search className="size-4" />
                      Sources indexed
                    </>
                  ) : (
                    <>
                      <Search className="size-4" />
                      Index sources
                    </>
                  )}
                </Button>
                {sourcesLocked ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleStartOver}
                    disabled={indexing || synthesizing}
                  >
                    Start over
                  </Button>
                ) : null}
              </div>

              {indexResult && !indexing && (
                <div className="rounded-md border bg-muted/40 p-4 text-sm">
                  <p>
                    Indexed <strong>{indexResult.indexed_count}</strong> page(s)
                    into <strong>{indexResult.collection}</strong>.
                  </p>
                  {indexResult.failed_urls &&
                    indexResult.failed_urls.length > 0 && (
                      <p className="text-amber-600 mt-2">
                        {indexResult.failed_urls.length} URL(s) failed — others
                        may have succeeded.
                      </p>
                    )}
                  <p className="text-muted-foreground mt-2">
                    Source URLs and the research question are locked. Continue
                    on Build brief.
                  </p>
                </div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="digest">
            <Card className="p-6 space-y-4">
              {activeTemplate || sourcesLocked ? (
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span>Template:</span>
                  <span className="rounded-full border bg-muted/60 px-2.5 py-0.5 font-medium text-foreground">
                    {activeTemplate?.label ?? "Custom sources"}
                  </span>
                  {sourcesLocked ? (
                    <span className="rounded-full border px-2 py-0.5 text-[10px]">
                      Locked after index
                    </span>
                  ) : null}
                  {sourcesLocked ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs"
                      onClick={handleStartOver}
                      disabled={indexing || synthesizing}
                    >
                      Start over
                    </Button>
                  ) : null}
                </div>
              ) : null}

              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Label htmlFor="query">Motion / research question</Label>
                  <HoverTip tip={QUERY_BOX_TIP}>
                    <span className="inline-flex cursor-help rounded-full p-0.5 text-muted-foreground transition-colors hover:text-foreground">
                      <Info className="size-3.5" aria-hidden />
                      <span className="sr-only">Research question help</span>
                    </span>
                  </HoverTip>
                </div>

                <HoverTip tip={QUERY_BOX_TIP} className="block w-full">
                  <textarea
                    id="query"
                    value={query}
                    readOnly={!queryEditable}
                    onChange={(e) => {
                      if (!queryEditable) return;
                      setQuery(e.target.value);
                      if (
                        activeTemplate &&
                        e.target.value !== activeTemplate.query
                      ) {
                        setActiveTemplateId(null);
                      }
                    }}
                    className={`min-h-[100px] w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground ${
                      queryEditable
                        ? "hover:border-primary/40 focus:border-primary/50 focus:ring-2 focus:ring-ring/30"
                        : "cursor-not-allowed opacity-80"
                    }`}
                    placeholder="e.g. Does export-control retaliation against AI labs violate free speech protections?"
                  />
                </HoverTip>

                {!sourcesLocked && activeTemplate ? (
                  <p className="text-xs text-muted-foreground">
                    Following active template — edit before indexing if you need
                    a custom question.
                  </p>
                ) : null}
                {sourcesLocked ? (
                  <p className="text-xs text-muted-foreground">
                    Locked after indexing so the brief matches the indexed
                    sources.
                  </p>
                ) : null}
              </div>

              <div className="max-w-sm space-y-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">Max sources</p>
                  <HoverTip tip={MAX_SOURCES_TIP} side="top">
                    <span className="inline-flex cursor-help rounded-full p-0.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                      <Info className="size-3.5" aria-hidden />
                      <span className="sr-only">Max sources info</span>
                    </span>
                  </HoverTip>
                </div>
                <p className="text-2xl font-semibold tabular-nums tracking-tight">
                  {maxSources}
                </p>
              </div>

              <Button
                onClick={handleSynthesize}
                disabled={synthesizing || !canBuildBrief}
                className="gap-2"
              >
                {synthesizing ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Building brief…
                  </>
                ) : (
                  <>
                    <Sparkles className="size-4" />
                    Build brief
                  </>
                )}
              </Button>
              {!canBuildBrief ? (
                <p className="text-xs text-muted-foreground">
                  {maxSources < 1
                    ? "Index at least one successful source first."
                    : "Enter a motion / research question to enable Build brief."}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  On success, the cited brief renders below.
                </p>
              )}
            </Card>

            {digest ? (
              <Card className="p-6 mt-6">
                <ScrollArea className="max-h-[70vh] pr-4">
                  <DigestView digest={digest} />
                </ScrollArea>
              </Card>
            ) : (
              !synthesizing &&
              !error && (
                <Card className="p-6 mt-6 border-dashed">
                  <p className="text-sm text-muted-foreground">
                    Your cited brief appears here after a successful Build brief
                    run.
                  </p>
                </Card>
              )
            )}
          </TabsContent>
        </Tabs>

        {error && (
          <Card
            role="alert"
            className="p-4 mt-6 border-destructive/50 bg-destructive/5"
          >
            <p className="text-sm text-destructive">{error}</p>
          </Card>
        )}
      </main>
    </div>
  );
}
