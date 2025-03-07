import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { Check } from "@shared/schema";

interface SyncUpdate {
  type: 'check';
  action: 'create' | 'update' | 'delete';
  data: Check;
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
        message: 'Failed to publish expenses' 
      });
    }
  });

  // Add endpoint to sync updates
  app.post('/api/sync', async (req, res) => {
    try {
      const updates: SyncUpdate[] = req.body;

      // Process each update in order
      for (const update of updates) {
        const { type, action, data } = update;

        if (type === 'check') {
          const date = new Date(data.date);
          const year = date.getFullYear();
          const month = date.getMonth();

          switch (action) {
            case 'create':
              await storage.createCheck(year, month, {
                date: data.date,
                shopId: data.shopId,
                items: data.items
              });
              break;

            case 'update':
              await storage.updateCheck(year, month, data.id, data.items);
              break;

            // Delete operation would go here if needed
          }
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
        message: 'Failed to synchronize updates' 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}