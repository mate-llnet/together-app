import { useAuth } from "@/hooks/use-auth";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";

export default function Sidebar() {
  const { user, logout } = useAuth();
  const [location] = useLocation();

  const navigation = [
    { name: "Dashboard", href: "/", icon: "fas fa-home" },
    { name: "Add Activity", href: "/add-activity", icon: "fas fa-plus-circle" },
    { name: "Appreciation", href: "/appreciation", icon: "fas fa-heart" },
    { name: "Analytics", href: "/analytics", icon: "fas fa-chart-line" },
  ];

  const isActive = (href: string) => location === href;

  return (
    <nav className="hidden lg:flex flex-col w-64 bg-card border-r border-border">
      <div className="p-6 border-b border-border">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl gradient-warm flex items-center justify-center">
            <i className="fas fa-heart text-white"></i>
          </div>
          <h1 className="text-xl font-bold text-foreground">Together</h1>
        </div>
      </div>
      
      <div className="flex-1 p-4">
        <div className="space-y-2">
          {navigation.map((item) => (
            <Link key={item.name} href={item.href}>
              <a
                className={`flex items-center space-x-3 px-3 py-2 rounded-lg font-medium transition-colors ${
                  isActive(item.href)
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
                data-testid={`nav-${item.name.toLowerCase().replace(" ", "-")}`}
              >
                <i className={item.icon}></i>
                <span>{item.name}</span>
              </a>
            </Link>
          ))}
        </div>
        
        {/* Partner Info Card */}
        {user?.couple && (
          <div className="mt-8 p-4 bg-gradient-to-br from-secondary/10 to-primary/10 rounded-xl border border-border">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-semibold">
                {user.couple.name.charAt(0)}
              </div>
              <div>
                <p className="font-medium text-foreground">{user.couple.name}</p>
                <p className="text-sm text-muted-foreground">Your Relationship</p>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Connection</span>
              <span className="text-secondary font-medium">Strong ❤️</span>
            </div>
          </div>
        )}
        
        <div className="mt-8 pt-4 border-t border-border">
          <Button
            variant="outline"
            size="sm"
            onClick={logout}
            className="w-full"
            data-testid="button-logout"
          >
            <i className="fas fa-sign-out-alt mr-2"></i>
            Sign Out
          </Button>
        </div>
      </div>
    </nav>
  );
}
