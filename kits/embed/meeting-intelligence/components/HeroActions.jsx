"use client";

import { Button } from "@/components/ui/button";

export default function HeroActions({ isLamaticReady }) {
  return (
    <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
      <Button asChild size="lg">
        <a href="#meeting-demo">Start Analyzing Meetings</a>
      </Button>

      <Button
        size="lg"
        variant="secondary"
        onClick={() => window.dispatchEvent(new Event("lamatic:open"))}
        disabled={!isLamaticReady}
      >
        Open Copilot
      </Button>
    </div>
  );
}
