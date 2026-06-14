"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { navItems } from "@/lib/constants";

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="space-y-2">
      {navItems.map((item) => {
        const active = pathname === item.href;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-medium transition ${
              active
                ? "bg-stone-950 text-stone-50 shadow-lg"
                : "text-stone-600 hover:bg-stone-100 hover:text-stone-950"
            }`}
          >
            <span>{item.label}</span>
            <span
              className={`text-[10px] uppercase tracking-[0.24em] ${
                active ? "text-stone-300" : "text-stone-400"
              }`}
            >
              Open
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
