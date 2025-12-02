import { useState, useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Search, AlertTriangle, Eye, RefreshCw, Loader2, CheckCircle, Clock, XCircle, User, Mail, Phone, Calendar, DollarSign, CreditCard, MapPin } from "lucide-react";
import { AdminService, AdminTransfer } from "@/services/adminService";
import { useToast } from "@/hooks/use-toast";

export default function ManageTransactions() {
  const [transfers, setTransfers] = useState<AdminTransfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currencyFilter, setCurrencyFilter] = useState("all");
  const [selectedTransfer, setSelectedTransfer] = useState<AdminTransfer | null>(null);
  const [statistics, setStatistics] = useState({
    total_transfers: 0,
    completed_transfers: 0,
    pending_transfers: 0,
    processing_transfers: 0,
    total_volume: 0,
    speed_tier_breakdown: {} as Record<string, number>
  });
  
  const { toast } = useToast();

  // Load transfers and dashboard data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    console.log('🔍 ManageTransactions: Loading data...');
    try {
      setLoading(true);
      console.log('📡 ManageTransactions: Making API calls...');
      
      const [transfersResponse, dashboardResponse] = await Promise.all([
        AdminService.getTransfers(),
        AdminService.getDashboard()
      ]);
      
      console.log('📊 ManageTransactions: Transfers response:', transfersResponse);
      console.log('📈 ManageTransactions: Dashboard response:', dashboardResponse);
      
      // Handle transfers data
      if (transfersResponse && transfersResponse.success && transfersResponse.transfers) {
        console.log('✅ ManageTransactions: Setting transfers:', transfersResponse.transfers);
        setTransfers(transfersResponse.transfers);
      } else {
        console.warn('⚠️ ManageTransactions: No transfers data received:', transfersResponse);
        setTransfers([]);
      }
      
      // Handle dashboard data
      if (dashboardResponse && dashboardResponse.statistics) {
        console.log('✅ ManageTransactions: Setting statistics:', dashboardResponse.statistics);
        setStatistics(dashboardResponse.statistics);
      } else {
        console.warn('⚠️ ManageTransactions: No statistics data received:', dashboardResponse);
        setStatistics({
          total_transfers: 0,
          completed_transfers: 0,
          pending_transfers: 0,
          processing_transfers: 0,
          total_volume: 0,
          speed_tier_breakdown: {}
        });
      }
    } catch (error) {
      console.error('❌ ManageTransactions: Failed to load data:', error);
      toast({
        title: "Error",
        description: "Failed to load transfer data. Please check your connection and try again.",
        variant: "destructive",
      });
      // Set empty data on error
      setTransfers([]);
      setStatistics({
        total_transfers: 0,
        completed_transfers: 0,
        pending_transfers: 0,
        processing_transfers: 0,
        total_volume: 0,
        speed_tier_breakdown: {}
      });
    } finally {
      setLoading(false);
      console.log('🏁 ManageTransactions: Data loading completed');
    }
  };

  const handleStatusUpdate = async (transferId: string, newStatus: string) => {
    console.log('🔍 ManageTransactions: Updating transfer status:', { transferId, newStatus });
    try {
      setUpdating(transferId);
      console.log('📡 ManageTransactions: Calling updateTransferStatus API...');
      
      await AdminService.updateTransferStatus(transferId, {
        status: newStatus as any,
        notes: `Status updated by admin to ${newStatus}`
      });
      
      console.log('✅ ManageTransactions: Status updated successfully, updating local state...');
      
      // Update local state
      setTransfers(prev => prev.map(transfer => 
        transfer.id === transferId 
          ? { ...transfer, status: newStatus }
          : transfer
      ));
      
      console.log('✅ ManageTransactions: Local state updated');
      
      toast({
        title: "Success",
        description: `Transfer status updated to ${newStatus}`,
      });
    } catch (error) {
      console.error('❌ ManageTransactions: Failed to update status:', error);
      toast({
        title: "Error",
        description: "Failed to update transfer status",
        variant: "destructive",
      });
    } finally {
      setUpdating(null);
      console.log('🏁 ManageTransactions: Status update completed');
    }
  };

  const handleViewTransfer = (transfer: AdminTransfer) => {
    setSelectedTransfer(transfer);
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      completed: "bg-success/10 text-success",
      processing: "bg-warning/10 text-warning",
      pending: "bg-blue-100 text-blue-800",
      failed: "bg-destructive/10 text-destructive",
    };
    return styles[status as keyof typeof styles] || styles.completed;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'processing':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-blue-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const formatAmount = (amount: number | string) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return isNaN(numAmount) ? '0.00' : numAmount.toFixed(2);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  // Filter transfers based on search and filters
  const filteredTransfers = transfers.filter(transfer => {
    const matchesSearch = searchQuery === "" || 
      transfer.transfer_reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transfer.sender_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transfer.recipient_name.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || transfer.status === statusFilter;
    const matchesCurrency = currencyFilter === "all" || transfer.currency_sent === currencyFilter;
    
    return matchesSearch && matchesStatus && matchesCurrency;
  });

  return (
    <div className="min-h-screen bg-background">
      <Navigation role="admin" />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Manage Transactions</h1>
          <p className="text-muted-foreground">Monitor and manage all system transactions</p>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-6 md:grid-cols-4 mb-6">
          <Card className="shadow-card border-none">
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground mb-2">Total Volume</p>
              <p className="text-2xl font-bold">${formatAmount(statistics.total_volume)}</p>
              <p className="text-xs text-muted-foreground mt-1">All time</p>
            </CardContent>
          </Card>
          <Card className="shadow-card border-none">
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground mb-2">Total Transfers</p>
              <p className="text-2xl font-bold">{statistics.total_transfers}</p>
              <p className="text-xs text-muted-foreground mt-1">All time</p>
            </CardContent>
          </Card>
          <Card className="shadow-card border-none">
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground mb-2">Pending Review</p>
              <p className="text-2xl font-bold text-warning">{statistics.pending_transfers}</p>
              <p className="text-xs text-muted-foreground mt-1">Requires attention</p>
            </CardContent>
          </Card>
          <Card className="shadow-card border-none">
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground mb-2">Completed</p>
              <p className="text-2xl font-bold text-success">{statistics.completed_transfers}</p>
              <p className="text-xs text-muted-foreground mt-1">Successfully processed</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="shadow-card border-none mb-6">
          <CardContent className="p-6">
            <div className="grid gap-4 md:grid-cols-5">
              <div className="relative md:col-span-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder="Search by ID, sender or recipient..." 
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
              <Select value={currencyFilter} onValueChange={setCurrencyFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Currencies</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="GBP">GBP</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Transactions Table */}
        <Card className="shadow-card border-none">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>All Transactions ({filteredTransfers.length})</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin mr-2" />
                <span>Loading transfers...</span>
              </div>
            ) : filteredTransfers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No transfers found matching your criteria.
              </div>
            ) : (
            <div className="space-y-3">
                {filteredTransfers.map((transfer) => (
                <div
                    key={transfer.id}
                  className="p-4 rounded-lg border border-border hover:bg-muted/50 transition-smooth"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">{transfer.transfer_reference}</h3>
                          <Badge className={getStatusBadge(transfer.status)}>
                            {transfer.status}
                        </Badge>
                          <span className="text-xs text-muted-foreground">
                            {transfer.speed_tier}
                          </span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                        <div>
                            <p>From: <span className="font-medium text-foreground">{transfer.sender_name}</span></p>
                            <p>To: <span className="font-medium text-foreground">{transfer.recipient_name}</span></p>
                          </div>
                          <div>
                            <p>Fee: ${formatAmount(transfer.transfer_fee)}</p>
                            <p>Date: {formatDate(transfer.created_at)}</p>
                          </div>
                        </div>
                      </div>
                      <div className="text-right flex items-start gap-4">
                        <div>
                          <p className="text-2xl font-bold">${formatAmount(transfer.amount_sent)}</p>
                          <p className="text-sm text-muted-foreground">{transfer.currency_sent}</p>
                        </div>
                        <div className="flex flex-col gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => handleViewTransfer(transfer)}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                  <Eye className="w-5 h-5" />
                                  Transfer Details - {transfer.transfer_reference}
                                </DialogTitle>
                              </DialogHeader>
                              {selectedTransfer && (
                                <div className="space-y-6">
                                  {/* Transfer Overview */}
                                  <Card>
                                    <CardHeader>
                                      <CardTitle className="flex items-center gap-2">
                                        <CreditCard className="w-5 h-5" />
                                        Transfer Overview
                                      </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                      <div className="grid grid-cols-2 gap-4">
                                        <div>
                                          <p className="text-sm text-muted-foreground">Transfer Reference</p>
                                          <p className="font-semibold">{selectedTransfer.transfer_reference}</p>
                                        </div>
                                        <div>
                                          <p className="text-sm text-muted-foreground">Status</p>
                                          <Badge className={getStatusBadge(selectedTransfer.status)}>
                                            {selectedTransfer.status}
                                          </Badge>
                                        </div>
                                        <div>
                                          <p className="text-sm text-muted-foreground">Speed Tier</p>
                                          <p className="font-semibold capitalize">{selectedTransfer.speed_tier}</p>
                                        </div>
                                        <div>
                                          <p className="text-sm text-muted-foreground">Created</p>
                                          <p className="font-semibold">{formatDate(selectedTransfer.created_at)}</p>
                                        </div>
                                      </div>
                                    </CardContent>
                                  </Card>

                                  {/* Financial Details */}
                                  <Card>
                                    <CardHeader>
                                      <CardTitle className="flex items-center gap-2">
                                        <DollarSign className="w-5 h-5" />
                                        Financial Details
                                      </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                      <div className="grid grid-cols-2 gap-4">
                                        <div>
                                          <p className="text-sm text-muted-foreground">Amount Sent</p>
                                          <p className="text-2xl font-bold">${formatAmount(selectedTransfer.amount_sent)} {selectedTransfer.currency_sent}</p>
                                        </div>
                                        <div>
                                          <p className="text-sm text-muted-foreground">Amount Received</p>
                                          <p className="text-2xl font-bold">${formatAmount(selectedTransfer.amount_received)} {selectedTransfer.currency_received}</p>
                                        </div>
                                        <div>
                                          <p className="text-sm text-muted-foreground">Transfer Fee</p>
                                          <p className="text-lg font-semibold text-red-600">${formatAmount(selectedTransfer.transfer_fee)}</p>
                                        </div>
                                        <div>
                                          <p className="text-sm text-muted-foreground">Total Cost</p>
                                          <p className="text-lg font-semibold">${formatAmount(Number(selectedTransfer.amount_sent) + Number(selectedTransfer.transfer_fee))}</p>
                                        </div>
                                      </div>
                                    </CardContent>
                                  </Card>

                                  {/* Sender Information */}
                                  <Card>
                                    <CardHeader>
                                      <CardTitle className="flex items-center gap-2">
                                        <User className="w-5 h-5" />
                                        Sender Information
                                      </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                      <div className="flex items-center gap-3">
                                        <User className="w-4 h-4 text-muted-foreground" />
                                        <div>
                                          <p className="font-semibold">{selectedTransfer.sender_name}</p>
                                          <p className="text-sm text-muted-foreground">Sender</p>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-3">
                                        <Mail className="w-4 h-4 text-muted-foreground" />
                                        <div>
                                          <p className="font-medium">{selectedTransfer.sender_email}</p>
                                          <p className="text-sm text-muted-foreground">Email</p>
                                        </div>
                                      </div>
                                    </CardContent>
                                  </Card>

                                  {/* Recipient Information */}
                                  <Card>
                                    <CardHeader>
                                      <CardTitle className="flex items-center gap-2">
                                        <User className="w-5 h-5" />
                                        Recipient Information
                                      </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                      <div className="flex items-center gap-3">
                                        <User className="w-4 h-4 text-muted-foreground" />
                                        <div>
                                          <p className="font-semibold">{selectedTransfer.recipient_name}</p>
                                          <p className="text-sm text-muted-foreground">Recipient</p>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-3">
                                        <Mail className="w-4 h-4 text-muted-foreground" />
                                        <div>
                                          <p className="font-medium">{selectedTransfer.recipient_email}</p>
                                          <p className="text-sm text-muted-foreground">Email</p>
                                        </div>
                                      </div>
                                    </CardContent>
                                  </Card>

                                  {/* Timeline */}
                                  <Card>
                                    <CardHeader>
                                      <CardTitle className="flex items-center gap-2">
                                        <Calendar className="w-5 h-5" />
                                        Transfer Timeline
                                      </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                      <div className="space-y-3">
                                        <div className="flex items-center gap-3">
                                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                          <div>
                                            <p className="font-medium">Transfer Created</p>
                                            <p className="text-sm text-muted-foreground">{formatDate(selectedTransfer.created_at)}</p>
                                          </div>
                                        </div>
                                        {selectedTransfer.completed_at && (
                                          <div className="flex items-center gap-3">
                                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                            <div>
                                              <p className="font-medium">Transfer Completed</p>
                                              <p className="text-sm text-muted-foreground">{formatDate(selectedTransfer.completed_at)}</p>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </CardContent>
                                  </Card>

                                  {/* Status Update Section */}
                                  {selectedTransfer.status !== 'completed' && selectedTransfer.status !== 'failed' && (
                                    <Card>
                                      <CardHeader>
                                        <CardTitle>Update Status</CardTitle>
                                      </CardHeader>
                                      <CardContent>
                                        <div className="flex items-center gap-4">
                                          <Select
                                            value={selectedTransfer.status}
                                            onValueChange={(newStatus) => handleStatusUpdate(selectedTransfer.id, newStatus)}
                                            disabled={updating === selectedTransfer.id}
                                          >
                                            <SelectTrigger className="w-48">
                                              <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                              <SelectItem value="pending">Pending</SelectItem>
                                              <SelectItem value="processing">Processing</SelectItem>
                                              <SelectItem value="completed">Complete</SelectItem>
                                              <SelectItem value="failed">Failed</SelectItem>
                                            </SelectContent>
                                          </Select>
                                          {updating === selectedTransfer.id && (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                          )}
                                        </div>
                                      </CardContent>
                                    </Card>
                                  )}
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
                          {transfer.status !== 'completed' && transfer.status !== 'failed' && (
                            <Select
                              value={transfer.status}
                              onValueChange={(newStatus) => handleStatusUpdate(transfer.id, newStatus)}
                              disabled={updating === transfer.id}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="processing">Processing</SelectItem>
                                <SelectItem value="completed">Complete</SelectItem>
                                <SelectItem value="failed">Failed</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                          {updating === transfer.id && (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          )}
                        </div>
                      </div>
                    </div>
                    {transfer.status === 'pending' && (
                      <div className="mt-3 p-3 rounded-lg bg-blue-50 border border-blue-200">
                        <p className="text-sm text-blue-800 font-medium">⏳ Pending Review</p>
                        <p className="text-xs text-blue-600 mt-1">
                          This transfer is waiting for processing. You can manually update the status.
                        </p>
                      </div>
                    )}
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
