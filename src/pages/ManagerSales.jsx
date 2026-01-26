import React, { useEffect, useMemo, useState } from "react";
import AppLayout from "../components/AppLayout";
import { api } from "../api/client";
import { useAuth } from "../auth/AuthContext";

function ReceiptModal({ receipt, onClose }) {
  if (!receipt) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.55)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: 16,
        zIndex: 9999,
      }}
    >
      <div
        className="card"
        style={{
          width: "100%",
          maxWidth: 560,
          maxHeight: "90vh",
          overflow: "auto",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
          <div>
            <div style={{ fontWeight: 900, fontSize: 18 }}>🧾 Receipt</div>
            <div className="muted">Sale ID: {receipt.id}</div>
          </div>
          <button className="btn btn-danger" onClick={onClose}>
            Close
          </button>
        </div>

        <div style={{ marginTop: 12 }} className="muted">
          Branch: <b>{receipt.branch_name}</b>
          <br />
          Cashier: <b>{receipt.cashier_username}</b>
          <br />
          Date: <b>{new Date(receipt.created_at).toLocaleString()}</b>
        </div>

        <div style={{ marginTop: 14 }}>
          <table className="table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Qty</th>
                <th>Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {(receipt.items || []).map((i) => (
                <tr key={i.id}>
                  <td>{i.product_name}</td>
                  <td>{i.quantity}</td>
                  <td>KES {i.unit_price}</td>
                  <td>KES {i.subtotal}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ marginTop: 12, fontWeight: 900 }}>
          Subtotal: KES {receipt.subtotal}
          <br />
          Discount: KES {receipt.discount}
          <br />
          Tax: KES {receipt.tax}
          <br />
          <div style={{ fontSize: 18, marginTop: 8 }}>
            TOTAL: KES {receipt.total}
          </div>
        </div>

        <button
          className="btn btn-primary"
          style={{ width: "100%", marginTop: 14 }}
          onClick={() => window.print()}
        >
          Print Receipt
        </button>
      </div>
    </div>
  );
}

export default function ManagerSales() {
  const { user } = useAuth();

  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const [q, setQ] = useState("");
  const [selected, setSelected] = useState(null);

  const canAccess = user?.role === "MANAGER" ||user?.role ==="manager" || user?.role ==="admin" || user?.role === "ADMIN";


  const loadSales = async () => {
    setLoading(true);
    setMsg("");

    try {
      const res = await api.get("/api/sales/");
      setSales(res.data || []);
    } catch (err) {
      setSales([]);
      setMsg(err?.response?.data?.detail || "❌ Failed to load sales");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!canAccess) return;
    loadSales();
  }, [canAccess]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return sales;

    return sales.filter((s) => {
      const idMatch = String(s.id || "").includes(query);
      const cashierMatch = String(s.cashier_username || "")
        .toLowerCase()
        .includes(query);
      const branchMatch = String(s.branch_name || "").toLowerCase().includes(query);
      return idMatch || cashierMatch || branchMatch;
    });
  }, [sales, q]);

  if (!canAccess) {
    return (
      <AppLayout title="Sales" subtitle="Manager/Admin only">
        <div className="card">
          <div style={{ fontWeight: 900 }}>Access denied</div>
          <div className="muted">Only MANAGER or ADMIN can view sales.</div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Sales Overview" subtitle="View sales across all cashiers">
      <ReceiptModal receipt={selected} onClose={() => setSelected(null)} />

      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
          <div>
            <div style={{ fontWeight: 900 }}>Sales</div>
            <div className="muted">Search by sale ID, branch or cashier</div>
          </div>

          <button className="btn btn-primary" onClick={loadSales}>
            Refresh
          </button>
        </div>

        <div style={{ marginTop: 12 }}>
          <input
            className="input"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search sales..."
          />
        </div>

        {msg && <div style={{ marginTop: 10, fontWeight: 800 }}>{msg}</div>}
      </div>

      <div style={{ marginTop: 16 }} className="card">
        {loading ? (
          <div className="muted">Loading sales...</div>
        ) : filtered.length === 0 ? (
          <div className="muted">No sales found.</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Date</th>
                <th>Branch</th>
                <th>Cashier</th>
                <th>Total</th>
                <th></th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((s) => (
                <tr key={s.id}>
                  <td>{s.id}</td>
                  <td>{new Date(s.created_at).toLocaleString()}</td>
                  <td>{s.branch_name || "-"}</td>
                  <td>{s.cashier_username || "-"}</td>
                  <td style={{ fontWeight: 900 }}>KES {s.total}</td>
                  <td style={{ width: 140 }}>
                    <button
                      className="btn btn-primary"
                      onClick={() => setSelected(s)}
                    >
                      View / Print
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </AppLayout>
  );
}
