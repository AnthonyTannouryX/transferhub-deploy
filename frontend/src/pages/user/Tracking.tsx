import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Search, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  XCircle, 
  ArrowRight, 
  MapPin, 
  User, 
  DollarSign, 
  CreditCard,
  Smartphone,
  Banknote,
  Loader2,
  RefreshCw,
  Copy,
  ExternalLink
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { transferService, Transfer } from "@/services/transferService";

export default function Tracking() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [transfer, setTransfer] = useState<Transfer | null>(null);
  const [loading, setLoading] = useState(false);
  const [recentTransfers, setRecentTransfers] = useState<Transfer[]>([]);
  const [loadingRecent, setLoadingRecent] = useState(false);

  // Get transfer reference from URL params if available
  useEffect(() => {
    const transferRef = searchParams.get('ref');
    if (transferRef) {
      setSearchQuery(transferRef);
      handleSearch(transferRef);
    }
    loadRecentTransfers();
  }, [searchParams]);

  const loadRecentTransfers = async () => {
    setLoadingRecent(true);
    try {
      const response = await transferService.getTransfers();
      if (response.success && response.transfers) {
        setRecentTransfers(response.transfers.slice(0, 5)); // Show last 5 transfers
      } else {
        console.error('Failed to load transfers:', response.message);
        setRecentTransfers([]);
      }
    } catch (error) {
      console.error('Failed to load recent transfers:', error);
      setRecentTransfers([]);
    } finally {
      setLoadingRecent(false);
    }
  };

  const handleSearch = async (query?: string) => {
    const searchTerm = query || searchQuery.trim();
    if (!searchTerm) {
      toast({
        title: "Search Required",
        description: "Please enter a transfer reference to search",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await transferService.searchTransfer(searchTerm);
      
      if (response.success && response.transfer) {
        setTransfer(response.transfer);
        toast({
          title: "Transfer Found",
          description: `Found transfer ${response.transfer.transfer_reference}`,
        });
      } else {
        setTransfer(null);
        toast({
          title: "Transfer Not Found",
          description: response.message || "No transfer found with that reference",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Search failed:', error);
      toast({
        title: "Search Error",
        description: "Failed to search for transfer",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'processing':
        return <Clock className="w-5 h-5 text-blue-500" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'processing':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'wallet':
        return <Smartphone className="w-4 h-4" />;
      case 'bank':
        return <CreditCard className="w-4 h-4" />;
      case 'cash':
        return <Banknote className="w-4 h-4" />;
      default:
        return <DollarSign className="w-4 h-4" />;
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Transfer reference copied to clipboard",
    });
  };

  const formatAmount = (amount: number | string): string => {
    const numAmount = Number(amount);
    if (isNaN(numAmount)) {
      return '0.00';
    }
    return numAmount.toFixed(2);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation role="user" />
      
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Track Transfer</h1>
              <p className="text-muted-foreground">Search for your transfer using reference number</p>
            </div>
            <Button 
              onClick={() => navigate('/user/new-transfer')}
              className="gradient-hero text-white border-0"
            >
              <ArrowRight className="w-4 h-4 mr-2" />
              New Transfer
            </Button>
          </div>
        </div>

        {/* Search Section */}
        <Card className="shadow-card border-none mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5 text-primary" />
              Track Your Transfer
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Enter your transfer reference to track the status and details
            </p>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Enter transfer reference (e.g., TRF-ABC123)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="text-lg h-12"
                />
              </div>
              <Button 
                onClick={() => handleSearch()} 
                disabled={loading || !searchQuery.trim()}
                className="gradient-hero text-white border-0 h-12 px-8"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-2" />
                    Track Transfer
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Transfer Details */}
        {transfer && (
          <div className="grid gap-6 lg:grid-cols-3 mb-8">
            {/* Main Transfer Info */}
            <Card className="shadow-card border-none lg:col-span-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    {getStatusIcon(transfer.status)}
                    Transfer Details
                  </CardTitle>
                  <Badge className={`${getStatusColor(transfer.status)} border`}>
                    {transfer.status.toUpperCase()}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Transfer Reference */}
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div>
                    <p className="text-sm text-muted-foreground">Transfer Reference</p>
                    <p className="font-mono text-lg font-semibold">{transfer.transfer_reference}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => copyToClipboard(transfer.transfer_reference)}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>

                {/* Beneficiary Info */}
                {transfer.beneficiary_name && (
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-2 mb-2">
                      <User className="w-4 h-4 text-blue-600" />
                      <span className="font-medium text-blue-900">Recipient</span>
                    </div>
                    <p className="font-semibold text-blue-900">{transfer.beneficiary_name}</p>
                    {transfer.beneficiary_email && (
                      <p className="text-sm text-blue-700">{transfer.beneficiary_email}</p>
                    )}
                  </div>
                )}

                {/* Amount and Fees */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Amount Sent</p>
                    <p className="text-2xl font-bold">
                      {transfer.currency_sent} {formatAmount(transfer.amount_sent)}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Transfer Fee</p>
                    <p className="text-lg font-semibold text-muted-foreground">
                      {transfer.currency_sent} {formatAmount(transfer.transfer_fee)}
                    </p>
                  </div>
                </div>

                <Separator />

                {/* Total Cost */}
                <div className="flex justify-between items-center p-4 bg-primary/5 rounded-lg">
                  <span className="text-lg font-medium">Total Cost</span>
                  <span className="text-2xl font-bold text-primary">
                    {transfer.currency_sent} {formatAmount(transfer.total_cost)}
                  </span>
                </div>

                {/* Speed Tier */}
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {transfer.speed_tier === 'express' ? 'Express Transfer' : 'Standard Transfer'}
                  </span>
                  <Badge variant="outline" className="ml-auto">
                    {transfer.speed_tier === 'express' ? 'Instant' : '1-2 hours'}
                  </Badge>
                </div>

                {/* Timestamps */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Created</span>
                    <span className="text-sm font-medium">
                      {new Date(transfer.created_at).toLocaleString()}
                    </span>
                  </div>
                  {(transfer as any).completed_at && (
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Completed</span>
                      <span className="text-sm font-medium">
                        {new Date((transfer as any).completed_at).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Transfer Status Timeline */}
            <Card className="shadow-card border-none">
              <CardHeader>
                <CardTitle className="text-lg">Transfer Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Status Steps */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-semibold">
                        1
                      </div>
                      <div>
                        <p className="font-medium">Transfer Initiated</p>
                        <p className="text-xs text-muted-foreground">Transfer created and processing</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                        transfer.status === 'processing' || transfer.status === 'completed'
                          ? 'bg-primary text-white'
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        2
                      </div>
                      <div>
                        <p className="font-medium">Processing</p>
                        <p className="text-xs text-muted-foreground">Transfer being processed</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                        transfer.status === 'completed'
                          ? 'bg-green-500 text-white'
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        3
                      </div>
                      <div>
                        <p className="font-medium">Completed</p>
                        <p className="text-xs text-muted-foreground">Transfer delivered to recipient</p>
                      </div>
                    </div>
                  </div>

                  {/* Current Status */}
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      {getStatusIcon(transfer.status)}
                      <span className="font-medium">Current Status</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {transfer.status === 'pending' && 'Your transfer is being prepared for processing.'}
                      {transfer.status === 'processing' && 'Your transfer is currently being processed and will be delivered soon.'}
                      {transfer.status === 'completed' && 'Your transfer has been successfully delivered to the recipient.'}
                      {transfer.status === 'failed' && 'There was an issue processing your transfer. Please contact support.'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Recent Transfers */}
        {!transfer && (
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="shadow-card border-none">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <RefreshCw className="w-5 h-5 text-primary" />
                      Recent Transfers
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Your latest transfer history
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loadingRecent ? (
                  <div className="text-center py-8">
                    <Loader2 className="w-8 h-8 text-primary mx-auto mb-4 animate-spin" />
                    <p className="text-muted-foreground">Loading recent transfers...</p>
                  </div>
                ) : recentTransfers.length > 0 ? (
                  <div className="space-y-3">
                    {recentTransfers.map((recentTransfer) => (
                      <div
                        key={recentTransfer.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors group"
                        onClick={() => {
                          setSearchQuery(recentTransfer.transfer_reference);
                          setTransfer(recentTransfer);
                        }}
                      >
                        <div className="flex items-center gap-3">
                          {getStatusIcon(recentTransfer.status)}
                          <div>
                            <p className="font-medium">{recentTransfer.transfer_reference}</p>
                            <p className="text-sm text-muted-foreground">
                              {recentTransfer.currency_sent} {formatAmount(recentTransfer.amount_sent)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(recentTransfer.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getStatusColor(recentTransfer.status)}>
                            {recentTransfer.status}
                          </Badge>
                          <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No recent transfers found</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Create your first transfer to see it here
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card className="shadow-card border-none">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-primary" />
                  Transfer Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                {recentTransfers.length > 0 ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <p className="text-2xl font-bold text-green-600">
                          {recentTransfers.filter(t => t.status === 'completed').length}
                        </p>
                        <p className="text-sm text-green-700">Completed</p>
                      </div>
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <p className="text-2xl font-bold text-blue-600">
                          {recentTransfers.filter(t => t.status === 'processing' || t.status === 'pending').length}
                        </p>
                        <p className="text-sm text-blue-700">In Progress</p>
                      </div>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">Total Transfers</p>
                      <p className="text-2xl font-bold">{recentTransfers.length}</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <DollarSign className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No transfer data available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* No Results */}
        {!loading && !transfer && searchQuery && (
          <Card className="shadow-card border-none">
            <CardContent className="text-center py-12">
              <Search className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Transfer Not Found</h3>
              <p className="text-muted-foreground mb-4">
                No transfer found with reference "{searchQuery}"
              </p>
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchQuery("");
                  setTransfer(null);
                }}
              >
                Clear Search
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
