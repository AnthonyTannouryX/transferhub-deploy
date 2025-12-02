import { Navigation } from "@/components/Navigation";
import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Building2, ArrowLeftRight, DollarSign, RefreshCw, Eye as EyeIcon, Loader2, Wallet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { AdminService } from "@/services/adminService";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";

export default function AdminDashboard() {
  const { user } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [walletData, setWalletData] = useState<any>(null);
  const [walletTransactions, setWalletTransactions] = useState<any[]>([]);
  const [loadingWallet, setLoadingWallet] = useState(true);
  const [balanceVisible, setBalanceVisible] = useState(false);
  const [statistics, setStatistics] = useState<any>(null);
  const { toast } = useToast();

  // Get personalized greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  // Load wallet data
  useEffect(() => {
    loadWalletData();
  }, []);

  const loadWalletData = async () => {
    try {
      setLoadingWallet(true);

      const [dashboardResponse, transactionsResponse] = await Promise.all([
        AdminService.getDashboard(),
        AdminService.getWalletTransactions()
      ]);

      if (dashboardResponse && dashboardResponse.wallets) {
        setWalletData(dashboardResponse);
      }

      if (dashboardResponse && dashboardResponse.statistics) {
        setStatistics(dashboardResponse.statistics);
      }

      if (transactionsResponse && transactionsResponse.transactions) {
        setWalletTransactions(transactionsResponse.transactions);
      }
    } catch (error) {
      console.error('Failed to load wallet data:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      });
    } finally {
      setLoadingWallet(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadWalletData();
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation role="admin" />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                {getGreeting()}{user?.first_name ? `, ${user.first_name}` : ' there'}!
              </h1>
              <p className="text-muted-foreground">Admin Dashboard Overview</p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <StatCard
            title="Total Users"
            value={statistics ? statistics.total_users?.toLocaleString() || '0' : '0'}
            icon={Users}
            trend={{
              value: statistics ? `${statistics.active_users || 0} active` : '0 active',
              isPositive: true
            }}
            variant="default"
          />
          <StatCard
            title="Active Agents"
            value={statistics ? statistics.agent_users?.toLocaleString() || '0' : '0'}
            icon={Building2}
            variant="success"
          />
          <StatCard
            title="Transactions (24h)"
            value={statistics ? statistics.transfers_24h?.toLocaleString() || '0' : '0'}
            icon={ArrowLeftRight}
            trend={{
              value: statistics ? `${statistics.transfers_24h_completed || 0} completed` : '0 completed',
              isPositive: true
            }}
            variant="default"
          />
          <StatCard
            title="Total Revenue"
            value={statistics ? `$${statistics.total_revenue?.toLocaleString() || '0'}` : '$0'}
            icon={DollarSign}
            variant="success"
          />
        </div>

        {/* Admin Wallet Section */}
        <div className="mb-8">
          {/* Wallet Balance */}
          <Card className="shadow-card border-none max-w-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="w-5 h-5 text-primary" />
                Admin Wallet
                {loadingWallet && <Loader2 className="w-4 h-4 animate-spin" />}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingWallet ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin mr-2" />
                  <span>Loading wallet data...</span>
                </div>
              ) : walletData && walletData.wallets ? (
                <div className="space-y-4">
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
                          <EyeIcon className={`w-4 h-4 ${balanceVisible ? 'text-muted-foreground' : 'text-muted-foreground/50'}`} />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Fee Collection Wallet
                      </p>
                    </div>
                  ))}
                  {walletData.statistics && (
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Fees Collected</p>
                        <p className="text-lg font-semibold">${walletData.statistics.total_fees_collected?.toLocaleString() || '0.00'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Current Balance</p>
                        <p className="text-lg font-semibold">${walletData.statistics.total_revenue?.toLocaleString() || '0.00'}</p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Wallet className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No wallet data available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="shadow-card border-none">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
              <Link to="/admin/users">
                <Button variant="outline" className="w-full justify-start">
                  <Users className="w-4 h-4 mr-2" />
                  Manage Users
                </Button>
              </Link>
              <Link to="/admin/agents">
                <Button variant="outline" className="w-full justify-start">
                  <Building2 className="w-4 h-4 mr-2" />
                  Manage Agents
                </Button>
              </Link>
              <Link to="/admin/transactions">
                <Button variant="outline" className="w-full justify-start">
                  <ArrowLeftRight className="w-4 h-4 mr-2" />
                  View Transactions
                </Button>
              </Link>
              <Link to="/admin/wallet">
                <Button variant="outline" className="w-full justify-start">
                  <Wallet className="w-4 h-4 mr-2" />
                  Admin Wallet
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
