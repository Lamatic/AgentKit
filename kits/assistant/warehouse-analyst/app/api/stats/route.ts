import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";

export async function POST(req: NextRequest) {
  const { connectionUrl } = await req.json();

  const dbUrl = connectionUrl || process.env.DATABASE_URL;

  if (!dbUrl) {
    return NextResponse.json(
      { error: "Missing database connection URL" },
      { status: 400 },
    );
  }

  // Create a pool with the provided or default connection URL
  const pool = new Pool({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false },
  });

  try {
    // Fetch all required stats in parallel
    const [productsResult, inventoryResult, warehousesResult, ordersResult] =
      await Promise.all([
        // Total products count
        pool.query("SELECT COUNT(*) as count FROM products"),
        // Total stock across all warehouses
        pool.query("SELECT COALESCE(SUM(quantity), 0) as total FROM inventory"),
        // Count of warehouses
        pool.query("SELECT COUNT(*) as count FROM warehouses"),
        // Count of pending orders
        pool.query(
          `SELECT COUNT(*) as count FROM orders WHERE status = 'pending'`,
        ),
      ]);

    await pool.end();

    const stats = {
      totalProducts: String(productsResult.rows[0]?.count || 0),
      totalStock: String(inventoryResult.rows[0]?.total || 0),
      warehouses: String(warehousesResult.rows[0]?.count || 0),
      pendingOrders: String(ordersResult.rows[0]?.count || 0),
    };

    return NextResponse.json({ stats });
  } catch (error: any) {
    console.error("❌ Failed to fetch stats:", error.message);
    await pool.end();
    return NextResponse.json(
      { error: `Failed to fetch stats: ${error.message}` },
      { status: 500 },
    );
  }
}
