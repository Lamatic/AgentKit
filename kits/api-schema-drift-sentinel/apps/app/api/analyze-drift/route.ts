import { NextResponse } from 'next/server';
import { runOpenApiDiff, normalizeDiff, triggerLamaticWorkflow } from '@/lib/sentinel';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { specA, specB } = body;

    if (!specA || !specB) {
      return NextResponse.json(
        { success: false, error: 'Both specA and specB are required.' },
        { status: 400 }
      );
    }

    // 1. Run local AST diff
    const rawDiff = await runOpenApiDiff(specA, specB);
    console.dir({ 'STAGE 1: RAW_DIFF': rawDiff }, { depth: null });

    // 2. Normalize deterministic facts
    const facts = normalizeDiff(rawDiff, specA, specB);
    console.dir({ 'STAGE 2: NORMALIZED_FACTS': facts }, { depth: null });

    // 3. Format lines for AI context
    const factLines = facts.allChanges.map(
      (c) => `Endpoint: ${c.endpoint} | Field: ${c.field} | Action: ${c.action} | Severity: ${c.severity} | Before: ${c.before} | After: ${c.after}`
    );

    const sampleInput = `DETERMINISTIC API SCHEMA FACTS:\n${factLines.join('\n')}`;

    console.log('--- STAGE 3: SAMPLE_INPUT SENT TO LAMATIC ---');
    console.log(sampleInput);

    // 4. Call Lamatic with error isolation
    let aiResult: any = {};
    try {
      aiResult = await triggerLamaticWorkflow({ sampleInput });
    } catch (lamaticError: any) {
      console.error('--- LAMATIC WORKFLOW ERROR ---', lamaticError?.message || lamaticError);
      aiResult = {
        executiveSummary: 'AI narrative synthesis failed. Displaying deterministic facts.',
      };
    }

    // 5. Parse response safely
    let formattedAiData = aiResult;
    if (typeof aiResult === 'string') {
      try {
        formattedAiData = JSON.parse(aiResult);
      } catch {
        formattedAiData = { executiveSummary: aiResult };
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        ...formattedAiData,
        breakingCount: facts.totalBreaking,
        nonBreakingCount: facts.totalNonBreaking,
        riskLevel: facts.calculatedRisk,
        changes: facts.allChanges,
      },
    });
  } catch (error: any) {
    console.error('--- ANALYZE DRIFT ROUTE ERROR ---', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
