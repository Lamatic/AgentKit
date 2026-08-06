# PostgreSQL Connection Pool Exhaustion Runbook

## ID: runbook-postgres-pool-exhaustion
## Tags: database, connection-pool, postgresql, payments

## Symptoms
- Applications log errors matching: `connection pool exhausted` or `too many clients already`
- Latency spikes on database read/write endpoints (p99 > 5s)
- HTTP 500 or 503 responses on endpoints querying database

## Triage Commands
Run these queries to diagnose connection states:
```sql
-- Count connections by state
SELECT count(*), state FROM pg_stat_activity GROUP BY state;

-- Identify long-running queries holding locks
SELECT pid, now() - query_start AS duration, query, state 
FROM pg_stat_activity 
WHERE state != 'idle' 
ORDER BY duration DESC 
LIMIT 5;
```

## Immediate Remediation Steps
1. **Terminate Idle Connections:**
   Clear out old idle connections to free up slots immediately:
   ```sql
   SELECT pg_terminate_backend(pid) 
   FROM pg_stat_activity 
   WHERE state = 'idle' 
   AND query_start < now() - interval '5 minutes';
   ```
2. **Identify connection leak sources:**
   Look at connection distribution by client IP:
   ```sql
   SELECT client_addr, count(*) FROM pg_stat_activity GROUP BY client_addr;
   ```
3. **Scale connection pool configurations:**
   Increase maximum pool size if legitimate traffic spike:
   Set `DB_MAX_CONNECTIONS` or similar env variable in deployment configuration and execute rolling update:
   ```bash
   kubectl set env deployment/payments-service DB_MAX_CONNECTIONS=150 -n production
   ```

## Prevention Checklist
- [ ] Configure `idle_in_transaction_session_timeout` on Postgres server.
- [ ] Implement database-level pooling via PgBouncer.
- [ ] Ensure all application code closes connections in a `finally` block.
