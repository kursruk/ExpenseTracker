import { db } from './db';
import { shops, checks, checkItems } from './db/schema';
import { Check, CheckItem, InsertCheck, Shop } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

export interface IStorage {
  // Shop operations
  getShops(): Promise<Shop[]>;
  createShop(name: string): Promise<Shop>;

  // Check operations
  getChecks(year: number, month: number): Promise<Check[]>;
  getCheck(year: number, month: number, id: string): Promise<Check | undefined>;
  createCheck(year: number, month: number, check: InsertCheck): Promise<Check>;
  updateCheck(year: number, month: number, checkId: string, items: CheckItem[]): Promise<Check>;
}

export class SQLiteStorage implements IStorage {
  async getShops(): Promise<Shop[]> {
    return await db.select().from(shops);
  }

  async createShop(name: string): Promise<Shop> {
    const shop: Shop = {
      id: uuidv4(),
      name
    };
    await db.insert(shops).values(shop);
    return shop;
  }

  async getChecks(year: number, month: number): Promise<Check[]> {
    const startDate = new Date(year, month, 1).toISOString().split('T')[0];
    const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0];

    const result = await db.select()
      .from(checks)
      .where(db.and(
        db.gte(checks.date, startDate),
        db.lte(checks.date, endDate)
      ));

    // Get all check items for these checks
    const checkIds = result.map(check => check.id);
    const items = await db.select()
      .from(checkItems)
      .where(db.inArray(checkItems.checkId, checkIds));

    // Join checks with their items and shop information
    return Promise.all(result.map(async check => {
      const shop = await db.select().from(shops).where(eq(shops.id, check.shopId)).get();
      const checkItemsList = items.filter(item => item.checkId === check.id);

      return {
        ...check,
        shopName: shop?.name || '',
        items: checkItemsList
      };
    }));
  }

  async getCheck(year: number, month: number, id: string): Promise<Check | undefined> {
    const check = await db.select().from(checks).where(eq(checks.id, id)).get();
    if (!check) return undefined;

    const shop = await db.select().from(shops).where(eq(shops.id, check.shopId)).get();
    const items = await db.select().from(checkItems).where(eq(checkItems.checkId, id));

    return {
      ...check,
      shopName: shop?.name || '',
      items
    };
  }

  async createCheck(year: number, month: number, insertCheck: InsertCheck): Promise<Check> {
    const shop = await db.select().from(shops).where(eq(shops.id, insertCheck.shopId)).get();
    if (!shop) throw new Error('Shop not found');

    // Get the latest check number for this month
    const startDate = new Date(year, month, 1).toISOString().split('T')[0];
    const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0];
    const existingChecks = await db.select()
      .from(checks)
      .where(db.and(
        db.gte(checks.date, startDate),
        db.lte(checks.date, endDate)
      ));

    const checkNumber = existingChecks.length + 1;
    const checkId = uuidv4();

    const newCheck = {
      id: checkId,
      checkNumber,
      date: insertCheck.date,
      shopId: insertCheck.shopId,
      total: 0
    };

    await db.insert(checks).values(newCheck);

    // Insert all items
    if (insertCheck.items.length > 0) {
      const itemsWithIds = insertCheck.items.map((item, index) => ({
        id: uuidv4(),
        checkId,
        serialNumber: index + 1,
        ...item,
        total: item.price * item.count
      }));

      await db.insert(checkItems).values(itemsWithIds);

      // Update check total
      const total = itemsWithIds.reduce((sum, item) => sum + item.total, 0);
      await db.update(checks)
        .set({ total })
        .where(eq(checks.id, checkId));

      return {
        ...newCheck,
        shopName: shop.name,
        items: itemsWithIds,
        total
      };
    }

    return {
      ...newCheck,
      shopName: shop.name,
      items: [],
      total: 0
    };
  }

  async updateCheck(year: number, month: number, checkId: string, items: CheckItem[]): Promise<Check> {
    const check = await db.select().from(checks).where(eq(checks.id, checkId)).get();
    if (!check) throw new Error('Check not found');

    const shop = await db.select().from(shops).where(eq(shops.id, check.shopId)).get();
    if (!shop) throw new Error('Shop not found');

    // Delete existing items
    await db.delete(checkItems).where(eq(checkItems.checkId, checkId));

    // Insert new items
    const itemsWithIds = items.map((item, index) => ({
      id: uuidv4(),
      checkId,
      serialNumber: index + 1,
      ...item,
      total: item.price * item.count
    }));

    await db.insert(checkItems).values(itemsWithIds);

    // Update check total
    const total = itemsWithIds.reduce((sum, item) => sum + item.total, 0);
    await db.update(checks)
      .set({ total })
      .where(eq(checks.id, checkId));

    return {
      ...check,
      shopName: shop.name,
      items: itemsWithIds,
      total
    };
  }
}

export const storage = new SQLiteStorage();