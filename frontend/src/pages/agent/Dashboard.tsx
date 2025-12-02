import { Navigation } from "@/components/Navigation";
import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { DollarSign, TrendingUp, Clock, MapPin, ArrowUpRight, ArrowDownLeft, Bell, Users, Shield, AlertTriangle, CheckCircle, Star, Phone, Mail, Globe, Zap, RefreshCw, Edit2, Save } from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { AgentService } from "@/services/agentService";
import { useToast } from "@/hooks/use-toast";

export default function AgentDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [isEditScheduleOpen, setIsEditScheduleOpen] = useState(false);
  const [schedule, setSchedule] = useState({
    monday: { isOpen: true, startTime: '09:00', endTime: '20:00' },
    tuesday: { isOpen: true, startTime: '09:00', endTime: '20:00' },
    wednesday: { isOpen: true, startTime: '09:00', endTime: '20:00' },
    thursday: { isOpen: true, startTime: '09:00', endTime: '20:00' },
    friday: { isOpen: true, startTime: '09:00', endTime: '20:00' },
    saturday: { isOpen: true, startTime: '09:00', endTime: '20:00' },
    sunday: { isOpen: false, startTime: '09:00', endTime: '20:00' },
  });

  // Get personalized greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  // Load dashboard data
  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      const data = await AgentService.getDashboardData();
      setDashboardData(data);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadDashboardData();
    setIsRefreshing(false);
  };

  const handleSaveSchedule = async () => {
    try {
      await AgentService.updateSchedule(schedule);
      toast({
        title: "Success",
        description: "Store schedule updated successfully",
      });
      setIsEditScheduleOpen(false);
    } catch (error: any) {
      console.error('Error updating schedule:', error);
      const errorMessage = error?.message || "Failed to update schedule";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const updateDaySchedule = (day: string, field: string, value: any) => {
    setSchedule(prev => ({
      ...prev,
      [day]: {
        ...prev[day as keyof typeof prev],
        [field]: value,
      }
    }));
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  // Get transaction type icon
  const getTransactionIcon = (type: string, description?: string) => {
    if (description?.toLowerCase().includes('cash-out') || description?.toLowerCase().includes('cashout')) {
      return <ArrowUpRight className="w-4 h-4 text-destructive" />;
    }
    if (description?.toLowerCase().includes('cash-in') || description?.toLowerCase().includes('cashin')) {
      return <ArrowDownLeft className="w-4 h-4 text-success" />;
    }
    
    switch (type) {
      case 'deposit':
        return <ArrowDownLeft className="w-4 h-4 text-success" />;
      case 'withdrawal':
        return <ArrowUpRight className="w-4 h-4 text-destructive" />;
      case 'transfer':
        return <DollarSign className="w-4 h-4 text-primary" />;
      default:
        return <DollarSign className="w-4 h-4 text-muted-foreground" />;
    }
  };

  // Get transaction type label
  const getTransactionTypeLabel = (type: string, description?: string) => {
    if (description?.toLowerCase().includes('cash-out') || description?.toLowerCase().includes('cashout')) {
      return 'Cash Out';
    }
    if (description?.toLowerCase().includes('cash-in') || description?.toLowerCase().includes('cashin')) {
      return 'Cash In';
    }
    
    switch (type) {
      case 'deposit':
        return 'Cash In';
      case 'withdrawal':
        return 'Cash Out';
      case 'transfer':
        return 'Transfer';
      default:
        return 'Transaction';
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation role="agent" />
        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
              <p className="text-muted-foreground">Loading dashboard...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation role="agent" />
      
      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-3 text-foreground">
                {getGreeting()}{dashboardData?.agent_info?.name ? `, ${dashboardData.agent_info.name.split(' ')[0]}` : user?.first_name ? `, ${user.first_name}` : ' there'}!
              </h1>
              <p className="text-lg text-muted-foreground">Agent Dashboard</p>
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="w-4 h-4" />
                <span className="text-lg">{dashboardData?.store_info?.name || 'Agent Store'}</span>
                <span className="text-muted-foreground/50">•</span>
                <span>Today's Overview</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <StatCard
            title="Today's Cash In"
            value={`$${dashboardData?.stats?.today_cash_in || '0.00'}`}
            icon={TrendingUp}
            trend={{ value: `${dashboardData?.stats?.today_transactions_count || 0} transactions`, isPositive: true }}
            variant="success"
          />
          <StatCard
            title="Today's Cash Out"
            value={`$${dashboardData?.stats?.today_cash_out || '0.00'}`}
            icon={DollarSign}
            trend={{ value: `${dashboardData?.stats?.today_transactions_count || 0} transactions`, isPositive: true }}
            variant="default"
          />
          <StatCard
            title="Digital Wallet"
            value={`$${dashboardData?.stats?.digital_wallet_balance || '0.00'}`}
            icon={TrendingUp}
            variant="success"
          />
          <StatCard
            title="Cash Balance"
            value={`$${dashboardData?.stats?.cash_balance || '0.00'}`}
            icon={DollarSign}
            variant="default"
          />
        </div>

        <div className="grid gap-8 lg:grid-cols-3 mb-10">
          {/* Store Info */}
          <div className="lg:col-span-1">
            <Card className="shadow-sm border border-border/50">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-lg">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <MapPin className="w-4 h-4 text-primary" />
                  </div>
                  Store Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">Store Name</p>
                    <p className="font-semibold text-foreground">{dashboardData?.store_info?.name || 'Agent Store'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">Working Hours</p>
                    <p className="font-semibold text-foreground">{dashboardData?.store_info?.working_hours || '9:00 AM - 8:00 PM'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">Location</p>
                    <div className="flex items-start gap-3">
                      <MapPin className="w-4 h-4 mt-1 text-primary" />
                      <p className="text-sm text-foreground">{dashboardData?.store_info?.location || 'Location not set'}</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" className="h-9">
                      <Phone className="w-4 h-4 mr-2" />
                      {dashboardData?.store_info?.phone || 'Not provided'}
                    </Button>
                    <Button variant="outline" className="h-9">
                      <Mail className="w-4 h-4 mr-2" />
                      Contact
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Store Schedule */}
          <div className="lg:col-span-2">
            <Card className="shadow-sm border border-border/50">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-3 text-lg">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Clock className="w-4 h-4 text-primary" />
                    </div>
                    Store Schedule
                  </CardTitle>
                  <Dialog open={isEditScheduleOpen} onOpenChange={setIsEditScheduleOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Edit2 className="w-4 h-4 mr-2" />
                        Edit Schedule
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Edit Store Schedule</DialogTitle>
                        <DialogDescription>
                          Update your store's operating hours for each day of the week
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        {Object.keys(schedule).map((day) => {
                          const dayData = schedule[day as keyof typeof schedule];
                          const dayName = day.charAt(0).toUpperCase() + day.slice(1);
                          return (
                            <div key={day} className="p-4 border rounded-lg space-y-3">
                              <div className="flex items-center justify-between">
                                <Label className="text-base font-semibold">{dayName}</Label>
                                <div className="flex items-center gap-2">
                                  <Label htmlFor={`${day}-toggle`} className="text-sm">
                                    {dayData.isOpen ? 'Open' : 'Closed'}
                                  </Label>
                                  <Switch
                                    id={`${day}-toggle`}
                                    checked={dayData.isOpen}
                                    onCheckedChange={(checked) => updateDaySchedule(day, 'isOpen', checked)}
                                  />
                                </div>
                              </div>
                              {dayData.isOpen && (
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <Label htmlFor={`${day}-start`}>Start Time</Label>
                                    <Input
                                      id={`${day}-start`}
                                      type="time"
                                      value={dayData.startTime}
                                      onChange={(e) => updateDaySchedule(day, 'startTime', e.target.value)}
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor={`${day}-end`}>End Time</Label>
                                    <Input
                                      id={`${day}-end`}
                                      type="time"
                                      value={dayData.endTime}
                                      onChange={(e) => updateDaySchedule(day, 'endTime', e.target.value)}
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditScheduleOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleSaveSchedule}>
                          <Save className="w-4 h-4 mr-2" />
                          Save Changes
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.keys(schedule).map((day) => {
                    const dayData = schedule[day as keyof typeof schedule];
                    const dayName = day.charAt(0).toUpperCase() + day.slice(1);
                    return (
                      <div key={day} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-20">
                            <span className="font-medium text-sm text-foreground">{dayName}</span>
                          </div>
                          <Badge variant={dayData.isOpen ? 'default' : 'secondary'} className="text-xs">
                            {dayData.isOpen ? 'Open' : 'Closed'}
                          </Badge>
                        </div>
                        <div className="text-right">
                          {dayData.isOpen ? (
                            <span className="text-sm font-medium text-foreground">
                              {formatTime(dayData.startTime)} - {formatTime(dayData.endTime)}
                            </span>
                          ) : (
                            <span className="text-sm text-muted-foreground">Closed</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Recent Transactions */}
        <Card className="shadow-sm border border-border/50 mb-10">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-primary" />
                </div>
                Recent Transactions
              </CardTitle>
              <Link to="/agent/transactions">
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                  View All
                  <ArrowUpRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-4">
              {dashboardData?.recent_transactions?.length > 0 ? (
                dashboardData.recent_transactions.map((transaction: any) => (
                  <div key={transaction.id} className="flex items-center justify-between p-5 rounded-xl border border-border/30 hover:border-border/60 hover:bg-muted/30 transition-all duration-200">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-primary/5 flex items-center justify-center">
                        {getTransactionIcon(transaction.type, transaction.description)}
                      </div>
                      <div className="space-y-1">
                        <p className="font-semibold text-foreground">{getTransactionTypeLabel(transaction.type, transaction.description)}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span className="font-medium">{transaction.description}</span>
                          <span>•</span>
                          <span>{transaction.time_ago}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-bold text-lg text-foreground">${transaction.amount}</p>
                      </div>
                      {getStatusBadge(transaction.status)}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No recent transactions</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Link to="/agent/cash">
            <Card className="shadow-sm border border-border/50 hover:border-border/80 hover:shadow-md transition-all duration-200 cursor-pointer group">
              <CardContent className="p-6">
                <div className="w-14 h-14 rounded-2xl bg-green-50 flex items-center justify-center mb-4 group-hover:bg-green-100 transition-colors duration-200">
                  <TrendingUp className="w-7 h-7 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-foreground">Cash Operations</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Process cash-in and cash-out transactions
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link to="/agent/transactions">
            <Card className="shadow-sm border border-border/50 hover:border-border/80 hover:shadow-md transition-all duration-200 cursor-pointer group">
              <CardContent className="p-6">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mb-4 group-hover:bg-blue-100 transition-colors duration-200">
                  <Clock className="w-7 h-7 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-foreground">Transaction History</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  View all your transactions
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link to="/support">
            <Card className="shadow-sm border border-border/50 hover:border-border/80 hover:shadow-md transition-all duration-200 cursor-pointer group">
              <CardContent className="p-6">
                <div className="w-14 h-14 rounded-2xl bg-purple-50 flex items-center justify-center mb-4 group-hover:bg-purple-100 transition-colors duration-200">
                  <Shield className="w-7 h-7 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-foreground">Support</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Get help and assistance
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </main>
    </div>
  );
}
