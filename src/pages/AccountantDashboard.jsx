import React, { useState, useEffect } from "react";
import AppLayout from "../components/AppLayout";
import AccountantReportFilters from "../components/accounting/AccountantReportFilters";
import { api } from "../api/axios";



function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getInitialFilters() {
  const today = new Date();
  const start = new Date(today);

  // Last 7 days, including today
  start.setDate(today.getDate() - 6);

  return {
    start: formatDate(start),
    end: formatDate(today),
    range: "7d",
  };
}

export default function AccountantDashboard() {
    const [filters, setFilters] = useState(getInitialFilters);

    const [overview, setOverview] = useState(null);
    const [loadingOverview, setLoadingOverview] = useState(false);
    const [overviewError, setOverviewError] = useState("");
  
  useEffect(() => {
    let cancelled = false;

    const loadOverview = async () => {
        setLoadingOverview(true);
        setOverviewError("");

        try {
        const response = await api.get("/api/reports/admin-overview/", {
            params: {
            start: filters.start,
            end: filters.end,
            },
        });

        if (!cancelled) {
            setOverview(response.data);
        }
        } catch (error) {
        if (!cancelled) {
            setOverviewError(
            error?.response?.data?.detail ||
            error?.response?.data?.error ||
            "Failed to load financial overview."
            );
        }
        } finally {
        if (!cancelled) {
            setLoadingOverview(false);
        }
        }
    };

    if (filters.start && filters.end) {
        loadOverview();
    }

    return () => {
        cancelled = true;
    };
    }, [filters.start, filters.end]);
  
  
  
    return (
    <AppLayout
      title="Accountant Dashboard"
      subtitle="Financial reports and accounting overview"
    >
      <AccountantReportFilters
        filters={filters}
        onChange={setFilters}
      />

      <div className="card" style={{ padding: 24 }}>
        <h2 style={{ marginTop: 0 }}>
            Financial Overview
        </h2>

        <div style={{ marginTop: 8, marginBottom: 20 }}>
            <span className="muted">
            {filters.start} → {filters.end}
            </span>
        </div>

        {loadingOverview && (
            <p className="muted">
            Loading financial overview...
            </p>
        )}

        {!loadingOverview && overviewError && (
            <div
            style={{
                padding: 12,
                borderRadius: 8,
                background: "#fff3f3",
                color: "#b42318",
            }}
            >
            {overviewError}
            </div>
        )}

                {!loadingOverview && !overviewError && overview && (
          <>
            {/* Main financial KPIs */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(200px, 1fr))",
                gap: 16,
              }}
            >
              <div className="card">
                <div className="muted">Total Revenue</div>

                <h2 style={{ margin: "8px 0 0" }}>
                  KES{" "}
                  {Number(
                    overview.total_revenue || 0
                  ).toLocaleString("en-KE", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </h2>
              </div>

              <div className="card">
                <div className="muted">POS Revenue</div>

                <h2 style={{ margin: "8px 0 0" }}>
                  KES{" "}
                  {Number(
                    overview.pos_revenue || 0
                  ).toLocaleString("en-KE", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </h2>
              </div>

              <div className="card">
                <div className="muted">
                  Ecommerce Revenue
                </div>

                <h2 style={{ margin: "8px 0 0" }}>
                  KES{" "}
                  {Number(
                    overview.ecommerce_revenue || 0
                  ).toLocaleString("en-KE", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </h2>
              </div>

              <div className="card">
                <div className="muted">Company Profit</div>

                <h2 style={{ margin: "8px 0 0" }}>
                  KES{" "}
                  {Number(
                    overview.company_profit || 0
                  ).toLocaleString("en-KE", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </h2>
              </div>

              <div className="card">
                <div className="muted">Total Orders</div>

                <h2 style={{ margin: "8px 0 0" }}>
                  {Number(
                    overview.total_orders || 0
                  ).toLocaleString()}
                </h2>
              </div>

              <div className="card">
                <div className="muted">Items Sold</div>

                <h2 style={{ margin: "8px 0 0" }}>
                  {Number(
                    overview.total_items_sold || 0
                  ).toLocaleString()}
                </h2>
              </div>
            </div>

            {/* POS / Ecommerce breakdown */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(220px, 1fr))",
                gap: 16,
                marginTop: 16,
              }}
            >
              <div className="card">
                <div className="muted">POS Orders</div>

                <h3 style={{ margin: "8px 0 0" }}>
                  {Number(
                    overview.pos_orders || 0
                  ).toLocaleString()}
                </h3>
              </div>

              <div className="card">
                <div className="muted">
                  Ecommerce Orders
                </div>

                <h3 style={{ margin: "8px 0 0" }}>
                  {Number(
                    overview.ecommerce_orders || 0
                  ).toLocaleString()}
                </h3>
              </div>

              <div className="card">
                <div className="muted">
                  POS Items Sold
                </div>

                <h3 style={{ margin: "8px 0 0" }}>
                  {Number(
                    overview.pos_items_sold || 0
                  ).toLocaleString()}
                </h3>
              </div>

              <div className="card">
                <div className="muted">
                  Ecommerce Items Sold
                </div>

                <h3 style={{ margin: "8px 0 0" }}>
                  {Number(
                    overview.ecommerce_items_sold || 0
                  ).toLocaleString()}
                </h3>
              </div>
            </div>
          </>
        )}
        </div>
    </AppLayout>
  );
}