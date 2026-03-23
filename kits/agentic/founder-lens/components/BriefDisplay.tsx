"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface BriefDisplayProps {
  briefJson: string;
}

type Tab = "overview" | "market" | "competition" | "customer" | "blueprint" | "contrarian";

const TABS: { id: Tab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "market", label: "Market" },
  { id: "competition", label: "Competition" },
  { id: "customer", label: "Customer" },
  { id: "blueprint", label: "Blueprint" },
  { id: "contrarian", label: "Contrarian" },
];

function parseBrief(rawJson: string | object): any {
  if (typeof rawJson === "object" && rawJson !== null) return rawJson;
  if (!rawJson || typeof rawJson !== "string") return null;

  try {
    return JSON.parse(rawJson);
  } catch {
    try {
      let cleaned = rawJson.replace(/```json\s*/gi, "").replace(/```\s*/g, "");
      const start = cleaned.indexOf("{");
      const end = cleaned.lastIndexOf("}");
      if (start === -1 || end === -1) return null;
      let sliced = cleaned.slice(start, end + 1);
      sliced = sliced.replace(/\n/g, "\\n").replace(/\r/g, "");
      return JSON.parse(sliced);
    } catch {
      return null;
    }
  }
}

function VerdictBadge({ verdict }: { verdict: string }) {
  const lower = verdict?.toLowerCase() ?? "";
  const isGo = lower === "go";
  const isCautious = lower.includes("cautious");
  return (
    <div
      className={cn(
        "px-3 py-1 rounded-[6px] text-[10px] font-bold uppercase tracking-widest border flex-shrink-0",
        isGo && "border-green-500/30 text-green-400 bg-green-500/10",
        isCautious && "border-yellow-500/30 text-yellow-400 bg-yellow-500/10",
        !isGo && !isCautious && "border-red-500/30 text-red-400 bg-red-500/10"
      )}
    >
      {verdict || "No Go"}
    </div>
  );
}

function ListItems({ items }: { items: string[] }) {
  if (!items?.length) return null;
  return (
    <ul className="space-y-4 mt-3">
      {items.map((item, i) => (
        <li key={i} className="flex gap-4 text-[13px] text-white/70 font-medium leading-relaxed">
          <div className="w-1.5 h-1.5 rounded-full bg-white/30 mt-1.5 flex-shrink-0" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4 py-4 border-b border-white/5 last:border-0 last:pb-0">
      <h3 className="text-[11px] font-bold uppercase tracking-widest text-white/40">{title}</h3>
      <div className="pt-1">{children}</div>
    </div>
  );
}

export function BriefDisplay({ briefJson }: BriefDisplayProps) {
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const brief = parseBrief(briefJson);

  if (!brief) {
    return (
      <div className="glass-panel h-full flex flex-col overflow-hidden">
        <div className="p-8 h-full overflow-auto custom-scrollbar">
          <p className="text-[13px] font-medium text-white/50 whitespace-pre-wrap font-mono leading-relaxed">{briefJson}</p>
        </div>
      </div>
    );
  }

  // Access the nested objects from the exact LLM schema
  const market = brief.market;
  const comp = brief.competitive_landscape;
  const voice = brief.customer_voice;
  const blueprint = brief.success_blueprint;
  const biz = brief.business_model;
  const contrarian = brief.contrarian_take;

  const renderTab = () => {
    switch (activeTab) {
      case "overview":
        return (
          <div className="pb-8">
            {brief.the_one_sentence_pitch && (
              <Section title="One Sentence Pitch">
                <p className="text-[16px] font-medium text-white leading-relaxed">{brief.the_one_sentence_pitch}</p>
              </Section>
            )}
            {brief.why_now_answer && (
              <Section title="Why Now">
                <p className="text-[14px] font-medium text-white/90 leading-relaxed">{brief.why_now_answer}</p>
              </Section>
            )}
            {brief.unfair_advantage_available_now && (
              <Section title="Unfair Advantage">
                <p className="text-[14px] font-medium text-white/90 leading-relaxed">{brief.unfair_advantage_available_now}</p>
              </Section>
            )}
            {brief.recommended_landing_page_headline && (
              <Section title="Recommended Headline">
                <p className="text-xl font-medium text-white tracking-tight leading-snug">"{brief.recommended_landing_page_headline}"</p>
              </Section>
            )}
            {brief.first_5_things_to_validate && (
              <Section title="First 5 Things to Validate">
                <ListItems items={brief.first_5_things_to_validate} />
              </Section>
            )}
            {brief.honest_verdict_no_sugar_coating && (
              <Section title="Honest Verdict">
                <p className="text-[14px] font-medium text-white/80 leading-relaxed italic">{brief.honest_verdict_no_sugar_coating}</p>
              </Section>
            )}
          </div>
        );

      case "market":
        return (
          <div className="pb-8">
            {market?.size && (
              <Section title="Market Size">
                <p className="text-2xl font-medium text-white tracking-tight">{market.size}</p>
              </Section>
            )}
            {market?.timing && (
              <Section title="Timing">
                <p className="text-[14px] font-medium text-white/90 leading-relaxed">{market.timing}</p>
              </Section>
            )}
            {market?.tailwinds?.length > 0 && (
              <Section title="Tailwinds">
                <ListItems items={market.tailwinds} />
              </Section>
            )}
            {market?.headwinds?.length > 0 && (
              <Section title="Headwinds">
                <ListItems items={market.headwinds} />
              </Section>
            )}
          </div>
        );

      case "competition":
        return (
          <div className="pb-8">
            {comp?.the_gap_nobody_owns && (
              <Section title="The Gap Nobody Owns">
                <p className="text-[14px] font-medium text-white/90 leading-relaxed">{comp.the_gap_nobody_owns}</p>
              </Section>
            )}
            {comp?.direct_competitors?.length > 0 && (
              <Section title="Direct Competitors">
                <div className="grid gap-3 pt-2">
                  {comp.direct_competitors.map((c: any, i: number) => (
                    <div key={i} className="p-5 rounded-xl bg-white/5 border border-white/5 space-y-4">
                      <p className="text-[15px] font-medium text-white tracking-tight">{c.name}</p>
                      <div className="space-y-3">
                        {c.strength && (
                          <div className="flex gap-3 items-start">
                            <span className="text-green-400 font-bold text-[12px] mt-0.5">＋</span>
                            <span className="text-[13px] font-medium text-white/70 leading-relaxed">{c.strength}</span>
                          </div>
                        )}
                        {c.weakness && (
                          <div className="flex gap-3 items-start">
                            <span className="text-red-400 font-bold text-[12px] mt-0.5">−</span>
                            <span className="text-[13px] font-medium text-white/70 leading-relaxed">{c.weakness}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Section>
            )}
            {comp?.indirect_competitors?.length > 0 && (
              <Section title="Indirect Competitors">
                <ListItems items={comp.indirect_competitors} />
              </Section>
            )}
            {comp?.dead_competitors_and_why?.length > 0 && (
              <Section title="Dead Competitors & Why">
                <div className="space-y-3 pt-2">
                  {comp.dead_competitors_and_why.map((dc: any, i: number) => (
                    <div key={i} className="p-4 rounded-xl bg-white/5 border border-white/5">
                      <p className="text-[13px] font-bold text-white mb-1">{dc.name}</p>
                      <p className="text-[13px] font-medium text-white/60 leading-relaxed">{dc.reason}</p>
                    </div>
                  ))}
                </div>
              </Section>
            )}
          </div>
        );

      case "customer":
        return (
          <div className="pb-8">
            {voice?.the_exact_pain_worth_solving && (
              <Section title="The Exact Pain Worth Solving">
                <p className="text-[15px] font-medium text-white leading-relaxed">{voice.the_exact_pain_worth_solving}</p>
              </Section>
            )}
            {voice?.ignored_customer_segment && (
              <Section title="Ignored Customer Segment">
                <p className="text-[14px] font-medium text-white/90 leading-relaxed">{voice.ignored_customer_segment}</p>
              </Section>
            )}
            {voice?.top_5_complaints_verbatim?.length > 0 && (
              <Section title="Top 5 Complaints (Verbatim)">
                <div className="space-y-3 pt-2">
                  {voice.top_5_complaints_verbatim.map((complaint: string, i: number) => (
                    <div key={i} className="p-4 rounded-xl bg-white/5 border-l-2 border-l-white/30">
                      <p className="text-[13px] font-medium italic text-white/70 leading-relaxed">"{complaint}"</p>
                    </div>
                  ))}
                </div>
              </Section>
            )}
            {voice?.twitter_rage_signals?.length > 0 && (
              <Section title="X / Social Signals">
                <div className="space-y-3 pt-2">
                  {voice.twitter_rage_signals.map((signal: string, i: number) => (
                    <div key={i} className="p-4 rounded-xl bg-[linear-gradient(45deg,rgba(59,130,246,0.1),transparent)] border border-blue-500/10">
                      <p className="text-[13px] font-medium text-blue-100/70 leading-relaxed">{signal}</p>
                    </div>
                  ))}
                </div>
              </Section>
            )}
            {voice?.words_to_use_on_landing_page?.length > 0 && (
              <Section title="Landing Page Magic Words">
                <div className="flex flex-wrap gap-2 pt-2">
                  {voice.words_to_use_on_landing_page.map((word: string, i: number) => (
                    <span key={i} className="px-3 py-1.5 rounded-md text-[11px] font-medium bg-white/10 text-white/90 border border-white/5">
                      {word}
                    </span>
                  ))}
                </div>
              </Section>
            )}
          </div>
        );

      case "blueprint":
        return (
          <div className="pb-8">
            {blueprint?.what_winners_had_in_common?.length > 0 && (
              <Section title="What Winners Had in Common">
                <ListItems items={blueprint.what_winners_had_in_common} />
              </Section>
            )}
            {blueprint?.the_initial_wedge_that_worked && (
              <Section title="The Initial Wedge">
                <p className="text-[14px] font-medium text-white/90 leading-relaxed">{blueprint.the_initial_wedge_that_worked}</p>
              </Section>
            )}
            {blueprint?.how_first_100_customers_were_acquired && (
              <Section title="First 100 Customers Strategy">
                <p className="text-[14px] font-medium text-white/90 leading-relaxed">{blueprint.how_first_100_customers_were_acquired}</p>
              </Section>
            )}
            {blueprint?.the_distribution_secret && (
              <Section title="Distribution Secret">
                <p className="text-[14px] font-medium text-white/90 leading-relaxed">{blueprint.the_distribution_secret}</p>
              </Section>
            )}
            {biz?.recommended_model && (
              <Section title="Recommended Business Model">
                <p className="text-lg font-medium tracking-tight text-white">{biz.recommended_model}</p>
              </Section>
            )}
            {biz?.path_to_1M_ARR && (
              <Section title="Path to $1M ARR">
                <p className="text-[14px] font-medium text-white/90 leading-relaxed">{biz.path_to_1M_ARR}</p>
              </Section>
            )}
          </div>
        );

      case "contrarian":
        return (
          <div className="pb-8 space-y-8 pt-4">
            {contrarian?.most_likely_cause_of_death && (
              <div className="space-y-3">
                <p className="text-[11px] font-bold uppercase tracking-widest text-red-400">Most Likely Cause of Death</p>
                <div className="p-5 rounded-xl border border-red-500/20 bg-red-500/5">
                  <p className="text-[14px] font-medium text-white/90 leading-relaxed">{contrarian.most_likely_cause_of_death}</p>
                </div>
              </div>
            )}
            {contrarian?.the_fatal_flaw && (
              <div className="space-y-3">
                <p className="text-[11px] font-bold uppercase tracking-widest text-orange-400">The Fatal Flaw</p>
                <div className="p-5 rounded-xl border border-orange-500/20 bg-orange-500/5">
                  <p className="text-[14px] font-medium text-white/90 leading-relaxed">{contrarian.the_fatal_flaw}</p>
                </div>
              </div>
            )}
            {contrarian?.the_competitor_to_fear && (
              <div className="space-y-3">
                <p className="text-[11px] font-bold uppercase tracking-widest text-yellow-400">Competitor to Fear</p>
                <div className="p-5 rounded-xl border border-yellow-500/20 bg-yellow-500/5">
                  <p className="text-[14px] font-medium text-white/90 leading-relaxed">{contrarian.the_competitor_to_fear}</p>
                </div>
              </div>
            )}
            {biz?.dangerous_assumption && (
              <Section title="Dangerous Assumption">
                <p className="text-[14px] font-medium text-white/90 leading-relaxed">{biz.dangerous_assumption}</p>
              </Section>
            )}
            {biz?.unit_economics_warning && (
              <Section title="Unit Economics Warning">
                <p className="text-[14px] font-medium text-white/90 leading-relaxed">{biz.unit_economics_warning}</p>
              </Section>
            )}
          </div>
        );
    }
  };

  return (
    <div className="glass-panel flex flex-col h-full overflow-hidden">
      {/* Top Header Section */}
      <div className="px-8 pt-8 pb-6 border-b border-white/5 flex-shrink-0">
        <div className="flex items-start justify-between gap-6 mb-4">
          <h2 className="text-[22px] font-medium text-white leading-[1.2] tracking-tight flex-1">
            {brief.the_one_sentence_pitch || "Startup Analysis"}
          </h2>
          <VerdictBadge verdict={brief.verdict} />
        </div>
        {brief.honest_verdict_no_sugar_coating && (
          <p className="text-[13px] font-medium text-white/60 leading-relaxed border-l-2 border-white/20 pl-4">
            {brief.honest_verdict_no_sugar_coating}
          </p>
        )}
      </div>

      {/* Tabs Menu */}
      <div className="px-6 py-4 border-b border-white/5 flex overflow-x-auto gap-2 scrollbar-hide flex-shrink-0">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex-shrink-0 px-4 py-2 rounded-full text-[12px] font-medium transition-all duration-300",
                isActive
                  ? "bg-white text-black shadow-lg"
                  : "text-white/50 hover:text-white/90 hover:bg-white/5"
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 px-8 py-6 relative overflow-y-auto custom-scrollbar">
        {renderTab()}
      </div>
    </div>
  );
}
