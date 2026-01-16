import React from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function AppLayout({ title, subtitle, children }) {
  return (
    <div style={{ display: "flex" }}>
      <Sidebar />

      <div style={{ flex: 1, minHeight: "100vh" }}>
        <Topbar title={title} subtitle={subtitle} />
        <div className="container">{children}</div>
      </div>
    </div>
  );
}
