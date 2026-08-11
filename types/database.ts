export type UserRole = 'owner' | 'manager' | 'seller' | 'delivery_agent';
export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'shipped' | 'delivered' | 'cancelled' | 'returned';
export type PaymentStatus = 'pending' | 'succeeded' | 'failed' | 'cancelled' | 'refunded';
export type PaymentMethod = 'cash_on_delivery' | 'mobile_money_manual' | 'online';
export type InventoryMovementType = 'sale' | 'restock' | 'adjustment' | 'return' | 'cancellation';
export type SubscriptionStatus = 'trialing' | 'active' | 'past_due' | 'canceled' | 'unpaid';

export interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  avatar_url?: string | null;
  created_at: string;
  updated_at: string;
}

export interface DeliveryZone {
  name: string;
  fee: number;
  estimated_hours?: number;
}

export interface Business {
  id: string;
  slug: string;
  name: string;
  logo_url?: string | null;
  description?: string | null;
  whatsapp_number: string;
  address?: string | null;
  city: string;
  delivery_zones: DeliveryZone[];
  currency: string;
  opening_hours: Record<string, string>;
  delivery_settings: {
    delivery_fee: number;
    free_delivery_above?: number | null;
  };
  payment_settings: {
    accept_cod: boolean;
    accept_online: boolean;
    mobile_money_number?: string;
  };
  created_at: string;
  updated_at: string;
}

export interface BusinessMember {
  id: string;
  business_id: string;
  user_id: string;
  role: UserRole;
  created_at: string;
}

export interface Category {
  id: string;
  business_id: string;
  name: string;
  slug: string;
  description?: string | null;
  created_at: string;
}

export interface Product {
  id: string;
  business_id: string;
  category_id?: string | null;
  name: string;
  description?: string | null;
  price: number;
  promotional_price?: number | null;
  image_url?: string | null;
  stock: number;
  low_stock_threshold: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductVariant {
  id: string;
  business_id: string;
  product_id: string;
  name: string;
  sku?: string | null;
  price_override?: number | null;
  stock: number;
  created_at: string;
}

export interface Customer {
  id: string;
  business_id: string;
  full_name: string;
  phone: string;
  email?: string | null;
  delivery_address?: string | null;
  total_orders: number;
  total_spent: number;
  internal_notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  business_id: string;
  customer_id?: string | null;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  delivery_address: string;
  delivery_zone?: string | null;
  subtotal: number;
  delivery_fee: number;
  total_amount: number;
  status: OrderStatus;
  payment_status: PaymentStatus;
  payment_method: PaymentMethod;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  business_id: string;
  order_id: string;
  product_id?: string | null;
  variant_id?: string | null;
  product_name: string;
  unit_price: number;
  quantity: number;
  total_price: number;
}

export interface Payment {
  id: string;
  business_id: string;
  order_id: string;
  provider: string;
  transaction_reference?: string | null;
  idempotency_key: string;
  amount: number;
  status: PaymentStatus;
  payment_method: PaymentMethod;
  provider_response?: Record<string, any> | null;
  metadata?: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}

export interface Delivery {
  id: string;
  business_id: string;
  order_id: string;
  delivery_agent_id?: string | null;
  status: string;
  tracking_notes?: string | null;
  shipped_at?: string | null;
  delivered_at?: string | null;
  created_at: string;
}

export interface InventoryMovement {
  id: string;
  business_id: string;
  product_id: string;
  variant_id?: string | null;
  movement_type: InventoryMovementType;
  quantity_change: number;
  previous_stock: number;
  new_stock: number;
  reference_id?: string | null;
  created_by?: string | null;
  created_at: string;
}

export interface Subscription {
  id: string;
  business_id: string;
  plan_code: 'free' | 'standard' | 'pro';
  status: SubscriptionStatus;
  max_products: number;
  max_orders_per_month: number;
  max_users: number;
  current_period_start: string;
  current_period_end: string;
  trial_ends_at?: string | null;
  canceled_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface WebhookEvent {
  id: string;
  provider: string;
  provider_event_id: string;
  event_type: string;
  payload: Record<string, any>;
  status: 'pending' | 'processed' | 'failed';
  error_message?: string | null;
  processed_at?: string | null;
  created_at: string;
}

export interface AuditLog {
  id: string;
  business_id?: string | null;
  user_id?: string | null;
  action: string;
  entity_type: string;
  entity_id?: string | null;
  details?: Record<string, any> | null;
  ip_address?: string | null;
  created_at: string;
}

export interface Notification {
  id: string;
  business_id: string;
  recipient_type: 'merchant' | 'customer';
  recipient_contact: string;
  channel: 'email' | 'sms' | 'whatsapp';
  title: string;
  body: string;
  status: 'pending' | 'sent' | 'failed';
  sent_at?: string | null;
  created_at: string;
}

// ==========================================
// INTERFACES RELATIONNELLES DE JOINTURES SUPABASE
// ==========================================
export interface BusinessMemberWithBusiness extends BusinessMember {
  businesses?: Business | null;
}

export interface OrderWithItems extends Order {
  items?: OrderItem[];
  customer?: Customer | null;
}

export interface ProductWithCategory extends Product {
  category?: Category | null;
}

