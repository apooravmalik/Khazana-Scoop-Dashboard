import Link from "next/link";

import { deleteOrderAction, updateOrderAction } from "@/app/actions";
import { AppShell } from "@/components/app-shell";
import { OrderBuilder } from "@/components/order-builder";
import { SubmitButton } from "@/components/submit-button";
import { Surface } from "@/components/surface";
import { getOrderById, getProducts, getScoopTypes } from "@/lib/data";

type EditOrderPageProps = {
  params: Promise<{ orderId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function formatError(error: string) {
  return error.replaceAll("-", " ");
}

export default async function EditOrderPage({
  params,
  searchParams,
}: EditOrderPageProps) {
  const [{ orderId }, query] = await Promise.all([params, searchParams]);
  const numericOrderId = Number(orderId);
  const [order, products, scoopTypes] = await Promise.all([
    getOrderById(numericOrderId),
    getProducts(),
    getScoopTypes(),
  ]);

  if (!order) {
    return (
      <AppShell
        title="Edit order"
        description="The order you are looking for could not be found."
      >
        <Surface title="Order missing" description="Go back to the main order tracker.">
          <Link
            href="/orders"
            className="inline-flex rounded-full border border-stone-950 px-4 py-2 font-semibold text-stone-950 transition hover:bg-stone-950 hover:text-stone-50"
          >
            Back to orders
          </Link>
        </Surface>
      </AppShell>
    );
  }

  return (
    <AppShell
      title={`Edit order #${order.id}`}
      description="Update customer details, scoop type, selected gifts, and optional delivery or packaging costs from one place."
    >
      {typeof query.error === "string" ? (
        <div className="rounded-[1.25rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {formatError(query.error)}
        </div>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Surface
          title="Edit mystery scoop order"
          description="Changing the gift checklist here will also rebalance stock quantities automatically."
        >
          <form action={updateOrderAction} className="grid gap-4">
            <input type="hidden" name="order_id" value={order.id} />
            <OrderBuilder
              products={products}
              scoopTypes={scoopTypes}
              submitLabel="Save order changes"
              initialOrder={{
                customer_name: order.customer_name,
                customer_phone: order.customer_phone,
                customer_address: order.customer_address,
                scoop_type_id: order.scoop_type_id,
                ordered_at: order.ordered_at,
                delivery_status: order.delivery_status,
                payment_status: order.payment_status,
                delivery_cost: order.delivery_cost,
                packaging_cost: order.packaging_cost,
                delivery_date: order.delivery_date,
                items: order.items.map((item) => ({
                  product_id: item.product_id,
                  quantity: item.quantity,
                })),
              }}
            />
          </form>
        </Surface>

        <Surface
          title="Danger zone"
          description="Deleting the order removes it from the dashboard and returns the selected gifts to inventory."
        >
          <form action={deleteOrderAction} className="space-y-4">
            <input type="hidden" name="order_id" value={order.id} />
            <div className="rounded-[1.25rem] border border-rose-200 bg-rose-50 px-4 py-4 text-sm leading-6 text-rose-800">
              Delete this only if the order was entered by mistake or should be fully removed
              from business reporting.
            </div>
            <SubmitButton
              pendingLabel="Deleting order..."
              className="inline-flex rounded-full border border-rose-300 px-4 py-2 font-semibold text-rose-700 transition hover:border-rose-600 hover:bg-rose-600 hover:text-white"
            >
              Delete order
            </SubmitButton>
          </form>

          <div className="mt-6">
            <Link
              href="/orders"
              className="inline-flex rounded-full border border-stone-300 px-4 py-2 font-semibold text-stone-700 transition hover:border-stone-950 hover:text-stone-950"
            >
              Back to orders
            </Link>
          </div>
        </Surface>
      </section>
    </AppShell>
  );
}
