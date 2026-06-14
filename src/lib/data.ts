import "server-only";

import {
  lowStockThreshold,
  manualExpenseCategories,
  manualExpenseCategoryLabels,
} from "@/lib/constants";
import { getDb } from "@/lib/db";
import type {
  DashboardData,
  Expense,
  ExpenseInsights,
  OrderRow,
  Product,
  ScoopType,
  StockMovement,
} from "@/lib/types";

function getNumberResult(
  query: string,
  params: Array<string | number | bigint | null> = [],
  field = "total",
) {
  const db = getDb();
  const row = db.prepare(query).get(...params) as Record<string, number | null>;

  return Number(row[field] ?? 0);
}

function getOrderSelectClause(limit?: number) {
  return `
    SELECT
      orders.id,
      orders.customer_name,
      orders.customer_phone,
      orders.customer_address,
      orders.scoop_name_snapshot AS scoop_name,
      orders.scoop_price,
      orders.gift_count,
      COALESCE(
        GROUP_CONCAT(
          order_items.product_name_snapshot || ' x' || order_items.quantity,
          ', '
        ),
        'No gifts selected'
      ) AS products_summary,
      orders.product_cost,
      orders.delivery_cost,
      orders.packaging_cost,
      orders.product_cost
        + COALESCE(orders.delivery_cost, 0)
        + COALESCE(orders.packaging_cost, 0) AS total_expense,
      orders.net_profit,
      orders.delivery_status,
      orders.payment_status,
      orders.ordered_at,
      orders.delivery_date,
      orders.created_at
    FROM orders
    LEFT JOIN order_items ON order_items.order_id = orders.id
    GROUP BY orders.id
    ORDER BY orders.ordered_at DESC, orders.id DESC
    ${typeof limit === "number" ? `LIMIT ${limit}` : ""}
  `;
}

function getExpenseBreakdown() {
  return manualExpenseCategories
    .map((category) => ({
      category: manualExpenseCategoryLabels[category],
      total: getNumberResult(
        "SELECT COALESCE(SUM(amount), 0) AS total FROM expenses WHERE category = ?",
        [category],
      ),
    }))
    .sort((left, right) => right.total - left.total);
}

function getRecentExpenses(limit = 6) {
  const db = getDb();

  return db
    .prepare(
      `
        SELECT id, category, description, amount, spent_at, created_at
        FROM expenses
        ORDER BY spent_at DESC, id DESC
        LIMIT ?
      `,
    )
    .all(limit) as Expense[];
}

function getRecentStockRefills(limit = 6) {
  const db = getDb();

  return db
    .prepare(
      `
        SELECT
          stock_movements.id,
          products.name AS product_name,
          stock_movements.quantity_delta,
          stock_movements.reason,
          stock_movements.note,
          stock_movements.unit_cost_snapshot,
          stock_movements.movement_value,
          stock_movements.created_at
        FROM stock_movements
        INNER JOIN products ON products.id = stock_movements.product_id
        WHERE stock_movements.quantity_delta > 0
        ORDER BY stock_movements.created_at DESC, stock_movements.id DESC
        LIMIT ?
      `,
    )
    .all(limit) as StockMovement[];
}

export function getScoopTypes() {
  const db = getDb();

  return db
    .prepare(
      `
        SELECT id, name, price, sort_order
        FROM scoop_types
        ORDER BY sort_order ASC, id ASC
      `,
    )
    .all() as ScoopType[];
}

export function getDashboardData(): DashboardData {
  const db = getDb();
  const cashIn = getNumberResult(
    "SELECT COALESCE(SUM(scoop_price), 0) AS total FROM orders WHERE payment_status = 'paid'",
  );
  const cashOut = getNumberResult("SELECT COALESCE(SUM(amount), 0) AS total FROM expenses");
  const pendingCash = getNumberResult(
    "SELECT COALESCE(SUM(scoop_price), 0) AS total FROM orders WHERE payment_status != 'paid'",
  );
  const totalOrders = getNumberResult("SELECT COUNT(*) AS total FROM orders");
  const paidOrders = getNumberResult(
    "SELECT COUNT(*) AS total FROM orders WHERE payment_status = 'paid'",
  );
  const unpaidOrders = totalOrders - paidOrders;
  const totalProductCost = getNumberResult(
    "SELECT COALESCE(SUM(product_cost), 0) AS total FROM orders WHERE payment_status = 'paid'",
  );
  const totalDeliveryCost = getNumberResult(
    "SELECT COALESCE(SUM(COALESCE(delivery_cost, 0)), 0) AS total FROM orders WHERE payment_status = 'paid'",
  );
  const totalPackagingCost = getNumberResult(
    "SELECT COALESCE(SUM(COALESCE(packaging_cost, 0)), 0) AS total FROM orders WHERE payment_status = 'paid'",
  );
  const orderContributionProfit = getNumberResult(
    "SELECT COALESCE(SUM(net_profit), 0) AS total FROM orders WHERE payment_status = 'paid'",
  );
  const inventoryPurchases = getNumberResult(
    "SELECT COALESCE(SUM(amount), 0) AS total FROM expenses WHERE category = 'INVENTORY_PURCHASE'",
  );
  const metaAdsSpend = getNumberResult(
    "SELECT COALESCE(SUM(amount), 0) AS total FROM expenses WHERE category = 'META_ADS'",
  );
  const packagingPurchases = getNumberResult(
    "SELECT COALESCE(SUM(amount), 0) AS total FROM expenses WHERE category = 'PACKAGING_PURCHASE'",
  );
  const miscExpenses = getNumberResult(
    "SELECT COALESCE(SUM(amount), 0) AS total FROM expenses WHERE category = 'MISC'",
  );
  const inventoryUsed = getNumberResult(
    "SELECT COALESCE(SUM(product_cost), 0) AS total FROM orders",
  );
  const inventoryLeftValue = getNumberResult(
    "SELECT COALESCE(SUM(stock_quantity * unit_cost), 0) AS total FROM products",
  );

  const lowStockItems = db
    .prepare(
      `
        SELECT id, name, category, stock_quantity, unit_cost, created_at, updated_at
        FROM products
        WHERE stock_quantity <= ?
        ORDER BY stock_quantity ASC, name ASC
      `,
    )
    .all(lowStockThreshold) as Product[];

  const recentOrders = db.prepare(getOrderSelectClause(6)).all() as OrderRow[];
  const recentExpenses = getRecentExpenses(6);
  const recentStockRefills = getRecentStockRefills(6);
  const expenseBreakdown = getExpenseBreakdown();

  const pendingOrders = getNumberResult(
    "SELECT COUNT(*) AS total FROM orders WHERE delivery_status = 'pending'",
  );
  const deliveringOrders = getNumberResult(
    "SELECT COUNT(*) AS total FROM orders WHERE delivery_status = 'delivering'",
  );

  return {
    metrics: {
      cashIn,
      cashOut,
      cashLeft: cashIn - cashOut,
      pendingCash,
      grossSales: cashIn,
      totalOrders,
      paidOrders,
      unpaidOrders,
      totalProductCost,
      totalDeliveryCost,
      totalPackagingCost,
      orderContributionProfit,
      finalBusinessProfit:
        orderContributionProfit - (metaAdsSpend + packagingPurchases + miscExpenses),
      inventoryPurchases,
      metaAdsSpend,
      packagingPurchases,
      miscExpenses,
      inventoryUsed,
      inventoryLeftValue,
      lowStockCount: lowStockItems.length,
      pendingOrders,
      deliveringOrders,
    },
    lowStockItems,
    recentOrders,
    recentExpenses,
    recentStockRefills,
    expenseBreakdown,
  };
}

export function getProducts() {
  const db = getDb();

  return db
    .prepare(
      `
        SELECT id, name, category, stock_quantity, unit_cost, created_at, updated_at
        FROM products
        ORDER BY name ASC, id ASC
      `,
    )
    .all() as Product[];
}

export function getStockMovements() {
  const db = getDb();

  return db
    .prepare(
      `
        SELECT
          stock_movements.id,
          products.name AS product_name,
          stock_movements.quantity_delta,
          stock_movements.reason,
          stock_movements.note,
          stock_movements.unit_cost_snapshot,
          stock_movements.movement_value,
          stock_movements.created_at
        FROM stock_movements
        INNER JOIN products ON products.id = stock_movements.product_id
        ORDER BY stock_movements.created_at DESC, stock_movements.id DESC
        LIMIT 12
      `,
    )
    .all() as StockMovement[];
}

export function getOrders() {
  const db = getDb();

  return db.prepare(getOrderSelectClause()).all() as OrderRow[];
}

export function getExpenseInsights(): ExpenseInsights {
  const dashboard = getDashboardData();
  const nonZeroBreakdown = dashboard.expenseBreakdown.filter((item) => item.total > 0);

  return {
    cashIn: dashboard.metrics.cashIn,
    cashOut: dashboard.metrics.cashOut,
    cashLeft: dashboard.metrics.cashLeft,
    pendingCash: dashboard.metrics.pendingCash,
    grossSales: dashboard.metrics.grossSales,
    totalProductCost: dashboard.metrics.totalProductCost,
    totalDeliveryCost: dashboard.metrics.totalDeliveryCost,
    totalPackagingCost: dashboard.metrics.totalPackagingCost,
    orderContributionProfit: dashboard.metrics.orderContributionProfit,
    finalBusinessProfit: dashboard.metrics.finalBusinessProfit,
    inventoryPurchases: dashboard.metrics.inventoryPurchases,
    metaAdsSpend: dashboard.metrics.metaAdsSpend,
    packagingPurchases: dashboard.metrics.packagingPurchases,
    miscExpenses: dashboard.metrics.miscExpenses,
    inventoryLeftValue: dashboard.metrics.inventoryLeftValue,
    topExpenseCategory: nonZeroBreakdown[0]?.category ?? "No expense data",
    breakdown: dashboard.expenseBreakdown,
    recentExpenses: dashboard.recentExpenses,
    recentOrders: dashboard.recentOrders,
    recentStockRefills: dashboard.recentStockRefills,
  };
}
