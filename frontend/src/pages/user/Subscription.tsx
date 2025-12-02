import { useState, useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { subscriptionService, SubscriptionPlan, PaymentMethod, UserSubscription } from "@/services/subscriptionService";
import { AlertCircle, Loader2, Crown, CreditCard } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

export default function Subscription() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [currentSubscription, setCurrentSubscription] = useState<UserSubscription | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>("");
  const [selectedPlanId, setSelectedPlanId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(false);
  const [showPaymentSelection, setShowPaymentSelection] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [plansData, subscriptionData, paymentMethodsData] = await Promise.all([
        subscriptionService.getPlans(),
        subscriptionService.getCurrentPlan().then(plan => plan ? { plan } : null),
        subscriptionService.getPaymentMethods()
      ]);

      setPlans(plansData);

      // Set current subscription if exists
      if (subscriptionData?.plan) {
        // Create a mock subscription object for display
        setCurrentSubscription({
          id: 'current',
          user_id: '',
          plan_id: '',
          status: 'active',
          started_at: new Date().toISOString(),
          expires_at: null,
          auto_renew: true,
          plan: subscriptionData.plan
        });
      }

      setPaymentMethods(paymentMethodsData);

      // Auto-select first payment method
      if (paymentMethodsData.length > 0 && !selectedPaymentMethod) {
        setSelectedPaymentMethod(paymentMethodsData[0].id);
      }
    } catch (error) {
      console.error('Failed to load subscription data:', error);
      toast({
        title: "Error",
        description: "Failed to load subscription plans",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getPlanPrice = (planName: string): number => {
    if (planName === 'enterprise') return 100;
    if (planName === 'business') return 29;
    return 0; // personal is free
  };

  const handleSelectPlan = (planId: string) => {
    setSelectedPlanId(planId);
    const plan = plans.find(p => p.id === planId);

    if (plan && getPlanPrice(plan.name) > 0) {
      // Paid plan - require payment method
      if (paymentMethods.length === 0) {
        // No payment methods - redirect to settings
        toast({
          title: "Payment Method Required",
          description: "Please add a payment method in settings first to subscribe to paid plans.",
          variant: "destructive",
        });
        setTimeout(() => {
          navigate('/settings');
        }, 2000);
        return;
      }
      setShowPaymentSelection(true);
    } else {
      // Free plan - subscribe directly
      handleSubscribe(planId);
    }
  };

  const handleSubscribe = async (planId?: string) => {
    const planIdToUse = planId || selectedPlanId;
    if (!planIdToUse) return;

    try {
      setSubscribing(true);
      const plan = plans.find(p => p.id === planIdToUse);

      if (plan && getPlanPrice(plan.name) > 0) {
        // Paid plan - require payment method
        if (!selectedPaymentMethod) {
          toast({
            title: "Payment Method Required",
            description: "Please select a payment method",
            variant: "destructive",
          });
          return;
        }

        // Process payment and subscribe
        await subscriptionService.subscribeWithPayment(planIdToUse, selectedPaymentMethod);

        toast({
          title: "Success!",
          description: `Successfully subscribed to ${plan.name} plan. Payment of $${getPlanPrice(plan.name)} has been processed.`,
        });
      } else {
        // Free plan - subscribe directly
        await subscriptionService.subscribe(planIdToUse);

        toast({
          title: "Success!",
          description: `Successfully subscribed to ${plan?.name || 'plan'} plan`,
        });
      }

      // Reload data
      await loadData();
      setShowPaymentSelection(false);
      setSelectedPlanId("");
      setSelectedPaymentMethod("");
    } catch (error: any) {
      console.error('Failed to subscribe:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to subscribe to plan",
        variant: "destructive",
      });
    } finally {
      setSubscribing(false);
    }
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation role="user" />
        <main className="container mx-auto px-4 py-6 max-w-7xl">
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation role="user" />
      
      <main className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Crown className="h-8 w-8 text-primary" />
            Subscription Plans
          </h1>
          <p className="text-muted-foreground mt-2">
            Choose the plan that best fits your transfer needs
          </p>
        </div>

        {/* Current Subscription Alert */}
        {currentSubscription && (
          <Alert className="mb-6">
            <Crown className="h-4 w-4" />
            <AlertDescription>
              You are currently on the <strong className="capitalize">{currentSubscription.plan.name}</strong> plan.
            </AlertDescription>
          </Alert>
        )}

        {/* Payment Methods Selection */}
        {showPaymentSelection && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Complete Your Subscription</CardTitle>
              <CardDescription>
                {selectedPlanId && (() => {
                  const plan = plans.find(p => p.id === selectedPlanId);
                  return plan ? `Subscribe to ${plan.name} plan for $${getPlanPrice(plan.name)}/month` : '';
                })()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {paymentMethods.length > 0 ? (
                <>
                  <div className="mb-4">
                    <Label className="text-base font-semibold">Select Payment Method</Label>
                    <p className="text-sm text-muted-foreground mt-1">Choose a card to process your subscription payment</p>
                  </div>
                  <RadioGroup value={selectedPaymentMethod} onValueChange={setSelectedPaymentMethod}>
                    {paymentMethods.map((method) => (
                      <div key={method.id} className="flex items-center space-x-3 border rounded-lg p-4 cursor-pointer hover:bg-accent transition-colors">
                        <RadioGroupItem value={method.id} id={method.id} />
                        <Label htmlFor={method.id} className="flex-1 cursor-pointer">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <CreditCard className="h-5 w-5 text-muted-foreground" />
                              <div>
                                <div className="font-medium">
                                  {method.card_brand ? `${method.card_brand} ****${method.last4}` : 'Card'}
                                </div>
                                {method.card_expiry_month && method.card_expiry_year && (
                                  <div className="text-sm text-muted-foreground">
                                    Expires {method.card_expiry_month}/{method.card_expiry_year}
                                  </div>
                                )}
                              </div>
                            </div>
                            {method.is_default && (
                              <Badge variant="secondary">Default</Badge>
                            )}
                          </div>
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>

                  <div className="flex gap-3 mt-6">
                    <Button
                      onClick={() => handleSubscribe()}
                      disabled={!selectedPaymentMethod || subscribing}
                      className="flex-1"
                    >
                      {subscribing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing Payment...
                        </>
                      ) : (
                        <>
                          <CreditCard className="mr-2 h-4 w-4" />
                          Pay & Subscribe
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowPaymentSelection(false);
                        setSelectedPlanId("");
                      }}
                      disabled={subscribing}
                    >
                      Cancel
                    </Button>
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      You need to add a payment method before subscribing to a paid plan.
                    </AlertDescription>
                  </Alert>
                  <div className="flex gap-3">
                    <Link to="/settings" className="flex-1">
                      <Button variant="default" className="w-full">
                        <CreditCard className="mr-2 h-4 w-4" />
                        Add Payment Method
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowPaymentSelection(false);
                        setSelectedPlanId("");
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Plans Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => {
            const isCurrentPlan = currentSubscription?.plan.id === plan.id;

            return (
              <Card
                key={plan.id}
                className={cn(
                  "relative transition-all hover:shadow-lg cursor-pointer",
                  isCurrentPlan && "ring-2 ring-primary",
                  !isCurrentPlan && "hover:border-primary"
                )}
                onClick={() => !isCurrentPlan && handleSelectPlan(plan.id)}
              >
                {isCurrentPlan && (
                  <div className="absolute -top-3 right-4">
                    <Badge className="bg-primary">
                      <Crown className="h-3 w-3 mr-1" />
                      Current Plan
                    </Badge>
                  </div>
                )}
                
                <CardHeader>
                  <CardTitle className="text-2xl capitalize">{plan.name}</CardTitle>
                  <div className="mt-3">
                    <span className="text-3xl font-bold">
                      {plan.name === 'enterprise' ? '$100' : plan.name === 'business' ? '$29' : 'Free'}
                    </span>
                    <span className="text-muted-foreground text-base">/month</span>
                  </div>
                </CardHeader>

                <CardContent>
                  {/* Plan Details - Only Essential Info */}
                  <div className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                        <span className="text-sm font-medium">Monthly Limit:</span>
                        <span className="text-lg font-bold">
                          {plan.monthly_limit === null ? 'Unlimited' : `$${plan.monthly_limit.toLocaleString()}`}
                        </span>
                      </div>

                      <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                        <span className="text-sm font-medium">Transfer Fee:</span>
                        <span className="text-lg font-bold">${plan.transfer_fee}</span>
                      </div>

                      <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                        <span className="text-sm font-medium">Express Speed Fee:</span>
                        <span className="text-lg font-bold">${plan.express_fee}</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Button */}
                  <Button
                    className="w-full mt-6"
                    variant={isCurrentPlan ? "outline" : "default"}
                    disabled={isCurrentPlan || subscribing}
                  >
                    {isCurrentPlan ? 'Current Plan' : 'Select Plan'}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

       
       
      </main>
    </div>
  );
}
