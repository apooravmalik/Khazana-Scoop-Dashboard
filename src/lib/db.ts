import "server-only";

import fs from "node:fs";
import path from "node:path";

import Database from "better-sqlite3";

import { defaultScoopTypes } from "@/lib/constants";

type SqliteDatabase = InstanceType<typeof Database>;

const databasePath = path.join(process.cwd(), "data", "khaza-scoop.db");

declare global {
  var khazaScoopDb: SqliteDatabase | undefined;
}

function tableExists(db: SqliteDatabase, tableName: string) {
  const row = db
    .prepare(
      `
        SELECT name
        FROM sqlite_master
        WHERE type = 'table' AND name = ?
      `,
    )
    .get(tableName) as { name?: string } | undefined;

  return Boolean(row?.name);
}

function columnExists(db: SqliteDatabase, tableName: string, columnName: string) {
  const columns = db.prepare(`PRAGMA table_info(${tableName})`).all() as Array<{
    name: string;
  }>;

  return columns.some((column) => column.name === columnName);
}

function getTableSql(db: SqliteDatabase, tableName: string) {
  const row = db
    .prepare(
      `
        SELECT sql
        FROM sqlite_master
        WHERE type = 'table' AND name = ?
      `,
    )
    .get(tableName) as { sql?: string } | undefined;

  return row?.sql ?? "";
}

function createOrdersTable(db: SqliteDatabase, tableName = "orders") {
  db.exec(`
    CREATE TABLE IF NOT EXISTS ${tableName} (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_name TEXT NOT NULL,
      customer_phone TEXT NOT NULL DEFAULT '',
      customer_address TEXT NOT NULL DEFAULT '',
      scoop_type_id INTEGER,
      scoop_name_snapshot TEXT NOT NULL,
      scoop_price REAL NOT NULL DEFAULT 0 CHECK(scoop_price >= 0),
      gift_count INTEGER NOT NULL DEFAULT 0 CHECK(gift_count >= 0),
      product_cost REAL NOT NULL DEFAULT 0 CHECK(product_cost >= 0),
      delivery_cost REAL,
      packaging_cost REAL,
      net_profit REAL NOT NULL DEFAULT 0,
      delivery_status TEXT NOT NULL DEFAULT 'pending' CHECK(delivery_status IN ('pending', 'delivering', 'delivered', 'cancelled')),
      payment_status TEXT NOT NULL DEFAULT 'unpaid' CHECK(payment_status IN ('unpaid', 'partial', 'paid')),
      ordered_at TEXT NOT NULL,
      delivery_date TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (scoop_type_id) REFERENCES scoop_types(id) ON DELETE SET NULL
    );
  `);
}

function migrateOrdersSchema(db: SqliteDatabase) {
  const hasOrdersTable = tableExists(db, "orders");
  const hasNewOrdersSchema =
    hasOrdersTable &&
    columnExists(db, "orders", "customer_phone") &&
    columnExists(db, "orders", "scoop_price") &&
    columnExists(db, "orders", "product_cost");

  if (!hasOrdersTable) {
    createOrdersTable(db);
    return;
  }

  if (hasNewOrdersSchema) {
    return;
  }

  db.exec(`
    DROP TABLE IF EXISTS orders_legacy_migration;
    ALTER TABLE orders RENAME TO orders_legacy_migration;
  `);

  createOrdersTable(db);

  db.exec(`
    INSERT INTO orders (
      id,
      customer_name,
      customer_phone,
      customer_address,
      scoop_name_snapshot,
      scoop_price,
      gift_count,
      product_cost,
      delivery_cost,
      packaging_cost,
      net_profit,
      delivery_status,
      payment_status,
      ordered_at,
      delivery_date,
      created_at
    )
    SELECT
      id,
      customer_name,
      '',
      '',
      COALESCE(product_name_snapshot, 'Legacy order'),
      COALESCE(order_value, 0),
      COALESCE(quantity, 0),
      0,
      NULL,
      NULL,
      COALESCE(order_value, 0),
      delivery_status,
      payment_status,
      ordered_at,
      delivery_date,
      created_at
    FROM orders_legacy_migration;
  `);
}

function initializeOrderItems(db: SqliteDatabase) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      product_name_snapshot TEXT NOT NULL,
      quantity INTEGER NOT NULL CHECK(quantity > 0),
      unit_cost_snapshot REAL NOT NULL DEFAULT 0 CHECK(unit_cost_snapshot >= 0),
      line_cost REAL NOT NULL DEFAULT 0 CHECK(line_cost >= 0),
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
    );
  `);

  if (tableExists(db, "orders_legacy_migration")) {
    db.exec(`
      INSERT INTO order_items (
        order_id,
        product_id,
        product_name_snapshot,
        quantity,
        unit_cost_snapshot,
        line_cost
      )
      SELECT
        orders_legacy_migration.id,
        orders_legacy_migration.product_id,
        orders_legacy_migration.product_name_snapshot,
        orders_legacy_migration.quantity,
        0,
        0
      FROM orders_legacy_migration
      WHERE orders_legacy_migration.product_id IS NOT NULL;

      DROP TABLE IF EXISTS orders_legacy_migration;
    `);
  }
}

function initializeScoopTypes(db: SqliteDatabase) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS scoop_types (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      price REAL NOT NULL DEFAULT 0 CHECK(price >= 0),
      sort_order INTEGER NOT NULL DEFAULT 0
    );
  `);

  for (const scoopType of defaultScoopTypes) {
    db.prepare(
      `
        INSERT OR IGNORE INTO scoop_types (name, price, sort_order)
        VALUES (?, ?, ?)
      `,
    ).run(scoopType.name, scoopType.price, scoopType.sort_order);
  }
}

function createExpensesTable(db: SqliteDatabase, tableName = "expenses") {
  db.exec(`
    CREATE TABLE IF NOT EXISTS ${tableName} (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category TEXT NOT NULL,
      description TEXT NOT NULL,
      amount REAL NOT NULL CHECK(amount >= 0),
      spent_at TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

function migrateExpensesSchema(db: SqliteDatabase) {
  const hasExpensesTable = tableExists(db, "expenses");

  if (!hasExpensesTable) {
    createExpensesTable(db);
    return;
  }

  const schemaSql = getTableSql(db, "expenses").toUpperCase();
  const usesLegacyCategoryCheck =
    schemaSql.includes("CHECK(CATEGORY IN ('INVENTORY'") ||
    schemaSql.includes("'MISCELLANEOUS'");
  const hasExpectedColumns =
    columnExists(db, "expenses", "description") &&
    columnExists(db, "expenses", "amount") &&
    columnExists(db, "expenses", "spent_at");

  if (!usesLegacyCategoryCheck && hasExpectedColumns) {
    return;
  }

  db.exec(`
    DROP TABLE IF EXISTS expenses_legacy_migration;
    ALTER TABLE expenses RENAME TO expenses_legacy_migration;
  `);

  createExpensesTable(db);

  db.exec(`
    INSERT INTO expenses (id, category, description, amount, spent_at, created_at)
    SELECT
      id,
      CASE category
        WHEN 'Inventory' THEN 'INVENTORY_PURCHASE'
        WHEN 'Advertising' THEN 'META_ADS'
        WHEN 'Packaging' THEN 'PACKAGING_PURCHASE'
        WHEN 'Shipping' THEN 'MISC'
        WHEN 'Miscellaneous' THEN 'MISC'
        ELSE UPPER(REPLACE(category, ' ', '_'))
      END,
      description,
      amount,
      spent_at,
      created_at
    FROM expenses_legacy_migration;

    DROP TABLE IF EXISTS expenses_legacy_migration;
  `);
}

function initializeSchema(db: SqliteDatabase) {
  db.exec(`
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      sku TEXT NOT NULL UNIQUE,
      category TEXT NOT NULL DEFAULT 'Mystery Scoop',
      stock_quantity INTEGER NOT NULL DEFAULT 0,
      reorder_point INTEGER NOT NULL DEFAULT 5,
      unit_cost REAL NOT NULL DEFAULT 0,
      selling_price REAL NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS stock_movements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      quantity_delta INTEGER NOT NULL,
      reason TEXT NOT NULL,
      note TEXT,
      unit_cost_snapshot REAL,
      movement_value REAL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS investments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      period_type TEXT NOT NULL CHECK(period_type IN ('week', 'month')),
      period_start TEXT NOT NULL,
      period_end TEXT NOT NULL,
      amount REAL NOT NULL CHECK(amount >= 0),
      note TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  if (!columnExists(db, "stock_movements", "unit_cost_snapshot")) {
    db.exec("ALTER TABLE stock_movements ADD COLUMN unit_cost_snapshot REAL;");
  }

  if (!columnExists(db, "stock_movements", "movement_value")) {
    db.exec("ALTER TABLE stock_movements ADD COLUMN movement_value REAL;");
  }

  initializeScoopTypes(db);
  migrateExpensesSchema(db);
  migrateOrdersSchema(db);
  initializeOrderItems(db);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_orders_ordered_at ON orders(ordered_at DESC);
    CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
    CREATE INDEX IF NOT EXISTS idx_expenses_spent_at ON expenses(spent_at DESC);
    CREATE INDEX IF NOT EXISTS idx_investments_period_start ON investments(period_start DESC);
    CREATE INDEX IF NOT EXISTS idx_stock_movements_created_at ON stock_movements(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_scoop_types_sort_order ON scoop_types(sort_order ASC);
  `);
}

export function getDb() {
  if (!global.khazaScoopDb) {
    fs.mkdirSync(path.dirname(databasePath), { recursive: true });
    global.khazaScoopDb = new Database(databasePath);
    global.khazaScoopDb.pragma("journal_mode = WAL");
    initializeSchema(global.khazaScoopDb);
  }

  return global.khazaScoopDb;
}

export { databasePath };
