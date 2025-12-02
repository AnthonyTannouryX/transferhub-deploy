import { useState, useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  ArrowDownToLine, 
  ArrowUpFromLine, 
  DollarSign, 
  TrendingUp, 
  Clock, 
  Users, 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  RefreshCw, 
  Download, 
  Eye,
  Search,
  Wallet,
  Banknote,
  Calculator,
  Receipt,
  User,
  Phone,
  CreditCard,
  AlertCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AgentService, Customer, CashStatus, TransactionResult, FeeCalculation } from "@/services/agentService";
import { userService, User as UserType } from "@/services/userService";

export default function CashOperations() {
  const { toast } = useToast();
  
  // State management
  const [cashStatus, setCashStatus] = useState<CashStatus | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [transactionType, setTransactionType] = useState<"cash_in" | "cash_out">("cash_in");
  const [isProcessing, setIsProcessing] = useState(false);
  const [feeCalculation, setFeeCalculation] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [addCashAmount, setAddCashAmount] = useState("");
  const [isAddingCash, setIsAddingCash] = useState(false);
  const [digitalWalletBalance, setDigitalWalletBalance] = useState(0);

  // Load initial data
  useEffect(() => {
    loadCashStatus();
    loadDigitalWalletBalance();
  }, []);

  // Load cash status
  const loadCashStatus = async () => {
    try {
      const data = await AgentService.getCashStatus();
      setCashStatus(data);
    } catch (error) {
      console.error('Error loading cash status:', error);
      toast({
        title: "Error",
        description: "Failed to load cash status",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Search customers using the same method as beneficiary search
  const searchCustomers = async (query: string) => {
    if (query.length < 2) {
      setCustomers([]);
      return;
    }
    
    try {
      const response = await userService.searchUsers(query);
      
      if (response && response.success) {
        // Filter to only show personal users (customers)
        const customerUsers = response.users.filter((user: UserType) => user.user_type === 'personal');
        
        // Convert UserType objects to Customer objects
        const customers: Customer[] = customerUsers.map((user: UserType) => ({
          id: user.id,
          first_name: user.name.split(' ')[0] || '',
          last_name: user.name.split(' ').slice(1).join(' ') || '',
          phone: user.phone,
          email: user.email,
          status: user.status
        }));
        
        setCustomers(customers);
      } else {
        setCustomers([]);
        toast({
          title: "Search Error",
          description: response?.message || "Failed to search customers",
          variant: "destructive",
        });
      }
    } catch (error) {
      setCustomers([]);
      toast({
        title: "Error",
        description: "Failed to search customers",
        variant: "destructive",
      });
    }
  };

  // Calculate fees
  const calculateFees = async (amountValue?: string) => {
    const currentAmount = amountValue || amount;
    
    if (!currentAmount || !transactionType) return;
    
    try {
      const numericAmount = parseFloat(currentAmount);
      
      if (isNaN(numericAmount) || numericAmount <= 0) return;
      
      console.log('🔍 Calculating fees:', { amount: numericAmount, currency, transactionType });
      
      const data = await AgentService.calculateFees(numericAmount, currency, transactionType);
      
      console.log('✅ Fee calculation response:', data);
      console.log('📊 Breakdown:', {
        transactionAmount: data?.transaction_amount,
        customerFee: data?.customer_fee,
        agentCommission: data?.agent_commission,
        systemRevenue: data?.system_revenue,
        adminFee: data?.admin_fee,
        agentDeposit: data?.agent_deposit_to_digital_wallet,
        customerGetsCash: data?.customer_gets_cash,
        customerPaysTotal: data?.customer_pays_total,
        totalCost: data?.total_cost_to_customer
      });
      
      setFeeCalculation(data);
    } catch (error) {
      console.error('❌ Error calculating fees:', error);
      toast({
        title: "Error",
        description: "Failed to calculate fees",
        variant: "destructive",
      });
    }
  };

  // Process transaction
  const processTransaction = async () => {
    if (!selectedCustomer || !amount) return;
    
    setIsProcessing(true);
    try {
      // Ensure amount is properly formatted as decimal
      const numericAmount = parseFloat(amount);
      if (isNaN(numericAmount) || numericAmount <= 0) {
        toast({
          title: "Invalid Amount",
          description: "Please enter a valid amount",
          variant: "destructive",
        });
        setIsProcessing(false);
        return;
      }
      
      const data = transactionType === "cash_in" 
        ? await AgentService.processCashIn(selectedCustomer.phone, numericAmount, currency)
        : await AgentService.processCashOut(selectedCustomer.phone, numericAmount, currency);
      
      toast({
        title: "Transaction Completed",
        description: `${transactionType === "cash_in" ? "Cash-in" : "Cash-out"} processed successfully!`,
      });
      
      // Reset form
      setSelectedCustomer(null);
      setAmount("");
      setFeeCalculation(null);
      setSearchQuery("");
      
      // Reload data
      loadCashStatus();
      loadDigitalWalletBalance();
    } catch (error: any) {
      console.error('Error processing transaction:', error);
      toast({
        title: "Transaction Failed",
        description: error.response?.data?.message || "An error occurred while processing the transaction.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };


  // Load digital wallet balance
  const loadDigitalWalletBalance = async () => {
    try {
      const data = await AgentService.getDigitalWalletBalance();
      setDigitalWalletBalance(data.balance || 0);
    } catch (error) {
      console.error('Error loading digital wallet balance:', error);
      setDigitalWalletBalance(0);
    }
  };

  // Handle adding cash
  const handleAddCash = async () => {
    if (!addCashAmount || parseFloat(addCashAmount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount to add",
        variant: "destructive",
      });
      return;
    }

    setIsAddingCash(true);
    try {
      await AgentService.addCash(parseFloat(addCashAmount), currency, "Cash deposit by agent");
      
      toast({
        title: "Cash Added Successfully",
        description: `Added $${parseFloat(addCashAmount).toFixed(2)} to your cash balance`,
      });
      
      setAddCashAmount("");
      loadCashStatus();
    } catch (error: any) {
      console.error('Error adding cash:', error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to add cash",
        variant: "destructive",
      });
    } finally {
      setIsAddingCash(false);
    }
  };


  // Handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.length >= 2) {
      searchCustomers(query);
    } else {
      setCustomers([]);
    }
  };

  // Handle amount change
  const handleAmountChange = (value: string) => {
    setAmount(value);
    
    if (value && parseFloat(value) > 0) {
      calculateFees(value);
    } else {
      setFeeCalculation(null);
    }
  };


  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation role="agent" />
        <main className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Loading cash status...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation role="agent" />
      
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Agent Cash Operations</h1>
              <p className="text-muted-foreground">Automated cash-in and cash-out processing</p>
            </div>
          </div>
        </div>

        {/* Cash Status Overview */}
        {cashStatus ? (
          <div className="grid gap-6 md:grid-cols-3 mb-8">
            <Card className="shadow-card border-none">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Physical Cash</p>
                    <p className="text-2xl font-bold text-primary">
                      ${(Number(cashStatus?.current_cash_balance) || 0).toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground">{cashStatus?.cash_currency || 'USD'}</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Banknote className="w-6 h-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="shadow-card border-none">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Digital Wallet</p>
                    <p className="text-2xl font-bold text-success">
                      ${digitalWalletBalance.toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground">Available</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                    <Wallet className="w-6 h-6 text-success" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="shadow-card border-none">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Status</p>
                    <p className="text-lg font-bold">
                      {cashStatus?.can_process_cash_out ? "Ready" : "Needs Cash"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {cashStatus?.needs_funding ? "Add physical cash" : "Operational"}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center">
                    {cashStatus?.can_process_cash_out ? (
                      <CheckCircle className="w-6 h-6 text-success" />
                    ) : (
                      <AlertTriangle className="w-6 h-6 text-warning" />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-3 mb-8">
            <Card className="shadow-card border-none">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Physical Cash</p>
                    <p className="text-2xl font-bold text-primary">Loading...</p>
                    <p className="text-xs text-muted-foreground">USD</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Banknote className="w-6 h-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="shadow-card border-none">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Digital Wallet</p>
                    <p className="text-2xl font-bold text-success">${digitalWalletBalance.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">Available</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                    <Wallet className="w-6 h-6 text-success" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="shadow-card border-none">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Status</p>
                    <p className="text-lg font-bold">Loading...</p>
                    <p className="text-xs text-muted-foreground">Please wait</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center">
                    <RefreshCw className="w-6 h-6 text-warning animate-spin" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Cash Status Alert */}
        {cashStatus?.needs_funding && (
          <Alert className="mb-6 border-warning/20 bg-warning/5">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Low Cash Balance:</strong> You need to add physical cash to your store to process cash-out transactions. 
              <Button variant="link" className="p-0 h-auto ml-2">
                Add Cash Now
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Cash Management Section */}
        <Card className="shadow-card border-none mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Banknote className="w-5 h-5" />
              Cash Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-w-md">
              <div className="space-y-2">
                <Label>Add Cash</Label>
                <div className="flex gap-2">
                  <Input 
                    placeholder="Amount" 
                    type="number"
                    value={addCashAmount}
                    onChange={(e) => setAddCashAmount(e.target.value)}
                    className="flex-1"
                    disabled={isAddingCash}
                  />
                  <Button 
                    size="sm" 
                    onClick={handleAddCash}
                    disabled={isAddingCash || !addCashAmount}
                  >
                    {isAddingCash ? "Adding..." : "Add"}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">Add more physical cash to your store</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6">
          {/* Transaction Form */}
          <Card className="shadow-card border-none">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="w-5 h-5" />
                Process Transaction
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={transactionType} onValueChange={(value) => {
                setTransactionType(value as "cash_in" | "cash_out");
                setAmount("");
                setFeeCalculation(null);
              }} className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="cash_in" className="gap-2">
                    <ArrowDownToLine className="w-4 h-4" />
                    Cash In
                  </TabsTrigger>
                  <TabsTrigger value="cash_out" className="gap-2">
                    <ArrowUpFromLine className="w-4 h-4" />
                    Cash Out
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="cash_in">
                  <div className="space-y-6">
                    {/* Customer Search */}
                    <div className="space-y-2">
                      <Label htmlFor="customer-search">Search Customer</Label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                        <Input
                          id="customer-search"
                          placeholder="Enter phone number or email..."
                          value={searchQuery}
                          onChange={(e) => handleSearch(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                      
                      {/* Customer Results */}
                      {customers.length > 0 && (
                        <div className="border rounded-lg p-2 space-y-2 max-h-40 overflow-y-auto">
                          {customers.map((customer) => (
                            <div
                              key={customer.id}
                              className="flex items-center justify-between p-2 hover:bg-muted rounded cursor-pointer"
                              onClick={() => setSelectedCustomer(customer)}
                            >
                              <div>
                                <p className="font-medium">{customer.first_name} {customer.last_name}</p>
                                <p className="text-sm text-muted-foreground">{customer.phone}</p>
                              </div>
                              <Badge variant={customer.status === "active" ? "default" : "secondary"}>
                                {customer.status}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Selected Customer */}
                      {selectedCustomer && (
                        <div className="bg-success/5 border border-success/20 rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <User className="w-4 h-4 text-success" />
                            <span className="font-medium text-success">Customer Selected</span>
                          </div>
                          <p className="font-medium">{selectedCustomer.first_name} {selectedCustomer.last_name}</p>
                          <p className="text-sm text-muted-foreground">{selectedCustomer.phone}</p>
                        </div>
                      )}
                    </div>

                    {/* Amount Input */}
                    <div className="space-y-2">
                      <Label htmlFor="amount">Amount</Label>
                      <div className="relative">
                        <Input
                          id="amount"
                          type="text"
                          placeholder="0.00"
                          value={amount}
                          onChange={(e) => handleAmountChange(e.target.value)}
                          className="pl-8"
                        />
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                      </div>
                    </div>

                    {/* Fee Calculation - Cash In */}
                    {feeCalculation && transactionType === 'cash_in' && (
                      <div className="bg-muted/50 border rounded-lg p-4 space-y-3">
                        <h4 className="font-medium flex items-center gap-2">
                          <Calculator className="w-4 h-4" />
                          Transaction Breakdown
                        </h4>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Customer gets:</p>
                            <p className="font-semibold">${(Number(feeCalculation.transaction_amount) || 0).toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Customer pays:</p>
                            <p className="font-semibold">${(Number(feeCalculation.total_cost_to_customer) || 0).toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Your commission:</p>
                            <p className="font-semibold text-success">${(Number(feeCalculation.agent_commission) || 0).toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Admin revenue:</p>
                            <p className="font-semibold text-primary">${(Number(feeCalculation.system_revenue) || 0).toFixed(2)}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    <Button 
                      onClick={processTransaction}
                      disabled={!selectedCustomer || !amount || isProcessing}
                      className="w-full" 
                      size="lg"
                    >
                      {isProcessing ? "Processing..." : "Process Cash In"}
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="cash_out">
                  <div className="space-y-6">
                    {/* Customer Search */}
                    <div className="space-y-2">
                      <Label htmlFor="customer-search-out">Search Customer</Label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                        <Input
                          id="customer-search-out"
                          placeholder="Enter phone number or email..."
                          value={searchQuery}
                          onChange={(e) => handleSearch(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                      
                      {/* Customer Results */}
                      {customers.length > 0 && (
                        <div className="border rounded-lg p-2 space-y-2 max-h-40 overflow-y-auto">
                          {customers.map((customer) => (
                            <div
                              key={customer.id}
                              className="flex items-center justify-between p-2 hover:bg-muted rounded cursor-pointer"
                              onClick={() => setSelectedCustomer(customer)}
                            >
                              <div>
                                <p className="font-medium">{customer.first_name} {customer.last_name}</p>
                                <p className="text-sm text-muted-foreground">{customer.phone}</p>
                              </div>
                              <Badge variant={customer.status === "active" ? "default" : "secondary"}>
                                {customer.status}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Selected Customer */}
                      {selectedCustomer && (
                        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <User className="w-4 h-4 text-primary" />
                            <span className="font-medium text-primary">Customer Selected</span>
                          </div>
                          <p className="font-medium">{selectedCustomer.first_name} {selectedCustomer.last_name}</p>
                          <p className="text-sm text-muted-foreground">{selectedCustomer.phone}</p>
                        </div>
                      )}
                    </div>

                    {/* Amount Input */}
                    <div className="space-y-2">
                      <Label htmlFor="amount-out">Amount to Disburse</Label>
                      <div className="relative">
                        <Input
                          id="amount-out"
                          type="text"
                          placeholder="0.00"
                          value={amount}
                          onChange={(e) => handleAmountChange(e.target.value)}
                          className="pl-8"
                        />
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                      </div>
                    </div>

                    {/* Fee Calculation - Cash Out */}
                    {feeCalculation && transactionType === 'cash_out' && (
                      <div className="bg-muted/50 border rounded-lg p-4 space-y-3">
                        <h4 className="font-medium flex items-center gap-2">
                          <Calculator className="w-4 h-4" />
                          Transaction Breakdown
                        </h4>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Customer gets cash:</p>
                            <p className="font-semibold">${(Number(feeCalculation.customer_gets_cash || feeCalculation.transaction_amount) || 0).toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Customer pays:</p>
                            <p className="font-semibold">${(Number(feeCalculation.customer_pays_total || feeCalculation.total_cost_to_customer) || 0).toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">You deposit to digital:</p>
                            <p className="font-semibold text-success">${(Number(feeCalculation.agent_deposit_to_digital_wallet) || 0).toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">You pay admin:</p>
                            <p className="font-semibold text-primary">${(Number(feeCalculation.admin_fee) || 0).toFixed(2)}</p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Fee Calculation - Cash In */}
                    {feeCalculation && transactionType === 'cash_in' && (
                      <div className="bg-muted/50 border rounded-lg p-4 space-y-3">
                        <h4 className="font-medium flex items-center gap-2">
                          <Calculator className="w-4 h-4" />
                          Transaction Breakdown
                        </h4>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Customer gets:</p>
                            <p className="font-semibold">${(Number(feeCalculation.transaction_amount) || 0).toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Customer pays:</p>
                            <p className="font-semibold">${(Number(feeCalculation.total_cost_to_customer) || 0).toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Your commission:</p>
                            <p className="font-semibold text-success">${(Number(feeCalculation.agent_commission) || 0).toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Admin revenue:</p>
                            <p className="font-semibold text-primary">${(Number(feeCalculation.system_revenue) || 0).toFixed(2)}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    <Button 
                      onClick={processTransaction}
                      disabled={!selectedCustomer || !amount || isProcessing || !cashStatus?.can_process_cash_out}
                      className="w-full" 
                      size="lg"
                    >
                      {isProcessing ? "Processing..." : "Process Cash Out"}
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}