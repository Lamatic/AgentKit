# Speech Pacing & Rhetorical Evaluator

A Lamatic AgentKit template for evaluating speeches before live delivery.

## Problem

A speech can be grammatically polished and still fail in a timed presentation because it is too dense, difficult to articulate, or rhetorically front-loaded. Traditional word-count estimates do not account for linguistic complexity, jargon, acronyms, numbers, long sentences, or intentional pauses.

## What this agent does

Give it a speech draft and a target window such as 5–7 minutes. The evaluator returns:

- Projected speaking-time range using word count, baseline WPM, and complexity signals.
- Timing verdict against the target window.
- Content-density and pacing risks.
- Jargon and articulation flags.
- Opening, structure, audience connection, transitions, and conclusion scores.
- Specific commendations tied to the submitted draft.
- Three prioritized recommendations.
- Suggested pause and emphasis points.
- A focused rehearsal plan.

The evaluator explicitly distinguishes a draft-based timing estimate from measured speaking performance. Audio/video analysis is outside the scope of this template.

## Example input

```json
{
  "speech": "Good evening everyone... [complete speech draft]",
  "targetMinMinutes": 5,
  "targetMaxMinutes": 7,
  "speakerWpm": 130
}
```

If `speakerWpm` is omitted, the evaluator uses 130 WPM as its baseline assumption.

## Example output structure

```text
Executive verdict
Timing analysis
Pacing and density risks
Jargon and articulation flags
Rhetorical scorecard
Commendations
Priority recommendations
Pause and emphasis map
Rehearsal plan
```

## Why this is different

AgentKit contains text-generation and grammar-oriented kits, but this contribution focuses specifically on the spoken word as a timed performance artifact. Its evaluation dimensions combine temporal constraints with rhetorical structure and articulation risk rather than treating the draft as ordinary prose.

## Flow

`Speech Evaluation Request → Evaluate Speech → Evaluation Report`

The flow uses a dedicated constitution and externalized evaluator prompts so the evaluation criteria can evolve independently from the flow graph.

## Setup

1. Import or deploy the `speech-pacing-evaluator` flow in Lamatic Studio.
2. Configure an LLM provider available to your Lamatic project.
3. Invoke the GraphQL/API trigger with `speech`, `targetMinMinutes`, `targetMaxMinutes`, and optionally `speakerWpm`.
4. Review the returned evaluation and rehearse against the recommended timing/pause plan.

## Limitations

- Timing is an estimate, not a stopwatch measurement.
- The current flow evaluates text only; it cannot detect actual vocal rushing, filler words, pronunciation problems, volume, or pauses that differ from the draft.
- For highly technical speeches, domain terminology may be legitimate; jargon flags should therefore be treated as audience-dependent recommendations rather than automatic errors.
