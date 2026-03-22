"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

const SAMPLE_TRANSCRIPT =
  "Team discussed Q4 product launch. Rahul handles frontend. Priya backend. Budget concerns raised. Deadline next Friday.";

export default function TranscriptPlayground() {
  const [transcript, setTranscript] = useState(SAMPLE_TRANSCRIPT);
  const canAnalyze = useMemo(() => transcript.trim().length > 12, [transcript]);

  const handleAnalyze = async () => {
    const value = transcript.trim();
    if (!value) return;
    window.dispatchEvent(
      new CustomEvent("lamatic:submit", {
        detail: {
          message: value,
          autoSend: true,
        },
      }),
    );
  };

  return (
    <Card className="border-border/60 bg-card/70 backdrop-blur">
      <CardHeader className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">Test your meeting copilot</Badge>
          <Badge className="bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/15">Slack Integrated ⚡</Badge>
        </div>
        <CardTitle className="text-xl sm:text-2xl">Paste a transcript, get structured insights</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          className="min-h-40 resize-y"
          placeholder="Paste your meeting transcript here…"
        />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-muted-foreground">
            Click analyze to send the transcript directly into Copilot.
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="secondary" onClick={() => setTranscript(SAMPLE_TRANSCRIPT)}>
              Use sample
            </Button>
            <Button type="button" onClick={handleAnalyze} disabled={!canAnalyze}>
              Analyze in Copilot
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

