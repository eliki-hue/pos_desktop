import React, { useEffect, useState } from "react";
import AppLayout from "../components/AppLayout";
import { api } from "../api/client";

/* =====================================================
   RECEIPT MODAL
===================================================== */
function ReceiptModal({ receipt, onClose }) {
  if (!receipt) return null;

  const isCredit = receipt.status === "CREDIT";
  const isPartial = receipt.status === "PARTIAL";

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.6)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 9999,
      }}
    >
      <div
        className="card"
        style={{
          width: "100%",
          maxWidth: 560,
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontWeight: 900, fontSize: 18 }}>🧾 Receipt</div>
            <div className="muted">Sale #{receipt.id}</div>
          </div>
          <button className="btn btn-danger" onClick={onClose}>
            Close
          </button>
        </div>

        {/* Meta */}
        <div style={{ marginTop: 12 }} className="muted">
          Branch: <b>{receipt.branch_name}</b>
          <br />
          Cashier: <b>{receipt.cashier_username}</b>
          <br />
          Date: <b>{new Date(receipt.created_at).toLocaleString()}</b>
        </div>

        {/* STATUS BADGE */}
        <div style={{ marginTop: 12 }}>
          <span
            style={{
              padding: "6px 12px",
              borderRadius: 6,
              fontWeight: 900,
              background:
                receipt.status === "PAID"
                  ? "#e6f4ea"
                  : receipt.status === "PARTIAL"
                  ? "#fff4e5"
                  : "#fdecea",
              color:
                receipt.status === "PAID"
                  ? "#137333"
                  : receipt.status === "PARTIAL"
                  ? "#a15c00"
                  : "#b00020",
            }}
          >
            {receipt.status}
          </span>
        </div>

        {/* CUSTOMER (ONLY FOR PARTIAL / CREDIT) */}
        {(isPartial || isCredit) && (
          <div style={{ marginTop: 14 }}>
            <div style={{ fontWeight: 900 }}>Customer</div>
            <div className="muted">
              {receipt.customer_name}
              <br />
              {receipt.customer_phone}
              {receipt.customer_id_number && (
                <>
                  <br />
                  ID: {receipt.customer_id_number}
                </>
              )}
            </div>
          </div>
        )}

        {/* ITEMS */}
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
              {receipt.items.map((i, idx) => (
                <tr key={idx}>
                  <td>{i.product_name}</td>
                  <td>{i.quantity}</td>
                  <td>KES {i.unit_price}</td>
                  <td>KES {i.subtotal}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* TOTALS */}
        <div style={{ marginTop: 12, fontWeight: 900 }}>
          Subtotal: KES {receipt.subtotal}
          <br />
          Discount: KES {receipt.discount}
          <br />
          Tax: KES {receipt.tax}
          <br />
          <div style={{ fontSize: 18, marginTop: 6 }}>
            TOTAL: KES {receipt.total}
          </div>
        </div>

        {/* PAYMENTS */}
        {receipt.payments.length > 0 && (
          <div style={{ marginTop: 14 }}>
            <div style={{ fontWeight: 900 }}>Payments</div>
            {receipt.payments.map((p, idx) => (
              <div key={idx} className="muted">
                {p.method}: KES {p.amount}
                {p.reference && ` (Ref: ${p.reference})`}
              </div>
            ))}
          </div>
        )}

        {/* PAID / BALANCE */}
        <div style={{ marginTop: 14, fontWeight: 900 }}>
          Paid: KES {receipt.amount_paid}
          <br />
          Balance Due: KES {receipt.balance_due}
        </div>

        {/* PRINT */}
        <button
          className="btn btn-primary"
          style={{ width: "100%", marginTop: 16 }}
          onClick={() => window.print()}
        >
          Print Receipt
        </button>
      </div>
    </div>
  );
}

/* =====================================================
   RECEIPTS PAGE
===================================================== */
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
      setMsg("Failed to load receipts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReceipts();
  }, []);

  return (
    <AppLayout title="Receipts" subtitle="View and reprint receipts">
      <ReceiptModal receipt={selected} onClose={() => setSelected(null)} />

      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontWeight: 900 }}>Receipt History</div>
            <div className="muted">
              Showing {receipts.length} receipts
            </div>
          </div>
          <button className="btn btn-primary" onClick={loadReceipts}>
            Refresh
          </button>
        </div>

        {msg && <div style={{ marginTop: 10 }}>{msg}</div>}
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
                <th>Status</th>
                <th>Total</th>
                <th>Balance</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {receipts.map((r) => (
                <tr key={r.id}>
                  <td>{r.id}</td>
                  <td>{new Date(r.created_at).toLocaleString()}</td>
                  <td>{r.status}</td>
                  <td>KES {r.total}</td>
                  <td>KES {r.balance_due}</td>
                  <td>
                    <button
                      className="btn btn-primary"
                      onClick={() => setSelected(r)}
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
