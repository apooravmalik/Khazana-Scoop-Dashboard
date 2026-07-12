import {
  adjustStockAction,
  createProductAction,
  deleteProductAction,
  updateScoopPricesAction,
} from "@/app/actions";
import { AppShell } from "@/components/app-shell";
import { CatalogProductForm } from "@/components/catalog-product-form";
import { ModalLauncher } from "@/components/modal-launcher";
import { StockAdjustmentForm } from "@/components/stock-adjustment-form";
import { SubmitButton } from "@/components/submit-button";
import { Surface } from "@/components/surface";
import {
  getCatalogProducts,
  getCategories,
  getCollections,
  getProducts,
  getScoopTypes,
  getStockMovements,
} from "@/lib/data";
import { formatCurrency, formatDate } from "@/lib/format";
import Link from "next/link";

type StockPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function formatError(error: string) {
  return error.replaceAll("-", " ");
}

function formatMovementKindLabel(kind: string) {
  return (
    {
      purchase: "Purchase refill",
      correction: "Correction",
      order: "Order allocation",
      return: "Stock returned",
      initial: "Initial stock",
      unknown: "Other change",
    }[kind] ?? kind
  );
}

function formatMovementReason(reason: string) {
  return reason.replace(/^\[(Purchase|Correction)\]\s*/, "");
}

export default async function StockPage({ searchParams }: StockPageProps) {
  const params = await searchParams;
  const [products, catalogProducts, categories, collections, movements, scoopTypes] = await Promise.all([
    getProducts(),
    getCatalogProducts(),
    getCategories(),
    getCollections(),
    getStockMovements(),
    getScoopTypes(),
  ]);

  return (
    <AppShell
      title="Stock"
      description="Manage the full product record from one place: stock, pricing, frontend naming, colours, categories, collections, and images. Scoop prices still control the mystery scoop order flow, while product selling prices stay on each item record."
    >
      {typeof params.error === "string" ? (
        <div className="rounded-[1.25rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {formatError(params.error)}
        </div>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-2">
        <Surface
          title="Add product"
          description="Create the inventory item and its storefront metadata together so Stock stays the only place you need for product setup."
        >
          <div className="space-y-4">
            <p className="text-sm leading-6 text-stone-600">
              Add the backend product record here with quantity, cost, frontend name, selling
              price, colours, category, collections, and images.
            </p>
            <ModalLauncher
              title="Add product"
              description="Create a product with stock, pricing, category, collections, and image metadata."
              triggerLabel="Add new product"
              triggerClassName="inline-flex items-center rounded-full bg-stone-950 px-5 py-3 text-sm font-semibold text-stone-50 transition hover:bg-stone-800"
            >
              <CatalogProductForm
                action={createProductAction}
                categories={categories}
                collections={collections}
                submitLabel="Save product"
                pendingLabel="Saving product..."
              />
            </ModalLauncher>
          </div>
        </Surface>

        <Surface
          title="Scoop pricing"
          description="These are the selling prices used when an order is created. Update them anytime."
        >
          <form action={updateScoopPricesAction} className="grid gap-4">
            {scoopTypes.map((scoopType) => (
              <label key={scoopType.id} className="block">
                <span className="mb-2 block text-sm font-medium text-stone-700">
                  {scoopType.name}
                </span>
                <input
                  type="number"
                  name={`price_${scoopType.id}`}
                  min="0"
                  step="0.01"
                  defaultValue={String(scoopType.price)}
                  className="w-full rounded-[1.25rem] border border-stone-300 bg-stone-50 px-4 py-3 text-sm outline-none transition focus:border-stone-950"
                />
              </label>
            ))}

            <div>
              <SubmitButton
                pendingLabel="Updating prices..."
                className="inline-flex items-center rounded-full border border-stone-950 px-5 py-3 text-sm font-semibold text-stone-950 transition hover:bg-stone-950 hover:text-stone-50"
              >
                Update scoop prices
              </SubmitButton>
            </div>
          </form>
        </Surface>
      </section>

      <section className="grid gap-6">
        <Surface
          title="Update item quantity"
          description="Pick an item, enter how many pieces you want to add or remove, and save the change. This updates stock only. Refill money should be logged separately on the Expenses page."
        >
          <StockAdjustmentForm products={products} action={adjustStockAction} />
        </Surface>

        <Surface
          title="Products"
          description="This is the single product table for the app. Each row keeps both stock numbers and storefront-facing metadata."
        >
          <div className="overflow-hidden rounded-[1.5rem] border border-stone-200">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-stone-200 text-left text-sm">
                <thead className="bg-stone-100/80">
                  <tr>
                    {[
                      "Product",
                      "Frontend name",
                      "Category",
                      "Collections",
                      "Selling price",
                      "Total purchased",
                      "Current quantity",
                      "Cost",
                      "Actions",
                    ].map(
                      (heading) => (
                        <th
                          key={heading}
                          className="px-4 py-3 font-semibold uppercase tracking-[0.2em] text-stone-500"
                        >
                          {heading}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 bg-white">
                  {catalogProducts.length > 0 ? (
                    catalogProducts.map((product) => (
                      <tr key={product.id}>
                        <td className="px-4 py-4 font-medium text-stone-900">
                          <div>
                            <p>{product.name}</p>
                            <p className="mt-1 text-xs uppercase tracking-[0.2em] text-stone-500">
                              /{product.slug || "missing-slug"}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-stone-600">
                          {product.view_name || "Uses product name"}
                        </td>
                        <td className="px-4 py-4 text-stone-600">
                          {product.category_record?.name ?? product.category}
                        </td>
                        <td className="px-4 py-4 text-stone-600">
                          {product.collections.length > 0
                            ? product.collections.map((collection) => collection.name).join(", ")
                            : "No collections"}
                        </td>
                        <td className="px-4 py-4 text-stone-700">
                          {formatCurrency(product.selling_price || product.base_price)}
                        </td>
                        <td className="px-4 py-4 text-stone-700">
                          {product.total_purchased_quantity}
                        </td>
                        <td className="px-4 py-4 text-stone-700">
                          {product.stock_quantity}
                        </td>
                        <td className="px-4 py-4 text-stone-700">
                          {formatCurrency(product.unit_cost)}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex flex-wrap items-center gap-2">
                            <Link
                              href={`/stock/${product.id}`}
                              className="inline-flex rounded-full border border-stone-300 px-3 py-1.5 text-xs font-semibold text-stone-700 transition hover:border-stone-950 hover:text-stone-950"
                            >
                              Edit
                            </Link>
                            <form action={deleteProductAction}>
                              <input type="hidden" name="product_id" value={product.id} />
                              <SubmitButton
                                pendingLabel="Deleting..."
                                className="inline-flex rounded-full border border-rose-300 px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:border-rose-600 hover:bg-rose-600 hover:text-white"
                              >
                                Delete
                              </SubmitButton>
                            </form>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td className="px-4 py-6 text-stone-500" colSpan={9}>
                        No products yet. Add the first one above.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </Surface>
      </section>

      <section className="grid gap-6">
        <Surface
          title="Latest stock movements"
          description="Every purchase, correction, order allocation, and return is saved here with its cost snapshot."
        >
          <div className="space-y-3">
            {movements.length > 0 ? (
              movements.map((movement) => (
                <div
                  key={movement.id}
                  className="rounded-[1.25rem] border border-stone-200 bg-stone-50/70 px-4 py-4"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-semibold text-stone-900">{movement.product_name}</p>
                      <p className="mt-1 text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
                        {formatMovementKindLabel(movement.change_kind)}
                      </p>
                      <p className="mt-1 text-sm text-stone-600">
                        {formatMovementReason(movement.reason)}
                      </p>
                      <p className="mt-1 text-xs text-stone-500">
                        {movement.note || "No note"} · {formatDate(movement.created_at)}
                      </p>
                    </div>

                    <div className="text-right">
                      <p
                        className={`text-sm font-semibold ${
                          movement.quantity_delta > 0 ? "text-emerald-700" : "text-rose-700"
                        }`}
                      >
                        {movement.quantity_delta > 0 ? "+" : ""}
                        {movement.quantity_delta}
                      </p>
                      <p className="mt-1 text-xs text-stone-500">
                        Cost snapshot{" "}
                        {movement.unit_cost_snapshot !== null
                          ? formatCurrency(movement.unit_cost_snapshot)
                          : "-"}
                      </p>
                      <p className="mt-1 text-xs text-stone-500">
                        Value{" "}
                        {movement.movement_value !== null
                          ? formatCurrency(movement.movement_value)
                          : "-"}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-stone-500">
                Stock movement history will appear here after the first inventory change.
              </p>
            )}
          </div>
        </Surface>
      </section>
    </AppShell>
  );
}
