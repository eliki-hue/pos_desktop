import React, { useEffect, useMemo, useState } from "react";
import AppLayout from "../components/AppLayout";
import { api } from "../api/client";
import { useAuth } from "../auth/AuthContext";

export default function ManagerInventory() {
  const { user } = useAuth();

  const [branches, setBranches] = useState([]);
  const [selectedBranchId, setSelectedBranchId] = useState("");

  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const [q, setQ] = useState("");

  const canAccess = user?.role === "MANAGER" ||user?.role ==="manager" || user?.role ==="admin" || user?.role === "ADMIN";

  const loadBranches = async () => {
    try {
      const res = await api.get("/api/branches/");
      const list = res.data || [];
      setBranches(list);

      // auto pick first branch if none selected
      if (!selectedBranchId && list.length > 0) {
        setSelectedBranchId(String(list[0].id));
      }
    } catch {
      // ignore, inventory might still load from /api/inventory/
    }
  };

  const loadInventory = async (branchId) => {
    setLoading(true);
    setMsg("");

    try {
      let url = "/api/inventory/";

      // if branch selected, load that branch inventory
      if (branchId) {
        url = `/api/inventory/${branchId}/`;
      }

      const res = await api.get(url);
      setInventory(res.data || []);
    } catch (err) {
      setInventory([]);
      setMsg(err?.response?.data?.detail || "❌ Failed to load inventory");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!canAccess) return;
    loadBranches();
  }, [canAccess]);

  useEffect(() => {
    if (!canAccess) return;
    loadInventory(selectedBranchId);
  }, [canAccess, selectedBranchId]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return inventory;

    return inventory.filter((row) => {
      const productName = (row.product_name || "").toLowerCase();
      const productId = String(row.product || "");
      return productName.includes(query) || productId.includes(query);
    });
  }, [inventory, q]);

  if (!canAccess) {
    return (
      <AppLayout title="Inventory" subtitle="Manager/Admin only">
        <div className="card">
          <div style={{ fontWeight: 900 }}>Access denied</div>
          <div className="muted">Only MANAGER or ADMIN can view inventory.</div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Inventory" subtitle="Monitor stock per branch">
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
          <div>
            <div style={{ fontWeight: 900 }}>Branch Inventory</div>
            <div className="muted">Filter by branch and search product</div>
          </div>

          <button
            className="btn btn-primary"
            onClick={() => loadInventory(selectedBranchId)}
          >
            Refresh
          </button>
        </div>

        <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
          <select
            className="input"
            value={selectedBranchId}
            onChange={(e) => setSelectedBranchId(e.target.value)}
            style={{ width: 260 }}
          >
            {branches.length === 0 ? (
              <option value="">No branches</option>
            ) : (
              branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))
            )}
          </select>

          <input
            className="input"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by product name or ID..."
            style={{ flex: 1, minWidth: 220 }}
          />
        </div>

        {msg && <div style={{ marginTop: 10, fontWeight: 800 }}>{msg}</div>}
      </div>

      <div style={{ marginTop: 16 }} className="card">
        {loading ? (
          <div className="muted">Loading inventory...</div>
        ) : filtered.length === 0 ? (
          <div className="muted">No inventory records found.</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Stock</th>
                <th>Branch</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => (
                <tr key={row.id}>
                  <td style={{ fontWeight: 900 }}>
                    {row.product_name || `Product #${row.product}`}
                  </td>
                  <td>{row.stock}</td>
                  <td className="muted">{row.branch_name || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </AppLayout>
  );
}
