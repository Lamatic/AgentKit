import { NextRequest, NextResponse } from 'next/server';
import { executeIndieFounderRadarFlow } from '@/lib/lamatic-client';
import { parseReportText } from '@/lib/parse-report';

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, error: 'Invalid JSON payload.' },
      { status: 400 }
    );
  }

  const idea =
    typeof (body as { idea?: unknown })?.idea === 'string'
      ? (body as { idea: string }).idea.trim()
      : '';

  // Enforce server-side 5–1,000-character limits to prevent resource exhaustion (CWE-770)
  if (!idea || idea.length < 5) {
    return NextResponse.json(
      { success: false, error: 'Please enter a startup idea with at least 5 characters.' },
      { status: 400 }
    );
  }

  if (idea.length > 1000) {
    return NextResponse.json(
      { success: false, error: 'Idea description must be under 1000 characters.' },
      { status: 400 }
    );
  }

  try {
    // Call Lamatic flow with request signal and bounded timeout
    const execution = await executeIndieFounderRadarFlow(idea, {
      signal: req.signal,
      timeoutMs: 60_000,
    });

    // Extract raw text from workflow result
    let rawReportText = '';
    const result = execution.result;

    if (typeof result === 'string') {
      rawReportText = result;
    } else if (result && typeof result === 'object') {
      const resObj = result as Record<string, unknown>;
      if (typeof resObj.report === 'string') {
        rawReportText = resObj.report;
      } else if (typeof resObj.generatedResponse === 'string') {
        rawReportText = resObj.generatedResponse;
      } else if (typeof resObj.output === 'string') {
        rawReportText = resObj.output;
      } else {
        rawReportText = JSON.stringify(result, null, 2);
      }
    }

    if (!rawReportText) {
      rawReportText = 'No text output returned by the model.';
    }

    const report = parseReportText(rawReportText, idea, execution.latencyMs);

    return NextResponse.json({
      success: true,
      report,
      requestId: execution.requestId,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : 'Unknown error occurred while analyzing startup idea.';

    const isTimeout =
      (error instanceof Error && error.name === 'TimeoutError') ||
      message.toLowerCase().includes('timed out') ||
      message.toLowerCase().includes('timeout');

    if (isTimeout) {
      return NextResponse.json(
        {
          success: false,
          error: 'Gateway Timeout: The Lamatic workflow took too long to complete. Please try again.',
        },
        { status: 504 }
      );
    }

    const isAborted =
      (error instanceof Error && error.name === 'AbortError') ||
      message.toLowerCase().includes('aborted');

    if (isAborted) {
      return NextResponse.json(
        {
          success: false,
          error: 'Request was cancelled by the client.',
        },
        { status: 499 }
      );
    }

    console.error('Error executing Indie Founder Radar flow:', error);
    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 }
    );
  }
}
