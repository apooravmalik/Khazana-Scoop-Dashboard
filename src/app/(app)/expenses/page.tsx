import { createExpenseAction } from "@/app/actions";
import { AppShell } from "@/components/app-shell";
import { StatCard } from "@/components/stat-card";
import { SubmitButton } from "@/components/submit-button";
import { Surface } from "@/components/surface";
import {
  manualExpenseCategories,
  manualExpenseCategoryLabels,
} from "@/lib/constants";
import { getExpenseInsights } from "@/lib/data";
import { formatCurrency, formatDate } from "@/lib/format";

type ExpensesPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function formatError(error: string) {
  return error.replaceAll("-", " ");
}

export default async function ExpensesPage({ searchParams }: ExpensesPageProps) {
  const params = await searchParams;
  const insights = await getExpenseInsights();

  return (
    <AppShell
      title="Expenses and business profit"
      description="Log manual expenses here, keep cash in and cash out separate, and see how much order contribution profit remains after business expenses."
    >
      {typeof params.error === "string" ? (
        <div className="rounded-[1.25rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {formatError(params.error)}
        </div>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <Surface
          title="Add business expense"
          description="Use this form for inventory purchase money, Meta ads, packaging purchases, and any extra misc business spending."
        >
          <form action={createExpenseAction} className="grid gap-4">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-stone-700">
                Expense date
              </span>
              <input
                type="date"
                name="spent_at"
                className="w-full rounded-[1.25rem] border border-stone-300 bg-stone-50 px-4 py-3 text-sm outline-none transition focus:border-stone-950"
                required
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-stone-700">
                Category
              </span>
              <select
                name="category"
                className="w-full rounded-[1.25rem] border border-stone-300 bg-stone-50 px-4 py-3 text-sm outline-none transition focus:border-stone-950"
                required
              >
                <option value="">Select a category</option>
                {manualExpenseCategories.map((category) => (
                  <option key={category} value={category}>
                    {manualExpenseCategoryLabels[category]}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-stone-700">
                Amount
              </span>
              <input
                type="number"
                name="amount"
                min="0"
                step="0.01"
                className="w-full rounded-[1.25rem] border border-stone-300 bg-stone-50 px-4 py-3 text-sm outline-none transition focus:border-stone-950"
                placeholder="0"
                required
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-stone-700">
                Note
              </span>
              <textarea
                name="description"
                rows={4}
                className="w-full rounded-[1.25rem] border border-stone-300 bg-stone-50 px-4 py-3 text-sm outline-none transition focus:border-stone-950"
                placeholder="Example: New bracelet refill from supplier"
                required
              />
            </label>

            <div className="rounded-[1.25rem] border border-stone-200 bg-stone-50/70 px-4 py-4 text-sm leading-6 text-stone-600">
              Stock quantity is updated on the Stock page. Money spent on that refill should also
              be logged here as <span className="font-semibold text-stone-900">Inventory Purchase</span>.
            </div>

            <div>
              <SubmitButton
                pendingLabel="Saving expense..."
                className="inline-flex items-center rounded-full bg-stone-950 px-5 py-3 text-sm font-semibold text-stone-50 transition hover:bg-stone-800"
              >
                Save expense
              </SubmitButton>
            </div>
          </form>
        </Surface>

        <Surface
          title="Cash flow summary"
          description="Paid orders count as cash in. Manual expense entries count as cash out."
        >
          <div className="grid gap-4 md:grid-cols-2">
            <StatCard
              label="Cash in"
              value={formatCurrency(insights.cashIn)}
              note="Only paid scoop orders are included."
              accent="bg-emerald-500"
            />
            <StatCard
              label="Cash out"
              value={formatCurrency(insights.cashOut)}
              note="All manual business expenses saved on this page."
              accent="bg-rose-500"
            />
            <StatCard
              label="Cash left"
              value={formatCurrency(insights.cashLeft)}
              note="Paid order cash in minus manual cash out."
              accent={insights.cashLeft >= 0 ? "bg-sky-500" : "bg-rose-500"}
            />
            <StatCard
              label="Pending cash"
              value={formatCurrency(insights.pendingCash)}
              note="Unpaid and partial orders stay here until fully paid."
              accent="bg-amber-500"
            />
          </div>
        </Surface>
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <Surface
          title="Order costs"
          description="These numbers come from paid orders only."
        >
          <div className="space-y-4">
            {[
              { label: "Gross sales", value: insights.grossSales },
              { label: "Gift cost", value: insights.totalProductCost },
              { label: "Delivery cost", value: insights.totalDeliveryCost },
              { label: "Packaging cost", value: insights.totalPackagingCost },
              {
                label: "Order contribution profit",
                value: insights.orderContributionProfit,
              },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between rounded-[1.2rem] border border-stone-200 bg-stone-50/70 px-4 py-3 text-sm"
              >
                <span className="text-stone-600">{item.label}</span>
                <span className="font-semibold text-stone-900">
                  {formatCurrency(item.value)}
                </span>
              </div>
            ))}
          </div>
        </Surface>

        <Surface
          title="Business expenses"
          description="Manual expenses are tracked separately from order-level delivery and packaging costs."
        >
          <div className="space-y-4">
            {insights.breakdown.map((item) => (
              <div key={item.category}>
                <div className="mb-2 flex items-center justify-between text-sm text-stone-700">
                  <span>{item.category}</span>
                  <span className="font-semibold">{formatCurrency(item.total)}</span>
                </div>
                <div className="h-2.5 rounded-full bg-stone-100">
                  <div
                    className="h-2.5 rounded-full bg-amber-500"
                    style={{
                      width: `${Math.max(
                        10,
                        (item.total / (insights.breakdown[0]?.total || 1)) * 100,
                      )}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-[1.25rem] border border-stone-200 bg-stone-50/70 p-4 text-sm leading-6 text-stone-600">
            Top expense right now:{" "}
            <span className="font-semibold text-stone-900">
              {insights.topExpenseCategory}
            </span>
          </div>
        </Surface>

        <Surface
          title="Final business profit"
          description="This shows what remains after order contribution profit and manual business expenses are both accounted for."
        >
          <div className="grid gap-4">
            <StatCard
              label="Inventory purchases"
              value={formatCurrency(insights.inventoryPurchases)}
              note="Used for cash out and inventory buying history."
              accent="bg-stone-950"
            />
            <StatCard
              label="Inventory left value"
              value={formatCurrency(insights.inventoryLeftValue)}
              note="Current stock value using the latest saved item costs."
              accent="bg-emerald-500"
            />
            <StatCard
              label="Final business profit"
              value={formatCurrency(insights.finalBusinessProfit)}
              note="Order contribution profit minus ads, packaging purchases, and misc."
              accent={insights.finalBusinessProfit >= 0 ? "bg-sky-500" : "bg-rose-500"}
            />
          </div>
        </Surface>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <Surface
          title="Recent expenses"
          description="Latest manual expense entries in the order they were logged."
        >
          <div className="space-y-3">
            {insights.recentExpenses.length > 0 ? (
              insights.recentExpenses.map((expense) => (
                <div
                  key={expense.id}
                  className="rounded-[1.25rem] border border-stone-200 bg-stone-50/70 px-4 py-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-stone-900">{expense.description}</p>
                      <p className="mt-1 text-sm text-stone-600">
                        {manualExpenseCategoryLabels[
                          expense.category as keyof typeof manualExpenseCategoryLabels
                        ] ?? expense.category}
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-rose-700">
                      {formatCurrency(expense.amount)}
                    </p>
                  </div>
                  <p className="mt-2 text-xs text-stone-500">{formatDate(expense.spent_at)}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-stone-500">
                No manual expenses recorded yet.
              </p>
            )}
          </div>
        </Surface>

        <Surface
          title="Recent order profit snapshots"
          description="Profit remains order-level here and updates when delivery or packaging cost is filled in."
        >
          <div className="space-y-3">
            {insights.recentOrders.length > 0 ? (
              insights.recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="rounded-[1.25rem] border border-stone-200 bg-stone-50/70 px-4 py-4"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-semibold text-stone-900">
                        {order.customer_name} · {order.scoop_name}
                      </p>
                      <p className="mt-1 text-sm text-stone-600">{order.products_summary}</p>
                      <p className="mt-1 text-xs text-stone-500">
                        {formatDate(order.ordered_at)}
                      </p>
                    </div>

                    <div className="text-right text-sm">
                      <p className="font-semibold text-stone-900">
                        Contribution profit {formatCurrency(order.net_profit)}
                      </p>
                      <p className="mt-1 text-stone-600">
                        Gift {formatCurrency(order.product_cost)}
                      </p>
                      <p className="mt-1 text-stone-600">
                        Delivery {formatCurrency(order.delivery_cost ?? 0)} · Packaging{" "}
                        {formatCurrency(order.packaging_cost ?? 0)}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-stone-500">No order profitability data yet.</p>
            )}
          </div>
        </Surface>
      </section>
    </AppShell>
  );
}
