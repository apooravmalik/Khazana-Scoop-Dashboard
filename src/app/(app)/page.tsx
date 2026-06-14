import { AppShell } from "@/components/app-shell";
import { StatCard } from "@/components/stat-card";
import { StatusPill } from "@/components/status-pill";
import { Surface } from "@/components/surface";
import { manualExpenseCategoryLabels } from "@/lib/constants";
import { getDashboardData } from "@/lib/data";
import { formatCount, formatCurrency, formatDate } from "@/lib/format";

export default async function DashboardPage() {
  const {
    expenseBreakdown,
    lowStockItems,
    metrics,
    recentExpenses,
    recentOrders,
    recentStockRefills,
  } = await getDashboardData();

  return (
    <AppShell
      title="Mystery scoop dashboard"
      description="Track paid cash in, manual cash out, scoop order contribution profit, and current inventory from one simple business view."
    >
      <section className="space-y-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">
            Cash Flow
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Cash in"
            value={formatCurrency(metrics.cashIn)}
            note="Only paid scoop orders are counted here."
            accent="bg-emerald-500"
          />
          <StatCard
            label="Cash out"
            value={formatCurrency(metrics.cashOut)}
            note="Manual expenses only: inventory purchase, ads, packaging, and misc."
            accent="bg-rose-500"
          />
          <StatCard
            label="Cash left"
            value={formatCurrency(metrics.cashLeft)}
            note="Paid order cash in minus manual business cash out."
            accent={metrics.cashLeft >= 0 ? "bg-sky-500" : "bg-rose-500"}
          />
          <StatCard
            label="Pending cash"
            value={formatCurrency(metrics.pendingCash)}
            note="Orders marked unpaid or partial still waiting to be collected."
            accent="bg-amber-500"
          />
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">
            Profit
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Gross sales"
            value={formatCurrency(metrics.grossSales)}
            note="Paid scoop order value before order costs."
            accent="bg-emerald-500"
          />
          <StatCard
            label="Product cost used"
            value={formatCurrency(metrics.totalProductCost)}
            note="Gift cost from paid orders only."
            accent="bg-amber-500"
          />
          <StatCard
            label="Order contribution profit"
            value={formatCurrency(metrics.orderContributionProfit)}
            note="Paid scoop sales minus gift, delivery, and packaging costs."
            accent={metrics.orderContributionProfit >= 0 ? "bg-stone-950" : "bg-rose-500"}
          />
          <StatCard
            label="Final business profit"
            value={formatCurrency(metrics.finalBusinessProfit)}
            note="Order contribution profit after ads, packaging purchases, and misc."
            accent={metrics.finalBusinessProfit >= 0 ? "bg-sky-500" : "bg-rose-500"}
          />
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">
            Inventory
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Inventory purchases"
            value={formatCurrency(metrics.inventoryPurchases)}
            note="Manual inventory purchase expenses logged on the Expenses page."
            accent="bg-stone-950"
          />
          <StatCard
            label="Inventory used"
            value={formatCurrency(metrics.inventoryUsed)}
            note="Gift cost already consumed by saved orders."
            accent="bg-amber-500"
          />
          <StatCard
            label="Inventory left value"
            value={formatCurrency(metrics.inventoryLeftValue)}
            note="Current stock quantity multiplied by the latest item cost."
            accent="bg-emerald-500"
          />
          <StatCard
            label="Low stock items"
            value={formatCount(metrics.lowStockCount)}
            note="Items at or below the low stock alert threshold."
            accent="bg-rose-500"
          />
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Surface
          title="Business expense split"
          description="A simple category view of manual cash out logged on the Expenses page."
        >
          <div className="space-y-4">
            {expenseBreakdown.map((item) => {
              const max = expenseBreakdown[0]?.total || 1;
              const width = `${Math.max(10, (item.total / max) * 100)}%`;

              return (
                <div key={item.category}>
                  <div className="mb-2 flex items-center justify-between text-sm text-stone-700">
                    <span>{item.category}</span>
                    <span className="font-semibold">{formatCurrency(item.total)}</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-stone-100">
                    <div className="h-2.5 rounded-full bg-stone-950" style={{ width }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Surface>

        <Surface
          title="Operational signals"
          description="Use these signals to stay ahead of fulfilment, payment collection, and missing cost updates."
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-[1.5rem] border border-sky-200 bg-sky-50/70 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-700">
                Pending orders
              </p>
              <p className="mt-4 font-serif text-4xl text-stone-950">
                {formatCount(metrics.pendingOrders)}
              </p>
              <p className="mt-2 text-sm leading-6 text-stone-600">
                Orders still waiting to move into delivery.
              </p>
            </div>
            <div className="rounded-[1.5rem] border border-emerald-200 bg-emerald-50/70 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">
                Delivering now
              </p>
              <p className="mt-4 font-serif text-4xl text-stone-950">
                {formatCount(metrics.deliveringOrders)}
              </p>
              <p className="mt-2 text-sm leading-6 text-stone-600">
                Orders currently on the way to customers.
              </p>
            </div>
            <div className="rounded-[1.5rem] border border-amber-200 bg-amber-50/70 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-700">
                Paid orders
              </p>
              <p className="mt-4 font-serif text-4xl text-stone-950">
                {formatCount(metrics.paidOrders)}
              </p>
              <p className="mt-2 text-sm leading-6 text-stone-600">
                These orders are included in cash and profit summaries.
              </p>
            </div>
            <div className="rounded-[1.5rem] border border-stone-200 bg-stone-50/70 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">
                Awaiting payment
              </p>
              <p className="mt-4 font-serif text-4xl text-stone-950">
                {formatCount(metrics.unpaidOrders)}
              </p>
              <p className="mt-2 text-sm leading-6 text-stone-600">
                Unpaid and partial orders remain in pending cash until fully paid.
              </p>
            </div>
          </div>
        </Surface>
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <Surface
          title="Low stock watchlist"
          description="These items are closest to running out and may block future scoop fulfilment."
        >
          <div className="space-y-3">
            {lowStockItems.length > 0 ? (
              lowStockItems.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col gap-3 rounded-[1.25rem] border border-stone-200 bg-stone-50/70 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-semibold text-stone-900">{item.name}</p>
                    <p className="text-sm text-stone-500">{item.category}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusPill
                      tone={item.stock_quantity === 0 ? "danger" : "warning"}
                      value={`${item.stock_quantity} left`}
                    />
                    <span className="text-sm font-semibold text-stone-700">
                      Cost {formatCurrency(item.unit_cost)}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-stone-500">
                No items are below the low stock alert threshold right now.
              </p>
            )}
          </div>
        </Surface>

        <Surface
          title="Recent expenses"
          description="Latest manual cash-out entries from inventory purchase, ads, packaging, and misc."
        >
          <div className="space-y-3">
            {recentExpenses.length > 0 ? (
              recentExpenses.map((expense) => (
                <div
                  key={expense.id}
                  className="rounded-[1.25rem] border border-stone-200 bg-stone-50/70 px-4 py-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-stone-900">{expense.description}</p>
                    <p className="text-sm font-semibold text-rose-700">
                      {formatCurrency(expense.amount)}
                    </p>
                  </div>
                  <p className="mt-2 text-sm text-stone-600">
                    {manualExpenseCategoryLabels[
                      expense.category as keyof typeof manualExpenseCategoryLabels
                    ] ?? expense.category}
                  </p>
                  <p className="mt-1 text-xs text-stone-500">
                    {formatDate(expense.spent_at)}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-stone-500">
                Manual expenses will appear here after the first entry on the Expenses page.
              </p>
            )}
          </div>
        </Surface>

        <Surface
          title="Recent stock refills"
          description="Latest inventory additions and manual stock changes. Quantity updates here do not change cash out."
        >
          <div className="space-y-3">
            {recentStockRefills.length > 0 ? (
              recentStockRefills.map((movement) => (
                <div
                  key={movement.id}
                  className="rounded-[1.25rem] border border-stone-200 bg-stone-50/70 px-4 py-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-stone-900">{movement.product_name}</p>
                    <p className="text-sm font-semibold text-emerald-700">
                      +{movement.quantity_delta}
                    </p>
                  </div>
                  <p className="mt-2 text-sm text-stone-600">{movement.reason}</p>
                  <p className="mt-1 text-xs text-stone-500">
                    {formatDate(movement.created_at)} ·{" "}
                    {movement.movement_value !== null
                      ? formatCurrency(movement.movement_value)
                      : "No value snapshot"}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-stone-500">
                Stock refill activity will show up here after the next inventory addition.
              </p>
            )}
          </div>
        </Surface>
      </section>

      <Surface
        title="Recent scoop orders"
        description="Saved scoop revenue and contribution profit snapshots for the latest orders."
      >
        <div className="overflow-hidden rounded-[1.5rem] border border-stone-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-stone-200 text-left text-sm">
              <thead className="bg-stone-100/80">
                <tr>
                  {["Customer", "Scoop", "Gifts", "Revenue", "Contribution Profit", "Payment"].map(
                    (heading) => (
                      <th
                        key={heading}
                        className="px-4 py-3 font-semibold uppercase tracking-[0.2em] text-stone-500"
                      >
                        {heading}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 bg-white">
                {recentOrders.length > 0 ? (
                  recentOrders.map((order) => (
                    <tr key={order.id}>
                      <td className="px-4 py-4 font-medium text-stone-900">
                        {order.customer_name}
                      </td>
                      <td className="px-4 py-4 text-stone-600">{order.scoop_name}</td>
                      <td className="px-4 py-4 text-stone-600">{order.products_summary}</td>
                      <td className="px-4 py-4 text-stone-700">
                        {formatCurrency(order.scoop_price)}
                      </td>
                      <td className="px-4 py-4 text-stone-700">
                        {formatCurrency(order.net_profit)}
                      </td>
                      <td className="px-4 py-4">
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
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="px-4 py-6 text-stone-500" colSpan={6}>
                      No scoop orders recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Surface>
    </AppShell>
  );
}
