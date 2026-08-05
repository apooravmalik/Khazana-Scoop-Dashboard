import Link from "next/link";

import { SubmitButton } from "@/components/submit-button";
import type { CatalogProduct, Category, Collection } from "@/lib/types";

type CatalogProductFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  categories: Category[];
  cancelHref?: string;
  cancelLabel?: string;
  collections: Collection[];
  product?: CatalogProduct | null;
  submitLabel: string;
  pendingLabel: string;
};

export function CatalogProductForm({
  action,
  categories,
  cancelHref = "/stock",
  cancelLabel = "Back to stock",
  collections,
  product,
  submitLabel,
  pendingLabel,
}: CatalogProductFormProps) {
  return (
    <form action={action} className="grid gap-4">
      {product ? <input type="hidden" name="product_id" value={product.id} /> : null}
      <input
        type="hidden"
        name="available_colours"
        value={product?.available_colours.join("\n") ?? ""}
      />

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

      <div className="grid gap-4 md:grid-cols-2">
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-stone-700">Frontend name</span>
          <input
            type="text"
            name="view_name"
            defaultValue={product?.view_name ?? ""}
            className="w-full rounded-[1.25rem] border border-stone-300 bg-stone-50 px-4 py-3 text-sm outline-none transition focus:border-stone-950"
            placeholder="Cute Avocado Eraser"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-stone-700">Selling price</span>
          <input
            type="number"
            name="selling_price"
            min="0"
            step="0.01"
            defaultValue={product ? String(product.selling_price) : "0"}
            className="w-full rounded-[1.25rem] border border-stone-300 bg-stone-50 px-4 py-3 text-sm outline-none transition focus:border-stone-950"
          />
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">

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
          <p className="mt-2 text-xs text-stone-500">
            Hold Command on Mac to select multiple collections.
          </p>
        </label>
      </div>

      {product?.available_colours.length ? (
        <div className="rounded-[1.25rem] border border-stone-200 bg-stone-50/70 px-4 py-4 text-sm text-stone-700">
          <p className="font-medium text-stone-900">Saved colours</p>
          <p className="mt-2">{product.available_colours.join(", ")}</p>
          <p className="mt-2 text-xs text-stone-500">
            Add or remove colour images from the side panel on the Stock edit page.
          </p>
        </div>
      ) : null}

      <label className="flex items-center gap-3 rounded-[1.25rem] border border-stone-200 bg-stone-50/70 px-4 py-4 text-sm text-stone-700">
        <input
          type="hidden"
          name="active"
          value="false"
        />
        <input
          type="checkbox"
          name="active"
          value="true"
          defaultChecked={product?.active ?? true}
          className="h-4 w-4 rounded border-stone-300 text-stone-950"
        />
        Product is active in the dashboard and scoop builder
      </label>

      <label className="flex items-start gap-3 rounded-[1.25rem] border border-stone-200 bg-stone-50/70 px-4 py-4 text-sm text-stone-700">
        <input
          type="hidden"
          name="website_visible"
          value="false"
        />
        <input
          type="checkbox"
          name="website_visible"
          value="true"
          defaultChecked={product?.website_visible ?? true}
          className="mt-0.5 h-4 w-4 rounded border-stone-300 text-stone-950"
        />
        <span>
          <span className="block font-medium text-stone-700">List individually on website</span>
          <span className="mt-1 block text-xs leading-5 text-stone-500">
            Turn this off to keep the product available in the dashboard, scoop, and Build Your Box
            flows without showing it in the individual website catalogue.
          </span>
        </span>
      </label>

      <div className="flex flex-wrap items-center gap-3">
        <SubmitButton
          pendingLabel={pendingLabel}
          className="inline-flex rounded-full bg-stone-950 px-5 py-3 text-sm font-semibold text-stone-50 transition hover:bg-stone-800"
        >
          {submitLabel}
        </SubmitButton>
        <Link
          href={cancelHref}
          className="inline-flex rounded-full border border-stone-300 px-4 py-3 text-sm font-semibold text-stone-700 transition hover:border-stone-950 hover:text-stone-950"
        >
          {cancelLabel}
        </Link>
      </div>
    </form>
  );
}
