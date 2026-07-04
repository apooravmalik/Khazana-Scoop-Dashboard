import Image from "next/image";
import Link from "next/link";

import {
  deleteProductAction,
  deleteProductImageAction,
  updateProductAction,
  uploadProductImageAction,
} from "@/app/actions";
import { AppShell } from "@/components/app-shell";
import { CatalogProductForm } from "@/components/catalog-product-form";
import { SubmitButton } from "@/components/submit-button";
import { Surface } from "@/components/surface";
import { getCatalogProductById, getCategories, getCollections } from "@/lib/data";
import { formatCurrency } from "@/lib/format";

type EditCatalogProductPageProps = {
  params: Promise<{ productId: string }>;
};

export default async function EditCatalogProductPage({ params }: EditCatalogProductPageProps) {
  const { productId } = await params;
  const [product, categories, collections] = await Promise.all([
    getCatalogProductById(Number(productId)),
    getCategories(),
    getCollections(),
  ]);

  if (!product) {
    return (
      <AppShell
        title="Edit catalog product"
        description="The product you are trying to edit could not be found."
      >
        <Surface title="Product missing" description="Go back to the products page to continue.">
          <Link
            href="/products"
            className="inline-flex rounded-full border border-stone-950 px-4 py-2 font-semibold text-stone-950 transition hover:bg-stone-950 hover:text-stone-50"
          >
            Back to products
          </Link>
        </Surface>
      </AppShell>
    );
  }

  return (
    <AppShell
      title={`Edit ${product.name}`}
      description="Update storefront-facing product content, category placement, collection assignments, public imagery, and merchandising settings here."
    >
      <section className="grid gap-6 xl:grid-cols-[1fr_0.92fr]">
        <Surface
          title="Product details"
          description="This updates the live catalog data that the storefront products page and product detail page will read."
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
            title="Product images"
            description="Upload into the product-images bucket or remove existing gallery items. Marking an upload as primary updates the storefront hero image."
          >
            <div className="space-y-5">
              <form action={uploadProductImageAction} className="grid gap-4">
                <input type="hidden" name="product_id" value={product.id} />
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-stone-700">Upload image</span>
                  <input
                    type="file"
                    name="image"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    className="block w-full rounded-[1.25rem] border border-stone-300 bg-stone-50 px-4 py-3 text-sm text-stone-700"
                  />
                </label>
                <label className="flex items-center gap-3 text-sm text-stone-700">
                  <input type="hidden" name="make_primary" value="false" />
                  <input type="checkbox" name="make_primary" value="true" className="h-4 w-4 rounded border-stone-300 text-stone-950" />
                  Make this the primary storefront image
                </label>
                <SubmitButton
                  pendingLabel="Uploading image..."
                  className="inline-flex rounded-full bg-stone-950 px-5 py-3 text-sm font-semibold text-stone-50 transition hover:bg-stone-800"
                >
                  Upload image
                </SubmitButton>
              </form>

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
                              Image {image.sort_order + 1}
                              {product.primary_image_url === image.url ? " · Primary" : ""}
                            </p>
                          <p className="mt-1 break-all text-xs text-stone-500">{image.url}</p>
                          </div>
                          <form action={deleteProductImageAction}>
                            <input type="hidden" name="product_id" value={product.id} />
                            <input type="hidden" name="image_id" value={image.id} />
                            <input type="hidden" name="image_url" value={image.url} />
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
            title="Catalog summary"
            description="Quick reference for stock, price, category, and collection state."
          >
            <div className="space-y-4 text-sm leading-6 text-stone-600">
              <div className="rounded-[1.25rem] border border-stone-200 bg-stone-50/70 px-4 py-4">
                <p>
                  Current stock: <span className="font-semibold text-stone-900">{product.stock_quantity}</span>
                </p>
                <p className="mt-1">
                  Total purchased: <span className="font-semibold text-stone-900">{product.total_purchased_quantity}</span>
                </p>
                <p className="mt-1">
                  Stock value: <span className="font-semibold text-stone-900">{formatCurrency(product.stock_quantity * product.unit_cost)}</span>
                </p>
              </div>

              <div className="rounded-[1.25rem] border border-stone-200 bg-stone-50/70 px-4 py-4">
                <p>
                  Category: <span className="font-semibold text-stone-900">{product.category_record?.name ?? product.category}</span>
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
                  Gallery images: <span className="font-semibold text-stone-900">{product.images.length}</span>
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
