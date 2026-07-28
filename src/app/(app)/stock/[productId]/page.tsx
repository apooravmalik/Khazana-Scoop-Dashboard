import Image from "next/image";
import Link from "next/link";

import {
  deleteProductAction,
  deleteProductImageAction,
  updateProductAction,
} from "@/app/actions";
import { AppShell } from "@/components/app-shell";
import { CatalogProductForm } from "@/components/catalog-product-form";
import { ProductImageUploadForm } from "@/components/product-image-upload-form";
import { SubmitButton } from "@/components/submit-button";
import { Surface } from "@/components/surface";
import { getCatalogProductById, getCategories, getCollections } from "@/lib/data";
import { formatCurrency } from "@/lib/format";

type EditProductPageProps = {
  params: Promise<{ productId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function formatStatusLabel(value: string) {
  return value.replaceAll("-", " ");
}

export default async function EditProductPage({ params, searchParams }: EditProductPageProps) {
  const [{ productId }, query] = await Promise.all([params, searchParams]);
  const [product, categories, collections] = await Promise.all([
    getCatalogProductById(Number(productId)),
    getCategories(),
    getCollections(),
  ]);

  if (!product) {
    return (
      <AppShell title="Edit product" description="The product you are trying to edit could not be found.">
        <Surface title="Product missing" description="Go back to the stock page to continue.">
          <Link
            href="/stock"
            className="inline-flex rounded-full border border-stone-950 px-4 py-2 font-semibold text-stone-950 transition hover:bg-stone-950 hover:text-stone-50"
          >
            Back to stock
          </Link>
        </Surface>
      </AppShell>
    );
  }

  return (
    <AppShell
      title={`Edit ${product.name}`}
      description="Update stock, frontend naming, category placement, collections, selling price, and colour variants from one screen."
    >
      {typeof query.error === "string" ? (
        <div className="rounded-[1.25rem] border border-rose-200 bg-rose-50 px-4 py-4 text-sm text-rose-700">
          <p className="font-semibold text-rose-900">Image upload issue: {formatStatusLabel(query.error)}</p>
          {typeof query.step === "string" ? (
            <p className="mt-2">
              Failed step: <span className="font-medium">{formatStatusLabel(query.step)}</span>
            </p>
          ) : null}
          {typeof query.detail === "string" ? (
            <p className="mt-2 break-words">
              Supabase message: <span className="font-medium">{query.detail}</span>
            </p>
          ) : null}
          {typeof query.bucket === "string" ? (
            <p className="mt-2">
              Bucket: <span className="font-medium">{query.bucket}</span>
            </p>
          ) : null}
          {typeof query.objectPath === "string" ? (
            <p className="mt-2 break-all">
              Object path: <span className="font-medium">{query.objectPath}</span>
            </p>
          ) : null}
        </div>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-[1fr_0.92fr]">
        <Surface
          title="Product details"
          description="This form updates the stored product record. Quantity changes still happen from the stock adjustment workflow on the main Stock page."
        >
          <CatalogProductForm
            action={updateProductAction}
            categories={categories}
            collections={collections}
            product={product}
            submitLabel="Save product changes"
            pendingLabel="Saving product..."
          />
        </Surface>

        <div className="space-y-6">
          <Surface
            title="Colour variants"
            description="Add each product colour with its own image. Every upload goes into the Supabase product-images bucket and is saved on the product record."
          >
            <div className="space-y-5">
              <ProductImageUploadForm productId={product.id} />

              <div className="space-y-3">
                {product.images.length > 0 ? (
                  product.images.map((image) => (
                    <div
                      key={image.id}
                      className="flex flex-col gap-3 rounded-[1.25rem] border border-stone-200 bg-stone-50/70 p-4"
                    >
                      <div className="grid gap-4 md:grid-cols-[108px_1fr]">
                        <div className="relative h-28 overflow-hidden rounded-[1rem] border border-stone-200 bg-white">
                          <Image
                            src={image.url}
                            alt={`Product image ${image.sort_order + 1}`}
                            fill
                            className="object-cover"
                            sizes="108px"
                          />
                        </div>
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold text-stone-900">
                              {image.alt_text || `Image ${image.sort_order + 1}`}
                              {product.primary_image_url === image.url ? " · Primary" : ""}
                            </p>
                            {image.alt_text ? (
                              <p className="mt-1 text-xs uppercase tracking-[0.2em] text-stone-500">
                                Colour variant
                              </p>
                            ) : null}
                            <p className="mt-1 break-all text-xs text-stone-500">{image.url}</p>
                          </div>
                          <form action={deleteProductImageAction}>
                            <input type="hidden" name="product_id" value={product.id} />
                            <input type="hidden" name="image_id" value={image.id} />
                            <input type="hidden" name="image_url" value={image.url} />
                            <input type="hidden" name="image_colour" value={image.alt_text ?? ""} />
                            <input
                              type="hidden"
                              name="primary_image_url"
                              value={product.primary_image_url ?? ""}
                            />
                            <SubmitButton
                              pendingLabel="Removing..."
                              className="inline-flex rounded-full border border-rose-300 px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:border-rose-600 hover:bg-rose-600 hover:text-white"
                            >
                              Remove
                            </SubmitButton>
                          </form>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-stone-500">No gallery images saved yet.</p>
                )}
              </div>
            </div>
          </Surface>

          <Surface
            title="Stock summary"
            description="Quick reference for quantity, value, category, and collection status."
          >
            <div className="space-y-4 text-sm leading-6 text-stone-600">
              <div className="rounded-[1.25rem] border border-stone-200 bg-stone-50/70 px-4 py-4">
                <p>
                  Total purchased:{" "}
                  <span className="font-semibold text-stone-900">{product.total_purchased_quantity}</span>
                </p>
                <p className="mt-1">
                  Current stock:{" "}
                  <span className="font-semibold text-stone-900">{product.stock_quantity}</span>
                </p>
                <p className="mt-1">
                  Stock value:{" "}
                  <span className="font-semibold text-stone-900">
                    {formatCurrency(product.stock_quantity * product.unit_cost)}
                  </span>
                </p>
              </div>

              <div className="rounded-[1.25rem] border border-stone-200 bg-stone-50/70 px-4 py-4">
                <p>
                  Frontend name:{" "}
                  <span className="font-semibold text-stone-900">{product.view_name || product.name}</span>
                </p>
                <p className="mt-1">
                  Selling price:{" "}
                  <span className="font-semibold text-stone-900">
                    {formatCurrency(product.selling_price || product.base_price)}
                  </span>
                </p>
                <p className="mt-1">
                  Category:{" "}
                  <span className="font-semibold text-stone-900">
                    {product.category_record?.name ?? product.category}
                  </span>
                </p>
                <p className="mt-1">
                  Collections:{" "}
                  <span className="font-semibold text-stone-900">
                    {product.collections.length > 0
                      ? product.collections.map((collection) => collection.name).join(", ")
                      : "No collections"}
                  </span>
                </p>
                <p className="mt-1">
                  Colours:{" "}
                  <span className="font-semibold text-stone-900">
                    {product.available_colours.length > 0
                      ? product.available_colours.join(", ")
                      : "No colours yet"}
                  </span>
                </p>
                <p className="mt-1">
                  Uploaded images:{" "}
                  <span className="font-semibold text-stone-900">{product.images.length}</span>
                </p>
              </div>
            </div>
          </Surface>

          <Surface
            title="Delete product"
            description="Delete is only allowed when the product has no order history and no stock movement history."
          >
            <form action={deleteProductAction} className="space-y-4">
              <input type="hidden" name="product_id" value={product.id} />
              <div className="rounded-[1.25rem] border border-rose-200 bg-rose-50 px-4 py-4 text-sm leading-6 text-rose-800">
                If this product has already been used in orders or stock movements, deletion will be blocked to protect history.
              </div>
              <SubmitButton
                pendingLabel="Deleting product..."
                className="inline-flex rounded-full border border-rose-300 px-4 py-2 font-semibold text-rose-700 transition hover:border-rose-600 hover:bg-rose-600 hover:text-white"
              >
                Delete product
              </SubmitButton>
            </form>
          </Surface>
        </div>
      </section>
    </AppShell>
  );
}
