import { describe, it, expect } from "vitest";
import { normalizeDossier } from "./dossier";

describe("normalizeDossier", () => {
  it("parses a snake_case JSON string answer", () => {
    const raw = JSON.stringify({
      identity: {
        name: "Jane Doe",
        role: "CTO",
        company: "Acme",
        location: null,
        sources: ["https://a.com"],
      },
      summary: "Builds things.",
      outside_work: [{ note: "Marathoner", source_url: "https://a.com/run" }],
      talking_points: [
        {
          point: "Ask about her marathon",
          why_it_works: "Personal",
          source_url: "https://a.com/run",
        },
      ],
      couldnt_confirm: ["birthplace"],
      sources: ["https://a.com", "https://a.com/run"],
      confidence: "high",
    });
    const d = normalizeDossier(raw);
    expect(d.identity.name).toBe("Jane Doe");
    expect(d.identity.role).toBe("CTO");
    expect(d.outside_work).toHaveLength(1);
    expect(d.talking_points).toHaveLength(1);
    expect(d.talking_points[0].why_it_works).toBe("Personal");
    expect(d.couldnt_confirm).toEqual(["birthplace"]);
    expect(d.confidence).toBe("high");
  });

  it("accepts a camelCase object answer and canonicalizes to snake_case", () => {
    const d = normalizeDossier({
      identity: { name: "John Roe", role: "PM", company: "Beta", sources: [] },
      summary: "Ships product.",
      outsideWork: [{ note: "Cyclist", sourceUrl: "https://b.com/bike" }],
      talkingPoints: [
        {
          point: "Ask about cycling",
          whyItWorks: "Human interest",
          sourceUrl: "https://b.com/bike",
        },
      ],
      couldntConfirm: ["age"],
      sources: ["https://b.com/bike"],
      confidence: "medium",
    });
    expect(d.outside_work).toHaveLength(1);
    expect(d.outside_work[0].source_url).toBe("https://b.com/bike");
    expect(d.talking_points).toHaveLength(1);
    expect(d.talking_points[0].why_it_works).toBe("Human interest");
    expect(d.couldnt_confirm).toEqual(["age"]);
    expect(d.confidence).toBe("medium");
  });

  it("parses a camelCase JSON string answer", () => {
    const raw = JSON.stringify({
      talkingPoints: [
        { point: "p", whyItWorks: "w", sourceUrl: "https://c.com" },
      ],
    });
    const d = normalizeDossier(raw);
    expect(d.talking_points).toHaveLength(1);
    expect(d.talking_points[0].source_url).toBe("https://c.com");
  });

  it("fills safe defaults for a sparse/invalid object", () => {
    const d = normalizeDossier({ summary: 5, talking_points: "nope" });
    expect(d.identity.name).toBe("");
    expect(d.identity.role).toBeNull();
    expect(Array.isArray(d.outside_work)).toBe(true);
    expect(Array.isArray(d.talking_points)).toBe(true);
    expect(d.outside_work).toHaveLength(0);
    expect(d.talking_points).toHaveLength(0);
    expect(d.confidence).toBe("low");
    expect(d.summary).toBe("");
  });

  it("returns safe defaults for a non-JSON string", () => {
    const d = normalizeDossier("not json at all");
    expect(d.identity.name).toBe("");
    expect(d.talking_points).toHaveLength(0);
    expect(d.confidence).toBe("low");
  });

  it("drops talking points and outside_work items missing a source_url", () => {
    const d = normalizeDossier({
      talking_points: [
        { point: "Sourced", why_it_works: "x", source_url: "https://ok.com" },
        { point: "Unsourced", why_it_works: "x" },
      ],
      outside_work: [
        { note: "Sourced note", source_url: "https://ok.com/2" },
        { note: "Unsourced note" },
      ],
    });
    expect(d.talking_points).toHaveLength(1);
    expect(d.talking_points[0].source_url).toBe("https://ok.com");
    expect(d.outside_work).toHaveLength(1);
    expect(d.outside_work[0].source_url).toBe("https://ok.com/2");
  });
});
