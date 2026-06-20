"use client";

import { useMemo, useState } from "react";

import { SubmitButton } from "@/components/submit-button";
import type { Product } from "@/lib/types";

type StockAdjustmentFormProps = {
  products: Product[];
  action: (formData: FormData) => void | Promise<void>;
};

export function StockAdjustmentForm({
  products,
  action,
}: StockAdjustmentFormProps) {
  const [selectedProductId, setSelectedProductId] = useState("");

  const selectedProduct = useMemo(
    () =>
      products.find((product) => String(product.id) === selectedProductId) ?? null,
    [products, selectedProductId],
  );

  return (
    <form action={action} className="grid gap-4">
      <label className="block">
        <span className="mb-2 block text-sm font-medium text-stone-700">Item</span>
        <select
          name="product_id"
          value={selectedProductId}
          onChange={(event) => setSelectedProductId(event.target.value)}
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

      <label className="block">
        <span className="mb-2 block text-sm font-medium text-stone-700">Change type</span>
        <select
          name="adjustment_kind"
          className="w-full rounded-[1.25rem] border border-stone-300 bg-stone-50 px-4 py-3 text-sm outline-none transition focus:border-stone-950"
          required
          defaultValue="purchase"
        >
          <option value="purchase">Purchase / refill stock</option>
          <option value="correction">Correction / manual change</option>
        </select>
        <p className="mt-2 text-xs text-stone-500">
          Purchase adds to total purchased. Correction only changes current quantity.
        </p>
      </label>

      <div className="grid gap-4 md:grid-cols-3">
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-stone-700">
            Current quantity before change
          </span>
          <input
            type="text"
            value={selectedProduct ? String(selectedProduct.stock_quantity) : ""}
            readOnly
            placeholder="Select an item first"
            className="w-full rounded-[1.25rem] border border-stone-300 bg-stone-100 px-4 py-3 text-sm text-stone-700 outline-none"
          />
          <p className="mt-2 text-xs text-stone-500">
            This is the live quantity before the new stock change is applied.
          </p>
        </label>

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
        <span className="mb-2 block text-sm font-medium text-stone-700">Reason</span>
        <input
          type="text"
          name="reason"
          className="w-full rounded-[1.25rem] border border-stone-300 bg-stone-50 px-4 py-3 text-sm outline-none transition focus:border-stone-950"
          placeholder="Example: New stock arrived"
          required
        />
      </label>

      <label className="block">
        <span className="mb-2 block text-sm font-medium text-stone-700">Extra note</span>
        <textarea
          name="note"
          rows={4}
          className="w-full rounded-[1.25rem] border border-stone-300 bg-stone-50 px-4 py-3 text-sm outline-none transition focus:border-stone-950"
          placeholder="Optional details"
        />
      </label>

      <div>
        <SubmitButton
          pendingLabel="Applying change..."
          className="inline-flex items-center rounded-full bg-stone-950 px-5 py-3 text-sm font-semibold text-stone-50 transition hover:bg-stone-800"
        >
          Apply adjustment
        </SubmitButton>
      </div>
    </form>
  );
}
