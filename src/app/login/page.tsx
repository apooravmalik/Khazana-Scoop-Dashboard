import { redirect } from "next/navigation";

import { loginAction } from "@/app/actions";
import { SubmitButton } from "@/components/submit-button";
import { getDefaultCredentials, isAuthenticated } from "@/lib/auth";

type LoginPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  if (await isAuthenticated()) {
    redirect("/");
  }

  const params = await searchParams;
  const credentials = getDefaultCredentials();
  const showError = params.error === "invalid";

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(210,176,107,0.18),_transparent_30%),linear-gradient(180deg,_#f8f4ec_0%,_#eee5d8_100%)] px-4 py-8 text-stone-900 sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-[2rem] border border-white/70 bg-white/75 p-8 shadow-[0_25px_80px_rgba(79,54,32,0.08)] backdrop-blur sm:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-stone-500">
            Khaza-Scoop
          </p>
          <h1 className="mt-4 max-w-xl font-serif text-5xl leading-none tracking-tight text-stone-950 sm:text-6xl">
            See revenue, stock health, and profit in one place.
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-8 text-stone-600">
            This dashboard is built for the Khaza-Scoop Instagram shopping
            workflow: capture orders, adjust stock, log expenses and
            investments, then understand profit and cash position without manual
            calculations.
          </p>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {[
              "Revenue and expense KPIs",
              "Stock-aware order tracking",
              "Weekly and monthly investment visibility",
            ].map((item) => (
              <div
                key={item}
                className="rounded-[1.5rem] border border-stone-200 bg-stone-50/80 p-4 text-sm leading-6 text-stone-700"
              >
                {item}
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[2rem] border border-stone-200 bg-white p-8 shadow-[0_25px_80px_rgba(79,54,32,0.08)] sm:p-10">
          <div className="mb-8">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-stone-500">
              Owner login
            </p>
            <h2 className="mt-3 font-serif text-3xl tracking-tight text-stone-950">
              Enter the dashboard
            </h2>
            <p className="mt-3 text-sm leading-6 text-stone-600">
              Authentication is local and intentionally lightweight for this
              owner-facing setup.
            </p>
          </div>

          {showError ? (
            <div className="mb-6 rounded-[1.25rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              The email or password did not match the configured local
              credentials.
            </div>
          ) : null}

          <form action={loginAction} className="space-y-4">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-stone-700">
                Email
              </span>
              <input
                type="email"
                name="email"
                defaultValue={credentials.email}
                className="w-full rounded-[1.25rem] border border-stone-300 bg-stone-50 px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-stone-950"
                required
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-stone-700">
                Password
              </span>
              <input
                type="password"
                name="password"
                defaultValue={credentials.password}
                className="w-full rounded-[1.25rem] border border-stone-300 bg-stone-50 px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-stone-950"
                required
              />
            </label>

            <SubmitButton
              pendingLabel="Logging in..."
              className="inline-flex w-full items-center justify-center rounded-full bg-stone-950 px-5 py-3 text-sm font-semibold text-stone-50 transition hover:bg-stone-800"
            >
              Login to dashboard
            </SubmitButton>
          </form>

          <div className="mt-6 rounded-[1.25rem] border border-amber-200 bg-amber-50 px-4 py-4 text-sm leading-6 text-stone-700">
            <p className="font-semibold text-stone-900">Default local credentials</p>
            <p className="mt-2 font-mono text-xs">{credentials.email}</p>
            <p className="mt-1 font-mono text-xs">{credentials.password}</p>
            <p className="mt-3 text-xs text-stone-600">
              Change these values by creating a local `.env.local` from
              `.env.example`.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
