import React from "react";
import AppLayout from "../components/AppLayout";

export default function Stores() {
  return (
    <AppLayout title="Stores" subtitle="Branches and store information">
      <div className="card">
        <div style={{ fontWeight: 900 }}>Stores</div>
        <p className="muted">
          This page can show branches, addresses, and staff assignment.
        </p>
      </div>
    </AppLayout>
  );
}
