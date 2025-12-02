import { useState, useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { WalletBalanceCard } from "@/components/WalletBalanceCard";
import { WalletTransactionItem } from "@/components/WalletTransactionItem";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Minus, ArrowUpRight, Wallet as WalletIcon, TrendingUp, History } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { walletService, Wallet as WalletType, WalletTransaction } from "@/services/walletService";
import { useAuth } from "@/hooks/useAuth";

export default function Wallet() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [wallets, setWallets] = useState<WalletType[]>([]);
  const [walletTransactions, setWalletTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  // Helper function to safely format amounts
  const formatAmount = (amount: number | string): string => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return isNaN(numAmount) ? '0.00' : numAmount.toFixed(2);
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadWalletData();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const loadWalletData = async () => {
    console.log('🔍 Wallet: Loading wallet data...');
    try {
      console.log('📡 Wallet: Making API calls...');
      
      const [walletsData, transactionsData] = await Promise.all([
        walletService.getWallets(),
        walletService.getTransactions()
      ]);
      
      console.log('💰 Wallet: Wallets data received:', walletsData);
      console.log('📊 Wallet: Transactions data received:', transactionsData);
      
      setWallets(walletsData || []);
      setWalletTransactions(transactionsData || []);
      
      console.log('✅ Wallet: Data set successfully');
      console.log('💰 Wallet: Wallets count:', (walletsData || []).length);
      console.log('📊 Wallet: Transactions count:', (transactionsData || []).length);
    } catch (error) {
      console.error('❌ Wallet: Failed to load wallet data:', error);
      console.error('❌ Wallet: Error details:', error);
      // Set empty arrays as fallback
      setWallets([]);
      setWalletTransactions([]);
    } finally {
      setLoading(false);
      console.log('🏁 Wallet: Data loading completed');
    }
  };

  const handleWalletDeposit = (wallet: WalletType) => {
    // Navigate to settings page for deposits
    navigate('/settings');
  };

  const handleWalletWithdraw = (wallet: WalletType) => {
    // Navigate to new transfer page for withdrawals
    navigate('/user/new-transfer');
  };

  const totalBalance = wallets ? wallets.reduce((sum, wallet) => {
    console.log('💰 Wallet: Calculating balance - wallet:', wallet.currency, 'balance:', wallet.balance, 'running sum:', sum);
    return sum + wallet.balance;
  }, 0) : 0;
  
  console.log('💰 Wallet: Total balance calculated:', totalBalance);
  console.log('💰 Wallet: Wallets array:', wallets);

  return (
    <div className="min-h-screen bg-background">
      <Navigation role="user" />
      
      <main className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Header with Total Balance */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold">My Wallet</h1>
              <p className="text-muted-foreground text-sm">Manage your wallet balance</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-primary">${totalBalance.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">Total Balance</p>
            </div>
          </div>
          
          {/* Quick Actions */}
          <div className="flex gap-2 mb-4">
            <Button variant="outline" size="sm" className="h-8" onClick={() => navigate('/settings')}>
              <Plus className="w-4 h-4 mr-1" />
              Add Funds
            </Button>
            <Button variant="outline" size="sm" className="h-8" onClick={() => setActiveTab('overview')}>
              <WalletIcon className="w-4 h-4 mr-1" />
              Manage
            </Button>
            <Button variant="outline" size="sm" className="h-8" onClick={() => navigate('/user/history')}>
              <History className="w-4 h-4 mr-1" />
              History
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 h-9">
            <TabsTrigger value="overview" className="text-sm">Overview</TabsTrigger>
            <TabsTrigger value="transactions" className="text-sm">Transactions</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {/* Wallet Summary Cards */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="shadow-card border-none">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Balance</p>
                      <p className="text-3xl font-bold">${totalBalance.toFixed(2)}</p>
                    </div>
                    <div className="w-12 h-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                      <WalletIcon className="w-6 h-6" />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">Across all currencies</p>
                </CardContent>
              </Card>

              <Card className="shadow-card border-none">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Wallet Status</p>
                      <p className="text-3xl font-bold">{wallets.filter(w => w.is_active).length > 0 ? 'Active' : 'Inactive'}</p>
                    </div>
                    <div className="w-12 h-12 rounded-lg bg-success/10 text-success flex items-center justify-center">
                      <TrendingUp className="w-6 h-6" />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">Available for transactions</p>
                </CardContent>
              </Card>

              <Card className="shadow-card border-none">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Transactions</p>
                      <p className="text-3xl font-bold">{walletTransactions.length}</p>
                    </div>
                    <div className="w-12 h-12 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                      <History className="w-6 h-6" />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">All time activity</p>
                </CardContent>
              </Card>
            </div>

            {/* Individual Wallet */}
            {wallets && wallets.length > 0 ? (
              <div>
                <h3 className="text-lg font-semibold mb-4">Your Wallet</h3>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {wallets.map((wallet) => (
                    <WalletBalanceCard
                      key={wallet.id}
                      wallet={wallet}
                      onDeposit={handleWalletDeposit}
                      onWithdraw={handleWalletWithdraw}
                      className="h-fit"
                    />
                  ))}
                </div>
              </div>
            ) : (
              <Card className="shadow-card border-none">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
                    <WalletIcon className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">No Wallet Found</h3>
                  <p className="text-muted-foreground mb-4">You don't have a wallet yet. Your wallet will appear here once created.</p>
                </CardContent>
              </Card>
            )}

            {/* Recent Activity Summary */}
            {walletTransactions && walletTransactions.length > 0 && (
              <Card className="shadow-card border-none">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {walletTransactions.slice(0, 3).map((transaction) => (
                      <div key={transaction.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            transaction.type === 'deposit' ? 'bg-success/10 text-success' :
                            transaction.type === 'withdraw' ? 'bg-warning/10 text-warning' :
                            'bg-blue-100 text-blue-600'
                          }`}>
                            {transaction.type === 'deposit' ? (
                              <Plus className="w-4 h-4" />
                            ) : transaction.type === 'withdraw' ? (
                              <Minus className="w-4 h-4" />
                            ) : (
                              <ArrowUpRight className="w-4 h-4" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium capitalize text-sm">
                              {transaction.type.replace('_', ' ')}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(transaction.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-semibold ${
                            transaction.type === 'deposit' || transaction.type === 'transfer_in' 
                              ? 'text-success' 
                              : 'text-warning'
                          }`}>
                            {transaction.type === 'deposit' || transaction.type === 'transfer_in' ? '+' : '-'}
                            ${formatAmount(transaction.amount)}
                          </p>
                        </div>
                      </div>
                    ))}
                    {walletTransactions.length > 3 && (
                      <div className="text-center pt-2">
                        <Button variant="ghost" size="sm" onClick={() => setActiveTab('transactions')}>
                          View All Transactions
                          <ArrowUpRight className="w-3 h-3 ml-1" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="transactions" className="space-y-4">
            {/* Transaction Statistics */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card className="shadow-card border-none">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Transactions</p>
                      <p className="text-2xl font-bold">{walletTransactions.length}</p>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                      <History className="w-5 h-5" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-card border-none">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Deposits</p>
                      <p className="text-2xl font-bold text-success">
                        {walletTransactions.filter(t => t.type === 'deposit').length}
                      </p>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-success/10 text-success flex items-center justify-center">
                      <Plus className="w-5 h-5" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-card border-none">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Withdrawals</p>
                      <p className="text-2xl font-bold text-warning">
                        {walletTransactions.filter(t => t.type === 'withdraw').length}
                      </p>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-warning/10 text-warning flex items-center justify-center">
                      <Minus className="w-5 h-5" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-card border-none">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Transfers</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {walletTransactions.filter(t => t.type === 'transfer_in' || t.type === 'transfer_out').length}
                      </p>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                      <ArrowUpRight className="w-5 h-5" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Transactions Table */}
            <Card className="shadow-card border-none">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <History className="w-4 h-4 text-primary" />
                    Transaction History
                  </CardTitle>
                  <Link to="/user/history">
                    <Button variant="ghost" size="sm" className="h-8">
                      View All
                      <ArrowUpRight className="w-3 h-3 ml-1" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {walletTransactions && walletTransactions.length > 0 ? (
                  <div className="space-y-3">
                    {walletTransactions.map((transaction) => (
                      <div
                        key={transaction.id}
                        className="p-4 rounded-lg border border-border hover:bg-muted/50 transition-smooth"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              transaction.type === 'deposit' ? 'bg-success/10 text-success' :
                              transaction.type === 'withdraw' ? 'bg-warning/10 text-warning' :
                              'bg-blue-100 text-blue-600'
                            }`}>
                              {transaction.type === 'deposit' ? (
                                <Plus className="w-5 h-5" />
                              ) : transaction.type === 'withdraw' ? (
                                <Minus className="w-5 h-5" />
                              ) : (
                                <ArrowUpRight className="w-5 h-5" />
                              )}
                            </div>
                            <div>
                              <h3 className="font-semibold capitalize">
                                {transaction.type.replace('_', ' ')}
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                {transaction.description}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`text-lg font-bold ${
                              transaction.type === 'deposit' || transaction.type === 'transfer_in' 
                                ? 'text-success' 
                                : 'text-warning'
                            }`}>
                              {transaction.type === 'deposit' || transaction.type === 'transfer_in' ? '+' : '-'}
                              ${formatAmount(transaction.amount)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(transaction.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                          <div>
                            <p>Transaction ID: <span className="font-mono text-xs">{transaction.id.slice(0, 8)}...</span></p>
                            <p>Balance After: <span className="font-semibold">${formatAmount(transaction.balance_after)}</span></p>
                          </div>
                          <div className="text-right">
                            <p>Time: {new Date(transaction.created_at).toLocaleTimeString()}</p>
                            <p>Type: <span className="capitalize">{transaction.type.replace('_', ' ')}</span></p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
                      <History className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">No Transactions Yet</h3>
                    <p className="text-muted-foreground mb-4">Your transaction history will appear here once you start using your wallet.</p>
                    <Button variant="outline" onClick={() => setActiveTab('actions')}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Funds
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
