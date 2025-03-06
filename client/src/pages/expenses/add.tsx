import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { ExpenseForm } from "@/components/expenses/expense-form";
import { addExpense } from "@/lib/storage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { InsertExpense } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export default function AddExpensePage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { t } = useTranslation();

  const handleSubmit = (data: InsertExpense) => {
    try {
      addExpense(data);
      toast({
        title: t('messages.addSuccess'),
        description: t('messages.addSuccess')
      });
      navigate("/expenses");
    } catch (error) {
      toast({
        variant: "destructive",
        title: t('messages.error'),
        description: t('messages.addError')
      });
    }
  };

  return (
    <div className="container mx-auto py-6 px-4">
      <Card>
        <CardHeader>
          <CardTitle>{t('common.addExpense')}</CardTitle>
        </CardHeader>
        <CardContent>
          <ExpenseForm onSubmit={handleSubmit} submitLabel={t('form.submit')} />
        </CardContent>
      </Card>
    </div>
  );
}