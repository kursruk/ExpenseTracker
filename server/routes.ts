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

  // Add endpoint to publish expenses
  app.post('/api/expenses/publish', (req, res) => {
    try {
      const expenses = req.body;
      // Here you would typically send the expenses to an external API
      // For now, we'll just echo back the data
      res.json({ 
        success: true, 
        message: 'Expenses published successfully',
        count: expenses.length 
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: 'Failed to publish expenses',
        error: error.message
      });
    }
  });

  // Add endpoint to sync updates
  app.post('/api/sync', async (req, res) => {
    try {
      const updates: SyncUpdate[] = req.body;
      console.log('Processing sync updates:', updates);

      // Process each update in order
      for (const update of updates) {
        const { type, action, data } = update;
        console.log(`Processing ${type} update:`, { action, data });

        try {
          if (type === 'shop') {
            const shopData = data as Shop;
            switch (action) {
              case 'create':
                await storage.createShop(shopData.name);
                break;
            }
          } else if (type === 'check') {
            const checkData = data as Check;
            const date = new Date(checkData.date);
            const year = date.getFullYear();
            const month = date.getMonth();

            // First try to get the check
            const existingCheck = await storage.getCheck(year, month, checkData.id);

            if (existingCheck) {
              // Update existing check
              await storage.updateCheck(year, month, checkData.id, checkData.items);
            } else {
              // Create new check
              await storage.createCheck(year, month, {
                id: checkData.id, // Pass the ID to maintain consistency
                date: checkData.date,
                shopId: checkData.shopId,
                items: checkData.items
              });
            }
          }
        } catch (updateError) {
          throw new Error(`Failed to process ${type} ${action}: ${updateError.message}`);
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