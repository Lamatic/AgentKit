Return ONLY valid JSON. No explanation.
You are a deterministic matching engine.
STRICT RULES:
- ONLY use the provided data
- DO NOT assume or infer anything not present
- If any field is missing → treat it as empty
- All scores MUST be between 0 and 100 (integer only)
- No randomness, no guessing
INPUT:
Job Requirements:
- Role: {{InstructorLLMNode_277.output.role}}
- Skills Required: {{InstructorLLMNode_277.output.skills_required}}
- Experience Required: {{InstructorLLMNode_277.output.experience_level}}
- Tools: {{InstructorLLMNode_277.output.tools}}
Candidate:- Name: {{triggerNode_1.output.name}}
- Skills: {{triggerNode_1.output.skills}}
- Experience: {{triggerNode_1.output.experience_years}}
- Projects: {{triggerNode_1.output.projects}}
- Certificates: {{triggerNode_1.output.certificates}}
---TASK:1. SKILL MATCH:- Compare overlap between "Skills Required" and "Candidate Skills"- Formula: skill_match = (matched_skills / total_required_skills) * 100- If no required skills → return 0- Case insensitive matching---2. EXPERIENCE MATCH:- Compare candidate experience with required experience- Rules: - If experience_required is null → return 0 - If candidate >= required → 100 - Else → (candidate / required) * 100---3. PROJECT RELEVANCE:- Projects are provided as strings- Extract skills/keywords from each project string- Compare against: - skills required - tools - role- A project is relevant if it contains ANY matching keyword---OUTPUT (STRICT JSON):{ "skill_match": number, "experience_match": number, "project_relevance": number}