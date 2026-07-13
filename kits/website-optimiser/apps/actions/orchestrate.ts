'use server';

import { Lamatic } from "lamatic";
import { getPageSpeedData } from "./pagespeed";
import lamaticConfig from "../../lamatic.config";

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

function normalizeReport(data: any): WebReviveReport {
  if (!data) return {} as any;
  return {
    websiteAnalysis: {
      businessName: data.websiteAnalysis?.businessName || "",
      industry: data.websiteAnalysis?.industry || "",
      mainServices: Array.isArray(data.websiteAnalysis?.mainServices) ? data.websiteAnalysis.mainServices : [],
      websiteStructure: Array.isArray(data.websiteAnalysis?.websiteStructure) ? data.websiteAnalysis.websiteStructure : [],
      techStack: Array.isArray(data.websiteAnalysis?.techStack) ? data.websiteAnalysis.techStack : [],
      contactInfo: data.websiteAnalysis?.contactInfo || null,
      socialLinks: Array.isArray(data.websiteAnalysis?.socialLinks) ? data.websiteAnalysis.socialLinks : [],
      overallImpression: data.websiteAnalysis?.overallImpression || "",
    },
    seoAudit: {
      score: typeof data.seoAudit?.score === "number" ? data.seoAudit.score : 0,
      metaTitle: {
        present: !!data.seoAudit?.metaTitle?.present,
        quality: data.seoAudit?.metaTitle?.quality || "",
        note: data.seoAudit?.metaTitle?.note || "",
      },
      metaDescription: {
        present: !!data.seoAudit?.metaDescription?.present,
        quality: data.seoAudit?.metaDescription?.quality || "",
        note: data.seoAudit?.metaDescription?.note || "",
      },
      h1: {
        present: !!data.seoAudit?.h1?.present,
        content: data.seoAudit?.h1?.content || null,
        note: data.seoAudit?.h1?.note || "",
      },
      openGraph: {
        present: !!data.seoAudit?.openGraph?.present,
        note: data.seoAudit?.openGraph?.note || "",
      },
      structuredData: {
        present: !!data.seoAudit?.structuredData?.present,
        note: data.seoAudit?.structuredData?.note || "",
      },
      issues: Array.isArray(data.seoAudit?.issues) ? data.seoAudit.issues : [],
      quickWins: Array.isArray(data.seoAudit?.quickWins) ? data.seoAudit.quickWins : [],
    },
    performance: {
      score: typeof data.performance?.score === "number" ? data.performance.score : 0,
      grade: data.performance?.grade || "",
      fcp: data.performance?.fcp || "",
      lcp: data.performance?.lcp || "",
      cls: data.performance?.cls || "",
      tbt: data.performance?.tbt || "",
      suggestions: Array.isArray(data.performance?.suggestions) ? data.performance.suggestions : [],
    },
    uiuxReview: {
      uiScore: typeof data.uiuxReview?.uiScore === "number" ? data.uiuxReview.uiScore : 0,
      uxScore: typeof data.uiuxReview?.uxScore === "number" ? data.uiuxReview.uxScore : 0,
      accessibilityScore: typeof data.uiuxReview?.accessibilityScore === "number" ? data.uiuxReview.accessibilityScore : 0,
      heroSection: {
        score: typeof data.uiuxReview?.heroSection?.score === "number" ? data.uiuxReview.heroSection.score : 0,
        notes: data.uiuxReview?.heroSection?.notes || "",
      },
      navigation: {
        score: typeof data.uiuxReview?.navigation?.score === "number" ? data.uiuxReview.navigation.score : 0,
        notes: data.uiuxReview?.navigation?.notes || "",
      },
      typography: {
        score: typeof data.uiuxReview?.typography?.score === "number" ? data.uiuxReview.typography.score : 0,
        notes: data.uiuxReview?.typography?.notes || "",
      },
      colorPalette: {
        score: typeof data.uiuxReview?.colorPalette?.score === "number" ? data.uiuxReview.colorPalette.score : 0,
        notes: data.uiuxReview?.colorPalette?.notes || "",
      },
      mobileResponsiveness: {
        score: typeof data.uiuxReview?.mobileResponsiveness?.score === "number" ? data.uiuxReview.mobileResponsiveness.score : 0,
        notes: data.uiuxReview?.mobileResponsiveness?.notes || "",
      },
      callToAction: {
        score: typeof data.uiuxReview?.callToAction?.score === "number" ? data.uiuxReview.callToAction.score : 0,
        notes: data.uiuxReview?.callToAction?.notes || "",
      },
      recommendations: Array.isArray(data.uiuxReview?.recommendations) ? data.uiuxReview.recommendations : [],
    },
    competitors: {
      list: Array.isArray(data.competitors?.list) ? data.competitors.list.map((c: any) => ({
        name: c?.name || "",
        website: c?.website || "",
        strengths: Array.isArray(c?.strengths) ? c.strengths : [],
        weaknesses: Array.isArray(c?.weaknesses) ? c.weaknesses : [],
        differentiator: c?.differentiator || "",
      })) : [],
      gapOpportunities: Array.isArray(data.competitors?.gapOpportunities) ? data.competitors.gapOpportunities : [],
      competitiveAdvantage: data.competitors?.competitiveAdvantage || "",
    },
    conversionAudit: {
      score: typeof data.conversionAudit?.score === "number" ? data.conversionAudit.score : 0,
      leadForms: {
        present: !!data.conversionAudit?.leadForms?.present,
        quality: data.conversionAudit?.leadForms?.quality || "",
      },
      trustSignals: {
        present: !!data.conversionAudit?.trustSignals?.present,
        detail: data.conversionAudit?.trustSignals?.detail || "",
      },
      socialProof: {
        present: !!data.conversionAudit?.socialProof?.present,
        detail: data.conversionAudit?.socialProof?.detail || "",
      },
      ctaEffectiveness: data.conversionAudit?.ctaEffectiveness || "",
      recommendations: Array.isArray(data.conversionAudit?.recommendations) ? data.conversionAudit.recommendations : [],
    },
    redesignSuggestions: {
      heroSection: data.redesignSuggestions?.heroSection || "",
      colorPalette: {
        primary: data.redesignSuggestions?.colorPalette?.primary || "",
        secondary: data.redesignSuggestions?.colorPalette?.secondary || "",
        accent: data.redesignSuggestions?.colorPalette?.accent || "",
        rationale: data.redesignSuggestions?.colorPalette?.rationale || "",
      },
      typography: {
        heading: data.redesignSuggestions?.typography?.heading || "",
        body: data.redesignSuggestions?.typography?.body || "",
        rationale: data.redesignSuggestions?.typography?.rationale || "",
      },
      navigationRedesign: data.redesignSuggestions?.navigationRedesign || "",
      sectionOrder: Array.isArray(data.redesignSuggestions?.sectionOrder) ? data.redesignSuggestions.sectionOrder : [],
      animationIdeas: Array.isArray(data.redesignSuggestions?.animationIdeas) ? data.redesignSuggestions.animationIdeas : [],
      premiumFeatures: Array.isArray(data.redesignSuggestions?.premiumFeatures) ? data.redesignSuggestions.premiumFeatures : [],
      mobileFirstImprovements: Array.isArray(data.redesignSuggestions?.mobileFirstImprovements) ? data.redesignSuggestions.mobileFirstImprovements : [],
      imagePrompt: data.redesignSuggestions?.imagePrompt || "",
    },
    copywriting: {
      headline: data.copywriting?.headline || "",
      subheadline: data.copywriting?.subheadline || "",
      primaryCTA: data.copywriting?.primaryCTA || "",
      secondaryCTA: data.copywriting?.secondaryCTA || "",
      aboutSection: data.copywriting?.aboutSection || "",
      valueProps: Array.isArray(data.copywriting?.valueProps) ? data.copywriting.valueProps : [],
      faqItems: Array.isArray(data.copywriting?.faqItems) ? data.copywriting.faqItems.map((f: any) => ({
        q: f?.q || "",
        a: f?.a || "",
      })) : [],
      footerTagline: data.copywriting?.footerTagline || "",
    },
    coldEmail: {
      subject: data.coldEmail?.subject || "",
      body: data.coldEmail?.body || "",
      followUp3Days: {
        subject: data.coldEmail?.followUp3Days?.subject || "",
        body: data.coldEmail?.followUp3Days?.body || "",
      },
      followUp7Days: {
        subject: data.coldEmail?.followUp7Days?.subject || "",
        body: data.coldEmail?.followUp7Days?.body || "",
      },
    },
    linkedinOutreach: {
      connectionRequest: data.linkedinOutreach?.connectionRequest || "",
      firstMessage: data.linkedinOutreach?.firstMessage || "",
      followUpMessage: data.linkedinOutreach?.followUpMessage || "",
      shortPitch: data.linkedinOutreach?.shortPitch || "",
    },
    proposal: {
      executiveSummary: data.proposal?.executiveSummary || "",
      problemsFound: Array.isArray(data.proposal?.problemsFound) ? data.proposal.problemsFound : [],
      proposedSolutions: Array.isArray(data.proposal?.proposedSolutions) ? data.proposal.proposedSolutions : [],
      projectGoals: Array.isArray(data.proposal?.projectGoals) ? data.proposal.projectGoals : [],
      timeline: Array.isArray(data.proposal?.timeline) ? data.proposal.timeline.map((t: any) => ({
        phase: t?.phase || "",
        duration: t?.duration || "",
        deliverables: Array.isArray(t?.deliverables) ? t.deliverables : [],
      })) : [],
      estimatedCost: {
        min: typeof data.proposal?.estimatedCost?.min === "number" ? data.proposal.estimatedCost.min : 0,
        max: typeof data.proposal?.estimatedCost?.max === "number" ? data.proposal.estimatedCost.max : 0,
        currency: data.proposal?.estimatedCost?.currency || "USD",
        notes: data.proposal?.estimatedCost?.notes || "",
      },
      maintenancePlan: data.proposal?.maintenancePlan || "",
      whyUs: data.proposal?.whyUs || "",
      callToAction: data.proposal?.callToAction || "",
    },
    finalReport: {
      overallScore: typeof data.finalReport?.overallScore === "number" ? data.finalReport.overallScore : 0,
      priorityFixes: Array.isArray(data.finalReport?.priorityFixes) ? data.finalReport.priorityFixes.map((pf: any) => ({
        rank: typeof pf?.rank === "number" ? pf.rank : 0,
        title: pf?.title || "",
        urgency: pf?.urgency || "",
        estimatedImpact: pf?.estimatedImpact || "",
      })) : [],
      estimatedBusinessImpact: data.finalReport?.estimatedBusinessImpact || "",
      executiveOneLiner: data.finalReport?.executiveOneLiner || "",
    },
  };
}

export async function analyzeWebsite(input: AnalysisInput): Promise<AnalysisResult> {
  const step = lamaticConfig.steps.find((s) => s.id === "webrevive-orchestrator");
  const envKey = step?.envKey;
  const flowId = envKey ? process.env[envKey] : undefined;
  if (!flowId) {
    return { success: false, error: `${envKey || "WEBREVIVE_FLOW_ID"} is not configured in .env.local` };
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

    let data: WebReviveReport = null as any;
    let parseFailed = false;
    let parsedObj: any = null;

    try {
      parsedObj = JSON.parse(jsonStr);
    } catch {
      // Try to extract JSON object from the response
      const match = jsonStr.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          parsedObj = JSON.parse(match[0]);
        } catch {
          parseFailed = true;
        }
      } else {
        parseFailed = true;
      }
    }

    if (!parseFailed && parsedObj) {
      data = normalizeReport(parsedObj);
    }

    // Fallback: If parse fails or structure is incomplete, package the raw response as a report so the user can verify connection
    if (parseFailed || !data || !parsedObj.websiteAnalysis || !parsedObj.seoAudit || !parsedObj.performance || !parsedObj.uiuxReview || !parsedObj.proposal || !parsedObj.finalReport) {
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
          competitiveAdvantage: "N/A",
        } as any,
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
