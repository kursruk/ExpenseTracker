import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import ExpensesPage from "@/pages/expenses";
import AddExpensePage from "@/pages/expenses/add";
import EditExpensePage from "@/pages/expenses/edit/[id]";

function Router() {
  return (
    <Switch>
      <Route path="/" component={ExpensesPage} />
      <Route path="/expenses" component={ExpensesPage} />
      <Route path="/expenses/add" component={AddExpensePage} />
      <Route path="/expenses/edit/:id" component={EditExpensePage} />
      <Route component={NotFound} />
    </Switch>
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
