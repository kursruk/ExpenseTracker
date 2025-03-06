import { v4 as uuidv4 } from 'uuid';
import { Expense, InsertExpense } from '@shared/schema';

const STORAGE_KEY = 'expenses';

export function getExpenses(): Expense[] {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
}

export function addExpense(expense: InsertExpense): Expense {
  const expenses = getExpenses();
  const newExpense = { ...expense, id: uuidv4() };
  expenses.push(newExpense);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
  return newExpense;
}

export function updateExpense(id: string, expense: InsertExpense): Expense {
  const expenses = getExpenses();
  const index = expenses.findIndex(e => e.id === id);
  if (index === -1) throw new Error('Expense not found');
  
  const updatedExpense = { ...expense, id };
  expenses[index] = updatedExpense;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
  return updatedExpense;
}

export function deleteExpense(id: string): void {
  const expenses = getExpenses();
  const filteredExpenses = expenses.filter(e => e.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredExpenses));
}

export function getExpense(id: string): Expense | undefined {
  const expenses = getExpenses();
  return expenses.find(e => e.id === id);
}
