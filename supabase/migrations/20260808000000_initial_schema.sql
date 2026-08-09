-- Migration 20260808000000_initial_schema.sql
-- ShopFlow: Multi-Tenant E-Commerce Platform Database Schema & RLS

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 1. ENUMS
-- ==========================================
CREATE TYPE user_role AS ENUM ('owner', 'manager', 'seller', 'delivery_agent');
CREATE TYPE order_status AS ENUM ('pending', 'confirmed', 'preparing', 'shipped', 'delivered', 'cancelled', 'returned');
CREATE TYPE payment_status AS ENUM ('pending', 'succeeded', 'failed', 'cancelled', 'refunded');
CREATE TYPE payment_method AS ENUM ('cash_on_delivery', 'mobile_money_manual', 'online');
CREATE TYPE inventory_movement_type AS ENUM ('sale', 'restock', 'adjustment', 'return', 'cancellation');
CREATE TYPE subscription_status AS ENUM ('trialing', 'active', 'past_due', 'canceled', 'unpaid');

-- ==========================================
-- 2. TABLES
-- ==========================================

-- 1. PROFILES
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(30) UNIQUE NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. BUSINESSES
CREATE TABLE businesses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    logo_url TEXT,
    description TEXT,
    whatsapp_number VARCHAR(30) NOT NULL,
    address TEXT,
    city VARCHAR(100) NOT NULL DEFAULT 'Cotonou',
    delivery_zones JSONB DEFAULT '[]'::jsonb,
    currency VARCHAR(10) NOT NULL DEFAULT 'XOF',
    opening_hours JSONB DEFAULT '{}'::jsonb,
    delivery_settings JSONB DEFAULT '{"delivery_fee": 1000, "free_delivery_above": null}'::jsonb,
    payment_settings JSONB DEFAULT '{"accept_cod": true, "accept_online": true, "mobile_money_number": ""}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. BUSINESS_MEMBERS
CREATE TABLE business_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    role user_role NOT NULL DEFAULT 'seller',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(business_id, user_id)
);

-- 4. CATEGORIES
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(business_id, slug)
);

-- 5. PRODUCTS
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    price NUMERIC(12, 2) NOT NULL CHECK (price >= 0),
    promotional_price NUMERIC(12, 2) CHECK (promotional_price IS NULL OR promotional_price < price),
    image_url TEXT,
    stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
    low_stock_threshold INTEGER DEFAULT 5,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. PRODUCT_VARIANTS
CREATE TABLE product_variants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    sku VARCHAR(50),
    price_override NUMERIC(12, 2),
    stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. CUSTOMERS
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    full_name VARCHAR(150) NOT NULL,
    phone VARCHAR(30) NOT NULL,
    email VARCHAR(150),
    delivery_address TEXT,
    total_orders INTEGER NOT NULL DEFAULT 0,
    total_spent NUMERIC(12, 2) NOT NULL DEFAULT 0,
    internal_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(business_id, phone)
);

-- 8. ORDERS
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    order_number VARCHAR(20) NOT NULL,
    customer_name VARCHAR(150) NOT NULL,
    customer_phone VARCHAR(30) NOT NULL,
    delivery_address TEXT NOT NULL,
    delivery_zone VARCHAR(100),
    subtotal NUMERIC(12, 2) NOT NULL CHECK (subtotal >= 0),
    delivery_fee NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (delivery_fee >= 0),
    total_amount NUMERIC(12, 2) NOT NULL CHECK (total_amount >= 0),
    status order_status NOT NULL DEFAULT 'pending',
    payment_status payment_status NOT NULL DEFAULT 'pending',
    payment_method payment_method NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(business_id, order_number)
);

-- 9. ORDER_ITEMS
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
    product_name VARCHAR(200) NOT NULL,
    unit_price NUMERIC(12, 2) NOT NULL CHECK (unit_price >= 0),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    total_price NUMERIC(12, 2) NOT NULL CHECK (total_price >= 0)
);

-- 10. PAYMENTS
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL DEFAULT 'sandbox',
    transaction_reference VARCHAR(100) UNIQUE,
    idempotency_key VARCHAR(100) UNIQUE NOT NULL,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    status payment_status NOT NULL DEFAULT 'pending',
    payment_method payment_method NOT NULL,
    provider_response JSONB,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. DELIVERIES
CREATE TABLE deliveries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    delivery_agent_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    tracking_notes TEXT,
    shipped_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. INVENTORY_MOVEMENTS
CREATE TABLE inventory_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    variant_id UUID REFERENCES product_variants(id) ON DELETE CASCADE,
    movement_type inventory_movement_type NOT NULL,
    quantity_change INTEGER NOT NULL,
    previous_stock INTEGER NOT NULL,
    new_stock INTEGER NOT NULL,
    reference_id UUID,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. SUBSCRIPTIONS
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    plan_code VARCHAR(50) NOT NULL DEFAULT 'free',
    status subscription_status NOT NULL DEFAULT 'active',
    max_products INTEGER NOT NULL DEFAULT 20,
    max_orders_per_month INTEGER NOT NULL DEFAULT 50,
    max_users INTEGER NOT NULL DEFAULT 2,
    current_period_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    current_period_end TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),
    trial_ends_at TIMESTAMPTZ,
    canceled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 14. WEBHOOK_EVENTS
CREATE TABLE webhook_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider VARCHAR(50) NOT NULL,
    provider_event_id VARCHAR(150) NOT NULL UNIQUE,
    event_type VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'pending',
    error_message TEXT,
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 15. AUDIT_LOGS
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID,
    details JSONB DEFAULT '{}'::jsonb,
    ip_address VARCHAR(45),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 16. NOTIFICATIONS
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    recipient_type VARCHAR(20) NOT NULL,
    recipient_contact VARCHAR(100) NOT NULL,
    channel VARCHAR(20) NOT NULL,
    title VARCHAR(200) NOT NULL,
    body TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==========================================
-- 3. INDEXES
-- ==========================================
CREATE INDEX idx_products_business ON products(business_id);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_orders_business ON orders(business_id);
CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_customers_phone ON customers(business_id, phone);
CREATE INDEX idx_inventory_movements_product ON inventory_movements(product_id);
CREATE INDEX idx_payments_order ON payments(order_id);

-- ==========================================
-- 4. RLS HELPER FUNCTION & POLICIES
-- ==========================================
CREATE OR REPLACE FUNCTION get_user_business_role(target_business_id UUID)
RETURNS user_role AS $$
    SELECT role FROM business_members 
    WHERE business_id = target_business_id AND user_id = auth.uid()
    LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Users can view and update their own profile" 
ON profiles FOR ALL USING (auth.uid() = id);

-- Businesses Policies
CREATE POLICY "Members can view their business" 
ON businesses FOR SELECT USING (
    EXISTS (SELECT 1 FROM business_members WHERE business_id = businesses.id AND user_id = auth.uid())
);
CREATE POLICY "Owners and Managers can update their business" 
ON businesses FOR UPDATE USING (
    get_user_business_role(id) IN ('owner', 'manager')
);
CREATE POLICY "Public can view business details by slug" 
ON businesses FOR SELECT USING (true);

-- Categories Policies
CREATE POLICY "Public can view categories" 
ON categories FOR SELECT USING (true);
CREATE POLICY "Members can manage categories" 
ON categories FOR ALL USING (
    get_user_business_role(business_id) IN ('owner', 'manager', 'seller')
);

-- Products Policies
CREATE POLICY "Public can view active products" 
ON products FOR SELECT USING (is_active = true);
CREATE POLICY "Members can view all business products" 
ON products FOR SELECT USING (
    EXISTS (SELECT 1 FROM business_members WHERE business_id = products.business_id AND user_id = auth.uid())
);
CREATE POLICY "Sellers, Managers and Owners can manage products" 
ON products FOR ALL USING (
    get_user_business_role(business_id) IN ('owner', 'manager', 'seller')
);

-- Product Variants Policies
CREATE POLICY "Public can view product variants" 
ON product_variants FOR SELECT USING (true);
CREATE POLICY "Members can manage variants" 
ON product_variants FOR ALL USING (
    get_user_business_role(business_id) IN ('owner', 'manager', 'seller')
);

-- Customers Policies
CREATE POLICY "Members can manage customers" 
ON customers FOR ALL USING (
    EXISTS (SELECT 1 FROM business_members WHERE business_id = customers.business_id AND user_id = auth.uid())
);

-- Orders Policies
CREATE POLICY "Public can create orders" 
ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Members can view orders" 
ON orders FOR SELECT USING (
    EXISTS (SELECT 1 FROM business_members WHERE business_id = orders.business_id AND user_id = auth.uid())
);
CREATE POLICY "Members can update orders based on role" 
ON orders FOR UPDATE USING (
    get_user_business_role(business_id) IN ('owner', 'manager', 'seller', 'delivery_agent')
);

-- Order Items Policies
CREATE POLICY "Public can create order items" 
ON order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Members can view order items" 
ON order_items FOR SELECT USING (
    EXISTS (SELECT 1 FROM business_members WHERE business_id = order_items.business_id AND user_id = auth.uid())
);

-- Payments Policies
CREATE POLICY "Members can view payments" 
ON payments FOR SELECT USING (
    EXISTS (SELECT 1 FROM business_members WHERE business_id = payments.business_id AND user_id = auth.uid())
);

-- Deliveries Policies
CREATE POLICY "Members can manage deliveries" 
ON deliveries FOR ALL USING (
    EXISTS (SELECT 1 FROM business_members WHERE business_id = deliveries.business_id AND user_id = auth.uid())
);

-- Inventory Movements Policies
CREATE POLICY "Members can view inventory movements" 
ON inventory_movements FOR SELECT USING (
    EXISTS (SELECT 1 FROM business_members WHERE business_id = inventory_movements.business_id AND user_id = auth.uid())
);

-- Subscriptions Policies
CREATE POLICY "Members can view business subscriptions" 
ON subscriptions FOR SELECT USING (
    EXISTS (SELECT 1 FROM business_members WHERE business_id = subscriptions.business_id AND user_id = auth.uid())
);

-- Audit Logs Policies
CREATE POLICY "Owners and Managers can view audit logs" 
ON audit_logs FOR SELECT USING (
    get_user_business_role(business_id) IN ('owner', 'manager')
);

-- Notifications Policies
CREATE POLICY "Members can view notifications" 
ON notifications FOR SELECT USING (
    EXISTS (SELECT 1 FROM business_members WHERE business_id = notifications.business_id AND user_id = auth.uid())
);

-- Business Members Policies
CREATE POLICY "Users can view memberships in their business" 
ON business_members FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM business_members bm WHERE bm.business_id = business_members.business_id AND bm.user_id = auth.uid())
);

CREATE POLICY "Owners and Managers can manage business members" 
ON business_members FOR ALL USING (
    get_user_business_role(business_id) IN ('owner', 'manager')
);

-- Webhook Events Policies
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "System and service role full access to webhook events" 
ON webhook_events FOR ALL USING (true);

-- ==========================================
-- 5. ATOMIC STOCK PROCESS FUNCTION
-- ==========================================
CREATE OR REPLACE FUNCTION process_order_stock_decrement(
    p_order_id UUID,
    p_business_id UUID
) RETURNS VOID AS $$
DECLARE
    item RECORD;
    current_p_stock INT;
BEGIN
    FOR item IN SELECT product_id, variant_id, quantity FROM order_items WHERE order_id = p_order_id LOOP
        SELECT stock INTO current_p_stock FROM products WHERE id = item.product_id AND business_id = p_business_id FOR UPDATE;
        
        IF current_p_stock < item.quantity THEN
            RAISE EXCEPTION 'INSUFFICIENT_STOCK: Produit ID % stock insuffisant (restant %, demandé %)', item.product_id, current_p_stock, item.quantity;
        END IF;

        UPDATE products 
        SET stock = stock - item.quantity, updated_at = NOW() 
        WHERE id = item.product_id AND business_id = p_business_id;

        INSERT INTO inventory_movements (
            business_id, product_id, variant_id, movement_type, 
            quantity_change, previous_stock, new_stock, reference_id
        ) VALUES (
            p_business_id, item.product_id, item.variant_id, 'sale',
            -item.quantity, current_p_stock, current_p_stock - item.quantity, p_order_id
        );
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
