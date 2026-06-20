export const orderStatuses = [
  "pending",
  "delivering",
  "delivered",
  "cancelled",
] as const;

export const paymentStatuses = ["unpaid", "partial", "paid"] as const;

export const defaultScoopTypes = [
  { name: "Small", price: 0, sort_order: 1 },
  { name: "Medium", price: 0, sort_order: 2 },
  { name: "Large", price: 0, sort_order: 3 },
  { name: "Custom", price: 0, sort_order: 4 },
  { name: "Small Custom", price: 0, sort_order: 5 },
  { name: "Medium Custom", price: 0, sort_order: 6 },
  { name: "Large Custom", price: 0, sort_order: 7 },
] as const;

export const lowStockThreshold = 5;

export const manualExpenseCategories = [
  "INVENTORY_PURCHASE",
  "META_ADS",
  "PACKAGING_PURCHASE",
  "MISC",
] as const;

export const manualExpenseCategoryLabels = {
  INVENTORY_PURCHASE: "Inventory Purchase",
  META_ADS: "Meta Ads",
  PACKAGING_PURCHASE: "Packaging Purchase",
  MISC: "Misc",
} as const;

export const navItems = [
  { href: "/", label: "Dashboard" },
  { href: "/stock", label: "Stock" },
  { href: "/orders", label: "Orders" },
  { href: "/expenses", label: "Expenses" },
  { href: "/query-tester", label: "Query Tester" },
] as const;
