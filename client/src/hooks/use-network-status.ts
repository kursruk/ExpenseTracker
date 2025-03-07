import { useState, useEffect } from 'react';

interface NetworkStatus {
  isOnline: boolean;
  lastSync: Date | null;
}

export function useNetworkStatus() {
  const [status, setStatus] = useState<NetworkStatus>({
    isOnline: navigator.onLine,
    lastSync: null
  });

  useEffect(() => {
    // Set up network status listeners
    const handleOnline = () => {
      setStatus(prev => ({ ...prev, isOnline: true }));
    };

    const handleOffline = () => {
      setStatus(prev => ({ ...prev, isOnline: false }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check connection status every 2 minutes
    const checkConnection = async () => {
      try {
        const response = await fetch('/api/ping');
        const isOnline = response.ok;
        setStatus(prev => ({ 
          ...prev, 
          isOnline,
          lastSync: isOnline ? new Date() : prev.lastSync 
        }));
      } catch (error) {
        setStatus(prev => ({ ...prev, isOnline: false }));
      }
    };

    const intervalId = setInterval(checkConnection, 2 * 60 * 1000); // 2 minutes
    checkConnection(); // Initial check

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(intervalId);
    };
  }, []);

  return status;
}
