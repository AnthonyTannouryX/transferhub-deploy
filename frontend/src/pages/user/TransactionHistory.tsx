import { useState, useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { WalletTransactionItem } from "@/components/WalletTransactionItem";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Download, Search, ArrowUpRight, Send, Wallet as WalletIcon, 
  TrendingUp, TrendingDown, DollarSign, Clock, CheckCircle2, 
  XCircle, AlertCircle, BarChart3, Globe, Zap, Activity 
} from "lucide-react";
import { walletService, WalletTransaction } from "@/services/walletService";
import { transferService, Transfer } from "@/services/transferService";

export default function TransactionHistory() {
  const [walletTransactions, setWalletTransactions] = useState<WalletTransaction[]>([]);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("transfers");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currencyFilter, setCurrencyFilter] = useState("all");

  const [stats, setStats] = useState({
    totalTransferred: 0,
    totalFees: 0,
    totalTransfers: 0,
    completed: 0,
    processing: 0,
    failed: 0,
    avgTransferAmount: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [walletsData, transfersData] = await Promise.all([
        walletService.getTransactions(undefined, 100),
        transferService.getTransfers()
      ]);
      
      setWalletTransactions(walletsData || []);
      setTransfers(transfersData?.transfers || []);
      calculateStats(transfersData?.transfers || []);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (transfersList: Transfer[]) => {
    const completed = transfersList.filter(t => t.status === 'completed');
    const processing = transfersList.filter(t => t.status === 'processing');
    const failed = transfersList.filter(t => t.status === 'failed');
    
    const totalTransferred = completed.reduce((sum, t) => sum + parseFloat(String(t.amount_sent)), 0);
    const totalFees = completed.reduce((sum, t) => sum + parseFloat(String(t.transfer_fee)), 0);
    
    setStats({
      totalTransferred,
      totalFees,
      totalTransfers: transfersList.length,
      completed: completed.length,
      processing: processing.length,
      failed: failed.length,
      avgTransferAmount: completed.length > 0 ? totalTransferred / completed.length : 0,
    });
  };

  const getFilteredTransfers = () => {
    return transfers.filter(transfer => {
      const matchesSearch = searchQuery === "" || 
        transfer.transfer_reference?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        transfer.beneficiary_name?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === "all" || transfer.status === statusFilter;
      const matchesCurrency = currencyFilter === "all" || transfer.currency_sent === currencyFilter.toUpperCase();
      
      return matchesSearch && matchesStatus && matchesCurrency;
    });
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      completed: "bg-green-100 text-green-800 border-green-200",
      processing: "bg-yellow-100 text-yellow-800 border-yellow-200",
      pending: "bg-blue-100 text-blue-800 border-blue-200",
      failed: "bg-red-100 text-red-800 border-red-200",
      cancelled: "bg-gray-100 text-gray-800 border-gray-200",
    };
    return styles[status as keyof typeof styles] || styles.pending;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-4 h-4" />;
      case 'processing':
        return <Clock className="w-4 h-4" />;
      case 'failed':
        return <XCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const formatCurrency = (amount: number | string, currency: string = "USD") => {
    const num = parseFloat(String(amount));
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(num);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${Math.floor(diffInHours)}h ago`;
    if (diffInHours < 48) return "Yesterday";
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined });
  };

  const getCurrencyBreakdown = () => {
    const breakdown: Record<string, { count: number; total: number }> = {};
    transfers.forEach(t => {
      const currency = t.currency_sent;
      if (!breakdown[currency]) {
        breakdown[currency] = { count: 0, total: 0 };
      }
      breakdown[currency].count++;
      breakdown[currency].total += parseFloat(String(t.amount_sent));
    });
    return breakdown;
  };

  // CSV Export Functions
  const exportToCSV = (data: any[], filename: string, headers: string[]) => {
    // Create CSV content
    const csvHeaders = headers.join(',');
    const csvRows = data.map(row => {
      return headers.map(header => {
        const value = row[header.toLowerCase().replace(/\s+/g, '_')] || row[header] || '';
        // Handle values with commas by wrapping in quotes
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',');
    });
    
    const csvContent = [csvHeaders, ...csvRows].join('\n');
    
    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportTransfers = () => {
    const dataToExport = filteredTransfers.map(transfer => ({
      reference: transfer.transfer_reference,
      recipient: transfer.beneficiary_name || 'Unknown',
      amount: formatCurrency(transfer.amount_sent, transfer.currency_sent),
      currency: transfer.currency_sent,
      fee: formatCurrency(transfer.transfer_fee, transfer.currency_sent),
      total: formatCurrency(transfer.total_cost, transfer.currency_sent),
      status: transfer.status,
      speed: transfer.speed_tier,
      date: new Date(transfer.created_at).toLocaleString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      completed_date: transfer.completed_at ? new Date(transfer.completed_at).toLocaleString('en-US') : 'N/A'
    }));

    const headers = ['Reference', 'Recipient', 'Amount', 'Currency', 'Fee', 'Total', 'Status', 'Speed', 'Date', 'Completed Date'];
    const timestamp = new Date().toISOString().split('T')[0];
    exportToCSV(dataToExport, `transfers-export-${timestamp}.csv`, headers);
  };

  const handleExportWalletTransactions = () => {
    const dataToExport = walletTransactions.map(transaction => ({
      id: transaction.id,
      type: transaction.type,
      amount: transaction.amount,
      balance_after: transaction.balance_after,
      description: transaction.description,
      date: new Date(transaction.created_at).toLocaleString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    }));

    const headers = ['ID', 'Type', 'Amount', 'Balance After', 'Description', 'Date'];
    const timestamp = new Date().toISOString().split('T')[0];
    exportToCSV(dataToExport, `wallet-transactions-export-${timestamp}.csv`, headers);
  };

  const currencyBreakdown = getCurrencyBreakdown();
  const filteredTransfers = getFilteredTransfers();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900">
      <Navigation role="user" />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Transaction History
          </h1>
          <p className="text-muted-foreground text-lg">Complete overview of all your transfers and wallet activity</p>
        </div>

        {/* Statistics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card className="shadow-lg border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Total Transferred</p>
                  <p className="text-3xl font-bold text-primary">{formatCurrency(stats.totalTransferred)}</p>
                  <div className="flex items-center gap-1 mt-2">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-green-600 font-medium">{stats.completed} successful</span>
                  </div>
                </div>
                <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center">
                  <DollarSign className="w-7 h-7 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-2 border-orange-500/20 bg-gradient-to-br from-orange-500/5 to-orange-500/10">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Total Fees Paid</p>
                  <p className="text-3xl font-bold text-orange-600">{formatCurrency(stats.totalFees)}</p>
                  <p className="text-sm text-muted-foreground mt-2">Avg: {formatCurrency(stats.avgTransferAmount)}</p>
                </div>
                <div className="w-14 h-14 bg-orange-500/10 rounded-full flex items-center justify-center">
                  <TrendingDown className="w-7 h-7 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-2 border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-blue-500/10">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Total Transfers</p>
                  <p className="text-3xl font-bold text-blue-600">{stats.totalTransfers}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline" className="border-green-200 bg-green-50 text-green-700">
                      <CheckCircle2 className="w-3 h-3 mr-1" />{stats.completed}
                    </Badge>
                    <Badge variant="outline" className="border-yellow-200 bg-yellow-50 text-yellow-700">
                      <Clock className="w-3 h-3 mr-1" />{stats.processing}
                    </Badge>
                  </div>
                </div>
                <div className="w-14 h-14 bg-blue-500/10 rounded-full flex items-center justify-center">
                  <Activity className="w-7 h-7 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Currency Breakdown */}
        {Object.keys(currencyBreakdown).length > 0 && (
          <Card className="shadow-card border-none mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                Currency Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(currencyBreakdown).map(([currency, data]) => (
                  <div key={currency} className="p-4 rounded-lg bg-muted/50 border">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="font-bold text-sm">{currency}</span>
                      </div>
                      <span className="font-semibold">{data.count} transfers</span>
                    </div>
                    <p className="text-2xl font-bold text-primary">{formatCurrency(data.total, currency)}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        <Card className="shadow-card border-none mb-6">
          <CardContent className="p-6">
            <div className="grid gap-4 md:grid-cols-4">
              <div className="relative md:col-span-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input 
                  placeholder="Search by reference, recipient..." 
                  className="pl-10" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
              <Select value={currencyFilter} onValueChange={setCurrencyFilter}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Currencies</SelectItem>
                  {Object.keys(currencyBreakdown).map(currency => (
                    <SelectItem key={currency} value={currency.toLowerCase()}>{currency}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="transfers" className="flex items-center gap-2">
              <Send className="w-4 h-4" />
              Transfers ({filteredTransfers.length})
            </TabsTrigger>
            <TabsTrigger value="wallet" className="flex items-center gap-2">
              <WalletIcon className="w-4 h-4" />
              Wallet Activity ({walletTransactions.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="transfers">
            <Card className="shadow-card border-none">
              <CardHeader>
                <CardTitle>Transfer History</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
                  </div>
                ) : filteredTransfers.length > 0 ? (
                  <div className="space-y-3">
                    {filteredTransfers.map((transfer) => (
                      <div
                        key={transfer.id}
                        className="group flex items-center justify-between p-4 rounded-lg border border-border bg-card hover:bg-muted/50 transition-all cursor-pointer hover:shadow-md"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                              {getStatusIcon(transfer.status)}
                            </div>
                            <div>
                              <p className="font-semibold text-lg">
                                {transfer.beneficiary_name || 'Unknown Recipient'}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge className={getStatusBadge(transfer.status)} variant="outline">
                                  {transfer.status}
                                </Badge>
                                {transfer.speed_tier === 'express' && (
                                  <Badge variant="outline" className="border-orange-200 bg-orange-50 text-orange-700">
                                    <Zap className="w-3 h-3 mr-1" />
                                    Express
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground ml-13">
                            <span className="font-mono">{transfer.transfer_reference}</span>
                            <span>•</span>
                            <span>{formatDate(transfer.created_at)}</span>
                            <span>•</span>
                            <span>Fee: {formatCurrency(transfer.transfer_fee, transfer.currency_sent)}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <p className="font-bold text-2xl text-primary">
                              {formatCurrency(transfer.amount_sent, transfer.currency_sent)}
                            </p>
                            <p className="text-sm text-muted-foreground font-medium">{transfer.currency_sent}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Total: {formatCurrency(transfer.total_cost, transfer.currency_sent)}
                            </p>
                          </div>
                          <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <ArrowUpRight className="w-5 h-5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Send className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-semibold mb-2">No transfers found</h3>
                    <p className="text-muted-foreground">Your transfer history will appear here.</p>
                  </div>
                )}

                {filteredTransfers.length > 0 && (
                  <div className="flex items-center justify-between mt-6 pt-6 border-t">
                    <p className="text-sm text-muted-foreground">
                      Showing {filteredTransfers.length} of {transfers.length} transfers
                    </p>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" disabled>Previous</Button>
                      <Button variant="outline" size="sm">Next</Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="wallet">
            <Card className="shadow-card border-none">
              <CardHeader>
                <CardTitle>Wallet Activity</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
                  </div>
                ) : walletTransactions.length > 0 ? (
                  <div className="space-y-3">
                    {walletTransactions.map((transaction) => (
                      <WalletTransactionItem
                        key={transaction.id}
                        transaction={transaction}
                        showDetails={true}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <WalletIcon className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-semibold mb-2">No wallet transactions</h3>
                    <p className="text-muted-foreground">Your wallet activity will appear here.</p>
                  </div>
                )}

                {walletTransactions.length > 0 && (
                  <div className="flex items-center justify-between mt-6 pt-6 border-t">
                    <p className="text-sm text-muted-foreground">Showing {walletTransactions.length} wallet transactions</p>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" disabled>Previous</Button>
                      <Button variant="outline" size="sm">Next</Button>
                    </div>
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
