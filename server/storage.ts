import { db } from './db';
import { shops, checks, checkItems } from './db/schema';
import { Check, CheckItem, InsertCheck, Shop } from '@shared/schema';
import { eq, and, gte, lte, inArray } from 'drizzle-orm';
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
    try {
      return await db.select().from(shops);
    } catch (error) {
      throw new Error(`Failed to get shops: ${error.message}`);
    }
  }

  async createShop(name: string): Promise<Shop> {
    try {
      const shop: Shop = {
        id: uuidv4(),
        name
      };
      await db.insert(shops).values(shop);
      return shop;
    } catch (error) {
      throw new Error(`Failed to create shop: ${error.message}, SQL: INSERT INTO shops (id, name) VALUES ('${uuidv4()}', '${name}')`);
    }
  }

  async getChecks(year: number, month: number): Promise<Check[]> {
    const startDate = new Date(year, month, 1).toISOString().split('T')[0];
    const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0];

    try {
      const result = await db.select()
        .from(checks)
        .where(and(
          gte(checks.date, startDate),
          lte(checks.date, endDate)
        ));

      // Get all check items for these checks
      const checkIds = result.map(check => check.id);
      const items = await db.select()
        .from(checkItems)
        .where(inArray(checkItems.checkId, checkIds));

      // Join checks with their items and shop information
      return Promise.all(result.map(async check => {
        const [shop] = await db.select().from(shops).where(eq(shops.id, check.shopId));
        const checkItemsList = items
          .filter(item => item.checkId === check.id)
          .map(item => ({
            serialNumber: item.serialNumber,
            productName: item.productName,
            price: item.price,
            count: item.count,
            unitOfMeasure: item.unitOfMeasure as "pcs" | "kg" | "g" | "l" | "ml",
            total: item.total
          }));

        return {
          ...check,
          shopName: shop?.name || '',
          items: checkItemsList
        };
      }));
    } catch (error) {
      throw new Error(`Failed to get checks: ${error.message}, SQL: SELECT * FROM checks WHERE date >= '${startDate}' AND date <= '${endDate}'`);
    }
  }

  async getCheck(year: number, month: number, id: string): Promise<Check | undefined> {
    try {
      const [check] = await db.select().from(checks).where(eq(checks.id, id));
      if (!check) return undefined;

      const [shop] = await db.select().from(shops).where(eq(shops.id, check.shopId));
      const items = await db.select().from(checkItems).where(eq(checkItems.checkId, id));
      const checkItems = items.map(item => ({
        serialNumber: item.serialNumber,
        productName: item.productName,
        price: item.price,
        count: item.count,
        unitOfMeasure: item.unitOfMeasure as "pcs" | "kg" | "g" | "l" | "ml",
        total: item.total
      }));

      return {
        ...check,
        shopName: shop?.name || '',
        items: checkItems
      };
    } catch (error) {
      throw new Error(`Failed to get check: ${error.message}, SQL: SELECT * FROM checks WHERE id = '${id}'`);
    }
  }

  async createCheck(year: number, month: number, insertCheck: InsertCheck): Promise<Check> {
    try {
      const [shop] = await db.select().from(shops).where(eq(shops.id, insertCheck.shopId));
      if (!shop) {
        throw new Error(`Shop not found with ID: ${insertCheck.shopId}, SQL: SELECT * FROM shops WHERE id = '${insertCheck.shopId}'`);
      }

      const checkId = uuidv4();
      const checkNumber = await this.getNextCheckNumber(year, month);

      const newCheck = {
        id: checkId,
        checkNumber,
        date: insertCheck.date,
        shopId: insertCheck.shopId,
        total: 0
      };

      await db.insert(checks).values(newCheck);

      if (insertCheck.items.length > 0) {
        const itemsWithIds = insertCheck.items.map((item, index) => ({
          id: uuidv4(),
          checkId,
          serialNumber: index + 1,
          productName: item.productName,
          price: item.price,
          count: item.count,
          unitOfMeasure: item.unitOfMeasure,
          total: item.price * item.count
        }));

        await db.insert(checkItems).values(itemsWithIds);
        const total = itemsWithIds.reduce((sum, item) => sum + item.total, 0);
        await db.update(checks)
          .set({ total })
          .where(eq(checks.id, checkId));

        return {
          ...newCheck,
          shopName: shop.name,
          items: itemsWithIds.map(item => ({
            serialNumber: item.serialNumber,
            productName: item.productName,
            price: item.price,
            count: item.count,
            unitOfMeasure: item.unitOfMeasure as "pcs" | "kg" | "g" | "l" | "ml",
            total: item.total
          })),
          total
        };
      }

      return {
        ...newCheck,
        shopName: shop.name,
        items: [],
        total: 0
      };
    } catch (error) {
      throw new Error(`Failed to create check: ${error.message}`);
    }
  }

  private async getNextCheckNumber(year: number, month: number): Promise<number> {
    const startDate = new Date(year, month, 1).toISOString().split('T')[0];
    const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0];

    try {
      const existingChecks = await db.select()
        .from(checks)
        .where(and(
          gte(checks.date, startDate),
          lte(checks.date, endDate)
        ));
      return existingChecks.length + 1;
    } catch (error) {
      throw new Error(`Failed to get next check number: ${error.message}`);
    }
  }

  async updateCheck(year: number, month: number, checkId: string, items: CheckItem[]): Promise<Check> {
    try {
      const [check] = await db.select().from(checks).where(eq(checks.id, checkId));
      if (!check) {
        throw new Error(`Check not found with ID: ${checkId}, SQL: SELECT * FROM checks WHERE id = '${checkId}'`);
      }

      const [shop] = await db.select().from(shops).where(eq(shops.id, check.shopId));
      if (!shop) {
        throw new Error(`Shop not found with ID: ${check.shopId}, SQL: SELECT * FROM shops WHERE id = '${check.shopId}'`);
      }

      // Delete existing items
      await db.delete(checkItems).where(eq(checkItems.checkId, checkId));

      // Insert new items
      const itemsWithIds = items.map((item, index) => ({
        id: uuidv4(),
        checkId,
        serialNumber: index + 1,
        productName: item.productName,
        price: item.price,
        count: item.count,
        unitOfMeasure: item.unitOfMeasure,
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
        items: itemsWithIds.map(item => ({
          serialNumber: item.serialNumber,
          productName: item.productName,
          price: item.price,
          count: item.count,
          unitOfMeasure: item.unitOfMeasure as "pcs" | "kg" | "g" | "l" | "ml",
          total: item.total
        })),
        total
      };
    } catch (error) {
      throw new Error(`Failed to update check: ${error.message}`);
    }
  }
}

export const storage = new SQLiteStorage();