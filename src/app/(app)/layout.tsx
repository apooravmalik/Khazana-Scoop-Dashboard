import type { ReactNode } from "react";

import { requireAuth } from "@/lib/auth";

export default async function ProtectedLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  await requireAuth();

  return children;
}
