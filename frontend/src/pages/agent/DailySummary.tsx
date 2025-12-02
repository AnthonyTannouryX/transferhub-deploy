import { useState, useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar, 
  RefreshCw, 
  Download, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  Users,
  Receipt,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AgentService } from "@/services/agentService";

interface DailySummaryData {
  date: string;
  stats: {
    today_cash_in: string;
    today_cash_out: string;
    today_transactions_count: number;
    commission_earned: string;
    digital_wallet_balance: string;
    cash_balance: string;
    cash_in_count: number;
    cash_out_count: number;
    total_fees: string;
    admin_fees: string;
    net_profit: string;
  };
  transactions: Array<{
    id: string;
    type: string;
    amount: number;
    currency: string;
    description: string;
    customer_name: string;
    customer_phone: string | null;
    created_at: string;
    time: string;
    cash_impact: number;
    cash_impact_label: string;
    wallet_impact: number;
    wallet_impact_label: string;
  }>;
  agent_info: {
    name: string;
    email: string;
    phone: string;
  };
}

export default function DailySummary() {
  const { toast } = useToast();
  
  // State management
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [summaryData, setSummaryData] = useState<DailySummaryData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Load data when component mounts or date changes
  useEffect(() => {
    if (selectedDate) {
      loadDailySummary();
    }
  }, [selectedDate]);

  // Load daily summary data
  const loadDailySummary = async () => {
    try {
      setIsLoading(true);
      const data = await AgentService.getDailySummary(selectedDate);
      setSummaryData(data);
    } catch (error) {
      console.error('Error loading daily summary:', error);
      toast({
        title: "Error",
        description: "Failed to load daily summary",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle date change
  const handleDateChange = (date: string) => {
    setSelectedDate(date);
  };

  // Get transaction type icon
  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'Cash In':
        return <ArrowDownLeft className="w-4 h-4 text-green-600" />;
      case 'Cash Out':
        return <ArrowUpRight className="w-4 h-4 text-red-600" />;
      default:
        return <Receipt className="w-4 h-4 text-gray-600" />;
    }
  };

  // Get transaction type badge
  const getTransactionBadge = (type: string) => {
    switch (type) {
      case 'Cash In':
        return <Badge variant="default" className="bg-green-100 text-green-800">Cash In</Badge>;
      case 'Cash Out':
        return <Badge variant="default" className="bg-red-100 text-red-800">Cash Out</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
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
              <p className="text-muted-foreground">Loading daily summary...</p>
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
              <h1 className="text-3xl font-bold mb-2">Daily Summary</h1>
              <p className="text-muted-foreground">View cash-in and cash-out summary for any day</p>
            </div>
          </div>
        </div>

        {/* Date Selector */}
        <Card className="shadow-card border-none mb-6">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-muted-foreground" />
                <label htmlFor="date-select" className="text-sm font-medium">
                  Select Date:
                </label>
              </div>
              <Input
                id="date-select"
                type="date"
                value={selectedDate}
                onChange={(e) => handleDateChange(e.target.value)}
                className="max-w-xs"
              />
            </div>
          </CardContent>
        </Card>

        {summaryData ? (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {/* Cash In Total */}
              <Card className="shadow-card border-none">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Cash In Total</p>
                      <p className="text-2xl font-bold text-green-600">${summaryData.stats.today_cash_in}</p>
                      <p className="text-xs text-muted-foreground">{summaryData.stats.cash_in_count} transactions</p>
                    </div>
                    <div className="p-3 bg-green-100 rounded-full">
                      <TrendingDown className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Cash Out Total */}
              <Card className="shadow-card border-none">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Cash Out Total</p>
                      <p className="text-2xl font-bold text-red-600">${summaryData.stats.today_cash_out}</p>
                      <p className="text-xs text-muted-foreground">{summaryData.stats.cash_out_count} transactions</p>
                    </div>
                    <div className="p-3 bg-red-100 rounded-full">
                      <TrendingUp className="w-6 h-6 text-red-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Total Fees */}
              <Card className="shadow-card border-none">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Fees</p>
                      <p className="text-2xl font-bold text-blue-600">${summaryData.stats.total_fees}</p>
                      <p className="text-xs text-muted-foreground">From customers</p>
                    </div>
                    <div className="p-3 bg-blue-100 rounded-full">
                      <DollarSign className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Net Profit */}
              <Card className="shadow-card border-none">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Net Profit</p>
                      <p className="text-2xl font-bold text-purple-600">${summaryData.stats.net_profit}</p>
                      <p className="text-xs text-muted-foreground">After admin fees</p>
                    </div>
                    <div className="p-3 bg-purple-100 rounded-full">
                      <CheckCircle className="w-6 h-6 text-purple-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Breakdown */}
            <Card className="shadow-card border-none mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="w-5 h-5" />
                  Detailed Breakdown - {new Date(summaryData.date).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Transaction Summary</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total Transactions:</span>
                        <span className="font-medium">{summaryData.stats.today_transactions_count}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Cash In Count:</span>
                        <span className="font-medium text-green-600">{summaryData.stats.cash_in_count}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Cash Out Count:</span>
                        <span className="font-medium text-red-600">{summaryData.stats.cash_out_count}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Financial Summary</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Cash In Total:</span>
                        <span className="font-medium text-green-600">${summaryData.stats.today_cash_in}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Cash Out Total:</span>
                        <span className="font-medium text-red-600">${summaryData.stats.today_cash_out}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total Fees:</span>
                        <span className="font-medium text-blue-600">${summaryData.stats.total_fees}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Profit Analysis</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Admin Fees:</span>
                        <span className="font-medium text-orange-600">-${summaryData.stats.admin_fees}</span>
                      </div>
                      <div className="flex justify-between border-t pt-2">
                        <span className="text-muted-foreground font-semibold">Net Profit:</span>
                        <span className="font-bold text-purple-600">${summaryData.stats.net_profit}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Transaction List */}
            <Card className="shadow-card border-none">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Transaction Details ({summaryData.transactions.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {summaryData.transactions.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Receipt className="w-16 h-16 mx-auto mb-4 opacity-50" />
                      <h3 className="text-lg font-medium mb-2">No transactions found</h3>
                      <p className="text-sm">No transactions were recorded on this date</p>
                    </div>
                  ) : (
                    summaryData.transactions.map((transaction) => (
                      <div key={transaction.id} className="p-6 rounded-lg bg-muted/50 hover:bg-muted transition-colors border">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            {getTransactionIcon(transaction.type)}
                            <div>
                              <h3 className="font-medium">{transaction.type}</h3>
                              <p className="text-sm text-muted-foreground">
                                Customer: <span className="font-medium">{transaction.customer_name}</span>
                                {transaction.customer_phone && (
                                  <span> • {transaction.customer_phone}</span>
                                )}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {getTransactionBadge(transaction.type)}
                            <span className="text-sm text-muted-foreground">{transaction.time}</span>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                          <div>
                            <p className="text-sm text-muted-foreground mb-1">Amount</p>
                            <p className="font-semibold text-lg">
                              ${transaction.amount.toFixed(2)} {transaction.currency}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground mb-1">Cash Impact</p>
                            <p className={`text-lg font-bold ${transaction.cash_impact > 0 ? 'text-green-600' : transaction.cash_impact < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                              {transaction.cash_impact_label}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {transaction.cash_impact > 0 ? 'Cash received' : transaction.cash_impact < 0 ? 'Cash given' : 'No impact'}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground mb-1">Wallet Impact</p>
                            <p className={`text-lg font-bold ${transaction.wallet_impact > 0 ? 'text-blue-600' : transaction.wallet_impact < 0 ? 'text-orange-600' : 'text-gray-600'}`}>
                              {transaction.wallet_impact_label}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {transaction.wallet_impact > 0 ? 'Wallet increase' : transaction.wallet_impact < 0 ? 'Wallet decrease' : 'No impact'}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground mb-1">Description</p>
                            <p className="text-sm font-medium">
                              {transaction.description}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground mb-1">Time</p>
                            <p className="text-sm">
                              {new Date(transaction.created_at).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          <Card className="shadow-card border-none">
            <CardContent className="p-12">
              <div className="text-center">
                <AlertCircle className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">No data available</h3>
                <p className="text-muted-foreground">Select a date to view the daily summary</p>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
