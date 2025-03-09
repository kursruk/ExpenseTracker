import { apiRequest } from "./queryClient";
import { Check, Shop } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { getShops, createOrUpdateShop } from "./storage";

interface SyncUpdate {
  type: 'shop' | 'check';
  action: 'create' | 'update' | 'delete';
  data: Shop | Check;
  timestamp: string;
}

class SyncService {
  private updates: SyncUpdate[] = [];
  private isOnline: boolean = navigator.onLine;
  private syncInProgress: boolean = false;
  private retryTimeout: number | null = null;
  private maxRetries: number = 3;
  private lastShopSync: number = 0;
  private shopSyncInterval: number = 5 * 60 * 1000; // 5 minutes

  constructor() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.processPendingUpdates();
      this.syncShopsFromServer();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });

    // Try to load any pending updates from localStorage
    this.loadPendingUpdates();

    // Start periodic shop sync
    setInterval(() => {
      if (this.isOnline) {
        this.syncShopsFromServer();
      }
    }, this.shopSyncInterval);
  }

  private async syncShopsFromServer() {
    if (!this.isOnline || Date.now() - this.lastShopSync < this.shopSyncInterval) {
      return;
    }

    try {
      const response = await fetch('/api/shops');
      if (!response.ok) {
        throw new Error('Failed to fetch shops from server');
      }

      const { success, data: serverShops } = await response.json();
      if (!success || !Array.isArray(serverShops)) {
        throw new Error('Invalid server response');
      }

      // Get local shops
      const localShops = getShops();
      const localShopsMap = new Map(localShops.map(shop => [shop.id, shop]));

      // Find new or updated shops from server
      for (const serverShop of serverShops) {
        const localShop = localShopsMap.get(serverShop.id);
        if (!localShop || localShop.name !== serverShop.name) {
          createOrUpdateShop(serverShop);
        }
      }

      this.lastShopSync = Date.now();
    } catch (error) {
      console.error('Failed to sync shops from server:', error);
    }
  }

  private loadPendingUpdates() {
    const savedUpdates = localStorage.getItem('pending_sync_updates');
    if (savedUpdates) {
      try {
        this.updates = JSON.parse(savedUpdates);
      } catch (error) {
        console.error('Failed to load pending updates:', error);
        this.updates = [];
      }
    }
  }

  private savePendingUpdates() {
    localStorage.setItem('pending_sync_updates', JSON.stringify(this.updates));
  }

  async addUpdate(update: Omit<SyncUpdate, 'timestamp'>) {
    const fullUpdate = {
      ...update,
      timestamp: new Date().toISOString()
    };

    this.updates.push(fullUpdate);
    this.savePendingUpdates();

    if (this.isOnline && !this.syncInProgress) {
      await this.processPendingUpdates();
    }
  }

  // Public method to manually trigger sync
  async sync() {
    if (!this.isOnline) {
      throw new Error('Cannot sync while offline');
    }

    await Promise.all([
      this.syncShopsFromServer(),
      this.processPendingUpdates()
    ]);
  }

  private async processPendingUpdates(retryCount: number = 0) {
    if (this.updates.length === 0 || this.syncInProgress) return;

    this.syncInProgress = true;

    try {
      const response = await fetch('/api/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(this.updates)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || error.error || 'Failed to sync updates');
      }

      // Clear successfully synced updates
      this.updates = [];
      this.savePendingUpdates();

      // Clear any existing retry timeout
      if (this.retryTimeout) {
        clearTimeout(this.retryTimeout);
        this.retryTimeout = null;
      }
    } catch (error) {
      console.error('Failed to sync updates:', error);

      // Retry logic
      if (retryCount < this.maxRetries) {
        const retryDelay = Math.min(1000 * Math.pow(2, retryCount), 30000); // Exponential backoff, max 30s
        this.retryTimeout = window.setTimeout(() => {
          this.processPendingUpdates(retryCount + 1);
        }, retryDelay);
      }
      throw error; // Re-throw to handle in UI
    } finally {
      this.syncInProgress = false;
    }
  }

  // Helper to check if there are pending updates
  hasPendingUpdates(): boolean {
    return this.updates.length > 0;
  }

  // Get the number of pending updates
  getPendingUpdatesCount(): number {
    return this.updates.length;
  }
}

export const syncService = new SyncService();