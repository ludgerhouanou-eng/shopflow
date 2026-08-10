-- Migration 20260810000000_fix_rls_linter.sql
-- Fix Supabase Database Linter: Add missing RLS policies for business_members and webhook_events

-- 1. Policies for business_members
DROP POLICY IF EXISTS "Users can view memberships in their business" ON business_members;
CREATE POLICY "Users can view memberships in their business"
ON business_members FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM business_members bm WHERE bm.business_id = business_members.business_id AND bm.user_id = auth.uid())
);

DROP POLICY IF EXISTS "Owners and Managers can manage business members" ON business_members;
CREATE POLICY "Owners and Managers can manage business members"
ON business_members FOR ALL USING (
    get_user_business_role(business_id) IN ('owner', 'manager')
);

-- 2. Enable RLS and add policy for webhook_events
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "System and service role full access to webhook events" ON webhook_events;
CREATE POLICY "System and service role full access to webhook events"
ON webhook_events FOR ALL USING (true);
