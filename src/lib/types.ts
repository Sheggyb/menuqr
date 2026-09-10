export interface Restaurant {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  accent_color: string;
  quick_actions: string[];
  venue_type: "table_service" | "cafe" | "takeaway";
  currency: string; // NOT NULL in schema, default 'SEK'
  accepts_payments: boolean; // NOT NULL in schema, default true
  created_at: string;
}

export interface TableRow {
  id: string;
  restaurant_id: string;
  name: string;
  token: string;
  is_active: boolean;
}

export interface MenuCategory {
  id: string;
  restaurant_id: string;
  name: string;
  icon: string;
  sort_order: number;
}

export interface MenuItem {
  id: string;
  restaurant_id: string;
  category_id: string;
  name: string;
  description: string | null;
  price: number | null;
  image_url: string | null;
  is_available: boolean;
  sort_order: number;
}

export interface MenuItemOptionChoice {
  id: string;
  option_id: string;
  /** For allergen groups this holds an EU_ALLERGENS id, not display text. */
  label: string;
  price_delta: number;
  is_available: boolean;
  sort_order: number;
}

export type MenuItemOptionType = "choice" | "ingredients" | "allergens";

export interface MenuItemOption {
  id: string;
  restaurant_id: string;
  item_id: string;
  name: string;
  type: MenuItemOptionType;
  is_required: boolean;
  sort_order: number;
  choices: MenuItemOptionChoice[];
}

/** A chosen / removed / extra option, as stored in order_items.selected_options. */
export interface SelectedOption {
  id: string;
  label: string;
  price_delta?: number;
}

export interface OrderItem {
  id: string;
  request_id: string;
  item_id: string | null;
  /** Dish name as ordered — survives a later menu rename. */
  name_snapshot: string;
  quantity: number;
  /** Server-computed: menu price + chosen deltas. Never client-supplied. */
  unit_price: number | null;
  selected_options: {
    choices?: SelectedOption[];
    removed?: SelectedOption[];
    extra?: SelectedOption[];
  } | null;
  note: string | null;
  sort_order: number;
}

export interface TableRequest {
  id: string;
  restaurant_id: string;
  table_id: string;
  type: "item_request" | "refill" | "waiter" | "bill";
  item_id: string | null;
  /** Server-generated display string. Kept for search and for the pre-structured-orders fallback. */
  item_name: string | null;
  note: string | null;
  total_price: number | null;
  status: "pending" | "seen" | "done";
  /** Stripe seam. 'awaiting' rows are hidden from both boards. */
  payment_status?: "not_required" | "awaiting" | "paid" | "failed";
  seen_at?: string | null;
  done_at?: string | null;
  created_at: string;
  table?: TableRow;
  /** Present once structured orders land; absent on pre-migration rows. */
  order_items?: OrderItem[];
}

export interface TableSession {
  id: string;
  table_id: string;
  restaurant_id: string;
  session_id: string;
  status: "pending" | "active" | "closed";
  created_at: string;
}

