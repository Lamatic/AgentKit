import type { Database, SqlJsStatic } from "sql.js";

export const DEMO_QUERY =
  "SELECT customer_id, SUM(total) AS revenue FROM orders WHERE created_at >= '2026-01-01' GROUP BY customer_id";

export function createDemoDatabase(SQL: SqlJsStatic): Database {
  const database = new SQL.Database();
  database.run(`
    CREATE TABLE customers (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      segment TEXT NOT NULL
    );
    CREATE TABLE orders (
      id INTEGER PRIMARY KEY,
      customer_id INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      total REAL NOT NULL,
      status TEXT NOT NULL,
      FOREIGN KEY (customer_id) REFERENCES customers(id)
    );
  `);

  database.run("BEGIN");
  const customer = database.prepare("INSERT INTO customers VALUES (?, ?, ?)");
  for (let id = 1; id <= 600; id += 1) {
    customer.run([id, `Customer ${id}`, ["startup", "growth", "enterprise"][id % 3]]);
  }
  customer.free();

  const order = database.prepare(
    "INSERT INTO orders (id, customer_id, created_at, total, status) VALUES (?, ?, ?, ?, ?)",
  );
  for (let id = 1; id <= 32_000; id += 1) {
    const year = id % 5 === 0 ? 2026 : 2025;
    const month = String((id % 12) + 1).padStart(2, "0");
    const day = String((id % 28) + 1).padStart(2, "0");
    order.run([
      id,
      (id * 37) % 600 + 1,
      `${year}-${month}-${day}`,
      ((id * 17) % 28_000) / 100 + 20,
      ["paid", "shipped", "refunded"][id % 3],
    ]);
  }
  order.free();
  database.run("COMMIT");

  return database;
}
