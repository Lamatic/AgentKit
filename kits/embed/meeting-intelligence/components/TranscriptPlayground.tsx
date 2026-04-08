"use client";

import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const SAMPLE_TRANSCRIPT =
  "Team discussed Q4 product launch. Rahul handles frontend. Priya backend. Budget concerns raised. Deadline next Friday.";

// These IDs must match the Lamatic chat widget's internal DOM structure.
// If the widget updates, verify these selectors still work.
const INPUT_ID = "lam-chat-message-input";
const SEND_BTN_ID = "lam-chat-send-button";
const MAX_ATTEMPTS = 20;
const MIN_TRANSCRIPT_LENGTH = 12;

// ---------------------------------------------------------------------------
// Zod schema — single source of truth for validation.
// ---------------------------------------------------------------------------
const transcriptSchema = z.object({
  transcript: z
    .string()
    .min(MIN_TRANSCRIPT_LENGTH + 1, `Transcript must be at least ${MIN_TRANSCRIPT_LENGTH + 1} characters.`),
});

type TranscriptFormValues = z.infer<typeof transcriptSchema>;

// ---------------------------------------------------------------------------
// fillAndSend — polls until the widget input is available, then injects the
// value and triggers the send button. Uses an instanceof check to select the
// correct prototype setter so we never call a textarea setter on an input
// receiver (which throws "Illegal invocation").
// ---------------------------------------------------------------------------
function fillAndSend(
  value: string,
  attempt = 0,
  isCancelled: () => boolean = () => false,
  onDone?: () => void,
): void {
  if (isCancelled()) {
    onDone?.();
    return;
  }

  const input = document.getElementById(INPUT_ID) as HTMLInputElement | HTMLTextAreaElement | null;

  if (!input) {
    if (attempt < MAX_ATTEMPTS) {
      setTimeout(() => fillAndSend(value, attempt + 1, isCancelled, onDone), 100);
    } else {
      console.warn("[TranscriptPlayground] Widget input not found after retries");
      onDone?.();
    }
    return;
  }

  const nativeSetter =
    input instanceof window.HTMLTextAreaElement
      ? Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value")?.set
      : Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set;

  if (nativeSetter) nativeSetter.call(input, value);
  else input.value = value;

  input.dispatchEvent(new Event("input", { bubbles: true }));

  const sendBtn = document.getElementById(SEND_BTN_ID) as HTMLButtonElement | null;
  if (sendBtn) sendBtn.click();

  onDone?.();
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
interface TranscriptPlaygroundProps {
  isLamaticReady?: boolean;
}

export default function TranscriptPlayground({ isLamaticReady = true }: TranscriptPlaygroundProps) {
  const cancelledRef = useRef(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const form = useForm<TranscriptFormValues>({
    resolver: zodResolver(transcriptSchema),
    defaultValues: { transcript: SAMPLE_TRANSCRIPT },
  });

  // Cancel any in-flight retries when the component unmounts.
  useEffect(() => {
    cancelledRef.current = false;
    return () => {
      cancelledRef.current = true;
    };
  }, []);

  const onSubmit = (data: TranscriptFormValues) => {
    if (isAnalyzing) return;
    setIsAnalyzing(true);

    window.dispatchEvent(new Event("lamatic:open"));

    // Give the widget a moment to open, then poll for its input.
    setTimeout(() => {
      fillAndSend(data.transcript, 0, () => cancelledRef.current, () => {
        setIsAnalyzing(false);
      });
    }, 300);
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
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="transcript"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="sr-only">Meeting transcript</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      className="min-h-40 resize-y"
                      placeholder="Paste your meeting transcript here…"
                    />
                  </FormControl>
                  <FormDescription>
                    Click analyze to send the transcript directly into Copilot.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Button
                type="button"
                variant="secondary"
                onClick={() =>
                  form.setValue("transcript", SAMPLE_TRANSCRIPT, { shouldValidate: true })
                }
              >
                Use sample
              </Button>
              <Button type="submit" disabled={!isLamaticReady || isAnalyzing}>
                {isAnalyzing ? "Analyzing…" : "Analyze in Copilot"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
