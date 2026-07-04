import Link from "next/link";

import { AppShell } from "@/components/app-shell";
import { StatusPill } from "@/components/status-pill";
import { Surface } from "@/components/surface";
import { getCatalogProducts, getCategories, getCollections, getDiscounts } from "@/lib/data";
import { formatCurrency } from "@/lib/format";

export default async function ProductsPage() {
  const [products, categories, collections, discounts] = await Promise.all([
    getCatalogProducts(),
    getCategories(),
    getCollections(),
    getDiscounts(),
  ]);
  const activeProducts = products.filter((product) => product.active);
  const discountedProducts = products.filter((product) => product.active_discount);
  const uncategorizedProducts = products.filter((product) => product.category_record === null);

  return (
    <AppShell
      title="Catalog products"
      description="Review the public catalog data that will feed the storefront, including category placement, collection assignments, pricing, and discount coverage."
    >
      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-[1.5rem] border border-stone-200 bg-stone-50/70 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">
            Active products
          </p>
          <p className="mt-4 font-serif text-4xl text-stone-950">{activeProducts.length}</p>
          <p className="mt-2 text-sm text-stone-600">
            Visible catalog entries ready to surface on the storefront.
          </p>
        </div>
        <div className="rounded-[1.5rem] border border-stone-200 bg-stone-50/70 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">
            Discounted
          </p>
          <p className="mt-4 font-serif text-4xl text-stone-950">{discountedProducts.length}</p>
          <p className="mt-2 text-sm text-stone-600">
            Products currently picking up a live product, category, or collection discount.
          </p>
        </div>
        <div className="rounded-[1.5rem] border border-stone-200 bg-stone-50/70 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">
            Needs category
          </p>
          <p className="mt-4 font-serif text-4xl text-stone-950">{uncategorizedProducts.length}</p>
          <p className="mt-2 text-sm text-stone-600">
            These products still need homepage category placement for storefront merchandising.
          </p>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Surface
          title="Catalog overview"
          description="This is the first dashboard surface for the shared storefront catalog. Stock editing still lives on the Stock page while richer product forms are being built."
        >
          <div className="overflow-hidden rounded-[1.5rem] border border-stone-200">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-stone-200 text-left text-sm">
                <thead className="bg-stone-100/80">
                  <tr>
                    {["Product", "Category", "Collections", "Price", "Stock", "Status"].map((heading) => (
                      <th
                        key={heading}
                        className="px-4 py-3 font-semibold uppercase tracking-[0.2em] text-stone-500"
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 bg-white">
                  {products.length > 0 ? (
                    products.map((product) => (
                      <tr key={product.id}>
                        <td className="px-4 py-4">
                          <div>
                            <p className="font-semibold text-stone-900">{product.name}</p>
                            <p className="mt-1 text-xs uppercase tracking-[0.2em] text-stone-500">
                              /{product.slug || "missing-slug"}
                            </p>
                          </div>
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
                          <div className="flex flex-col gap-1">
                            <span>{formatCurrency(product.effective_price || product.base_price)}</span>
                            {product.active_discount ? (
                              <span className="text-xs text-stone-500 line-through">
                                {formatCurrency(product.base_price)}
                              </span>
                            ) : null}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-stone-700">{product.stock_quantity}</td>
                        <td className="px-4 py-4">
                          <div className="flex flex-wrap items-center gap-2">
                            <StatusPill
                              tone={product.active ? "success" : "neutral"}
                              value={product.active ? "active" : "draft"}
                            />
                            {product.active_discount ? (
                              <StatusPill tone="warning" value={`${product.active_discount.type} discount`} />
                            ) : null}
                            <Link
                              href={`/products/${product.id}`}
                              className="inline-flex rounded-full border border-stone-300 px-3 py-1 text-xs font-semibold text-stone-700 transition hover:border-stone-950 hover:text-stone-950"
                            >
                              Edit
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td className="px-4 py-6 text-stone-500" colSpan={6}>
                        No catalog products yet. Add products from the Stock page while the richer product form is being built.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </Surface>

        <Surface
          title="Next catalog actions"
          description="Use the existing stock tools for now while the dedicated product management forms are being rolled in."
        >
          <div className="space-y-4">
            <div className="rounded-[1.25rem] border border-stone-200 bg-stone-50/70 px-4 py-4">
              <p className="font-semibold text-stone-900">Add or edit inventory-backed products</p>
              <p className="mt-2 text-sm leading-6 text-stone-600">
                Create richer storefront-ready products with descriptions, category assignments, collections, images, and colours.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link
                  href="/products/new"
                  className="inline-flex rounded-full bg-stone-950 px-4 py-2 text-sm font-semibold text-stone-50 transition hover:bg-stone-800"
                >
                  Add catalog product
                </Link>
                <Link
                  href="/stock"
                  className="inline-flex rounded-full border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-700 transition hover:border-stone-950 hover:text-stone-950"
                >
                  Open stock tools
                </Link>
              </div>
            </div>

            <div className="rounded-[1.25rem] border border-stone-200 bg-stone-50/70 px-4 py-4">
              <p className="font-semibold text-stone-900">Catalog setup progress</p>
              <div className="mt-3 space-y-3 text-sm leading-6 text-stone-600">
                <p>{categories.length} categories available for homepage grouping.</p>
                <p>{collections.length} collections available for curated storefront sections.</p>
                <p>{discounts.length} discounts configured for products, categories, or collections.</p>
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link
                  href="/categories"
                  className="inline-flex rounded-full border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-700 transition hover:border-stone-950 hover:text-stone-950"
                >
                  Manage categories
                </Link>
                <Link
                  href="/collections"
                  className="inline-flex rounded-full border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-700 transition hover:border-stone-950 hover:text-stone-950"
                >
                  Manage collections
                </Link>
                <Link
                  href="/discounts"
                  className="inline-flex rounded-full border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-700 transition hover:border-stone-950 hover:text-stone-950"
                >
                  Manage discounts
                </Link>
              </div>
            </div>
          </div>
        </Surface>
      </section>
    </AppShell>
  );
}
