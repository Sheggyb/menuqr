export interface Restaurant {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  accent_color: string;
  quick_actions: string[];
  venue_type: "table_service" | "cafe" | "takeaway";
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

export interface TableRequest {
  id: string;
  restaurant_id: string;
  table_id: string;
  type: "item_request" | "refill" | "waiter" | "bill";
  item_id: string | null;
  item_name: string | null;
  note: string | null;
  status: "pending" | "seen" | "done";
  created_at: string;
  table?: TableRow;
}

export interface TableSession {
  id: string;
  table_id: string;
  restaurant_id: string;
  session_id: string;
  status: "pending" | "active" | "closed";
  created_at: string;
}

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
}
