#!/usr/bin/env bash
# Shared config + helpers for the SparkTrace infra scripts.
# Sourced by up.sh / down.sh / status.sh / smoke.sh / write-env.sh.
set -euo pipefail

# --- Resolve paths (infra/ lives inside the kit: apps/ and assets/ are siblings)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INFRA_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
KIT_ROOT="$(cd "$INFRA_DIR/.." && pwd)"
TEMPLATE="$INFRA_DIR/cloudformation/sparktrace.yaml"
DATA_DIR="$KIT_ROOT/assets/sample-scenario/data"
APP_ENV="$KIT_ROOT/apps/.env.local"

# --- Load infra/.env (deployer creds + overrides), if present ---------------
if [ -f "$INFRA_DIR/.env" ]; then
  set -a
  # shellcheck disable=SC1091
  . "$INFRA_DIR/.env"
  set +a
fi

# --- Defaults (override in infra/.env) --------------------------------------
STACK_NAME="${STACK_NAME:-sparktrace-live}"
PROJECT_PREFIX="${PROJECT_PREFIX:-sparktrace}"
AWS_REGION="${AWS_REGION:-us-east-1}"
CREATE_APP_USER="${CREATE_APP_USER:-true}"
BYTES_CUTOFF="${BYTES_CUTOFF:-10485760}"   # 10 MB (AWS minimum) — cost guard
export AWS_REGION AWS_DEFAULT_REGION="$AWS_REGION"

# --- Pretty output -----------------------------------------------------------
c_reset='\033[0m'; c_grn='\033[0;32m'; c_yel='\033[0;33m'; c_red='\033[0;31m'; c_cyn='\033[0;36m'
info()  { printf "${c_cyn}==>${c_reset} %s\n" "$*"; }
ok()    { printf "${c_grn}OK ${c_reset} %s\n" "$*"; }
warn()  { printf "${c_yel}!! ${c_reset} %s\n" "$*"; }
die()   { printf "${c_red}xx ${c_reset} %s\n" "$*" >&2; exit 1; }

# --- Preflight ---------------------------------------------------------------
require_aws() {
  command -v aws >/dev/null 2>&1 || die "aws CLI not found on PATH."
  aws sts get-caller-identity >/dev/null 2>&1 \
    || die "AWS credentials not working. Put deployer keys in infra/.env (or set an AWS profile), then retry."
}

stack_output() {  # stack_output <OutputKey>  -> value (empty if stack/output absent)
  aws cloudformation describe-stacks --stack-name "$STACK_NAME" --region "$AWS_REGION" \
    --query "Stacks[0].Outputs[?OutputKey=='$1'].OutputValue | [0]" --output text 2>/dev/null \
    | sed 's/^None$//'
}

stack_status() {
  aws cloudformation describe-stacks --stack-name "$STACK_NAME" --region "$AWS_REGION" \
    --query "Stacks[0].StackStatus" --output text 2>/dev/null || echo "DOES_NOT_EXIST"
}
