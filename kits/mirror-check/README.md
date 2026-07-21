# Mirror Check

Check yourself before you apply anywhere.

Write down what's on your GitHub, your portfolio, your resume, or your LinkedIn — your projects, your experience, what you've built — and get an honest first impression back, the kind of 10-second read a stranger would give your profile.

## What it does

Type in any combination of:
- What's on your GitHub: how many projects, what they do, how active you've been
- What's on your portfolio: the projects and work you show off
- Your resume, in your own words
- Your LinkedIn summary

You'll get back:
- **Hiring Score** (0–100)
- **Verdict** — a one-line judgment
- **First Impression** — the honest 10-second read a stranger would form
- **Strengths** — what's actually working, based on what you wrote
- **Red Flags** — anything missing, vague, or unclear, treated as a real problem, not excused
- **Technical Assessment**
- **Communication Assessment**
- **Would I Interview This Candidate?** — Yes or No
- **Top 3 Improvements** — concrete things to fix

The point is simple: see your own profile the way a stranger would, while you can still do something about it.

## How it works

This is a single-flow Template built entirely in Lamatic Studio:

```
Chat Widget → Generate JSON (Instructor LLM) → Chat Response
```

1. **Chat Widget** takes what you typed as `chatMessage`.
2. **Generate JSON** sends it to an LLM with a blunt hiring-manager prompt, which returns every field of the report in one go, plus a `formatted_report` string that's already laid out for the chat.
3. **Chat Response** shows `formatted_report` back to you.

No external APIs, no database, no environment variables, and no additional app — it runs entirely inside a deployed Lamatic flow.

## Try it

1. Deploy this flow in [Lamatic Studio](https://studio.lamatic.ai).
2. Open the Chat Widget.
3. Type in what's on your GitHub, portfolio, resume, or LinkedIn — one of these, or a mix.
4. Read what comes back.

## Notes

- Built and tested with `llama-3.3-70b-versatile` on Groq.
- Just one flow, nothing extra — no app, no backend, no setup beyond the LLM credential Lamatic Studio already manages.


