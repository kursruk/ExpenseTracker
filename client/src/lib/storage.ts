import { v4 as uuidv4 } from 'uuid';
import { Check, CheckItem, InsertCheck, InsertCheckItem, Shop } from '@shared/schema';
import { useSettingsStore } from '@/lib/settings';

// Storage keys
const SHOPS_KEY = 'shops';
const getMonthKey = (year: number, month: number) => 
  `expenses_${year}_${String(month + 1).padStart(2, '0')}`;

// Shop management
export function getShops(): Shop[] {
  const data = localStorage.getItem(SHOPS_KEY);
  return data ? JSON.parse(data) : [];
}

export function addShop(name: string): Shop {
  const shops = getShops();
  const newShop: Shop = {
    id: uuidv4(),
    name
  };
  shops.push(newShop);
  localStorage.setItem(SHOPS_KEY, JSON.stringify(shops));
  return newShop;
}

// Check management
export function getChecks(year: number, month: number): Check[] {
  const key = getMonthKey(year, month);
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
}

export function addCheck(year: number, month: number, check: InsertCheck): Check {
  const checks = getChecks(year, month);
  const shops = getShops();
  const shop = shops.find(s => s.id === check.shopId);

  if (!shop) throw new Error('Shop not found');

  const newCheck: Check = {
    ...check,
    id: uuidv4(),
    checkNumber: checks.length + 1,
    shopName: shop.name,
    items: [],
    total: 0
  };

  checks.push(newCheck);
  localStorage.setItem(getMonthKey(year, month), JSON.stringify(checks));
  return newCheck;
}

export function updateCheck(year: number, month: number, checkId: string, items: InsertCheckItem[]): Check {
  const checks = getChecks(year, month);
  const checkIndex = checks.findIndex(c => c.id === checkId);

  if (checkIndex === -1) throw new Error('Check not found');

  const updatedItems: CheckItem[] = items.map((item, index) => ({
    ...item,
    serialNumber: index + 1,
    total: item.price * item.count
  }));

  const total = updatedItems.reduce((sum, item) => sum + item.total, 0);

  checks[checkIndex] = {
    ...checks[checkIndex],
    items: updatedItems,
    total
  };

  localStorage.setItem(getMonthKey(year, month), JSON.stringify(checks));
  return checks[checkIndex];
}

export function getCheck(year: number, month: number, checkId: string): Check | undefined {
  const checks = getChecks(year, month);
  return checks.find(c => c.id === checkId);
}

// Get all available months
export function getAvailableMonths(): { year: number; month: number }[] {
  const months: { year: number; month: number }[] = [];

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith('expenses_')) {
      const [, year, month] = key.split('_');
      months.push({
        year: parseInt(year),
        month: parseInt(month) - 1
      });
    }
  }

  return months.sort((a, b) => {
    return b.year - a.year || b.month - a.month;
  });
}

export function getMonthTotal(year: number, month: number): number {
  const checks = getChecks(year, month);
  return checks.reduce((sum, check) => sum + check.total, 0);
}

export async function publishExpenses(): Promise<{ success: boolean, message: string }> {
  const months = getAvailableMonths();
  const allChecks: Check[] = [];

  months.forEach(monthData => {
    allChecks.push(...getChecks(monthData.year, monthData.month))
  })

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
      body: JSON.stringify(allChecks)
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