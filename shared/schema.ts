import { z } from "zod";

// Shop schema
export const shopSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, "Shop name is required"),
});

// Unit of measure enum
export const unitOfMeasureEnum = z.enum([
  "pcs",
  "kg",
  "g",
  "l",
  "ml"
]);

// Item in a check
export const checkItemSchema = z.object({
  serialNumber: z.number(),
  productName: z.string().min(1, "Product name is required"),
  price: z.number().min(0, "Price must be positive"),
  count: z.number().min(0.01, "Count must be greater than 0"),
  unitOfMeasure: unitOfMeasureEnum,
  total: z.number(),
});

// Check schema
export const checkSchema = z.object({
  id: z.string().uuid(),
  checkNumber: z.number(),
  date: z.string(),
  shopId: z.string(),
  shopName: z.string(),
  items: z.array(checkItemSchema),
  total: z.number(),
});

// Insert schemas (without auto-generated fields)
export const insertCheckItemSchema = checkItemSchema.omit({ serialNumber: true, total: true });
export const insertCheckSchema = checkSchema.omit({ id: true, checkNumber: true, total: true, shopName: true });

// Export types
export type Shop = z.infer<typeof shopSchema>;
export type CheckItem = z.infer<typeof checkItemSchema>;
export type Check = z.infer<typeof checkSchema>;
export type InsertCheckItem = z.infer<typeof insertCheckItemSchema>;
export type InsertCheck = z.infer<typeof insertCheckSchema>;
export type UnitOfMeasure = z.infer<typeof unitOfMeasureEnum>;

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