import React from "react";
import { useAuth } from "../auth/AuthContext";
import { useNavigate } from "react-router-dom";
import NotificationBell from "./NotificationBell";

export default function Topbar({ title, subtitle }) {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();               // clear session
    navigate("/login", { replace: true }); 
  };

  return (
    <div
      style={{
        background: "white",
        borderBottom: "1px solid var(--border)",
        padding: "14px 18px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
      }}
    >
      {/* LEFT: TITLE */}
      <div>
        <div style={{ fontSize: 18, fontWeight: 900 }}>{title}</div>
        {subtitle ? <div className="muted">{subtitle}</div> : null}
      </div>

      {/* RIGHT: ACTIONS */}
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        {/* 🔔 NOTIFICATION BELL */}
        <NotificationBell />

        {/* USER INFO */}
        <div style={{ textAlign: "right" }}>
          <div style={{ fontWeight: 800, fontSize: 13 }}>
            {user?.username || "-"}
          </div>
          <div className="muted" style={{ fontSize: 12 }}>
            {user?.role || ""}
          </div>
        </div>

        {/* LOGOUT */}
        <button className="btn" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </div>
  );
}