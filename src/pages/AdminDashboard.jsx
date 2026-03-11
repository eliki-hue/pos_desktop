import React, { useEffect, useState } from "react";
import AppLayout from "../components/AppLayout";
import { api } from "../api/client";

export default function AdminDashboard() {
  const today = new Date().toISOString().slice(0, 10);

  const [start, setStart] = useState(today);
  const [end, setEnd] = useState(today);
  const [branchId, setBranchId] = useState("");

  const [company, setCompany] = useState(null);
  const [topProducts, setTopProducts] = useState([]);

  const [overview, setOverview] = useState(null);
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [branchSummary, setBranchSummary] = useState(null);
  const [cashiers, setCashiers] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadReports = async () => {
    setLoading(true);
    setError("");

    try {
      /* ================= SAFE REPORT ENDPOINTS ================= */

      const [
        topProductsRes,
        overviewRes,
        branchesRes,
        cashiersRes,
      ] = await Promise.all([
        api.get("/api/reports/product-performance/", {
          params: { start, end }
        }),
        api.get("/api/reports/admin-overview/"),
        api.get("/api/reports/branches-performance/"),
        api.get("/api/reports/cashiers-performance/", {
          params: { branch: branchId, start, end }
        }),
      ]);

      /* ================= Company Summary ================= */
      // setCompany(companyRes.data || null);
      // console.log(topProductsRes)
      setTopProducts(
        Array.isArray(topProductsRes.data)
          ? topProductsRes.data
          : []
      );
        
      /* ================= Admin Overview ================= */
      setOverview(overviewRes.data || null);

      /* ================= Branch Performance ================= */
      setBranches(Array.isArray(branchesRes.data) ? branchesRes.data : []);

      /* ================= Cashier Performance ================= */
      setCashiers(Array.isArray(cashiersRes.data) ? cashiersRes.data : []);

      const loadBranchSummary = async (branchId) => {
        try {
          const res = await api.get("/api/reports/branch-sales-summary/", {
            params: {
              branch: branchId,
              start,
              end,
            },
          });
          setBranchSummary(res.data);
        } catch {
          setBranchSummary(null);
        }
      };

    } catch (err) {
      console.error("Admin dashboard error:", err);
      setError("❌ Failed to load admin dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, [start, end, branchId]);
console.log(topProducts[0]);
  return (
    <AppLayout title="Admin Dashboard" subtitle="Company performance overview">
      {/* ================= Filters ================= */}
      <div className="card" style={{ display: "flex", gap: 12 }}>
        <input
          type="date"
          className="input"
          value={start}
          onChange={(e) => setStart(e.target.value)}
        />
        <input
          type="date"
          className="input"
          value={end}
          onChange={(e) => setEnd(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="muted">Loading dashboard…</div>
      ) : error ? (
        <div className="card" style={{ color: "red", fontWeight: 700 }}>
          {error}
        </div>
      ) : (
        <>
          {/* ================= Admin Overview ================= */}
          {overview && (
            <>
            <div className="grid grid-4" style={{ marginTop: 16 }}>
              <StatCard
                label="Total Company Revenue"
                value={`KSh. ${overview.total_revenue}`}
              />
              <StatCard
                label="Total Company Orders"
                value={overview.total_orders}
              />
              <StatCard
                label="Total Items Sold"
                value={overview.total_items_sold}
              />
              <StatCard
                label="Total Company Profit"
                value={`KES ${Number(overview.company_profit).toFixed(2)}`}
              />
            </div>

            <div className="grid grid-4" style={{ marginTop: 20 }}>
              <StatCard
                label="POS Sales"
                value={`KES ${Number(overview.pos_revenue).toFixed(2)}`}
              />
              <StatCard
                label="POS Orders"
                value={overview.pos_orders}
              />
              <StatCard
                label="Items Sold"
                value={overview.pos_items_sold}
              />
              <StatCard
                label="POS Profit"
                value={`KES ${Number(overview.pos_revenue).toFixed(2)}`}
              />
            </div>
            <div className="grid grid-4" style={{ marginTop: 20 }}>
              <StatCard
                label="Ecommerce Sales"
                value={`KES ${Number(overview.ecommerce_revenue).toFixed(2)}`}
              />
              <StatCard
                label="Ecommerce Orders"
                value={overview.ecommerce_orders}
              />
              <StatCard
                label="ecommerce Items Sold"
                value={overview.ecommerce_items_sold}
              />
              <StatCard
                label="Ecommerce Profit"
                value={`KES ${Number(overview.ecommerce_profit).toFixed(2)}`}
              />
            </div>
            <div className="grid grid-4" style={{ marginTop: 20 }}>
              <StatCard
                label="Branches"
                value={overview.branches}
              />
              <StatCard
                label="Active Products"
                value={overview.active_products}
              />
            </div>
            </>
          )}

          {/* ================= Company Summary ================= */}
          {company && (
            <>
            {/* <div className="grid grid-3" style={{ marginTop: 20 }}>
              <StatCard
                label="POS Sales"
                value={`KES ${Number(company.pos_revenue).toFixed(2)}`}
              />
              <StatCard
                label="POS Orders"
                value={company.orders_count}
              />
              <StatCard
                label="Items Sold"
                value={company.total_items}
              />
            </div> */}
            
            </>
          )}

          {/* ================= Top Products ================= */}
          <div className="card" style={{ marginTop: 20 }}>
            <div style={{ fontWeight: 900 }}>Top Products</div>

            {topProducts.length === 0 ? (
              <div className="muted">No sales data available.</div>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Product ID</th>
                    <th>Product name</th>
                    <th>sold quantity</th>
                    <th>Revenue (KES)</th>
                  </tr>
                </thead>
                <tbody>
                  {topProducts.map((p) => (
                    <tr key={p.product_id}>
                      <td>{p.product_id}</td>
                      <td>{p.product}</td>
                      <td>{p.sold_qty}</td>
                      <td>{Number(p.revenue).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* ================= Branch Performance ================= */}
          <div className="card" style={{ marginTop: 20 }}>
            <div style={{ fontWeight: 900 }}>Branch Performance</div>

            {branches.length === 0 ? (
              <div className="muted">No branch data</div>
            ) : (
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
                    <tr key={b.branch_id}
                      style={{ cursor: "pointer" }}
                      onClick={() => loadBranchSummary(b.branch_id)}>
                      <td>{b.branch_name}</td>
                      <td>{b.orders}</td>
                      <td>{b.items_sold}</td>
                      <td>KES {b.revenue}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* ================= Cashier Performance ================= */}
          <div className="card" style={{ marginTop: 20 }}>
            <div style={{ fontWeight: 900 }}>Cashier Performance</div>

            {cashiers.length === 0 ? (
              <div className="muted">No cashier data</div>
            ) : (
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
            )}
          </div>
        </>
      )}
    </AppLayout>
  );
}

/* ================= Reusable Card ================= */

function StatCard({ label, value }) {
  return (
    <div className="card">
      <div className="muted">{label}</div>
      <div style={{ fontSize: 22, fontWeight: 900 }}>{value}</div>
    </div>
  );
}
