import { v4 as uuidv4 } from 'uuid';
import { Expense, InsertExpense } from '@shared/schema';
import { apiRequest } from './queryClient';
import { useSettingsStore } from './settings';

const STORAGE_KEY = 'expenses';
const ARCHIVE_KEY = 'expenses_archive';

interface ArchivedExpenses {
  month: string; // Format: YYYY-MM
  expenses: Expense[];
}

export function getExpenses(): Expense[] {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
}

export function checkAndArchiveExpenses() {
  const currentDate = new Date();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const today = new Date();

  if (today >= firstDayOfMonth && today.getDate() === 1) {
    const expenses = getExpenses();
    if (expenses.length > 0) {
      // Archive last month's expenses
      const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1);
      const archiveKey = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}`;

      addToArchive(archiveKey, expenses);

      // Clear current expenses
      localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
    }
  }
}

export function getArchive(): ArchivedExpenses[] {
  const data = localStorage.getItem(ARCHIVE_KEY);
  return data ? JSON.parse(data) : [];
}

export function addToArchive(month: string, expenses: Expense[]) {
  const archive = getArchive();
  const existingMonthIndex = archive.findIndex(a => a.month === month);

  if (existingMonthIndex >= 0) {
    archive[existingMonthIndex].expenses = expenses;
  } else {
    archive.push({ month, expenses });
  }

  localStorage.setItem(ARCHIVE_KEY, JSON.stringify(archive));
}

export function clearArchive() {
  localStorage.setItem(ARCHIVE_KEY, JSON.stringify([]));
}

export function addExpense(expense: InsertExpense): Expense {
  checkAndArchiveExpenses(); // Check if we need to archive before adding
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