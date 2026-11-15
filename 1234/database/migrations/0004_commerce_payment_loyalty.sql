-- Migration 0004: Service Plans, Subscriptions, Support Programs, Payments & Loyalty
CREATE INDEX IF NOT EXISTS idx_subs_user ON subscriptions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_user ON payment_orders(user_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_transfer ON payment_orders(transfer_content);
