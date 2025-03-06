import { z } from "zod";

export const expenseSchema = z.object({
  id: z.string().uuid(),
  date: z.string(),
  item: z.string().min(1, "Item name is required"),
  price: z.number().min(0, "Price must be positive"),
  count: z.number().min(0.1, "Count must be at least 0.1"),
  vendor: z.string().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});

export const insertExpenseSchema = expenseSchema.omit({ id: true, createdAt: true, updatedAt: true });

export type Expense = z.infer<typeof expenseSchema>;
export type InsertExpense = z.infer<typeof insertExpenseSchema>;