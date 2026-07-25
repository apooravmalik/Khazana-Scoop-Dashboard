import {
  createDiscountAction,
  deleteDiscountAction,
  updateDiscountAction,
} from "@/app/actions";
import { AppShell } from "@/components/app-shell";
import { SubmitButton } from "@/components/submit-button";
import { Surface } from "@/components/surface";
import { getCatalogProducts, getCategories, getCollections, getDiscounts } from "@/lib/data";

const targetTypeLabels = {
  product: "Product",
  category: "Category",
  collection: "Collection",
} as const;

const discountTypeLabels = {
  fixed: "Fixed",
  percent: "Percent",
} as const;

const INDIA_UTC_OFFSET_MS = 5.5 * 60 * 60 * 1000;

function toIndiaDateTimeLocalValue(value: string | null) {
  if (!value) {
    return "";
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  return new Date(parsed.getTime() + INDIA_UTC_OFFSET_MS).toISOString().slice(0, 16);
}

export default async function DiscountsPage() {
  const [discounts, products, categories, collections] = await Promise.all([
    getDiscounts(),
    getCatalogProducts(),
    getCategories(),
    getCollections(),
  ]);

  const productMap = new Map(products.map((product) => [product.id, product.name]));
  const categoryMap = new Map(categories.map((category) => [category.id, category.name]));
  const collectionMap = new Map(collections.map((collection) => [collection.id, collection.name]));

  return (
    <AppShell
      title="Discounts"
      description="Create promotions at the product, category, or collection level so the storefront pricing updates automatically."
    >
      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Surface
          title="Add discount"
          description="Choose what the discount applies to, then set the amount, mode, and optional validity window."
        >
          <form action={createDiscountAction} className="grid gap-4">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-stone-700">Target type</span>
                <select
                  name="target_type"
                  className="w-full rounded-[1.25rem] border border-stone-300 bg-stone-50 px-4 py-3 text-sm outline-none transition focus:border-stone-950"
                  required
                >
                  <option value="product">Product</option>
                  <option value="category">Category</option>
                  <option value="collection">Collection</option>
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-stone-700">Target ID</span>
                <input
                  type="number"
                  name="target_id"
                  min="1"
                  className="w-full rounded-[1.25rem] border border-stone-300 bg-stone-50 px-4 py-3 text-sm outline-none transition focus:border-stone-950"
                  required
                />
              </label>
            </div>

            <div className="rounded-[1.25rem] border border-stone-200 bg-stone-50/70 px-4 py-4 text-sm leading-6 text-stone-600">
              <p className="font-semibold text-stone-900">Reference IDs</p>
              <p className="mt-2">Products: {products.map((product) => `${product.id} ${product.name}`).slice(0, 6).join(" · ") || "None"}</p>
              <p className="mt-2">Categories: {categories.map((category) => `${category.id} ${category.name}`).join(" · ") || "None"}</p>
              <p className="mt-2">Collections: {collections.map((collection) => `${collection.id} ${collection.name}`).join(" · ") || "None"}</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-stone-700">Type</span>
                <select
                  name="type"
                  className="w-full rounded-[1.25rem] border border-stone-300 bg-stone-50 px-4 py-3 text-sm outline-none transition focus:border-stone-950"
                  required
                >
                  <option value="fixed">Fixed</option>
                  <option value="percent">Percent</option>
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-stone-700">Amount</span>
                <input
                  type="number"
                  name="amount"
                  min="0"
                  step="0.01"
                  className="w-full rounded-[1.25rem] border border-stone-300 bg-stone-50 px-4 py-3 text-sm outline-none transition focus:border-stone-950"
                  required
                />
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-stone-700">Starts at</span>
                <input
                  type="datetime-local"
                  name="start_at"
                  className="w-full rounded-[1.25rem] border border-stone-300 bg-stone-50 px-4 py-3 text-sm outline-none transition focus:border-stone-950"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-stone-700">Ends at</span>
                <input
                  type="datetime-local"
                  name="end_at"
                  className="w-full rounded-[1.25rem] border border-stone-300 bg-stone-50 px-4 py-3 text-sm outline-none transition focus:border-stone-950"
                />
              </label>
            </div>

            <label className="flex items-center gap-3 rounded-[1.25rem] border border-stone-200 bg-stone-50/70 px-4 py-4 text-sm text-stone-700">
              <input type="hidden" name="active" value="false" />
              <input type="checkbox" name="active" value="true" defaultChecked className="h-4 w-4 rounded border-stone-300 text-stone-950" />
              Discount is active
            </label>

            <SubmitButton
              pendingLabel="Creating discount..."
              className="inline-flex rounded-full bg-stone-950 px-5 py-3 text-sm font-semibold text-stone-50 transition hover:bg-stone-800"
            >
              Create discount
            </SubmitButton>
          </form>
        </Surface>

        <Surface
          title="Existing discounts"
          description="Update or remove live pricing rules for products, categories, and collections."
        >
          <div className="space-y-4">
            {discounts.length > 0 ? (
              discounts.map((discount) => {
                const targetName =
                  discount.target_type === "product"
                    ? productMap.get(discount.target_id)
                    : discount.target_type === "category"
                      ? categoryMap.get(discount.target_id)
                      : collectionMap.get(discount.target_id);

                return (
                  <div key={discount.id} className="rounded-[1.4rem] border border-stone-200 bg-stone-50/70 p-4">
                    <form action={updateDiscountAction} className="grid gap-4">
                      <input type="hidden" name="discount_id" value={discount.id} />
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-stone-900">
                            {targetTypeLabels[discount.target_type]} · {targetName ?? `ID ${discount.target_id}`}
                          </p>
                          <p className="mt-1 text-xs uppercase tracking-[0.2em] text-stone-500">
                            Target ID {discount.target_id}
                          </p>
                        </div>
                      </div>

                      <div className="grid gap-4 md:grid-cols-4">
                        <label className="block">
                          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">Type</span>
                          <select
                            name="type"
                            defaultValue={discount.type}
                            className="w-full rounded-[1.1rem] border border-stone-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-stone-950"
                          >
                            {Object.entries(discountTypeLabels).map(([value, label]) => (
                              <option key={value} value={value}>
                                {label}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="block">
                          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">Amount</span>
                          <input
                            type="number"
                            name="amount"
                            min="0"
                            step="0.01"
                            defaultValue={String(discount.amount)}
                            className="w-full rounded-[1.1rem] border border-stone-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-stone-950"
                          />
                        </label>
                        <label className="block">
                          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">Starts</span>
                          <input
                            type="datetime-local"
                            name="start_at"
                            defaultValue={toIndiaDateTimeLocalValue(discount.start_at)}
                            className="w-full rounded-[1.1rem] border border-stone-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-stone-950"
                          />
                        </label>
                        <label className="block">
                          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">Ends</span>
                          <input
                            type="datetime-local"
                            name="end_at"
                            defaultValue={toIndiaDateTimeLocalValue(discount.end_at)}
                            className="w-full rounded-[1.1rem] border border-stone-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-stone-950"
                          />
                        </label>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <label className="flex items-center gap-3 text-sm text-stone-700">
                          <input type="hidden" name="active" value="false" />
                          <input type="checkbox" name="active" value="true" defaultChecked={discount.active} className="h-4 w-4 rounded border-stone-300 text-stone-950" />
                          Active
                        </label>
                        <div className="flex flex-wrap gap-3">
                          <SubmitButton
                            pendingLabel="Saving..."
                            className="inline-flex rounded-full border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-700 transition hover:border-stone-950 hover:text-stone-950"
                          >
                            Save
                          </SubmitButton>
                          <button
                            type="submit"
                            formAction={deleteDiscountAction}
                            className="inline-flex rounded-full border border-rose-300 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:border-rose-600 hover:bg-rose-600 hover:text-white"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </form>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-stone-500">No discounts yet.</p>
            )}
          </div>
        </Surface>
      </section>
    </AppShell>
  );
}
