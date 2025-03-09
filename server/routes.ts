import type { Express, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { Check, Shop } from "@shared/schema";
import { AuthenticatedRequest, authenticateUser, requireAuth } from "./auth";
import session from "express-session";
import cookieParser from "cookie-parser";

interface SyncUpdate {
  type: 'shop' | 'check';
  action: 'create' | 'update' | 'delete';
  data: Shop | Check;
  timestamp: string;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Add session middleware
  app.use(cookieParser());
  app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  }));

  // Authentication routes
  app.post('/api/login', async (req: AuthenticatedRequest, res: Response) => {
    const { username, password } = req.body;
    try {
      const user = await authenticateUser(username, password);
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      req.session.user = user;
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: 'Login failed' });
    }
  });

  app.post('/api/logout', (req: AuthenticatedRequest, res: Response) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: 'Logout failed' });
      }
      res.json({ message: 'Logged out successfully' });
    });
  });

  app.get('/api/user', (req: AuthenticatedRequest, res: Response) => {
    if (!req.session.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    res.json(req.session.user);
  });

  // Protected routes
  app.get('/api/shops', requireAuth, async (req, res) => {
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

  app.post('/api/shops', requireAuth, async (req, res) => {
    try {
      const shop = await storage.createOrUpdateShop(req.body);
      res.json({ success: true, data: shop });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to create shop',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.get('/api/checks/:year/:month', requireAuth, async (req, res) => {
    try {
      const year = parseInt(req.params.year);
      const month = parseInt(req.params.month);
      const checks = await storage.getChecks(year, month);
      res.json({ success: true, data: checks });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to get checks',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.get('/api/checks/:year/:month/:id', requireAuth, async (req, res) => {
    try {
      const year = parseInt(req.params.year);
      const month = parseInt(req.params.month);
      const check = await storage.getCheck(year, month, req.params.id);
      if (!check) {
        return res.status(404).json({
          success: false,
          message: 'Check not found'
        });
      }
      res.json({ success: true, data: check });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to get check',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.post('/api/checks/:year/:month', requireAuth, async (req, res) => {
    try {
      const year = parseInt(req.params.year);
      const month = parseInt(req.params.month);
      const check = await storage.createCheck(year, month, req.body);
      res.json({ success: true, data: check });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to create check',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.put('/api/checks/:year/:month/:id', requireAuth, async (req, res) => {
    try {
      const year = parseInt(req.params.year);
      const month = parseInt(req.params.month);
      const check = await storage.updateCheck(year, month, req.params.id, req.body.items);
      res.json({ success: true, data: check });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to update check',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.get('/api/checks/months', requireAuth, async (req, res) => {
    try {
      // Get all available months from the checks table
      const months = await storage.getAvailableMonths();
      res.json({ success: true, data: months });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to get available months',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Sync route
  app.post('/api/sync', requireAuth, async (req, res) => {
    try {
      const updates: SyncUpdate[] = req.body;
      console.log('Processing sync updates:', updates);

      // First, gather all unique shops from both shop updates and check updates
      const shopUpdates = updates.filter(update => update.type === 'shop');
      const checkUpdates = updates.filter(update => update.type === 'check');

      // Process all unique shops first
      for (const update of shopUpdates) {
        try {
          const shopData = update.data as Shop;
          await storage.createOrUpdateShop(shopData);
        } catch (error) {
          throw new Error(`Failed to process shop: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      // Then process all check updates
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
          throw new Error(`Failed to process check ${update.action}: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}