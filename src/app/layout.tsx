import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Khaza-Scoop Dashboard",
  description: "Operations dashboard for orders, stock, expenses, and cash flow.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased" data-scroll-behavior="smooth">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
