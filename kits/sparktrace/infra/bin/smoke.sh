#!/usr/bin/env bash
# Prove the live backend works: runs ONE capped, read-only diagnostic query
# (the scenario's anti-join) directly on Athena via the dedicated workgroup.
# Cost: one query over ~15 KB, hard-capped at the workgroup byte limit — a
# fraction of a cent.
set -euo pipefail
. "$(dirname "${BASH_SOURCE[0]}")/lib.sh"

require_aws
WG="$(stack_output WorkGroupName)"
[ -n "$WG" ] || die "stack '$STACK_NAME' not found — run up.sh first."

SQL="SELECT o.order_date, COUNT(*) AS dropped_orders
FROM raw.orders o
LEFT JOIN raw.dim_customer d ON o.customer_id = d.customer_id
WHERE d.customer_id IS NULL
GROUP BY o.order_date
ORDER BY o.order_date
LIMIT 100"

info "Submitting anti-join query to workgroup '$WG' ..."
QID="$(aws athena start-query-execution \
  --work-group "$WG" --region "$AWS_REGION" \
  --query-string "$SQL" \
  --query QueryExecutionId --output text)"
info "QueryExecutionId: $QID"

deadline=$((SECONDS + 300))
STATE=""
while (( SECONDS < deadline )); do
  read -r STATE REASON < <(aws athena get-query-execution --region "$AWS_REGION" \
    --query-execution-id "$QID" \
    --query "QueryExecution.Status.[State,StateChangeReason]" --output text)
  case "$STATE" in
    SUCCEEDED) ok "Query SUCCEEDED."; break ;;
    FAILED|CANCELLED) die "Query $STATE: ${REASON:-}" ;;
    *) sleep 1 ;;
  esac
done

if [ "${STATE:-}" != "SUCCEEDED" ]; then
  aws athena stop-query-execution --region "$AWS_REGION" --query-execution-id "$QID" >/dev/null 2>&1 || true
  die "Query did not finish within 300s (stopped it) — check the Athena console."
fi

SCANNED="$(aws athena get-query-execution --region "$AWS_REGION" --query-execution-id "$QID" \
  --query "QueryExecution.Statistics.DataScannedInBytes" --output text)"
info "Bytes scanned: ${SCANNED} (cap: ${BYTES_CUTOFF})"
echo
info "Results (orders with no matching customer dimension row — the planted bug):"
aws athena get-query-results --region "$AWS_REGION" --query-execution-id "$QID" \
  --query "ResultSet.Rows[].Data[].VarCharValue" --output text
echo
ok "Live path verified. This is the same investigation the demo mode runs offline."
