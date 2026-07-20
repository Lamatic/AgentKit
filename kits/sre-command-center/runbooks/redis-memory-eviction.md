# Redis Cache Eviction & Memory Full Runbook

## ID: runbook-redis-memory-eviction
## Tags: redis, cache, memory, eviction

## Symptoms
- Elevated latency on cache-dependent services (e.g. auth-api, session-store)
- Cache hit rate drops below 40%
- Error messages matching: `OOM command not allowed when used memory > 'maxmemory'` in application logs

## Triage Commands
Connect to the Redis CLI and inspect memory status:
```bash
# Verify connection
redis-cli -h $REDIS_HOST ping

# Check memory stats
redis-cli -h $REDIS_HOST INFO memory | grep -E "used_memory_human|maxmemory_human"

# Check eviction metrics
redis-cli -h $REDIS_HOST INFO stats | grep evicted_keys
```

## Immediate Remediation Steps
1. **Evict Expired Keys Manually:**
   Force eviction of expired keys if possible, or purge transient collections:
   ```bash
   redis-cli -h $REDIS_HOST FLUSHDB
   ```
   *Warning: This clears the entire cache. Run only if cache is transient.*
2. **Dynamically Change Eviction Policy:**
   If the policy is set to `noeviction`, update it to `allkeys-lru` immediately to prevent writes from being rejected:
   ```bash
   redis-cli -h $REDIS_HOST CONFIG SET maxmemory-policy allkeys-lru
   ```
3. **Scale Redis Memory:**
   If persistent volume/RAM allows, increase maxmemory configuration:
   ```bash
   redis-cli -h $REDIS_HOST CONFIG SET maxmemory 4gb
   ```

## Prevention Checklist
- [ ] Set `maxmemory-policy` to `allkeys-lru` in standard `redis.conf`.
- [ ] Configure Datadog/Prometheus alert for Redis memory > 80% usage.
- [ ] Separate transient cache from persistent session storage instances.
