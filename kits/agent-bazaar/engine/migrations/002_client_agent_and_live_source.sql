-- 002_client_agent_and_live_source.sql
-- Agent Bazaar: allow a dedicated client/poster agent and live ledger sources.
--
-- The original schema constrained agents.specialty to the three worker
-- specialties and credit_ledger.source to ('seed','cron','manual').
-- The interactive engine writes client agents and live ledger entries,
-- so both constraints are widened. Safe to run more than once.

ALTER TABLE agents DROP CONSTRAINT IF EXISTS agents_specialty_check;
ALTER TABLE agents
  ADD CONSTRAINT agents_specialty_check
  CHECK (specialty IN ('summarizer', 'researcher', 'datagen', 'client'));

ALTER TABLE credit_ledger DROP CONSTRAINT IF EXISTS credit_ledger_source_check;
ALTER TABLE credit_ledger
  ADD CONSTRAINT credit_ledger_source_check
  CHECK (source IN ('seed', 'cron', 'manual', 'live'));
