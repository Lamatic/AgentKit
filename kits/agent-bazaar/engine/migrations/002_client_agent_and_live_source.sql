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

-- Stable append-order key: created_at defaults to now(), which returns the
-- transaction start time, so rows written in one transaction share identical
-- timestamps and ORDER BY created_at is nondeterministic. The identity
-- sequence is monotonic per append and safe to order by.
ALTER TABLE credit_ledger ADD COLUMN IF NOT EXISTS seq bigint GENERATED ALWAYS AS IDENTITY;
CREATE INDEX IF NOT EXISTS idx_credit_ledger_agent_seq ON credit_ledger (agent_id, seq DESC);

-- Atomically append a ledger entry: balance_after is computed and the
-- row inserted in a single statement, serialized per agent via a
-- transaction-scoped advisory lock so concurrent writers cannot compute
-- the same running balance. p_source/p_created_at let seed flows preserve
-- their metadata; the signature change requires DROP + CREATE (OR REPLACE
-- cannot add parameters).
DROP FUNCTION IF EXISTS append_ledger(uuid, bigint, text, uuid);
DROP FUNCTION IF EXISTS append_ledger(uuid, bigint, text, uuid, text, timestamptz);
CREATE FUNCTION append_ledger(
  p_agent_id uuid,
  p_amount bigint,
  p_reason text,
  p_ref_id uuid DEFAULT NULL,
  p_source text DEFAULT 'live',
  p_created_at timestamptz DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current bigint;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext(p_agent_id::text));
  SELECT COALESCE(
    (SELECT balance_after
       FROM credit_ledger
      WHERE agent_id = p_agent_id
      ORDER BY seq DESC
      LIMIT 1),
    0
  ) INTO v_current;
  -- No negative balances: a debit that would overdraw is rejected before any
  -- row is written, so LedgerAdapter.lock can never create an unfunded escrow
  -- (awardAndDeliver rolls its escrow row back on this error).
  IF v_current + p_amount < 0 THEN
    RAISE EXCEPTION 'insufficient funds for agent %: balance %, delta %', p_agent_id, v_current, p_amount;
  END IF;
  INSERT INTO credit_ledger (agent_id, amount, balance_after, reason, ref_id, source, created_at)
  SELECT p_agent_id,
         p_amount,
         v_current + p_amount,
         p_reason,
         p_ref_id,
         p_source,
         COALESCE(p_created_at, now());
END;
$$;

-- SECURITY DEFINER functions are executable by PUBLIC by default: revoke
-- first so anon/authenticated cannot append ledger entries directly.
-- The engine calls this RPC with the service-role key.
REVOKE ALL ON FUNCTION append_ledger(uuid, bigint, text, uuid, text, timestamptz) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION append_ledger(uuid, bigint, text, uuid, text, timestamptz) TO service_role;

-- Identity for idempotent ledger writes: one settlement/refund leg per
-- (agent, reason, reference). NULL ref_id rows (e.g. initial grants) are
-- excluded so they never collide. Repeatable via IF NOT EXISTS.
CREATE UNIQUE INDEX IF NOT EXISTS uq_credit_ledger_agent_reason_ref
  ON credit_ledger (agent_id, reason, ref_id) WHERE ref_id IS NOT NULL;

-- Exact total of collected settlement fees over the complete dataset.
-- Read-only and SECURITY INVOKER so the existing RLS SELECT policies govern
-- it for every caller; repeatable via OR REPLACE (signature never changes).
CREATE OR REPLACE FUNCTION settlement_fee_total()
RETURNS bigint
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT COALESCE(SUM(fee_amount), 0)::bigint FROM settlement_receipts;
$$;

-- Locked-escrow aggregates for the dashboard (count + TVL). Same
-- read-only/INVOKER/repeatable shape as settlement_fee_total.
CREATE OR REPLACE FUNCTION escrow_locked_stats()
RETURNS TABLE (locked_count bigint, locked_total bigint)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT COUNT(*)::bigint, COALESCE(SUM(amount), 0)::bigint
    FROM escrows WHERE status = 'locked';
$$;

-- Atomically apply a reputation delta with clamping, two-decimal rounding,
-- and win/loss accounting in a single statement. Returns the new reputation,
-- or NULL when the agent does not exist. Repeatable via OR REPLACE.
CREATE OR REPLACE FUNCTION apply_reputation(
  p_agent_id uuid,
  p_delta numeric,
  p_win boolean
)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new numeric;
BEGIN
  UPDATE agents
     SET reputation = LEAST(1, GREATEST(0, ROUND(reputation + p_delta, 2))),
         wins = wins + CASE WHEN p_win THEN 1 ELSE 0 END,
         losses = losses + CASE WHEN p_win THEN 0 ELSE 1 END
   WHERE id = p_agent_id
  RETURNING reputation INTO v_new;
  RETURN v_new;
END;
$$;

REVOKE ALL ON FUNCTION apply_reputation(uuid, numeric, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION apply_reputation(uuid, numeric, boolean) TO service_role;

-- Recompute running balances in append order after history surgery (e.g.
-- seed cleanup deleting backdated rows that later rows chained onto). Single
-- atomic statement; deterministic via the seq append key.
CREATE OR REPLACE FUNCTION repair_ledger_balances(p_agent_ids uuid[])
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE credit_ledger AS c
     SET balance_after = s.running
    FROM (
      SELECT id, SUM(amount) OVER (PARTITION BY agent_id ORDER BY seq) AS running
        FROM credit_ledger
       WHERE agent_id = ANY(p_agent_ids)
    ) AS s
   WHERE c.id = s.id;
END;
$$;

REVOKE ALL ON FUNCTION repair_ledger_balances(uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION repair_ledger_balances(uuid[]) TO service_role;

-- Durable daily LLM budget: atomic reservation against a shared per-day total
-- so enforcement survives restarts and holds across engine instances.
-- reserve_budget returns false (no write) when the cap is exhausted.
CREATE OR REPLACE FUNCTION reserve_budget(p_day text, p_amount integer, p_cap integer)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_spent integer;
BEGIN
  INSERT INTO daily_budget (day, spent) VALUES (p_day, 0) ON CONFLICT (day) DO NOTHING;
  UPDATE daily_budget SET spent = spent + p_amount, updated_at = now()
   WHERE day = p_day AND spent + p_amount <= p_cap
  RETURNING spent INTO v_spent;
  IF NOT FOUND THEN RETURN FALSE; END IF;
  RETURN TRUE;
END;
$$;

REVOKE ALL ON FUNCTION reserve_budget(text, integer, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION reserve_budget(text, integer, integer) TO service_role;

-- Unconditional charge for fallback executions (no cap check).
CREATE OR REPLACE FUNCTION spend_budget(p_day text, p_amount integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO daily_budget (day, spent) VALUES (p_day, 0) ON CONFLICT (day) DO NOTHING;
  UPDATE daily_budget SET spent = spent + p_amount, updated_at = now() WHERE day = p_day;
END;
$$;

REVOKE ALL ON FUNCTION spend_budget(text, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION spend_budget(text, integer) TO service_role;

-- Release a prior reservation (clamped at zero).
CREATE OR REPLACE FUNCTION release_budget(p_day text, p_amount integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE daily_budget
     SET spent = GREATEST(0, spent - p_amount), updated_at = now()
   WHERE day = p_day;
END;
$$;

REVOKE ALL ON FUNCTION release_budget(text, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION release_budget(text, integer) TO service_role;
