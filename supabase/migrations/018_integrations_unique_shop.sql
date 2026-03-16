-- Migration 018: Unique constraint on (shop_domain, platform) in integrations.
--
-- A Shopify store can only install one app instance, so a single shop_domain
-- should never map to multiple merchants on the same platform.
-- Without this constraint, maybeSingle() calls in the abandoned-cart webhook
-- return null (PGRST116) when duplicates exist, causing false "Unknown shop" 401s.
--
-- Applied: 2026-03-16

ALTER TABLE integrations
  ADD CONSTRAINT integrations_shop_domain_platform_unique
  UNIQUE (shop_domain, platform);
