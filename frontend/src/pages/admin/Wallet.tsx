import { useState, useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Wallet, DollarSign, TrendingUp, RefreshCw, Loader2, Eye, Download, Filter, Search } from "lucide-react";
import { AdminService } from "@/services/adminService";
import { useToast } from "@/hooks/use-toast";

export default function AdminWallet() {
  const [walletData, setWalletData] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingTransactions, setLoadingTransactions] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [currencyFilter, setCurrencyFilter] = useState("all");
  const [balanceVisible, setBalanceVisible] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadWalletData();
  }, []);

  const loadWalletData = async () => {
    console.log('🔍 AdminWallet: Loading wallet data...');
    try {
      setLoading(true);
      console.log('📡 AdminWallet: Making API calls...');
      
      const [dashboardResponse, transactionsResponse] = await Promise.all([
        AdminService.getDashboard(),
        AdminService.getWalletTransactions()
      ]);
      
      console.log('📊 AdminWallet: Dashboard response:', dashboardResponse);
      console.log('💰 AdminWallet: Transactions response:', transactionsResponse);
      
      if (dashboardResponse) {
        console.log('✅ AdminWallet: Setting wallet data:', dashboardResponse);
        setWalletData(dashboardResponse);
      } else {
        console.warn('⚠️ AdminWallet: No dashboard data received');
      }
      
      if (transactionsResponse && transactionsResponse.transactions) {
        console.log('✅ AdminWallet: Setting transactions:', transactionsResponse.transactions);
        setTransactions(transactionsResponse.transactions);
      } else {
        console.warn('⚠️ AdminWallet: No transactions in response');
      }
    } catch (error) {
      console.error('❌ AdminWallet: Failed to load wallet data:', error);
      toast({
        title: "Error",
        description: "Failed to load wallet data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setLoadingTransactions(false);
      console.log('🏁 AdminWallet: Wallet data loading completed');
    }
  };

  const formatAmount = (amount: number | string) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return isNaN(numAmount) ? '0.00' : numAmount.toFixed(2);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getTransactionTypeColor = (type: string) => {
    switch (type) {
      case 'fee':
        return 'bg-success/10 text-success';
      case 'deposit':
        return 'bg-blue-100 text-blue-800';
      case 'withdrawal':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'fee':
        return <DollarSign className="w-4 h-4 text-green-500" />;
      case 'deposit':
        return <TrendingUp className="w-4 h-4 text-blue-500" />;
      case 'withdrawal':
        return <TrendingUp className="w-4 h-4 text-red-500 rotate-180" />;
      default:
        return <Wallet className="w-4 h-4 text-gray-500" />;
    }
  };

  // Filter transactions
  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = searchQuery === "" || 
      transaction.transaction_reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transaction.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = typeFilter === "all" || transaction.type === typeFilter;
    
    return matchesSearch && matchesType;
  });

  return (
    <div className="min-h-screen bg-background">
      <Navigation role="admin" />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Admin Wallet</h1>
              <p className="text-muted-foreground">Monitor your fee collection and wallet transactions</p>
            </div>
            <Button 
              variant="outline" 
              onClick={() => setBalanceVisible(!balanceVisible)}
              className="flex items-center gap-2"
            >
              <Eye className={`w-4 h-4 ${balanceVisible ? 'text-muted-foreground' : 'text-muted-foreground/50'}`} />
              {balanceVisible ? 'Hide Balances' : 'Show Balances'}
            </Button>
          </div>
        </div>

        {/* Wallet Overview */}
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            <span>Loading wallet data...</span>
          </div>
        ) : walletData ? (
          <div className="grid gap-6 md:grid-cols-3 mb-8">
            {/* Total Balance */}
            <Card className="shadow-card border-none">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-muted-foreground">Total Balance</p>
                  <Wallet className="w-5 h-5 text-primary" />
                </div>
                <p className="text-3xl font-bold">
                  {balanceVisible ? `$${formatAmount(walletData.statistics?.admin_wallet_balance || 0)}` : '••••••'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">All currencies combined</p>
              </CardContent>
            </Card>

            {/* Completed Transfers */}
            <Card className="shadow-card border-none">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-muted-foreground">Completed Transfers</p>
                  <TrendingUp className="w-5 h-5 text-success" />
                </div>
                <p className="text-3xl font-bold">{walletData.statistics?.completed_transfers || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">Total processed</p>
              </CardContent>
            </Card>

            {/* Total Volume */}
            <Card className="shadow-card border-none">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-muted-foreground">Total Volume</p>
                  <DollarSign className="w-5 h-5 text-blue-500" />
                </div>
                <p className="text-3xl font-bold">${formatAmount(walletData.statistics?.total_volume || 0)}</p>
                <p className="text-xs text-muted-foreground mt-1">All transfers</p>
              </CardContent>
            </Card>
          </div>
        ) : null}

        {/* Wallet Balances by Currency */}
        {walletData && walletData.wallets && (
          <Card className="shadow-card border-none mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="w-5 h-5 text-primary" />
                Wallet Balances
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {walletData.wallets.map((wallet: any) => (
                  <div key={wallet.id} className="p-4 rounded-lg border border-border">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Balance</span>
                      <Badge variant="outline" className="bg-success/10 text-success">
                        {wallet.currency}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-2xl font-bold">
                        {balanceVisible ? `$${wallet.formatted_balance}` : '••••••'}
                      </p>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setBalanceVisible(!balanceVisible)}
                        title={balanceVisible ? "Hide balance" : "Show balance"}
                      >
                        <Eye className={`w-4 h-4 ${balanceVisible ? 'text-muted-foreground' : 'text-muted-foreground/50'}`} />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {wallet.is_active ? 'Active' : 'Inactive'} • Fee Collection
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Transaction Filters */}
        <Card className="shadow-card border-none mb-6">
          <CardContent className="p-6">
            <div className="grid gap-4 md:grid-cols-4">
              <div className="relative md:col-span-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder="Search transactions..." 
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="fee">Fee Collection</SelectItem>
                  <SelectItem value="deposit">Deposits</SelectItem>
                  <SelectItem value="withdrawal">Withdrawals</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Transactions Table */}
        <Card className="shadow-card border-none">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Wallet Transactions ({filteredTransactions.length})</CardTitle>
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loadingTransactions ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin mr-2" />
                <span>Loading transactions...</span>
              </div>
            ) : filteredTransactions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Wallet className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No transactions found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredTransactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="p-4 rounded-lg border border-border hover:bg-muted/50 transition-smooth"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {getTransactionIcon(transaction.type)}
                        <div>
                          <h3 className="font-semibold">{transaction.transaction_reference}</h3>
                          <p className="text-sm text-muted-foreground">{transaction.description}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold">
                          {transaction.type === 'withdrawal' ? '-' : '+'}${formatAmount(transaction.amount)}
                        </p>
                        <Badge className={getTransactionTypeColor(transaction.type)}>
                          {transaction.type}
                        </Badge>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                      <div>
                        <p>Balance Before: ${formatAmount(transaction.balance_before)}</p>
                        <p>Balance After: ${formatAmount(transaction.balance_after)}</p>
                      </div>
                      <div className="text-right">
                        <p>{formatDate(transaction.created_at)}</p>
                        {transaction.metadata && (
                          <p className="text-xs">
                            Transfer: {transaction.metadata.transfer_reference}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
