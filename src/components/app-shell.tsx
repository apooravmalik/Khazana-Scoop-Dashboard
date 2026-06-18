import type { ReactNode } from "react";

import { logoutAction } from "@/app/actions";
import { getDefaultCredentials } from "@/lib/auth";

import { SubmitButton } from "./submit-button";
import { SidebarPanel } from "./sidebar-panel";

type AppShellProps = {
  children: ReactNode;
  description: string;
  title: string;
};

export function AppShell({ children, description, title }: AppShellProps) {
  const credentials = getDefaultCredentials();

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(210,176,107,0.12),_transparent_32%),linear-gradient(180deg,_#f8f4ec_0%,_#f2ede4_42%,_#ebe4d9_100%)] text-stone-900">
      <div className="mx-auto flex min-h-screen max-w-7xl gap-6 px-4 py-5 sm:px-6 lg:px-8">
        <SidebarPanel email={credentials.email} />

        <main className="min-w-0 flex-1">
          <div className="rounded-[2rem] border border-white/70 bg-white/80 shadow-[0_25px_80px_rgba(79,54,32,0.08)] backdrop-blur">
            <header className="border-b border-stone-200/80 px-5 py-5 sm:px-8">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">
                    Business dashboard
                  </p>
                  <h2 className="mt-2 font-serif text-3xl tracking-tight text-stone-950">
                    {title}
                  </h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-600">
                    {description}
                  </p>
                </div>

                <form action={logoutAction}>
                  <SubmitButton
                    pendingLabel="Logging out..."
                    className="inline-flex items-center rounded-full border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-700 transition hover:border-stone-900 hover:text-stone-950"
                  >
                    Logout
                  </SubmitButton>
                </form>
              </div>
            </header>

            <div className="space-y-6 px-5 py-5 sm:px-8 sm:py-8">{children}</div>
          </div>
        </main>
      </div>
    </div>
  );
}
