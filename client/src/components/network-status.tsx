import { Wifi, WifiOff } from "lucide-react";
import { useNetworkStatus } from "@/hooks/use-network-status";
import { cn } from "@/lib/utils";

export function NetworkStatus() {
  const { isOnline, lastSync } = useNetworkStatus();

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
    </div>
  );
}
