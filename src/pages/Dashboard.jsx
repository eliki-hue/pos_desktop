import React from "react";
import { Link } from "react-router-dom";
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

      {/*  */}
    </AppLayout>
  );
}
