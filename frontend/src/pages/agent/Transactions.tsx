import { useState, useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  RefreshCw, 
  Download, 
  Eye,
  Receipt,
  Search,
  Filter,
  Calendar,
  DollarSign,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AgentService, TransactionResult } from "@/services/agentService";

export default function Transactions() {
  const { toast } = useToast();
  
  // State management
  const [transactions, setTransactions] = useState<TransactionResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterDate, setFilterDate] = useState<string>(""); // Date filter

  // Load initial data
  useEffect(() => {
    loadTransactions();
  }, []);

  // Load transactions
  const loadTransactions = async () => {
    try {
      const data = await AgentService.getRecentTransactions();
      setTransactions(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading transactions:', error);
      toast({
        title: "Error",
        description: "Failed to load transactions",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Filter transactions
  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = !searchQuery || 
      transaction.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transaction.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transaction.transaction_reference?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = filterType === "all" || transaction.type.toLowerCase() === filterType;
    const matchesStatus = filterStatus === "all" || transaction.status === filterStatus;
    
    // Date filter
    let matchesDate = true;
    if (filterDate) {
      const transactionDate = new Date(transaction.created_at).toDateString();
      const filterDateObj = new Date(filterDate);
      matchesDate = transactionDate === filterDateObj.toDateString();
    }
    
    return matchesSearch && matchesType && matchesStatus && matchesDate;
  });

  // Get transaction type icon
  const getTransactionIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'cash in':
        return <ArrowDownLeft className="w-4 h-4 text-success" />;
      case 'cash out':
        return <ArrowUpRight className="w-4 h-4 text-destructive" />;
      case 'fee':
        return <DollarSign className="w-4 h-4 text-orange-600" />;
      case 'transfer':
        return <DollarSign className="w-4 h-4 text-primary" />;
      default:
        return <Receipt className="w-4 h-4 text-muted-foreground" />;
    }
  };

  // Get transaction type label
  const getTransactionTypeLabel = (type: string) => {
    switch (type.toLowerCase()) {
      case 'cash in':
        return 'Cash In';
      case 'cash out':
        return 'Cash Out';
      case 'fee':
        return 'Fee';
      case 'transfer':
        return 'Transfer';
      default:
        return type || 'Transaction';
    }
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-success/10 text-success">Completed</Badge>;
      case 'pending':
        return <Badge variant="secondary" className="bg-warning/10 text-warning">Pending</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
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
              <p className="text-muted-foreground">Loading transactions...</p>
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
              <h1 className="text-3xl font-bold mb-2">Transaction History</h1>
              <p className="text-muted-foreground">View and manage your transaction history</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <Card className="shadow-card border-none mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Search transactions..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Date Filter */}
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <Input
                  type="date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className="w-40"
                />
                <Button
                  variant={filterDate === new Date().toISOString().split('T')[0] ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    const today = new Date().toISOString().split('T')[0];
                    setFilterDate(today === filterDate ? "" : today);
                  }}
                >
                  Today
                </Button>
                {filterDate && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setFilterDate("")}
                    className="h-9 px-2"
                  >
                    ✕
                  </Button>
                )}
              </div>

              {/* Type Filter */}
              <div className="flex gap-2">
                <Button
                  variant={filterType === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterType("all")}
                >
                  All Types
                </Button>
                <Button
                  variant={filterType === "cash in" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterType("cash in")}
                >
                  Cash In
                </Button>
                <Button
                  variant={filterType === "cash out" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterType("cash out")}
                >
                  Cash Out
                </Button>
                <Button
                  variant={filterType === "fee" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterType("fee")}
                >
                  Fees
                </Button>
              </div>

              {/* Status Filter */}
              <div className="flex gap-2">
                <Button
                  variant={filterStatus === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterStatus("all")}
                >
                  All Status
                </Button>
                <Button
                  variant={filterStatus === "completed" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterStatus("completed")}
                >
                  Completed
                </Button>
                <Button
                  variant={filterStatus === "pending" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterStatus("pending")}
                >
                  Pending
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Transactions List */}
        <Card className="shadow-card border-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="w-5 h-5" />
              Transactions ({filteredTransactions.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredTransactions.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Receipt className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">No transactions found</h3>
                  <p className="text-sm">
                    {searchQuery || filterType !== "all" || filterStatus !== "all" 
                      ? "Try adjusting your filters to see more results"
                      : "Your transaction history will appear here"
                    }
                  </p>
                </div>
              ) : (
                filteredTransactions.map((transaction, index) => {
                  return (
                    <div key={transaction.id || index} className="p-6 rounded-lg bg-muted/50 hover:bg-muted transition-colors border">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          {getTransactionIcon(transaction.type)}
                          <div>
                            <h3 className="font-medium">{getTransactionTypeLabel(transaction.type)}</h3>
                            <p className="text-sm text-muted-foreground">
                              Customer: <span className="font-medium">{transaction.customer_name}</span>
                              {transaction.customer_phone && (
                                <span> • {transaction.customer_phone}</span>
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(transaction.status || 'completed')}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Amount</p>
                          <p className="font-semibold text-lg">
                            ${transaction.amount.toFixed(2)} {transaction.currency}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Balance After</p>
                          <p className="font-medium">
                            ${(Number(transaction.balance_after) || 0).toFixed(2)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Reference</p>
                          <p className="font-mono text-sm">
                            {transaction.transaction_reference || 'N/A'}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Date & Time</p>
                          <p className="text-sm">
                            {transaction.created_at 
                              ? new Date(transaction.created_at).toLocaleDateString() + ' ' + 
                                new Date(transaction.created_at).toLocaleTimeString()
                              : 'N/A'
                            }
                          </p>
                        </div>
                      </div>
                      
                      {/* New: Cash Impact and Wallet Impact */}
                      {(transaction.cash_impact !== 0 || transaction.wallet_impact !== 0) && (
                        <div className="mt-4 pt-4 border-t">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-3 rounded-lg bg-background border">
                              <p className="text-sm text-muted-foreground mb-1">Cash Impact</p>
                              <p className={`text-xl font-bold ${transaction.cash_impact > 0 ? 'text-green-600' : transaction.cash_impact < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                                {transaction.cash_impact_label}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {transaction.cash_impact > 0 ? 'Cash received' : transaction.cash_impact < 0 ? 'Cash given' : 'No impact'}
                              </p>
                            </div>
                            <div className="p-3 rounded-lg bg-background border">
                              <p className="text-sm text-muted-foreground mb-1">Wallet Impact</p>
                              <p className={`text-xl font-bold ${transaction.wallet_impact > 0 ? 'text-blue-600' : transaction.wallet_impact < 0 ? 'text-orange-600' : 'text-gray-600'}`}>
                                {transaction.wallet_impact_label}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {transaction.wallet_impact > 0 ? 'Wallet increase' : transaction.wallet_impact < 0 ? 'Wallet decrease' : 'No impact'}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Description */}
                      {transaction.description && (
                        <div className="mt-4 pt-4 border-t">
                          <p className="text-sm text-muted-foreground mb-1">Description</p>
                          <p className="text-sm font-medium">{transaction.description}</p>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
