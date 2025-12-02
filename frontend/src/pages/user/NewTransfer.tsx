import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { FeeCalculator } from "@/components/FeeCalculator";
import { WalletBalanceDisplay } from "@/components/WalletBalanceDisplay";
import { PlanInfoCard } from "@/components/PlanInfoCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Info, Zap, Clock, Wallet as WalletIcon, User, Smartphone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { walletService, Wallet, FeeCalculation } from "@/services/walletService";
import { subscriptionService, SubscriptionPlan, MonthlyUsage } from "@/services/subscriptionService";
import { beneficiaryService, Beneficiary } from "@/services/beneficiaryService";
import { transferService, CreateTransferRequest } from "@/services/transferService";

export default function NewTransfer() {
  const navigate = useNavigate();
  const location = useLocation();
  const [amount, setAmount] = useState("1000");
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [selectedWallet, setSelectedWallet] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<'wallet'>('wallet');
  const [speedTier, setSpeedTier] = useState<'standard' | 'express'>('standard');
  const [fees, setFees] = useState<FeeCalculation | null>(null);
  
  // Beneficiary-related state
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [selectedBeneficiary, setSelectedBeneficiary] = useState<string>("");
  const [recipientName, setRecipientName] = useState<string>("");
  const [recipientEmail, setRecipientEmail] = useState<string>("");
  const [recipientPhone, setRecipientPhone] = useState<string>("");
  const [payoutMethod, setPayoutMethod] = useState<string>("wallet");

  const handleFeeChange = (feeData: FeeCalculation) => {
    setFees(feeData);
  };
  const [loading, setLoading] = useState(false);
  const currency = "USD"; // Fixed currency
  const [userPlan, setUserPlan] = useState<SubscriptionPlan | null>(null);
  const [monthlyUsage, setMonthlyUsage] = useState<MonthlyUsage | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadWallets();
    loadBeneficiaries();
    loadUserPlan();
    loadMonthlyUsage();
  }, []);

  // Handle beneficiary data passed from beneficiaries page
  useEffect(() => {
    if (location.state?.selectedBeneficiary) {
      const beneficiary = location.state.selectedBeneficiary as Beneficiary;
      const prefillData = location.state.prefillData;
      
      console.log('💰 NewTransfer: Received beneficiary data:', beneficiary);
      console.log('💰 NewTransfer: Prefill data:', prefillData);
      
      // Wait for beneficiaries to load before setting
      if (beneficiaries.length > 0) {
        // Pre-fill recipient information
        if (prefillData) {
          setRecipientName(prefillData.recipientName || '');
          setRecipientEmail(prefillData.recipientEmail || '');
          setRecipientPhone(prefillData.recipientPhone || '');
          setPayoutMethod(prefillData.payoutMethod || 'wallet');
          setPaymentMethod(prefillData.paymentMethod || 'wallet');
        }
        
        // Set the selected beneficiary
        setSelectedBeneficiary(beneficiary.id);
        
        // Show success message
        toast({
          title: "Beneficiary Selected",
          description: `Sending money to ${beneficiary.name}`,
        });
      }
    }
  }, [location.state, beneficiaries, toast]);

  const loadWallets = async () => {
    try {
      console.log('Loading wallets...');
      console.log('Auth token:', localStorage.getItem('transferhub_auth_token'));
      const walletsData = await walletService.getWallets();
      console.log('Wallets data received:', walletsData);
      if (walletsData && Array.isArray(walletsData)) {
        setWallets(walletsData);
        if (walletsData.length > 0) {
          setSelectedWallet(walletsData[0].id);
          console.log('Selected first wallet:', walletsData[0].id);
        }
      } else {
        setWallets([]);
      }
    } catch (error) {
      console.error('Failed to load wallets:', error);
      console.error('Error details:', error);
      setWallets([]);
    }
  };

  const loadBeneficiaries = async () => {
    try {
      const response = await beneficiaryService.getBeneficiaries();
      if (response && response.success) {
        setBeneficiaries(response.beneficiaries || []);
      } else {
        setBeneficiaries([]);
      }
    } catch (error) {
      console.error('Failed to load beneficiaries:', error);
      setBeneficiaries([]);
    }
  };

  const handleBeneficiarySelect = (beneficiaryId: string) => {
    if (beneficiaryId === "manage") {
      // Navigate to beneficiaries page
      window.location.href = "/user/beneficiaries";
      return;
    }

    setSelectedBeneficiary(beneficiaryId);
    
    if (beneficiaryId === "new") {
      // Reset recipient details for new beneficiary
      setRecipientName("");
      setRecipientEmail("");
      setRecipientPhone("");
      setPayoutMethod("wallet");
      return;
    }

    // Find the selected beneficiary and auto-fill details
    const beneficiary = beneficiaries.find(b => b.id === beneficiaryId);
    if (beneficiary) {
      setRecipientName(beneficiary.name);
      setRecipientEmail(beneficiary.email);
      setRecipientPhone(beneficiary.phone || "");
      setPayoutMethod(beneficiary.payment_method);
      
      // For wallet-to-wallet transfers, set payout method to wallet
      if (beneficiary.payment_method === 'wallet') {
        setPayoutMethod('wallet');
      }
    }
  };

  const loadUserPlan = async () => {
    try {
      const plan = await subscriptionService.getCurrentPlan();
      setUserPlan(plan);
    } catch (error) {
      console.error('Failed to load user plan:', error);
    }
  };

  const loadMonthlyUsage = async () => {
    try {
      const usage = await subscriptionService.getMonthlyUsage();
      setMonthlyUsage(usage);
    } catch (error) {
      console.error('Failed to load monthly usage:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Validate required fields
      if (!selectedBeneficiary) {
        toast({
          title: "Missing Information",
          description: "Please select a beneficiary for this transfer.",
          variant: "destructive",
        });
        return;
      }

      if (selectedBeneficiary === "new" && (!recipientName || !recipientEmail)) {
        toast({
          title: "Missing Information",
          description: "Please fill in the recipient's name and email.",
          variant: "destructive",
        });
        return;
      }

      // Check wallet balance
      if (selectedWallet) {
        const selectedWalletData = wallets.find(w => w.id === selectedWallet);
        if (selectedWalletData) {
          const totalCost = parseFloat(amount) + (fees?.total_fee || 0);
          const hasBalance = selectedWalletData.balance >= totalCost;
          
          if (!hasBalance) {
            toast({
              title: "Insufficient Balance",
              description: `You need $${totalCost.toFixed(2)} but only have $${selectedWalletData.balance.toFixed(2)} in your ${selectedWalletData.currency} wallet.`,
              variant: "destructive",
            });
            return;
          }
        }
      }

      // Create transfer in database
      if (selectedBeneficiary !== "new") {
        const transferData: CreateTransferRequest = {
          beneficiary_id: selectedBeneficiary,
          amount: parseFloat(amount),
          currency: currency,
          speed_tier: speedTier,
          description: `Transfer to ${beneficiaries.find(b => b.id === selectedBeneficiary)?.name || 'beneficiary'}`
        };

        const transferResponse = await transferService.createTransfer(transferData);
        
        if (transferResponse.success && transferResponse.transfer) {
          const recipientInfo = beneficiaries.find(b => b.id === selectedBeneficiary);
          const isWalletToWallet = payoutMethod === "wallet";
          
          toast({
            title: "Transfer Created Successfully!",
            description: `Transfer ${transferResponse.transfer.transfer_reference} to ${recipientInfo?.name} has been created and will arrive ${speedTier === 'express' ? 'instantly' : 'within 1-2 hours'}.`,
          });
          
          // Redirect to tracking page with transfer reference
          navigate(`/user/tracking?ref=${transferResponse.transfer.transfer_reference}`);
        } else {
          toast({
            title: "Transfer Failed",
            description: transferResponse.message || "Failed to create transfer",
            variant: "destructive",
          });
          return;
        }
      } else {
        // For new beneficiaries, just show success message (they need to be added as beneficiary first)
        const recipientInfo = { name: recipientName, email: recipientEmail, phone: recipientPhone };
        
        toast({
          title: "Transfer Initiated!",
          description: `Your transfer to ${recipientInfo.name} is being processed and will arrive ${speedTier === 'express' ? 'instantly' : 'within 1-2 hours'}. Please add this recipient as a beneficiary for future transfers.`,
        });
      }
    } catch (error) {
      toast({
        title: "Transfer Failed",
        description: "There was an error processing your transfer. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation role="user" />
      
      <main className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-1">Send Money</h1>
        </div>

        <div className="grid gap-4 lg:grid-cols-5">
          {/* Transfer Form */}
          <Card className="shadow-card border-none lg:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Transfer Details</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Amount Section */}
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="amount">Transfer Amount (USD)</Label>
                    <div className="relative">
                      <Input
                        id="amount"
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="pl-8 text-lg font-semibold"
                        placeholder="0.00"
                      />
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">
                        $
                      </span>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Wallet Display */}
                <div className="space-y-4">
                  <h3 className="font-semibold">Payment Method</h3>
                  {wallets.length > 0 ? (
                    <div className="flex items-center justify-between p-4 border-2 border-primary rounded-lg bg-primary/5">
                      <div className="flex items-center gap-4">
                        <WalletIcon className="w-5 h-5 text-primary" />
                        <div>
                          <p className="font-medium">{wallets[0].currency} Wallet</p>
                          <p className="text-sm text-muted-foreground">Balance: ${wallets[0].balance.toFixed(2)}</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 border-2 border-dashed border-muted-foreground/25 rounded-lg text-center">
                      <p className="text-sm text-muted-foreground">No wallet available</p>
                      <p className="text-xs text-muted-foreground mt-1">Please create a wallet first</p>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Recipient Details */}
                <div className="space-y-4">
                  <h3 className="font-semibold">Recipient Details</h3>
                  <div className="space-y-2">
                    <Label htmlFor="recipient">Select Beneficiary</Label>
                    <Select value={selectedBeneficiary} onValueChange={handleBeneficiarySelect}>
                      <SelectTrigger id="recipient">
                        <SelectValue placeholder="Choose from saved beneficiaries" />
                      </SelectTrigger>
                      <SelectContent>
                        {beneficiaries.map((beneficiary) => (
                          <SelectItem key={beneficiary.id} value={beneficiary.id}>
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4" />
                              <span>{beneficiary.name}</span>
                              <span className="text-muted-foreground">- {beneficiary.email}</span>
                            </div>
                          </SelectItem>
                        ))}
                        <SelectItem value="new">+ Add New Beneficiary</SelectItem>
                        <SelectItem value="manage">Manage Beneficiaries</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Auto-filled recipient details */}
                  {selectedBeneficiary && selectedBeneficiary !== "new" && (
                    <div className="p-4 bg-muted/50 rounded-lg space-y-3">
                      <div className="flex items-center gap-2 mb-3">
                        <Smartphone className="w-4 h-4 text-primary" />
                        <span className="font-medium text-primary">Wallet-to-Wallet Transfer</span>
                      </div>
                      
                      <div className="grid gap-3">
                        <div className="space-y-1">
                          <Label className="text-sm font-medium">Recipient Name</Label>
                          <Input value={recipientName} readOnly className="bg-muted" />
                        </div>
                        
                        <div className="space-y-1">
                          <Label className="text-sm font-medium">Email</Label>
                          <Input value={recipientEmail} readOnly className="bg-muted" />
                        </div>
                        
                        {recipientPhone && (
                          <div className="space-y-1">
                            <Label className="text-sm font-medium">Phone</Label>
                            <Input value={recipientPhone} readOnly className="bg-muted" />
                          </div>
                        )}
                      </div>
                      
                    </div>
                  )}

                  {/* Manual entry for new beneficiary */}
                  {selectedBeneficiary === "new" && (
                    <div className="space-y-3 p-4 border-2 border-dashed border-muted-foreground/25 rounded-lg">
                      <div className="flex items-center gap-2 mb-3">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium text-muted-foreground">New Recipient</span>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <Label htmlFor="recipient-name">Recipient Name</Label>
                          <Input
                            id="recipient-name"
                            value={recipientName}
                            onChange={(e) => setRecipientName(e.target.value)}
                            placeholder="Enter recipient's full name"
                          />
                        </div>
                        
                        <div className="space-y-1">
                          <Label htmlFor="recipient-email">Email</Label>
                          <Input
                            id="recipient-email"
                            type="email"
                            value={recipientEmail}
                            onChange={(e) => setRecipientEmail(e.target.value)}
                            placeholder="Enter recipient's email"
                          />
                        </div>
                        
                        <div className="space-y-1">
                          <Label htmlFor="recipient-phone">Phone (Optional)</Label>
                          <Input
                            id="recipient-phone"
                            value={recipientPhone}
                            onChange={(e) => setRecipientPhone(e.target.value)}
                            placeholder="Enter recipient's phone number"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Payout Method - only show for new beneficiaries */}
                  {selectedBeneficiary === "new" && (
                    <div className="space-y-2">
                      <Label htmlFor="method">Payout Method</Label>
                      <Select value={payoutMethod} onValueChange={setPayoutMethod}>
                        <SelectTrigger id="method">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="wallet">Mobile Wallet</SelectItem>
                          <SelectItem value="bank">Bank Transfer</SelectItem>
                          <SelectItem value="cash">Cash Pickup</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Transfer Speed */}
                <div className="space-y-4">
                  <h3 className="font-semibold">Transfer Speed</h3>
                  <div className="grid gap-3">
                    <label className={`flex items-center gap-4 p-4 border-2 rounded-lg cursor-pointer transition-smooth ${
                      speedTier === 'express' 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover:border-primary/50'
                    }`}>
                      <input 
                        type="radio" 
                        name="speed" 
                        value="express"
                        checked={speedTier === 'express'}
                        onChange={(e) => setSpeedTier(e.target.value as 'express')}
                        className="w-4 h-4" 
                      />
                      <Zap className={`w-5 h-5 ${speedTier === 'express' ? 'text-primary' : 'text-muted-foreground'}`} />
                      <div className="flex-1">
                        <p className="font-medium">Express (Instantly)</p>
                        
                      </div>
                    </label>
                    <label className={`flex items-center gap-4 p-4 border-2 rounded-lg cursor-pointer transition-smooth ${
                      speedTier === 'standard' 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover:border-primary/50'
                    }`}>
                      <input 
                        type="radio" 
                        name="speed" 
                        value="standard"
                        checked={speedTier === 'standard'}
                        onChange={(e) => setSpeedTier(e.target.value as 'standard')}
                        className="w-4 h-4" 
                      />
                      <Clock className={`w-5 h-5 ${speedTier === 'standard' ? 'text-primary' : 'text-muted-foreground'}`} />
                      <div className="flex-1">
                        <p className="font-medium">Standard (1-2 hours)</p>
                        <p className="text-sm text-muted-foreground">Standard fee</p>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <Button type="submit" className="flex-1" size="lg" disabled={loading}>
                    {loading ? "Processing..." : "Send Now"}
                  </Button>
                 
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Summary Section */}
          <div className="space-y-4 lg:col-span-3">
            {/* Transfer Summary and Wallet Balance in a 2-column layout */}
            <div className="grid gap-4 lg:grid-cols-2">
              <Card className="shadow-card border-none h-fit">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Transfer Summary</CardTitle>
                </CardHeader>
                <CardContent className="pt-0 space-y-3">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Transfer Amount</span>
                      <span className="font-medium">${amount}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Transfer Fee</span>
                      <span className="font-medium">${fees?.total_fee.toFixed(2) || '0.00'}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="text-sm font-semibold">Total Cost</span>
                      <span className="font-bold text-lg">
                        ${(parseFloat(amount) + (fees?.total_fee || 0)).toFixed(2)}
                      </span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-success">
                      <span className="text-sm">Recipient receives</span>
                      <span className="font-semibold">
                        ${parseFloat(amount).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-2 flex gap-2">
                    <Info className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    <div className="text-xs text-muted-foreground">
                      <p className="font-medium text-foreground mb-1">Fast & Secure Transfer</p>
                      <p>Your transfer will be processed securely and delivered based on the speed tier you select.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Wallet Balance Display */}
              {selectedWallet ? (
                <WalletBalanceDisplay
                  selectedWalletId={selectedWallet}
                  wallets={wallets}
                  transferAmount={parseFloat(amount) || 0}
                  fees={fees?.total_fee || 0}
                  currency={currency}
                />
              ) : (
                <Card className="shadow-card border-none">
                  <CardHeader>
                    <CardTitle>Wallet Balance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-sm">Please select a wallet to view balance</p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Fee Calculator and Plan Info */}
            <div className="grid gap-4 lg:grid-cols-2">
              <FeeCalculator
                amount={parseFloat(amount) || 0}
                currency="USD"
                speedTier={speedTier}
                onFeeChange={handleFeeChange}
              />
              
              {/* Plan Info Card */}
              {userPlan && monthlyUsage && (
                <PlanInfoCard
                  planName={userPlan.name}
                  planDisplayName={userPlan.display_name}
                  monthlyLimit={userPlan.monthly_limit}
                  currentUsage={monthlyUsage.current_usage}
                  transferAmount={parseFloat(amount) || 0}
                  transferFee={fees?.total_fee || 0}
                />
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
