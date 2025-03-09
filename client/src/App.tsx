import { Switch, Route, useLocation, useParams } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { NetworkStatus } from "@/components/network-status";
import NotFound from "@/pages/not-found";
import ExpensesPage from "@/pages/expenses";
import CheckView from "@/pages/expenses/[year]/[month]/[id]";
import AddCheckPage from "@/pages/expenses/add";
import SettingsPage from "@/pages/settings";
import LoginPage from "@/pages/login";
import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { syncService } from "@/lib/sync-service";
import { useToast } from "@/hooks/use-toast";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [, navigate] = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/user');
        if (response.ok) {
          setIsAuthenticated(true);
        } else {
          navigate('/login');
        }
      } catch (error) {
        navigate('/login');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [navigate]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return isAuthenticated ? <>{children}</> : null;
}

function Layout({ children }: { children: React.ReactNode }) {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen">
      <div className="fixed top-4 right-4">
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => navigate("/settings")}
        >
          <Settings className="h-5 w-5" />
        </Button>
      </div>
      {children}
      <NetworkStatus />
    </div>
  );
}

function Router() {
  const { toast } = useToast();

  useEffect(() => {
    // Initial sync when app loads
    const initialSync = async () => {
      try {
        if (navigator.onLine) {
          await syncService.sync();
        }
      } catch (error) {
        console.error('Initial sync failed:', error);
        toast({
          variant: "destructive",
          title: "Sync Error",
          description: "Failed to sync data. Please try manual sync later."
        });
      }
    };

    initialSync();
  }, [toast]);

  return (
    <Layout>
      <Switch>
        <Route path="/login" component={LoginPage} />
        <Route path="/">
          <ProtectedRoute>
            <ExpensesPage />
          </ProtectedRoute>
        </Route>
        <Route path="/expenses">
          <ProtectedRoute>
            <ExpensesPage />
          </ProtectedRoute>
        </Route>
        <Route path="/expenses/add">
          <ProtectedRoute>
            <AddCheckPage />
          </ProtectedRoute>
        </Route>
        <Route path="/expenses/:year/:month/:id">
          <ProtectedRoute>
            <CheckView params={useParams()} />
          </ProtectedRoute>
        </Route>
        <Route path="/settings">
          <ProtectedRoute>
            <SettingsPage />
          </ProtectedRoute>
        </Route>
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;