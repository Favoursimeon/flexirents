-- Create subscription plans table
CREATE TABLE public.subscription_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  price_ghs NUMERIC NOT NULL,
  features JSONB DEFAULT '[]'::jsonb,
  visibility_boost INTEGER DEFAULT 1,
  max_enquiries_per_month INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user subscriptions table
CREATE TABLE public.user_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  plan_id UUID NOT NULL REFERENCES public.subscription_plans(id),
  user_type TEXT NOT NULL CHECK (user_type IN ('service_provider', 'vendor')),
  provider_or_vendor_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'trial')),
  trial_ends_at TIMESTAMP WITH TIME ZONE,
  current_period_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  paystack_subscription_code TEXT,
  paystack_customer_code TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS policies for subscription_plans (public read)
CREATE POLICY "Anyone can view active subscription plans"
ON public.subscription_plans
FOR SELECT
USING (is_active = true);

-- RLS policies for user_subscriptions
CREATE POLICY "Users can view their own subscriptions"
ON public.user_subscriptions
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own subscriptions"
ON public.user_subscriptions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscriptions"
ON public.user_subscriptions
FOR UPDATE
USING (auth.uid() = user_id);

-- Insert default subscription plans
INSERT INTO public.subscription_plans (name, slug, description, price_ghs, visibility_boost, max_enquiries_per_month, features) VALUES
('Pro', 'pro', 'Perfect for individuals starting out', 100, 2, 50, '["Enhanced visibility in search results", "Up to 50 enquiries per month", "Basic analytics dashboard", "Email support"]'::jsonb),
('Business', 'business', 'Ideal for growing businesses', 250, 5, 200, '["Priority visibility in search results", "Up to 200 enquiries per month", "Advanced analytics & insights", "Priority email & chat support", "Featured badge on profile"]'::jsonb),
('Enterprise', 'enterprise', 'For large-scale operations', 500, 10, NULL, '["Maximum visibility boost", "Unlimited enquiries", "Custom analytics & reports", "Dedicated account manager", "Featured badge + homepage spotlight", "API access"]'::jsonb);

-- Create trigger for updated_at
CREATE TRIGGER update_subscription_plans_updated_at
BEFORE UPDATE ON public.subscription_plans
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_subscriptions_updated_at
BEFORE UPDATE ON public.user_subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();