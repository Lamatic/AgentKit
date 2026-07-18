Audit mode: {{triggerNode_1.output.auditMode}}

Contract name, if supplied: {{triggerNode_1.output.contractName}}

Additional focus areas, if supplied: {{triggerNode_1.output.focusAreas}}

Review this Solidity source code:

```solidity
{{triggerNode_1.output.contractCode}}
```

Apply the requested audit mode:

- security: prioritize exploitable vulnerabilities such as reentrancy, unsafe external calls, access-control failures, oracle assumptions, unchecked return values, dangerous delegatecall, denial-of-service risks, authorization bypasses, signature replay, upgradeability hazards, and missing validation.
- gas: prioritize gas inefficiencies such as unnecessary storage reads/writes, poor data location, avoidable loops, expensive modifiers, suboptimal visibility, redundant checks, event/storage tradeoffs, and caching opportunities.
- best-practices: prioritize maintainability, NatSpec, events, custom errors, modifier clarity, testability, dependency assumptions, compiler/version concerns, and operational readiness.
- comprehensive: review security, gas, and best-practice concerns together, then prioritize the highest-impact items.

Return only the JSON object described by the system prompt.
