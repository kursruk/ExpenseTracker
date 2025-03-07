import { v4 as uuidv4 } from 'uuid';
import { Expense, InsertExpense } from '@shared/schema';
import { apiRequest } from './queryClient';
import { useSettingsStore } from './settings';

const STORAGE_KEY = 'expenses';

export function getExpenses(): Expense[] {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
}

export function addExpense(expense: InsertExpense): Expense {
  const expenses = getExpenses();
  const now = new Date().toISOString();
  const newExpense: Expense = {
    ...expense,
    id: uuidv4(),
    createdAt: now,
    updatedAt: now
  };
  expenses.push(newExpense);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
  return newExpense;
}

export function updateExpense(id: string, expense: InsertExpense): Expense {
  const expenses = getExpenses();
  const index = expenses.findIndex(e => e.id === id);
  if (index === -1) throw new Error('Expense not found');

  const existingExpense = expenses[index];
  const updatedExpense: Expense = {
    ...expense,
    id,
    createdAt: existingExpense.createdAt,
    updatedAt: new Date().toISOString()
  };
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

export async function publishExpenses(): Promise<{ success: boolean, message: string }> {
  const expenses = getExpenses();
  const { username, password } = useSettingsStore.getState();

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (username && password) {
      const base64Credentials = btoa(`${username}:${password}`);
      headers['Authorization'] = `Basic ${base64Credentials}`;
    }

    const response = await fetch('/api/expenses/publish', {
      method: 'POST',
      headers,
      body: JSON.stringify(expenses)
    });

    if (!response.ok) {
      throw new Error('Failed to publish expenses');
    }

    const result = await response.json();
    return result;
  } catch (error) {
    throw new Error('Failed to publish expenses');
  }
}