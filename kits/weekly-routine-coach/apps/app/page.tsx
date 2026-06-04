"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Loader2, Send, Calendar, RotateCcw } from "lucide-react";
import {
  callIntake,
  callGenerateWeek,
  callReplan,
  type IntakeResult,
  type SessionState,
  type Block,
  type UnmetGoal,
  type Category,
} from "@/actions/orchestrate";

type ChatMessage = { role: "user" | "assistant"; content: string };
type Stage = "intake" | "generating" | "week" | "replanning";

const DAYS: { id: "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun"; label: { "pt-BR": string; en: string } }[] = [
  { id: "mon", label: { "pt-BR": "Seg", en: "Mon" } },
  { id: "tue", label: { "pt-BR": "Ter", en: "Tue" } },
  { id: "wed", label: { "pt-BR": "Qua", en: "Wed" } },
  { id: "thu", label: { "pt-BR": "Qui", en: "Thu" } },
  { id: "fri", label: { "pt-BR": "Sex", en: "Fri" } },
  { id: "sat", label: { "pt-BR": "Sáb", en: "Sat" } },
  { id: "sun", label: { "pt-BR": "Dom", en: "Sun" } },
];

const HOUR_START = 6;
const HOUR_END = 24;
const HOUR_PX = 44;

// Format a Date as YYYY-MM-DD in the user's local time zone.
// Avoids the UTC roll-over that toISOString() introduces for offsets behind/ahead of UTC.
function toLocalISODate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const t = (lang: "pt-BR" | "en") => ({
  title: lang === "pt-BR" ? "Weekly Routine Coach" : "Weekly Routine Coach",
  intakePlaceholder:
    lang === "pt-BR"
      ? "Conte sua semana: trabalho, metas, preferências..."
      : "Tell me about your week: work, goals, preferences...",
  send: lang === "pt-BR" ? "Enviar" : "Send",
  generateWeek: lang === "pt-BR" ? "Gerar minha semana" : "Generate my week",
  generating: lang === "pt-BR" ? "Montando sua semana..." : "Building your week...",
  generatingHint:
    lang === "pt-BR"
      ? "Isso leva ~1 min. O agente está posicionando seus blocos respeitando sono, refeições e preferências."
      : "Takes ~1 min. The agent is placing your blocks while respecting sleep, meals, and preferences.",
  weekSummary: lang === "pt-BR" ? "Sua semana" : "Your week",
  unmetGoals: lang === "pt-BR" ? "Metas não atendidas" : "Unmet goals",
  restart: lang === "pt-BR" ? "Recomeçar" : "Restart",
  slipDialogTitle: lang === "pt-BR" ? "Não fez esse bloco?" : "Skipped this block?",
  slipDialogDesc:
    lang === "pt-BR"
      ? "O agente vai tentar reencaixar em outro horário da semana."
      : "The agent will try to reschedule it elsewhere in the week.",
  cancel: lang === "pt-BR" ? "Cancelar" : "Cancel",
  confirmSlip: lang === "pt-BR" ? "Sim, replanejar" : "Yes, replan",
  replanning: lang === "pt-BR" ? "Replanejando..." : "Replanning...",
});

export default function Home() {
  const [stage, setStage] = useState<Stage>("intake");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sessionState, setSessionState] = useState<SessionState | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [unmetGoals, setUnmetGoals] = useState<UnmetGoal[]>([]);
  const [summary, setSummary] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [slipBlock, setSlipBlock] = useState<Block | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const lang = sessionState?.language ?? "pt-BR";
  const i18n = t(lang);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage() {
    if (!input.trim() || pending) return;
    const userMsg = input.trim();
    setInput("");
    setMessages((m) => [...m, { role: "user", content: userMsg }]);
    setPending(true);
    setError(null);
    try {
      const today = toLocalISODate(new Date());
      const res = await callIntake({
        message: userMsg,
        today,
        session_state: sessionState ?? {},
      });
      setSessionState(res.session_state);
      setIsComplete(res.is_complete);
      setMessages((m) => [...m, { role: "assistant", content: res.assistant_message }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setPending(false);
    }
  }

  async function generateWeek() {
    if (!sessionState) return;
    setStage("generating");
    setError(null);
    try {
      const today = new Date();
      const day = today.getDay();
      const diff = (day === 0 ? -6 : 1) - day;
      const monday = new Date(today);
      monday.setDate(today.getDate() + diff);
      const weekStart = toLocalISODate(monday);

      const res = await callGenerateWeek({
        week_start_date: weekStart,
        language: sessionState.language,
        categories: sessionState.categories,
        fixed_commitments: sessionState.fixed_commitments,
        recurring_goals: sessionState.recurring_goals,
        oneoff_events: sessionState.oneoff_events,
        preferences: sessionState.preferences,
      });
      setBlocks(res.blocks);
      setUnmetGoals(res.unmet_goals);
      setSummary(res.summary);
      setStage("week");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
      setStage("intake");
    }
  }

  async function handleSlip(block: Block) {
    if (!sessionState) return;
    setStage("replanning");
    setError(null);
    try {
      const res = await callReplan({
        current_blocks: blocks,
        language: sessionState.language,
        categories: sessionState.categories,
        recurring_goals: sessionState.recurring_goals,
        fixed_commitments: sessionState.fixed_commitments,
        preferences: sessionState.preferences,
        change: { kind: "slip", block_id: block.id },
      });
      setBlocks(res.updated_blocks);
      setUnmetGoals(res.unmet_goals);
      setSummary(res.summary);
      setStage("week");
      setSlipBlock(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
      setStage("week");
    }
  }

  function restart() {
    setStage("intake");
    setMessages([]);
    setSessionState(null);
    setIsComplete(false);
    setBlocks([]);
    setUnmetGoals([]);
    setSummary("");
    setError(null);
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <header className="border-b bg-white dark:bg-slate-900 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-semibold flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            {i18n.title}
          </h1>
          {stage === "week" && (
            <Button variant="outline" size="sm" onClick={restart}>
              <RotateCcw className="w-4 h-4 mr-2" />
              {i18n.restart}
            </Button>
          )}
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6">
        {error && (
          <Card className="p-4 mb-4 bg-red-50 dark:bg-red-900/20 border-red-200">
            <p className="text-sm font-mono whitespace-pre-wrap break-words text-red-700 dark:text-red-300">
              {error}
            </p>
          </Card>
        )}

        {(stage === "intake" || stage === "generating") && (
          <IntakePanel
            messages={messages}
            input={input}
            setInput={setInput}
            sendMessage={sendMessage}
            pending={pending}
            isComplete={isComplete}
            sessionState={sessionState}
            generateWeek={generateWeek}
            chatEndRef={chatEndRef}
            i18n={i18n}
            generating={stage === "generating"}
          />
        )}

        {(stage === "week" || stage === "replanning") && (
          <WeekPanel
            blocks={blocks}
            categories={sessionState?.categories ?? []}
            unmetGoals={unmetGoals}
            summary={summary}
            onSlip={(b) => setSlipBlock(b)}
            replanning={stage === "replanning"}
            i18n={i18n}
            lang={lang}
          />
        )}
      </main>

      <Dialog open={!!slipBlock} onOpenChange={(open) => !open && setSlipBlock(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{i18n.slipDialogTitle}</DialogTitle>
            <DialogDescription>
              {slipBlock && (
                <span className="font-medium">
                  {slipBlock.label} · {slipBlock.day} {slipBlock.start}–{slipBlock.end}
                </span>
              )}
              <br />
              {i18n.slipDialogDesc}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSlipBlock(null)}>
              {i18n.cancel}
            </Button>
            <Button onClick={() => slipBlock && handleSlip(slipBlock)}>
              {i18n.confirmSlip}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function IntakePanel({
  messages,
  input,
  setInput,
  sendMessage,
  pending,
  isComplete,
  sessionState,
  generateWeek,
  chatEndRef,
  i18n,
  generating,
}: {
  messages: ChatMessage[];
  input: string;
  setInput: (v: string) => void;
  sendMessage: () => void;
  pending: boolean;
  isComplete: boolean;
  sessionState: SessionState | null;
  generateWeek: () => void;
  chatEndRef: React.RefObject<HTMLDivElement | null>;
  i18n: ReturnType<typeof t>;
  generating: boolean;
}) {
  if (generating) {
    return (
      <Card className="p-12 text-center">
        <Loader2 className="w-10 h-10 animate-spin mx-auto mb-4 text-blue-600" />
        <h2 className="text-lg font-semibold mb-2">{i18n.generating}</h2>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          {i18n.generatingHint}
        </p>
      </Card>
    );
  }

  return (
    <div className="grid md:grid-cols-[1fr_320px] gap-6">
      <Card className="p-6 flex flex-col h-[calc(100vh-200px)] min-h-[500px]">
        <div className="flex-1 overflow-y-auto space-y-4 mb-4">
          {messages.length === 0 && (
            <div className="text-center text-muted-foreground py-12 px-6">
              <p className="text-sm">
                <strong>Try:</strong>
                <br />
                <span className="text-xs">
                  Trabalho seg-sex 9-18, queria treinar 4x na semana e estudar inglês 1h por dia
                </span>
              </p>
            </div>
          )}
          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                  m.role === "user"
                    ? "bg-blue-600 text-white"
                    : "bg-slate-100 dark:bg-slate-800"
                }`}
              >
                {m.content}
              </div>
            </div>
          ))}
          {pending && (
            <div className="flex justify-start">
              <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl px-4 py-2 text-sm">
                <Loader2 className="w-4 h-4 animate-spin" />
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>
        <div className="flex gap-2 items-end">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={i18n.intakePlaceholder}
            className="min-h-[60px] resize-none"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            disabled={pending}
          />
          <Button onClick={sendMessage} disabled={pending || !input.trim()} size="icon">
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </Card>

      <Card className="p-6 h-fit space-y-4">
        <h3 className="font-semibold text-sm">Captured so far</h3>
        {!sessionState ? (
          <p className="text-xs text-muted-foreground">Start chatting to populate.</p>
        ) : (
          <>
            <Section
              title="Categories"
              count={sessionState.categories.length}
              items={sessionState.categories.map((c) => (
                <div key={c.id} className="flex items-center gap-2 text-xs">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ background: c.color }}
                  />
                  {c.name}
                </div>
              ))}
            />
            <Section
              title="Fixed"
              count={sessionState.fixed_commitments.length}
              items={sessionState.fixed_commitments.slice(0, 5).map((c) => (
                <div key={c.id} className="text-xs text-muted-foreground">
                  {c.day} {c.start}–{c.end}
                </div>
              ))}
            />
            <Section
              title="Goals"
              count={sessionState.recurring_goals.length}
              items={sessionState.recurring_goals.map((g) => (
                <div key={g.id} className="text-xs text-muted-foreground">
                  {g.label} ({g.target_hours_per_week}h/sem)
                </div>
              ))}
            />
          </>
        )}
        {isComplete && (
          <Button onClick={generateWeek} className="w-full" size="lg">
            <Calendar className="w-4 h-4 mr-2" />
            {i18n.generateWeek}
          </Button>
        )}
      </Card>
    </div>
  );
}

function Section({
  title,
  count,
  items,
}: {
  title: string;
  count: number;
  items: React.ReactNode[];
}) {
  if (count === 0) return null;
  return (
    <div>
      <h4 className="text-xs font-medium text-muted-foreground mb-1">
        {title} ({count})
      </h4>
      <div className="space-y-1">{items}</div>
    </div>
  );
}

function WeekPanel({
  blocks,
  categories,
  unmetGoals,
  summary,
  onSlip,
  replanning,
  i18n,
  lang,
}: {
  blocks: Block[];
  categories: Category[];
  unmetGoals: UnmetGoal[];
  summary: string;
  onSlip: (b: Block) => void;
  replanning: boolean;
  i18n: ReturnType<typeof t>;
  lang: "pt-BR" | "en";
}) {
  const colorByCategory: Record<string, string> = {};
  for (const c of categories) colorByCategory[c.id] = c.color;
  // fallback colors for kinds not tied to categories
  const colorByKind: Record<Block["kind"], string> = {
    fixed: "#0a84ff",
    goal: "#34c759",
    oneoff: "#ff9500",
    sleep: "#86868b",
    meal: "#af52de",
    break: "#5ac8fa",
  };

  function getColor(b: Block) {
    if (b.category_id && colorByCategory[b.category_id]) return colorByCategory[b.category_id];
    return colorByKind[b.kind] || "#86868b";
  }

  const totalSlots = (HOUR_END - HOUR_START) * 2; // 30-min slots

  function blockPosition(b: Block) {
    const [sh, sm] = b.start.split(":").map(Number);
    const [eh, em] = b.end.split(":").map(Number);
    const startMin = Math.max(sh * 60 + sm, HOUR_START * 60);
    const endMin = Math.min(eh * 60 + em, HOUR_END * 60);
    if (endMin <= startMin) return null;
    const top = ((startMin - HOUR_START * 60) / 60) * HOUR_PX;
    const height = ((endMin - startMin) / 60) * HOUR_PX;
    return { top, height };
  }

  return (
    <div className="space-y-4">
      {replanning && (
        <Card className="p-3 flex items-center gap-2 bg-blue-50 dark:bg-blue-950">
          <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
          <span className="text-sm">{i18n.replanning}</span>
        </Card>
      )}

      <Card className="p-4">
        <p className="text-sm">{summary}</p>
      </Card>

      <Card className="overflow-x-auto">
        <div className="min-w-[700px]">
          <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b">
            <div className="p-2 text-xs text-muted-foreground"></div>
            {DAYS.map((d) => (
              <div
                key={d.id}
                className="p-2 text-center font-medium text-sm border-l"
              >
                {d.label[lang]}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-[60px_repeat(7,1fr)] relative">
            <div className="border-r">
              {Array.from({ length: HOUR_END - HOUR_START }, (_, i) => (
                <div
                  key={i}
                  className="text-[10px] text-muted-foreground p-1 border-b"
                  style={{ height: HOUR_PX }}
                >
                  {String(HOUR_START + i).padStart(2, "0")}:00
                </div>
              ))}
            </div>
            {DAYS.map((d) => {
              const dayBlocks = blocks.filter((b) => b.day === d.id);
              return (
                <div
                  key={d.id}
                  className="relative border-l"
                  style={{ height: totalSlots * (HOUR_PX / 2) }}
                >
                  {Array.from({ length: HOUR_END - HOUR_START }, (_, i) => (
                    <div
                      key={i}
                      className="border-b border-slate-100 dark:border-slate-800"
                      style={{ height: HOUR_PX }}
                    />
                  ))}
                  {dayBlocks.map((b) => {
                    const pos = blockPosition(b);
                    if (!pos) return null;
                    const isInteractive = b.kind === "goal" || b.kind === "oneoff";
                    return (
                      <button
                        key={b.id}
                        onClick={() => isInteractive && onSlip(b)}
                        disabled={!isInteractive}
                        className={`absolute left-0.5 right-0.5 rounded text-[10px] px-1 py-0.5 overflow-hidden text-white text-left ${
                          isInteractive
                            ? "cursor-pointer hover:ring-2 hover:ring-offset-1 hover:ring-blue-400"
                            : "cursor-default opacity-80"
                        }`}
                        style={{
                          top: pos.top,
                          height: Math.max(pos.height - 2, 14),
                          background: getColor(b),
                        }}
                        title={`${b.label} (${b.start}–${b.end})`}
                      >
                        <div className="font-medium truncate">{b.label}</div>
                        {pos.height >= 30 && (
                          <div className="opacity-75 truncate">
                            {b.start}–{b.end}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      {unmetGoals.length > 0 && (
        <Card className="p-4 border-amber-200 bg-amber-50 dark:bg-amber-950/20">
          <h3 className="font-semibold text-sm mb-2 text-amber-900 dark:text-amber-200">
            {i18n.unmetGoals}
          </h3>
          <ul className="text-xs space-y-1">
            {unmetGoals.map((g) => (
              <li key={g.goal_id} className="text-amber-800 dark:text-amber-300">
                <strong>{g.goal_label}</strong>: {g.scheduled_hours}h /{" "}
                {g.target_hours}h · {g.reason}
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
