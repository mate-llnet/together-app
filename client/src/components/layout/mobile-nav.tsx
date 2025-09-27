import { useAuth } from "@/hooks/use-auth";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";

export default function MobileNav() {
  const { user, logout } = useAuth();
  const [location] = useLocation();

  const navigation = [
    { name: "Home", href: "/", icon: "fas fa-home" },
    { name: "Add", href: "/add-activity", icon: "fas fa-plus-circle" },
    { name: "Love", href: "/appreciation", icon: "fas fa-heart" },
    { name: "Stats", href: "/analytics", icon: "fas fa-chart-line" },
  ];

  const isActive = (href: string) => location === href;

  return (
    <>
      {/* Mobile Header */}
      <header className="lg:hidden bg-card shadow-sm border-b border-border sticky top-0 z-50">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full gradient-warm flex items-center justify-center">
              <i className="fas fa-heart text-white text-sm"></i>
            </div>
            <h1 className="text-lg font-semibold text-foreground">AppreciateMate</h1>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={logout}
            className="p-2"
            data-testid="button-mobile-logout"
          >
            <i className="fas fa-user-circle text-lg text-muted-foreground"></i>
          </Button>
        </div>
      </header>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50">
        <div className="flex items-center justify-around p-4">
          {navigation.map((item) => (
            <Link key={item.name} href={item.href}>
              <a
                className={`flex flex-col items-center space-y-1 transition-colors ${
                  isActive(item.href) ? "text-primary" : "text-muted-foreground"
                }`}
                data-testid={`mobile-nav-${item.name.toLowerCase()}`}
              >
                <i className={`${item.icon} text-lg`}></i>
                <span className="text-xs font-medium">{item.name}</span>
              </a>
            </Link>
          ))}
        </div>
      </nav>

      {/* Floating Action Button */}
      <Link href="/add-activity">
        <a className="lg:hidden fixed bottom-20 right-4 w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-lg flex items-center justify-center hover:bg-primary/90 transition-colors z-40" data-testid="fab-add-activity">
          <i className="fas fa-plus text-xl"></i>
        </a>
      </Link>
    </>
  );
}
