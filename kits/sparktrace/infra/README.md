# SparkTrace — live AWS backend (one-click IaC)

Brings up the minimal AWS backend SparkTrace's **live mode** needs — an S3
bucket, the Glue Data Catalog tables for the bundled "broken pipeline"
scenario, and a dedicated read-only Athena workgroup — so the *same*
investigation the demo runs offline can run for real on AWS. One command up,
one command down.

> Ships inside the kit as reference infrastructure-as-code. It is **optional** —
> demo mode needs none of this. Credentials live in a gitignored `.env` and are
> never committed.

## 💸 Cost — why you won't wake up to a bill

- **Nothing here bills by the hour.** No EC2, NAT, RDS, Kinesis, endpoints —
  none of the usual "forgot to turn it off" money pits.
- **S3**: a few KB of CSVs + query results (results auto-expire after 7 days). ~$0.
- **Glue Data Catalog**: 3 tables — free at this scale.
- **IAM user/workgroup**: free.
- **Athena**: the only pay-per-use piece — $5/TB **scanned**, and the workgroup
  hard-caps every query at **10 MB** (the AWS minimum). On this ~15 KB dataset a
  query scans kilobytes, so a full demo costs a *fraction of a cent*.
- `bin/down.sh` deletes **everything**. `bin/status.sh` shows what's live.

## Prerequisites

- AWS CLI v2 (verify with `aws --version`) + deployer credentials.
- Deployer creds need: CloudFormation, S3, Glue, Athena, and — if
  `CREATE_APP_USER=true` (default) — IAM user/policy/access-key permissions. If
  your creds can't do IAM, set `CREATE_APP_USER=false` and the app reuses your
  creds.

## Usage

```bash
cd kits/sparktrace/infra      # (or wherever the kit lives)
cp .env.example .env          # then paste your DEPLOYER aws keys into .env
bash bin/up.sh            # deploy + upload data + write app .env.local
bash bin/smoke.sh         # optional: one capped query proves the live path
bash bin/status.sh        # what's deployed + outputs
bash bin/down.sh          # tear it ALL down
```

## What `up.sh` does

1. Deploys `cloudformation/sparktrace.yaml` (S3 + Glue `raw`/`finance` DBs + 3
   tables + `sparktrace-readonly` Athena workgroup + optional read-only IAM user).
2. Uploads `../assets/sample-scenario/data/*.csv` (the kit's sample data) to S3.
3. Runs `write-env.sh`, which merges the AWS block into the kit's
   `apps/.env.local` **without touching your Lamatic keys** (only the
   `AWS_* / ATHENA_* / GLUE_*` lines are replaced).

Then, in live mode, the app points at `raw.orders`, `raw.dim_customer`, and
`finance.daily_revenue` on real Athena.

## Security

- `.env` (deployer keys) and the generated `apps/.env.local` (app key) are
  **gitignored** and never committed.
- **No credential is ever published in CloudFormation Outputs.** Stack outputs
  are readable by anyone with `cloudformation:DescribeStacks`, so the app's
  access key is minted by `bin/write-env.sh` via `aws iam create-access-key`
  (the secret is returned once, straight into `.env.local`) rather than by a
  CFN `AWS::IAM::AccessKey` resource. `bin/down.sh` deletes outstanding keys
  during teardown.
- With `CREATE_APP_USER=true` (the default) the app runs as a
  **least-privilege read-only** IAM user: Athena query + Glue read + S3 read on
  data / write only to the results prefix. It cannot write your data or create
  billable resources — a hard backstop under SparkTrace's own read-only query
  guard.
- With `CREATE_APP_USER=false` the app reuses your **deployer** credentials
  (see Prerequisites above), which hold CloudFormation/IAM/S3 write access. The
  least-privilege guarantee does **not** apply in that mode: nothing at the AWS
  level stops resource creation or data writes, and SparkTrace's query guard is
  then an application-level control only. Prefer the default unless your
  credentials genuinely cannot create an IAM user.

## Files

```text
infra/
  cloudformation/sparktrace.yaml   # the whole stack (edit here to change infra)
  bin/up.sh  down.sh  status.sh  smoke.sh  write-env.sh  lib.sh
  .env.example                     # copy to .env (gitignored)
```
