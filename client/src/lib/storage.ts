import { v4 as uuidv4 } from 'uuid';
import { Check, CheckItem, InsertCheck, InsertCheckItem, Shop } from '@shared/schema';
import { syncService } from './sync-service';
import { apiRequest } from './queryClient';

// Storage keys
const SHOPS_KEY = 'shops';
const getMonthKey = (year: number, month: number) => 
  `expenses_${year}_${String(month + 1).padStart(2, '0')}`;

// Shop management
export async function getShops(): Promise<Shop[]> {
  try {
    const response = await apiRequest('GET', '/api/shops');
    if (!response.ok) {
      throw new Error('Failed to fetch shops');
    }
    const { data } = await response.json();
    localStorage.setItem(SHOPS_KEY, JSON.stringify(data));
    return data;
  } catch (error) {
    // Fallback to local storage if API fails
    const data = localStorage.getItem(SHOPS_KEY);
    return data ? JSON.parse(data) : [];
  }
}

export async function addShop(name: string): Promise<Shop> {
  const newShop: Shop = {
    id: uuidv4(),
    name
  };

  try {
    const response = await apiRequest('POST', '/api/shops', newShop);
    if (!response.ok) {
      throw new Error('Failed to create shop');
    }
    const { data } = await response.json();
    return data;
  } catch (error) {
    // Fallback to local storage if API fails
    const shops = await getShops();
    shops.push(newShop);
    localStorage.setItem(SHOPS_KEY, JSON.stringify(shops));

    // Queue sync update for shop
    syncService.addUpdate({
      type: 'shop',
      action: 'create',
      data: newShop
    });

    return newShop;
  }
}

export function createOrUpdateShop(shop: Shop): Shop {
  const shops = getShops();
  const index = shops.findIndex(s => s.id === shop.id);

  if (index >= 0) {
    // Update existing shop
    shops[index] = shop;
    syncService.addUpdate({
      type: 'shop',
      action: 'update',
      data: shop
    });
  } else {
    // Add new shop
    shops.push(shop);
    syncService.addUpdate({
      type: 'shop',
      action: 'create',
      data: shop
    });
  }

  localStorage.setItem(SHOPS_KEY, JSON.stringify(shops));
  return shop;
}

// Check management
export async function getChecks(year: number, month: number): Promise<Check[]> {
  try {
    const response = await apiRequest('GET', `/api/checks/${year}/${month}`);
    if (!response.ok) {
      throw new Error('Failed to fetch checks');
    }
    const { data } = await response.json();
    localStorage.setItem(getMonthKey(year, month), JSON.stringify(data));
    return data;
  } catch (error) {
    // Fallback to local storage if API fails
    const data = localStorage.getItem(getMonthKey(year, month));
    return data ? JSON.parse(data) : [];
  }
}

export async function addCheck(year: number, month: number, check: InsertCheck): Promise<Check> {
  try {
    const response = await apiRequest('POST', `/api/checks/${year}/${month}`, check);
    if (!response.ok) {
      throw new Error('Failed to create check');
    }
    const newCheck = await response.json();
    return newCheck;
  } catch (error) {
    // Fallback to local storage if API fails
    const checks = await getChecks(year, month);
    const shops = await getShops();
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

    // Queue sync update for check
    syncService.addUpdate({
      type: 'check',
      action: 'create',
      data: newCheck
    });

    return newCheck;
  }
}

export async function updateCheck(year: number, month: number, checkId: string, items: InsertCheckItem[]): Promise<Check> {
  try {
    const response = await apiRequest('PUT', `/api/checks/${year}/${month}/${checkId}`, { items });
    if (!response.ok) {
      throw new Error('Failed to update check');
    }
    const updatedCheck = await response.json();
    return updatedCheck;
  } catch (error) {
    // Fallback to local storage if API fails
    const checks = await getChecks(year, month);
    const checkIndex = checks.findIndex(c => c.id === checkId);

    if (checkIndex === -1) throw new Error('Check not found');

    const updatedItems: CheckItem[] = items.map((item, index) => ({
      ...item,
      serialNumber: index + 1,
      total: item.price * item.count
    }));

    const total = updatedItems.reduce((sum, item) => sum + item.total, 0);

    const updatedCheck: Check = {
      ...checks[checkIndex],
      items: updatedItems,
      total
    };

    checks[checkIndex] = updatedCheck;
    localStorage.setItem(getMonthKey(year, month), JSON.stringify(checks));

    // Queue sync update for check
    syncService.addUpdate({
      type: 'check',
      action: 'update',
      data: updatedCheck
    });

    return updatedCheck;
  }
}

export async function getCheck(year: number, month: number, checkId: string): Promise<Check | undefined> {
  try {
    const response = await apiRequest('GET', `/api/checks/${year}/${month}/${checkId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch check');
    }
    return await response.json();
  } catch (error) {
    // Fallback to local storage if API fails
    const checks = await getChecks(year, month);
    return checks.find(c => c.id === checkId);
  }
}

// Get all available months
export async function getAvailableMonths(): Promise<{ year: number; month: number }[]> {
  try {
    const response = await apiRequest('GET', '/api/checks/months');
    if (!response.ok) {
      throw new Error('Failed to fetch available months');
    }
    return await response.json();
  } catch (error) {
    // Fallback to local storage
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
}

export async function getMonthTotal(year: number, month: number): Promise<number> {
  const checks = await getChecks(year, month);
  return checks.reduce((sum, check) => sum + check.total, 0);
}