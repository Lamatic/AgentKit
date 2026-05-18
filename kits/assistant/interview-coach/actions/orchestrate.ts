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

  // Try all possible response structures
  const resultData =
    (raw?.result as Record<string, unknown>)?.output ??
    raw?.result ??
    raw?.output ??
    raw

  if (resultData && typeof resultData === 'object') {
    return { success: true, data: resultData as InterviewCoachResult }
  }

  // Fallback: try parsing as string
  const outputText =
    (raw?.result as string) ??
    (raw?.output as string) ??
    JSON.stringify(raw)

  let parsed: InterviewCoachResult
  try {
    const cleaned = outputText.replace(/```json|```/g, '').trim()
    parsed = JSON.parse(cleaned)
  } catch {
    parsed = {
      technicalQuestions: [],
      behavioralQuestions: [],
      answerTips: [],
      companyInsights: [],
      ninetyDayPlan: { first30: [], next30: [], final30: [] },
      quickSummary: String(outputText),
    }
  }

  return { success: true, data: parsed }
}