# Sample scenario: late-arriving `dim_customer` rows undercount daily revenue

This is SparkTrace's bundled **demo scenario** -- a small, realistic, offline
reproduction of a real-world data pipeline bug, used by demo mode (`apps/lib/demo/`)
so the full investigation loop can run with no AWS and no Lamatic account.

## The pipeline

- `repo/jobs/daily_revenue.py` -- nightly Spark job. Reads `orders` (fact) and
  `dim_customer` (dimension), joins them on `customer_id`, aggregates revenue
  per `(order_date, region)`, and overwrites the `daily_revenue` mart.
- `repo/jobs/dim_customer_loader.py` -- separate job that refreshes
  `dim_customer` from a CRM export. The CRM vendor only ships a fresh export
  every ~2 days, so **newly-signed-up customers are missing from
  `dim_customer` for 1-2 days** after their first order.
- `repo/sql/create_daily_revenue_table.sql` -- Athena/Glue DDL for the three
  tables, for reference during investigation.

## The planted bug

`daily_revenue.py` joins `orders` to `dim_customer` with an **INNER JOIN**:

```python
joined = orders_df.join(dim_customer_df, on="customer_id", how="inner")
```

Because `dim_customer` lags new signups by ~2 days, any order placed by a
brand-new customer references a `customer_id` that doesn't exist in
`dim_customer` yet. The inner join silently **drops** that order instead of
keeping it (e.g. with an "unknown region" bucket). Since `daily_revenue.py`
overwrites the mart on every run rather than reprocessing historical
partitions, those dropped orders **never backfill** once the dimension does
catch up -- the revenue for the affected days stays permanently understated.

This is a textbook **late-arriving dimension** bug, not join-explosion or
schema drift: row counts shrink (not multiply), and the schema of both
inputs is stable across days.

## The data (`data/`)

Deterministic, hand-generated, no external dependencies:

- `orders.csv` -- 100 orders, `2024-01-01` .. `2024-01-10`, 10/day.
- `dim_customer.csv` -- 20 customers (`C001`-`C020`), onboarded well before
  the window (`created_at = 2023-11-15`).
- `daily_revenue.csv` -- the **actual production output**: the result of
  running the buggy inner-join job over the two inputs above.

Five additional customers (`C021`-`C025`) placed orders on `2024-01-08`
through `2024-01-10` (3/day) but are **entirely absent** from
`dim_customer.csv` -- they are the "late-arriving" rows. This reproduces:

| order_date | true revenue | actual (`daily_revenue.csv`) | undercount |
|---|---|---|---|
| 2024-01-01 .. 2024-01-07 | matches | matches | 0% |
| 2024-01-08 | 1845.00 | 1375.00 | 25.5% |
| 2024-01-09 | 1880.00 | 1345.00 | 28.5% |
| 2024-01-10 | 1750.00 | 1110.00 | 36.6% |

...matching the reported symptom ("daily revenue for the last 3 days looks
about 30% low") almost exactly.

## Expected investigation path

See `expectedInvestigationPath` in `scenario.json`. In short: the agent
should (1) notice `orders` volume doesn't match `daily_revenue` volume for
the last 3 days but does for earlier days, (2) anti-join `orders` against
`dim_customer` to isolate the unmatched `customer_id`s, (3) confirm those
customers are missing entirely from `dim_customer` (not just stale), and
(4) land on the inner join in `daily_revenue.py` as the root cause, citing
`dim_customer_loader.py`'s lagged refresh cadence as the underlying reason.

`scenario.json`'s `expectedHypothesisCategory` is `"late-arriving"`.

## Ground truth

See `groundTruthRootCause` in `scenario.json` for the full root-cause
statement used to grade/compare the agent's final report against.
