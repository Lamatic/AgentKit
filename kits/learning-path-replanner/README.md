# Learning Path Replanner

Learning Path Replanner helps students recover from missed study progress by diagnosing weak topics, reprioritizing syllabus areas, and generating an adaptive day-by-day recovery plan with micro-lessons and checkpoint quizzes.

This template is useful when a learner has fallen behind, performed poorly on a recent quiz, or needs a focused revision path before an exam.

## What it does

- Diagnoses weak areas from syllabus progress, missed sessions, and quiz performance.
- Ranks topics by learning risk and exam priority.
- Builds a recovery schedule based on available days and daily study time.
- Creates micro-lessons for the most important weak topics.
- Generates a checkpoint quiz with answer hints.
- Provides a daily tracking checklist and risk alerts.

## Flow

```text
API Request -> Diagnose Learning Gaps -> Generate Recovery Plan -> Response
```

## Input schema

```json
{
  "studentAlias": "Student A",
  "learningGoal": "Score above 85% in Class 10 Mathematics board exam",
  "subject": "Mathematics",
  "syllabusTopics": "Linear equations, quadratic equations, arithmetic progression, triangles, coordinate geometry, trigonometry, statistics, probability",
  "completedTopics": "Linear equations, arithmetic progression, statistics",
  "weakTopics": "Quadratic equations, trigonometry, triangles",
  "missedStudySessions": "Missed 4 study sessions in the last 2 weeks due to school assignments",
  "recentQuizPerformance": "Scored 42%. Most mistakes were in applying formulas, sign errors in quadratic equations, and confusing trigonometric ratios.",
  "availableDays": "10 days",
  "dailyStudyTime": "90 minutes per day",
  "preferredLearningStyle": "Step-by-step examples followed by practice questions"
}
```

## Output

The flow returns:

- `learningDiagnosis`: a structured analysis of progress, weak topics, missed-session impact, quiz signals, and priority ranking.
- `adaptiveRecoveryPlan`: a day-by-day recovery plan with topic priorities, micro-lessons, checkpoint quiz, answer key, catch-up strategy, daily checklist, risk alerts, and next review point.

## Privacy

The template does not require real student names. Use an alias such as `Student A`. The prompts instruct the model not to ask for or expose personally identifiable information.

## Use cases

- Exam recovery planning
- Weak-topic diagnosis
- Catch-up planning after missed study sessions
- Personalized revision planning
- Student coaching and study support
