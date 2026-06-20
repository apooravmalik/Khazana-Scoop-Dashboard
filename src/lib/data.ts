import "server-only";

import {
  defaultScoopTypes,
  lowStockThreshold,
  manualExpenseCategories,
  manualExpenseCategoryLabels,
} from "@/lib/constants";
import { getSupabase } from "@/lib/db";
import type {
  DashboardData,
  Expense,
  ExpenseBreakdown,
  ExpenseInsights,
  OrderDetail,
  OrderItem,
  OrderRow,
  Product,
  ScoopType,
  StockMovement,
} from "@/lib/types";

type OrderRecord = {
  id: number;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  scoop_type_id: number | null;
  scoop_name_snapshot: string;
  scoop_price: number;
  gift_count: number;
  product_cost: number;
  delivery_cost: number | null;
  packaging_cost: number | null;
  net_profit: number;
  delivery_status: string;
  payment_status: string;
  ordered_at: string;
  delivery_date: string | null;
  created_at: string;
  order_items: Array<{
    id: number;
    order_id: number;
    product_id: number;
    product_name_snapshot: string;
    quantity: number;
    unit_cost_snapshot: number;
    line_cost: number;
  }> | null;
};

type StockMovementRecord = {
  id: number;
  product_id: number;
  quantity_delta: number;
  reason: string;
  note: string | null;
  unit_cost_snapshot: number | null;
  movement_value: number | null;
  created_at: string;
  products: { name: string } | { name: string }[] | null;
};

type PurchaseTotalRecord = {
  product_id: number;
  quantity_delta: number;
  reason: string;
};

function unwrapData<T>(data: T | null, error: { message: string } | null, context: string) {
  if (error) {
    throw new Error(`${context}: ${error.message}`);
  }

  return data;
}

function hasMissingTotalPurchasedColumnError(error: { message: string } | null) {
  return Boolean(error?.message.includes("total_purchased_quantity"));
}

function toNumber(value: number | string | null | undefined) {
  return Number(value ?? 0);
}

function mapOrderItems(items: OrderRecord["order_items"]): OrderItem[] {
  return (items ?? []).map((item) => ({
    id: Number(item.id),
    order_id: Number(item.order_id),
    product_id: Number(item.product_id),
    product_name_snapshot: item.product_name_snapshot,
    quantity: Number(item.quantity),
    unit_cost_snapshot: toNumber(item.unit_cost_snapshot),
    line_cost: toNumber(item.line_cost),
  }));
}

function mapOrderRow(order: OrderRecord): OrderRow {
  const items = mapOrderItems(order.order_items);

  return {
    id: Number(order.id),
    customer_name: order.customer_name,
    customer_phone: order.customer_phone,
    customer_address: order.customer_address,
    scoop_name: order.scoop_name_snapshot,
    scoop_price: toNumber(order.scoop_price),
    gift_count: Number(order.gift_count),
    products_summary:
      items.length > 0
        ? items
            .map((item) => `${item.product_name_snapshot} x${item.quantity}`)
            .join(", ")
        : "No gifts selected",
    product_cost: toNumber(order.product_cost),
    delivery_cost: order.delivery_cost === null ? null : toNumber(order.delivery_cost),
    packaging_cost: order.packaging_cost === null ? null : toNumber(order.packaging_cost),
    total_expense:
      toNumber(order.product_cost) +
      toNumber(order.delivery_cost) +
      toNumber(order.packaging_cost),
    net_profit: toNumber(order.net_profit),
    delivery_status: order.delivery_status,
    payment_status: order.payment_status,
    ordered_at: order.ordered_at,
    delivery_date: order.delivery_date,
    created_at: order.created_at,
  };
}

function mapOrderDetail(order: OrderRecord): OrderDetail {
  return {
    ...mapOrderRow(order),
    scoop_type_id: order.scoop_type_id === null ? null : Number(order.scoop_type_id),
    items: mapOrderItems(order.order_items),
  };
}

function mapMovementProductName(record: StockMovementRecord) {
  if (Array.isArray(record.products)) {
    return record.products[0]?.name ?? "Unknown item";
  }

  return record.products?.name ?? "Unknown item";
}

function getStockMovementKind(
  reason: string,
  note: string | null,
): "purchase" | "correction" | "order" | "return" | "initial" | "unknown" {
  if (reason === "Initial stock") {
    return "initial";
  }

  if (reason.startsWith("[Purchase]")) {
    return "purchase";
  }

  if (reason.startsWith("[Correction]")) {
    return "correction";
  }

  if (reason.startsWith("Order #")) {
    if (note?.startsWith("Returned from") || reason.includes("deleted")) {
      return "return";
    }

    return "order";
  }

  return "unknown";
}

function countsTowardPurchasedTotal(reason: string) {
  return reason === "Initial stock" || reason.startsWith("[Purchase]");
}

async function getPurchasedTotalsMap() {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("stock_movements")
    .select("product_id, quantity_delta, reason")
    .gt("quantity_delta", 0);

  const rows = unwrapData(
    data,
    error,
    "Unable to load purchase totals",
  ) as PurchaseTotalRecord[];

  return rows.reduce((totals, row) => {
    const productId = Number(row.product_id);

    if (!countsTowardPurchasedTotal(row.reason)) {
      return totals;
    }

    totals.set(productId, (totals.get(productId) ?? 0) + Number(row.quantity_delta));
    return totals;
  }, new Map<number, number>());
}

async function getOrdersInternal(limit?: number) {
  const supabase = getSupabase();
  let query = supabase
    .from("orders")
    .select(
      `
        id,
        customer_name,
        customer_phone,
        customer_address,
        scoop_type_id,
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
        created_at,
        order_items (
          id,
          order_id,
          product_id,
          product_name_snapshot,
          quantity,
          unit_cost_snapshot,
          line_cost
        )
      `,
    )
    .order("ordered_at", { ascending: false })
    .order("id", { ascending: false });

  if (typeof limit === "number") {
    query = query.limit(limit);
  }

  const { data, error } = await query;

  return unwrapData(data, error, "Unable to load orders") as OrderRecord[];
}

export async function getScoopTypes() {
  const supabase = getSupabase();
  const { data: existingTypes, error: existingTypesError } = await supabase
    .from("scoop_types")
    .select("id, name");

  const existing = unwrapData(
    existingTypes,
    existingTypesError,
    "Unable to load scoop types",
  ) as Array<{ id: number; name: string }>;
  const existingNames = new Set(existing.map((item) => item.name));
  const missingTypes = defaultScoopTypes.filter(
    (scoopType) => !existingNames.has(scoopType.name),
  );

  if (missingTypes.length > 0) {
    const { error: insertError } = await supabase.from("scoop_types").upsert(
      missingTypes,
      {
        onConflict: "name",
        ignoreDuplicates: true,
      },
    );

    if (insertError) {
      throw new Error(`Unable to create default scoop types: ${insertError.message}`);
    }
  }

  const { data, error } = await supabase
    .from("scoop_types")
    .select("id, name, price, sort_order")
    .order("sort_order", { ascending: true })
    .order("id", { ascending: true });

  return unwrapData(data, error, "Unable to load scoop types") as ScoopType[];
}

export async function getDashboardData(): Promise<DashboardData> {
  const [orders, products, allExpenses, recentExpenses, recentChanges] = await Promise.all([
    getOrdersInternal(6),
    getProducts(),
    getExpenses(),
    getExpenses(6),
    getRecentStockChanges(6),
  ]);

  const supabase = getSupabase();
  const { data: allOrderData, error: allOrderError } = await supabase
    .from("orders")
    .select(
      `
        id,
        customer_name,
        customer_phone,
        customer_address,
        scoop_type_id,
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
        created_at,
        order_items (
          id,
          order_id,
          product_id,
          product_name_snapshot,
          quantity,
          unit_cost_snapshot,
          line_cost
        )
      `,
    )
    .order("ordered_at", { ascending: false })
    .order("id", { ascending: false });

  const allOrders = unwrapData(
    allOrderData,
    allOrderError,
    "Unable to load dashboard orders",
  ) as OrderRecord[];

  const recentOrders = orders.map(mapOrderRow);
  const paidOrders = allOrders.filter((order) => order.payment_status === "paid");
  const unpaidOrders = allOrders.filter((order) => order.payment_status !== "paid");
  const lowStockItems = products.filter((product) => product.stock_quantity <= lowStockThreshold);

  const expenseBreakdown: ExpenseBreakdown[] = manualExpenseCategories
    .map((category) => ({
      category: manualExpenseCategoryLabels[category],
      total: allExpenses
        .filter((expense) => expense.category === category)
        .reduce((sum, expense) => sum + expense.amount, 0),
    }))
    .sort((left, right) => right.total - left.total);

  const cashIn = paidOrders.reduce((sum, order) => sum + toNumber(order.scoop_price), 0);
  const cashOut = allExpenses.reduce((sum, expense) => sum + toNumber(expense.amount), 0);
  const pendingCash = unpaidOrders.reduce((sum, order) => sum + toNumber(order.scoop_price), 0);
  const totalProductCost = paidOrders.reduce(
    (sum, order) => sum + toNumber(order.product_cost),
    0,
  );
  const totalDeliveryCost = paidOrders.reduce(
    (sum, order) => sum + toNumber(order.delivery_cost),
    0,
  );
  const totalPackagingCost = paidOrders.reduce(
    (sum, order) => sum + toNumber(order.packaging_cost),
    0,
  );
  const orderContributionProfit = paidOrders.reduce(
    (sum, order) => sum + toNumber(order.net_profit),
    0,
  );
  const inventoryPurchases = allExpenses
    .filter((expense) => expense.category === "INVENTORY_PURCHASE")
    .reduce((sum, expense) => sum + expense.amount, 0);
  const metaAdsSpend = allExpenses
    .filter((expense) => expense.category === "META_ADS")
    .reduce((sum, expense) => sum + expense.amount, 0);
  const packagingPurchases = allExpenses
    .filter((expense) => expense.category === "PACKAGING_PURCHASE")
    .reduce((sum, expense) => sum + expense.amount, 0);
  const miscExpenses = allExpenses
    .filter((expense) => expense.category === "MISC")
    .reduce((sum, expense) => sum + expense.amount, 0);
  const inventoryUsed = allOrders.reduce(
    (sum, order) => sum + toNumber(order.product_cost),
    0,
  );
  const inventoryLeftValue = products.reduce(
    (sum, product) => sum + product.stock_quantity * product.unit_cost,
    0,
  );

  return {
    metrics: {
      cashIn,
      cashOut,
      cashLeft: cashIn - cashOut,
      pendingCash,
      grossSales: cashIn,
      totalOrders: allOrders.length,
      paidOrders: paidOrders.length,
      unpaidOrders: unpaidOrders.length,
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
      pendingOrders: allOrders.filter((order) => order.delivery_status === "pending").length,
      deliveringOrders: allOrders.filter((order) => order.delivery_status === "delivering")
        .length,
    },
    lowStockItems,
    recentOrders,
    recentExpenses,
    recentChanges,
    expenseBreakdown,
  };
}

export async function getProducts(): Promise<Product[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("products")
    .select(
      "id, name, category, total_purchased_quantity, stock_quantity, unit_cost, created_at, updated_at",
    )
    .order("name", { ascending: true })
    .order("id", { ascending: true });

  if (hasMissingTotalPurchasedColumnError(error)) {
    const [fallbackResult, purchasedTotals] = await Promise.all([
      supabase
        .from("products")
        .select("id, name, category, stock_quantity, unit_cost, created_at, updated_at")
        .order("name", { ascending: true })
        .order("id", { ascending: true }),
      getPurchasedTotalsMap(),
    ]);
    const { data: fallbackData, error: fallbackError } = fallbackResult;

    return (unwrapData(
      fallbackData,
      fallbackError,
      "Unable to load products",
    ) as Product[]).map((product) => ({
      ...product,
      id: Number(product.id),
      total_purchased_quantity: Math.max(
        Number(product.stock_quantity),
        purchasedTotals.get(Number(product.id)) ?? 0,
      ),
      stock_quantity: Number(product.stock_quantity),
      unit_cost: toNumber(product.unit_cost),
    }));
  }

  return (unwrapData(data, error, "Unable to load products") as Product[]).map((product) => ({
    ...product,
    id: Number(product.id),
    total_purchased_quantity: Number(product.total_purchased_quantity),
    stock_quantity: Number(product.stock_quantity),
    unit_cost: toNumber(product.unit_cost),
  }));
}

export async function getProductById(productId: number): Promise<Product | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("products")
    .select(
      "id, name, category, total_purchased_quantity, stock_quantity, unit_cost, created_at, updated_at",
    )
    .eq("id", productId)
    .maybeSingle();

  if (hasMissingTotalPurchasedColumnError(error)) {
    const [{ data: fallbackData, error: fallbackError }, purchasedTotals] = await Promise.all([
      supabase
        .from("products")
        .select("id, name, category, stock_quantity, unit_cost, created_at, updated_at")
        .eq("id", productId)
        .maybeSingle(),
      getPurchasedTotalsMap(),
    ]);
    const fallbackProduct = unwrapData(
      fallbackData,
      fallbackError,
      "Unable to load product",
    );

    if (!fallbackProduct) {
      return null;
    }

    return {
      ...fallbackProduct,
      id: Number(fallbackProduct.id),
      total_purchased_quantity: Math.max(
        Number(fallbackProduct.stock_quantity),
        purchasedTotals.get(Number(fallbackProduct.id)) ?? 0,
      ),
      stock_quantity: Number(fallbackProduct.stock_quantity),
      unit_cost: toNumber(fallbackProduct.unit_cost),
    } as Product;
  }

  const product = unwrapData(data, error, "Unable to load product");

  if (!product) {
    return null;
  }

  return {
    ...product,
    id: Number(product.id),
    total_purchased_quantity: Number(product.total_purchased_quantity),
    stock_quantity: Number(product.stock_quantity),
    unit_cost: toNumber(product.unit_cost),
  } as Product;
}

export async function getStockMovements(): Promise<StockMovement[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("stock_movements")
    .select(
      `
        id,
        product_id,
        quantity_delta,
        reason,
        note,
        unit_cost_snapshot,
        movement_value,
        created_at,
        products ( name )
      `,
    )
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(12);

  const rows = unwrapData(
    data,
    error,
    "Unable to load stock movements",
  ) as StockMovementRecord[];

  return rows.map((movement) => ({
    id: Number(movement.id),
    product_name: mapMovementProductName(movement),
    change_kind: getStockMovementKind(movement.reason, movement.note),
    quantity_delta: Number(movement.quantity_delta),
    reason: movement.reason,
    note: movement.note,
    unit_cost_snapshot:
      movement.unit_cost_snapshot === null ? null : toNumber(movement.unit_cost_snapshot),
    movement_value: movement.movement_value === null ? null : toNumber(movement.movement_value),
    created_at: movement.created_at,
  }));
}

export async function getOrders(): Promise<OrderRow[]> {
  const orders = await getOrdersInternal();

  return orders.map(mapOrderRow);
}

export async function getOrderById(orderId: number): Promise<OrderDetail | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("orders")
    .select(
      `
        id,
        customer_name,
        customer_phone,
        customer_address,
        scoop_type_id,
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
        created_at,
        order_items (
          id,
          order_id,
          product_id,
          product_name_snapshot,
          quantity,
          unit_cost_snapshot,
          line_cost
        )
      `,
    )
    .eq("id", orderId)
    .maybeSingle();

  const order = unwrapData(data, error, "Unable to load order") as OrderRecord | null;

  return order ? mapOrderDetail(order) : null;
}

export async function getExpenseInsights(): Promise<ExpenseInsights> {
  const dashboard = await getDashboardData();
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
    recentChanges: dashboard.recentChanges,
  };
}

async function getExpenses(limit?: number): Promise<Expense[]> {
  const supabase = getSupabase();
  let query = supabase
    .from("expenses")
    .select("id, category, description, amount, spent_at, created_at")
    .order("spent_at", { ascending: false })
    .order("id", { ascending: false });

  if (typeof limit === "number") {
    query = query.limit(limit);
  }

  const { data, error } = await query;

  return (unwrapData(data, error, "Unable to load expenses") as Expense[]).map((expense) => ({
    ...expense,
    id: Number(expense.id),
    amount: toNumber(expense.amount),
  }));
}

async function getRecentStockChanges(limit: number): Promise<StockMovement[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("stock_movements")
    .select(
      `
        id,
        product_id,
        quantity_delta,
        reason,
        note,
        unit_cost_snapshot,
        movement_value,
        created_at,
        products ( name )
      `,
    )
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(limit);

  const rows = unwrapData(
    data,
    error,
    "Unable to load recent changes",
  ) as StockMovementRecord[];

  return rows.map((movement) => ({
    id: Number(movement.id),
    product_name: mapMovementProductName(movement),
    change_kind: getStockMovementKind(movement.reason, movement.note),
    quantity_delta: Number(movement.quantity_delta),
    reason: movement.reason,
    note: movement.note,
    unit_cost_snapshot:
      movement.unit_cost_snapshot === null ? null : toNumber(movement.unit_cost_snapshot),
    movement_value: movement.movement_value === null ? null : toNumber(movement.movement_value),
    created_at: movement.created_at,
  }));
}
