'use server';

import { Lamatic } from "lamatic";
import { getPageSpeedData } from "./pagespeed";

const lamatic = new Lamatic({
  endpoint: process.env.LAMATIC_API_URL || "",
  projectId: process.env.LAMATIC_PROJECT_ID || null,
  apiKey: process.env.LAMATIC_API_KEY || null,
});

export interface AnalysisInput {
  url: string;
  businessName?: string;
  industry?: string;
  targetService?: string;
}

export interface AnalysisResult {
  success: boolean;
  data?: WebReviveReport;
  error?: string;
  pageSpeedError?: string;
}

// ── Type definitions matching the AI output schema ────────────

export interface IssueItem {
  title: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  detail?: string;
  fix?: string;
  impact?: string;
  reasoning?: string;
  suggestion?: string;
  area?: string;
  estimatedGain?: string;
  expectedLift?: string;
}

export interface WebReviveReport {
  websiteAnalysis: {
    businessName: string;
    industry: string;
    mainServices: string[];
    websiteStructure: string[];
    techStack: string[];
    contactInfo: string | null;
    socialLinks: string[];
    overallImpression: string;
  };
  seoAudit: {
    score: number;
    metaTitle: { present: boolean; quality: string; note: string };
    metaDescription: { present: boolean; quality: string; note: string };
    h1: { present: boolean; content: string | null; note: string };
    openGraph: { present: boolean; note: string };
    structuredData: { present: boolean; note: string };
    issues: IssueItem[];
    quickWins: string[];
  };
  performance: {
    score: number;
    grade: string;
    fcp: string;
    lcp: string;
    cls: string;
    tbt: string;
    suggestions: IssueItem[];
  };
  uiuxReview: {
    uiScore: number;
    uxScore: number;
    accessibilityScore: number;
    heroSection: { score: number; notes: string };
    navigation: { score: number; notes: string };
    typography: { score: number; notes: string };
    colorPalette: { score: number; notes: string };
    mobileResponsiveness: { score: number; notes: string };
    callToAction: { score: number; notes: string };
    recommendations: IssueItem[];
  };
  competitors: {
    list: Array<{ name: string; website: string; strengths: string[]; weaknesses: string[]; differentiator: string }>;
    gapOpportunities: string[];
    competitiveAdvantage: string;
  };
  conversionAudit: {
    score: number;
    leadForms: { present: boolean; quality: string };
    trustSignals: { present: boolean; detail: string };
    socialProof: { present: boolean; detail: string };
    ctaEffectiveness: string;
    recommendations: IssueItem[];
  };
  redesignSuggestions: {
    heroSection: string;
    colorPalette: { primary: string; secondary: string; accent: string; rationale: string };
    typography: { heading: string; body: string; rationale: string };
    navigationRedesign: string;
    sectionOrder: string[];
    animationIdeas: string[];
    premiumFeatures: string[];
    mobileFirstImprovements: string[];
    imagePrompt: string;
  };
  copywriting: {
    headline: string;
    subheadline: string;
    primaryCTA: string;
    secondaryCTA: string;
    aboutSection: string;
    valueProps: string[];
    faqItems: Array<{ q: string; a: string }>;
    footerTagline: string;
  };
  coldEmail: {
    subject: string;
    body: string;
    followUp3Days: { subject: string; body: string };
    followUp7Days: { subject: string; body: string };
  };
  linkedinOutreach: {
    connectionRequest: string;
    firstMessage: string;
    followUpMessage: string;
    shortPitch: string;
  };
  proposal: {
    executiveSummary: string;
    problemsFound: string[];
    proposedSolutions: string[];
    projectGoals: string[];
    timeline: Array<{ phase: string; duration: string; deliverables: string[] }>;
    estimatedCost: { min: number; max: number; currency: string; notes: string };
    maintenancePlan: string;
    whyUs: string;
    callToAction: string;
  };
  finalReport: {
    overallScore: number;
    priorityFixes: Array<{ rank: number; title: string; urgency: string; estimatedImpact: string }>;
    estimatedBusinessImpact: string;
    executiveOneLiner: string;
  };
}

export async function analyzeWebsite(input: AnalysisInput): Promise<AnalysisResult> {
  const flowId = process.env.WEBREVIVE_FLOW_ID;
  if (!flowId) {
    return { success: false, error: "WEBREVIVE_FLOW_ID is not configured in .env.local" };
  }

  // Fetch real PageSpeed data in parallel with flow setup
  const pageSpeedPromise = getPageSpeedData(input.url);

  try {
    const pageSpeedData = await pageSpeedPromise;

    const res = await lamatic.executeFlow(flowId, {
      url: input.url,
      businessName: input.businessName || '',
      industry: input.industry || '',
      targetService: input.targetService || 'Website Redesign',
      pageSpeedData: JSON.stringify(pageSpeedData),
    });

    if (res.status === "error") {
      return { success: false, error: res.message || "Workflow execution failed" };
    }

    // Extract raw text output from Lamatic response
    const rawOutput: string =
      res.result?.output ||
      res.result?.LLMNode_1?.output ||
      (typeof res.result === 'string' ? res.result : JSON.stringify(res.result));

    console.log("=== RAW AI OUTPUT RECEIVED ===");
    console.log(rawOutput);
    console.log("==============================");

    // Parse JSON — strip markdown fences if present
    const jsonStr = rawOutput
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/```\s*$/i, '')
      .trim();

    let data: WebReviveReport = null as any;
    let parseFailed = false;

    try {
      data = JSON.parse(jsonStr);
    } catch {
      // Try to extract JSON object from the response
      const match = jsonStr.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          data = JSON.parse(match[0]);
        } catch {
          parseFailed = true;
        }
      } else {
        parseFailed = true;
      }
    }

    // Fallback: If parse fails or structure is incomplete, package the raw response as a report so the user can verify connection
    if (parseFailed || !data || !data.websiteAnalysis || !data.seoAudit || !data.performance || !data.uiuxReview || !data.proposal || !data.finalReport) {
      data = {
        websiteAnalysis: {
          businessName: "Raw Output Mode (JSON Parsing Failed)",
          industry: input.industry || "Not Specified",
          mainServices: ["Audit Result Analysis"],
          websiteStructure: ["Response Captured"],
          techStack: ["Unknown"],
          contactInfo: "N/A",
          socialLinks: [],
          overallImpression: "A connection was successfully established with Lamatic! However, the AI returned text instead of the requested JSON structure. You can view the raw text below.",
        },
        seoAudit: {
          score: 0,
          metaTitle: { present: false, quality: "missing", note: "N/A" },
          metaDescription: { present: false, quality: "missing", note: "N/A" },
          h1: { present: false, content: null, note: "N/A" },
          openGraph: { present: false, note: "N/A" },
          structuredData: { present: false, note: "N/A" },
          issues: [{ title: "Non-JSON Response", priority: "critical", detail: rawOutput, fix: "Make sure your flow's LLM node is using the WebRevive system prompt and a model that outputs valid JSON.", impact: "Low usability" }],
          quickWins: [],
        },
        performance: {
          score: pageSpeedData.error ? 0 : pageSpeedData.performanceScore,
          grade: pageSpeedData.error ? "F" : (pageSpeedData.performanceScore >= 90 ? 'A' : pageSpeedData.performanceScore >= 70 ? 'B' : pageSpeedData.performanceScore >= 50 ? 'C' : 'D'),
          fcp: pageSpeedData.fcp,
          lcp: pageSpeedData.lcp,
          cls: pageSpeedData.cls,
          tbt: pageSpeedData.tbt,
          suggestions: [],
        },
        uiuxReview: {
          uiScore: 0,
          uxScore: 0,
          accessibilityScore: 0,
          heroSection: { score: 0, notes: "N/A" },
          navigation: { score: 0, notes: "N/A" },
          typography: { score: 0, notes: "N/A" },
          colorPalette: { score: 0, notes: "N/A" },
          mobileResponsiveness: { score: 0, notes: "N/A" },
          callToAction: { score: 0, notes: "N/A" },
          recommendations: [],
        },
        competitors: {
          list: [],
          gapOpportunities: [],
           d: "",
          competitiveAdvantage: "N/A",
        } as any, // fallback typings
        conversionAudit: {
          score: 0,
          leadForms: { present: false, quality: "N/A" },
          trustSignals: { present: false, detail: "N/A" },
          socialProof: { present: false, detail: "N/A" },
          ctaEffectiveness: "weak",
          recommendations: [],
        },
        redesignSuggestions: {
          heroSection: "N/A",
          colorPalette: { primary: "#000", secondary: "#000", accent: "#000", rationale: "N/A" },
          typography: { heading: "N/A", body: "N/A", rationale: "N/A" },
          navigationRedesign: "N/A",
          sectionOrder: [],
          animationIdeas: [],
          premiumFeatures: [],
          mobileFirstImprovements: [],
          imagePrompt: "N/A",
        },
        copywriting: {
          headline: "N/A",
          subheadline: "N/A",
          primaryCTA: "N/A",
          secondaryCTA: "N/A",
          aboutSection: "N/A",
          valueProps: [],
          faqItems: [],
          footerTagline: "N/A",
        },
        coldEmail: {
          subject: "Audit Result Ready",
          body: rawOutput,
          followUp3Days: { subject: "N/A", body: "N/A" },
          followUp7Days: { subject: "N/A", body: "N/A" },
        },
        linkedinOutreach: {
          connectionRequest: "N/A",
          firstMessage: "N/A",
          followUpMessage: "N/A",
          shortPitch: "N/A",
        },
        proposal: {
          executiveSummary: "N/A",
          problemsFound: [],
          proposedSolutions: [],
          projectGoals: [],
          timeline: [],
          estimatedCost: { min: 0, max: 0, currency: "USD", notes: "N/A" },
          maintenancePlan: "N/A",
          whyUs: "N/A",
          callToAction: "N/A",
        },
        finalReport: {
          overallScore: 0,
          priorityFixes: [],
          estimatedBusinessImpact: "N/A",
          executiveOneLiner: "Successfully connected to Lamatic! Flow returned unstructured response.",
        },
      };
    }

    // Overlay real PageSpeed data if we got it
    if (!pageSpeedData.error && data.performance) {
      data.performance.score = pageSpeedData.performanceScore || data.performance.score;
      data.performance.fcp = pageSpeedData.fcp !== 'N/A' ? pageSpeedData.fcp : data.performance.fcp;
      data.performance.lcp = pageSpeedData.lcp !== 'N/A' ? pageSpeedData.lcp : data.performance.lcp;
      data.performance.cls = pageSpeedData.cls !== 'N/A' ? pageSpeedData.cls : data.performance.cls;
      data.performance.tbt = pageSpeedData.tbt !== 'N/A' ? pageSpeedData.tbt : data.performance.tbt;
      // Recalculate grade
      const score = data.performance.score;
      data.performance.grade = score >= 90 ? 'A' : score >= 70 ? 'B' : score >= 50 ? 'C' : score >= 30 ? 'D' : 'F';
    }

    return {
      success: true,
      data,
      pageSpeedError: pageSpeedData.error,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to analyze website",
    };
  }
}
