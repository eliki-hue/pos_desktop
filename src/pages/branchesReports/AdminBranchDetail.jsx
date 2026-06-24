import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AppLayout from "../../components/AppLayout";
import { api } from "../../api/client";
import AdminBranchInventory from "./tabs/BranchInventory";

/* ================= DATE RANGE HELPER ================= */

function getRange(type) {
  const today = new Date();
  const toISO = (d) => d.toISOString().slice(0, 10);

  switch (type) {
    case "day":
      return { start: toISO(today), end: toISO(today) };
    case "week": {
      const first = new Date(today);
      first.setDate(today.getDate() - today.getDay());
      return { start: toISO(first), end: toISO(today) };
    }
    case "month":
      return {
        start: toISO(new Date(today.getFullYear(), today.getMonth(), 1)),
        end: toISO(today),
      };
    case "year":
      return {
        start: toISO(new Date(today.getFullYear(), 0, 1)),
        end: toISO(today),
      };
    default:
      return null;
  }
}

/* ================= COMPONENT ================= */

export default function AdminBranchDetail() {
  const { branchId } = useParams();
  const navigate = useNavigate();

  const todayISO = new Date().toISOString().slice(0, 10);

  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState(branchId || "");

  const [rangeType, setRangeType] = useState("day");
  const [start, setStart] = useState(todayISO);
  const [end, setEnd] = useState(todayISO);

  const [summary, setSummary] = useState(null);
  const [products, setProducts] = useState([]);
  const [cashiers, setCashiers] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [tab, setTab] = useState("summary");

  /* ================= LOAD BRANCHES ================= */

  useEffect(() => {
    async function loadBranches() {
      try {
        const res = await api.get("/api/branches/");
        setBranches(res.data || []);
        if (!branchId && res.data?.length) {
          setSelectedBranch(res.data[0].id);
          navigate(`/pos-admin/branch/${res.data[0].id}`, { replace: true });
        }
      } catch (err) {
        console.error(err);
        setError("❌ Failed to load branches");
      }
    }
    loadBranches();
  }, [branchId, navigate]);

  /* ================= RANGE EFFECT ================= */

  useEffect(() => {
    const range = getRange(rangeType);
    if (range) {
      setStart(range.start);
      setEnd(range.end);
    }
  }, [rangeType]);

  /* ================= LOAD DASHBOARD DATA ================= */

  useEffect(() => {
    if (!selectedBranch) return;

    async function loadBranchData() {
      setLoading(true);
      setError("");

      try {
        const [summaryRes, productsRes, cashiersRes] = await Promise.all([
          api.get("/api/reports/branch-sales-summary/", {
            params: { branch_id: selectedBranch, start, end },
          }),
          api.get("/api/reports/product-performance/", {
            params: { branch: selectedBranch, start, end },
          }),
          api.get("/api/reports/cashiers-performance/", {
            params: { branch: selectedBranch, start, end },
          }),
        ]);

        setSummary(summaryRes.data ?? {});
        setProducts(Array.isArray(productsRes.data) ? productsRes.data : []);
        setCashiers(Array.isArray(cashiersRes.data) ? cashiersRes.data : []);
      } catch (err) {
        console.error(err);
        setError("❌ Failed to load branch data");
      } finally {
        setLoading(false);
      }
    }

    loadBranchData();
  }, [selectedBranch, start, end]);

  /* ================= DERIVED DATA ================= */

  const branchName = useMemo(() => {
    return (
      branches.find((b) => String(b.id) === String(selectedBranch))?.name || "—"
    );
  }, [branches, selectedBranch]);

  /* ================= UI ================= */

  return (
    <AppLayout title="Branch Dashboard" subtitle={branchName}>
      {/* ================= BRANCH SWITCHER ================= */}
      <div className="card">
        <div style={{ fontWeight: 900, marginBottom: 8 }}>Select Branch</div>
        <select
          className="input"
          value={selectedBranch}
          onChange={(e) => {
            setSelectedBranch(e.target.value);
            navigate(`/pos-admin/branch/${e.target.value}`);
          }}
        >
          {branches.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
      </div>

      {/* ================= TABS ================= */}
      <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
        <button
          className="btn"
          onClick={() => setTab("summary")}
          style={{ fontWeight: tab === "summary" ? 900 : 400 }}
        >
          Summary
        </button>
        <button
          className="btn"
          onClick={() => setTab("inventory")}
          style={{ fontWeight: tab === "inventory" ? 900 : 400 }}
        >
          Inventory
        </button>
      </div>

      {/* ================= DATE FILTER (UNCHANGED) ================= */}
      {tab === "summary" && (
        <div className="card" style={{ marginTop: 20 }}>
          <div style={{ fontWeight: 900, marginBottom: 10 }}>Date Filter</div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: 10,
            }}
          >
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {["day", "week", "month", "year", "custom"].map((t) => (
                <button key={t} className="btn" onClick={() => setRangeType(t)}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>

            <StatCard label="Branch" value={branchName} />
          </div>
           

          {rangeType === "custom" && (
            <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
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
          )}

          <div className="muted" style={{ marginTop: 8 }}>
            Showing data from <strong>{start}</strong> to <strong>{end}</strong>
          </div>
        </div>
      )}

      {/* ================= SUMMARY TAB (UNCHANGED LOGIC) ================= */}
      {tab === "summary" &&
        (loading ? (
          <div className="muted">Loading branch data…</div>
        ) : error ? (
          <div className="card" style={{ color: "red", fontWeight: 700 }}>
            {error}
          </div>
        ) : (
          <>
            <div className="grid grid-4" style={{ marginTop: 20 }}>
              <StatCard label="Total Items Sold" value={summary.total_qty ?? 0} />
              <StatCard label="Total Orders" value={summary.orders_count ?? 0} />
              <StatCard
                label="Total Revenue" value={`KES ${Number(summary.total_revenue ?? 0).toFixed(2)}`}
              />
              <StatCard
                label="Branch Profit" value={`KES ${Number(summary.total_profit ?? 0).toFixed(2)}`}
              />
             
            </div>

            <DataTable
              title="Product Performance"
              headers={["Product", "Sold Qty", "Revenue"]}
              rows={products.map((p) => [
                p.product,
                p.sold_qty,
                `KES ${Number(p.revenue).toFixed(2)}`,
              ])}
            />

            <DataTable
              title="Cashier Performance"
              headers={["Cashier", "Orders", "Revenue"]}
              rows={cashiers.map((c) => [
                c.cashier,
                c.orders,
                `KES ${Number(c.revenue).toFixed(2)}`,
              ])}
            />
          </>
        ))}

      {/* ================= INVENTORY TAB (APPENDED) ================= */}
      {tab === "inventory" && (
        <AdminBranchInventory branchId={selectedBranch} />
      )}
    </AppLayout>
  );
}

/* ================= REUSABLE UI ================= */

function StatCard({ label, value }) {
  return (
    <div className="card">
      <div className="muted">{label}</div>
      <div style={{ fontSize: 22, fontWeight: 900 }}>{value}</div>
    </div>
  );
}

function DataTable({ title, headers, rows }) {
  return (
    <div className="card" style={{ marginTop: 20 }}>
      <div style={{ fontWeight: 900 }}>{title}</div>

      {rows.length === 0 ? (
        <div className="muted">No data available</div>
      ) : (
        <table className="table">
          <thead>
            <tr>
              {headers.map((h) => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i}>
                {row.map((cell, j) => (
                  <td key={j}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
