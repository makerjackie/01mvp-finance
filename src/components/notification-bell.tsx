"use client";

import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { Button } from "./ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Badge } from "./ui/badge";
import Link from "next/link";

interface Notification {
  id: string;
  title: string;
  content: string;
  link?: string;
  read: boolean;
  createdAt: string;
}

export function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);

  const markAsRead = async (id: string) => {
    await fetch(`/api/notification/${id}/read`, { method: "POST" });
    const res = await fetch("/api/notification/unread-count");
    const data = await res.json();
    if (data.success) setUnreadCount(data.count);
    const res2 = await fetch("/api/notification?page=1");
    const data2 = await res2.json();
    if (data2.success) setNotifications(data2.data);
  };

  const markAllAsRead = async () => {
    await fetch("/api/notification/read-all", { method: "POST" });
    const res = await fetch("/api/notification/unread-count");
    const data = await res.json();
    if (data.success) setUnreadCount(data.count);
    const res2 = await fetch("/api/notification?page=1");
    const data2 = await res2.json();
    if (data2.success) setNotifications(data2.data);
  };

  useEffect(() => {
    let mounted = true;
    const fetchCount = async () => {
      const res = await fetch("/api/notification/unread-count");
      const data = await res.json();
      if (data.success && mounted) setUnreadCount(data.count);
    };
    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    let mounted = true;
    const fetchNotifs = async () => {
      const res = await fetch("/api/notification?page=1");
      const data = await res.json();
      if (data.success && mounted) setNotifications(data.data);
    };
    fetchNotifs();
    return () => {
      mounted = false;
    };
  }, [open]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 text-xs">{unreadCount}</Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between border-b p-3">
          <h3 className="font-semibold">通知</h3>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead}>
              全部已读
            </Button>
          )}
        </div>
        <div className="max-h-96 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">暂无通知</div>
          ) : (
            notifications.map((notif) => (
              <div key={notif.id} className={`border-b p-3 hover:bg-muted/50 ${!notif.read ? "bg-blue-50" : ""}`}>
                {notif.link ? (
                  <Link
                    href={notif.link}
                    onClick={() => {
                      markAsRead(notif.id);
                      setOpen(false);
                    }}
                  >
                    <div className="text-sm font-medium">{notif.title}</div>
                    <div className="text-xs text-muted-foreground">{notif.content}</div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {new Date(notif.createdAt).toLocaleString("zh-CN")}
                    </div>
                  </Link>
                ) : (
                  <>
                    <div className="text-sm font-medium">{notif.title}</div>
                    <div className="text-xs text-muted-foreground">{notif.content}</div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {new Date(notif.createdAt).toLocaleString("zh-CN")}
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
