"use client";

import { useState } from "react";

import { orderStatuses, paymentStatuses } from "@/lib/constants";
import { formatCurrency } from "@/lib/format";
import type { Product, ScoopType } from "@/lib/types";

type OrderBuilderProps = {
  products: Product[];
  scoopTypes: ScoopType[];
  initialOrder?: {
    customer_name: string;
    customer_phone: string;
    customer_address: string;
    scoop_type_id: number | null;
    ordered_at: string;
    delivery_status: string;
    payment_status: string;
    delivery_cost: number | null;
    packaging_cost: number | null;
    delivery_date: string | null;
    items: Array<{ product_id: number; quantity: number }>;
  };
  submitLabel?: string;
};

type SelectedState = Record<number, { checked: boolean; quantity: number }>;
type InitialSelectedItem = { product_id: number; quantity: number };

function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
}

function buildInitialSelectedState(items: InitialSelectedItem[]) {
  return Object.fromEntries(
    (items ?? []).map((item) => [
      item.product_id,
      {
        checked: true,
        quantity: item.quantity,
      },
    ]),
  ) as SelectedState;
}

export function OrderBuilder({
  products,
  scoopTypes,
  initialOrder,
  submitLabel = "Save order",
}: OrderBuilderProps) {
  const [selectedScoopId, setSelectedScoopId] = useState(
    String(initialOrder?.scoop_type_id ?? scoopTypes[0]?.id ?? ""),
  );
  const [selected, setSelected] = useState<SelectedState>(
    buildInitialSelectedState(initialOrder?.items ?? []),
  );

  const activeScoop = scoopTypes.find((scoopType) => String(scoopType.id) === selectedScoopId);

  const selectedItems = products
    .map((product) => {
      const entry = selected[product.id];

      return {
        productId: product.id,
        name: product.name,
        unitCost: product.unit_cost,
        quantity: entry?.checked ? Math.max(1, entry.quantity || 1) : 0,
      };
    })
    .filter((item) => item.quantity > 0);

  const totalGiftCount = selectedItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalProductCost = selectedItems.reduce(
    (sum, item) => sum + item.unitCost * item.quantity,
    0,
  );
  const projectedProfit = (activeScoop?.price ?? 0) - totalProductCost;

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-stone-700">
            Customer name
          </span>
          <input
            type="text"
            name="customer_name"
            defaultValue={initialOrder?.customer_name ?? ""}
            className="w-full rounded-[1.25rem] border border-stone-300 bg-stone-50 px-4 py-3 text-sm outline-none transition focus:border-stone-950"
            placeholder="Anaya"
            required
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-stone-700">
            Phone
          </span>
          <input
            type="tel"
            name="customer_phone"
            defaultValue={initialOrder?.customer_phone ?? ""}
            className="w-full rounded-[1.25rem] border border-stone-300 bg-stone-50 px-4 py-3 text-sm outline-none transition focus:border-stone-950"
            placeholder="+91 98xxxxxx12"
            required
          />
        </label>
      </div>

      <label className="block">
        <span className="mb-2 block text-sm font-medium text-stone-700">
          Address
        </span>
        <textarea
          name="customer_address"
          rows={4}
          defaultValue={initialOrder?.customer_address ?? ""}
          className="w-full rounded-[1.25rem] border border-stone-300 bg-stone-50 px-4 py-3 text-sm outline-none transition focus:border-stone-950"
          placeholder="Full shipping address"
          required
        />
      </label>

      <div className="grid gap-4 lg:grid-cols-4">
        <label className="block lg:col-span-2">
          <span className="mb-2 block text-sm font-medium text-stone-700">
            Scoop selection
          </span>
          <select
            name="scoop_type_id"
            value={selectedScoopId}
            onChange={(event) => setSelectedScoopId(event.target.value)}
            className="w-full rounded-[1.25rem] border border-stone-300 bg-stone-50 px-4 py-3 text-sm outline-none transition focus:border-stone-950"
            required
          >
            {scoopTypes.map((scoopType) => (
              <option key={scoopType.id} value={scoopType.id}>
                {scoopType.name} · {formatCurrency(scoopType.price)}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-stone-700">
            Order date
          </span>
          <input
            type="date"
            name="ordered_at"
            defaultValue={initialOrder?.ordered_at ?? getTodayDate()}
            className="w-full rounded-[1.25rem] border border-stone-300 bg-stone-50 px-4 py-3 text-sm outline-none transition focus:border-stone-950"
            required
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-stone-700">
            Delivery status
          </span>
          <select
            name="delivery_status"
            defaultValue={initialOrder?.delivery_status ?? "pending"}
            className="w-full rounded-[1.25rem] border border-stone-300 bg-stone-50 px-4 py-3 text-sm outline-none transition focus:border-stone-950"
          >
            {orderStatuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-[1.3rem] border border-amber-200 bg-amber-50/70 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-700">
            Scoop price
          </p>
          <p className="mt-3 font-serif text-3xl text-stone-950">
            {formatCurrency(activeScoop?.price ?? 0)}
          </p>
        </div>
        <div className="rounded-[1.3rem] border border-stone-200 bg-stone-50/70 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-stone-500">
            Gift cost
          </p>
          <p className="mt-3 font-serif text-3xl text-stone-950">
            {formatCurrency(totalProductCost)}
          </p>
        </div>
        <div className="rounded-[1.3rem] border border-emerald-200 bg-emerald-50/70 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700">
            Projected profit
          </p>
          <p className="mt-3 font-serif text-3xl text-stone-950">
            {formatCurrency(projectedProfit)}
          </p>
          <p className="mt-2 text-xs text-stone-600">
            Before delivery and packaging costs are added.
          </p>
        </div>
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-semibold text-stone-900">Gift checklist</p>
          <p className="text-xs uppercase tracking-[0.2em] text-stone-500">
            {totalGiftCount} gifts selected
          </p>
        </div>

        <div className="grid gap-3 xl:grid-cols-2">
          {products.map((product) => {
            const entry = selected[product.id];
            const checked = entry?.checked ?? false;
            const quantity = entry?.quantity ?? 1;

            return (
              <div
                key={product.id}
                className={`rounded-[1.2rem] border px-4 py-4 transition ${
                  checked
                    ? "border-stone-950 bg-stone-100"
                    : "border-stone-200 bg-white"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <label className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(event) => {
                        setSelected((current) => ({
                          ...current,
                          [product.id]: {
                            checked: event.target.checked,
                            quantity: current[product.id]?.quantity ?? 1,
                          },
                        }));
                      }}
                      className="mt-1 h-4 w-4 rounded border-stone-300 text-stone-950"
                    />
                    <span>
                      <span className="block font-semibold text-stone-900">
                        {product.name}
                      </span>
                      <span className="mt-1 block text-sm text-stone-600">
                        Cost {formatCurrency(product.unit_cost)} · {product.stock_quantity} in
                        stock
                      </span>
                    </span>
                  </label>

                  <label className="w-24">
                    <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.2em] text-stone-500">
                      Qty
                    </span>
                    <input
                      type="number"
                      min="1"
                      max={Math.max(1, product.stock_quantity)}
                      value={quantity}
                      onChange={(event) => {
                        setSelected((current) => ({
                          ...current,
                          [product.id]: {
                            checked: current[product.id]?.checked ?? false,
                            quantity: Number(event.target.value) || 1,
                          },
                        }));
                      }}
                      disabled={!checked}
                      className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-stone-950 disabled:cursor-not-allowed disabled:bg-stone-100"
                    />
                  </label>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-stone-700">
            Payment status
          </span>
          <select
            name="payment_status"
            defaultValue={initialOrder?.payment_status ?? "unpaid"}
            className="w-full rounded-[1.25rem] border border-stone-300 bg-stone-50 px-4 py-3 text-sm outline-none transition focus:border-stone-950"
          >
            {paymentStatuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-stone-700">
            Delivery cost
          </span>
          <input
            type="number"
            name="delivery_cost"
            min="0"
            step="0.01"
            defaultValue={initialOrder?.delivery_cost ?? ""}
            placeholder="Leave empty for now"
            className="w-full rounded-[1.25rem] border border-stone-300 bg-stone-50 px-4 py-3 text-sm outline-none transition focus:border-stone-950"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-stone-700">
            Packaging cost
          </span>
          <input
            type="number"
            name="packaging_cost"
            min="0"
            step="0.01"
            defaultValue={initialOrder?.packaging_cost ?? ""}
            placeholder="Leave empty for now"
            className="w-full rounded-[1.25rem] border border-stone-300 bg-stone-50 px-4 py-3 text-sm outline-none transition focus:border-stone-950"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-stone-700">
            Delivery date
          </span>
          <input
            type="date"
            name="delivery_date"
            defaultValue={initialOrder?.delivery_date ?? ""}
            className="w-full rounded-[1.25rem] border border-stone-300 bg-stone-50 px-4 py-3 text-sm outline-none transition focus:border-stone-950"
          />
        </label>

        <div className="flex items-end">
          <input
            type="hidden"
            name="selected_items_json"
            value={JSON.stringify(
              selectedItems.map((item) => ({
                productId: item.productId,
                quantity: item.quantity,
              })),
            )}
          />
          <button
            type="submit"
            className="inline-flex w-full items-center justify-center rounded-full bg-stone-950 px-5 py-3 text-sm font-semibold text-stone-50 transition hover:bg-stone-800"
          >
            {submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
