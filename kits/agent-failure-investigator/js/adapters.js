const clockOf = raw => {
  if (raw == null) return "00:00:00";
  if (typeof raw === "number") {
    const d = new Date(raw < 1e12 ? raw * 1000 : raw);
    return isNaN(d) ? "00:00:00" : d.toISOString().slice(11, 19);
  }
  const s = String(raw);
  if (/^\d{2}:\d{2}:\d{2}$/.test(s)) return s;
  const d = new Date(s);
  return isNaN(d) ? "00:00:00" : d.toISOString().slice(11, 19);
};

const asText = v => v == null ? "" : (typeof v === "string" ? v : JSON.stringify(v));

const emptyTrace = meta => ({
  meta, system_prompt: "", conversation: [], available_tools: [],
  tool_calls: [], retrieved_docs: [], logs: [], final_response: null
});

const ADAPTERS = [];

class Adapter {
  constructor(id, label, claim, translate) {
    this.id = id; this.label = label; this.claim = claim; this.translate = translate;
    ADAPTERS.push(this);
  }
}

new Adapter("native", "Native", doc =>
  doc && typeof doc === "object" && !Array.isArray(doc) &&
  ("final_response" in doc || "tool_calls" in doc) && !("spans" in doc),
  doc => doc
);

new Adapter("langgraph", "LangGraph", doc => {
  const arr = Array.isArray(doc) ? doc : doc?.events;
  return Array.isArray(arr) && arr.some(e =>
    typeof e?.event === "string" && e.event.startsWith("on_") ||
    e?.metadata?.langgraph_node !== undefined);
}, doc => {
  const events = Array.isArray(doc) ? doc : doc.events;
  const out = emptyTrace({ agent: "langgraph-run", model: "", flow_id: "", session: "", date: "" });
  const openTools = {};
  events.forEach(ev => {
    const ts = clockOf(ev.timestamp || ev.ts || ev.time);
    const kind = ev.event || "";
    const data = ev.data || {};
    if (kind === "on_chain_start" && data.input?.messages) {
      data.input.messages.forEach(m => {
        const role = m.type === "human" || m.role === "user" ? "user" : m.type === "system" ? "system" : "assistant";
        if (role === "system") out.system_prompt = out.system_prompt || asText(m.content);
        else out.conversation.push({ role, ts, content: asText(m.content) });
      });
    }
    if (kind === "on_tool_start") {
      openTools[ev.run_id || ev.name] = { ts, tool: ev.name || "tool", input: data.input ?? {}, status: "success", duration_ms: 0, output: "" };
    }
    if (kind === "on_tool_end") {
      const rec = openTools[ev.run_id || ev.name] || { ts, tool: ev.name || "tool", input: {}, duration_ms: 0 };
      rec.output = asText(data.output);
      rec.status = /error|exception|traceback/i.test(rec.output) ? "error" : "success";
      rec.duration_ms = ev.duration_ms || rec.duration_ms || 0;
      out.tool_calls.push(rec);
      delete openTools[ev.run_id || ev.name];
    }
    if (kind === "on_tool_error") {
      const rec = openTools[ev.run_id || ev.name] || { ts, tool: ev.name || "tool", input: {}, duration_ms: ev.duration_ms || 0 };
      rec.status = /timeout/i.test(asText(data.error)) ? "timeout" : "error";
      rec.output = asText(data.error);
      out.tool_calls.push(rec);
      delete openTools[ev.run_id || ev.name];
    }
    if (kind === "on_retriever_end") {
      (data.output?.documents || data.documents || []).forEach((d, i) => out.retrieved_docs.push({
        id: d.id || `lg-doc-${i}`, source: d.metadata?.source || "retriever",
        score: d.metadata?.score ?? d.score ?? 0, content: asText(d.page_content ?? d.content)
      }));
    }
    if (kind === "on_chat_model_end" || kind === "on_llm_end") {
      const gen = data.output?.generations?.[0]?.[0]?.text ?? data.output?.content ?? data.output;
      out.final_response = { ts, content: asText(gen) };
    }
    if (ev.metadata?.langgraph_node) {
      out.logs.push({ ts, level: "INFO", event: `node.${ev.metadata.langgraph_node}`, message: kind });
    }
    if (/error|fallback/i.test(kind)) {
      out.logs.push({ ts, level: "WARN", event: kind, message: asText(data.error || data) });
    }
  });
  return out;
});

new Adapter("openai-agents", "OpenAI Agents SDK", doc =>
  doc && Array.isArray(doc.spans) && doc.spans.some(s => s?.span_data?.type),
  doc => {
    const out = emptyTrace({
      agent: doc.workflow_name || "openai-agents-run", model: "",
      flow_id: doc.id || doc.trace_id || "", session: doc.group_id || "", date: ""
    });
    doc.spans.forEach(span => {
      const d = span.span_data || {};
      const ts = clockOf(span.started_at);
      const ms = span.started_at && span.ended_at
        ? Math.max(0, new Date(span.ended_at) - new Date(span.started_at)) : 0;
      switch (d.type) {
        case "agent":
          out.meta.agent = d.name || out.meta.agent;
          (d.tools || []).forEach(t => out.available_tools.push(
            typeof t === "string" ? { name: t, description: "" } : { name: t.name, description: t.description || "" }));
          break;
        case "function": {
          const errText = asText(span.error?.message || d.error);
          out.tool_calls.push({
            ts, tool: d.name || "function", input: safeJson(d.input),
            status: span.error ? (/timeout/i.test(errText) ? "timeout" : "error") : "success",
            duration_ms: ms, output: asText(d.output)
          });
          break;
        }
        case "generation":
        case "response": {
          out.meta.model = d.model || out.meta.model;
          (d.input || []).forEach(m => {
            if (m.role === "system") out.system_prompt = out.system_prompt || asText(m.content);
            else if (m.role === "user") out.conversation.push({ role: "user", ts, content: asText(m.content) });
          });
          const last = (d.output || []).filter(m => m.role === "assistant").pop();
          if (last) out.final_response = { ts: clockOf(span.ended_at || span.started_at), content: asText(last.content) };
          break;
        }
        case "guardrail":
          out.logs.push({ ts, level: d.triggered ? "WARN" : "INFO", event: "guardrail", message: d.name || "" });
          break;
        case "handoff":
          out.logs.push({ ts, level: "INFO", event: "agent.handoff", message: `${d.from_agent || "?"} -> ${d.to_agent || "?"}` });
          break;
      }
      if (span.error) out.logs.push({ ts, level: "ERROR", event: "span.error", message: asText(span.error.message || span.error) });
    });
    return out;
  }
);

new Adapter("crewai", "CrewAI", doc =>
  doc && Array.isArray(doc.tasks) && (doc.crew !== undefined || (doc.agents || []).some(a => a?.role)),
  doc => {
    const out = emptyTrace({
      agent: asText(doc.crew?.name || doc.crew || "crew"), model: doc.crew?.llm || "",
      flow_id: doc.id || "", session: "", date: ""
    });
    (doc.agents || []).forEach(a => {
      const brief = [a.role, a.goal, a.backstory].filter(Boolean).join(". ");
      out.system_prompt = out.system_prompt ? out.system_prompt + "\n" + brief : brief;
      (a.tools || []).forEach(t => out.available_tools.push(
        typeof t === "string" ? { name: t, description: "" } : { name: t.name, description: t.description || "" }));
    });
    doc.tasks.forEach((task, i) => {
      const ts = clockOf(task.start_time || task.created_at || i);
      out.conversation.push({ role: "user", ts, content: asText(task.description) });
      (task.tool_calls || task.tools_used || []).forEach(u => out.tool_calls.push({
        ts: clockOf(u.timestamp || u.start_time || ts),
        tool: u.tool || u.name || "tool", input: u.input ?? u.arguments ?? {},
        status: u.error ? (/timeout/i.test(asText(u.error)) ? "timeout" : "error") : (u.status || "success"),
        duration_ms: u.duration_ms || 0, output: asText(u.result ?? u.output ?? u.error)
      }));
      const done = task.output?.raw ?? task.output ?? task.result;
      if (done != null) out.final_response = { ts: clockOf(task.end_time || ts), content: asText(done) };
      out.logs.push({ ts, level: "INFO", event: "task.assigned", message: `${task.agent || "agent"} <- ${asText(task.name || task.description).slice(0, 60)}` });
    });
    return out;
  }
);

new Adapter("autogen", "AutoGen", doc => {
  const hist = doc?.chat_history || (Array.isArray(doc) ? doc : null);
  return Array.isArray(hist) && hist.some(m => m && "role" in m && ("name" in m || "function_call" in m || "tool_calls" in m));
}, doc => {
  const hist = doc.chat_history || doc;
  const out = emptyTrace({ agent: "autogen-chat", model: "", flow_id: "", session: "", date: "" });
  const pending = {};
  hist.forEach((m, i) => {
    const ts = clockOf(m.timestamp || i);
    if (m.role === "system") { out.system_prompt = out.system_prompt || asText(m.content); return; }
    (m.tool_calls || (m.function_call ? [{ id: `fc-${i}`, function: m.function_call }] : [])).forEach(call => {
      pending[call.id || call.function?.name] = {
        ts, tool: call.function?.name || "function",
        input: safeJson(call.function?.arguments), status: "success", duration_ms: 0, output: ""
      };
    });
    if (m.role === "tool" || m.role === "function") {
      const key = m.tool_call_id || m.name;
      const rec = pending[key] || { ts, tool: m.name || "function", input: {}, duration_ms: 0 };
      rec.output = asText(m.content);
      rec.status = /error|exception|timed?\s*out/i.test(rec.output) ? (/timed?\s*out/i.test(rec.output) ? "timeout" : "error") : "success";
      out.tool_calls.push(rec);
      delete pending[key];
      return;
    }
    if (m.role === "user") out.conversation.push({ role: "user", ts, content: asText(m.content) });
    if (m.role === "assistant" && m.content) out.final_response = { ts, content: asText(m.content) };
  });
  if (doc.summary && !out.final_response) out.final_response = { ts: "00:00:00", content: asText(doc.summary) };
  return out;
});

new Adapter("lamatic", "Lamatic", doc =>
  doc && Array.isArray(doc.nodes) && (doc.flowId !== undefined || doc.executionId !== undefined || doc.workflowId !== undefined),
  doc => {
    const out = emptyTrace({
      agent: doc.flowName || "lamatic-flow", model: "",
      flow_id: doc.flowId || doc.workflowId || "", session: doc.executionId || "", date: ""
    });
    doc.nodes.forEach((node, i) => {
      const ts = clockOf(node.startedAt || node.timestamp || i);
      const kind = String(node.nodeType || node.type || "").toLowerCase();
      const ok = !node.error && node.status !== "failed" && node.status !== "error";
      if (kind.includes("trigger") || kind.includes("input")) {
        out.conversation.push({ role: "user", ts, content: asText(node.output?.query ?? node.input?.query ?? node.output ?? node.input) });
      } else if (kind.includes("rag") || kind.includes("retriev") || kind.includes("vector") || kind.includes("memory")) {
        out.tool_calls.push({
          ts, tool: node.nodeName || "vector_search", input: node.input ?? {},
          status: ok ? "success" : "error", duration_ms: node.durationMs || node.duration_ms || 0,
          output: asText(node.output)
        });
        (node.output?.documents || node.output?.chunks || []).forEach((d, j) => out.retrieved_docs.push({
          id: d.id || `lm-doc-${j}`, source: d.source || d.metadata?.source || "vector-db",
          score: d.score ?? d.similarity ?? 0, content: asText(d.content ?? d.text)
        }));
      } else if (kind.includes("llm") || kind.includes("generate") || kind.includes("agent")) {
        out.meta.model = node.model || node.config?.model || out.meta.model;
        if (node.config?.systemPrompt) out.system_prompt = out.system_prompt || node.config.systemPrompt;
        const text = node.output?.text ?? node.output?.response ?? node.output;
        if (ok && text != null) out.final_response = { ts: clockOf(node.endedAt || ts), content: asText(text) };
      } else if (kind.includes("tool") || kind.includes("api") || kind.includes("code") || kind.includes("http")) {
        const errText = asText(node.error);
        out.tool_calls.push({
          ts, tool: node.nodeName || node.toolName || "tool", input: node.input ?? {},
          status: ok ? "success" : (/timeout/i.test(errText + node.status) ? "timeout" : "error"),
          duration_ms: node.durationMs || node.duration_ms || 0,
          output: asText(node.output ?? node.error)
        });
      }
      out.logs.push({
        ts, level: ok ? "INFO" : "ERROR",
        event: `node.${node.nodeName || kind || i}`,
        message: ok ? (node.status || "completed") : asText(node.error || node.status)
      });
      if (node.fallback || /fallback/i.test(asText(node.status))) {
        out.logs.push({ ts, level: "WARN", event: "flow.fallback", message: "fallback branch taken" });
      }
    });
    return out;
  }
);

function safeJson(v) {
  if (v == null) return {};
  if (typeof v !== "string") return v;
  try { return JSON.parse(v); } catch { return { raw: v }; }
}

function importTrace(doc) {
  const match = ADAPTERS.find(a => { try { return a.claim(doc); } catch { return false; } });
  if (!match) throw new Error("Unrecognized trace format — expected native, LangGraph, OpenAI Agents SDK, CrewAI, AutoGen, or Lamatic.");
  return { format: match.id, formatLabel: match.label, trace: match.translate(doc) };
}

if (typeof module !== "undefined") module.exports = { importTrace, ADAPTERS };
