import { useEffect, useState } from "react";
import { api } from "../api/client";

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  /* ================= LOAD NOTIFICATIONS ================= */

  async function loadNotifications() {
    try {
      setLoading(true);
      const res = await api.get("/api/notifications/");
      setNotifications(res.data || []);
    } catch (err) {
      console.error("Failed to load notifications", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadNotifications();

    // Poll every 30s
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  /* ================= DERIVED ================= */

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  /* ================= ACTIONS ================= */

  async function markAsRead(id) {
    try {
      await api.post(`/api/notifications/${id}/read/`);
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === id ? { ...n, is_read: true } : n
        )
      );
    } catch (err) {
      console.error("Failed to mark notification read", err);
    }
  }

  async function markAllAsRead() {
    try {
      await api.post("/api/notifications/read-all/");
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, is_read: true }))
      );
    } catch (err) {
      console.error("Failed to mark all as read", err);
    }
  }
console.log(notifications)
  /* ================= UI ================= */

  return (
    <div style={{ position: "relative" }}>
      {/* ===== BELL ===== */}
      <button
        onClick={() => setOpen(!open)}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          position: "relative",
        }}
        aria-label="Notifications"
      >
        🔔
        {unreadCount > 0 && (
          <span
            style={{
              position: "absolute",
              top: -4,
              right: -4,
              background: "red",
              color: "white",
              borderRadius: "50%",
              fontSize: 12,
              padding: "2px 6px",
              fontWeight: 700,
            }}
          >
            {unreadCount}
          </span>
        )}
      </button>

      {/* ===== DROPDOWN ===== */}
      {open && (
        <div
          style={{
            position: "absolute",
            right: 0,
            top: "100%",
            width: 360,
            background: "white",
            boxShadow: "0 8px 20px rgba(0,0,0,0.15)",
            borderRadius: 8,
            zIndex: 1000,
            maxHeight: 420,
            overflowY: "auto",
          }}
        >
          <div
            style={{
              padding: 12,
              borderBottom: "1px solid #eee",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontWeight: 700,
            }}
          >
            Notifications
            {unreadCount > 0 && (
              <button className="btn" onClick={markAllAsRead}>
                Mark all read
              </button>
            )}
          </div>

          {loading ? (
            <div style={{ padding: 12 }} className="muted">
              Loading…
            </div>
          ) : notifications.length === 0 ? (
            <div style={{ padding: 12 }} className="muted">
              No notifications
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => !n.is_read && markAsRead(n.id)}
                style={{
                  padding: 12,
                  cursor: "pointer",
                  background: n.is_read ? "#fff" : "#f6f8ff",
                  borderBottom: "1px solid #eee",
                }}
              >
                <div style={{ fontWeight: 700 }}>{n.title}</div>
                <div style={{ fontSize: 13, whiteSpace: "pre-line" }}>
                  {n.message}
                </div>
                <div className="muted" style={{ fontSize: 12 }}>
                  {new Date(n.created_at).toLocaleString()}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
