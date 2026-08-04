"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { loginOwner, logoutOwner } from "@/lib/auth";
import { manualExpenseCategories } from "@/lib/constants";
import { getSupabase } from "@/lib/db";

type SelectedOrderItem = {
  productId: number;
  quantity: number;
};

type ProductSnapshot = {
  id: number;
  name: string;
  total_purchased_quantity: number;
  stock_quantity: number;
  unit_cost: number;
};

type ExistingOrderItem = {
  product_id: number;
  quantity: number;
};

type PurchaseTotalRecord = {
  product_id: number;
  quantity_delta: number;
  reason: string;
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
  revalidatePath("/products");
  revalidatePath("/products/new");
  revalidatePath("/categories");
  revalidatePath("/collections");
  revalidatePath("/discounts");
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

function slugifyRoute(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

async function generateInternalSku(name: string) {
  const supabase = getSupabase();
  const base = slugifyName(name) || "ITEM";
  let candidate = base;
  let suffix = 2;

  while (true) {
    const { data, error } = await supabase
      .from("products")
      .select("id")
      .eq("sku", candidate)
      .maybeSingle();

    if (error) {
      throw new Error(`Unable to check SKU: ${error.message}`);
    }

    if (!data) {
      return candidate;
    }

    candidate = `${base}-${suffix}`;
    suffix += 1;
  }
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

function toNumber(value: number | string | null | undefined) {
  return Number(value ?? 0);
}

function getSelectedItemsMap(items: SelectedOrderItem[]) {
  return new Map(items.map((item) => [item.productId, item.quantity]));
}

function getExistingItemsMap(items: ExistingOrderItem[]) {
  return new Map(items.map((item) => [Number(item.product_id), Number(item.quantity)]));
}

function getIsoTimestamp() {
  return new Date().toISOString();
}

function getNumberList(formData: FormData, key: string) {
  return formData
    .getAll(key)
    .map((value) => Number(String(value)))
    .filter((value) => Number.isFinite(value) && value > 0);
}

function getTextLines(formData: FormData, key: string) {
  return getText(formData, key)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function getBooleanInput(formData: FormData, key: string, defaultValue = true) {
  const values = formData.getAll(key).map((value) => String(value));

  if (values.length === 0) {
    return defaultValue;
  }

  return values[values.length - 1] === "true";
}

function asNullablePositiveInteger(value: number | null) {
  return value !== null && Number.isFinite(value) && value > 0 ? Math.trunc(value) : null;
}

function parseStoragePathFromPublicUrl(url: string) {
  const marker = "/storage/v1/object/public/product-images/";
  const index = url.indexOf(marker);

  if (index === -1) {
    return null;
  }

  return decodeURIComponent(url.slice(index + marker.length));
}

async function syncProductCollections(productId: number, collectionIds: number[]) {
  const supabase = getSupabase();
  const { error: deleteError } = await supabase
    .from("product_collections")
    .delete()
    .eq("product_id", productId);

  if (deleteError) {
    throw new Error(`Unable to clear product collections: ${deleteError.message}`);
  }

  if (collectionIds.length === 0) {
    return;
  }

  const { error: insertError } = await supabase.from("product_collections").insert(
    collectionIds.map((collectionId) => ({
      product_id: productId,
      collection_id: collectionId,
    })),
  );

  if (insertError) {
    throw new Error(`Unable to save product collections: ${insertError.message}`);
  }
}

function hasMissingTotalPurchasedColumnError(error: { message: string } | null) {
  return Boolean(error?.message.includes("total_purchased_quantity"));
}

function hasMissingColumnError(error: { message: string } | null, column: string) {
  return Boolean(error?.message.includes(column));
}

function buildProductImageDebugParams(input: {
  error: string;
  step?: string;
  detail?: string;
  bucket?: string;
  objectPath?: string;
}) {
  const params = new URLSearchParams({ error: input.error });

  if (input.step) {
    params.set("step", input.step);
  }

  if (input.detail) {
    params.set("detail", input.detail.slice(0, 180));
  }

  if (input.bucket) {
    params.set("bucket", input.bucket);
  }

  if (input.objectPath) {
    params.set("objectPath", input.objectPath);
  }

  return params.toString();
}

function normalizeColourList(colours: string[]) {
  return Array.from(
    new Set(
      colours
        .map((colour) => colour.trim())
        .filter(Boolean),
    ),
  );
}

function countsTowardPurchasedTotal(reason: string) {
  return reason === "Initial stock" || reason.startsWith("[Purchase]");
}

async function getPurchasedTotalsMap(productIds: number[]) {
  const supabase = getSupabase();

  if (productIds.length === 0) {
    return new Map<number, number>();
  }

  const { data, error } = await supabase
    .from("stock_movements")
    .select("product_id, quantity_delta, reason")
    .in("product_id", productIds)
    .gt("quantity_delta", 0);

  if (error) {
    throw new Error(`Unable to load purchase totals: ${error.message}`);
  }

  return ((data ?? []) as PurchaseTotalRecord[]).reduce((totals, row) => {
    const productId = Number(row.product_id);

    if (!countsTowardPurchasedTotal(row.reason)) {
      return totals;
    }

    totals.set(productId, (totals.get(productId) ?? 0) + Number(row.quantity_delta));
    return totals;
  }, new Map<number, number>());
}

async function fetchProductsByIds(productIds: number[]) {
  const supabase = getSupabase();

  if (productIds.length === 0) {
    return [] as ProductSnapshot[];
  }

  const { data, error } = await supabase
    .from("products")
    .select("id, name, total_purchased_quantity, stock_quantity, unit_cost")
    .in("id", productIds);

  if (hasMissingTotalPurchasedColumnError(error)) {
    const [{ data: fallbackData, error: fallbackError }, purchasedTotals] = await Promise.all([
      supabase
        .from("products")
        .select("id, name, stock_quantity, unit_cost")
        .in("id", productIds),
      getPurchasedTotalsMap(productIds),
    ]);

    if (fallbackError) {
      throw new Error(`Unable to load products: ${fallbackError.message}`);
    }

    return (fallbackData ?? []).map((product) => ({
      id: Number(product.id),
      name: product.name,
      total_purchased_quantity: Math.max(
        Number(product.stock_quantity),
        purchasedTotals.get(Number(product.id)) ?? 0,
      ),
      stock_quantity: Number(product.stock_quantity),
      unit_cost: toNumber(product.unit_cost),
    }));
  }

  if (error) {
    throw new Error(`Unable to load products: ${error.message}`);
  }

  return (data ?? []).map((product) => ({
    id: Number(product.id),
    name: product.name,
    total_purchased_quantity: Number(product.total_purchased_quantity),
    stock_quantity: Number(product.stock_quantity),
    unit_cost: toNumber(product.unit_cost),
  }));
}

async function insertStockMovements(
  movements: Array<{
    product_id: number;
    quantity_delta: number;
    reason: string;
    note: string | null;
    unit_cost_snapshot: number;
    movement_value: number;
  }>,
) {
  if (movements.length === 0) {
    return;
  }

  const supabase = getSupabase();
  const { error } = await supabase.from("stock_movements").insert(movements);

  if (error) {
    throw new Error(`Unable to save stock movements: ${error.message}`);
  }
}

async function updateProductStocks(
  productsById: Map<number, ProductSnapshot>,
  deltas: Map<number, number>,
) {
  const supabase = getSupabase();

  for (const [productId, delta] of deltas.entries()) {
    if (delta === 0) {
      continue;
    }

    const product = productsById.get(productId);

    if (!product) {
      throw new Error("A selected product could not be found.");
    }

    const nextQuantity = product.stock_quantity - delta;

    const { error } = await supabase
      .from("products")
      .update({
        stock_quantity: nextQuantity,
        updated_at: getIsoTimestamp(),
      })
      .eq("id", productId);

    if (error) {
      throw new Error(`Unable to update stock for ${product.name}: ${error.message}`);
    }
  }
}

async function restoreStockForOrderItems(
  orderId: number,
  customerName: string,
  items: ExistingOrderItem[],
) {
  const products = await fetchProductsByIds(items.map((item) => Number(item.product_id)));
  const productsById = new Map(products.map((product) => [product.id, product]));
  const supabase = getSupabase();

  for (const item of items) {
    const product = productsById.get(Number(item.product_id));

    if (!product) {
      continue;
    }

    const restoredQuantity = product.stock_quantity + Number(item.quantity);

    const { error } = await supabase
      .from("products")
      .update({
        stock_quantity: restoredQuantity,
        updated_at: getIsoTimestamp(),
      })
      .eq("id", product.id);

    if (error) {
      throw new Error(`Unable to restore stock for ${product.name}: ${error.message}`);
    }
  }

  await insertStockMovements(
    items
      .map((item) => {
        const product = productsById.get(Number(item.product_id));

        if (!product) {
          return null;
        }

        return {
          product_id: product.id,
          quantity_delta: Number(item.quantity),
          reason: `Order #${orderId} deleted`,
          note: `Returned from ${customerName}`,
          unit_cost_snapshot: product.unit_cost,
          movement_value: product.unit_cost * Number(item.quantity),
        };
      })
      .filter((movement) => movement !== null),
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
  const categoryId = asNullablePositiveInteger(getOptionalNumber(formData, "category_id"));
  const initialStock = Math.max(0, getNumber(formData, "stock_quantity"));
  const unitCost = Math.max(0, getNumber(formData, "unit_cost"));
  const slug = slugifyRoute(getText(formData, "slug") || name);
  const viewName = getText(formData, "view_name") || null;
  const description = getText(formData, "description") || null;
  const sellingPrice = Math.max(0, getOptionalNumber(formData, "selling_price") ?? 0);
  const collectionIds = getNumberList(formData, "collection_ids");
  const active = getBooleanInput(formData, "active", true);
  const websiteVisible = getBooleanInput(formData, "website_visible", true);

  if (!name) {
    redirect("/stock?error=missing-product-name");
  }

  const supabase = getSupabase();
  const sku = await generateInternalSku(name);
  let { data, error } = await supabase
    .from("products")
    .insert({
      name,
      sku,
      slug,
      category,
      category_id: categoryId,
        view_name: viewName,
        description,
      base_price: sellingPrice,
      selling_price: sellingPrice,
      active,
      website_visible: websiteVisible,
      primary_image_url: null,
        available_colours: [],
        sort_order: 0,
        total_purchased_quantity: initialStock,
        stock_quantity: initialStock,
      unit_cost: unitCost,
    })
    .select("id")
    .single();

  if (
    hasMissingTotalPurchasedColumnError(error) ||
    hasMissingColumnError(error, "selling_price") ||
    hasMissingColumnError(error, "view_name") ||
    hasMissingColumnError(error, "website_visible")
  ) {
    const retryResult = await supabase
      .from("products")
      .insert({
        name,
        sku,
        slug,
        category,
        category_id: categoryId,
        description,
        base_price: sellingPrice,
        stock_quantity: initialStock,
        unit_cost: unitCost,
      })
      .select("id")
      .single();

    data = retryResult.data;
    error = retryResult.error;
  }

  if (error || !data) {
    redirect("/stock?error=unable-to-create-product");
  }

  if (initialStock > 0) {
    await insertStockMovements([
      {
        product_id: Number(data.id),
        quantity_delta: initialStock,
        reason: "Initial stock",
        note: "Opening quantity during product creation",
        unit_cost_snapshot: unitCost,
        movement_value: initialStock * unitCost,
      },
    ]);
  }

  try {
    await syncProductCollections(Number(data.id), collectionIds);
  } catch {
    redirect("/stock?error=unable-to-save-product-relations");
  }

  refreshApp();
  redirect(`/stock/${data.id}`);
}

export async function updateProductAction(formData: FormData) {
  const productId = getNumber(formData, "product_id");
  const name = getText(formData, "name");
  const category = getText(formData, "category") || "Mystery Scoop";
  const categoryId = asNullablePositiveInteger(getOptionalNumber(formData, "category_id"));
  const unitCost = Math.max(0, getNumber(formData, "unit_cost"));
  const slug = slugifyRoute(getText(formData, "slug") || name);
  const viewName = getText(formData, "view_name") || null;
  const description = getText(formData, "description") || null;
  const sellingPrice = Math.max(0, getOptionalNumber(formData, "selling_price") ?? 0);
  const active = getBooleanInput(formData, "active", true);
  const websiteVisible = getBooleanInput(formData, "website_visible", true);
  const collectionIds = getNumberList(formData, "collection_ids");
  const existingColours = getTextLines(formData, "available_colours");

  if (!productId || !name) {
    redirect("/stock?error=invalid-product-update");
  }

  const supabase = getSupabase();
  let { error } = await supabase
    .from("products")
    .update({
      name,
      slug,
      category,
      category_id: categoryId,
      view_name: viewName,
      description,
      base_price: sellingPrice,
      selling_price: sellingPrice,
      active,
      website_visible: websiteVisible,
      available_colours: existingColours,
      unit_cost: unitCost,
      updated_at: getIsoTimestamp(),
    })
    .eq("id", productId);

  if (
    error?.message.includes("slug") ||
    error?.message.includes("base_price") ||
    error?.message.includes("available_colours") ||
    error?.message.includes("selling_price") ||
    error?.message.includes("view_name") ||
    error?.message.includes("website_visible")
  ) {
    const retryResult = await supabase
      .from("products")
      .update({
        name,
        category,
        category_id: categoryId,
        view_name: viewName,
        base_price: sellingPrice,
        selling_price: sellingPrice,
        description,
        active,
        available_colours: existingColours,
        unit_cost: unitCost,
        updated_at: getIsoTimestamp(),
      })
      .eq("id", productId);

    error = retryResult.error;
  }

  if (error) {
    redirect("/stock?error=unable-to-update-product");
  }

  try {
    await syncProductCollections(productId, collectionIds);
  } catch {
    redirect(`/stock/${productId}?error=unable-to-save-product-relations`);
  }

  refreshApp();
  redirect(`/stock/${productId}`);
}

export async function deleteProductAction(formData: FormData) {
  const productId = getNumber(formData, "product_id");

  if (!productId) {
    redirect("/stock?error=invalid-product-delete");
  }

  const supabase = getSupabase();
  const [orderItemsResult, movementResult] = await Promise.all([
    supabase
      .from("order_items")
      .select("*", { count: "exact", head: true })
      .eq("product_id", productId),
    supabase
      .from("stock_movements")
      .select("*", { count: "exact", head: true })
      .eq("product_id", productId),
  ]);

  if (orderItemsResult.error || movementResult.error) {
    redirect("/stock?error=unable-to-check-product-history");
  }

  if ((orderItemsResult.count ?? 0) > 0 || (movementResult.count ?? 0) > 0) {
    redirect("/stock?error=product-has-history");
  }

  const { error } = await supabase.from("products").delete().eq("id", productId);

  if (error) {
    redirect("/stock?error=unable-to-delete-product");
  }

  refreshApp();
  redirect("/stock");
}

export async function adjustStockAction(formData: FormData) {
  const productId = getNumber(formData, "product_id");
  const adjustmentKind = getText(formData, "adjustment_kind");
  const quantityDelta = getNumber(formData, "quantity_delta");
  const reason = getText(formData, "reason");
  const note = getText(formData, "note");
  const providedUnitCost = getOptionalNumber(formData, "unit_cost");

  if (!productId || !quantityDelta || !reason || !adjustmentKind) {
    redirect("/stock?error=invalid-stock-adjustment");
  }

  if (adjustmentKind !== "purchase" && adjustmentKind !== "correction") {
    redirect("/stock?error=invalid-stock-adjustment-type");
  }

  if (adjustmentKind === "purchase" && quantityDelta <= 0) {
    redirect("/stock?error=purchase-refill-must-be-positive");
  }

  const products = await fetchProductsByIds([productId]);
  const product = products[0];

  if (!product || product.stock_quantity + quantityDelta < 0) {
    redirect("/stock?error=stock-would-go-negative");
  }

  const activeUnitCost =
    providedUnitCost !== null && Number.isFinite(providedUnitCost)
      ? Math.max(0, providedUnitCost)
      : product.unit_cost;
  const movementValue = Math.abs(quantityDelta) * activeUnitCost;
  const supabase = getSupabase();
  const stockReason =
    adjustmentKind === "purchase"
      ? `[Purchase] ${reason}`
      : `[Correction] ${reason}`;

  let { error } = await supabase
    .from("products")
    .update({
      total_purchased_quantity:
        adjustmentKind === "purchase"
          ? product.total_purchased_quantity + quantityDelta
          : product.total_purchased_quantity,
      stock_quantity: product.stock_quantity + quantityDelta,
      unit_cost: activeUnitCost,
      updated_at: getIsoTimestamp(),
    })
    .eq("id", productId);

  if (hasMissingTotalPurchasedColumnError(error)) {
    const retryResult = await supabase
      .from("products")
      .update({
        stock_quantity: product.stock_quantity + quantityDelta,
        unit_cost: activeUnitCost,
        updated_at: getIsoTimestamp(),
      })
      .eq("id", productId);

    error = retryResult.error;
  }

  if (error) {
    redirect("/stock?error=unable-to-adjust-stock");
  }

  await insertStockMovements([
    {
      product_id: productId,
      quantity_delta: quantityDelta,
      reason: stockReason,
      note: note || null,
      unit_cost_snapshot: activeUnitCost,
      movement_value: movementValue,
    },
  ]);

  refreshApp();
  redirect("/stock");
}

export async function updateScoopPricesAction(formData: FormData) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("scoop_types")
    .select("id")
    .order("sort_order", { ascending: true })
    .order("id", { ascending: true });

  if (error) {
    redirect("/stock?error=unable-to-load-scoop-types");
  }

  for (const scoopType of data ?? []) {
    const price = Math.max(0, getNumber(formData, `price_${scoopType.id}`));
    const { error: updateError } = await supabase
      .from("scoop_types")
      .update({ price })
      .eq("id", scoopType.id);

    if (updateError) {
      redirect("/stock?error=unable-to-update-scoop-prices");
    }
  }

  refreshApp();
  redirect("/stock");
}

export async function createCategoryAction(formData: FormData) {
  const name = getText(formData, "name");
  const slug = slugifyRoute(getText(formData, "slug") || name);
  const sortOrder = Math.max(0, getNumber(formData, "sort_order"));
  const active = getBooleanInput(formData, "active", true);

  if (!name) {
    redirect("/categories?error=missing-category-name");
  }

  const { error } = await getSupabase().from("categories").insert({
    name,
    slug,
    sort_order: sortOrder,
    active,
  });

  if (error) {
    redirect("/categories?error=unable-to-create-category");
  }

  refreshApp();
  redirect("/categories");
}

export async function updateCategoryAction(formData: FormData) {
  const categoryId = getNumber(formData, "category_id");
  const name = getText(formData, "name");
  const slug = slugifyRoute(getText(formData, "slug") || name);
  const sortOrder = Math.max(0, getNumber(formData, "sort_order"));
  const active = getBooleanInput(formData, "active", true);

  if (!categoryId || !name) {
    redirect("/categories?error=invalid-category-update");
  }

  const { error } = await getSupabase()
    .from("categories")
    .update({ name, slug, sort_order: sortOrder, active })
    .eq("id", categoryId);

  if (error) {
    redirect("/categories?error=unable-to-update-category");
  }

  refreshApp();
  redirect("/categories");
}

export async function deleteCategoryAction(formData: FormData) {
  const categoryId = getNumber(formData, "category_id");

  if (!categoryId) {
    redirect("/categories?error=invalid-category-delete");
  }

  const supabase = getSupabase();
  await supabase.from("products").update({ category_id: null }).eq("category_id", categoryId);
  const { error } = await supabase.from("categories").delete().eq("id", categoryId);

  if (error) {
    redirect("/categories?error=unable-to-delete-category");
  }

  refreshApp();
  redirect("/categories");
}

export async function createCollectionAction(formData: FormData) {
  const name = getText(formData, "name");
  const slug = slugifyRoute(getText(formData, "slug") || name);
  const description = getText(formData, "description") || null;
  const sortOrder = Math.max(0, getNumber(formData, "sort_order"));
  const active = getBooleanInput(formData, "active", true);

  if (!name) {
    redirect("/collections?error=missing-collection-name");
  }

  const supabase = getSupabase();
  let { error } = await supabase.from("collections").insert({
    name,
    slug,
    description,
    sort_order: sortOrder,
    active,
  });

  if (hasMissingColumnError(error, "description")) {
    const fallbackResult = await supabase.from("collections").insert({
      name,
      slug,
      sort_order: sortOrder,
      active,
    });

    error = fallbackResult.error;
  }

  if (error) {
    redirect("/collections?error=unable-to-create-collection");
  }

  refreshApp();
  redirect("/collections");
}

export async function updateCollectionAction(formData: FormData) {
  const collectionId = getNumber(formData, "collection_id");
  const name = getText(formData, "name");
  const slug = slugifyRoute(getText(formData, "slug") || name);
  const description = getText(formData, "description") || null;
  const sortOrder = Math.max(0, getNumber(formData, "sort_order"));
  const active = getBooleanInput(formData, "active", true);

  if (!collectionId || !name) {
    redirect("/collections?error=invalid-collection-update");
  }

  const supabase = getSupabase();
  let { error } = await supabase
    .from("collections")
    .update({ name, slug, description, sort_order: sortOrder, active })
    .eq("id", collectionId);

  if (hasMissingColumnError(error, "description")) {
    const fallbackResult = await supabase
      .from("collections")
      .update({ name, slug, sort_order: sortOrder, active })
      .eq("id", collectionId);

    error = fallbackResult.error;
  }

  if (error) {
    redirect("/collections?error=unable-to-update-collection");
  }

  refreshApp();
  redirect("/collections");
}

export async function deleteCollectionAction(formData: FormData) {
  const collectionId = getNumber(formData, "collection_id");

  if (!collectionId) {
    redirect("/collections?error=invalid-collection-delete");
  }

  const supabase = getSupabase();
  await supabase.from("product_collections").delete().eq("collection_id", collectionId);
  const { error } = await supabase.from("collections").delete().eq("id", collectionId);

  if (error) {
    redirect("/collections?error=unable-to-delete-collection");
  }

  refreshApp();
  redirect("/collections");
}

export async function createDiscountAction(formData: FormData) {
  const targetType = getText(formData, "target_type");
  const targetId = getNumber(formData, "target_id");
  const amount = Math.max(0, getNumber(formData, "amount"));
  const type = getText(formData, "type");
  const startAt = getText(formData, "start_at");
  const endAt = getText(formData, "end_at");
  const active = getText(formData, "active") !== "false";

  if (!targetType || !targetId || !amount || !type) {
    redirect("/discounts?error=missing-discount-fields");
  }

  const { error } = await getSupabase().from("discounts").insert({
    target_type: targetType,
    target_id: targetId,
    amount,
    type,
    start_at: startAt || null,
    end_at: endAt || null,
    active,
  });

  if (error) {
    redirect("/discounts?error=unable-to-create-discount");
  }

  refreshApp();
  redirect("/discounts");
}

export async function updateDiscountAction(formData: FormData) {
  const discountId = getNumber(formData, "discount_id");
  const amount = Math.max(0, getNumber(formData, "amount"));
  const type = getText(formData, "type");
  const startAt = getText(formData, "start_at");
  const endAt = getText(formData, "end_at");
  const active = getText(formData, "active") !== "false";

  if (!discountId || !amount || !type) {
    redirect("/discounts?error=invalid-discount-update");
  }

  const { error } = await getSupabase()
    .from("discounts")
    .update({
      amount,
      type,
      start_at: startAt || null,
      end_at: endAt || null,
      active,
    })
    .eq("id", discountId);

  if (error) {
    redirect("/discounts?error=unable-to-update-discount");
  }

  refreshApp();
  redirect("/discounts");
}

export async function deleteDiscountAction(formData: FormData) {
  const discountId = getNumber(formData, "discount_id");

  if (!discountId) {
    redirect("/discounts?error=invalid-discount-delete");
  }

  const { error } = await getSupabase().from("discounts").delete().eq("id", discountId);

  if (error) {
    redirect("/discounts?error=unable-to-delete-discount");
  }

  refreshApp();
  redirect("/discounts");
}

export async function uploadProductImageAction(formData: FormData) {
  const productId = getNumber(formData, "product_id");
  const colourName = getText(formData, "colour_name");
  const makePrimary = getBooleanInput(formData, "make_primary", false);
  const imageFile = formData.get("image");
  const bucket = "product-images";
  const maxImageSizeBytes = 5 * 1024 * 1024;

  if (!productId || !colourName || !(imageFile instanceof File) || imageFile.size === 0) {
    redirect(`/stock/${productId || ""}?error=missing-image-file`);
  }

  if (imageFile.size > maxImageSizeBytes) {
    redirect(
      `/stock/${productId}?${buildProductImageDebugParams({
        error: "image-too-large",
        step: "validate-image-size",
        detail: "Upload a product image up to 5 MB.",
        bucket,
      })}`,
    );
  }

  const allowedTypes = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);

  if (!allowedTypes.has(imageFile.type)) {
    redirect(`/stock/${productId}?error=invalid-image-type`);
  }

  const { data: product, error: productError } = await getSupabase()
    .from("products")
    .select("id, available_colours")
    .eq("id", productId)
    .maybeSingle();

  if (productError || !product) {
    redirect("/stock?error=invalid-product-upload");
  }

  const pathSafeName = imageFile.name.replace(/[^a-zA-Z0-9._-]+/g, "-");
  const objectPath = `${productId}/${Date.now()}-${pathSafeName}`;
  const supabase = getSupabase();
  const fileBuffer = await imageFile.arrayBuffer();
  console.info("[product-image-upload] starting", {
    productId,
    colourName,
    makePrimary,
    bucket,
    objectPath,
    fileName: imageFile.name,
    fileType: imageFile.type,
    fileSize: imageFile.size,
  });
  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(objectPath, fileBuffer, {
      contentType: imageFile.type,
      upsert: false,
    });

  if (uploadError) {
    console.error("[product-image-upload] storage upload failed", {
      productId,
      colourName,
      bucket,
      objectPath,
      message: uploadError.message,
    });
    redirect(
      `/stock/${productId}?${buildProductImageDebugParams({
        error: "unable-to-upload-image",
        step: "storage-upload",
        detail: uploadError.message,
        bucket,
        objectPath,
      })}`,
    );
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(bucket).getPublicUrl(objectPath);

  const [{ data: existingImages, error: imagesError }, updateProductResult] = await Promise.all([
    supabase
      .from("product_images")
      .select("sort_order")
      .eq("product_id", productId)
      .order("sort_order", { ascending: false })
      .limit(1),
    makePrimary
      ? supabase
          .from("products")
          .update({
            primary_image_url: publicUrl,
            updated_at: getIsoTimestamp(),
          })
          .eq("id", productId)
      : Promise.resolve({ error: null }),
  ]);

  if (imagesError || updateProductResult.error) {
    const detail = imagesError?.message ?? updateProductResult.error?.message ?? "Unknown save error";
    console.error("[product-image-upload] unable to prepare database save", {
      productId,
      colourName,
      bucket,
      objectPath,
      publicUrl,
      message: detail,
    });
    redirect(
      `/stock/${productId}?${buildProductImageDebugParams({
        error: "unable-to-save-image",
        step: "prepare-database-save",
        detail,
        bucket,
        objectPath,
      })}`,
    );
  }

  const nextSortOrder = Number(existingImages?.[0]?.sort_order ?? -1) + 1;
  const { error: insertError } = await supabase.from("product_images").insert({
    product_id: productId,
    url: publicUrl,
    alt_text: colourName,
    sort_order: nextSortOrder,
  });

  if (insertError) {
    console.error("[product-image-upload] product_images insert failed", {
      productId,
      colourName,
      bucket,
      objectPath,
      publicUrl,
      message: insertError.message,
    });
    redirect(
      `/stock/${productId}?${buildProductImageDebugParams({
        error: "unable-to-save-image",
        step: "insert-product-image-record",
        detail: insertError.message,
        bucket,
        objectPath,
      })}`,
    );
  }

  const currentColours = Array.isArray(product.available_colours)
    ? product.available_colours.map((value) => String(value))
    : [];
  const nextColours = normalizeColourList([...currentColours, colourName]);
  const { error: coloursError } = await supabase
    .from("products")
    .update({
      available_colours: nextColours,
      updated_at: getIsoTimestamp(),
    })
    .eq("id", productId);

  if (coloursError) {
    console.error("[product-image-upload] product colour list update failed", {
      productId,
      colourName,
      bucket,
      objectPath,
      publicUrl,
      message: coloursError.message,
    });
    redirect(
      `/stock/${productId}?${buildProductImageDebugParams({
        error: "unable-to-save-image",
        step: "update-product-colours",
        detail: coloursError.message,
        bucket,
        objectPath,
      })}`,
    );
  }

  console.info("[product-image-upload] completed", {
    productId,
    colourName,
    bucket,
    objectPath,
    publicUrl,
    nextSortOrder,
    makePrimary,
  });
  refreshApp();
  redirect(`/stock/${productId}`);
}

export async function deleteProductImageAction(formData: FormData) {
  const productId = getNumber(formData, "product_id");
  const imageId = getNumber(formData, "image_id");
  const imageUrl = getText(formData, "image_url");
  const imageColour = getText(formData, "image_colour");
  const primaryImageUrl = getText(formData, "primary_image_url");

  if (!productId || !imageId || !imageUrl) {
    redirect(`/stock/${productId || ""}?error=invalid-image-delete`);
  }

  const supabase = getSupabase();
  const storagePath = parseStoragePathFromPublicUrl(imageUrl);

  if (storagePath) {
    await supabase.storage.from("product-images").remove([storagePath]);
  }

  const { error: deleteError } = await supabase
    .from("product_images")
    .delete()
    .eq("id", imageId)
    .eq("product_id", productId);

  if (deleteError) {
    redirect(`/stock/${productId}?error=unable-to-delete-image`);
  }

  if (primaryImageUrl && primaryImageUrl === imageUrl) {
    await supabase
      .from("products")
      .update({
        primary_image_url: null,
        updated_at: getIsoTimestamp(),
      })
      .eq("id", productId);
  }

  if (imageColour) {
    const { data: remainingImages, error: remainingImagesError } = await supabase
      .from("product_images")
      .select("alt_text")
      .eq("product_id", productId);

    if (remainingImagesError) {
      redirect(`/stock/${productId}?error=unable-to-delete-image`);
    }

    const nextColours = normalizeColourList(
      (remainingImages ?? [])
        .map((row) => String(row.alt_text ?? ""))
        .filter(Boolean),
    );

    const { error: coloursError } = await supabase
      .from("products")
      .update({
        available_colours: nextColours,
        updated_at: getIsoTimestamp(),
      })
      .eq("id", productId);

    if (coloursError) {
      redirect(`/stock/${productId}?error=unable-to-delete-image`);
    }
  }

  refreshApp();
  redirect(`/stock/${productId}`);
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

  const supabase = getSupabase();
  const { error } = await supabase.from("expenses").insert({
    category,
    description,
    amount,
    spent_at: spentAt,
  });

  if (error) {
    redirect("/expenses?error=unable-to-create-expense");
  }

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
  const deliveryDate = getText(formData, "delivery_date");
  const deliveryCost = getOptionalNumber(formData, "delivery_cost");
  const packagingCost = getOptionalNumber(formData, "packaging_cost");
  const selectedItems = parseSelectedItems(formData);

  if (!customerName || !customerPhone || !customerAddress || !orderedAt || !scoopTypeId) {
    redirect("/orders?error=missing-order-fields");
  }

  if (selectedItems.length === 0) {
    redirect("/orders?error=select-at-least-one-gift");
  }

  const supabase = getSupabase();
  const { data: scoopType, error: scoopError } = await supabase
    .from("scoop_types")
    .select("id, name, price")
    .eq("id", scoopTypeId)
    .single();

  if (scoopError || !scoopType) {
    redirect("/orders?error=invalid-scoop-selection");
  }

  const productIds = selectedItems.map((item) => item.productId);
  const productRows = await fetchProductsByIds(productIds);
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
  const safeDeliveryCost = Math.max(0, deliveryCost ?? 0);
  const safePackagingCost = Math.max(0, packagingCost ?? 0);
  const netProfit = calculateNetProfit(
    toNumber(scoopType.price),
    productCost,
    safeDeliveryCost,
    safePackagingCost,
  );

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      customer_name: customerName,
      customer_phone: customerPhone,
      customer_address: customerAddress,
      scoop_type_id: scoopType.id,
      scoop_name_snapshot: scoopType.name,
      scoop_price: scoopType.price,
      gift_count: giftCount,
      product_cost: productCost,
      delivery_cost: deliveryCost === null ? null : safeDeliveryCost,
      packaging_cost: packagingCost === null ? null : safePackagingCost,
      net_profit: netProfit,
      delivery_status: deliveryStatus,
      payment_status: paymentStatus,
      order_source: "dashboard",
      ordered_at: orderedAt,
      delivery_date: deliveryDate || null,
    })
    .select("id")
    .single();

  if (orderError || !order) {
    redirect("/orders?error=unable-to-create-order");
  }

  const orderId = Number(order.id);
  const orderItems = selectedItems.map((item) => {
    const product = productsById.get(item.productId)!;
    return {
      order_id: orderId,
      product_id: product.id,
      product_name_snapshot: product.name,
      quantity: item.quantity,
      unit_cost_snapshot: product.unit_cost,
      line_cost: product.unit_cost * item.quantity,
    };
  });

  const { error: itemsError } = await supabase.from("order_items").insert(orderItems);

  if (itemsError) {
    redirect("/orders?error=unable-to-save-order-items");
  }

  const deltas = new Map(selectedItems.map((item) => [item.productId, item.quantity]));
  await updateProductStocks(productsById, deltas);
  await insertStockMovements(
    selectedItems.map((item) => {
      const product = productsById.get(item.productId)!;
      return {
        product_id: product.id,
        quantity_delta: item.quantity * -1,
        reason: `Order #${orderId}`,
        note: `Allocated to ${customerName}`,
        unit_cost_snapshot: product.unit_cost,
        movement_value: product.unit_cost * item.quantity,
      };
    }),
  );

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

  const supabase = getSupabase();
  const { data: order, error } = await supabase
    .from("orders")
    .select("scoop_price, product_cost")
    .eq("id", orderId)
    .single();

  if (error || !order) {
    redirect("/orders?error=order-not-found");
  }

  const safeDeliveryCost = Math.max(0, deliveryCost ?? 0);
  const safePackagingCost = Math.max(0, packagingCost ?? 0);

  const { error: updateError } = await supabase
    .from("orders")
    .update({
      delivery_status: deliveryStatus,
      payment_status: paymentStatus,
      delivery_date: deliveryDate || null,
      delivery_cost: deliveryCost === null ? null : safeDeliveryCost,
      packaging_cost: packagingCost === null ? null : safePackagingCost,
      net_profit: calculateNetProfit(
        toNumber(order.scoop_price),
        toNumber(order.product_cost),
        safeDeliveryCost,
        safePackagingCost,
      ),
    })
    .eq("id", orderId);

  if (updateError) {
    redirect("/orders?error=unable-to-update-order");
  }

  refreshApp();
  redirect("/orders");
}

export async function updateOrderAction(formData: FormData) {
  const orderId = getNumber(formData, "order_id");
  const customerName = getText(formData, "customer_name");
  const customerPhone = getText(formData, "customer_phone");
  const customerAddress = getText(formData, "customer_address");
  const orderedAt = getText(formData, "ordered_at");
  const scoopTypeId = getNumber(formData, "scoop_type_id");
  const deliveryStatus = getText(formData, "delivery_status") || "pending";
  const paymentStatus = getText(formData, "payment_status") || "unpaid";
  const deliveryDate = getText(formData, "delivery_date");
  const deliveryCost = getOptionalNumber(formData, "delivery_cost");
  const packagingCost = getOptionalNumber(formData, "packaging_cost");
  const selectedItems = parseSelectedItems(formData);

  if (
    !orderId ||
    !customerName ||
    !customerPhone ||
    !customerAddress ||
    !orderedAt ||
    !scoopTypeId
  ) {
    redirect("/orders?error=missing-order-fields");
  }

  if (selectedItems.length === 0) {
    redirect(`/orders/${orderId}?error=select-at-least-one-gift`);
  }

  const supabase = getSupabase();
  const [{ data: existingOrder, error: existingOrderError }, { data: scoopType, error: scoopError }] =
    await Promise.all([
      supabase
        .from("orders")
        .select(
          `
            id,
            order_items (
              product_id,
              quantity
            )
          `,
        )
        .eq("id", orderId)
        .single(),
      supabase.from("scoop_types").select("id, name, price").eq("id", scoopTypeId).single(),
    ]);

  if (existingOrderError || !existingOrder) {
    redirect("/orders?error=order-not-found");
  }

  if (scoopError || !scoopType) {
    redirect(`/orders/${orderId}?error=invalid-scoop-selection`);
  }

  const oldItems = (existingOrder.order_items ?? []) as ExistingOrderItem[];
  const oldMap = getExistingItemsMap(oldItems);
  const newMap = getSelectedItemsMap(selectedItems);
  const allProductIds = Array.from(new Set([...oldMap.keys(), ...newMap.keys()]));
  const productRows = await fetchProductsByIds(allProductIds);
  const productsById = new Map(productRows.map((product) => [product.id, product]));

  const deltaMap = new Map<number, number>();

  for (const productId of allProductIds) {
    const previousQuantity = oldMap.get(productId) ?? 0;
    const nextQuantity = newMap.get(productId) ?? 0;
    const delta = nextQuantity - previousQuantity;
    const product = productsById.get(productId);

    if (!product) {
      redirect(`/orders/${orderId}?error=selected-product-not-found`);
    }

    if (delta > 0 && product.stock_quantity < delta) {
      redirect(`/orders/${orderId}?error=insufficient-stock-for-selected-gifts`);
    }

    deltaMap.set(productId, delta);
  }

  const giftCount = selectedItems.reduce((sum, item) => sum + item.quantity, 0);
  const productCost = selectedItems.reduce((sum, item) => {
    const product = productsById.get(item.productId)!;
    return sum + product.unit_cost * item.quantity;
  }, 0);
  const safeDeliveryCost = Math.max(0, deliveryCost ?? 0);
  const safePackagingCost = Math.max(0, packagingCost ?? 0);
  const netProfit = calculateNetProfit(
    toNumber(scoopType.price),
    productCost,
    safeDeliveryCost,
    safePackagingCost,
  );

  const { error: orderUpdateError } = await supabase
    .from("orders")
    .update({
      customer_name: customerName,
      customer_phone: customerPhone,
      customer_address: customerAddress,
      scoop_type_id: scoopType.id,
      scoop_name_snapshot: scoopType.name,
      scoop_price: scoopType.price,
      gift_count: giftCount,
      product_cost: productCost,
      delivery_cost: deliveryCost === null ? null : safeDeliveryCost,
      packaging_cost: packagingCost === null ? null : safePackagingCost,
      net_profit: netProfit,
      delivery_status: deliveryStatus,
      payment_status: paymentStatus,
      ordered_at: orderedAt,
      delivery_date: deliveryDate || null,
    })
    .eq("id", orderId);

  if (orderUpdateError) {
    redirect(`/orders/${orderId}?error=unable-to-update-order`);
  }

  const { error: deleteItemsError } = await supabase
    .from("order_items")
    .delete()
    .eq("order_id", orderId);

  if (deleteItemsError) {
    redirect(`/orders/${orderId}?error=unable-to-replace-order-items`);
  }

  const nextOrderItems = selectedItems.map((item) => {
    const product = productsById.get(item.productId)!;
    return {
      order_id: orderId,
      product_id: product.id,
      product_name_snapshot: product.name,
      quantity: item.quantity,
      unit_cost_snapshot: product.unit_cost,
      line_cost: product.unit_cost * item.quantity,
    };
  });

  const { error: insertItemsError } = await supabase.from("order_items").insert(nextOrderItems);

  if (insertItemsError) {
    redirect(`/orders/${orderId}?error=unable-to-save-order-items`);
  }

  await updateProductStocks(productsById, deltaMap);
  await insertStockMovements(
    Array.from(deltaMap.entries())
      .filter(([, delta]) => delta !== 0)
      .map(([productId, delta]) => {
        const product = productsById.get(productId)!;

        return {
          product_id: product.id,
          quantity_delta: delta * -1,
          reason: `Order #${orderId} updated`,
          note:
            delta > 0
              ? `Added to ${customerName}`
              : `Returned from ${customerName}`,
          unit_cost_snapshot: product.unit_cost,
          movement_value: product.unit_cost * Math.abs(delta),
        };
      }),
  );

  refreshApp();
  redirect(`/orders/${orderId}`);
}

export async function deleteOrderAction(formData: FormData) {
  const orderId = getNumber(formData, "order_id");

  if (!orderId) {
    redirect("/orders?error=invalid-order-delete");
  }

  const supabase = getSupabase();
  const { data: order, error } = await supabase
    .from("orders")
    .select(
      `
        id,
        customer_name,
        order_items (
          product_id,
          quantity
        )
      `,
    )
    .eq("id", orderId)
    .single();

  if (error || !order) {
    redirect("/orders?error=order-not-found");
  }

  await restoreStockForOrderItems(
    orderId,
    order.customer_name,
    (order.order_items ?? []) as ExistingOrderItem[],
  );

  const { error: deleteError } = await supabase.from("orders").delete().eq("id", orderId);

  if (deleteError) {
    redirect("/orders?error=unable-to-delete-order");
  }

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
  previousState: QueryActionState,
  formData: FormData,
): Promise<QueryActionState> {
  const sql = getText(formData, "sql");

  return {
    ...previousState,
    sql,
    columns: [],
    rows: [],
    message: "",
    error:
      "Raw SQL is not available from this app in Supabase mode. Use the Supabase SQL Editor and the local schema file for database setup.",
  };
}
