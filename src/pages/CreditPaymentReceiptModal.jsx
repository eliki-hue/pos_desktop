import React from 'react';
import { X, Printer, Receipt } from 'lucide-react';

function CreditPaymentReceiptModal({ receipt, onClose }) {
  if (!receipt) return null;

  const payments = receipt.payments || [];

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
            
            .print-area hr {
              border-top: 1px solid #000;
              margin: 4px 0;
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
              <div style={{ fontSize: 11 }}>
                Tel:{" "}
                {[
                  receipt.branch_phone,
                  receipt.branch_phone_2,
                  receipt.branch_phone_3,
                ]
                  .filter(Boolean)
                  .join(" / ")}
              </div>
              <div style={{ fontSize: 11 }}>
                {receipt.branch_paybill && (
                  <>
                    <strong>Paybill:</strong> {receipt.branch_paybill}
                  </>
                )}
                {receipt.branch_paybill && receipt.branch_account_number && " | "}
                {receipt.branch_account_number && (
                  <>
                    <strong>Account:</strong> {receipt.branch_account_number}
                  </>
                )}
              </div>
              <div style={{ fontSize: "12px", marginTop: 6, fontWeight: 500 }}>
                {new Date(receipt.created_at).toLocaleString()}
              </div>
              <div style={{ fontSize: "12px", fontWeight: 800, marginTop: 4 }}>
                Payment Receipt: #{receipt.receipt_number || receipt.id}
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
            <div style={{ fontWeight: 800, fontSize: "12px", marginTop: 6, marginBottom: 4 }}>CUSTOMER DETAILS</div>
            <div style={{ fontSize: "11px" }}>
              <strong>Name:</strong> {receipt.customer_name}<br />
              <strong>Phone:</strong> {receipt.customer_phone}<br />
              <strong>ID Number:</strong> {receipt.customer_id_number}
            </div>
            <div style={{ borderTop: "1px solid #000", margin: "6px 0" }} />

            {/* SALE INFO */}
            <div style={{ fontWeight: 800, fontSize: "12px", marginBottom: 4 }}>SALE DETAILS</div>
            <div style={{ fontSize: "11px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                <span>Original Sale:</span>
                <span><strong>#{receipt.sale_id}</strong></span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                <span>Sale Date:</span>
                <span>{new Date(receipt.sale_date).toLocaleDateString()}</span>
              </div>
            </div>
            <div style={{ borderTop: "1px solid #000", margin: "6px 0" }} />

            {/* PAYMENT SUMMARY */}
            <div style={{ fontWeight: 800, fontSize: "12px", marginBottom: 4 }}>PAYMENT SUMMARY</div>
            <div style={{ fontSize: "11px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                <span>Original Total:</span>
                <span>KES {Number(receipt.original_total || 0).toFixed(2)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                <span>Paid Before Today:</span>
                <span>KES {Number(receipt.paid_before || 0).toFixed(2)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2, fontWeight: 700 }}>
                <span>Payment Today:</span>
                <span>KES {Number(receipt.payment_amount || 0).toFixed(2)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                <span>Total Paid:</span>
                <span>KES {Number(receipt.paid_after || 0).toFixed(2)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2, fontWeight: 700, color: "#b00020" }}>
                <span>Outstanding Balance:</span>
                <span>KES {Number(receipt.balance || 0).toFixed(2)}</span>
              </div>
            </div>
            <div style={{ borderTop: "1px solid #000", margin: "6px 0" }} />

            {/* PAYMENT METHODS */}
            <div style={{ fontWeight: 800, fontSize: "12px", marginBottom: 4 }}>PAYMENT METHODS</div>
            {payments.map((p, index) => (
              <div key={index} style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", marginBottom: 2 }}>
                <span>{p.method}</span>
                <span>KES {Number(p.amount).toFixed(2)}</span>
              </div>
            ))}
            <div style={{ borderTop: "1px solid #000", margin: "6px 0" }} />

            {/* STATUS */}
            <div style={{ textAlign: "center", marginTop: 8, marginBottom: 8 }}>
              <div
                style={{
                  display: "inline-block",
                  padding: "4px 16px",
                  borderRadius: 20,
                  fontSize: "12px",
                  fontWeight: 700,
                  ...(receipt.status === 'PAID' 
                    ? { background: '#e6f4ea', color: '#137333' } 
                    : { background: '#fff4e5', color: '#a15c00' }
                  ),
                }}
              >
                {receipt.status === 'PAID' ? 'PAID IN FULL' : 'PARTIALLY PAID'}
              </div>
            </div>

            {/* DIVIDER */}
            <div style={{ borderTop: "1px solid #000", margin: "6px 0" }} />

            {/* AGREEMENT FOR PARTIAL/CREDIT */}
            {(receipt.status === 'PARTIAL' || receipt.status === 'CREDIT' || receipt.balance > 0) && (
              <div style={{ marginTop: 10 }}>
                <div style={{ fontWeight: 800, fontSize: "12px", textAlign: "center", marginBottom: 12 }}>
                  AGREEMENT
                </div>
                <div style={{ fontSize: "10px", marginBottom: 15, textAlign: "center" }}>
                  I hereby acknowledge receipt of this payment and agree<br />
                  to pay the remaining balance as stated above.
                </div>
                
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: "11px", marginBottom: 4 }}>Customer Signature: _______________________</div>
                  <div style={{ fontSize: "11px", marginTop: 2 }}>Date: _________________</div>
                </div>
                
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
                THANK YOU
              </div>
              <div style={{ fontSize: "10px", color: "#666" }}>
                This receipt acknowledges payment towards the outstanding balance of Sale #{receipt.sale_id}.
              </div>
              {receipt.balance > 0 && (
                <div style={{ fontSize: "10px", color: "#666", marginTop: 6 }}>
                  <strong>Please settle remaining balance within 30 days.</strong>
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

export default CreditPaymentReceiptModal;