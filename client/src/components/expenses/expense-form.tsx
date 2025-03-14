import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { InsertExpense, insertExpenseSchema } from "@shared/schema";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface ExpenseFormProps {
  defaultValues?: InsertExpense;
  onSubmit: (data: InsertExpense) => void;
  submitLabel: string;
}

export function ExpenseForm({
  defaultValues,
  onSubmit,
  submitLabel,
}: ExpenseFormProps) {
  const { t } = useTranslation();
  const { toast } = useToast();

  const form = useForm<InsertExpense>({
    resolver: zodResolver(insertExpenseSchema),
    defaultValues: defaultValues || {
      date: new Date().toISOString().split("T")[0],
      item: "",
      price: 0,
      count: 0.1, // Initialize with minimum valid value
      vendor: "",
    },
  });

  const handleSubmit = (data: InsertExpense) => {
    try {
      onSubmit(data);
    } catch (error) {
      toast({
        variant: "destructive",
        title: t("messages.error"),
        description: t("messages.addError"),
      });
    }
  };

  const handleNumberInput = (e: React.ChangeEvent<HTMLInputElement>, onChange: (value: number) => void) => {
    const value = e.target.value;
    const numberValue = parseFloat(value);

    if (value === "") {
      onChange(0);
    } else if (!isNaN(numberValue)) {
      onChange(numberValue);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("form.date")}</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="item"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("form.item")}</FormLabel>
              <FormControl>
                <Input placeholder={t("form.itemPlaceholder")} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="price"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("form.price")}</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  {...field}
                  onChange={(e) => handleNumberInput(e, field.onChange)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="count"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("form.count")}</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.1"
                  min="0.1"
                  placeholder="0.1"
                  {...field}
                  onChange={(e) => handleNumberInput(e, field.onChange)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="vendor"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("form.vendor")}</FormLabel>
              <FormControl>
                <Input placeholder={t("form.vendorPlaceholder")} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full">
          {submitLabel}
        </Button>
      </form>
    </Form>
  );
}