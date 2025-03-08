import { apiRequest } from "./queryClient";
import { Check, Shop } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

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

  constructor() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.processPendingUpdates();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });

    // Try to load any pending updates from localStorage
    this.loadPendingUpdates();
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

  private async processPendingUpdates(retryCount: number = 0) {
    if (this.updates.length === 0 || this.syncInProgress) return;

    this.syncInProgress = true;

    try {
      // First, send all shop updates
      const shopUpdates = this.updates.filter(update => update.type === 'shop');
      if (shopUpdates.length > 0) {
        const shopResponse = await apiRequest('POST', '/api/sync', shopUpdates);
        if (!shopResponse.ok) {
          const error = await shopResponse.json();
          throw new Error(`Shop sync failed: ${error.message || error.error || 'Unknown error'}`);
        }
      }

      // Then, send all check updates
      const checkUpdates = this.updates.filter(update => update.type === 'check');
      if (checkUpdates.length > 0) {
        const checkResponse = await apiRequest('POST', '/api/sync', checkUpdates);
        if (!checkResponse.ok) {
          const error = await checkResponse.json();
          throw new Error(`Check sync failed: ${error.message || error.error || 'Unknown error'}`);
        }
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