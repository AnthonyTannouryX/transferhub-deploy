import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Building2, 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  User, 
  Calendar, 
  Shield, 
  CheckCircle, 
  XCircle,
  Star,
  TrendingUp,
  DollarSign,
  Globe,
  AlertTriangle,
  BarChart3,
  Activity,
  Target,
  Award
} from "lucide-react";
import { AdminAgent, AdminService } from "@/services/adminService";
import { useState, useEffect } from "react";

interface AgentStatistics {
  transactions: {
    total: number;
    cash_in_count: number;
    cash_out_count: number;
    success_rate: number;
    total_cash_in: number;
    total_cash_out: number;
    total_volume_processed: number;
    total_fees_collected: number;
    average_transaction_amount: number;
  };
  commissions: {
    total_transactions: number;
    paid: number;
    pending: number;
    cancelled: number;
    total_earned: number;
    pending_amount: number;
    average_rate: number;
  };
  recent_activity: {
    transactions_last_30_days: number;
    commissions_last_30_days: number;
  };
  performance: {
    success_rate: number;
    average_transaction_amount: number;
    total_volume_processed: number;
    total_commissions_earned: number;
    total_admin_revenue: number;
  };
}

interface AgentDetailsModalProps {
  agent: AdminAgent | null;
  isOpen: boolean;
  onClose: () => void;
  onApprove?: (agentId: string) => void;
  onReject?: (agentId: string) => void;
  onSuspend?: (agentId: string) => void;
  onActivate?: (agentId: string) => void;
}

export default function AgentDetailsModal({ 
  agent, 
  isOpen, 
  onClose, 
  onApprove, 
  onReject, 
  onSuspend, 
  onActivate 
}: AgentDetailsModalProps) {
  const [statistics, setStatistics] = useState<AgentStatistics | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  useEffect(() => {
    if (agent && isOpen) {
      fetchStatistics();
    }
  }, [agent, isOpen]);

  const fetchStatistics = async () => {
    if (!agent) return;
    
    setLoadingStats(true);
    try {
      const response = await AdminService.getAgentStatistics(agent.id);
      if (response.success) {
        setStatistics(response.statistics);
      }
    } catch (error) {
      console.error('Failed to fetch agent statistics:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  if (!agent) return null;

  const getStatusColor = (status: string, adminApproved: boolean) => {
    // Handle rejected state
    if (!adminApproved && status === 'inactive') {
      return 'bg-red-100 text-red-800 border-red-200';
    }
    
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'suspended':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'inactive':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatOpeningHours = (openingHours: any) => {
    if (!openingHours) return null;
    
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    
    return (
      <div className="space-y-2">
        {days.map((day, index) => {
          const dayData = openingHours[day];
          if (!dayData) return null;
          
          return (
            <div key={day} className="flex items-center justify-between py-3 px-4 rounded-lg border bg-card">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${dayData.isOpen ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="font-medium text-sm">{dayNames[index]}</span>
              </div>
              <div className="text-right">
                {dayData.isOpen ? (
                  <div className="text-sm">
                    {dayData.hours && dayData.hours.length > 0 ? (
                      <div className="space-y-1">
                        {dayData.hours.map((slot: any, slotIndex: number) => (
                          <div key={slotIndex} className="text-green-700 font-medium">
                            {slot.open} - {slot.close}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-green-700 font-medium">Open</span>
                    )}
                  </div>
                ) : (
                  <span className="text-red-700 font-medium text-sm">Closed</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary" />
            Agent Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Agent Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Building2 className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">{agent.store?.store_name || 'No Store Name'}</h2>
                <p className="text-muted-foreground">{agent.first_name} {agent.last_name}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge className={getStatusColor(agent.status, agent.admin_approved)}>
                    {!agent.admin_approved && agent.status === 'inactive' ? 'Rejected' : agent.status.charAt(0).toUpperCase() + agent.status.slice(1)}
                  </Badge>
                  {agent.admin_approved && (
                    <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                      <Shield className="w-3 h-3 mr-1" />
                      Approved
                    </Badge>
                  )}
                  {agent.email_verified && (
                    <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Verified
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{agent.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <p className="font-medium">{agent.phone || 'Not provided'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Joined</p>
                    <p className="font-medium">{formatDate(agent.created_at)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Shield className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Admin Approval</p>
                    <p className="font-medium">{agent.admin_approved ? 'Approved' : 'Pending'}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Store Information */}
          {agent.store && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  Store Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <Building2 className="w-4 h-4 text-muted-foreground mt-1" />
                    <div>
                      <p className="text-sm text-muted-foreground">Store Name</p>
                      <p className="font-medium">{agent.store.store_name}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-muted-foreground mt-1" />
                    <div>
                      <p className="text-sm text-muted-foreground">Location</p>
                      <p className="font-medium">{agent.store.city}, {agent.store.country}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 md:col-span-2">
                    <MapPin className="w-4 h-4 text-muted-foreground mt-1" />
                    <div>
                      <p className="text-sm text-muted-foreground">Address</p>
                      <p className="font-medium">{agent.store.address}</p>
                    </div>
                  </div>
                  {agent.store.phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Store Phone</p>
                        <p className="font-medium">{agent.store.phone}</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Opening Hours */}
          {agent.store?.opening_hours && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Store Opening Hours
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Business hours set during registration
                </p>
              </CardHeader>
              <CardContent>
                {/* Quick Summary */}
                <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2 text-blue-800 mb-2">
                    <Clock className="w-4 h-4" />
                    <span className="font-medium text-sm">Quick Summary</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-blue-700">
                        {(() => {
                          const openDays = Object.values(agent.store.opening_hours).filter((day: any) => day.isOpen).length;
                          const totalDays = Object.keys(agent.store.opening_hours).length;
                          return `Open ${openDays} out of ${totalDays} days per week`;
                        })()}
                      </p>
                    </div>
                    <div>
                      <p className="text-blue-700">
                        {(() => {
                          const openDays = Object.entries(agent.store.opening_hours).filter(([_, day]: [string, any]) => day.isOpen);
                          if (openDays.length === 0) return "Closed all days";
                          if (openDays.length === 7) return "Open 7 days a week";
                          if (openDays.length === 5) return "Weekdays only";
                          return `${openDays.length} days per week`;
                        })()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Detailed Schedule */}
                <div className="space-y-3">
                  <h4 className="font-medium text-sm text-muted-foreground mb-3">Detailed Schedule</h4>
                  {formatOpeningHours(agent.store.opening_hours)}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Account Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Account Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${agent.status === 'active' ? 'bg-green-500' : agent.status === 'pending' ? 'bg-yellow-500' : 'bg-red-500'}`} />
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <p className="font-medium capitalize">{agent.status}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${agent.email_verified ? 'bg-green-500' : 'bg-red-500'}`} />
                  <div>
                    <p className="text-sm text-muted-foreground">Email Verification</p>
                    <p className="font-medium">{agent.email_verified ? 'Verified' : 'Not Verified'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${agent.admin_approved ? 'bg-green-500' : 'bg-yellow-500'}`} />
                  <div>
                    <p className="text-sm text-muted-foreground">Admin Approval</p>
                    <p className="font-medium">{agent.admin_approved ? 'Approved' : 'Pending'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Last Updated</p>
                    <p className="font-medium">{formatDate(agent.updated_at)}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Statistics Section */}
          {statistics && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Performance Statistics
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Agent's work performance and commission data
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Transaction Statistics */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <Activity className="w-4 h-4" />
                      Transaction Statistics
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Total Transactions:</span>
                        <span className="font-medium">{statistics.transactions.total}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Cash In:</span>
                        <span className="font-medium text-green-600">{statistics.transactions.cash_in_count}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Cash Out:</span>
                        <span className="font-medium text-blue-600">{statistics.transactions.cash_out_count}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Success Rate:</span>
                        <span className="font-medium">{statistics.transactions.success_rate}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Volume Statistics */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <TrendingUp className="w-4 h-4" />
                      Volume Statistics
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Total Cash In:</span>
                        <span className="font-medium text-green-600">${statistics.transactions.total_cash_in.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Total Cash Out:</span>
                        <span className="font-medium text-blue-600">${statistics.transactions.total_cash_out.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Fees Collected:</span>
                        <span className="font-medium">${statistics.transactions.total_fees_collected.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Avg Transaction:</span>
                        <span className="font-medium">${statistics.transactions.average_transaction_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                    </div>
                  </div>

                  {/* Commission Statistics */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <DollarSign className="w-4 h-4" />
                      Commission Statistics
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Total Transactions:</span>
                        <span className="font-medium">{statistics.commissions.total_transactions}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Paid:</span>
                        <span className="font-medium text-green-600">{statistics.commissions.paid}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Pending:</span>
                        <span className="font-medium text-yellow-600">{statistics.commissions.pending}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Total Earned:</span>
                        <span className="font-medium text-green-600">${statistics.commissions.total_earned.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Avg Commission Rate:</span>
                        <span className="font-medium">{statistics.commissions.average_rate.toFixed(2)}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Performance Metrics */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <Target className="w-4 h-4" />
                      Performance Metrics
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Success Rate:</span>
                        <span className="font-medium">{statistics.performance.success_rate}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Avg Transaction:</span>
                        <span className="font-medium">${statistics.performance.average_transaction_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Total Volume:</span>
                        <span className="font-medium">${statistics.performance.total_volume_processed.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Commissions:</span>
                        <span className="font-medium text-green-600">${statistics.performance.total_commissions_earned.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Admin Revenue:</span>
                        <span className="font-medium text-purple-600">${statistics.performance.total_admin_revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2 text-blue-800 mb-3">
                    <Award className="w-4 h-4" />
                    <span className="font-medium text-sm">Recent Activity (Last 30 Days)</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="text-sm">
                      <p className="text-blue-700">
                        <span className="font-medium">{statistics.recent_activity.transactions_last_30_days}</span> transactions processed
                      </p>
                    </div>
                    <div className="text-sm">
                      <p className="text-blue-700">
                        <span className="font-medium">${statistics.recent_activity.commissions_last_30_days.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span> in commissions earned
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Loading State for Statistics */}
          {loadingStats && (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <span className="ml-2 text-sm text-muted-foreground">Loading statistics...</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            {!agent.admin_approved && agent.status !== 'inactive' && (
              <>
                <Button 
                  variant="default" 
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => {
                    onApprove?.(agent.id);
                    onClose();
                  }}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Approve Agent
                </Button>
                <Button 
                  variant="destructive"
                  onClick={() => {
                    onReject?.(agent.id);
                    onClose();
                  }}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Reject Agent
                </Button>
              </>
            )}
            {!agent.admin_approved && agent.status === 'inactive' && (
              <Button variant="destructive" disabled>
                <XCircle className="w-4 h-4 mr-2" />
                Application Rejected
              </Button>
            )}
            {agent.status === 'active' && agent.admin_approved && (
              <Button 
                variant="destructive"
                onClick={() => {
                  onSuspend?.(agent.id);
                  onClose();
                }}
              >
                <AlertTriangle className="w-4 h-4 mr-2" />
                Suspend Agent
              </Button>
            )}
            {agent.status === 'suspended' && (
              <Button 
                variant="default"
                className="bg-green-600 hover:bg-green-700"
                onClick={() => {
                  onActivate?.(agent.id);
                  onClose();
                }}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Activate Agent
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
