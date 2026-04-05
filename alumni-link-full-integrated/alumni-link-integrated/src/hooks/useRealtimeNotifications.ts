import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { mentorshipApi } from "@/integrations/api/client";

interface Notification {
  id: string; message: string; timestamp: string; read: boolean;
}

export function useRealtimeNotifications() {
  const { user, userRole } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const qc = useQueryClient();
  const prevCount = useRef<number>(0);
  const initialized = useRef(false);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    const poll = async () => {
      try {
        const data = await mentorshipApi.getMyRequests();
        const count = Array.isArray(data) ? data.length : 0;
        if (initialized.current && count > prevCount.current) {
          const msg = userRole === "alumni"
            ? "New mentorship request received!"
            : "Your mentorship request status updated!";
          const n: Notification = { id: Date.now().toString(), message: msg, timestamp: new Date().toISOString(), read: false };
          if (!cancelled) {
            setNotifications(p => [n, ...p]);
            toast.info(msg);
            qc.invalidateQueries({ queryKey: ["mentor-requests"] });
          }
        }
        prevCount.current = count;
        initialized.current = true;
      } catch { /* silent */ }
    };

    poll();
    const timer = setInterval(poll, 15000);
    return () => { cancelled = true; clearInterval(timer); };
  }, [user, userRole, qc]);

  const markAllRead = () => setNotifications(p => p.map(n => ({ ...n, read: true })));
  return { notifications, unreadCount: notifications.filter(n => !n.read).length, markAllRead };
}
