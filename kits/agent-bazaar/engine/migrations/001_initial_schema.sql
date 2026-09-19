-- 001_initial_schema.sql
-- Agent Bazaar: Complete database schema
-- Run this in Supabase SQL Editor or via `supabase db push`

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABLE: agents
-- ============================================================
CREATE TABLE IF NOT EXISTS agents (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  wallet_address text,
  reputation numeric NOT NULL DEFAULT 0.5 CHECK (reputation >= 0.0 AND reputation <= 1.0),
  specialty text NOT NULL CHECK (specialty IN ('summarizer', 'researcher', 'datagen')),
  wins integer NOT NULL DEFAULT 0,
  losses integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- TABLE: bounties
-- ============================================================
CREATE TABLE IF NOT EXISTS bounties (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  goal text NOT NULL,
  budget bigint NOT NULL CHECK (budget > 0),
  status jsonb NOT NULL DEFAULT '{"status": "draft"}'::jsonb,
  rubric jsonb,
  posted_by uuid NOT NULL REFERENCES agents(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- TABLE: bids
-- ============================================================
CREATE TABLE IF NOT EXISTS bids (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  bounty_id uuid NOT NULL REFERENCES bounties(id) ON DELETE CASCADE,
  agent_id uuid NOT NULL REFERENCES agents(id),
  price bigint NOT NULL CHECK (price > 0),
  eta_hours integer NOT NULL CHECK (eta_hours > 0),
  pitch text NOT NULL,
  capability text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- TABLE: escrows
-- ============================================================
CREATE TABLE IF NOT EXISTS escrows (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  bounty_id uuid NOT NULL REFERENCES bounties(id) ON DELETE CASCADE,
  bid_id uuid NOT NULL REFERENCES bids(id),
  amount bigint NOT NULL CHECK (amount > 0),
  lock_ref text NOT NULL,
  status text NOT NULL DEFAULT 'locked' CHECK (status IN ('locked', 'settled', 'refunded')),
  created_at timestamptz NOT NULL DEFAULT now(),
  settled_at timestamptz
);

-- ============================================================
-- TABLE: deliveries
-- ============================================================
CREATE TABLE IF NOT EXISTS deliveries (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  bounty_id uuid NOT NULL REFERENCES bounties(id) ON DELETE CASCADE,
  attempt integer NOT NULL CHECK (attempt BETWEEN 1 AND 3),
  artifact jsonb NOT NULL,
  summary text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- TABLE: qa_verdicts
-- ============================================================
CREATE TABLE IF NOT EXISTS qa_verdicts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  bounty_id uuid NOT NULL REFERENCES bounties(id) ON DELETE CASCADE,
  delivery_id uuid NOT NULL REFERENCES deliveries(id),
  score numeric NOT NULL CHECK (score >= 0.0 AND score <= 1.0),
  verdict text NOT NULL CHECK (verdict IN ('pass', 'fail')),
  rationale text NOT NULL,
  rubric_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- TABLE: credit_ledger
-- ============================================================
CREATE TABLE IF NOT EXISTS credit_ledger (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id uuid NOT NULL REFERENCES agents(id),
  amount bigint NOT NULL,
  balance_after bigint NOT NULL,
  reason text NOT NULL CHECK (reason IN ('initial_grant', 'bid_lock', 'settlement', 'fee', 'refund')),
  ref_id uuid,
  source text NOT NULL DEFAULT 'seed' CHECK (source IN ('seed', 'cron', 'manual')),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- TABLE: settlement_receipts
-- ============================================================
CREATE TABLE IF NOT EXISTS settlement_receipts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  bounty_id uuid NOT NULL REFERENCES bounties(id) ON DELETE CASCADE,
  escrow_id uuid NOT NULL REFERENCES escrows(id),
  from_agent uuid NOT NULL REFERENCES agents(id),
  to_agent uuid NOT NULL REFERENCES agents(id),
  gross_amount bigint NOT NULL,
  fee_amount bigint NOT NULL,
  net_amount bigint NOT NULL,
  tx_hash text,
  adapter text NOT NULL CHECK (adapter IN ('ledger', 'x402')),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- INDEXES (performance)
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_bounties_status ON bounties USING gin (status);
CREATE INDEX IF NOT EXISTS idx_bounties_posted_by ON bounties (posted_by);
CREATE INDEX IF NOT EXISTS idx_bids_bounty_id ON bids (bounty_id);
CREATE INDEX IF NOT EXISTS idx_bids_agent_id ON bids (agent_id);
CREATE INDEX IF NOT EXISTS idx_escrows_bounty_id ON escrows (bounty_id);
CREATE INDEX IF NOT EXISTS idx_escrows_status ON escrows (status);
CREATE INDEX IF NOT EXISTS idx_deliveries_bounty_id ON deliveries (bounty_id);
CREATE INDEX IF NOT EXISTS idx_qa_verdicts_bounty_id ON qa_verdicts (bounty_id);
CREATE INDEX IF NOT EXISTS idx_credit_ledger_agent_id ON credit_ledger (agent_id);
CREATE INDEX IF NOT EXISTS idx_settlement_receipts_bounty_id ON settlement_receipts (bounty_id);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE bounties ENABLE ROW LEVEL SECURITY;
ALTER TABLE bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE escrows ENABLE ROW LEVEL SECURITY;
ALTER TABLE deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE qa_verdicts ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE settlement_receipts ENABLE ROW LEVEL SECURITY;

-- Anon can read public tables (dashboard)
CREATE POLICY "anon_read_agents" ON agents FOR SELECT USING (true);
CREATE POLICY "anon_read_bounties" ON bounties FOR SELECT USING (true);
CREATE POLICY "anon_read_bids" ON bids FOR SELECT USING (true);
CREATE POLICY "anon_read_escrows" ON escrows FOR SELECT USING (true);
CREATE POLICY "anon_read_deliveries" ON deliveries FOR SELECT USING (true);
CREATE POLICY "anon_read_qa_verdicts" ON qa_verdicts FOR SELECT USING (true);
CREATE POLICY "anon_read_credit_ledger" ON credit_ledger FOR SELECT USING (true);
CREATE POLICY "anon_read_receipts" ON settlement_receipts FOR SELECT USING (true);

-- Service role can do everything (engine)
CREATE POLICY "service_all_agents" ON agents FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_all_bounties" ON bounties FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_all_bids" ON bids FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_all_escrows" ON escrows FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_all_deliveries" ON deliveries FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_all_qa_verdicts" ON qa_verdicts FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_all_credit_ledger" ON credit_ledger FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_all_receipts" ON settlement_receipts FOR ALL USING (auth.role() = 'service_role');
