import { z } from "zod";

export const expenseSchema = z.object({
  id: z.string().uuid(),
  date: z.string(),
  item: z.string().min(1, "Item name is required"),
  price: z.number().min(0, "Price must be positive"),
  count: z.number().int().min(1, "Count must be at least 1"),
  vendor: z.string().optional() 
});

export const insertExpenseSchema = expenseSchema.omit({ id: true });

export type Expense = z.infer<typeof expenseSchema>;
export type InsertExpense = z.infer<typeof insertExpenseSchema>;