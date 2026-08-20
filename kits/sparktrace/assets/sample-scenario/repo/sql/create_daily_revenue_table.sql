-- DDL for the Athena/Glue-registered output table of daily_revenue.py.
-- Mirrors the demo CSV schema used in assets/sample-scenario/data/daily_revenue.csv.

CREATE EXTERNAL TABLE IF NOT EXISTS finance.daily_revenue (
    region        string,
    total_revenue double,
    order_count   bigint
)
PARTITIONED BY (order_date string)
STORED AS PARQUET
LOCATION 's3://lake/marts/finance/daily_revenue/';

-- Source tables the job reads from (for reference during investigation):

CREATE EXTERNAL TABLE IF NOT EXISTS raw.orders (
    order_id    string,
    customer_id string,
    order_date  string,
    amount      double,
    status      string
)
STORED AS PARQUET
LOCATION 's3://lake/curated/orders/';

CREATE EXTERNAL TABLE IF NOT EXISTS raw.dim_customer (
    customer_id   string,
    customer_name string,
    region        string,
    segment       string,
    created_at    string
)
STORED AS PARQUET
LOCATION 's3://lake/curated/dim_customer/';
