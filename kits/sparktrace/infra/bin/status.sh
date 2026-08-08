#!/usr/bin/env bash
# Show the current stack status + outputs (secret key masked).
set -euo pipefail
. "$(dirname "${BASH_SOURCE[0]}")/lib.sh"

require_aws
ST="$(stack_status)"
info "Stack '$STACK_NAME' (region $AWS_REGION): $ST"
[ "$ST" = "AWS_ERROR" ] && die "could not read the stack status (see the AWS error above)."
[ "$ST" = "DOES_NOT_EXIST" ] && { echo "  (nothing deployed — run bin/up.sh)"; exit 0; }

echo "  Bucket             : $(stack_output BucketName)"
echo "  Workgroup          : $(stack_output WorkGroupName)"
echo "  Athena output loc  : $(stack_output AthenaOutputLocation)"
echo "  Glue database      : $(stack_output GlueDatabase)"
echo "  App IAM user       : $(stack_output AppUserName)"
echo "  App credentials    : minted by bin/write-env.sh into .env.local (never in stack outputs)"
echo
echo "Cost note: no hourly-billed resources. Athena is per-query, capped at"
echo "$BYTES_CUTOFF bytes/query. Run bin/down.sh to remove everything."
