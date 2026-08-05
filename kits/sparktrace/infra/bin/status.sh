#!/usr/bin/env bash
# Show the current stack status + outputs (secret key masked).
set -euo pipefail
. "$(dirname "${BASH_SOURCE[0]}")/lib.sh"

require_aws
ST="$(stack_status)"
info "Stack '$STACK_NAME' (region $AWS_REGION): $ST"
[ "$ST" = "DOES_NOT_EXIST" ] && { echo "  (nothing deployed — run scripts/up.sh)"; exit 0; }

echo "  Bucket             : $(stack_output BucketName)"
echo "  Workgroup          : $(stack_output WorkGroupName)"
echo "  Athena output loc  : $(stack_output AthenaOutputLocation)"
echo "  Glue database      : $(stack_output GlueDatabase)"
echo "  App access key id  : $(stack_output AppAccessKeyId)"
echo "  App secret key     : (hidden — in .env.local only)"
echo
echo "Cost note: no hourly-billed resources. Athena is per-query, capped at"
echo "$BYTES_CUTOFF bytes/query. Run scripts/down.sh to remove everything."
