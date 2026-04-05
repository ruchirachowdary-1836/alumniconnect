import { Bell } from "lucide-react";
import { useRealtimeNotifications } from "@/hooks/useRealtimeNotifications";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

export function NotificationBell() {
  const { notifications, unreadCount, markAllRead } = useRealtimeNotifications();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" onClick={markAllRead}>
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-3 border-b border-border">
          <h4 className="font-semibold text-sm">Notifications</h4>
        </div>
        <ScrollArea className="max-h-64">
          {notifications.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No notifications yet</p>
          ) : (
            <div className="divide-y divide-border">
              {notifications.map((n) => (
                <div key={n.id} className={`p-3 text-sm ${!n.read ? "bg-muted/50" : ""}`}>
                  <p className="text-foreground">{n.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(n.timestamp).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
