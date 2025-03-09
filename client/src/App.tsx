import { Switch, Route, Link } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { NetworkStatus } from "@/components/network-status";
import NotFound from "@/pages/not-found";
import ExpensesPage from "@/pages/expenses";
import CheckView from "@/pages/expenses/[year]/[month]/[id]";
import AddCheckPage from "@/pages/expenses/add";
import SettingsPage from "@/pages/settings";
import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";
import { syncService } from "@/lib/sync-service";
import { useToast } from "@/hooks/use-toast";

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <div className="fixed top-4 right-4">
        <Link href="/settings">
          <Button variant="ghost" size="icon">
            <Settings className="h-5 w-5" />
          </Button>
        </Link>
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
        <Route path="/" component={ExpensesPage} />
        <Route path="/expenses" component={ExpensesPage} />
        <Route path="/expenses/add" component={AddCheckPage} />
        <Route path="/expenses/:year/:month/:id" component={CheckView} />
        <Route path="/settings" component={SettingsPage} />
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