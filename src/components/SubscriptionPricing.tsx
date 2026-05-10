import { useState, useEffect } from "react";
import { Check, Sparkles, Building2, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface SubscriptionPlan {
  id: string;
  name: string;
  slug: string;
  description: string;
  price_ghs: number;
  features: string[];
  visibility_boost: number;
  max_enquiries_per_month: number | null;
}

interface SubscriptionPricingProps {
  userType: 'service_provider' | 'vendor';
  providerOrVendorId?: string;
  onSubscribe?: (planId: string) => void;
}

const planIcons = {
  pro: Sparkles,
  business: Building2,
  enterprise: Crown,
};

const planColors = {
  pro: "from-blue-500 to-cyan-500",
  business: "from-primary to-orange-500",
  enterprise: "from-purple-500 to-pink-500",
};

const ANNUAL_DISCOUNT = 0.10; // 10% discount

export function SubscriptionPricing({ userType, providerOrVendorId, onSubscribe }: SubscriptionPricingProps) {
  const { user } = useAuth();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState<string | null>(null);
  const [currentSubscription, setCurrentSubscription] = useState<string | null>(null);
  const [isAnnual, setIsAnnual] = useState(false);

  useEffect(() => {
    fetchPlans();
    if (user && providerOrVendorId) {
      fetchCurrentSubscription();
    }
  }, [user, providerOrVendorId]);

  const fetchPlans = async () => {
    try {
      const response = await api.get('/api/subscription-plans', { params: { is_active: true, orderBy: 'price_ghs' } });
      const data = response.data;
      
      const formattedPlans = data?.map(plan => ({
        ...plan,
        features: Array.isArray(plan.features) ? plan.features : JSON.parse(plan.features as string || '[]')
      })) || [];
      
      // Sort plans: Pro, Business, Enterprise (left to right)
      const planOrder = ['pro', 'business', 'enterprise'];
      const sortedPlans = formattedPlans.sort((a, b) => {
        const orderA = planOrder.indexOf(a.slug);
        const orderB = planOrder.indexOf(b.slug);
        return orderA - orderB;
      });
      
      setPlans(sortedPlans);
    } catch (error) {
      console.error('Error fetching plans:', error);
      toast.error('Failed to load subscription plans');
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentSubscription = async () => {
    if (!user || !providerOrVendorId) return;
    
    try {
      const response = await api.get('/api/user-subscriptions', {
        params: { userId: user.id, providerOrVendorId, status: 'active,trial' },
      });
      const data = response.data;
      setCurrentSubscription(data?.plan_id || null);
    } catch (error) {
      console.error('Error fetching subscription:', error);
    }
  };

  const handleSubscribe = async (plan: SubscriptionPlan) => {
    if (!user) {
      toast.error('Please sign in to subscribe');
      return;
    }

    if (!providerOrVendorId) {
      toast.error('Provider/Vendor ID is required');
      return;
    }

    setSubscribing(plan.id);

    try {
      // Calculate trial end date (1 month from now)
      const trialEndsAt = new Date();
      trialEndsAt.setMonth(trialEndsAt.getMonth() + 1);
      
      const periodEnd = new Date();
      periodEnd.setMonth(periodEnd.getMonth() + 1);

      await api.post('/api/user-subscriptions', {
        user_id: user.id,
        plan_id: plan.id,
        user_type: userType,
        provider_or_vendor_id: providerOrVendorId,
        status: 'trial',
        trial_ends_at: trialEndsAt.toISOString(),
        current_period_end: periodEnd.toISOString(),
      });

      if (error) throw error;

      toast.success(`Started ${plan.name} trial! Your first month is free.`);
      setCurrentSubscription(plan.id);
      onSubscribe?.(plan.id);
    } catch (error: any) {
      console.error('Error subscribing:', error);
      toast.error(error.message || 'Failed to subscribe');
    } finally {
      setSubscribing(null);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="space-y-4">
              <div className="h-6 bg-muted rounded w-24" />
              <div className="h-10 bg-muted rounded w-32" />
            </CardHeader>
            <CardContent className="space-y-3">
              {[1, 2, 3, 4].map((j) => (
                <div key={j} className="h-4 bg-muted rounded" />
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const getPrice = (plan: SubscriptionPlan) => {
    if (plan.slug === 'enterprise') return null;
    const monthlyPrice = plan.price_ghs;
    if (isAnnual) {
      const annualTotal = monthlyPrice * 12;
      const discountedTotal = annualTotal * (1 - ANNUAL_DISCOUNT);
      return Math.round(discountedTotal / 12); // Show as monthly equivalent
    }
    return monthlyPrice;
  };

  const getAnnualSavings = (plan: SubscriptionPlan) => {
    if (plan.slug === 'enterprise') return 0;
    return Math.round(plan.price_ghs * 12 * ANNUAL_DISCOUNT);
  };

  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <Badge variant="secondary" className="mb-2">
          🎉 First Month Free Trial
        </Badge>
        <h2 className="text-3xl font-bold">Choose Your Plan</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Boost your visibility and grow your business with our subscription plans
        </p>
      </div>

      {/* Billing Toggle */}
      <div className="flex items-center justify-center gap-4">
        <Label htmlFor="billing-toggle" className={cn(!isAnnual && "font-semibold")}>
          Monthly
        </Label>
        <Switch
          id="billing-toggle"
          checked={isAnnual}
          onCheckedChange={setIsAnnual}
        />
        <div className="flex items-center gap-2">
          <Label htmlFor="billing-toggle" className={cn(isAnnual && "font-semibold")}>
            Annual
          </Label>
          <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
            Save 10%
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {plans.map((plan, index) => {
          const Icon = planIcons[plan.slug as keyof typeof planIcons] || Sparkles;
          const gradientColor = planColors[plan.slug as keyof typeof planColors] || planColors.pro;
          const isPopular = plan.slug === 'business';
          const isCurrentPlan = currentSubscription === plan.id;

          return (
            <Card 
              key={plan.id} 
              className={cn(
                "relative flex flex-col transition-all duration-300 hover:shadow-xl",
                isPopular && "border-primary shadow-lg scale-105 z-10",
                isCurrentPlan && "ring-2 ring-primary"
              )}
            >
              {isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground">
                    Most Popular
                  </Badge>
                </div>
              )}
              
              {isCurrentPlan && (
                <div className="absolute -top-3 right-4">
                  <Badge variant="secondary">Current Plan</Badge>
                </div>
              )}

              <CardHeader className="text-center pb-2">
                <div className={cn(
                  "w-12 h-12 rounded-xl mx-auto mb-4 flex items-center justify-center bg-gradient-to-br",
                  gradientColor
                )}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>

              <CardContent className="flex-1 space-y-4">
                <div className="text-center pb-4 border-b">
                  {plan.slug === 'enterprise' ? (
                    <>
                      <span className="text-4xl font-bold">Custom</span>
                      <p className="text-sm text-muted-foreground mt-1">Based on your needs</p>
                    </>
                  ) : (
                    <>
                      <div className="flex items-baseline justify-center gap-1">
                        {isAnnual && (
                          <span className="text-lg text-muted-foreground line-through">
                            GHS {plan.price_ghs}
                          </span>
                        )}
                        <span className="text-4xl font-bold">GHS {getPrice(plan)}</span>
                        <span className="text-muted-foreground">/month</span>
                      </div>
                      {isAnnual ? (
                        <p className="text-sm text-green-600 mt-1">
                          Save GHS {getAnnualSavings(plan)}/year
                        </p>
                      ) : (
                        <p className="text-sm text-green-600 mt-1">First month FREE</p>
                      )}
                    </>
                  )}
                </div>

                <ul className="space-y-3">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter>
                <Button 
                  className={cn(
                    "w-full",
                    isPopular && "bg-gradient-to-r from-primary to-orange-500 hover:opacity-90"
                  )}
                  variant={isPopular ? "default" : "outline"}
                  disabled={isCurrentPlan || subscribing === plan.id}
                  onClick={() => plan.slug === 'enterprise' 
                    ? toast.info("Our team will contact you to discuss your specific needs") 
                    : handleSubscribe(plan)
                  }
                >
                  {subscribing === plan.id ? (
                    "Processing..."
                  ) : isCurrentPlan ? (
                    "Current Plan"
                  ) : plan.slug === 'enterprise' ? (
                    "Contact Us"
                  ) : (
                    "Start Free Trial"
                  )}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      <p className="text-center text-sm text-muted-foreground">
        All plans include a 30-day free trial. No credit card required to start.
        <br />
        Payment processing via Paystack will be available soon.
      </p>
    </div>
  );
}
