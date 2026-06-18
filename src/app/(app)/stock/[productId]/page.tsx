import Link from "next/link";

import { deleteProductAction, updateProductAction } from "@/app/actions";
import { AppShell } from "@/components/app-shell";
import { SubmitButton } from "@/components/submit-button";
import { Surface } from "@/components/surface";
import { getProductById } from "@/lib/data";
import { formatCurrency } from "@/lib/format";

type EditProductPageProps = {
  params: Promise<{ productId: string }>;
};

export default async function EditProductPage({ params }: EditProductPageProps) {
  const { productId } = await params;
  const product = await getProductById(Number(productId));

  if (!product) {
    return (
      <AppShell
        title="Edit inventory item"
        description="The item you are trying to edit could not be found."
      >
        <Surface title="Item missing" description="Go back to the stock page to continue.">
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
      description="Update the inventory item name, category, and latest cost here. Use the stock page to change quantity."
    >
      <section className="grid gap-6 xl:grid-cols-[1fr_0.92fr]">
        <Surface
          title="Edit inventory item"
          description="This updates the saved item details. Quantity stays managed through the stock adjustment workflow."
        >
          <form action={updateProductAction} className="grid gap-4">
            <input type="hidden" name="product_id" value={product.id} />

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-stone-700">Item name</span>
              <input
                type="text"
                name="name"
                defaultValue={product.name}
                className="w-full rounded-[1.25rem] border border-stone-300 bg-stone-50 px-4 py-3 text-sm outline-none transition focus:border-stone-950"
                required
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-stone-700">Category</span>
              <input
                type="text"
                name="category"
                defaultValue={product.category}
                className="w-full rounded-[1.25rem] border border-stone-300 bg-stone-50 px-4 py-3 text-sm outline-none transition focus:border-stone-950"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-stone-700">
                Latest cost price
              </span>
              <input
                type="number"
                name="unit_cost"
                min="0"
                step="0.01"
                defaultValue={String(product.unit_cost)}
                className="w-full rounded-[1.25rem] border border-stone-300 bg-stone-50 px-4 py-3 text-sm outline-none transition focus:border-stone-950"
                required
              />
            </label>

            <div className="rounded-[1.25rem] border border-stone-200 bg-stone-50/70 px-4 py-4 text-sm leading-6 text-stone-600">
              Current stock:{" "}
              <span className="font-semibold text-stone-900">{product.stock_quantity}</span>
              {" "}pieces
              <br />
              Current stock value:{" "}
              <span className="font-semibold text-stone-900">
                {formatCurrency(product.stock_quantity * product.unit_cost)}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <SubmitButton
                pendingLabel="Saving item..."
                className="inline-flex rounded-full bg-stone-950 px-5 py-3 text-sm font-semibold text-stone-50 transition hover:bg-stone-800"
              >
                Save item changes
              </SubmitButton>
              <Link
                href="/stock"
                className="inline-flex rounded-full border border-stone-300 px-4 py-3 text-sm font-semibold text-stone-700 transition hover:border-stone-950 hover:text-stone-950"
              >
                Back to stock
              </Link>
            </div>
          </form>
        </Surface>

        <Surface
          title="Delete item"
          description="Delete is only allowed when the item has no order history and no stock movement history."
        >
          <form action={deleteProductAction} className="space-y-4">
            <input type="hidden" name="product_id" value={product.id} />
            <div className="rounded-[1.25rem] border border-rose-200 bg-rose-50 px-4 py-4 text-sm leading-6 text-rose-800">
              If this item has already been used in orders or stock movements, the app will block
              deletion to protect reporting history.
            </div>
            <SubmitButton
              pendingLabel="Deleting item..."
              className="inline-flex rounded-full border border-rose-300 px-4 py-2 font-semibold text-rose-700 transition hover:border-rose-600 hover:bg-rose-600 hover:text-white"
            >
              Delete item
            </SubmitButton>
          </form>
        </Surface>
      </section>
    </AppShell>
  );
}
