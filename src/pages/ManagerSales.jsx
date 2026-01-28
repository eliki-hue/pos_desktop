import React, { useEffect, useState } from "react";
import AppLayout from "../components/AppLayout";
import { api } from "../api/client";

export default function ManagerSales() {
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    api.get("/api/reports/branch-sales-summary/", {
      params: {
        branch_id: 1,          // later: derive from user
        start: "2026-01-01",
        end: "2026-12-31",
      },
    }).then(res => setSummary(res.data));
  }, []);

  return (
    <AppLayout title="Branch Sales">
      {!summary ? (
        "Loading..."
      ) : (
        <div className="grid grid-3">
          <Stat label="Orders" value={summary.orders_count} />
          <Stat label="Revenue" value={`KES ${summary.total_revenue}`} />
          <Stat label="Items Sold" value={summary.total_items} />
        </div>
      )}
    </AppLayout>
  );
}

function Stat({ label, value }) {
  return (
    <div className="card">
      <div className="muted">{label}</div>
      <div style={{ fontSize: 22, fontWeight: 900 }}>{value}</div>
    </div>
  );
}
