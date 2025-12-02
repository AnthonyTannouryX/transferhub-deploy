import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, MoreVertical, Shield, Ban, Users, TrendingUp, Clock, Filter, RefreshCw } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { AdminService, AdminUser, AdminUsersResponse } from "@/services/adminService";

export default function ManageUsers() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [verificationFilter, setVerificationFilter] = useState("all");
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [userStats, setUserStats] = useState({
    total: 0,
    active: 0,
    suspended: 0,
    pending: 0,
    verified: 0,
    unverified: 0
  });
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 20,
    total: 0
  });

  // Fetch users from backend
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params: any = {};
      
      if (searchTerm) params.search = searchTerm;
      if (statusFilter !== "all") params.status = statusFilter;
      if (verificationFilter !== "all") params.verification = verificationFilter;
      
      const response = await AdminService.getUsers(params);
      
      if (response.success) {
        setUsers(response.users);
        setUserStats(response.statistics);
        setPagination(response.pagination);
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch users",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Load users on component mount and when filters change
  useEffect(() => {
    fetchUsers();
  }, [searchTerm, statusFilter, verificationFilter]);

  const handleAction = async (action: string, user: AdminUser) => {
    try {
      if (action === "Suspend") {
        const response = await AdminService.suspendUser(user.id);
        if (response.success) {
          toast({
            title: "User Suspended",
            description: `${getUserName(user)} has been suspended successfully.`,
          });
          fetchUsers();
        } else {
          toast({
            title: "Error",
            description: response.message || "Failed to suspend user",
            variant: "destructive",
          });
        }
      } else if (action === "Unsuspend") {
        const response = await AdminService.unsuspendUser(user.id);
        if (response.success) {
          toast({
            title: "User Unsuspended",
            description: `${getUserName(user)} has been unsuspended successfully.`,
          });
          fetchUsers();
        } else {
          toast({
            title: "Error",
            description: response.message || "Failed to unsuspend user",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      console.error(`Failed to ${action.toLowerCase()} user:`, error);
      toast({
        title: "Error",
        description: `Failed to ${action.toLowerCase()} user. Please try again.`,
        variant: "destructive",
      });
    }
  };

  const handleRefresh = () => {
    fetchUsers();
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setVerificationFilter("all");
  };

  // Helper function to get user display name
  const getUserName = (user: AdminUser) => {
    return `${user.first_name} ${user.last_name}`;
  };

  // Helper function to get user initials
  const getUserInitials = (user: AdminUser) => {
    return `${user.first_name[0]}${user.last_name[0]}`.toUpperCase();
  };

  // Helper function to format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation role="admin" />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Manage Users</h1>
              <p className="text-muted-foreground">View and manage all registered users</p>
            </div>
          </div>
        </div>

        {/* User Stats */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card className="shadow-card border-none">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total Users</p>
                  <p className="text-2xl font-bold">{loading ? "..." : userStats.total.toLocaleString()}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Users className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-card border-none">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Active Users</p>
                  <p className="text-2xl font-bold text-success">{loading ? "..." : userStats.active.toLocaleString()}</p>
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
                  <p className="text-sm text-muted-foreground mb-1">Verified Users</p>
                  <p className="text-2xl font-bold text-primary">{loading ? "..." : userStats.verified.toLocaleString()}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Shield className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-card border-none">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Suspended Users</p>
                  <p className="text-2xl font-bold text-destructive">{loading ? "..." : userStats.suspended}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center">
                  <Ban className="w-6 h-6 text-destructive" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

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
                  placeholder="Search by name, email, or phone..." 
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
                  <SelectItem value="suspended">Suspended</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
              <Select value={verificationFilter} onValueChange={setVerificationFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="unverified">Unverified</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card className="shadow-card border-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Personal Users ({loading ? "..." : users.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-12">
                <RefreshCw className="w-8 h-8 text-muted-foreground mx-auto mb-4 animate-spin" />
                <h3 className="text-lg font-semibold mb-2">Loading users...</h3>
                <p className="text-muted-foreground">Please wait while we fetch the user data</p>
              </div>
            ) : (
              <div className="space-y-4">
                {users.map((user) => (
                <div
                  key={user.id}
                  className="p-6 rounded-lg border border-border hover:bg-muted/50 transition-smooth"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center text-white font-semibold">
                        {getUserInitials(user)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-lg">{getUserName(user)}</h3>
                          {user.email_verified && (
                            <Badge variant="outline" className="bg-success/10 text-success border-success">
                              <Shield className="w-3 h-3 mr-1" />
                              Verified
                            </Badge>
                          )}
                          <Badge 
                            variant={user.status === "active" ? "default" : user.status === "suspended" ? "destructive" : "secondary"}
                            className="text-xs"
                          >
                            {user.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>{user.email}</span>
                          <span>•</span>
                          <span>{user.phone}</span>
                          <span>•</span>
                          <span>Personal User</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-muted-foreground">Joined: {formatDate(user.created_at)}</span>
                        </div>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => handleAction(user.status === "suspended" ? "Unsuspend" : "Suspend", user)}
                          className="text-destructive"
                        >
                          <Ban className="w-4 h-4 mr-2" />
                          {user.status === "suspended" ? "Unsuspend User" : "Suspend User"}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                </div>
              ))}
                
                {users.length === 0 && (
                  <div className="text-center py-12">
                    <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No users found</h3>
                    <p className="text-muted-foreground mb-4">
                      {searchTerm ? "Try adjusting your search terms" : "No personal users found"}
                    </p>
                    <Button variant="outline" onClick={handleClearFilters}>
                      Clear Filters
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
