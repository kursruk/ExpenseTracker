import { Switch, Route, Link } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import ExpensesPage from "@/pages/expenses";
import AddExpensePage from "@/pages/expenses/add";
import EditExpensePage from "@/pages/expenses/edit/[id]";
import SettingsPage from "@/pages/settings";
import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";

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
    </div>
  );
}

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={ExpensesPage} />
        <Route path="/expenses" component={ExpensesPage} />
        <Route path="/expenses/add" component={AddExpensePage} />
        <Route path="/expenses/edit/:id" component={EditExpensePage} />
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