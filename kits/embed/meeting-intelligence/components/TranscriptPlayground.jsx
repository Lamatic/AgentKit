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

  const handleAnalyze = () => {
    const value = transcript.trim();
    if (!value) return;

    // Open the widget then let the user paste / it auto-fills via the event.
    window.dispatchEvent(new Event("lamatic:open"));

    // Give the widget a moment to open, then fill and send.
    setTimeout(() => {
      const input = document.getElementById("lam-chat-message-input");
      if (input) {
        const nativeSetter =
          Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value")?.set ||
          Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set;
        if (nativeSetter) nativeSetter.call(input, value);
        else input.value = value;
        input.dispatchEvent(new Event("input", { bubbles: true }));

        const sendBtn = document.getElementById("lam-chat-send-button");
        if (sendBtn) sendBtn.click();
      }
    }, 600);
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
