# Exam Question Paper Generator 📝

An AI-powered exam question paper generator designed specifically for Indian students and teachers. Generate professional, board-aligned question papers for CBSE, ICSE, State boards, and Indian universities like VTU, Mumbai University in seconds.

## 🎯 Problem

Teachers in India spend 3-5 hours manually creating exam question papers. There is no quick, AI-powered tool that generates structured, board-aligned question papers with proper sections, mark distribution, and answer keys.

## ✅ Solution

This agent lets a teacher input basic details and instantly generates a complete, professional question paper with:

- **Section A** — Multiple Choice Questions (25% of marks)
- **Section B** — Short Answer Questions (35% of marks)
- **Section C** — Long Answer Questions (40% of marks)
- **Complete Answer Key**
- **Marking Scheme**
- **General Instructions**

## 📥 Inputs

| Field | Description | Example |
|-------|-------------|---------|
| `subject` | Subject name | Mathematics |
| `grade` | Class or semester | Grade 10 / Sem 4 |
| `board` | Education board | CBSE / VTU / ICSE |
| `topics` | Topics to cover | Algebra, Trigonometry |
| `difficulty` | Difficulty level | Easy / Medium / Hard |
| `total_marks` | Total marks | 80 |

## 📤 Output

A complete, professionally formatted exam question paper ready to print and distribute.

## 🚀 Setup

1. Import this flow into your Lamatic Studio project
2. Add your OpenAI or compatible LLM credentials
3. Deploy the flow
4. Send a POST request with the input fields

## 🧠 Example Request

```json
{
  "subject": "Physics",
  "grade": "Grade 12",
  "board": "CBSE",
  "topics": "Electrostatics, Current Electricity, Magnetism",
  "difficulty": "Medium",
  "total_marks": "70"
}
```

## 💡 Use Cases

- School teachers preparing for unit tests and final exams
- Coaching institutes generating practice papers
- EdTech platforms offering personalized assessments
- Students creating self-assessment papers for revision

## 🇮🇳 Why This Matters

India has over 1.5 million schools and thousands of colleges. Teachers across the country spend countless hours on question paper preparation. This tool saves hours of work and helps maintain quality and consistency in assessments.

## 🛠️ Built With

- Lamatic.ai AgentKit
- OpenAI GPT-4o-mini
- Prompt Engineering for Indian curriculum alignment
