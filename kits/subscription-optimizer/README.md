# 1 Subscription Optimizer

An AI-powered agent designed to help users take control of their recurring expenses. This template analyzes a list of user subscriptions, identifies redundant services, calculates total costs, and provides actionable cost-saving recommendations.

## 2 The Problem
Users often lose track of their multiple monthly subscriptions across different categories (entertainment, software, utilities), leading to hidden costs and unnecessary expenses. While existing tools track costs, they fail to provide intelligent, context-aware optimization and recommendations.

## 3 The Solution
The **Subscription Optimizer** acts as an expert financial advisor. It takes raw subscription data and uses Lamatic's LLM nodes to:
1. **Categorize** each service (e.g., Music, Streaming, Productivity).
2. **Identify Redundancies** (e.g., pointing out that paying for both Spotify and Apple Music might be unnecessary).
3. **Calculate Total Costs** with smart currency awareness.
4. **Output Actionable Advice** in a structured JSON format, making it easy to integrate into existing personal finance apps.

## 4 How It Works
- **Input:** A list of the user's active subscriptions (Name, Price, Currency).
- **Processing (LLM):** The agent applies financial optimization logic to analyze the overlap between services.
- **Output:** A clean JSON response containing the total budget, categorized expenses, and specific recommendations on what to cancel or consolidate.

## 5 Getting Started
1. Import this template into your [Lamatic Studio](https://lamatic.ai).
2. Configure your preferred LLM provider in the node settings.
3. Pass your subscription list to the input node and test the flow!

---
*Created for the Lamatic.ai AgentKit Challenge by [@baranonala04](https://github.com/baranonala04)*