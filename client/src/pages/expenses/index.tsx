import { useState, useEffect } from "react";
import { ExpenseList } from "@/components/expenses/expense-list";
import { getExpenses, deleteExpense } from "@/lib/storage";
import { useToast } from "@/hooks/use-toast";
import type { Expense } from "@shared/schema";

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    setExpenses(getExpenses());
  }, []);

  const handleDelete = (id: string) => {
    try {
      deleteExpense(id);
      setExpenses(getExpenses());
      toast({
        title: "Success",
        description: "Expense deleted successfully"
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete expense"
      });
    }
  };

  return (
    <div className="container mx-auto py-6 px-4">
      <ExpenseList expenses={expenses} onDelete={handleDelete} />
    </div>
  );
}
