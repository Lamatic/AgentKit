User skills:
{{codeNode_872.output.skills}}
Missing skills:
{{InstructorLLMNode_991.output.missing_skills}}
Target domain:
{{triggerNode_1.output.domain}}
Estimate a readiness score from 0 to 100.
Rules:
- More missing skills = lower score
- Fewer missing skills = higher score
- Beginner with some skills = 40–70 range
Return JSON:
{
"readiness_score": number
}