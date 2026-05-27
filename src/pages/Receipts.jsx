import React, { useEffect, useState } from "react";
import AppLayout from "../components/AppLayout";
import { api } from "../api/client";

/* =====================================================
   RECEIPT MODAL - MATCHING CHECKOUT FORMAT
===================================================== */
function ReceiptModal({ receipt, onClose }) {
  if (!receipt) return null;

  const payments = receipt.payments || [];

  const cashPaid = payments
    .filter(p => p.method === "CASH")
    .reduce((s, p) => s + Number(p.amount), 0);

  const mpesaPaid = payments
    .filter(p => p.method === "MPESA")
    .reduce((s, p) => s + Number(p.amount), 0);

  const totalPaid = cashPaid + mpesaPaid;

  const showCustomer =
    receipt.status === "PARTIAL" || receipt.status === "CREDIT";

  return (
    <>
      {/* PRINT STYLES */}
      <style>
        {`
          @media print {
            body * {
              visibility: hidden;
            }
            .print-area, .print-area * {
              visibility: visible;
            }
            .print-area {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
            }
            .no-print {
              display: none !important;
            }
          }
        `}
      </style>

      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.6)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          padding: 16,
          zIndex: 9999,
        }}
      >
        <div
          className="card print-area"
          style={{
            width: "100%",
            maxWidth: 420,
            maxHeight: "90vh",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* RECEIPT-SCROLLABLE CONTENT */}
          <div style={{ overflowY: "auto", paddingRight: 4 }}>
            {/* HEADER */}
            <div style={{ textAlign: "center", marginBottom: 12 }}>
              <div style={{ fontWeight: 900, fontSize: 18 }}>
                Premium Farming feeds
              </div>
              <div style={{ fontWeight: 500, fontSize: 14 }}>
                Turitu, Ikinu & Githiga - Kiambu
              </div>
              <div style={{ fontWeight: 500, fontSize: 14 }}>
                Paybill 400200 Acc No. 4003901                
              </div>
              <div className="muted">SALES RECEIPT</div>
            </div>

            <div className="muted">
              Receipt #: <b>{receipt.id}</b><br />
              Date: {new Date(receipt.created_at).toLocaleString()}<br />
              Cashier: {receipt.cashier_username}<br />
              Branch: {receipt.branch_name}
            </div>

            <hr />

            {/* CUSTOMER */}
            {showCustomer && (
              <>
                <div style={{ fontWeight: 900 }}>Customer</div>
                <div className="muted">
                  {receipt.customer_name}<br />
                  {receipt.customer_phone}<br />
                  ID: {receipt.customer_id_number}
                </div>
                <hr />
              </>
            )}

            {/* ITEMS - WITH UNIT SUPPORT */}
            <table className="table" style={{ fontSize: 10 }}>
              <thead>
                <tr>
                  <th>Item</th>
                  <th style={{ textAlign: "right" }}>Qty</th>
                  {/* <th style={{ textAlign: "right" }}>Unit</th> */}
                  <th style={{ textAlign: "right" }}>Unit Price</th>
                  <th style={{ textAlign: "right" }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {(receipt.items || []).map((i, idx) => (
                  <tr key={idx}>
                    <td>
                      {i.product_name}
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <span>{Number(i.quantity).toFixed(2)}{i.unit}</span>
                    </td>
                    {/* <td style={{ textAlign: "right" }}>
                       {i.unit}
                    </td> */}
                    <td style={{ textAlign: "right" }}>
                      KES {Number(i.unit_price).toFixed(2)}
                    </td>
                    <td style={{ textAlign: "right" }}>
                      KES {Number(i.subtotal).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <hr />

            {/* TOTALS */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Subtotal</span>
                <b>KES {Number(receipt.subtotal).toFixed(2)}</b>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Discount</span>
                <b>KES {Number(receipt.discount).toFixed(2)}</b>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Tax</span>
                <b>KES {Number(receipt.tax).toFixed(2)}</b>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontWeight: 900,
                  marginTop: 6,
                }}
              >
                <span>TOTAL</span>
                <span>KES {Number(receipt.total).toFixed(2)}</span>
              </div>
            </div>

            <hr />

            {/* PAYMENTS */}
            <div>
              <div style={{ fontWeight: 500 }}>Payments</div>

              {cashPaid > 0 && (
                <div className="muted">Cash: KES {cashPaid.toFixed(2)}</div>
              )}
              {mpesaPaid > 0 && (
                <div className="muted">MPESA: KES {mpesaPaid.toFixed(2)}</div>
              )}

              <div className="muted">
                Paid: KES {totalPaid.toFixed(2)}
              </div>

              {receipt.status !== "PAID" && (
                <div className="muted">
                  Balance Due: KES {(Number(receipt.total) - totalPaid).toFixed(2)}
                </div>
              )}
            </div>

            <hr />

            {/* FOOTER */}
            <div style={{ textAlign: "center", marginTop: 10 }}>
              <div style={{ fontWeight: 300 }}>
                THANK YOU FOR PURCHASING WITH US
              </div>
              {receipt.status === "PARTIAL" && (
                <div className="muted">
                  Goods issued on partial payment. Please settle balance.
                </div>
              )}
              {receipt.status === "CREDIT" && (
                <div className="muted">
                  Goods issued on credit. Please settle balance.
                </div>
              )}
            </div>
          </div>

          {/* ACTIONS (STICKY, NO PRINT) */}
          <div
            className="no-print"
            style={{
              display: "flex",
              gap: 8,
              marginTop: 12,
            }}
          >
            <button
              className="btn btn-primary"
              style={{ flex: 1 }}
              onClick={() => window.print()}
            >
              Print Receipt
            </button>

            <button
              className="btn btn-danger"
              style={{ flex: 1 }}
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </>
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

  // Helper to get status badge color
  const getStatusStyle = (status) => {
    switch(status) {
      case "PAID":
        return { background: "#e6f4ea", color: "#137333" };
      case "PARTIAL":
        return { background: "#fff4e5", color: "#a15c00" };
      case "CREDIT":
        return { background: "#fdecea", color: "#b00020" };
      default:
        return { background: "#e2e8f0", color: "#475569" };
    }
  };

  return (
    <AppLayout title="Receipts" subtitle="View and reprint receipts">
      <ReceiptModal receipt={selected} onClose={() => setSelected(null)} />

      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontWeight: 900 }}>Receipt History</div>
            <div className="muted">
              Showing {receipts.length} receipt{receipts.length !== 1 ? "s" : ""}
            </div>
          </div>
          <button className="btn btn-primary" onClick={loadReceipts}>
            Refresh
          </button>
        </div>

        {msg && (
          <div style={{ marginTop: 10, color: "red", fontWeight: 500 }}>
            {msg}
          </div>
        )}
      </div>

      <div style={{ marginTop: 16 }} className="card">
        {loading ? (
          <div className="muted">Loading receipts...</div>
        ) : receipts.length === 0 ? (
          <div className="muted">No receipts found.</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="table" style={{ minWidth: 600 }}>
              <thead>
                <tr>
                  <th>Receipt #</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Total</th>
                  <th>Paid</th>
                  <th>Balance</th>
                  <th>Cashier</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {receipts.map((r) => {
                  // Calculate total paid from payments
                  const totalPaid = (r.payments || []).reduce(
                    (sum, p) => sum + Number(p.amount), 
                    0
                  );
                  
                  return (
                    <tr key={r.id}>
                      <td>
                        <strong>#{r.id}</strong>
                      </td>
                      <td style={{ whiteSpace: "nowrap" }}>
                        {new Date(r.created_at).toLocaleString()}
                      </td>
                      <td>
                        <span
                          style={{
                            padding: "4px 8px",
                            borderRadius: 4,
                            fontSize: 12,
                            fontWeight: 600,
                            ...getStatusStyle(r.status),
                          }}
                        >
                          {r.status}
                        </span>
                      </td>
                      <td>
                        <strong>KES {Number(r.total).toFixed(2)}</strong>
                      </td>
                      <td>KES {totalPaid.toFixed(2)}</td>
                      <td style={{ color: r.balance_due > 0 ? "#b00020" : "#137333" }}>
                        KES {Number(r.balance_due).toFixed(2)}
                      </td>
                      <td>{r.cashier_username}</td>
                      <td>
                        <button
                          className="btn btn-primary"
                          onClick={() => setSelected(r)}
                          style={{ whiteSpace: "nowrap" }}
                        >
                          View / Print
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppLayout>
  );
}