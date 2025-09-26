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
import CoupleInsights from "@/pages/couple-insights";
import Settings from "@/pages/settings";
import Landing from "@/pages/landing";
import About from "@/pages/about";
import Contact from "@/pages/contact";
import AppLayout from "@/components/layout/app-layout";
import PublicLayout from "@/components/layout/public-layout";

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
    <AppLayout>
      <Switch>
        <Route path="/app" component={Dashboard} />
        <Route path="/app/add-activity" component={AddActivity} />
        <Route path="/app/appreciation" component={Appreciation} />
        <Route path="/app/analytics" component={Analytics} />
        <Route path="/app/couple-insights" component={CoupleInsights} />
        <Route path="/app/settings" component={Settings} />
        <Route component={NotFound} />
      </Switch>
    </AppLayout>
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

  // If user is trying to access app routes but not authenticated
  if (location.startsWith('/app') && !user) {
    return <Auth onLogin={login} />;
  }

  // If authenticated user is on public pages, show them with user context
  if (user && (location === '/' || location === '/about' || location === '/contact')) {
    return <PublicRouter />;
  }

  // If authenticated user is accessing app routes
  if (user && location.startsWith('/app')) {
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
