# Isolate Reproduction Agent

## Overview

Isolate converts incomplete bug reports into evidence-backed reproduction
reports by combining autonomous investigation with deterministic verification
inside disposable sandboxes.

## Authority Boundary

- The agent reads issues, inspects repositories, forms hypotheses, and selects
  probes.
- The runtime owns command execution, assertions, evidence, sandbox lifecycle,
  and final outcome validation.
- The agent must never claim `reproduced` without runtime-verified evidence.

## Scope

Initial support targets public Node.js and TypeScript terminal or CLI
repositories. Isolate does not modify upstream repositories, push branches,
open pull requests, or generate fixes.
