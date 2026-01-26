import React, { useEffect, useState } from "react";
import AppLayout from "../components/AppLayout";
import { api } from "../api/client";

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
          maxWidth: 520,
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

export default function Receipts() {
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [selected, setSelected] = useState(null);

  const loadReceipts = async () => {
    setLoading(true);
    setMsg("");
    try {
      const res = await api.get("/api/cart/pos/receipts/");
      setReceipts(res.data);
    } catch (err) {
      setMsg(err?.response?.data?.detail || "❌ Failed to load receipts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReceipts();
  }, []);

  return (
    <AppLayout title="Receipts" subtitle="View and reprint previous receipts">
      <ReceiptModal receipt={selected} onClose={() => setSelected(null)} />

      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
          <div>
            <div style={{ fontWeight: 900 }}>Receipt History</div>
            <div className="muted">Showing last {receipts.length} receipts</div>
          </div>

          <button className="btn btn-primary" onClick={loadReceipts}>
            Refresh
          </button>
        </div>

        {msg && <div style={{ marginTop: 10, fontWeight: 800 }}>{msg}</div>}
      </div>

      <div style={{ marginTop: 16 }} className="card">
        {loading ? (
          <div className="muted">Loading receipts...</div>
        ) : receipts.length === 0 ? (
          <div className="muted">No receipts found.</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Date</th>
                <th>Total</th>
                <th>Items</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {receipts.map((r) => (
                <tr key={r.id}>
                  <td>{r.id}</td>
                  <td>{new Date(r.created_at).toLocaleString()}</td>
                  <td style={{ fontWeight: 900 }}>KES {r.total}</td>
                  <td>{r.items?.length || 0}</td>
                  <td style={{ width: 140 }}>
                    <button className="btn btn-primary" onClick={() => setSelected(r)}>
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
