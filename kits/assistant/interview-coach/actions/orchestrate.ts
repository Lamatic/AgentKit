'use server'

import { lamaticClient } from '@/lib/lamatic-client'

export interface InterviewCoachInput {
  jobRole: string
  company: string
  background: string
  experienceLevel: string
}

export interface InterviewCoachResult {
  technicalQuestions: string[]
  behavioralQuestions: string[]
  answerTips: string[]
  companyInsights: string[]
  ninetyDayPlan: {
    first30: string[]
    next30: string[]
    final30: string[]
  }
  quickSummary: string
}

export interface ActionResult {
  success: boolean
  data?: InterviewCoachResult
  error?: string
}

export async function runInterviewCoach(
  input: InterviewCoachInput
): Promise<ActionResult> {
  let raw: Record<string, unknown>

  try {
    raw = await lamaticClient.executeFlow(
      process.env.LAMATIC_FLOW_ID!,
      {
        jobRole: input.jobRole,
        company: input.company,
        background: input.background,
        experienceLevel: input.experienceLevel,
      }
    ) as Record<string, unknown>
  } catch (e) {
    return { success: false, error: `Lamatic flow error: ${e}` }
  }

  const resultData =
    (raw?.result as Record<string, unknown>)?.output ??
    raw?.result ??
    raw?.output ??
    raw

  const safe = (resultData ?? {}) as Partial<InterviewCoachResult>

  return {
    success: true,
    data: {
      quickSummary: safe.quickSummary ?? '',
      technicalQuestions: safe.technicalQuestions ?? [],
      behavioralQuestions: safe.behavioralQuestions ?? [],
      answerTips: safe.answerTips ?? [],
      companyInsights: safe.companyInsights ?? [],
      ninetyDayPlan: {
        first30: safe.ninetyDayPlan?.first30 ?? [],
        next30: safe.ninetyDayPlan?.next30 ?? [],
        final30: safe.ninetyDayPlan?.final30 ?? [],
      }
    }
  }
}