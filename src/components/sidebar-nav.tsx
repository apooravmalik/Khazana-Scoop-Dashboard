"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { navItems } from "@/lib/constants";

type SidebarNavProps = {
  compact?: boolean;
};

function getShortLabel(label: string) {
  return label
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function SidebarNav({ compact = false }: SidebarNavProps) {
  const pathname = usePathname();

  return (
    <nav className="space-y-2">
      {navItems.map((item) => {
        const active = pathname === item.href;

        return (
          <Link
            key={item.href}
            href={item.href}
            title={compact ? item.label : undefined}
            className={`flex rounded-2xl px-4 py-3 text-sm font-medium transition ${
              active
                ? "bg-stone-950 text-stone-50 shadow-lg"
                : "text-stone-600 hover:bg-stone-100 hover:text-stone-950"
            } ${
              compact ? "items-center justify-center px-2" : "items-center justify-between"
            }`}
          >
            {compact ? (
              <span
                className={`inline-flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold uppercase tracking-[0.2em] ${
                  active ? "bg-stone-800 text-stone-50" : "bg-stone-100 text-stone-600"
                }`}
              >
                {getShortLabel(item.label)}
              </span>
            ) : (
              <>
                <span>{item.label}</span>
                <span
                  className={`text-[10px] uppercase tracking-[0.24em] ${
                    active ? "text-stone-300" : "text-stone-400"
                  }`}
                >
                  Open
                </span>
              </>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
