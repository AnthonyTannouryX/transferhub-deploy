import { useState, useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { WalletBalanceCard } from "@/components/WalletBalanceCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  User, 
  CreditCard, 
  Wallet as WalletIcon,
  Plus,
  Trash2,
  Save,
  Star,
  Shield,
  CheckCircle,
  AlertCircle,
  Clock,
  Crown
} from "lucide-react";
import { Link } from "react-router-dom";
import { walletService, Wallet } from "@/services/walletService";
import { paymentService, PaymentMethod } from "@/services/paymentService";
import { authApi } from "@/services/authApi";
import { stripeService, StripeTransaction } from "@/services/stripeService";
import { StripeCardInput } from "@/components/StripeCardInput";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export default function Settings() {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  
  // Determine navigation role based on user type
  const getNavigationRole = (): "user" | "agent" | "admin" => {
    if (!user) return "user";
    if (user.user_type === "admin") return "admin";
    if (user.user_type === "agent") return "agent";
    return "user";
  };
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [stripeTransactions, setStripeTransactions] = useState<StripeTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState("wallet");
  
  // Top-up state
  const [topUpAmount, setTopUpAmount] = useState("");
  const [selectedWallet, setSelectedWallet] = useState<string>("");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>("");
  const [isToppingUp, setIsToppingUp] = useState(false);
  
  // Profile state
  const [profileData, setProfileData] = useState({
    first_name: user?.first_name || "",
    last_name: user?.last_name || "",
    email: user?.email || "",
    phone: user?.phone || "",
  });
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  
  // Stripe state
  const [isAddingPaymentMethod, setIsAddingPaymentMethod] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  // Update profile data when user changes
  useEffect(() => {
    if (user) {
      setProfileData({
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        email: user.email || "",
        phone: user.phone || "",
      });
    }
  }, [user]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [walletsData, paymentMethodsData, transactionsData] = await Promise.all([
        walletService.getWallets(),
        paymentService.getPaymentMethods(),
        stripeService.getTransactionHistory()
      ]);
      setWallets(walletsData || []);
      setPaymentMethods(paymentMethodsData.data || paymentMethodsData.payment_methods || []);
      setStripeTransactions(transactionsData.data || []);
      if (walletsData && walletsData.length > 0) {
        setSelectedWallet(walletsData[0].id);
      }
      
      // Set default payment method if available
      const methods = paymentMethodsData.data || paymentMethodsData.payment_methods || [];
      const defaultMethod = methods.find((m: PaymentMethod) => m.is_default);
      if (defaultMethod) {
        setSelectedPaymentMethod(defaultMethod.id);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    setIsSavingProfile(true);
    try {
      const response = await authApi.updateProfile(profileData);
      if (response.success) {
        if (response.data && response.data.user) {
          await refreshUser();
        }
        toast({
          title: "Success",
          description: "Profile updated successfully",
        });
      }
    } catch (error: any) {
      console.error('Failed to update profile:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleTopUp = async () => {
    if (!selectedWallet || !topUpAmount) {
      toast({
        title: "Error",
        description: "Please select a wallet and enter an amount",
        variant: "destructive",
      });
      return;
    }
    
    if (paymentMethods.length > 0 && !selectedPaymentMethod) {
      toast({
        title: "Error",
        description: "Please select a payment method",
        variant: "destructive",
      });
      return;
    }
    
    setIsToppingUp(true);
    try {
      const selectedWalletData = wallets.find(w => w.id === selectedWallet);
      if (selectedWalletData) {
        // Find the selected payment method to get its Stripe ID
        const selectedMethod = paymentMethods.find(m => m.id === selectedPaymentMethod);
        if (!selectedMethod?.stripe_payment_method_id) {
          throw new Error('Selected payment method does not have a valid Stripe ID');
        }

        // Create Stripe PaymentIntent with payment method attached
        const paymentIntentResponse = await stripeService.createPaymentIntent({
          amount: parseFloat(topUpAmount),
          currency: selectedWalletData.currency.toLowerCase(),
          wallet_id: selectedWallet,
          payment_method_id: selectedMethod.stripe_payment_method_id
        });

        if (!paymentIntentResponse.success) {
          throw new Error(paymentIntentResponse.message || 'Failed to create payment intent');
        }

        // The payment should be automatically confirmed when created with a payment method
        toast({
          title: "Success",
          description: `$${topUpAmount} added to your ${selectedWalletData.currency} wallet`,
        });
        
        setTopUpAmount("");
        setSelectedPaymentMethod("");
        loadData();
      }
    } catch (error: any) {
      console.error('Top-up failed:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to top up wallet",
        variant: "destructive",
      });
    } finally {
      setIsToppingUp(false);
    }
  };

  const handleDeletePaymentMethod = async (id: string) => {
    if (!confirm("Are you sure you want to remove this payment method?")) {
      return;
    }

    try {
      const response = await paymentService.deletePaymentMethod(id);
      if (response.success) {
        toast({
          title: "Success",
          description: "Payment method removed",
        });
        loadData();
      }
    } catch (error: any) {
      console.error('Failed to delete payment method:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to remove payment method",
        variant: "destructive",
      });
    }
  };

  const handleSetDefaultPaymentMethod = async (id: string) => {
    try {
      const response = await paymentService.setDefaultPaymentMethod(id);
      if (response.success) {
        toast({
          title: "Success",
          description: "Default payment method updated",
        });
        loadData();
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to set default payment method",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Failed to set default payment method:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to set default payment method",
        variant: "destructive",
      });
    }
  };

  const handleStripePaymentMethodSuccess = async (paymentMethodId: string) => {
    try {
      setIsAddingPaymentMethod(true);
      const response = await stripeService.attachPaymentMethod({ payment_method_id: paymentMethodId });
      
      if (response.success) {
        toast({
          title: "Success",
          description: "Payment method added successfully",
        });
        setIsDialogOpen(false);
        loadData();
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add payment method",
        variant: "destructive",
      });
    } finally {
      setIsAddingPaymentMethod(false);
    }
  };

  const handleStripePaymentMethodError = (error: string) => {
    toast({
      title: "Error",
      description: error,
      variant: "destructive",
    });
    setIsAddingPaymentMethod(false);
  };

  const formatAmount = (amount: number | string): string => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return isNaN(numAmount) ? '0.00' : numAmount.toFixed(2);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation role={getNavigationRole()} />
      
      <main className="container mx-auto px-4 py-6 max-w-6xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Settings</h1>
          <p className="text-muted-foreground">Manage your profile, wallet, and payment methods</p>
        </div>

        <div className="grid gap-4 lg:grid-cols-4">
          {/* Settings Navigation */}
          <Card className="shadow-card border-none h-fit">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {[
                { id: "wallet", label: "Wallet", icon: WalletIcon },
                { id: "profile", label: "Profile", icon: User },
                { id: "payments", label: "Payment Methods", icon: CreditCard },
                { id: "stripe-history", label: "Stripe History", icon: CreditCard },
                { id: "subscription", label: "Subscription", icon: Crown, href: "/user/subscription" },
              ].map((item) => {
                const Icon = item.icon;
                
                if (item.href) {
                  return (
                    <Link key={item.id} to={item.href}>
                      <Button
                        variant="ghost"
                        className="w-full justify-start"
                      >
                        <Icon className="w-4 h-4 mr-2" />
                        {item.label}
                      </Button>
                    </Link>
                  );
                }
                
                return (
                  <Button
                    key={item.id}
                    variant={activeSection === item.id ? "default" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => setActiveSection(item.id)}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {item.label}
                  </Button>
                );
              })}
            </CardContent>
          </Card>

          {/* Main Settings Content */}
          <div className="lg:col-span-3 space-y-4">
            {/* Profile Settings */}
            {activeSection === "profile" && (
              <div className="space-y-6">
                {/* Profile Information */}
                <Card className="shadow-card border-none">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="w-5 h-5 text-primary" />
                      Profile Information
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Update your personal information and account details
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">First Name</Label>
                        <Input 
                          id="firstName" 
                          value={profileData.first_name}
                          onChange={(e) => setProfileData({...profileData, first_name: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input 
                          id="lastName" 
                          value={profileData.last_name}
                          onChange={(e) => setProfileData({...profileData, last_name: e.target.value})}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input 
                        id="email" 
                        type="email" 
                        value={profileData.email}
                        disabled
                        className="bg-muted"
                      />
                      <p className="text-xs text-muted-foreground">
                        Email cannot be changed. Contact support if you need to update your email.
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input 
                        id="phone" 
                        type="tel" 
                        placeholder="+1 (555) 123-4567"
                        value={profileData.phone}
                        onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                      />
                    </div>
                    
                    <Button 
                      onClick={handleSaveProfile} 
                      disabled={isSavingProfile}
                      className="gradient-hero text-white border-0"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {isSavingProfile ? "Saving..." : "Save Changes"}
                    </Button>
                  </CardContent>
                </Card>

                {/* Account Information */}
                <Card className="shadow-card border-none">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="w-5 h-5 text-primary" />
                      Account Information
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Your account status and verification details
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Account Type</Label>
                        <div className="flex items-center gap-2">
                          <Badge className={user?.user_type === 'agent' ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-gray-500 text-white hover:bg-gray-600'}>
                            {user?.user_type === 'agent' ? 'Agent Account' : 'Personal Account'}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Subscription Status</Label>
                        <div className="flex items-center gap-2">
                          <Badge className={
                            user?.subscription_status === 'active' ? 'bg-blue-600 text-white hover:bg-blue-700' : 
                            user?.subscription_status === 'free' ? 'bg-gray-500 text-white hover:bg-gray-600' : 
                            user?.subscription_status === 'expired' ? 'bg-red-500 text-white hover:bg-red-600' : 
                            'bg-gray-400 text-white'
                          }>
                            {user?.subscription_status === 'active' ? 'Active Subscription' : 
                             user?.subscription_status === 'free' ? 'Free Plan' : 
                             user?.subscription_status === 'expired' ? 'Expired' : 
                             user?.subscription_status || 'Unknown'}
                          </Badge>
                        </div>
                        {user?.subscription_expires_at && (
                          <p className="text-xs text-muted-foreground">
                            Expires: {new Date(user.subscription_expires_at).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Email Verification</Label>
                        <div className="flex items-center gap-2">
                          {user?.email_verified ? (
                            <Badge className="bg-green-500 text-white hover:bg-green-600">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Verified
                            </Badge>
                          ) : (
                            <Badge variant="destructive">
                              <AlertCircle className="w-3 h-3 mr-1" />
                              Not Verified
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Admin Approval</Label>
                        <div className="flex items-center gap-2">
                          {user?.admin_approved ? (
                            <Badge className="bg-green-500 text-white hover:bg-green-600">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Approved
                            </Badge>
                          ) : (
                            <Badge variant="secondary">
                              <Clock className="w-3 h-3 mr-1" />
                              Pending
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {user?.created_at && (
                      <div className="space-y-2">
                        <Label>Member Since</Label>
                        <p className="text-sm text-muted-foreground">
                          {new Date(user.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Wallet Management with Top Up */}
            {activeSection === "wallet" && (
              <div className="space-y-4">
                {/* Wallet Balances */}
                <Card className="shadow-card border-none">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2">
                      <WalletIcon className="w-5 h-5 text-primary" />
                      Your Wallets
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {loading ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        <span className="ml-2 text-muted-foreground">Loading wallets...</span>
                      </div>
                    ) : wallets.length > 0 ? (
                      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                        {wallets.map((wallet) => (
                          <WalletBalanceCard
                            key={wallet.id}
                            wallet={wallet}
                            showActions={false}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <WalletIcon className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                        <h3 className="text-lg font-semibold mb-2">No wallets found</h3>
                        <p className="text-muted-foreground">Your wallets will appear here once you make your first transfer.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Top Up Wallet */}
                <Card className="shadow-card border-none">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2">
                      <Plus className="w-5 h-5 text-success" />
                      Top Up Your Wallet
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Add funds to your wallet using your saved payment methods. Select your wallet, choose a payment method, enter the amount, and click Top Up.
                    </p>
                    
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-3">
                        <Label htmlFor="topup-wallet" className="text-base font-medium">Select Wallet</Label>
                        <Select value={selectedWallet} onValueChange={setSelectedWallet}>
                          <SelectTrigger className="h-12">
                            <SelectValue placeholder="Choose wallet" />
                          </SelectTrigger>
                          <SelectContent>
                            {wallets.map((wallet) => (
                              <SelectItem key={wallet.id} value={wallet.id}>
                                {wallet.currency} - ${wallet.balance.toFixed(2)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-3">
                        <Label htmlFor="topup-amount" className="text-base font-medium">Amount ($)</Label>
                        <Input
                          id="topup-amount"
                          type="number"
                          placeholder="0.00"
                          value={topUpAmount}
                          onChange={(e) => setTopUpAmount(e.target.value)}
                          className="h-12 text-lg"
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="payment-method" className="text-base font-medium">
                        Payment Method {paymentMethods.length > 0 && <span className="text-destructive">*</span>}
                      </Label>
                      {paymentMethods.length > 0 ? (
                        <Select value={selectedPaymentMethod} onValueChange={setSelectedPaymentMethod}>
                          <SelectTrigger className="h-12">
                            <SelectValue placeholder="Select payment method" />
                          </SelectTrigger>
                          <SelectContent>
                            {paymentMethods.map((method) => (
                              <SelectItem key={method.id} value={method.id}>
                                💳 {method.provider || method.card_brand || 'Card'} •••• {method.account_number ? method.account_number.slice(-4) : '****'}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="space-y-3">
                          <p className="text-sm text-muted-foreground">
                            No payment methods saved. Please add a payment method first.
                          </p>
                          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                            <DialogTrigger asChild>
                              <Button variant="outline" className="w-full h-12 text-base">
                                <CreditCard className="w-5 h-5 mr-2" />
                                Add Payment Method
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-5xl w-[90vw] h-[80vh]">
                              <DialogHeader className="pb-4">
                                <DialogTitle className="text-2xl">Add Payment Method</DialogTitle>
                                <DialogDescription className="text-lg">
                                  Add a new payment method securely via Stripe
                                </DialogDescription>
                              </DialogHeader>
                              <div className="py-8 flex-1">
                                <StripeCardInput
                                  onSuccess={handleStripePaymentMethodSuccess}
                                  onError={handleStripePaymentMethodError}
                                  isSubmitting={isAddingPaymentMethod}
                                />
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      )}
                    </div>

                    <Button 
                      className="w-full gradient-hero text-white border-0 h-14 text-lg font-semibold" 
                      disabled={!topUpAmount || !selectedWallet || (paymentMethods.length > 0 && !selectedPaymentMethod) || isToppingUp}
                      onClick={handleTopUp}
                    >
                      <Plus className="w-5 h-5 mr-2" />
                      {isToppingUp ? "Processing..." : "Top Up Wallet"}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Payment Methods */}
            {activeSection === "payments" && (
              <Card className="shadow-card border-none">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-primary" />
                    Payment Methods
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      <span className="ml-2 text-muted-foreground">Loading payment methods...</span>
                    </div>
                  ) : paymentMethods.length > 0 ? (
                    paymentMethods.map((method) => (
                      <div key={method.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">💳</span>
                          <div>
                            <p className="font-medium">
                              {method.provider || method.card_brand || 'Card'} •••• {method.last4 || (method.account_number ? method.account_number.slice(-4) : '****')}
                            </p>
                            {(method.card_expiry_month && method.card_expiry_year) && (
                              <p className="text-sm text-muted-foreground">
                                Expires {String(method.card_expiry_month).padStart(2, '0')}/{method.card_expiry_year}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {method.is_default ? (
                            <Badge className="bg-primary text-white">Default</Badge>
                          ) : (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleSetDefaultPaymentMethod(method.id)}
                              className="h-8"
                            >
                              <Star className="w-4 h-4 mr-1" />
                              Set as Default
                            </Button>
                          )}
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleDeletePaymentMethod(method.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <CreditCard className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No payment methods</h3>
                      <p className="text-muted-foreground mb-4">Add a payment method to top up your wallet</p>
                    </div>
                  )}
                  
                  <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="w-full">
                        <CreditCard className="w-4 h-4 mr-2" />
                        Add Payment Method
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-6xl">
                      <DialogHeader>
                        <DialogTitle>Add Payment Method</DialogTitle>
                        <DialogDescription>
                          Add a new payment method securely via Stripe
                        </DialogDescription>
                      </DialogHeader>
                      <div className="py-4">
                        <StripeCardInput
                          onSuccess={handleStripePaymentMethodSuccess}
                          onError={handleStripePaymentMethodError}
                          isSubmitting={isAddingPaymentMethod}
                        />
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>
            )}

            {/* Stripe Transaction History */}
            {activeSection === "stripe-history" && (
              <Card className="shadow-card border-none">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-primary" />
                    Stripe Payment History
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    View your Stripe payment transactions and wallet top-ups
                  </p>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      <span className="ml-2 text-muted-foreground">Loading transactions...</span>
                    </div>
                  ) : stripeTransactions.length > 0 ? (
                    <div className="space-y-4">
                      {stripeTransactions.map((transaction) => (
                        <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full ${
                              transaction.status === 'succeeded' ? 'bg-green-500' : 
                              transaction.status === 'failed' ? 'bg-red-500' : 'bg-yellow-500'
                            }`} />
                            <div>
                              <p className="font-medium">
                                {transaction.description || 'Stripe Payment'}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {new Date(transaction.created_at).toLocaleDateString()} • 
                                {transaction.wallet?.currency} Wallet • 
                                Status: {transaction.status}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">
                              ${formatAmount(transaction.amount)} {transaction.currency.toUpperCase()}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              ID: {transaction.stripe_payment_intent_id.slice(-8)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <CreditCard className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No Stripe transactions</h3>
                      <p className="text-muted-foreground">Your Stripe payment history will appear here</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
