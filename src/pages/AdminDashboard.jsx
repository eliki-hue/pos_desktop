import React, { useEffect, useState } from "react";
import AppLayout from "../components/AppLayout";
import { api } from "../api/client";

export default function AdminDashboard() {
  const [overview, setOverview] = useState(null);
  const [branches, setBranches] = useState([]);
  const [cashiers, setCashiers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [o, b, c] = await Promise.all([
          api.get("/api/reports/admin-overview/"),
          api.get("/api/reports/branches-performance/"),
          api.get("/api/reports/cashiers-performance/"),
        ]);

        setOverview(o.data);
        setBranches(Array.isArray(b.data) ? b.data : []);
        setCashiers(Array.isArray(c.data) ? c.data : []);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return <AppLayout title="Admin Dashboard">Loading…</AppLayout>;
  }

  return (
    <AppLayout title="Admin Dashboard" subtitle="Company performance overview">
      {/* Overview */}
      <div className="grid grid-4">
        <div className="card">
          <div className="muted">Total Revenue</div>
          <div className="xl">KES {overview.total_revenue}</div>
        </div>

        <div className="card">
          <div className="muted">POS Orders</div>
          <div className="xl">{overview.orders_count}</div>
        </div>

        <div className="card">
          <div className="muted">Branches</div>
          <div className="xl">{overview.branches}</div>
        </div>

        <div className="card">
          <div className="muted">Active Products</div>
          <div className="xl">{overview.active_products}</div>
        </div>
      </div>

      {/* Branch performance */}
      <div className="card" style={{ marginTop: 20 }}>
        <h3>Branch Performance</h3>
        <table className="table">
          <thead>
            <tr>
              <th>Branch</th>
              <th>Orders</th>
              <th>Items Sold</th>
              <th>Revenue</th>
            </tr>
          </thead>
          <tbody>
            {branches.map((b) => (
              <tr key={b.branch_id}>
                <td>{b.branch_name}</td>
                <td>{b.orders}</td>
                <td>{b.items_sold}</td>
                <td>KES {b.revenue}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Cashier performance */}
      <div className="card" style={{ marginTop: 20 }}>
        <h3>Cashier Performance</h3>
        <table className="table">
          <thead>
            <tr>
              <th>Cashier</th>
              <th>Orders</th>
              <th>Revenue</th>
            </tr>
          </thead>
          <tbody>
            {cashiers.map((c) => (
              <tr key={c.cashier_id}>
                <td>{c.cashier}</td>
                <td>{c.orders}</td>
                <td>KES {c.revenue}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppLayout>
  );
}
