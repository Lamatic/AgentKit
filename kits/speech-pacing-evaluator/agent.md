# Speech Pacing & Rhetorical Evaluator

## Overview

This AgentKit flow acts as a rigorous evaluator for spoken presentations. It accepts a speech draft and a target time window, estimates delivery time using both word count and linguistic complexity, identifies phrases likely to slow delivery, and evaluates rhetorical structure.

The kit is designed for high-stakes presentations, Toastmasters speeches, interviews, executive briefings, sales pitches, conference talks, and other timed speaking situations where a written draft can look strong but fail at delivery speed or audience comprehension.

## Inputs

- `speech`: the complete speech draft as plain text.
- `targetMinMinutes`: minimum acceptable speaking time.
- `targetMaxMinutes`: maximum acceptable speaking time.
- `speakerWpm` (optional): baseline words-per-minute assumption. Defaults to 130 WPM.

## Evaluation pipeline

1. Normalize and measure the draft.
2. Calculate word count, sentence count, average sentence length, lexical density, and a complexity-adjusted WPM estimate.
3. Compare projected duration with the requested time window.
4. Detect dense jargon, long phrases, overloaded sentences, repeated concepts, and likely breath/pause points.
5. Assess rhetorical architecture: opening hook, thesis/promise, transitions, evidence/story progression, audience relevance, callback/cohesion, and conclusion.
6. Produce a structured report with commendations, risks, prioritized recommendations, and a revised pacing plan.

## Output

The response should contain:

- Timing verdict and projected duration.
- Timing range based on baseline and complexity-adjusted delivery.
- Pacing risk level.
- Content-density assessment.
- Jargon/complexity flags with suggested simplifications.
- Opening score and explanation.
- Rhetorical structure score.
- Conclusion score and explanation.
- Top strengths.
- Top three improvements, prioritized by impact.
- Suggested pause/emphasis map.
- A concise rehearsal plan.

## Timing model

Do not claim that word count can predict an individual's exact speaking time. Use it as an estimate. Start from the speaker's supplied WPM or the 130 WPM default, then widen the estimate when sentence complexity, punctuation, parentheticals, numbers, acronyms, or dense terminology indicate additional cognitive and articulation load.

## Guardrails

- Evaluate the speech, not the person.
- Do not infer protected or sensitive personal attributes from writing style.
- Do not invent delivery observations that require audio/video evidence. Label them as draft-based risks.
- Do not present estimated timing as measured performance.
- Preserve the speaker's intended meaning when recommending edits.
- Avoid generic praise; every commendation should point to an observable feature of the draft.
