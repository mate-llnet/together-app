import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import NotFound from "@/pages/not-found";
import Auth from "@/pages/auth";
import Dashboard from "@/pages/dashboard";
import AddActivity from "@/pages/add-activity";
import Appreciation from "@/pages/appreciation";
import Analytics from "@/pages/analytics";
import Insights from "@/pages/insights";
import Settings from "@/pages/settings";
import Landing from "@/pages/landing";
import About from "@/pages/about";
import Contact from "@/pages/contact";
import Admin from "@/pages/admin";
import Onboarding from "@/pages/onboarding";
import Groups from "@/pages/groups";
import AppLayout from "@/components/layout/app-layout";
import PublicLayout from "@/components/layout/public-layout";
import { GroupProvider } from "@/hooks/use-group-context";

// Public routes that don't require authentication
function PublicRouter() {
  return (
    <PublicLayout>
      <Switch>
        <Route path="/" component={Landing} />
        <Route path="/about" component={About} />
        <Route path="/contact" component={Contact} />
        <Route component={NotFound} />
      </Switch>
    </PublicLayout>
  );
}

// Authenticated app routes
function AppRouter() {
  return (
    <GroupProvider>
      <AppLayout>
        <Switch>
          <Route path="/app" component={Dashboard} />
          <Route path="/app/add-activity" component={AddActivity} />
          <Route path="/app/appreciation" component={Appreciation} />
          <Route path="/app/analytics" component={Analytics} />
          <Route path="/app/insights" component={Insights} />
          <Route path="/app/groups" component={Groups} />
          <Route path="/app/settings" component={Settings} />
          <Route path="/admin" component={Admin} />
          <Route component={NotFound} />
        </Switch>
      </AppLayout>
    </GroupProvider>
  );
}

function MainRouter() {
  const { user, login, isLoading } = useAuth();
  const [location] = useLocation();

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-warm rounded-xl flex items-center justify-center mx-auto mb-4">
            <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Handle auth route separately
  if (location === '/auth') {
    return <Auth onLogin={login} />;
  }

  // Handle onboarding route separately (for authenticated users only)
  if (location === '/onboarding') {
    if (!user) {
      return <Auth onLogin={login} />;
    }
    return <Onboarding />;
  }

  // If user is trying to access app routes or admin but not authenticated
  if ((location.startsWith('/app') || location.startsWith('/admin')) && !user) {
    return <Auth onLogin={login} />;
  }

  // If authenticated user is on public pages, show them with user context
  if (user && (location === '/' || location === '/about' || location === '/contact')) {
    return <PublicRouter />;
  }

  // If authenticated user is accessing app routes or admin
  if (user && (location.startsWith('/app') || location.startsWith('/admin'))) {
    return <AppRouter />;
  }

  // Default to public routes for unauthenticated users
  return <PublicRouter />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <MainRouter />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
