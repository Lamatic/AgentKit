Write a cold outreach message for this lead.
Lead name: {{triggerNode_1.output.name}}
Company:{{triggerNode_1.output.company}}
Website: {{triggerNode_1.output.website}}
Desired tone: {{triggerNode_1.output.tone}}
Using what you reliably know about this company from its name and website, write:
1. A subject line (max 60 characters).
2. A personalised cold email (90-130 words) that opens with a specific, relevant observation about the company, connects it to a clear value proposition, and ends with a soft call to action. Match the requested tone.
3. A short follow-up message (40-70 words) for when there's no reply.
Return ONLY this JSON, no markdown, no code fences:
{"subject": "...", "email": "...", "followUp": "..."}