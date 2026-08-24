-- Rename Stripe columns to Razorpay
ALTER TABLE plans RENAME COLUMN stripe_price_id TO razorpay_plan_id;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS razorpay_subscription_id VARCHAR(255) UNIQUE;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS razorpay_customer_id VARCHAR(255);
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS cancel_at_period_end BOOLEAN DEFAULT false;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS interval VARCHAR(20) DEFAULT 'monthly';
-- Drop old Stripe columns if they exist
ALTER TABLE subscriptions DROP COLUMN IF EXISTS stripe_subscription_id;
ALTER TABLE subscriptions DROP COLUMN IF EXISTS stripe_customer_id;
