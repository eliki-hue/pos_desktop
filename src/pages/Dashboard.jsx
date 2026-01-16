import React from "react";
import AppLayout from "../components/AppLayout";

export default function Dashboard() {
  return (
    <AppLayout title="Dashboard" subtitle="Overview of POS activity">
      <div className="grid grid-3">
        <div className="card">
          <div className="muted">Today Sales</div>
          <div style={{ fontSize: 26, fontWeight: 900 }}>KES 0.00</div>
        </div>

        <div className="card">
          <div className="muted">Transactions</div>
          <div style={{ fontSize: 26, fontWeight: 900 }}>0</div>
        </div>

        <div className="card">
          <div className="muted">Items Sold</div>
          <div style={{ fontSize: 26, fontWeight: 900 }}>0</div>
        </div>
      </div>

      <div style={{ marginTop: 16 }} className="card">
        <div style={{ fontWeight: 900 }}>Quick Actions</div>
        <div style={{ marginTop: 10, display: "flex", gap: 10 }}>
          <a className="btn btn-primary" href="/products">
            Go to Products
          </a>
          <a className="btn" href="/cart">
            Open Cart
          </a>
          <a className="btn" href="/sales">
            View Sales
          </a>
        </div>
      </div>
    </AppLayout>
  );
}
