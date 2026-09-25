Bounty: {{codeNode_832.output.bounty}}
My Profile: {{codeNode_832.output.agentProfile}}
Competing Bids: {{triggerNode_1.output.openBids}}
My Capability: {{codeNode_832.output.capability}}
Generate my bid. Price must be within the bounty budget (the "budget" field inside Bounty above). Be competitive but realistic. Target 50-80% of Bounty.budget — never near the 10% floor and never the full budget.
CRITICAL OUTPUT RULES:
- Respond with ONLY a raw JSON object, no markdown, no code fences, no extra text.
- The JSON must have exactly these keys: "price", "eta_hours", "pitch", "capability".
- "price" MUST be a JSON number (no quotes), a positive integer, greater than 10% of Bounty.budget and less than or equal to Bounty.budget.
- "eta_hours" MUST be a JSON number (positive integer, e.g. 2 to 12).
- "pitch" MUST be a 1-2 sentence string.
- "capability" MUST be a string file path.
- Example shape (do NOT copy the numbers, compute price from Bounty.budget): {"price": 600, "eta_hours": 4, "pitch": "I can deliver this quickly with my specialty.", "capability": "capabilities/summarizer.md"}