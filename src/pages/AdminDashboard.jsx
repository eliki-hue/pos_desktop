import React, { useEffect, useState } from "react";
import AppLayout from "../components/AppLayout";
import { api } from "../api/client";

function StatCard({ label, value }) {
  return (
    <div
      className="card"
      style={{
        flex: 1,
        minWidth: 180,
      }}
    >
      <div className="muted">{label}</div>
      <div style={{ fontSize: 22, fontWeight: 900, marginTop: 6 }}>
        {value}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get("/api/reports/admin-overview/");
        setData(res.data);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <AppLayout
      title="Admin Dashboard"
      subtitle="Company-wide overview"
    >
      {loading ? (
        <div className="muted">Loading overview...</div>
      ) : (
        <>
          {/* KPI ROW */}
          <div
            style={{
              display: "flex",
              gap: 16,
              flexWrap: "wrap",
            }}
          >
            <StatCard
              label="Total Revenue"
              value={`KES ${data.total_revenue.toLocaleString()}`}
            />
            <StatCard
              label="POS Revenue"
              value={`KES ${data.pos_revenue.toLocaleString()}`}
            />
            <StatCard
              label="E-commerce Revenue"
              value={`KES ${data.ecommerce_revenue.toLocaleString()}`}
            />
            <StatCard
              label="Total Orders"
              value={data.orders_count}
            />
            <StatCard
              label="Branches"
              value={data.branches}
            />
            <StatCard
              label="Active Products"
              value={data.active_products}
            />
          </div>
        </>
      )}
    </AppLayout>
  );
}
