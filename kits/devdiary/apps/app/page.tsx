import Image from "next/image";
import { SyncPanel } from "@/components/sync-panel";
import { ChatPanel } from "@/components/chat-panel";

/** DevDiary dashboard: sync panel and diary chat side by side. */
export default function Home() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <header className="mb-10">
        <div className="flex items-center gap-3">
          <Image
            src="/devdiary-logo.png"
            alt="DevDiary"
            width={48}
            height={48}
            className="h-12 w-12 rounded-xl"
            priority
          />
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-100">DevDiary</h1>
            <p className="text-sm text-zinc-400">
              Your commits, turned into a journal you can talk to.
            </p>
          </div>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <SyncPanel />
        <ChatPanel />
      </div>

      <footer className="mt-10 text-center text-xs text-zinc-600">
        Tip: point a GitHub webhook at <code className="text-zinc-500">/api/github/webhook</code> to log
        every push automatically. Built on{" "}
        <a href="https://lamatic.ai" className="text-zinc-500 underline">
          Lamatic.ai
        </a>
        .
      </footer>
    </main>
  );
}
