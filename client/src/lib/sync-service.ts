import { apiRequest } from "./queryClient";

interface SyncUpdate {
  type: 'check' | 'expense';
  action: 'create' | 'update' | 'delete';
  data: any;
  timestamp: string;
}

class SyncService {
  private updates: SyncUpdate[] = [];
  private isOnline: boolean = navigator.onLine;

  constructor() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.processPendingUpdates();
    });
    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  async addUpdate(update: Omit<SyncUpdate, 'timestamp'>) {
    const fullUpdate = {
      ...update,
      timestamp: new Date().toISOString()
    };
    
    this.updates.push(fullUpdate);

    if (this.isOnline) {
      await this.processPendingUpdates();
    }
  }

  private async processPendingUpdates() {
    if (this.updates.length === 0) return;

    try {
      await apiRequest('POST', '/api/sync', this.updates);
      // Clear successfully synced updates
      this.updates = [];
    } catch (error) {
      console.error('Failed to sync updates:', error);
    }
  }
}

export const syncService = new SyncService();
