import {
  adjustStockAction,
  createProductAction,
  deleteProductAction,
  updateScoopPricesAction,
} from "@/app/actions";
import { AppShell } from "@/components/app-shell";
import { Surface } from "@/components/surface";
import { getProducts, getScoopTypes, getStockMovements } from "@/lib/data";
import { formatCurrency, formatDate } from "@/lib/format";
import Link from "next/link";

type StockPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function formatError(error: string) {
  return error.replaceAll("-", " ");
}

export default async function StockPage({ searchParams }: StockPageProps) {
  const params = await searchParams;
  const [products, movements, scoopTypes] = await Promise.all([
    getProducts(),
    getStockMovements(),
    getScoopTypes(),
  ]);

  return (
    <AppShell
      title="Stock and scoop pricing"
      description="Set item cost and quantity for gifts, refill inventory, and edit the selling price of each scoop size from one place. If you spend money on a refill, log that separately on the Expenses page under Inventory Purchase."
    >
      {typeof params.error === "string" ? (
        <div className="rounded-[1.25rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {formatError(params.error)}
        </div>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-2">
        <Surface
          title="Add inventory item"
          description="Every gift should be stored with its current cost and available quantity."
        >
          <form action={createProductAction} className="grid gap-4 md:grid-cols-2">
            <label className="block md:col-span-2">
              <span className="mb-2 block text-sm font-medium text-stone-700">
                Product name
              </span>
              <input
                type="text"
                name="name"
                className="w-full rounded-[1.25rem] border border-stone-300 bg-stone-50 px-4 py-3 text-sm outline-none transition focus:border-stone-950"
                placeholder="Hair Clip"
                required
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-stone-700">
                Cost price
              </span>
              <input
                type="number"
                name="unit_cost"
                min="0"
                step="0.01"
                defaultValue="0"
                className="w-full rounded-[1.25rem] border border-stone-300 bg-stone-50 px-4 py-3 text-sm outline-none transition focus:border-stone-950"
                required
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-stone-700">
                Opening quantity
              </span>
              <input
                type="number"
                name="stock_quantity"
                min="0"
                defaultValue="0"
                className="w-full rounded-[1.25rem] border border-stone-300 bg-stone-50 px-4 py-3 text-sm outline-none transition focus:border-stone-950"
                required
              />
            </label>

            <label className="block md:col-span-2">
              <span className="mb-2 block text-sm font-medium text-stone-700">
                Category
              </span>
              <input
                type="text"
                name="category"
                defaultValue="Mystery Scoop"
                className="w-full rounded-[1.25rem] border border-stone-300 bg-stone-50 px-4 py-3 text-sm outline-none transition focus:border-stone-950"
              />
            </label>

            <div className="md:col-span-2">
              <button
                type="submit"
                className="inline-flex items-center rounded-full bg-stone-950 px-5 py-3 text-sm font-semibold text-stone-50 transition hover:bg-stone-800"
              >
                Save item
              </button>
            </div>
          </form>
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
              <button
                type="submit"
                className="inline-flex items-center rounded-full border border-stone-950 px-5 py-3 text-sm font-semibold text-stone-950 transition hover:bg-stone-950 hover:text-stone-50"
              >
                Update scoop prices
              </button>
            </div>
          </form>
        </Surface>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Surface
          title="Update item quantity"
          description="Pick an item, enter how many pieces you want to add or remove, and save the change. This updates stock only. Refill money should be logged separately on the Expenses page."
        >
          <form action={adjustStockAction} className="grid gap-4">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-stone-700">
                Item
              </span>
              <select
                name="product_id"
                className="w-full rounded-[1.25rem] border border-stone-300 bg-stone-50 px-4 py-3 text-sm outline-none transition focus:border-stone-950"
                required
              >
                <option value="">Select an item</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} ({product.stock_quantity} in stock)
                  </option>
                ))}
              </select>
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-stone-700">
                  Quantity change
                </span>
                <input
                  type="number"
                  name="quantity_delta"
                  className="w-full rounded-[1.25rem] border border-stone-300 bg-stone-50 px-4 py-3 text-sm outline-none transition focus:border-stone-950"
                  placeholder="Example: 12 to add, -3 to remove"
                  required
                />
                <p className="mt-2 text-xs text-stone-500">
                  Use a normal number to add stock. Use a minus sign if you want to reduce stock.
                </p>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-stone-700">
                  Cost price
                </span>
                <input
                  type="number"
                  name="unit_cost"
                  min="0"
                  step="0.01"
                  className="w-full rounded-[1.25rem] border border-stone-300 bg-stone-50 px-4 py-3 text-sm outline-none transition focus:border-stone-950"
                  placeholder="Optional, if the latest cost changed"
                />
                <p className="mt-2 text-xs text-stone-500">
                  Fill this only when the item cost has changed during a refill.
                </p>
              </label>
            </div>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-stone-700">
                Reason
              </span>
              <input
                type="text"
                name="reason"
                className="w-full rounded-[1.25rem] border border-stone-300 bg-stone-50 px-4 py-3 text-sm outline-none transition focus:border-stone-950"
                placeholder="Example: New stock arrived"
                required
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-stone-700">
                Extra note
              </span>
              <textarea
                name="note"
                rows={4}
                className="w-full rounded-[1.25rem] border border-stone-300 bg-stone-50 px-4 py-3 text-sm outline-none transition focus:border-stone-950"
                placeholder="Optional details"
              />
            </label>

            <div>
              <button
                type="submit"
                className="inline-flex items-center rounded-full bg-stone-950 px-5 py-3 text-sm font-semibold text-stone-50 transition hover:bg-stone-800"
              >
                Apply adjustment
              </button>
            </div>
          </form>
        </Surface>

        <Surface
          title="Current inventory"
          description="Cost and quantity are the only values needed for mystery scoop gift tracking."
        >
          <div className="overflow-hidden rounded-[1.5rem] border border-stone-200">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-stone-200 text-left text-sm">
                <thead className="bg-stone-100/80">
                  <tr>
                    {["Product", "Category", "Quantity", "Cost", "Stock value", "Actions"].map(
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
                  {products.length > 0 ? (
                    products.map((product) => (
                      <tr key={product.id}>
                        <td className="px-4 py-4 font-medium text-stone-900">
                          {product.name}
                        </td>
                        <td className="px-4 py-4 text-stone-600">{product.category}</td>
                        <td className="px-4 py-4 text-stone-700">
                          {product.stock_quantity}
                        </td>
                        <td className="px-4 py-4 text-stone-700">
                          {formatCurrency(product.unit_cost)}
                        </td>
                        <td className="px-4 py-4 text-stone-700">
                          {formatCurrency(product.unit_cost * product.stock_quantity)}
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
                              <button
                                type="submit"
                                className="inline-flex rounded-full border border-rose-300 px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:border-rose-600 hover:bg-rose-600 hover:text-white"
                              >
                                Delete
                              </button>
                            </form>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td className="px-4 py-6 text-stone-500" colSpan={6}>
                        No inventory items yet. Add the first gift item above.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </Surface>
      </section>

      <Surface
        title="Latest stock movements"
        description="Every refill, allocation, and correction is saved here with its cost snapshot."
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
                    <p className="mt-1 text-sm text-stone-600">{movement.reason}</p>
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
    </AppShell>
  );
}
