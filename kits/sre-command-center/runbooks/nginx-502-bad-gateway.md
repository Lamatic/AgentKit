# API Gateway 502 Bad Gateway Runbook

## ID: runbook-nginx-502-bad-gateway
## Tags: api-gateway, 502, upstream, nginx, envoy

## Symptoms
- HTTP 502 Bad Gateway responses on external routes
- Nginx or Envoy proxy access logs showing `502` status code
- Error logs stating: `upstream connect error or disconnect/reset before headers`

## Triage Commands
Run these commands in the Kubernetes cluster:
```bash
# Check status of upstream API gateway pods
kubectl get pods -l app=api-gateway -n production

# Inspect logs of proxy service for connection failures
kubectl logs -l app=api-gateway -c proxy -n production --tail=50

# Check endpoints for backend services
kubectl get endpoints -n production
```

## Immediate Remediation Steps
1. **Restart Gateway Pods:**
   If pods are hung or in deadlock, trigger rollout restart:
   ```bash
   kubectl rollout restart deployment/api-gateway -n production
   ```
2. **Verify Upstream Connectivity:**
   Confirm DNS and network reachability from proxy container:
   ```bash
   kubectl exec -it deployment/api-gateway -c proxy -n production -- curl -v http://payments-service:8080/health
   ```
3. **Scale deployment replica count:**
   If load causes upstream connection dropped, scale pods:
   ```bash
   kubectl scale deployment/api-gateway -n production --replicas=5
   ```

## Prevention Checklist
- [ ] Implement proper liveness and readiness probes on upstream containers.
- [ ] Add rate limiting rules on gateway proxy to shed excess load.
- [ ] Configure automatic horizontal pod autoscaler (HPA).
