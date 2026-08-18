"""
daily_revenue.py
-----------------
Nightly batch job: aggregates completed orders into a per-day, per-region
revenue rollup used by the Finance dashboard and the exec daily digest.

Schedule: Airflow DAG `finance_daily_rollup`, 05:00 UTC, after both upstream
loads (`orders_loader` and `dim_customer_loader`) have completed.

Reads:
  - orders          (s3://lake/curated/orders/)            fact table, append-only
  - dim_customer     (s3://lake/curated/dim_customer/)      SCD-1 dimension, full snapshot

Writes:
  - daily_revenue    (s3://lake/marts/finance/daily_revenue/)  overwritten per run

Owner: data-eng@company.example
"""

import argparse
import logging
import sys

from pyspark.sql import SparkSession
from pyspark.sql import functions as F

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("daily_revenue")

ORDERS_PATH = "s3://lake/curated/orders/"
DIM_CUSTOMER_PATH = "s3://lake/curated/dim_customer/"
OUTPUT_PATH = "s3://lake/marts/finance/daily_revenue/"


def build_spark_session(app_name: str = "daily_revenue") -> SparkSession:
    return (
        SparkSession.builder.appName(app_name)
        .config("spark.sql.shuffle.partitions", "64")
        .getOrCreate()
    )


def load_orders(spark: SparkSession, path: str = ORDERS_PATH):
    """Completed orders only -- refunds/cancellations are excluded upstream
    by the orders_loader job, so no status filter is needed here."""
    return spark.read.parquet(path)


def load_dim_customer(spark: SparkSession, path: str = DIM_CUSTOMER_PATH):
    """Full snapshot of the customer dimension, refreshed nightly by
    dim_customer_loader.py (see that job for load cadence)."""
    return spark.read.parquet(path)


def compute_daily_revenue(orders_df, dim_customer_df):
    """Join orders to their customer's region and roll up revenue per
    (order_date, region).

    NOTE: this join intentionally keys off customer_id since every order
    must belong to a known customer for revenue to be attributed to a
    region.
    """
    joined = orders_df.join(
        dim_customer_df,
        on="customer_id",
        how="inner",  # <-- BUG: drops any order whose customer_id has not
        #             yet landed in dim_customer (late-arriving dimension).
        #             dim_customer_loader runs on its own ~2-day-lagged
        #             cadence relative to new-customer signup, so orders
        #             placed by brand-new customers vanish from this
        #             rollup for a few days after signup -- and never
        #             backfill once the dimension does catch up, because
        #             this job overwrites the mart per run instead of
        #             re-processing prior days.
    )

    daily_revenue = (
        joined.groupBy("order_date", "region")
        .agg(
            F.sum("amount").alias("total_revenue"),
            F.count(F.lit(1)).alias("order_count"),
        )
        .orderBy("order_date", "region")
    )
    return daily_revenue


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--orders-path", default=ORDERS_PATH)
    parser.add_argument("--dim-customer-path", default=DIM_CUSTOMER_PATH)
    parser.add_argument("--output-path", default=OUTPUT_PATH)
    args = parser.parse_args(argv)

    spark = build_spark_session()
    try:
        orders_df = load_orders(spark, args.orders_path)
        dim_customer_df = load_dim_customer(spark, args.dim_customer_path)

        daily_revenue = compute_daily_revenue(orders_df, dim_customer_df)

        logger.info("Writing daily_revenue to %s", args.output_path)
        (
            daily_revenue.write.mode("overwrite")
            .partitionBy("order_date")
            .parquet(args.output_path)
        )
    finally:
        spark.stop()


if __name__ == "__main__":
    sys.exit(main())
