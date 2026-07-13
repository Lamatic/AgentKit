# Learning Path Replanner

Learning Path Replanner is an adaptive study planning agent for students who are behind schedule or struggling with weak topics.

## Purpose

Students often create study plans but fall behind because they miss sessions, misunderstand topics, or underestimate difficulty. This agent analyzes the student's goal, syllabus, completed work, weak areas, missed sessions, recent quiz performance, and available time to produce a practical recovery path.

## Flow Description

The template uses two LLM nodes:

```text
API Request -> Diagnose Learning Gaps -> Generate Recovery Plan -> Response
```

1. `Diagnose Learning Gaps` analyzes progress, weak topics, missed sessions, quiz signals, and priority ranking.
2. `Generate Recovery Plan` uses that diagnosis and the original inputs to create a complete recovery plan.

## Required Inputs

- `studentAlias`: Anonymous learner label, for example `Student A`.
- `learningGoal`: Target result or exam objective.
- `subject`: Subject being studied.
- `syllabusTopics`: Full topic list.
- `completedTopics`: Topics already covered.
- `weakTopics`: Topics the student finds difficult.
- `missedStudySessions`: Missed progress or schedule slippage.
- `recentQuizPerformance`: Score and mistake patterns.
- `availableDays`: Time left for recovery.
- `dailyStudyTime`: Study time available per day.
- `preferredLearningStyle`: Format that helps the learner best.

## Output

The response contains:

- `learningDiagnosis`
- `adaptiveRecoveryPlan`

The final plan includes a recovery schedule, topic priority map, micro-lessons, checkpoint quiz, answer key, catch-up strategy, daily tracking checklist, risk alerts, and next review point.

## Guardrails

- Do not request or expose personally identifiable student information.
- Refer to the learner only as `the student` or by the provided alias.
- Do not invent syllabus progress or quiz details when missing.
- Clearly state missing information and make reasonable planning assumptions.
- Keep feedback supportive, practical, and specific to the student's goal and available time.

## Integration Reference

The API response shape is:

```json
{
  "learningDiagnosis": "...",
  "adaptiveRecoveryPlan": "..."
}
```
