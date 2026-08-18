"""
dim_customer_loader.py
-----------------------
Loads the `dim_customer` SCD-1 dimension from the CRM export feed and
publishes a full snapshot to the lake for downstream marts (including
daily_revenue.py) to join against.

Schedule: Airflow DAG `crm_dim_sync`, runs every 2 days at 03:00 UTC (the
CRM vendor only produces a fresh full-customer export on that cadence --
see ticket DE-1187 for the vendor SLA). New customers who sign up between
export runs are therefore NOT visible in `dim_customer` until the next
export lands, typically a 1-2 day lag and up to ~48h in the worst case.

Reads:
  - crm_export       (s3://raw/crm/customer_export/)   full snapshot, vendor-delivered
Writes:
  - dim_customer      (s3://lake/curated/dim_customer/)  overwritten per run
"""

import logging

from pyspark.sql import SparkSession
from pyspark.sql import functions as F

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("dim_customer_loader")

CRM_EXPORT_PATH = "s3://raw/crm/customer_export/"
OUTPUT_PATH = "s3://lake/curated/dim_customer/"


def load_and_clean(spark: SparkSession, path: str = CRM_EXPORT_PATH):
    raw = spark.read.json(path)
    return (
        raw.select(
            F.col("id").alias("customer_id"),
            F.col("name").alias("customer_name"),
            F.col("region_code").alias("region"),
            F.col("segment").alias("segment"),
            F.col("created_at"),
        )
        .dropDuplicates(["customer_id"])
    )


def main():
    spark = SparkSession.builder.appName("dim_customer_loader").getOrCreate()
    try:
        dim_customer = load_and_clean(spark)
        logger.info("Writing dim_customer snapshot to %s", OUTPUT_PATH)
        dim_customer.write.mode("overwrite").parquet(OUTPUT_PATH)
    finally:
        spark.stop()


if __name__ == "__main__":
    main()
