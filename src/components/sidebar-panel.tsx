"use client";

import { useState } from "react";

import { SidebarNav } from "./sidebar-nav";

type SidebarPanelProps = {
  email: string;
};

export function SidebarPanel({ email }: SidebarPanelProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`hidden shrink-0 flex-col justify-between rounded-[2rem] border border-white/70 bg-white/70 p-4 shadow-[0_25px_80px_rgba(79,54,32,0.08)] backdrop-blur transition-all duration-200 lg:flex ${
        collapsed ? "w-24" : "w-72 p-6"
      }`}
    >
      <div className="space-y-6">
        <div className={`flex ${collapsed ? "justify-center" : "justify-end"}`}>
          <button
            type="button"
            onClick={() => setCollapsed((current) => !current)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-stone-300 bg-white/80 text-sm font-semibold text-stone-700 transition hover:border-stone-900 hover:text-stone-950"
            aria-expanded={!collapsed}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? ">" : "<"}
          </button>
        </div>

        <div className={`space-y-3 ${collapsed ? "text-center" : ""}`}>
          <div className="inline-flex rounded-full border border-stone-300 bg-stone-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-stone-600">
            {collapsed ? "KS" : "Khaza-Scoop"}
          </div>

          {collapsed ? null : (
            <div>
              <h1 className="font-serif text-3xl leading-none tracking-tight text-stone-950">
                Mystery scoop business cockpit
              </h1>
              <p className="mt-3 text-sm leading-6 text-stone-600">
                Local-first operations for orders, inventory, expenses, and cash
                visibility.
              </p>
            </div>
          )}
        </div>

        <SidebarNav compact={collapsed} />
      </div>

      {collapsed ? (
        <div className="rounded-[1.25rem] border border-amber-200/70 bg-amber-50/80 px-2 py-3 text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-700">
          Local
        </div>
      ) : (
        <div className="rounded-[1.5rem] border border-amber-200/70 bg-amber-50/80 p-4 text-sm text-stone-700">
          <p className="font-semibold text-stone-900">Local owner access</p>
          <p className="mt-2 leading-6">
            Signed in credentials are local to this app instance. Default email:
          </p>
          <p className="mt-2 rounded-xl bg-white/80 px-3 py-2 font-mono text-xs text-stone-800">
            {email}
          </p>
        </div>
      )}
    </aside>
  );
}
