import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { Check, Shop } from "@shared/schema";

interface SyncUpdate {
  type: 'shop' | 'check';
  action: 'create' | 'update' | 'delete';
  data: Shop | Check;
  timestamp: string;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Add ping endpoint for connection status check
  app.get('/api/ping', (req, res) => {
    res.json({ status: 'ok' });
  });

  // Add endpoint to get shops
  app.get('/api/shops', async (req, res) => {
    try {
      const shops = await storage.getShops();
      res.json({ success: true, data: shops });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: 'Failed to get shops',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Add endpoint to sync updates
  app.post('/api/sync', async (req, res) => {
    try {
      const updates: SyncUpdate[] = req.body;
      console.log('Processing sync updates:', updates);

      // First, gather all unique shops from both shop updates and check updates
      const shopUpdates = updates.filter(update => update.type === 'shop');
      const checkUpdates = updates.filter(update => update.type === 'check');

      // Get unique shops from check updates
      const shopsFromChecks = checkUpdates.map(update => {
        const checkData = update.data as Check;
        return {
          id: checkData.shopId,
          name: checkData.shopName
        };
      });

      // Create a Map to store unique shops by ID
      const uniqueShops = new Map<string, Shop>();

      // Add shops from explicit shop updates
      shopUpdates.forEach(update => {
        const shopData = update.data as Shop;
        uniqueShops.set(shopData.id, shopData);
      });

      // Add shops from check data
      shopsFromChecks.forEach(shop => {
        if (!uniqueShops.has(shop.id)) {
          uniqueShops.set(shop.id, shop);
        }
      });

      // Process all unique shops first
      console.log('Processing unique shops:', Array.from(uniqueShops.values()));
      for (const shop of uniqueShops.values()) {
        try {
          await storage.createOrUpdateShop(shop);
        } catch (error) {
          throw new Error(`Failed to process shop: ${error.message}`);
        }
      }

      // Then process all check updates
      console.log('Processing check updates:', checkUpdates);
      for (const update of checkUpdates) {
        const checkData = update.data as Check;
        try {
          const date = new Date(checkData.date);
          const year = date.getFullYear();
          const month = date.getMonth();

          // Now we can safely process the check since all shops are created
          const existingCheck = await storage.getCheck(year, month, checkData.id);

          if (existingCheck) {
            await storage.updateCheck(year, month, checkData.id, checkData.items);
          } else {
            await storage.createCheck(year, month, {
              id: checkData.id,
              date: checkData.date,
              shopId: checkData.shopId,
              items: checkData.items
            });
          }
        } catch (error) {
          throw new Error(`Failed to process check ${update.action}: ${error.message}`);
        }
      }

      res.json({ 
        success: true, 
        message: 'Updates synchronized successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error processing sync updates:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to synchronize updates',
        error: error.message,
        details: error.stack
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}