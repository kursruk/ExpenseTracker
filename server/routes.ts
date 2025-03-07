import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

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
  app.post('/api/sync', (req, res) => {
    try {
      const updates = req.body;
      // Here you would typically process the updates
      // For now, we'll just acknowledge receipt
      res.json({ 
        success: true, 
        message: 'Updates synchronized successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: 'Failed to synchronize updates' 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}