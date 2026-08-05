#!/usr/bin/env bash
# One-click teardown. Empties the S3 bucket (CloudFormation can't delete a
# non-empty bucket) then deletes the whole stack — leaving nothing behind.
set -euo pipefail
. "$(dirname "${BASH_SOURCE[0]}")/lib.sh"

require_aws

ST="$(stack_status)"
if [ "$ST" = "DOES_NOT_EXIST" ]; then
  ok "Stack '$STACK_NAME' does not exist — nothing to tear down."
  exit 0
fi
info "Stack '$STACK_NAME' status: $ST"

BUCKET="$(stack_output BucketName)"
if [ -n "$BUCKET" ] && aws s3 ls "s3://$BUCKET" >/dev/null 2>&1; then
  info "Emptying s3://$BUCKET ..."
  aws s3 rm "s3://$BUCKET" --recursive --only-show-errors || warn "bucket empty or already gone"
  ok "Bucket emptied."
fi

info "Deleting stack '$STACK_NAME' ..."
aws cloudformation delete-stack --stack-name "$STACK_NAME" --region "$AWS_REGION"
info "Waiting for delete to complete..."
aws cloudformation wait stack-delete-complete --stack-name "$STACK_NAME" --region "$AWS_REGION" \
  && ok "Stack deleted. All SparkTrace AWS resources are gone." \
  || die "delete did not complete — check the CloudFormation console."

warn "The app's .env.local still contains the (now-invalid) AWS block — harmless, but re-run up.sh or edit it before the next live run."
