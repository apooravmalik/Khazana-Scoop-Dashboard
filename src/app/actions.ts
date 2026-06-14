"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { loginOwner, logoutOwner } from "@/lib/auth";
import { manualExpenseCategories } from "@/lib/constants";
import { getDb } from "@/lib/db";

type SelectedOrderItem = {
  productId: number;
  quantity: number;
};

function getText(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function getNumber(formData: FormData, key: string) {
  return Number(getText(formData, key));
}

function getOptionalNumber(formData: FormData, key: string) {
  const value = getText(formData, key);

  return value ? Number(value) : null;
}

function refreshApp() {
  revalidatePath("/");
  revalidatePath("/stock");
  revalidatePath("/orders");
  revalidatePath("/expenses");
  revalidatePath("/query-tester");
}

function slugifyName(value: string) {
  return value
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 36);
}

function generateInternalSku(name: string) {
  const db = getDb();
  const base = slugifyName(name) || "ITEM";
  let candidate = base;
  let suffix = 2;

  while (
    db.prepare("SELECT id FROM products WHERE sku = ?").get(candidate) as
      | { id: number }
      | undefined
  ) {
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }

  return candidate;
}

function parseSelectedItems(formData: FormData) {
  const rawValue = getText(formData, "selected_items_json");

  if (!rawValue) {
    return [] as SelectedOrderItem[];
  }

  try {
    const parsed = JSON.parse(rawValue) as Array<{
      productId: number;
      quantity: number;
    }>;

    return parsed
      .map((item) => ({
        productId: Number(item.productId),
        quantity: Number(item.quantity),
      }))
      .filter((item) => item.productId > 0 && item.quantity > 0);
  } catch {
    return [];
  }
}

function calculateNetProfit(
  scoopPrice: number,
  productCost: number,
  deliveryCost: number,
  packagingCost: number,
) {
  return scoopPrice - productCost - deliveryCost - packagingCost;
}

function isValidManualExpenseCategory(value: string) {
  return manualExpenseCategories.includes(
    value as (typeof manualExpenseCategories)[number],
  );
}

export async function loginAction(formData: FormData) {
  const email = getText(formData, "email");
  const password = getText(formData, "password");

  if (!(await loginOwner(email, password))) {
    redirect("/login?error=invalid");
  }

  redirect("/");
}

export async function logoutAction() {
  await logoutOwner();
  redirect("/login");
}

export async function createProductAction(formData: FormData) {
  const name = getText(formData, "name");
  const category = getText(formData, "category") || "Mystery Scoop";
  const initialStock = Math.max(0, getNumber(formData, "stock_quantity"));
  const unitCost = Math.max(0, getNumber(formData, "unit_cost"));

  if (!name) {
    redirect("/stock?error=missing-product-name");
  }

  const db = getDb();
  const sku = generateInternalSku(name);

  const transaction = db.transaction(() => {
    const result = db
      .prepare(
        `
          INSERT INTO products (
            name,
            sku,
            category,
            stock_quantity,
            reorder_point,
            unit_cost,
            selling_price,
            updated_at
          )
          VALUES (?, ?, ?, ?, 0, ?, 0, CURRENT_TIMESTAMP)
        `,
      )
      .run(name, sku, category, initialStock, unitCost);

    if (initialStock > 0) {
      db.prepare(
        `
          INSERT INTO stock_movements (
            product_id,
            quantity_delta,
            reason,
            note,
            unit_cost_snapshot,
            movement_value
          )
          VALUES (?, ?, 'Initial stock', 'Opening quantity during product creation', ?, ?)
        `,
      ).run(result.lastInsertRowid, initialStock, unitCost, initialStock * unitCost);
    }
  });

  transaction();
  refreshApp();
  redirect("/stock");
}

export async function adjustStockAction(formData: FormData) {
  const productId = getNumber(formData, "product_id");
  const quantityDelta = getNumber(formData, "quantity_delta");
  const reason = getText(formData, "reason");
  const note = getText(formData, "note");
  const providedUnitCost = getOptionalNumber(formData, "unit_cost");

  if (!productId || !quantityDelta || !reason) {
    redirect("/stock?error=invalid-stock-adjustment");
  }

  const db = getDb();
  const product = db
    .prepare("SELECT id, stock_quantity, unit_cost FROM products WHERE id = ?")
    .get(productId) as
    | { id: number; stock_quantity: number; unit_cost: number }
    | undefined;

  if (!product || product.stock_quantity + quantityDelta < 0) {
    redirect("/stock?error=stock-would-go-negative");
  }

  const activeUnitCost =
    providedUnitCost !== null && Number.isFinite(providedUnitCost)
      ? Math.max(0, providedUnitCost)
      : product.unit_cost;
  const movementValue = Math.abs(quantityDelta) * activeUnitCost;

  const transaction = db.transaction(() => {
    db.prepare(
      `
        UPDATE products
        SET
          stock_quantity = stock_quantity + ?,
          unit_cost = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `,
    ).run(quantityDelta, activeUnitCost, productId);

    db.prepare(
      `
        INSERT INTO stock_movements (
          product_id,
          quantity_delta,
          reason,
          note,
          unit_cost_snapshot,
          movement_value
        )
        VALUES (?, ?, ?, ?, ?, ?)
      `,
    ).run(productId, quantityDelta, reason, note || null, activeUnitCost, movementValue);
  });

  transaction();
  refreshApp();
  redirect("/stock");
}

export async function updateScoopPricesAction(formData: FormData) {
  const db = getDb();
  const scoopTypes = db
    .prepare("SELECT id FROM scoop_types ORDER BY sort_order ASC, id ASC")
    .all() as Array<{ id: number }>;

  const transaction = db.transaction(() => {
    for (const scoopType of scoopTypes) {
      const price = Math.max(0, getNumber(formData, `price_${scoopType.id}`));

      db.prepare("UPDATE scoop_types SET price = ? WHERE id = ?").run(price, scoopType.id);
    }
  });

  transaction();
  refreshApp();
  redirect("/stock");
}

export async function createExpenseAction(formData: FormData) {
  const spentAt = getText(formData, "spent_at");
  const category = getText(formData, "category");
  const amount = Math.max(0, getNumber(formData, "amount"));
  const description = getText(formData, "description");

  if (!spentAt || !description || !Number.isFinite(amount) || amount <= 0) {
    redirect("/expenses?error=missing-expense-fields");
  }

  if (!isValidManualExpenseCategory(category)) {
    redirect("/expenses?error=invalid-expense-category");
  }

  const db = getDb();

  db.prepare(
    `
      INSERT INTO expenses (category, description, amount, spent_at)
      VALUES (?, ?, ?, ?)
    `,
  ).run(category, description, amount, spentAt);

  refreshApp();
  redirect("/expenses");
}

export async function createOrderAction(formData: FormData) {
  const customerName = getText(formData, "customer_name");
  const customerPhone = getText(formData, "customer_phone");
  const customerAddress = getText(formData, "customer_address");
  const orderedAt = getText(formData, "ordered_at");
  const scoopTypeId = getNumber(formData, "scoop_type_id");
  const deliveryStatus = getText(formData, "delivery_status") || "pending";
  const paymentStatus = getText(formData, "payment_status") || "unpaid";
  const selectedItems = parseSelectedItems(formData);

  if (!customerName || !customerPhone || !customerAddress || !orderedAt || !scoopTypeId) {
    redirect("/orders?error=missing-order-fields");
  }

  if (selectedItems.length === 0) {
    redirect("/orders?error=select-at-least-one-gift");
  }

  const db = getDb();
  const scoopType = db
    .prepare("SELECT id, name, price FROM scoop_types WHERE id = ?")
    .get(scoopTypeId) as { id: number; name: string; price: number } | undefined;

  if (!scoopType) {
    redirect("/orders?error=invalid-scoop-selection");
  }

  const productIds = selectedItems.map((item) => item.productId);
  const productRows = db
    .prepare(
      `
        SELECT id, name, stock_quantity, unit_cost
        FROM products
        WHERE id IN (${productIds.map(() => "?").join(", ")})
      `,
    )
    .all(...productIds) as Array<{
      id: number;
      name: string;
      stock_quantity: number;
      unit_cost: number;
    }>;

  const productsById = new Map(productRows.map((product) => [product.id, product]));

  for (const item of selectedItems) {
    const product = productsById.get(item.productId);

    if (!product || product.stock_quantity < item.quantity) {
      redirect("/orders?error=insufficient-stock-for-selected-gifts");
    }
  }

  const giftCount = selectedItems.reduce((sum, item) => sum + item.quantity, 0);
  const productCost = selectedItems.reduce((sum, item) => {
    const product = productsById.get(item.productId);

    return sum + (product ? product.unit_cost * item.quantity : 0);
  }, 0);
  const netProfit = calculateNetProfit(scoopType.price, productCost, 0, 0);

  const transaction = db.transaction(() => {
    const orderResult = db
      .prepare(
        `
          INSERT INTO orders (
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
            ordered_at
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL, ?, ?, ?, ?)
        `,
      )
      .run(
        customerName,
        customerPhone,
        customerAddress,
        scoopType.id,
        scoopType.name,
        scoopType.price,
        giftCount,
        productCost,
        netProfit,
        deliveryStatus,
        paymentStatus,
        orderedAt,
      );

    const orderId = Number(orderResult.lastInsertRowid);

    for (const item of selectedItems) {
      const product = productsById.get(item.productId);

      if (!product) {
        continue;
      }

      const lineCost = product.unit_cost * item.quantity;

      db.prepare(
        `
          INSERT INTO order_items (
            order_id,
            product_id,
            product_name_snapshot,
            quantity,
            unit_cost_snapshot,
            line_cost
          )
          VALUES (?, ?, ?, ?, ?, ?)
        `,
      ).run(orderId, product.id, product.name, item.quantity, product.unit_cost, lineCost);

      db.prepare(
        `
          UPDATE products
          SET stock_quantity = stock_quantity - ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `,
      ).run(item.quantity, product.id);

      db.prepare(
        `
          INSERT INTO stock_movements (
            product_id,
            quantity_delta,
            reason,
            note,
            unit_cost_snapshot,
            movement_value
          )
          VALUES (?, ?, ?, ?, ?, ?)
        `,
      ).run(
        product.id,
        item.quantity * -1,
        `Order #${orderId}`,
        `Allocated to ${customerName}`,
        product.unit_cost,
        lineCost,
      );
    }
  });

  transaction();
  refreshApp();
  redirect("/orders");
}

export async function updateOrderStatusAction(formData: FormData) {
  const orderId = getNumber(formData, "order_id");
  const deliveryStatus = getText(formData, "delivery_status");
  const paymentStatus = getText(formData, "payment_status");
  const deliveryDate = getText(formData, "delivery_date");
  const deliveryCost = getOptionalNumber(formData, "delivery_cost");
  const packagingCost = getOptionalNumber(formData, "packaging_cost");

  if (!orderId || !deliveryStatus || !paymentStatus) {
    redirect("/orders?error=invalid-order-update");
  }

  const db = getDb();
  const order = db
    .prepare("SELECT scoop_price, product_cost FROM orders WHERE id = ?")
    .get(orderId) as { scoop_price: number; product_cost: number } | undefined;

  if (!order) {
    redirect("/orders?error=order-not-found");
  }

  const safeDeliveryCost = Math.max(0, deliveryCost ?? 0);
  const safePackagingCost = Math.max(0, packagingCost ?? 0);

  db.prepare(
    `
      UPDATE orders
      SET
        delivery_status = ?,
        payment_status = ?,
        delivery_date = NULLIF(?, ''),
        delivery_cost = ?,
        packaging_cost = ?,
        net_profit = ?
      WHERE id = ?
    `,
  ).run(
    deliveryStatus,
    paymentStatus,
    deliveryDate,
    deliveryCost === null ? null : safeDeliveryCost,
    packagingCost === null ? null : safePackagingCost,
    calculateNetProfit(
      order.scoop_price,
      order.product_cost,
      safeDeliveryCost,
      safePackagingCost,
    ),
    orderId,
  );

  refreshApp();
  redirect("/orders");
}

export type QueryActionState = {
  columns: string[];
  error: string;
  message: string;
  rows: Array<Record<string, string | number | null>>;
  sql: string;
};

export async function runQueryAction(
  _previousState: QueryActionState,
  formData: FormData,
): Promise<QueryActionState> {
  const sql = getText(formData, "sql");

  if (!sql) {
    return {
      sql,
      columns: [],
      rows: [],
      message: "",
      error: "Enter a SQL statement to run.",
    };
  }

  const db = getDb();

  try {
    if (/^\s*(select|pragma|with)\b/i.test(sql)) {
      const rows = db.prepare(sql).all() as Array<Record<string, unknown>>;
      const normalizedRows = rows.map((row) =>
        Object.fromEntries(
          Object.entries(row).map(([key, value]) => [
            key,
            typeof value === "number" || typeof value === "string" || value === null
              ? value
              : JSON.stringify(value),
          ]),
        ),
      ) as Array<Record<string, string | number | null>>;

      return {
        sql,
        columns: Object.keys(normalizedRows[0] ?? {}),
        rows: normalizedRows,
        message: `${normalizedRows.length} row(s) returned.`,
        error: "",
      };
    }

    if (/^\s*(insert|update|delete|replace)\b/i.test(sql)) {
      const result = db.prepare(sql).run();
      refreshApp();

      return {
        sql,
        columns: ["changes", "lastInsertRowid"],
        rows: [
          {
            changes: result.changes,
            lastInsertRowid: Number(result.lastInsertRowid),
          },
        ],
        message: "Mutation executed successfully.",
        error: "",
      };
    }

    db.exec(sql);
    refreshApp();

    return {
      sql,
      columns: [],
      rows: [],
      message: "Statement executed successfully.",
      error: "",
    };
  } catch (error) {
    return {
      sql,
      columns: [],
      rows: [],
      message: "",
      error: error instanceof Error ? error.message : "Query failed.",
    };
  }
}
