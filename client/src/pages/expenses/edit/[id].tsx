import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { ExpenseForm } from "@/components/expenses/expense-form";
import { getExpense, updateExpense } from "@/lib/storage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { InsertExpense } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export default function EditExpensePage({ params }: { params: { id: string } }) {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [expense, setExpense] = useState<InsertExpense | undefined>();

  useEffect(() => {
    const existingExpense = getExpense(params.id);
    if (existingExpense) {
      const { id, createdAt, updatedAt, ...insertExpense } = existingExpense;
      setExpense(insertExpense);
    } else {
      navigate("/expenses");
      toast({
        variant: "destructive",
        title: t('messages.error'),
        description: t('messages.updateError')
      });
    }
  }, [params.id, navigate]);

  const handleSubmit = (data: InsertExpense) => {
    try {
      updateExpense(params.id, data);
      toast({
        title: t('messages.updateSuccess'),
        description: t('messages.updateSuccess')
      });
      navigate("/expenses");
    } catch (error) {
      toast({
        variant: "destructive",
        title: t('messages.error'),
        description: t('messages.updateError')
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
          <CardTitle>{t('form.update')}</CardTitle>
        </CardHeader>
        <CardContent>
          <ExpenseForm
            defaultValues={expense}
            onSubmit={handleSubmit}
            submitLabel={t('form.update')}
          />
        </CardContent>
      </Card>
    </div>
  );
}