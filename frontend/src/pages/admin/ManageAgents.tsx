import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, MapPin, CheckCircle, XCircle, Building2, Users, TrendingUp, DollarSign, Clock, Filter, RefreshCw, Download, Eye, Shield, AlertTriangle, Phone, Mail, Star, MoreVertical, Ban, Key, BarChart3, Activity, Target, Award } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { AdminService, AdminAgent } from "@/services/adminService";
import AgentDetailsModal from "@/components/AgentDetailsModal";

interface AgentPerformanceStats {
  total_transactions: number;
  total_cash_in: number;
  total_cash_out: number;
  total_volume_processed: number;
  total_commissions_earned: number;
  total_admin_revenue: number;
  average_success_rate: number;
  total_active_agents: number;
  top_performers: Array<{
    id: string;
    name: string;
    store_name: string;
    transactions_count: number;
    cash_in: number;
    cash_out: number;
    volume_processed: number;
    commissions_earned: number;
    admin_revenue: number;
  }>;
}

export default function ManageAgents() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [approvalFilter, setApprovalFilter] = useState("all");
  const [agents, setAgents] = useState<AdminAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState({
    total: 0,
    active: 0,
    pending: 0,
    approved: 0,
    suspended: 0,
  });
  const [performanceStats, setPerformanceStats] = useState<AgentPerformanceStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 15,
    total: 0,
  });
  const [selectedAgent, setSelectedAgent] = useState<AdminAgent | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  // Load performance statistics
  const loadPerformanceStats = async () => {
    try {
      setLoadingStats(true);
      const response = await AdminService.getAgentPerformanceStats();
      
      if (response.success) {
        setPerformanceStats(response.performance_stats);
      } else {
        console.error('Failed to load performance statistics:', response.message);
        toast({
          title: "Error",
          description: "Failed to load performance statistics",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Failed to load performance statistics:', error);
      toast({
        title: "Error",
        description: "Failed to load performance statistics",
        variant: "destructive",
      });
    } finally {
      setLoadingStats(false);
    }
  };

  // Load agents data
  const loadAgents = async () => {
    try {
      setLoading(true);
      const response = await AdminService.getAgents({
        search: searchTerm,
        status: statusFilter,
        approval: approvalFilter,
        per_page: 15,
      });
      
      if (response.success) {
        setAgents(response.agents);
        setStatistics(response.statistics);
        setPagination(response.pagination);
      }
    } catch (error) {
      console.error('Failed to load agents:', error);
      toast({
        title: "Error",
        description: "Failed to load agents data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAgents();
  }, [searchTerm, statusFilter, approvalFilter]);

  useEffect(() => {
    loadPerformanceStats();
  }, []);

  // Handle agent actions
  const handleApprove = async (agentId: string) => {
    try {
      const response = await AdminService.approveAgent(agentId);
      if (response.success) {
        toast({
          title: "Success",
          description: response.message,
        });
        loadAgents(); // Refresh the list
      }
    } catch (error) {
      console.error('Failed to approve agent:', error);
      toast({
        title: "Error",
        description: "Failed to approve agent",
        variant: "destructive",
      });
    }
  };

  const handleReject = async (agentId: string) => {
    try {
      const response = await AdminService.rejectAgent(agentId);
      if (response.success) {
        toast({
          title: "Success",
          description: response.message,
        });
        loadAgents(); // Refresh the list
      }
    } catch (error) {
      console.error('Failed to reject agent:', error);
      toast({
        title: "Error",
        description: "Failed to reject agent",
        variant: "destructive",
      });
    }
  };

  const handleSuspend = async (agentId: string) => {
    try {
      const response = await AdminService.suspendAgent(agentId);
      if (response.success) {
        toast({
          title: "Success",
          description: response.message,
        });
        loadAgents(); // Refresh the list
      }
    } catch (error) {
      console.error('Failed to suspend agent:', error);
      toast({
        title: "Error",
        description: "Failed to suspend agent",
        variant: "destructive",
      });
    }
  };

  const handleActivate = async (agentId: string) => {
    try {
      const response = await AdminService.activateAgent(agentId);
      if (response.success) {
        toast({
          title: "Success",
          description: response.message,
        });
        loadAgents(); // Refresh the list
      }
    } catch (error) {
      console.error('Failed to activate agent:', error);
      toast({
        title: "Error",
        description: "Failed to activate agent",
        variant: "destructive",
      });
    }
  };

  const handleViewDetails = (agent: AdminAgent) => {
    setSelectedAgent(agent);
    setIsDetailsModalOpen(true);
  };

  const handleCloseDetails = () => {
    setSelectedAgent(null);
    setIsDetailsModalOpen(false);
  };

  // Helper function to generate opening hours summary
  const getOpeningHoursSummary = (openingHours: any) => {
    if (!openingHours) return null;
    
    const days = Object.keys(openingHours);
    const openDays = days.filter(day => openingHours[day].isOpen);
    const closedDays = days.filter(day => !openingHours[day].isOpen);
    
    if (openDays.length === 0) {
      return "Closed all days";
    }
    
    if (openDays.length === 7) {
      return "Open 7 days a week";
    }
    
    if (openDays.length === 5 && closedDays.length === 2) {
      const weekdays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
      const weekends = ['saturday', 'sunday'];
      
      if (openDays.every(day => weekdays.includes(day)) && 
          closedDays.every(day => weekends.includes(day))) {
        return "Weekdays only";
      }
    }
    
    // Get common hours for open days
    const openDayHours = openDays.map(day => openingHours[day].hours);
    const hasCommonHours = openDayHours.every(dayHours => 
      dayHours.length === 1 && 
      dayHours[0].open === openDayHours[0][0].open && 
      dayHours[0].close === openDayHours[0][0].close
    );
    
    if (hasCommonHours && openDayHours[0].length > 0) {
      const commonTime = `${openDayHours[0][0].open} - ${openDayHours[0][0].close}`;
      return `${openDays.length} days (${commonTime})`;
    }
    
    return `${openDays.length} days open`;
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation role="admin" />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Manage Agents</h1>
              <p className="text-muted-foreground">View and manage partner stores and agents</p>
            </div>
          </div>
        </div>

        {/* Agent Stats */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card className="shadow-card border-none">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total Agents</p>
                  <p className="text-2xl font-bold">{statistics.total.toLocaleString()}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-card border-none">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Active Agents</p>
                  <p className="text-2xl font-bold text-success">{statistics.active.toLocaleString()}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-success" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-card border-none">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Pending Approval</p>
                  <p className="text-2xl font-bold text-warning">{statistics.pending}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-warning" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-card border-none">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Suspended</p>
                  <p className="text-2xl font-bold text-primary">{statistics.suspended}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Performance Statistics Dashboard */}
        {performanceStats && (
          <div className="mb-8">
            <Card className="shadow-card border-none">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  Agent Performance Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <div className="p-4 rounded-lg border">
                    <p className="text-sm text-muted-foreground mb-1">Total Transactions</p>
                    <p className="text-2xl font-bold">{performanceStats.total_transactions.toLocaleString()}</p>
                  </div>

                  <div className="p-4 rounded-lg border">
                    <p className="text-sm text-muted-foreground mb-1">Total Cash In</p>
                    <p className="text-2xl font-bold text-green-600">${performanceStats.total_cash_in.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                  </div>

                  <div className="p-4 rounded-lg border">
                    <p className="text-sm text-muted-foreground mb-1">Total Cash Out</p>
                    <p className="text-2xl font-bold text-blue-600">${performanceStats.total_cash_out.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                  </div>

                  <div className="p-4 rounded-lg border">
                    <p className="text-sm text-muted-foreground mb-1">Admin Revenue</p>
                    <p className="text-2xl font-bold text-purple-600">${performanceStats.total_admin_revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                  </div>
                </div>

                {/* Top Performers */}
                {performanceStats.top_performers.length > 0 && (
                  <div className="mt-6 border-t pt-6">
                    <h4 className="font-semibold mb-4">Top Performing Agents</h4>
                    <div className="space-y-3">
                      {performanceStats.top_performers.map((performer, index) => (
                        <div key={performer.id} className="p-4 rounded-lg border bg-muted/30">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center font-bold text-yellow-700">
                                {index + 1}
                              </div>
                              <div>
                                <p className="font-semibold">{performer.name}</p>
                                <p className="text-sm text-muted-foreground">{performer.store_name}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold">{performer.transactions_count} Transactions</p>
                              <p className="text-sm text-green-600">${performer.commissions_earned.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Earned</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Loading State for Performance Stats */}
        {loadingStats && (
          <div className="mb-8">
            <Card className="shadow-card border-none">
              <CardContent className="p-6">
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <span className="ml-2 text-sm text-muted-foreground">Loading performance statistics...</span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card className="shadow-card border-none mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-primary" />
              Search & Filter
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="relative md:col-span-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder="Search by store name, owner, or city..." 
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
              <Select value={approvalFilter} onValueChange={setApprovalFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Agents</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="pending">Pending Approval</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Agents List */}
        <Card className="shadow-card border-none">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary" />
                All Agents ({agents.length})
              </CardTitle>
              <Button>
                <Download className="w-4 h-4 mr-2" />
                Export Data
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading agents...</p>
                </div>
              ) : (
                agents.map((agent) => (
                <div key={agent.id} className="p-6 rounded-lg border border-border hover:bg-muted/50 transition-smooth">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <Building2 className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-lg">{agent.store?.store_name || 'No Store'}</h3>
                          <Badge 
                            variant={agent.status === "active" ? "default" : agent.status === "pending" ? "secondary" : "destructive"}
                            className={agent.status === "active" ? "bg-success/10 text-success" : agent.status === "pending" ? "bg-warning/10 text-warning" : "bg-destructive/10 text-destructive"}
                          >
                            {!agent.admin_approved && agent.status === "inactive" ? "rejected" : agent.status}
                          </Badge>
                          {agent.admin_approved && (
                            <Badge variant="outline" className="bg-success/10 text-success border-success">
                              <Shield className="w-3 h-3 mr-1" />
                              Approved
                            </Badge>
                          )}
                        </div>
                        <p className="text-muted-foreground mb-2">{agent.first_name} {agent.last_name}</p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            <span>{agent.store?.city || 'N/A'}</span>
                          </div>
                          <span>•</span>
                          <span>Joined: {new Date(agent.created_at).toLocaleDateString()}</span>
                          <span>•</span>
                          <div className="flex items-center gap-1">
                            <Mail className="w-4 h-4" />
                            <span>{agent.email}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm">
                        <Phone className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Mail className="w-4 h-4" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewDetails(agent)}>
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          {!agent.admin_approved && agent.status !== 'inactive' && (
                            <>
                              <DropdownMenuItem onClick={() => handleApprove(agent.id)}>
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Approve Agent
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleReject(agent.id)}>
                                <XCircle className="w-4 h-4 mr-2" />
                                Reject Agent
                              </DropdownMenuItem>
                            </>
                          )}
                          {!agent.admin_approved && agent.status === 'inactive' && (
                            <DropdownMenuItem disabled className="text-muted-foreground">
                              <XCircle className="w-4 h-4 mr-2" />
                              Application Rejected
                            </DropdownMenuItem>
                          )}
                          {agent.status === "active" && agent.admin_approved && (
                            <DropdownMenuItem 
                              onClick={() => handleSuspend(agent.id)}
                              className="text-destructive"
                            >
                              <Ban className="w-4 h-4 mr-2" />
                              Suspend Agent
                            </DropdownMenuItem>
                          )}
                          {agent.status === "suspended" && (
                            <DropdownMenuItem 
                              onClick={() => handleActivate(agent.id)}
                              className="text-success"
                            >
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Activate Agent
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-4 mb-4 p-4 rounded-lg bg-muted/50">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Contact</p>
                      <p className="text-sm font-medium">{agent.email}</p>
                      <p className="text-sm font-medium">{agent.phone || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Store Address</p>
                      <p className="font-medium">{agent.store?.address || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Status</p>
                      <p className="font-medium capitalize">{!agent.admin_approved && agent.status === "inactive" ? "rejected" : agent.status}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Email Verified</p>
                      <p className="font-medium">{agent.email_verified ? 'Yes' : 'No'}</p>
                    </div>
                  </div>

                  {agent.store?.opening_hours && (
                    <div className="mb-4 p-3 rounded-lg bg-blue-50 border border-blue-200">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-blue-600" />
                        <p className="text-sm font-medium text-blue-800">Opening Hours</p>
                      </div>
                      <p className="text-sm text-blue-700 mt-1">
                        {getOpeningHoursSummary(agent.store.opening_hours)}
                      </p>
                    </div>
                  )}

                  {!agent.admin_approved && agent.status !== 'inactive' ? (
                    <div className="flex gap-3">
                      <Button
                        variant="success"
                        className="flex-1"
                        onClick={() => handleApprove(agent.id)}
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Approve Agent
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => handleReject(agent.id)}
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Reject Application
                      </Button>
                    </div>
                  ) : !agent.admin_approved && agent.status === 'inactive' ? (
                    <div className="flex gap-3">
                      <Button variant="destructive" className="flex-1" disabled>
                        <XCircle className="w-4 h-4 mr-2" />
                        Application Rejected
                      </Button>
                    </div>
                  ) : (
                    <div className="flex gap-3">
                      <Button 
                        variant="outline"
                        onClick={() => handleViewDetails(agent)}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </Button>
                      <Button variant="outline">
                        <Key className="w-4 h-4 mr-2" />
                        Edit Profile
                      </Button>
                      {agent.status === "active" && (
                        <Button 
                          variant="destructive"
                          onClick={() => handleSuspend(agent.id)}
                        >
                          <Ban className="w-4 h-4 mr-2" />
                          Suspend Agent
                        </Button>
                      )}
                      {agent.status === "suspended" && (
                        <Button 
                          variant="success"
                          onClick={() => handleActivate(agent.id)}
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Activate Agent
                        </Button>
                      )}
                    </div>
                  )}
                </div>
                ))
              )}
            </div>

            {agents.length === 0 && !loading && (
              <div className="text-center py-12">
                <Building2 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No agents found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm ? "Try adjusting your search terms" : "No agents match your current filters"}
                </p>
                <Button variant="outline" onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("all");
                  setApprovalFilter("all");
                }}>
                  Clear Filters
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Agent Details Modal */}
      <AgentDetailsModal
        agent={selectedAgent}
        isOpen={isDetailsModalOpen}
        onClose={handleCloseDetails}
        onApprove={handleApprove}
        onReject={handleReject}
        onSuspend={handleSuspend}
        onActivate={handleActivate}
      />
    </div>
  );
}
