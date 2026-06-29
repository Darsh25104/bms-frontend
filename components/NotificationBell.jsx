import { useEffect, useRef, useState } from "react";
import api from "../api/axios";

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const intervalRef = useRef(null);

  const fetchNotifications = async () => {
    try {
      const res = await api.get("/notification/all");
      if (res.data.success) {
        setNotifications(res.data.notifications);
      }
    } catch (err) {
      // silent fail, no need to spam errors on every poll
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Poll every 15 seconds so new notifications show up without refreshing
    intervalRef.current = setInterval(fetchNotifications, 15000);
    return () => clearInterval(intervalRef.current);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="notif-wrapper">
      <button className="notif-bell" onClick={() => setOpen((o) => !o)}>
        🔔
        {unreadCount > 0 && <span className="notif-count">{unreadCount}</span>}
      </button>

      {open && (
        <div className="notif-dropdown">
          <div className="notif-header">Notifications</div>
          {notifications.length === 0 && (
            <div className="notif-empty">No notifications yet</div>
          )}
          {notifications.map((n) => (
            <div key={n._id} className={`notif-item ${n.read ? "" : "unread"}`}>
              <p>{n.message}</p>
              <span className="notif-time">
                {new Date(n.createdAt).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
