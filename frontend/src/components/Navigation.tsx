import { Link, useLocation, useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, 
  Send, 
  History, 
  Users, 
  Settings, 
  LogOut,
  Search,
  Bell,
  ArrowLeftRight,
  Wallet,
  BarChart3,
  FileText,
  UserCog,
  Building2,
  MapPin,
  HelpCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface NavigationProps {
  role: "user" | "agent" | "admin";
}

export const Navigation = ({ role }: NavigationProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogout = () => {
    // Clear authentication token
    localStorage.removeItem('transferhub_auth_token');
    
    // Show success message
    toast({
      title: "Logged out successfully",
      description: "You have been logged out of your account.",
    });
    
    // Redirect to home page
    navigate('/');
  };

  const userLinks = [
    { to: "/user/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/user/new-transfer", label: "New Transfer", icon: Send },
    { to: "/user/tracking", label: "Track Transfer", icon: Search },
    { to: "/user/history", label: "History", icon: History },
    { to: "/user/beneficiaries", label: "Beneficiaries", icon: Users },
    { to: "/user/agents", label: "Find Agents", icon: MapPin },
  ];

  const userWalletLinks = [
    { to: "/user/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/user/new-transfer", label: "New Transfer", icon: Send },
    { to: "/user/wallet", label: "My Wallet", icon: Wallet },
    { to: "/user/tracking", label: "Track Transfer", icon: Search },
    { to: "/user/history", label: "History", icon: History },
    { to: "/user/beneficiaries", label: "Beneficiaries", icon: Users },
    { to: "/user/agents", label: "Find Agents", icon: MapPin },
  ];

  const agentLinks = [
    { to: "/agent/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/agent/cash", label: "Cash Operations", icon: Wallet },
    { to: "/agent/transactions", label: "Transactions", icon: History },
    { to: "/agent/daily-summary", label: "Daily Summary", icon: BarChart3 },
  ];

  const adminLinks = [
    { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/admin/users", label: "Manage Users", icon: UserCog },
    { to: "/admin/agents", label: "Manage Agents", icon: Building2 },
    { to: "/admin/transactions", label: "Transactions", icon: ArrowLeftRight },
    { to: "/admin/wallet", label: "Admin Wallet", icon: Wallet },
  ];

  const links = role === "user" ? userWalletLinks : role === "agent" ? agentLinks : adminLinks;

  return (
    <nav className="border-b border-border bg-card">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to={`/${role}/dashboard`} className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg gradient-hero flex items-center justify-center">
              <ArrowLeftRight className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl">TransferHub</span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-1">
            {links.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.to;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg transition-smooth text-sm font-medium",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-2">
            <Link to="/support">
              <Button variant="ghost" size="icon">
                <HelpCircle className="w-5 h-5" />
              </Button>
            </Link>
            <Link to="/settings">
              <Button variant="ghost" size="icon">
                <Settings className="w-5 h-5" />
              </Button>
            </Link>
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};
