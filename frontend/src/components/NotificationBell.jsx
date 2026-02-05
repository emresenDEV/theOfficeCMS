import { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";
import { Bell } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "../lib/utils";
import { fetchNotifications, markAllNotificationsRead, markNotificationRead } from "../services/notificationService";

const NotificationBell = ({ user }) => {
    const [open, setOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(false);
    const containerRef = useRef(null);
    const navigate = useNavigate();
    const userId = user?.user_id || user?.id;

    const loadNotifications = async () => {
        if (!userId) return;
        setLoading(true);
        const data = await fetchNotifications(userId);
        setNotifications(data);
        setLoading(false);
    };

    useEffect(() => {
        if (!userId) return;
        loadNotifications();
        const interval = setInterval(loadNotifications, 30000);
        return () => clearInterval(interval);
    }, [userId]);

    useEffect(() => {
        const handler = (event) => {
            if (!containerRef.current?.contains(event.target)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const unreadCount = notifications.filter((n) => !n.is_read).length;

    const handleRead = async (notification, linkOverride = null) => {
        if (!notification.is_read) {
            await markNotificationRead(notification.notification_id);
        }
        setOpen(false);
        const target = linkOverride || notification.link;
        if (target) {
            navigate(target);
        }
        loadNotifications();
    };

    const handleMarkAllRead = async () => {
        if (!userId) return;
        await markAllNotificationsRead(userId);
        loadNotifications();
    };

    return (
        <div ref={containerRef} className="relative">
            <button
                type="button"
                className="relative rounded-full border border-input bg-background p-2 text-muted-foreground shadow-sm hover:bg-muted"
                onClick={() => setOpen((prev) => !prev)}
            >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                        {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                )}
            </button>

            {open && (
                <div className="absolute right-0 z-40 mt-2 w-[90vw] max-w-sm rounded-md border border-border bg-popover shadow-lg sm:w-80">
                    <div className="flex items-center justify-between border-b border-border px-4 py-2">
                        <span className="text-sm font-semibold text-foreground">Notifications</span>
                        {notifications.length > 0 && (
                            <button
                                type="button"
                                className="text-xs text-muted-foreground hover:text-foreground"
                                onClick={handleMarkAllRead}
                            >
                                Mark all read
                            </button>
                        )}
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                        {loading && (
                            <div className="px-4 py-3 text-sm text-muted-foreground">Loading…</div>
                        )}
                        {!loading && notifications.length === 0 && (
                            <div className="px-4 py-3 text-sm text-muted-foreground">No notifications.</div>
                        )}
                        {!loading && notifications.map((notification) => (
                            <button
                                key={notification.notification_id}
                                type="button"
                                onClick={() => handleRead(notification)}
                                className={cn(
                                    "flex w-full flex-col gap-1 px-4 py-3 text-left text-sm transition-colors",
                                    "hover:bg-accent hover:text-accent-foreground",
                                    !notification.is_read && "bg-accent/40"
                                )}
                            >
                                <span className="font-medium text-foreground">{notification.title}</span>
                                {notification.message && (
                                    <span className="text-xs text-muted-foreground">{notification.message}</span>
                                )}
                                {(notification.account_id || notification.invoice_id) && (
                                    <div className="mt-2 flex flex-wrap gap-2">
                                        {notification.account_id && (
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleRead(notification, `/accounts/details/${notification.account_id}`);
                                                }}
                                                className="rounded-full border border-border px-2.5 py-1 text-[11px] font-semibold text-foreground hover:bg-muted"
                                            >
                                                Open Account
                                            </button>
                                        )}
                                        {notification.invoice_id && (
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleRead(notification, `/invoice/${notification.invoice_id}`);
                                                }}
                                                className="rounded-full border border-border px-2.5 py-1 text-[11px] font-semibold text-foreground hover:bg-muted"
                                            >
                                                Open Invoice
                                            </button>
                                        )}
                                    </div>
                                )}
                                {notification.created_at && (
                                    <span className="text-[11px] text-muted-foreground">
                                        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationBell;

NotificationBell.propTypes = {
    user: PropTypes.object,
};
