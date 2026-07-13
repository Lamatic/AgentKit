# Git Commit Message Generator

An AI-powered tool that generates perfect conventional commit messages from a git diff.

## What It Does

Paste any git diff output and get an instant, properly formatted commit message following the Conventional Commits specification.

Example output:

feat(auth): add JWT token refresh endpoint

## Setup

1. Import the flow into your Lamatic Studio project
2. Deploy the flow
3. Call via GraphQL API with your git diff as input

## Usage

Send a request with your diff:

{ "git_diff": "diff --git a/src/auth.ts b/src/auth.ts\n..." }

## Commit Types

| Type | When to use |
|---|---|
| feat | New feature |
| fix | Bug fix |
| docs | Documentation only |
| style | Formatting, no logic change |
| refactor | Code restructure |
| test | Adding tests |
| chore | Build process, tooling |

## Stack

- Lamatic.ai — AI flow orchestration
- LLM — Commit message generation
