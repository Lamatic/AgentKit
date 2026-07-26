# Master Infrastructure & Services Remediation Runbook

## ID: master-remediation-runbook
## Tags: database, postgresql, mysql, redis, cache, memory, container, restart, storage, disk, oom, connection-pool, network, partition, timeout, crash

This master runbook contains step-by-step remediation procedures and CLI diagnostics for common infrastructure and services incidents.

---

### Section 1: DB Crash (PostgreSQL/MySQL Database Unreachable)
#### Symptoms
- Error matching: `connection refused` or `database is unreachable`
- Applications failing to start or throw DB connection errors

#### Diagnostics & Remediation
1. Check if database services are running:
   ```bash
   # For PostgreSQL:
   pg_isready -h $DB_HOST -p 5432
   sudo service postgresql status
   
   # For MySQL:
   sudo service mysql status
   ```
2. If service is down, restart it immediately:
   ```bash
   # For PostgreSQL:
   sudo service postgresql restart
   
   # For MySQL:
   sudo service mysql restart
   ```
3. Check system resource allocation (ensure DB host is not OOM-killed).

---

### Section 2: API Timeout (Downstream Delays / Ingress Inbound Connection Backlog)
#### Symptoms
- API calls timing out with 30-second delays
- Response code: `504 Gateway Timeout`

#### Diagnostics & Remediation
1. Check downstream service latency and network connectivity:
   ```bash
   curl -o /dev/null -w "Connect: %{time_connect} TTFB: %{time_starttransfer} Total: %{time_total}\n" $API_ENDPOINT
   ```
2. Inspect server inbound connection backlog queue:
   ```bash
   ss -lnt '( sport = :80 or sport = :443 )'
   ```
3. Restart ingress controller (Nginx/Envoy) to clear connections:
   ```bash
   kubectl rollout restart deployment/ingress-nginx-controller -n ingress-nginx
   ```

---

### Section 3: Pod OOM Kill (Out Of Memory Exit Code 137)
#### Symptoms
- Pod state shows `OOMKilled` (Exit Code 137) in Kubernetes
- High memory usage alert on container namespaces

#### Diagnostics & Remediation
1. Check memory footprint of running pods:
   ```bash
   kubectl top pod -n $NAMESPACE
   ```
2. Inspect pod termination details for OOM:
   ```bash
   kubectl get pod $POD_NAME -o jsonpath='{.status.containerStatuses[0].lastState.terminated.reason}'
   ```
3. Increase container memory limits dynamically in the deployment manifest:
   ```bash
   kubectl set resources deployment/$DEPLOYMENT_NAME --limits=memory=1Gi,cpu=500m --requests=memory=512Mi,cpu=250m
   ```

---

### Section 4: Pod CrashLoopBackOff (Exit Code 1 / Application Exceptions)
#### Symptoms
- Pod status is `CrashLoopBackOff`
- Application process crashes immediately on startup (Exit Code 1)

#### Diagnostics & Remediation
1. Inspect last logs before the crash:
   ```bash
   kubectl logs $POD_NAME --previous --tail=100
   ```
2. Check pod startup configurations, environment variables, and configmaps:
   ```bash
   kubectl describe pod $POD_NAME
   ```
3. Perform a rollout restart to reset bad local state:
   ```bash
   kubectl rollout restart deployment/$DEPLOYMENT_NAME
   ```

---

### Section 5: Auth Failure (Redis Session Store Down / Redis Connection Refused)
#### Symptoms
- Auth API throws 500 errors / Login requests failing
- Error matching: `ECONNREFUSED redis:6379` in logs

#### Diagnostics & Remediation
1. Ping Redis server to verify connectivity:
   ```bash
   redis-cli -h $REDIS_HOST -p 6379 ping
   ```
2. Check Redis memory usage and eviction stats (if full):
   ```bash
   redis-cli -h $REDIS_HOST INFO memory | grep used_memory_human
   redis-cli -h $REDIS_HOST FLUSHALL
   ```
3. If redis service is down on host, restart it:
   ```bash
   sudo service redis-server restart
   ```

---

### Section 6: Network Partition (Availability Zone / Region Latency & Timeouts)
#### Symptoms
- Cross-region or cross-AZ calls timing out
- High packet loss between microservices

#### Diagnostics & Remediation
1. Trace route paths to identify package drops and latency:
   ```bash
   traceroute $DESTINATION_HOST
   mtr -rw $DESTINATION_HOST
   ```
2. Test port connectivity:
   ```bash
   nc -zv -w 5 $DESTINATION_HOST $PORT
   ```
3. Failover service traffic to the healthy secondary region using DNS weight adjustments.

---

### Section 7: Disk Space & Storage Full (FileSystem mount 100%)
#### Symptoms
- Error matching: `No space left on device`
- Server writes failing

#### Diagnostics & Remediation
1. Check disk space usage:
   ```bash
   df -h
   du -sh /* 2>/dev/null | sort -hr | head -n 10
   ```
2. Expand the physical and logical volume size on the mount:
   ```bash
   pvresize /dev/xvda
   lvextend -l +100%FREE /dev/mapper/vg-root
   resize2fs /dev/mapper/vg-root
   ```
