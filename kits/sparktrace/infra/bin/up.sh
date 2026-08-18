#!/usr/bin/env bash
# One-click bring-up of the SparkTrace live backend.
#   1. deploy the CloudFormation stack (S3 + Glue + Athena workgroup [+ IAM])
#   2. upload the bundled sample CSVs to S3
#   3. write the AWS block into the app's .env.local (Lamatic keys preserved)
# Idempotent: safe to re-run. Nothing here bills hourly.
set -euo pipefail
. "$(dirname "${BASH_SOURCE[0]}")/lib.sh"

require_aws
[ -f "$TEMPLATE" ] || die "template missing: $TEMPLATE"
[ -d "$DATA_DIR" ] || die "sample data missing: $DATA_DIR"

TEMPLATE_ARG="$(awspath "$TEMPLATE")"

info "Validating CloudFormation template..."
aws cloudformation validate-template --template-body "file://$TEMPLATE_ARG" --region "$AWS_REGION" >/dev/null \
  || die "template failed validation — fix cloudformation/sparktrace.yaml before deploying."
ok "Template valid."

ACCOUNT="$(aws sts get-caller-identity --query Account --output text)"
info "Account $ACCOUNT | region $AWS_REGION | stack $STACK_NAME | prefix $PROJECT_PREFIX"

info "Deploying CloudFormation stack (this creates no hourly-billed resources)..."
aws cloudformation deploy \
  --template-file "$TEMPLATE_ARG" \
  --stack-name "$STACK_NAME" \
  --region "$AWS_REGION" \
  --capabilities CAPABILITY_NAMED_IAM \
  --no-fail-on-empty-changeset \
  --parameter-overrides \
    ProjectPrefix="$PROJECT_PREFIX" \
    BytesScannedCutoffBytes="$BYTES_CUTOFF" \
    CreateAppUser="$CREATE_APP_USER"
ok "Stack deployed."

BUCKET="$(stack_output BucketName)"
[ -n "$BUCKET" ] || die "could not read BucketName output."
info "Uploading sample data to s3://$BUCKET/data/ ..."
aws s3 cp "$(awspath "$DATA_DIR/orders.csv")"        "s3://$BUCKET/data/raw/orders/orders.csv"               --only-show-errors
aws s3 cp "$(awspath "$DATA_DIR/dim_customer.csv")"  "s3://$BUCKET/data/raw/dim_customer/dim_customer.csv"   --only-show-errors
aws s3 cp "$(awspath "$DATA_DIR/daily_revenue.csv")" "s3://$BUCKET/data/finance/daily_revenue/daily_revenue.csv" --only-show-errors
ok "Sample data uploaded."

info "Writing AWS config into the app .env.local ..."
"$SCRIPT_DIR/write-env.sh"

echo
ok "SparkTrace live backend is UP."
echo "   Bucket    : $BUCKET"
echo "   Workgroup : $(stack_output WorkGroupName)  (per-query cap: $BYTES_CUTOFF bytes)"
echo "   Glue DBs  : raw, finance"
echo
echo "Next:  bin/smoke.sh   # optional: run one capped Athena query to prove it works"
echo "       bin/down.sh    # tear everything down when you're done"
