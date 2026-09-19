-- Enable Realtime on all 8 tables so the dashboard can subscribe to live changes.
-- Run this migration once against the Supabase database.

ALTER PUBLICATION supabase_realtime ADD TABLE agents;
ALTER PUBLICATION supabase_realtime ADD TABLE bounties;
ALTER PUBLICATION supabase_realtime ADD TABLE bids;
ALTER PUBLICATION supabase_realtime ADD TABLE escrows;
ALTER PUBLICATION supabase_realtime ADD TABLE deliveries;
ALTER PUBLICATION supabase_realtime ADD TABLE qa_verdicts;
ALTER PUBLICATION supabase_realtime ADD TABLE credit_ledger;
ALTER PUBLICATION supabase_realtime ADD TABLE settlement_receipts;
