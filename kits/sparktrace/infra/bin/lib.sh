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

# Paths handed to the AWS CLI. On Git Bash / Cygwin / MSYS the shell produces
# POSIX paths (/cygdrive/f/...) that the native Windows aws.exe cannot open, so
# convert them. A no-op everywhere else.
awspath() {
  if command -v cygpath >/dev/null 2>&1; then cygpath -m "$1"; else printf '%s' "$1"; fi
}

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

# stack_output <OutputKey> -> value, or empty when the stack or that output is
# genuinely absent (callers rely on empty for conditional outputs like
# AppUserName). Any OTHER AWS failure reports the cause and returns non-zero,
# so a transient error can't masquerade as "no such output" — the same trap
# stack_status avoids below.
stack_output() {
  local out
  if out="$(aws cloudformation describe-stacks --stack-name "$STACK_NAME" --region "$AWS_REGION" \
              --query "Stacks[0].Outputs[?OutputKey=='$1'].OutputValue | [0]" --output text 2>&1)"; then
    printf '%s' "$out" | sed 's/^None$//'
    return 0
  fi
  case "$out" in
    *"does not exist"*) return 0 ;;
    *) printf 'stack_output(%s): %s\n' "$1" "$out" >&2; return 1 ;;
  esac
}

# Echoes the stack status; DOES_NOT_EXIST only when the stack is genuinely
# absent. Any other failure (AccessDenied, throttling, network) echoes
# AWS_ERROR and reports the cause on stderr — never a false "nothing to do",
# which would let down.sh claim success while resources stay deployed.
stack_status() {
  local out
  if out="$(aws cloudformation describe-stacks --stack-name "$STACK_NAME" --region "$AWS_REGION" \
              --query "Stacks[0].StackStatus" --output text 2>&1)"; then
    printf '%s\n' "$out"
    return 0
  fi
  case "$out" in
    *"does not exist"*) printf 'DOES_NOT_EXIST\n' ;;
    *) printf 'AWS_ERROR\n'; printf 'stack_status: %s\n' "$out" >&2 ;;
  esac
}
