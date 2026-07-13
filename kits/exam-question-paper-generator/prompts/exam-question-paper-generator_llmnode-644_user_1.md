# User Prompt — Exam Question Paper Generator

Generate a complete exam question paper with the following details:

Subject: {{subject}}
Grade/Class: {{grade}}
Board/University: {{board}}
Topics to Cover: {{topics}}
Difficulty Level: {{difficulty}}
Total Marks: {{total_marks}}

Important instructions for mark allocation:
- Total marks must be exactly {{total_marks}} — no more, no less
- Use only whole integer marks per question — no fractions or decimals
- Distribute marks across sections: Section A = 25%, Section B = 35%, Section C = 40%
- Round to nearest integer and adjust the last question if needed to ensure sections sum exactly to {{total_marks}}

Please generate a well-structured question paper with the following sections:

SECTION A — Multiple Choice Questions (25% of total marks)
- 4 options per question (a, b, c, d)
- Do NOT include the correct answer in the question body — answers go only in the Answer Key at the end

SECTION B — Short Answer Questions (35% of total marks)
- 2-4 lines expected per answer
- Do NOT include model answers in the question body — answers go only in the Answer Key at the end

SECTION C — Long Answer Questions (40% of total marks)
- Detailed answers expected
- Include mark-wise breakdown per question
- Do NOT include model answers in the question body — answers go only in the Answer Key at the end

At the end include a separate ANSWER KEY AND MARKING SCHEME section with:
- Section A: correct option for each MCQ
- Section B: model answers
- Section C: detailed model answers with mark-wise breakdown

Include General Instructions at the very top of the question paper.

Format the entire paper professionally like a real Indian board exam paper.
