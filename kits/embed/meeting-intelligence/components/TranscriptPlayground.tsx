"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

const SAMPLE_TRANSCRIPT =
  "Team discussed Q4 product launch. Rahul handles frontend. Priya backend. Budget concerns raised. Deadline next Friday.";

// These IDs must match the Lamatic chat widget's internal DOM structure.
// If the widget updates, verify these selectors still work.
const INPUT_ID = "lam-chat-message-input";
const SEND_BTN_ID = "lam-chat-send-button";
const MAX_ATTEMPTS = 20;

function fillAndSend(value: string, attempt = 0): void {
  const input = document.getElementById(INPUT_ID) as HTMLInputElement | HTMLTextAreaElement | null;

  if (!input) {
    if (attempt < MAX_ATTEMPTS) {
      setTimeout(() => fillAndSend(value, attempt + 1), 100);
    } else {
      console.warn("[TranscriptPlayground] Widget input not found after retries");
    }
    return;
  }

  const nativeSetter =
    Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value")?.set ||
    Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set;

  if (nativeSetter) nativeSetter.call(input, value);
  else input.value = value;

  input.dispatchEvent(new Event("input", { bubbles: true }));

  const sendBtn = document.getElementById(SEND_BTN_ID) as HTMLButtonElement | null;
  if (sendBtn) sendBtn.click();
}

interface TranscriptPlaygroundProps {
  isLamaticReady?: boolean;
}

export default function TranscriptPlayground({ isLamaticReady = true }: TranscriptPlaygroundProps) {
  const [transcript, setTranscript] = useState(SAMPLE_TRANSCRIPT);
  const canAnalyze = useMemo(
    () => isLamaticReady && transcript.trim().length > 12,
    [isLamaticReady, transcript],
  );

  const handleAnalyze = () => {
    const value = transcript.trim();
    if (!value) return;

    window.dispatchEvent(new Event("lamatic:open"));

    // Start polling after a short initial delay so the widget has time to open.
    setTimeout(() => fillAndSend(value), 300);
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
