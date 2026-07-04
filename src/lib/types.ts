export type Product = {
  id: number;
  name: string;
  sku: string;
  slug: string;
  category: string;
  category_id: number | null;
  description: string | null;
  base_price: number;
  active: boolean;
  primary_image_url: string | null;
  available_colours: string[];
  sort_order: number;
  total_purchased_quantity: number;
  stock_quantity: number;
  unit_cost: number;
  created_at: string;
  updated_at: string;
};

export type Category = {
  id: number;
  name: string;
  slug: string;
  active: boolean;
  sort_order: number;
  created_at: string;
};

export type Collection = {
  id: number;
  name: string;
  slug: string;
  active: boolean;
  sort_order: number;
  created_at: string;
};

export type ProductImage = {
  id: number;
  product_id: number;
  url: string;
  alt_text: string | null;
  sort_order: number;
  created_at: string;
};

export type Discount = {
  id: number;
  target_type: "product" | "category" | "collection";
  target_id: number;
  amount: number;
  type: "fixed" | "percent";
  start_at: string | null;
  end_at: string | null;
  active: boolean;
  created_at: string;
};

export type CatalogProduct = Product & {
  category_record: Category | null;
  collections: Collection[];
  images: ProductImage[];
  active_discount: Discount | null;
  effective_price: number;
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
  change_kind: "purchase" | "correction" | "order" | "return" | "initial" | "unknown";
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

export type OrderDetail = OrderRow & {
  scoop_type_id: number | null;
  items: OrderItem[];
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
  recentChanges: StockMovement[];
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
  recentChanges: StockMovement[];
};
