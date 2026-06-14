import Link from "next/link";

import { createOrderAction, updateOrderStatusAction } from "@/app/actions";
import { OrderBuilder } from "@/components/order-builder";
import { AppShell } from "@/components/app-shell";
import { StatusPill } from "@/components/status-pill";
import { Surface } from "@/components/surface";
import { getOrders, getProducts, getScoopTypes } from "@/lib/data";
import { orderStatuses, paymentStatuses } from "@/lib/constants";
import { formatCurrency, formatDate } from "@/lib/format";

type OrdersPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function formatError(error: string) {
  return error.replaceAll("-", " ");
}

export default async function OrdersPage({ searchParams }: OrdersPageProps) {
  const params = await searchParams;
  const products = getProducts();
  const scoopTypes = getScoopTypes();
  const orders = getOrders();
  const pendingCount = orders.filter((order) => order.delivery_status === "pending").length;
  const deliveringCount = orders.filter(
    (order) => order.delivery_status === "delivering",
  ).length;
  const openCostCount = orders.filter(
    (order) => order.delivery_cost === null || order.packaging_cost === null,
  ).length;

  return (
    <AppShell
      title="Mystery scoop orders"
      description="Create scoop orders with customer details, choose the gifts unlocked by the beads, reduce stock automatically, and update delivery or packaging cost later."
    >
      {typeof params.error === "string" ? (
        <div className="rounded-[1.25rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {formatError(params.error)}
        </div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-[1.5rem] border border-stone-200 bg-stone-50/70 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">
            Pending
          </p>
          <p className="mt-4 font-serif text-4xl text-stone-950">{pendingCount}</p>
          <p className="mt-2 text-sm text-stone-600">
            Orders still waiting to move into delivery.
          </p>
        </div>
        <div className="rounded-[1.5rem] border border-stone-200 bg-stone-50/70 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">
            Delivering
          </p>
          <p className="mt-4 font-serif text-4xl text-stone-950">{deliveringCount}</p>
          <p className="mt-2 text-sm text-stone-600">
            Orders currently in transit to customers.
          </p>
        </div>
        <div className="rounded-[1.5rem] border border-stone-200 bg-stone-50/70 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">
            Cost updates pending
          </p>
          <p className="mt-4 font-serif text-4xl text-stone-950">{openCostCount}</p>
          <p className="mt-2 text-sm text-stone-600">
            Orders where delivery or packaging cost is still empty.
          </p>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Surface
          title="Create a new order"
          description="Flow: customer details, scoop selection, gift checklist, then an automatic stock and profit snapshot."
        >
          {products.length > 0 && scoopTypes.length > 0 ? (
            <form action={createOrderAction} className="grid gap-4">
              <OrderBuilder products={products} scoopTypes={scoopTypes} />
            </form>
          ) : (
            <div className="rounded-[1.25rem] border border-amber-200 bg-amber-50 px-4 py-4 text-sm leading-6 text-stone-700">
              <p className="font-semibold text-stone-900">
                Add inventory items and scoop prices before recording orders.
              </p>
              <p className="mt-2">
                Orders need available gifts and at least one scoop price configured.
              </p>
              <Link
                href="/stock"
                className="mt-4 inline-flex rounded-full border border-stone-950 px-4 py-2 font-semibold text-stone-950 transition hover:bg-stone-950 hover:text-stone-50"
              >
                Go to stock page
              </Link>
            </div>
          )}
        </Surface>

        <Surface
          title="Order tracker"
          description="Fill delivery and packaging cost later, and keep delivery plus payment status up to date."
        >
          <div className="space-y-4">
            {orders.length > 0 ? (
              orders.map((order) => (
                <form
                  key={order.id}
                  action={updateOrderStatusAction}
                  className="rounded-[1.4rem] border border-stone-200 bg-stone-50/70 p-4"
                >
                  <input type="hidden" name="order_id" value={order.id} />

                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <p className="font-semibold text-stone-900">{order.customer_name}</p>
                      <p className="mt-1 text-sm text-stone-600">
                        {order.customer_phone} · {order.scoop_name}
                      </p>
                      <p className="mt-1 text-xs text-stone-500">
                        Ordered {formatDate(order.ordered_at)} · {order.gift_count} gifts
                      </p>
                      <p className="mt-2 text-sm text-stone-600">{order.products_summary}</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <StatusPill
                        tone={
                          order.delivery_status === "delivered"
                            ? "success"
                            : order.delivery_status === "cancelled"
                              ? "danger"
                              : order.delivery_status === "delivering"
                                ? "warning"
                                : "neutral"
                        }
                        value={order.delivery_status}
                      />
                      <StatusPill
                        tone={
                          order.payment_status === "paid"
                            ? "success"
                            : order.payment_status === "partial"
                              ? "warning"
                              : "neutral"
                        }
                        value={order.payment_status}
                      />
                    </div>
                  </div>

                    <div className="mt-4 grid gap-3 rounded-[1.2rem] border border-stone-200 bg-white p-4 md:grid-cols-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
                        Scoop revenue
                      </p>
                      <p className="mt-2 font-semibold text-stone-900">
                        {formatCurrency(order.scoop_price)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
                        Gift cost
                      </p>
                      <p className="mt-2 font-semibold text-stone-900">
                        {formatCurrency(order.product_cost)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
                        Total expense
                      </p>
                      <p className="mt-2 font-semibold text-stone-900">
                        {formatCurrency(order.total_expense)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
                        Order contribution profit
                      </p>
                      <p className="mt-2 font-semibold text-stone-900">
                        {formatCurrency(order.net_profit)}
                      </p>
                    </div>
                  </div>

                  {order.delivery_cost === null || order.packaging_cost === null ? (
                    <div className="mt-4 rounded-[1.1rem] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                      Profit is estimated because delivery or packaging cost is missing.
                    </div>
                  ) : null}

                  <div className="mt-4 grid gap-4 md:grid-cols-5">
                    <label className="block">
                      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
                        Delivery
                      </span>
                      <select
                        name="delivery_status"
                        defaultValue={order.delivery_status}
                        className="w-full rounded-[1.1rem] border border-stone-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-stone-950"
                      >
                        {orderStatuses.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
                        Payment
                      </span>
                      <select
                        name="payment_status"
                        defaultValue={order.payment_status}
                        className="w-full rounded-[1.1rem] border border-stone-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-stone-950"
                      >
                        {paymentStatuses.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
                        Delivery cost
                      </span>
                      <input
                        type="number"
                        name="delivery_cost"
                        min="0"
                        step="0.01"
                        defaultValue={order.delivery_cost ?? ""}
                        placeholder="Leave empty for now"
                        className="w-full rounded-[1.1rem] border border-stone-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-stone-950"
                      />
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
                        Packaging cost
                      </span>
                      <input
                        type="number"
                        name="packaging_cost"
                        min="0"
                        step="0.01"
                        defaultValue={order.packaging_cost ?? ""}
                        placeholder="Leave empty for now"
                        className="w-full rounded-[1.1rem] border border-stone-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-stone-950"
                      />
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
                        Delivery date
                      </span>
                      <input
                        type="date"
                        name="delivery_date"
                        defaultValue={order.delivery_date ?? ""}
                        className="w-full rounded-[1.1rem] border border-stone-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-stone-950"
                      />
                    </label>
                  </div>

                  <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <p className="text-xs text-stone-500">{order.customer_address}</p>
                    <button
                      type="submit"
                      className="inline-flex items-center rounded-full border border-stone-950 px-4 py-2 text-sm font-semibold text-stone-950 transition hover:bg-stone-950 hover:text-stone-50"
                    >
                      Update order
                    </button>
                  </div>
                </form>
              ))
            ) : (
              <p className="text-sm text-stone-500">
                Orders will appear here after you save the first mystery scoop sale.
              </p>
            )}
          </div>
        </Surface>
      </section>
    </AppShell>
  );
}
