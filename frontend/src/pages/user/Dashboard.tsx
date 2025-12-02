import { useState, useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { StatCard } from "@/components/StatCard";
import { WalletBalanceCard } from "@/components/WalletBalanceCard";
import { WalletTransactionItem } from "@/components/WalletTransactionItem";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Send, TrendingUp, Clock, CheckCircle2, ArrowUpRight, Bell, MapPin, Globe, CreditCard, Smartphone, AlertCircle, Star, DollarSign, Users, Zap, Wallet as WalletIcon, Plus, Minus, Search, Filter } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { walletService, Wallet, WalletTransaction } from "@/services/walletService";
import { transferService, Transfer } from "@/services/transferService";
import { useAuth } from "@/hooks/useAuth";

export default function UserDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [walletTransactions, setWalletTransactions] = useState<WalletTransaction[]>([]);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState({
    totalTransferred: 0,
    totalTransfers: 0,
    completedTransfers: 0,
    pendingTransfers: 0,
    processingTransfers: 0,
  });

  useEffect(() => {
    loadWalletData();
  }, []);

  const loadWalletData = async () => {
    try {
      const [walletsData, transactionsData, dashboardStats, transfersData] = await Promise.all([
        walletService.getWallets(),
        walletService.getTransactions(undefined, 3),
        transferService.getDashboardStats(),
        transferService.getTransfers()
      ]);
      setWallets(walletsData || []);
      setWalletTransactions(transactionsData || []);
      setTransfers((transfersData?.transfers || []).slice(0, 3)); // Get latest 3 transfers
      
      // Set statistics from dashboard API
      if (dashboardStats?.success && dashboardStats?.statistics) {
        setStatistics({
          totalTransferred: dashboardStats.statistics.total_transferred || 0,
          totalTransfers: dashboardStats.statistics.total_transfers || 0,
          completedTransfers: dashboardStats.statistics.completed_transfers || 0,
          pendingTransfers: dashboardStats.statistics.pending_transfers || 0,
          processingTransfers: dashboardStats.statistics.processing_transfers || 0,
        });
      }
    } catch (error) {
      console.error('Failed to load wallet data:', error);
      setWallets([]);
      setWalletTransactions([]);
      setTransfers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleWalletDeposit = (wallet: Wallet) => {
    // Redirect to settings page for deposit
    navigate('/settings');
  };

  const handleWalletWithdraw = (wallet: Wallet) => {
    // TODO: Implement wallet withdraw modal/page - will be implemented later
    console.log('Withdraw from wallet:', wallet);
  };

  const handleWalletAction = (action: string) => {
    switch (action) {
      case 'deposit':
        // Redirect to settings page for deposit
        navigate('/settings');
        break;
      case 'withdraw':
        // TODO: Implement withdraw functionality later
        console.log('Withdraw functionality will be implemented later');
        break;
      case 'transfer':
        // Redirect to new transfer page
        navigate('/user/new-transfer');
        break;
      default:
        console.log('Unknown wallet action:', action);
    }
  };

  // Get personalized greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  // Format currency
  const formatCurrency = (amount: number | string, currency: string = "USD") => {
    const num = parseFloat(String(amount));
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(num);
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${Math.floor(diffInHours)}h ago`;
    if (diffInHours < 48) return "Yesterday";
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Get status badge class
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-success/10 text-success border-success/20';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'pending':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-muted/10 text-muted-foreground border-muted';
    }
  };

  const handleTransferClick = (transferId: string) => {
    navigate(`/user/tracking?ref=${transferId}`);
  };


  const quickActions = [
    { title: "Track Transfer", description: "Monitor your transfers", icon: Clock, link: "/user/tracking", color: "secondary" },
    { title: "Find Agents", description: "Locate nearby agent stores", icon: MapPin, link: "/user/agents", color: "success" },
    { title: "Add Beneficiary", description: "Save recipient details", icon: Users, link: "/user/beneficiaries", color: "warning" },
  ];

  const walletActions = [
    { title: "Deposit Funds", description: "Add money to your wallet", icon: Plus, action: "deposit", color: "success" },
    { title: "Withdraw Funds", description: "Cash out to your bank", icon: Minus, action: "withdraw", color: "warning" },
    { title: "Wallet Transfer", description: "Send from wallet", icon: WalletIcon, action: "transfer", color: "primary" },
  ];

  // Exchange rates are now handled by LiveExchangeRates component

  return (
    <div className="min-h-screen bg-background">
      <Navigation role="user" />
      
      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              {getGreeting()}{user?.first_name ? `, ${user.first_name}` : ' there'}!
            </h1>
            <p className="text-muted-foreground">Here's your transfer activity overview</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <StatCard
            title="Total Transferred"
            value={`$${statistics.totalTransferred.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            icon={TrendingUp}
            variant="default"
          />
          <StatCard
            title="Pending Transfers"
            value={statistics.pendingTransfers.toString()}
            icon={Clock}
            variant="warning"
          />
          <StatCard
            title="Completed"
            value={statistics.completedTransfers.toString()}
            icon={CheckCircle2}
            variant="success"
          />
          <StatCard
            title="Total Transfers"
            value={statistics.totalTransfers.toString()}
            icon={Send}
            variant="default"
          />
        </div>

        {/* Wallet Actions */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-4">Wallet Actions</h3>
          <div className="grid gap-4 md:grid-cols-3">
            {walletActions.map((action, index) => {
              const Icon = action.icon;
              const colorClasses = {
                primary: "bg-primary/10 group-hover:bg-primary text-primary group-hover:text-white",
                secondary: "bg-secondary/10 group-hover:bg-secondary text-secondary group-hover:text-white",
                success: "bg-success/10 group-hover:bg-success text-success group-hover:text-white",
                warning: "bg-warning/10 group-hover:bg-warning text-warning group-hover:text-white",
              };
              
              return (
                <Card 
                  key={index} 
                  className="shadow-card hover:shadow-elegant transition-smooth cursor-pointer group border-none"
                  onClick={() => handleWalletAction(action.action)}
                >
                  <CardContent className="p-6">
                    <div className={`w-12 h-12 rounded-xl ${colorClasses[action.color as keyof typeof colorClasses]} flex items-center justify-center mb-4 transition-smooth`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2 transition-smooth">{action.title}</h3>
                    <p className="text-muted-foreground text-sm transition-smooth">
                      {action.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            const colorClasses = {
              primary: "bg-primary/10 group-hover:bg-primary text-primary group-hover:text-white",
              secondary: "bg-secondary/10 group-hover:bg-secondary text-secondary group-hover:text-white",
              success: "bg-success/10 group-hover:bg-success text-success group-hover:text-white",
              warning: "bg-warning/10 group-hover:bg-warning text-warning group-hover:text-white",
            };
            
            return (
              <Link key={index} to={action.link}>
                <Card className="shadow-card hover:shadow-elegant transition-smooth cursor-pointer group border-none">
                  <CardContent className="p-6">
                    <div className={`w-12 h-12 rounded-xl ${colorClasses[action.color as keyof typeof colorClasses]} flex items-center justify-center mb-4 transition-smooth`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2 transition-smooth">{action.title}</h3>
                    <p className="text-muted-foreground text-sm transition-smooth">
                      {action.description}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* Recent Transactions */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Transfer Transactions */}
          <Card className="shadow-card border-none">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Recent Transfers</CardTitle>
              <div className="flex gap-2">
                <Link to="/user/history">
                  <Button variant="ghost" size="sm">
                    View All
                    <ArrowUpRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : transfers.length > 0 ? (
                <div className="space-y-4">
                  {transfers.slice(0, 3).map((transfer) => (
                    <div 
                      key={transfer.id} 
                      onClick={() => handleTransferClick(transfer.transfer_reference)}
                      className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted cursor-pointer transition-all hover:shadow-md group"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all group-hover:scale-110 ${
                          transfer.status === 'completed' ? 'bg-success/10' : 
                          transfer.status === 'processing' ? 'bg-yellow-100' : 
                          'bg-primary/10'
                        }`}>
                          {transfer.status === 'completed' ? (
                            <CheckCircle2 className="w-5 h-5 text-success" />
                          ) : transfer.status === 'processing' ? (
                            <Clock className="w-5 h-5 text-yellow-600" />
                          ) : (
                            <Send className="w-5 h-5 text-primary" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{transfer.beneficiary_name || 'Unknown Recipient'}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span className="font-mono text-xs">{transfer.transfer_reference}</span>
                            <span>•</span>
                            <span>{formatDate(transfer.created_at)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-lg">
                          {formatCurrency(transfer.amount_sent, transfer.currency_sent)}
                        </p>
                        <Badge variant="outline" className={`text-xs ${getStatusBadge(transfer.status)}`}>
                          {transfer.status}
                        </Badge>
                        {transfer.speed_tier === 'express' && (
                          <Badge variant="outline" className="mt-1 border-orange-200 bg-orange-50 text-orange-700 text-xs ml-1">
                            <Zap className="w-2.5 h-2.5 mr-1" />
                            Express
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Send className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-semibold mb-2">No transfers yet</h3>
                  <p className="text-muted-foreground mb-4">Start sending money to see your transfer history here</p>
                  <Link to="/user/new-transfer">
                    <Button>
                      <Send className="w-4 h-4 mr-2" />
                      Send Your First Transfer
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Wallet Transactions */}
          {walletTransactions && walletTransactions.length > 0 && (
            <Card className="shadow-card border-none">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Wallet Activity</CardTitle>
                <Link to="/user/history">
                  <Button variant="ghost" size="sm">
                    View All
                    <ArrowUpRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {walletTransactions.slice(0, 3).map((transaction) => (
                    <WalletTransactionItem
                      key={transaction.id}
                      transaction={transaction}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
