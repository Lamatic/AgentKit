import { NextResponse } from 'next/server';
import { runOpenApiDiff, normalizeDiff, triggerLamaticWorkflow } from '@/lib/sentinel';

export const maxDuration = 120;

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

    const typeA = typeof specA;
    const typeB = typeof specB;

    const isJsonObject = (value: unknown) =>
      typeof value === 'object' && value !== null && !Array.isArray(value);

    if (
      (typeA !== 'string' && !isJsonObject(specA)) ||
      (typeB !== 'string' && !isJsonObject(specB))
    ) {
      return NextResponse.json(
        { success: false, error: 'specA and specB must be string or JSON object.' },
        { status: 400 }
      );
    }

    const strA = typeA === 'string' ? specA : JSON.stringify(specA);
    const strB = typeB === 'string' ? specB : JSON.stringify(specB);
    const MAX_SIZE = 2 * 1024 * 1024; // 2 MB limit

    const encoder = new TextEncoder();

    if (
      encoder.encode(strA).byteLength > MAX_SIZE ||
      encoder.encode(strB).byteLength > MAX_SIZE
    ) {
      return NextResponse.json(
        { success: false, error: 'Spec payload exceeds 2 MB size limit.' },
        { status: 400 }
      );
    }

    // 1. Run local AST diff
    const rawDiff = await runOpenApiDiff(specA, specB);

    // 2. Normalize deterministic facts
    const facts = normalizeDiff(rawDiff, specA, specB);
    console.log(
      `[analyze-drift] normalized changeCount=${facts.allChanges.length} breaking=${facts.totalBreaking} risk=${facts.calculatedRisk}`
    );

    // 3. Build the sampleInput payload in the exact shape the LLM node's
    //    system prompt documents: { apiName, oldVersion, newVersion, changesCount, changes[] }
    const parseSpecInfo = (raw: any): { title?: string; version?: string } => {
      try {
        const obj = typeof raw === 'string' ? JSON.parse(raw) : raw;
        return { title: obj?.info?.title, version: obj?.info?.version };
      } catch {
        return {};
      }
    };
    const infoA = parseSpecInfo(specA);
    const infoB = parseSpecInfo(specB);

    const sampleInput = JSON.stringify({
      apiName: infoA.title || infoB.title || 'Target API',
      oldVersion: infoA.version || '1.0.0',
      newVersion: infoB.version || '2.0.0',
      changesCount: facts.allChanges.length,
      changes: facts.allChanges.map((c) => ({
        endpoint: c.endpoint,
        changeType: c.changeType,
        affectedField: c.affectedField,
        description: c.description,
      })),
    });

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