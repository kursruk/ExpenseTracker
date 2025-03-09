import { Wifi, WifiOff, Cloud, CloudOff, RefreshCw } from "lucide-react";
import { useNetworkStatus } from "@/hooks/use-network-status";
import { cn } from "@/lib/utils";
import { syncService } from "@/lib/sync-service";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export function NetworkStatus() {
  const { isOnline, lastSync } = useNetworkStatus();
  const [pendingUpdates, setPendingUpdates] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Update pending updates count every second
    const interval = setInterval(() => {
      setPendingUpdates(syncService.getPendingUpdatesCount());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleSync = async () => {
    if (!isOnline) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Cannot sync while offline"
      });
      return;
    }

    setIsSyncing(true);
    try {
      await syncService.sync();
      toast({
        title: "Success",
        description: "Sync completed successfully"
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to sync: " + (error instanceof Error ? error.message : "Unknown error")
      });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 flex items-center gap-2 rounded-full bg-background/80 backdrop-blur-sm border px-3 py-2 shadow-lg">
      {isOnline ? (
        <Wifi className="h-4 w-4 text-green-500" />
      ) : (
        <WifiOff className="h-4 w-4 text-red-500" />
      )}
      <span className={cn(
        "text-sm",
        isOnline ? "text-green-500" : "text-red-500"
      )}>
        {isOnline ? "Online" : "Offline"}
      </span>
      {lastSync && (
        <span className="text-xs text-muted-foreground ml-2">
          Last sync: {lastSync.toLocaleTimeString()}
        </span>
      )}
      {pendingUpdates > 0 && (
        <div className="flex items-center gap-1 ml-2 text-yellow-500">
          <Cloud className="h-4 w-4" />
          <span className="text-xs">{pendingUpdates} pending</span>
        </div>
      )}
      <Button 
        variant="ghost" 
        size="icon" 
        className="ml-2 h-6 w-6" 
        onClick={handleSync}
        disabled={!isOnline || isSyncing}
      >
        <RefreshCw className={cn(
          "h-4 w-4",
          isSyncing && "animate-spin"
        )} />
      </Button>
    </div>
  );
}