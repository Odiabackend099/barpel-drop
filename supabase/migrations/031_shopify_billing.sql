-- Migration 031: Shopify Billing Integration
-- Adds columns to track Shopify Managed Pricing subscriptions
-- alongside existing DodoPayments billing columns

-- Shopify billing columns on merchants
ALTER TABLE merchants
  ADD COLUMN IF NOT EXISTS shopify_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS shopify_plan TEXT CHECK (shopify_plan IN ('starter', 'growth', 'scale')),
  ADD COLUMN IF NOT EXISTS shopify_billing_cycle TEXT CHECK (shopify_billing_cycle IN ('monthly', 'annual'));

-- Performance: webhook handler looks up merchant by shop domain (via integrations table)
CREATE INDEX IF NOT EXISTS idx_integrations_shop_domain
  ON integrations(shop_domain);

-- Performance: lookup by Shopify subscription ID
CREATE INDEX IF NOT EXISTS idx_merchants_shopify_subscription
  ON merchants(shopify_subscription_id)
  WHERE shopify_subscription_id IS NOT NULL;
