import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { ExpenseForm } from "@/components/expenses/expense-form";
import { getExpense, updateExpense } from "@/lib/storage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { InsertExpense } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export default function EditExpensePage({ params }: { params: { id: string } }) {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [expense, setExpense] = useState<InsertExpense | undefined>();

  useEffect(() => {
    const existingExpense = getExpense(params.id);
    if (existingExpense) {
      const { id, ...insertExpense } = existingExpense;
      setExpense(insertExpense);
    } else {
      navigate("/expenses");
      toast({
        variant: "destructive",
        title: "Error",
        description: "Expense not found"
      });
    }
  }, [params.id, navigate]);

  const handleSubmit = (data: InsertExpense) => {
    try {
      updateExpense(params.id, data);
      toast({
        title: "Success",
        description: "Expense updated successfully"
      });
      navigate("/expenses");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update expense"
      });
    }
  };

  if (!expense) {
    return null;
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <Card>
        <CardHeader>
          <CardTitle>Edit Expense</CardTitle>
        </CardHeader>
        <CardContent>
          <ExpenseForm
            defaultValues={expense}
            onSubmit={handleSubmit}
            submitLabel="Update Expense"
          />
        </CardContent>
      </Card>
    </div>
  );
}
