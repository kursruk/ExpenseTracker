import { useLocation } from "wouter";
import { ExpenseForm } from "@/components/expenses/expense-form";
import { addExpense } from "@/lib/storage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { InsertExpense } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export default function AddExpensePage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const handleSubmit = (data: InsertExpense) => {
    try {
      addExpense(data);
      toast({
        title: "Success",
        description: "Expense added successfully"
      });
      navigate("/expenses");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add expense"
      });
    }
  };

  return (
    <div className="container mx-auto py-6 px-4">
      <Card>
        <CardHeader>
          <CardTitle>Add Expense</CardTitle>
        </CardHeader>
        <CardContent>
          <ExpenseForm onSubmit={handleSubmit} submitLabel="Add Expense" />
        </CardContent>
      </Card>
    </div>
  );
}
