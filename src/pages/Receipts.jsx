import React, { useEffect, useState } from "react";
import AppLayout from "../components/AppLayout";
import { api } from "../api/client";

/* =====================================================
   RECEIPT MODAL - OPTIMIZED FOR 80mm THERMAL PRINTER
   WITH REDUCED LINE SPACING & BETTER TABLE HEADERS
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
  
  // Get amount given and change from receipt
  const amountGiven = receipt.amount_given ? Number(receipt.amount_given) : totalPaid;
  const changeGiven = receipt.change_given ? Number(receipt.change_given) : 0;

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
              margin: 2mm;
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
              font-family: 'Arial', 'Helvetica', 'Courier New', monospace;
              font-size: 17pt !important;
              line-height: 1.2 !important;
            }
            
            .no-print {
              display: none !important;
            }
            
            /* Thermal printer optimizations */
            .print-area hr {
              border-top: 1px solid #000;
              margin: 4px 0;
            }
            
            .print-area table {
              width: 100%;
              font-size: 17pt !important;
            }
            
            .print-area th, .print-area td {
              padding: 2px 0;
            }
            
            .print-area th {
              padding-bottom: 4px !important;
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
            maxWidth: 450,
            maxHeight: "90vh",
            display: "flex",
            flexDirection: "column",
            background: "#ffffff",
            fontFamily: "'Arial', 'Helvetica', 'Courier New', monospace",
            fontSize: "12px",
            lineHeight: "1.3",
          }}
        >
          {/* RECEIPT-SCROLLABLE CONTENT */}
          <div style={{ overflowY: "auto", padding: "12px" }}>
            {/* HEADER */}
            <div style={{ textAlign: "center", marginBottom: 12 }}>
              <div style={{ fontWeight: 900, fontSize: "16px", textTransform: "uppercase", marginBottom: 4 }}>
                Premium Farming Feeds
              </div>
              <div style={{ fontSize: "12px", fontWeight: 500 }}>
                Turitu, Ikinu & Githiga - Kiambu
              </div>
              <div style={{ fontSize: "12px" }}>
                P.O Box 1257-00900, Kiambu
              </div>
              <div style={{ fontSize: "12px", fontWeight: 500 }}>
                Tel: 0741550549 / 0708488688 / 0711633900
              </div>
              <div style={{ fontSize: "12px" }}>
                Paybill: 400200 | Acc: 4003901
              </div>
              <div style={{ fontSize: "12px", marginTop: 6, fontWeight: 500 }}>
                {new Date(receipt.created_at).toLocaleString()}
              </div>
              <div style={{ fontSize: "12px", fontWeight: 800, marginTop: 4 }}>
                Receipt: #{receipt.id}
              </div>
            </div>

            <div style={{ fontSize: "12px", marginBottom: 6, fontWeight: 500 }}>
              Cashier: {receipt.cashier_username}
              <br />
              Branch: {receipt.branch_name}
            </div>

            {/* Divider */}
            <div style={{ borderTop: "1px solid #000", margin: "6px 0" }} />

            {/* CUSTOMER */}
            {showCustomer && (
              <>
                <div style={{ fontWeight: 800, fontSize: "12px", marginTop: 6, marginBottom: 4 }}>CUSTOMER DETAILS</div>
                <div style={{ fontSize: "11px" }}>
                  <strong>Name:</strong> {receipt.customer_name}<br />
                  <strong>Phone:</strong> {receipt.customer_phone}<br />
                  <strong>ID Number:</strong> {receipt.customer_id_number}
                </div>
                <div style={{ borderTop: "1px solid #000", margin: "6px 0" }} />
              </>
            )}

            {/* ITEMS HEADER - IMPROVED SPACING */}
            <div style={{ 
              display: "flex", 
              justifyContent: "space-between", 
              fontWeight: 800, 
              fontSize: "12px", 
              marginTop: 8,
              marginBottom: 4,
              backgroundColor: "#f0f0f0",
              padding: "6px 0",
              borderBottom: "2px solid #000",
              borderTop: "1px solid #000"
            }}>
              <div style={{ flex: 3 }}>ITEM</div>
              <div style={{ flex: 1, textAlign: "center" }}>QTY</div>
              <div style={{ flex: 1, textAlign: "right" }}>PRICE</div>
              <div style={{ flex: 1, textAlign: "right" }}>TOTAL</div>
            </div>

            {/* ITEMS LIST */}
            {(receipt.items || []).map((i, idx) => (
              <div key={idx} style={{ marginBottom: 6, borderBottom: "1px dotted #ccc", paddingBottom: 4 }}>
                <div style={{ fontSize: "15px", fontWeight: 700 }}>{i.product_name}</div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "15px", marginTop: 2 }}>
                  <div style={{ flex: 3, fontWeight: 500 }}>
                    {Number(i.quantity).toFixed(2)} {i.unit} @ KES {Number(i.unit_price).toFixed(2)}
                  </div>
                  <div style={{ flex: 1, textAlign: "right", fontWeight: 700 }}>
                    KES {Number(i.subtotal).toFixed(2)}
                  </div>
                </div>
              </div>
            ))}

            <div style={{ borderTop: "1px solid #000", margin: "6px 0" }} />

            {/* TOTALS */}
            <div style={{ marginTop: 4 , fontSize:"12px"}}>
              <div style={{ display: "flex", justifyContent: "space-between",  marginBottom: 3 }}>
                <span>Subtotal:</span>
                <span><strong>KES {Number(receipt.subtotal).toFixed(2)}</strong></span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between",  marginBottom: 3 }}>
                <span>Discount:</span>
                <span><strong>KES {Number(receipt.discount).toFixed(2)}</strong></span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between",  marginBottom: 3 }}>
                <span>Tax:</span>
                <span><strong>KES {Number(receipt.tax).toFixed(2)}</strong></span>
              </div>
              <div style={{ 
                display: "flex", 
                justifyContent: "space-between", 
                fontWeight: 800, 
                fontSize: "14px", 
                marginTop: 6,
                paddingTop: 4,
                borderTop: "2px solid #000"
              }}>
                <span>TOTAL:</span>
                <span>KES {Number(receipt.total).toFixed(2)}</span>
              </div>
            </div>

            <div style={{ borderTop: "1px solid #000", margin: "6px 0" }} />

            {/* PAYMENTS WITH AMOUNT GIVEN AND CHANGE */}
            <div style={{ marginTop: 4, fontSize:"12px" }}>
              <div style={{ fontWeight: 800, marginBottom: 4 }}>PAYMENTS</div>
              {cashPaid > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between",  marginBottom: 3 }}>
                  <span>Cash:</span>
                  <span><strong>KES {cashPaid.toFixed(2)}</strong></span>
                </div>
              )}
              {mpesaPaid > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between",  marginBottom: 3 }}>
                  <span>MPESA:</span>
                  <span><strong>KES {mpesaPaid.toFixed(2)}</strong></span>
                </div>
              )}
              
              {/* AMOUNT GIVEN BY CUSTOMER */}
              {amountGiven >0 &&(<div style={{ 
                display: "flex", 
                justifyContent: "space-between", 
                fontSize: "12px", 
                marginTop: 6,
                paddingTop: 4,
                borderTop: "1px dotted #000"
              }}>
                <span>Amount Given:</span>
                <span><strong>KES {amountGiven.toFixed(2)}</strong></span>
              </div>
              )}
              {/* CHANGE TO RETURN */}
              {changeGiven > 0 && (
                <div style={{ 
                  display: "flex", 
                  justifyContent: "space-between", 
                  fontSize: "12px", 
                  marginTop: 4,
                  marginBottom: 4,
                  // padding: "4px 6px",
                  // backgroundColor: "#e6f4ea",
                  borderRadius: "4px",
                }}>
                  <span> Change due:</span>
                  <span><strong>KES {changeGiven.toFixed(2)}</strong></span>
                </div>
              )}
              
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginTop: 6, fontWeight: 700 }}>
                <span>Total Paid:</span>
                <span>KES {totalPaid.toFixed(2)}</span>
              </div>
              
              {receipt.status !== "PAID" && (
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginTop: 6, fontWeight: 800, color: "#b00020" }}>
                  <span>Balance Due:</span>
                  <span>KES {(Number(receipt.total) - totalPaid).toFixed(2)}</span>
                </div>
              )}
            </div>

            <div style={{ borderTop: "1px solid #000", margin: "6px 0" }} />

            {/* SIGNATURES FOR PARTIAL/CREDIT SALES */}
            {showCustomer && (
              <div className="signature-line" style={{ marginTop: 10 }}>
                <div style={{ fontWeight: 800, fontSize: "12px", textAlign: "center", marginBottom: 12 }}>
                  AGREEMENT
                </div>
                <div style={{ fontSize: "10px", marginBottom: 15, textAlign: "center" }}>
                  I hereby acknowledge receipt of goods and agree<br />
                  to pay the balance as stated above.
                </div>
                
                {/* Customer Signature */}
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: "11px", marginBottom: 4 }}>Customer Signature: _______________________</div>
                  <div style={{ fontSize: "11px", marginTop: 2 }}>Date: _________________</div>
                </div>
                
                {/* Manager Signature */}
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: "11px", marginBottom: 4 }}>Manager Signature: _______________________</div>
                  <div style={{ fontSize: "11px", marginTop: 2 }}>Date: _________________</div>
                </div>
                
                <div style={{ fontSize: "9px", textAlign: "center", marginTop: 10, color: "#666" }}>
                  This is a legally binding agreement
                </div>
                <div style={{ borderTop: "1px solid #000", margin: "10px 0" }} />
              </div>
            )}

            {/* FOOTER */}
            <div style={{ textAlign: "center", marginTop: 10 }}>
              <div style={{ fontSize: "12px", fontWeight: 800, marginBottom: 6 }}>
                THANK YOU FOR SHOPPING WITH US
              </div>
              {receipt.status === "PARTIAL" && (
                <div style={{ fontSize: "10px", color: "#666", marginTop: 6 }}>
                  Goods issued on partial payment.<br />
                  <strong>Please settle balance within 30 days.</strong>
                </div>
              )}
              {receipt.status === "CREDIT" && (
                <div style={{ fontSize: "10px", color: "#666", marginTop: 6 }}>
                  Goods issued on credit.<br />
                  <strong>Payment due within 30 days.</strong>
                </div>
              )}
            </div>
          </div>

          {/* ACTIONS (STICKY, NO PRINT) */}
          <div
            className="no-print"
            style={{
              display: "flex",
              gap: 12,
              padding: "12px",
              borderTop: "1px solid #e2e8f0",
              background: "#ffffff",
            }}
          >
            <button
              className="btn btn-primary"
              style={{ flex: 1, fontSize: "14px", padding: "10px" }}
              onClick={() => window.print()}
            >
              🖨️ Print Receipt
            </button>

            <button
              className="btn btn-danger"
              style={{ flex: 1, fontSize: "14px", padding: "10px" }}
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
            <table className="table" style={{ minWidth: 700 }}>
              <thead>
                <tr>
                  <th>Receipt #</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Total</th>
                  <th>Paid</th>
                  <th>Balance</th>
                  <th>Amount Given</th>
                  <th>Change</th>
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
                  
                  // Get amount given and change from receipt
                  const amountGiven = r.amount_given || totalPaid;
                  const changeGiven = r.change_given || 0;
                  
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
                      <td style={{ color: r.balance_due > 0 ? "#b00020" : "#137333", fontWeight: 600 }}>
                        KES {Number(r.balance_due).toFixed(2)}
                      </td>
                      <td>KES {Number(amountGiven).toFixed(2)}</td>
                      <td style={{ color: changeGiven > 0 ? "#0284c7" : "#666" }}>
                        {changeGiven > 0 ? `KES ${Number(changeGiven).toFixed(2)}` : "-"}
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