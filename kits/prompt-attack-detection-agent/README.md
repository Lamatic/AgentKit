## Contribution Type

- [x] Kit
- [ ] Template
- [ ] Bundle

## Summary

This PR adds a new AgentKit named **Prompt Attack Detection Agent**.

The kit analyzes user prompts for:

- Prompt Injection
- Jailbreak Attempts
- System Prompt Extraction
- Role Override
- Other malicious prompt attacks

The project includes:

- Exported Lamatic Flow
- Next.js frontend
- Lamatic SDK integration
- Environment configuration
- Documentation

## Validation Checklist

- [x] Flow exported from Lamatic Studio
- [x] apps/package.json included
- [x] .env.example included
- [x] README.md completed
- [x] agent.md completed
- [x] lamatic.config.ts completed
- [x] Flow tested locally
- [x] npm run dev works

## Folder Structure
kits/prompt-attack-detection-agent/
|
├── apps/
├── flows/
├── prompts/
├── model-configs/
├── constitutions/
├── README.md
├── agent.md
└── lamatic.config.ts