import React from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import NotificationBell from "./NotificationBell";

export default function AppLayout({ title, subtitle, children }) {
  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      <Sidebar />

      <div
        style={{
          marginLeft: "0px",
          flex: 1,
          display: "flex",
          flexDirection: "column",
          height: "100vh",
          overflow: "hidden",
        }}
      >
        <Topbar title={title} subtitle={subtitle} />

        <div
          className="container"
          style={{
            flex: 1,
            overflowY: "auto",     // ← Changed from "hidden" to "auto"
            overflowX: "hidden",
            padding: "20px",
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}