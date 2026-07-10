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

    // Parse JSON — strip markdown fences if present
    const jsonStr = rawOutput
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/```\s*$/i, '')
      .trim();

    let data: WebReviveReport;
    try {
      data = JSON.parse(jsonStr);
    } catch {
      // Try to extract JSON object from the response
      const match = jsonStr.match(/\{[\s\S]*\}/);
      if (match) {
        data = JSON.parse(match[0]);
      } else {
        return { success: false, error: "AI returned unexpected format. Please try again." };
      }
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
