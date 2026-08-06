const STAGE_OF_CATEGORY = {
  PROMPT_AMBIGUITY: "prompt",
  WRONG_TOOL: "planner",
  RAG_FAILURE: "retriever",
  TOOL_FAILURE: "tool",
  HALLUCINATION: "llm"
};

function paintCausalityGraph(hostId, trace, result) {
  const host = document.getElementById(hostId);
  if (!host) return;

  const stages = [
    { id: "user", name: "User", present: true },
    { id: "prompt", name: "Prompt", present: !!trace.system_prompt },
    { id: "planner", name: "Planner", present: (trace.available_tools || []).length > 0 },
    { id: "retriever", name: "Retriever", present: (trace.retrieved_docs || []).length > 0 || (trace.tool_calls || []).some(tc => /vector|retriev|knowledge_base|kb_/i.test(tc.tool)) },
    { id: "tool", name: "Tool", present: (trace.tool_calls || []).length > 0 },
    { id: "llm", name: "LLM", present: true },
    { id: "answer", name: "Answer", present: !!trace.final_response }
  ].filter(s => s.present);

  const guilty = result.primary ? STAGE_OF_CATEGORY[result.primary] : null;
  const guiltyPos = stages.findIndex(s => s.id === guilty);

  const BOX_W = 108, BOX_H = 44, GAP = 46, PAD = 14;
  const width = PAD * 2 + stages.length * BOX_W + (stages.length - 1) * GAP;
  const height = 108;
  const midY = 44;

  let shapes = "";
  stages.forEach((stage, i) => {
    const x = PAD + i * (BOX_W + GAP);
    const bad = i === guiltyPos;
    const dimmed = guiltyPos !== -1 && i > guiltyPos;
    const stroke = bad ? "var(--red)" : dimmed ? "var(--line)" : "var(--green)";
    const fill = bad ? "rgba(255,77,77,0.12)" : "transparent";
    const textColor = bad ? "var(--red)" : dimmed ? "var(--dim)" : "var(--fg)";
    shapes += `<g class="${bad ? "gnode-bad" : ""}">
      <rect x="${x}" y="${midY - BOX_H / 2}" width="${BOX_W}" height="${BOX_H}" rx="8"
        fill="${fill}" stroke="${stroke}" stroke-width="${bad ? 2.5 : 1.5}"/>
      <text x="${x + BOX_W / 2}" y="${midY + 5}" text-anchor="middle" class="gnode-label" fill="${textColor}">${stage.name}</text>
      ${bad ? `<text x="${x + BOX_W / 2}" y="${midY + BOX_H / 2 + 22}" text-anchor="middle" class="gnode-tag" fill="var(--red)">FAILURE ORIGIN</text>` : ""}
    </g>`;
    if (i < stages.length - 1) {
      const ax = x + BOX_W, bx = x + BOX_W + GAP;
      const arrowColor = (guiltyPos !== -1 && i >= guiltyPos) ? "var(--red)" : "var(--dim)";
      const dash = (guiltyPos !== -1 && i >= guiltyPos) ? `stroke-dasharray="5 4"` : "";
      shapes += `<line x1="${ax + 4}" y1="${midY}" x2="${bx - 10}" y2="${midY}" stroke="${arrowColor}" stroke-width="1.5" ${dash}/>
        <path d="M ${bx - 10} ${midY - 4} L ${bx - 3} ${midY} L ${bx - 10} ${midY + 4} Z" fill="${arrowColor}"/>`;
    }
  });

  host.innerHTML = `<svg viewBox="0 0 ${width} ${height}" width="${width}" height="${height}"
    xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Failure propagation graph">${shapes}</svg>`;
}
