"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DigestView } from "@/components/digest-view";
import {
  indexSingleArticle,
  synthesizeDigest,
  type DigestResult,
  type IndexResult,
} from "@/actions/orchestrate";
import {
  parseAndValidateUrls,
  type UrlIssue,
} from "@/lib/url-validation";
import { BookOpen, Loader2, Search, Sparkles } from "lucide-react";

const DEMO_URLS = `https://www.brookings.edu/articles/regulating-general-purpose-ai-areas-of-convergence-and-divergence-across-the-eu-and-the-us
https://www.eff.org/deeplinks/2026/06/ai-regulation-should-be-rational-not-retaliatory
https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai
https://artificialintelligenceact.eu/high-level-summary`;

export default function Home() {
  const [urlsText, setUrlsText] = useState(DEMO_URLS);
  const [query, setQuery] = useState(
    "How do major actors propose regulating AI in 2025?"
  );
  const [maxArticles, setMaxArticles] = useState("4");
  const [indexResult, setIndexResult] = useState<IndexResult | null>(null);
  const [digest, setDigest] = useState<DigestResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [indexing, setIndexing] = useState(false);
  const [indexProgress, setIndexProgress] = useState<string | null>(null);
  const [urlIssues, setUrlIssues] = useState<UrlIssue[]>([]);
  const [synthesizing, setSynthesizing] = useState(false);

  async function handleIndex() {
    setError(null);
    setDigest(null);
    setIndexResult(null);
    setIndexProgress(null);
    setUrlIssues([]);

    const { valid, issues } = parseAndValidateUrls(urlsText);

    if (issues.length > 0) {
      setUrlIssues(issues);
      setError(
        `Fix ${issues.length} invalid URL(s) before indexing. Each line must be https://www.… with a known TLD; trailing / are removed automatically.`
      );
      return;
    }

    if (!valid.length) {
      setError("Add at least one article URL (https://www.…).");
      return;
    }

    // Reflect normalized URLs (trailing / stripped) in the textarea
    setUrlsText(valid.join("\n"));

    setIndexing(true);
    let totalIndexed = 0;
    const errors: unknown[] = [];
    const failedUrls: string[] = [];

    try {
      for (let i = 0; i < valid.length; i++) {
        setIndexProgress(
          `Indexing article ${i + 1} of ${valid.length}… (may take 5-6 min each)`
        );
        try {
          const one = await indexSingleArticle(valid[i]);
          totalIndexed += one.indexed_count;
          if (one.errors?.length) errors.push(...one.errors);
        } catch (e) {
          failedUrls.push(valid[i]);
          errors.push({
            url: valid[i],
            message: e instanceof Error ? e.message : String(e),
          });
        }
      }

      if (failedUrls.length === valid.length) {
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

      setIndexResult({
        indexed_count: totalIndexed,
        collection: "configured",
        errors,
        failed_urls: failedUrls.length ? failedUrls : undefined,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Indexing failed");
    } finally {
      setIndexing(false);
      setIndexProgress(null);
    }
  }

  async function handleSynthesize() {
    setSynthesizing(true);
    setError(null);
    try {
      const result = await synthesizeDigest(
        query,
        Math.max(1, Math.min(10, Number(maxArticles) || 5))
      );
      setDigest(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Synthesis failed");
    } finally {
      setSynthesizing(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-gray-950 dark:to-gray-900">
      <header className="border-b bg-background/80 backdrop-blur">
        <div className="max-w-5xl mx-auto px-6 py-5 flex items-center gap-3">
          <BookOpen className="size-6 text-primary" />
          <div>
            <h1 className="text-xl font-semibold">Reading List Digest</h1>
            <p className="text-sm text-muted-foreground">
              Index articles, then synthesize a cited multi-source digest
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        <Tabs defaultValue="index" className="space-y-6">
          <TabsList>
            <TabsTrigger value="index">1. Index articles</TabsTrigger>
            <TabsTrigger value="digest">2. Synthesize digest</TabsTrigger>
          </TabsList>

          <TabsContent value="index">
            <Card className="p-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="urls">Article URLs (one per line)</Label>
                <Textarea
                  id="urls"
                  value={urlsText}
                  onChange={(e) => {
                    setUrlsText(e.target.value);
                    if (urlIssues.length) setUrlIssues([]);
                  }}
                  className="min-h-[160px] font-mono text-sm"
                  placeholder="https://www.example.com/article-1"
                  aria-invalid={urlIssues.length > 0}
                />
                <p className="text-xs text-muted-foreground">
                  Require https://www. and a known TLD. Trailing / are stripped. Prefer Studio for indexing if the app drops the connection. For localhost: set Index API Request Response Type to async, Deploy, then index one URL at a time.
                </p>
                {urlIssues.length > 0 && (
                  <ul className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive space-y-1 list-none">
                    {urlIssues.map((issue) => (
                      <li key={`${issue.line}-${issue.raw}`}>
                        Line {issue.line}
                        {issue.raw ? ` (“${issue.raw.slice(0, 48)}${issue.raw.length > 48 ? "…" : ""}”)` : ""}
                        : {issue.message}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              {indexProgress && (
                <p className="text-sm text-muted-foreground">{indexProgress}</p>
              )}
              <Button onClick={handleIndex} disabled={indexing} className="gap-2">
                {indexing ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Indexing…
                  </>
                ) : (
                  <>
                    <Search className="size-4" />
                    Index articles
                  </>
                )}
              </Button>
              {indexResult && (
                <div className="rounded-md border bg-muted/40 p-4 text-sm">
                  <p>
                    Indexed <strong>{indexResult.indexed_count}</strong> page(s)
                    into <strong>{indexResult.collection}</strong>.
                  </p>
                  {indexResult.failed_urls && indexResult.failed_urls.length > 0 && (
                    <p className="text-amber-600 mt-2">
                      {indexResult.failed_urls.length} URL(s) failed — others may have succeeded.
                    </p>
                  )}
                  {indexResult.errors?.length > 0 && !indexResult.failed_urls?.length && (
                    <p className="text-amber-600 mt-2">
                      {indexResult.errors.length} error(s) reported.
                    </p>
                  )}
                  <p className="text-muted-foreground mt-2">
                    Next: open the Synthesize tab and run your research query.
                  </p>
                </div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="digest">
            <Card className="p-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="query">Research query</Label>
                <Textarea
                  id="query"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="min-h-[100px]"
                />
              </div>
              <div className="space-y-2 max-w-xs">
                <Label htmlFor="max">Max articles</Label>
                <Input
                  id="max"
                  type="number"
                  min={1}
                  max={10}
                  value={maxArticles}
                  onChange={(e) => setMaxArticles(e.target.value)}
                />
              </div>
              <Button
                onClick={handleSynthesize}
                disabled={synthesizing}
                className="gap-2"
              >
                {synthesizing ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Synthesizing…
                  </>
                ) : (
                  <>
                    <Sparkles className="size-4" />
                    Synthesize digest
                  </>
                )}
              </Button>
            </Card>

            {digest && (
              <Card className="p-6 mt-6">
                <ScrollArea className="max-h-[70vh] pr-4">
                  <DigestView digest={digest} />
                </ScrollArea>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {error && (
          <Card className="p-4 mt-6 border-destructive/50 bg-destructive/5">
            <p className="text-sm text-destructive">{error}</p>
          </Card>
        )}
      </main>
    </div>
  );
}
