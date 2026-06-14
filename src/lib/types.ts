export type Product = {
  id: number;
  name: string;
  category: string;
  stock_quantity: number;
  unit_cost: number;
  created_at: string;
  updated_at: string;
};

export type ScoopType = {
  id: number;
  name: string;
  price: number;
  sort_order: number;
};

export type StockMovement = {
  id: number;
  product_name: string;
  quantity_delta: number;
  reason: string;
  note: string | null;
  unit_cost_snapshot: number | null;
  movement_value: number | null;
  created_at: string;
};

export type OrderItem = {
  id: number;
  order_id: number;
  product_id: number;
  product_name_snapshot: string;
  quantity: number;
  unit_cost_snapshot: number;
  line_cost: number;
};

export type OrderRow = {
  id: number;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  scoop_name: string;
  scoop_price: number;
  gift_count: number;
  products_summary: string;
  product_cost: number;
  delivery_cost: number | null;
  packaging_cost: number | null;
  total_expense: number;
  net_profit: number;
  delivery_status: string;
  payment_status: string;
  ordered_at: string;
  delivery_date: string | null;
  created_at: string;
};

export type ExpenseBreakdown = {
  category: string;
  total: number;
};

export type Expense = {
  id: number;
  category: string;
  description: string;
  amount: number;
  spent_at: string;
  created_at: string;
};

export type DashboardMetrics = {
  cashIn: number;
  cashOut: number;
  cashLeft: number;
  pendingCash: number;
  grossSales: number;
  totalOrders: number;
  paidOrders: number;
  unpaidOrders: number;
  totalProductCost: number;
  totalDeliveryCost: number;
  totalPackagingCost: number;
  orderContributionProfit: number;
  finalBusinessProfit: number;
  inventoryPurchases: number;
  metaAdsSpend: number;
  packagingPurchases: number;
  miscExpenses: number;
  inventoryUsed: number;
  inventoryLeftValue: number;
  lowStockCount: number;
  pendingOrders: number;
  deliveringOrders: number;
};

export type DashboardData = {
  metrics: DashboardMetrics;
  lowStockItems: Product[];
  recentOrders: OrderRow[];
  recentExpenses: Expense[];
  recentStockRefills: StockMovement[];
  expenseBreakdown: ExpenseBreakdown[];
};

export type ExpenseInsights = {
  cashIn: number;
  cashOut: number;
  cashLeft: number;
  pendingCash: number;
  grossSales: number;
  totalProductCost: number;
  totalDeliveryCost: number;
  totalPackagingCost: number;
  orderContributionProfit: number;
  finalBusinessProfit: number;
  inventoryPurchases: number;
  metaAdsSpend: number;
  packagingPurchases: number;
  miscExpenses: number;
  inventoryLeftValue: number;
  topExpenseCategory: string;
  breakdown: ExpenseBreakdown[];
  recentExpenses: Expense[];
  recentOrders: OrderRow[];
  recentStockRefills: StockMovement[];
};
