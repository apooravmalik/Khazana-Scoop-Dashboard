import Link from "next/link";

import { SubmitButton } from "@/components/submit-button";
import type { CatalogProduct, Category, Collection } from "@/lib/types";

type CatalogProductFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  categories: Category[];
  collections: Collection[];
  product?: CatalogProduct | null;
  submitLabel: string;
  pendingLabel: string;
};

export function CatalogProductForm({
  action,
  categories,
  collections,
  product,
  submitLabel,
  pendingLabel,
}: CatalogProductFormProps) {
  return (
    <form action={action} className="grid gap-4">
      {product ? <input type="hidden" name="product_id" value={product.id} /> : null}

      <div className="grid gap-4 md:grid-cols-2">
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-stone-700">Product name</span>
          <input
            type="text"
            name="name"
            defaultValue={product?.name ?? ""}
            className="w-full rounded-[1.25rem] border border-stone-300 bg-stone-50 px-4 py-3 text-sm outline-none transition focus:border-stone-950"
            required
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-stone-700">Slug</span>
          <input
            type="text"
            name="slug"
            defaultValue={product?.slug ?? ""}
            className="w-full rounded-[1.25rem] border border-stone-300 bg-stone-50 px-4 py-3 text-sm outline-none transition focus:border-stone-950"
            placeholder="lucky-capsules"
          />
        </label>
      </div>

      <label className="block">
        <span className="mb-2 block text-sm font-medium text-stone-700">Description</span>
        <textarea
          name="description"
          rows={4}
          defaultValue={product?.description ?? ""}
          className="w-full rounded-[1.25rem] border border-stone-300 bg-stone-50 px-4 py-3 text-sm outline-none transition focus:border-stone-950"
          placeholder="Short public-facing description for the storefront."
        />
      </label>

      <div className="grid gap-4 md:grid-cols-3">
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-stone-700">Base price</span>
          <input
            type="number"
            name="base_price"
            min="0"
            step="0.01"
            defaultValue={product ? String(product.base_price) : "0"}
            className="w-full rounded-[1.25rem] border border-stone-300 bg-stone-50 px-4 py-3 text-sm outline-none transition focus:border-stone-950"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-stone-700">Latest cost</span>
          <input
            type="number"
            name="unit_cost"
            min="0"
            step="0.01"
            defaultValue={product ? String(product.unit_cost) : "0"}
            className="w-full rounded-[1.25rem] border border-stone-300 bg-stone-50 px-4 py-3 text-sm outline-none transition focus:border-stone-950"
            required
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-stone-700">Opening stock</span>
          <input
            type="number"
            name="stock_quantity"
            min="0"
            defaultValue={product ? String(product.stock_quantity) : "0"}
            className="w-full rounded-[1.25rem] border border-stone-300 bg-stone-50 px-4 py-3 text-sm outline-none transition focus:border-stone-950"
            disabled={Boolean(product)}
          />
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-stone-700">Category</span>
          <select
            name="category_id"
            defaultValue={product?.category_record?.id ? String(product.category_record.id) : ""}
            className="w-full rounded-[1.25rem] border border-stone-300 bg-stone-50 px-4 py-3 text-sm outline-none transition focus:border-stone-950"
          >
            <option value="">No category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          <input type="hidden" name="category" value={product?.category ?? "Mystery Scoop"} />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-stone-700">Collections</span>
          <select
            name="collection_ids"
            multiple
            defaultValue={product?.collections.map((collection) => String(collection.id)) ?? []}
            className="min-h-36 w-full rounded-[1.25rem] border border-stone-300 bg-stone-50 px-4 py-3 text-sm outline-none transition focus:border-stone-950"
          >
            {collections.map((collection) => (
              <option key={collection.id} value={collection.id}>
                {collection.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-stone-700">Primary image URL</span>
          <input
            type="url"
            name="primary_image_url"
            defaultValue={product?.primary_image_url ?? ""}
            className="w-full rounded-[1.25rem] border border-stone-300 bg-stone-50 px-4 py-3 text-sm outline-none transition focus:border-stone-950"
            placeholder="https://..."
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-stone-700">Colours</span>
          <input
            type="text"
            name="available_colours"
            defaultValue={product?.available_colours.join(", ") ?? ""}
            className="w-full rounded-[1.25rem] border border-stone-300 bg-stone-50 px-4 py-3 text-sm outline-none transition focus:border-stone-950"
            placeholder="Pink, Mint, Lilac"
          />
        </label>
      </div>

      <label className="block">
        <span className="mb-2 block text-sm font-medium text-stone-700">Gallery image URLs</span>
        <textarea
          name="gallery_images"
          rows={5}
          defaultValue={product?.images.map((image) => image.url).join("\n") ?? ""}
          className="w-full rounded-[1.25rem] border border-stone-300 bg-stone-50 px-4 py-3 text-sm outline-none transition focus:border-stone-950"
          placeholder={"One image URL per line"}
        />
      </label>

      <label className="flex items-center gap-3 rounded-[1.25rem] border border-stone-200 bg-stone-50/70 px-4 py-4 text-sm text-stone-700">
        <input
          type="hidden"
          name="active"
          value={product?.active === false ? "false" : "true"}
        />
        <input
          type="checkbox"
          name="active"
          value="true"
          defaultChecked={product?.active ?? true}
          className="h-4 w-4 rounded border-stone-300 text-stone-950"
        />
        Product is active on the storefront
      </label>

      <div className="flex flex-wrap items-center gap-3">
        <SubmitButton
          pendingLabel={pendingLabel}
          className="inline-flex rounded-full bg-stone-950 px-5 py-3 text-sm font-semibold text-stone-50 transition hover:bg-stone-800"
        >
          {submitLabel}
        </SubmitButton>
        <Link
          href="/products"
          className="inline-flex rounded-full border border-stone-300 px-4 py-3 text-sm font-semibold text-stone-700 transition hover:border-stone-950 hover:text-stone-950"
        >
          Back to products
        </Link>
      </div>
    </form>
  );
}
