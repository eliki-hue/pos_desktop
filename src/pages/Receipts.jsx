import React, { useEffect, useState } from "react";
import AppLayout from "../components/AppLayout";
import { api } from "../api/client";

/* =====================================================
   RECEIPT MODAL - OPTIMIZED FOR 80mm THERMAL PRINTER
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
      {/* PRINT STYLES FOR 80mm THERMAL PRINTER */}
      <style>
        {`
          @media print {
            @page {
              size: 80mm auto;
              margin: 0;
            }
            
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
              width: 80mm;
              font-family: 'Times New Roman', Verdana, Tahoma;
              font-size: 12pt;
              line-height: 1.3;
            }
            
            .no-print {
              display: none !important;
            }
            
            /* Thermal printer optimizations */
            .print-area hr {
              border-top: 1px dashed #000;
              margin: 4px 0;
            }
            
            .print-area table {
              width: 100%;
              font-size: 12pt;
            }
            
            .print-area th, .print-area td {
              padding: 2px 0;
            }
            
            /* Signature lines for printing */
            .signature-line {
              margin-top: 20px;
              margin-bottom: 10px;
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
            maxWidth: 380,
            maxHeight: "90vh",
            display: "flex",
            flexDirection: "column",
            background: "#ffffff",
            fontFamily: "'Times New Roman', 'Verdana', Tahoma",
            fontSize: "12px",
          }}
        >
          {/* RECEIPT-SCROLLABLE CONTENT */}
          <div style={{ overflowY: "auto", padding: "12px" }}>
            {/* HEADER */}
            <div style={{ textAlign: "center", marginBottom: 12 }}>
              <div style={{ fontWeight: 900, fontSize: 14, textTransform: "uppercase" }}>
                Premium Farming Feeds
              </div>
              <div style={{ fontSize: 12 }}>
                Turitu, Ikinu & Githiga - Kiambu
              </div>
              <div style={{ fontSize: 12 }}>
                P.O Box 1257-00900, Kiambu
              </div>
              <div style={{ fontSize: 12 }}>
                Tel: 0741550549 / 0708488688 / 0711633900
              </div>
              <div style={{ fontSize: 12 }}>
                Paybill: 400200 | Acc: 4003901
              </div>
              <div style={{ fontSize: 12, marginTop: 4 }}>
                {new Date(receipt.created_at).toLocaleString()}
              </div>
              <div style={{ fontSize: 12 }}>
                Receipt: #{receipt.id}
              </div>
            </div>

            <div style={{ fontSize: 12, marginBottom: 8 }}>
              Cashier: {receipt.cashier_username}
              <br />
              Branch: {receipt.branch_name}
            </div>

            {/* Divider */}
            <div style={{ borderTop: "1px dashed #000", margin: "4px 0" }} />

            {/* CUSTOMER */}
            {showCustomer && (
              <>
                <div style={{ fontWeight: 700, fontSize: 12, marginTop: 4 }}>CUSTOMER DETAILS</div>
                <div style={{ fontSize: 12 }}>
                  Name: {receipt.customer_name}<br />
                  Phone: {receipt.customer_phone}<br />
                  ID Number: {receipt.customer_id_number}
                </div>
                <div style={{ borderTop: "1px dashed #000", margin: "4px 0" }} />
              </>
            )}

            {/* ITEMS HEADER */}
            <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: 12, marginTop: 4 }}>
              <div style={{ flex: 3 }}>ITEM</div>
              <div style={{ flex: 1, textAlign: "right" }}>QTY</div>
              <div style={{ flex: 1, textAlign: "right" }}>PRICE</div>
              <div style={{ flex: 1, textAlign: "right" }}>TOTAL</div>
            </div>

            <div style={{ borderTop: "1px dotted #000", margin: "2px 0" }} />

            {/* ITEMS LIST */}
            {(receipt.items || []).map((i, idx) => (
              <div key={idx} style={{ marginBottom: 6, fontSize: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 500 }}>{i.product_name}</div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                  <div style={{ flex: 3 }}>
                    {Number(i.quantity).toFixed(2)} {i.unit} @ KES {Number(i.unit_price).toFixed(2)}
                  </div>
                  <div style={{ flex: 1, textAlign: "right", fontWeight: 500 }}>
                    KES {Number(i.subtotal).toFixed(2)}
                  </div>
                </div>
              </div>
            ))}

            <div style={{ borderTop: "1px dashed #000", margin: "4px 0" }} />

            {/* TOTALS */}
            <div style={{ marginTop: 4 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                <span>Subtotal:</span>
                <span>KES {Number(receipt.subtotal).toFixed(2)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                <span>Discount:</span>
                <span>KES {Number(receipt.discount).toFixed(2)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                <span>Tax:</span>
                <span>KES {Number(receipt.tax).toFixed(2)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: 12, marginTop: 4 }}>
                <span>TOTAL:</span>
                <span>KES {Number(receipt.total).toFixed(2)}</span>
              </div>
            </div>

            <div style={{ borderTop: "1px dashed #000", margin: "4px 0" }} />

            {/* PAYMENTS */}
            <div style={{ marginTop: 4 }}>
              <div style={{ fontWeight: 700, fontSize: 12 }}>PAYMENTS</div>
              {cashPaid > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                  <span>Cash:</span>
                  <span>KES {cashPaid.toFixed(2)}</span>
                </div>
              )}
              {mpesaPaid > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                  <span>MPESA:</span>
                  <span>KES {mpesaPaid.toFixed(2)}</span>
                </div>
              )}
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginTop: 2 }}>
                <span>Total Paid:</span>
                <span>KES {totalPaid.toFixed(2)}</span>
              </div>
              {receipt.status !== "PAID" && (
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 700, marginTop: 2 }}>
                  <span>Balance Due:</span>
                  <span>KES {(Number(receipt.total) - totalPaid).toFixed(2)}</span>
                </div>
              )}
            </div>

            <div style={{ borderTop: "1px dashed #000", margin: "4px 0" }} />

            {/* SIGNATURES FOR PARTIAL/CREDIT SALES */}
            {showCustomer && (
              <div className="signature-line" style={{ marginTop: 8 }}>
                <div style={{ fontWeight: 700, fontSize: 10, textAlign: "center", marginBottom: 12 }}>
                  AGREEMENT
                </div>
                <div style={{ fontSize: 12, marginBottom: 16 }}>
                  I hereby acknowledge receipt of goods and agree to pay the balance as stated above.
                </div>
                
                {/* Customer Signature */}
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 12, marginBottom: 4 }}>Customer Signature: _______________________</div>
                  <div style={{ fontSize: 12, marginTop: 2 }}>Date: _________________</div>
                </div>
                
                {/* Manager Signature */}
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 12, marginBottom: 4 }}>Manager Signature: _______________________</div>
                  <div style={{ fontSize: 12, marginTop: 2 }}>Date: _________________</div>
                </div>
                
                <div style={{ fontSize: 12, textAlign: "center", marginTop: 8, color: "#666" }}>
                  This is a legally binding agreement
                </div>
                <div style={{ borderTop: "1px dashed #000", margin: "8px 0" }} />
              </div>
            )}

            {/* FOOTER */}
            <div style={{ textAlign: "center", marginTop: 8 }}>
              <div style={{ fontSize: 12, fontWeight: 700 }}>
                THANK YOU FOR SHOPPING WITH US
              </div>
              {receipt.status === "PARTIAL" && (
                <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>
                  Goods issued on partial payment.<br />
                  Please settle balance within 30 days.
                </div>
              )}
              {receipt.status === "CREDIT" && (
                <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>
                  Goods issued on credit.<br />
                  Payment due within 30 days.
                </div>
              )}
              {/* <div style={{ fontSize: 12, marginTop: 6 }}>
                Returns accepted within 7 days with valid receipt
              </div> */}
              <div style={{ fontSize: 12, marginTop: 6 }}>
                Thank you for your business!
              </div>
            </div>
          </div>

          {/* ACTIONS (STICKY, NO PRINT) */}
          <div
            className="no-print"
            style={{
              display: "flex",
              gap: 8,
              padding: "12px",
              borderTop: "1px solid #e2e8f0",
              background: "#ffffff",
            }}
          >
            <button
              className="btn btn-primary"
              style={{ flex: 1 }}
              onClick={() => window.print()}
            >
              🖨️ Print Receipt
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