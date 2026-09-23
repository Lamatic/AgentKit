# Demo Video Script

1. Open the SQL Performance Tuner app and show the preloaded slow query:

   ```sql
   SELECT customer_id, SUM(total) AS revenue
   FROM orders
   WHERE created_at >= '2026-01-01'
   GROUP BY customer_id
   ```

2. Explain that the app first measures the original SQLite query locally:
   baseline result digest, `EXPLAIN QUERY PLAN`, and repeated median runtime.

3. Switch to **Live Lamatic** and run the tuner. Point out that the Lamatic
   strategist proposes one experiment at a time from measured evidence, not a
   fixed checklist.

4. Show the experiment timeline:
   strategist hypothesis and strategy, exact SQL candidate, deterministic local
   equivalence check, measured timing, speedup, and observation.

5. Emphasize the safety boundary: candidates run only inside fresh in-memory
   SQLite copies. The model can propose SQL, but local code rejects unsafe SQL,
   non-equivalent rewrites, duplicate/equivalent indexes, and sub-threshold
   speedups.

6. Show the proven winner. In the successful live smoke test, the app selected
   the measured winner deterministically and reported a `1.44x` result-equivalent
   speedup.

7. Scroll to the reviewer section. Explain that the Lamatic reviewer writes the
   headline, evidence summary, recommendation, limitations, and cited experiment
   numbers, but cannot change the selected winner.

8. Demonstrate a no-improvement case by running:

   ```sql
   SELECT customer_id, SUM(total) AS revenue
   FROM orders
   GROUP BY customer_id
   ```

   Show that the final recommendation is to keep the original query.

9. Mention the guard-rejection path: the automated test suite injects an
   unsupported partial index proposal and confirms the deterministic guard
   rejects it before execution.

10. Close with the submission value: a practical, bounded SQLite optimization
    agent that combines Lamatic strategy/review with local measurement authority.
