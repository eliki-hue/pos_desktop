import React, { useEffect, useMemo, useState } from "react";
import AppLayout from "../components/AppLayout";
import { api } from "../api/client";
import { useAuth } from "../auth/AuthContext";

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
              font-family: 'Courier New', monospace;
              font-size: 10pt;
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
              font-size: 9pt;
            }
            
            .print-area th, .print-area td {
              padding: 2px 0;
            }
            
            /* Signature lines for printing */
            .signature-line {
              margin-top: 20px;
              margin-bottom: 10px;
            }
            
            .signature-line .line {
              border-top: 1px dotted #000;
              width: 100%;
              margin-top: 5px;
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
            fontFamily: "'Courier New', 'Monaco', monospace",
            fontSize: "11px",
          }}
        >
          {/* RECEIPT-SCROLLABLE CONTENT */}
          <div style={{ overflowY: "auto", padding: "12px" }}>
            {/* HEADER */}
            <div style={{ textAlign: "center", marginBottom: 12 }}>
              <div style={{ fontWeight: 900, fontSize: 14, textTransform: "uppercase" }}>
                Premium Farming Feeds
              </div>
              <div style={{ fontSize: 9 }}>
                Turitu, Ikinu & Githiga - Kiambu
              </div>
              <div style={{ fontSize: 9 }}>
                P.O Box 1257-00900, Kiambu
              </div>
              <div style={{ fontSize: 9 }}>
                Tel: 0741550549 / 0708488688 / 0711633900
              </div>
              <div style={{ fontSize: 9 }}>
                Paybill: 400200 | Acc: 4003901
              </div>
              <div style={{ fontSize: 9, marginTop: 4 }}>
                {new Date(receipt.created_at).toLocaleString()}
              </div>
              <div style={{ fontSize: 9 }}>
                Receipt: #{receipt.id}
              </div>
            </div>

            <div style={{ fontSize: 9, marginBottom: 8 }}>
              Cashier: {receipt.cashier_username}
              <br />
              Branch: {receipt.branch_name}
            </div>

            {/* Divider */}
            <div style={{ borderTop: "1px dashed #000", margin: "4px 0" }} />

            {/* CUSTOMER */}
            {showCustomer && (
              <>
                <div style={{ fontWeight: 700, fontSize: 10, marginTop: 4 }}>CUSTOMER DETAILS</div>
                <div style={{ fontSize: 9 }}>
                  Name: {receipt.customer_name}<br />
                  Phone: {receipt.customer_phone}<br />
                  ID Number: {receipt.customer_id_number}
                </div>
                <div style={{ borderTop: "1px dashed #000", margin: "4px 0" }} />
              </>
            )}

            {/* ITEMS HEADER */}
            <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: 9, marginTop: 4 }}>
              <div style={{ flex: 3 }}>ITEM</div>
              <div style={{ flex: 1, textAlign: "right" }}>QTY</div>
              <div style={{ flex: 1, textAlign: "right" }}>PRICE</div>
              <div style={{ flex: 1, textAlign: "right" }}>TOTAL</div>
            </div>

            <div style={{ borderTop: "1px dotted #000", margin: "2px 0" }} />

            {/* ITEMS LIST */}
            {(receipt.items || []).map((i, idx) => (
              <div key={idx} style={{ marginBottom: 6 }}>
                <div style={{ fontSize: 9, fontWeight: 500 }}>{i.product_name}</div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9 }}>
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
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9 }}>
                <span>Subtotal:</span>
                <span>KES {Number(receipt.subtotal).toFixed(2)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9 }}>
                <span>Discount:</span>
                <span>KES {Number(receipt.discount).toFixed(2)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9 }}>
                <span>Tax:</span>
                <span>KES {Number(receipt.tax).toFixed(2)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: 11, marginTop: 4 }}>
                <span>TOTAL:</span>
                <span>KES {Number(receipt.total).toFixed(2)}</span>
              </div>
            </div>

            <div style={{ borderTop: "1px dashed #000", margin: "4px 0" }} />

            {/* PAYMENTS */}
            <div style={{ marginTop: 4 }}>
              <div style={{ fontWeight: 700, fontSize: 10 }}>PAYMENTS</div>
              {cashPaid > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9 }}>
                  <span>Cash:</span>
                  <span>KES {cashPaid.toFixed(2)}</span>
                </div>
              )}
              {mpesaPaid > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9 }}>
                  <span>MPESA:</span>
                  <span>KES {mpesaPaid.toFixed(2)}</span>
                </div>
              )}
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, marginTop: 2 }}>
                <span>Total Paid:</span>
                <span>KES {totalPaid.toFixed(2)}</span>
              </div>
              {receipt.status !== "PAID" && (
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, fontWeight: 700, marginTop: 2 }}>
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
                <div style={{ fontSize: 8, marginBottom: 16 }}>
                  I hereby acknowledge receipt of goods and agree to pay the balance as stated above.
                </div>
                
                {/* Customer Signature */}
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 8, marginBottom: 4 }}>Customer Signature: _______________________</div>
                  <div style={{ fontSize: 8, marginTop: 2 }}>Date: _________________</div>
                </div>
                
                {/* Manager Signature */}
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 8, marginBottom: 4 }}>Manager Signature: _______________________</div>
                  <div style={{ fontSize: 8, marginTop: 2 }}>Date: _________________</div>
                </div>
                
                <div style={{ fontSize: 7, textAlign: "center", marginTop: 8, color: "#666" }}>
                  This is a legally binding agreement
                </div>
                <div style={{ borderTop: "1px dashed #000", margin: "8px 0" }} />
              </div>
            )}

            {/* FOOTER */}
            <div style={{ textAlign: "center", marginTop: 8 }}>
              <div style={{ fontSize: 9, fontWeight: 700 }}>
                THANK YOU FOR SHOPPING WITH US
              </div>
              {receipt.status === "PARTIAL" && (
                <div style={{ fontSize: 8, color: "#666", marginTop: 4 }}>
                  Goods issued on partial payment.<br />
                  Please settle balance within 30 days.
                </div>
              )}
              {receipt.status === "CREDIT" && (
                <div style={{ fontSize: 8, color: "#666", marginTop: 4 }}>
                  Goods issued on credit.<br />
                  Payment due within 30 days.
                </div>
              )}
              {/* <div style={{ fontSize: 8, marginTop: 6 }}>
                Returns accepted within 7 days with valid receipt
              </div> */}
              <div style={{ fontSize: 7, marginTop: 6 }}>
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
   CHECKOUT MODAL (UPDATED - NO PRICE CALCULATIONS)
===================================================== */
function CheckoutModal({
  open,
  onClose,
  cart,
  subtotal,
  paymentMode,
  setPaymentMode,
  customer,
  setCustomer,
  payments,
  setPayments,
  totalPaid,
  balanceDue,
  onConfirm,
  checkingOut,
  msg,
}) {
  if (!open) return null;

  // 🔒 validation (used to disable Confirm)
  const isValid = useMemo(() => {
    if (paymentMode === "FULL") {
      return totalPaid === subtotal && subtotal > 0;
    }

    if (paymentMode === "PARTIAL") {
      return (
        totalPaid > 0 &&
        totalPaid < subtotal &&
        customer.name &&
        customer.phone &&
        customer.id_number
      );
    }

    if (paymentMode === "CREDIT") {
      return customer.name && customer.phone && customer.id_number;
    }

    return false;
  }, [paymentMode, totalPaid, subtotal, customer]);

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
          maxWidth: 600,
          maxHeight: "90vh",
          overflow: "auto",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <div style={{ fontWeight: 900 }}>Checkout</div>
          <button className="btn btn-danger" onClick={onClose}>
            Close
          </button>
        </div>

        {/* PAYMENT MODE */}
        <div style={{ marginTop: 16 }}>
          <div style={{ fontWeight: 900 }}>Payment Mode</div>

          {["FULL", "PARTIAL", "CREDIT"].map((m) => (
            <label key={m} style={{ marginRight: 16 }}>
              <input
                type="radio"
                checked={paymentMode === m}
                onChange={() => setPaymentMode(m)}
              />{" "}
              {m}
            </label>
          ))}

          {(paymentMode === "PARTIAL" || paymentMode === "CREDIT") && (
            <div style={{ marginTop: 12 }}>
              <input
                className="input"
                placeholder="Customer Name"
                value={customer.name}
                onChange={(e) =>
                  setCustomer({ ...customer, name: e.target.value })
                }
              />
              <input
                className="input"
                placeholder="Phone"
                value={customer.phone}
                onChange={(e) =>
                  setCustomer({ ...customer, phone: e.target.value })
                }
              />
              <input
                className="input"
                placeholder="ID Number"
                value={customer.id_number}
                onChange={(e) =>
                  setCustomer({ ...customer, id_number: e.target.value })
                }
              />
            </div>
          )}

          {paymentMode !== "CREDIT" && (
            <div style={{ marginTop: 12 }}>
              {payments.map((p, idx) => (
                <div key={idx} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                  <select
                    className="input"
                    value={p.method}
                    onChange={(e) => {
                      const copy = [...payments];
                      copy[idx].method = e.target.value;
                      setPayments(copy);
                    }}
                  >
                    <option value="CASH">Cash</option>
                    <option value="MPESA">MPESA</option>
                  </select>

                  <input
                    className="input"
                    type="number"
                    step="0.01"
                    placeholder="Amount"
                    value={p.amount}
                    onChange={(e) => {
                      const copy = [...payments];
                      copy[idx].amount = parseFloat(e.target.value) || "";
                      setPayments(copy);
                    }}
                  />
                </div>
              ))}

              <button
                className="btn"
                style={{ marginTop: 8 }}
                onClick={() =>
                  setPayments([...payments, { method: "CASH", amount: "" }])
                }
              >
                + Add Payment
              </button>

              <div className="muted" style={{ marginTop: 8 }}>
                Subtotal: KES {subtotal.toFixed(2)} <br />
                Paid: KES {totalPaid.toFixed(2)} <br />
                Balance: KES {balanceDue.toFixed(2)}
              </div>
            </div>
          )}

          {msg && <div style={{ marginTop: 10, color: "red" }}>{msg}</div>}

          <button
            className="btn btn-primary"
            style={{ marginTop: 16, width: "100%" }}
            disabled={!isValid || checkingOut}
            onClick={onConfirm}
          >
            {checkingOut ? "Processing..." : "Confirm Checkout"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* =====================================================
   CART PAGE - UPDATED FOR UNIT-AWARE PRICING
===================================================== */
export default function Cart() {
  const { loading: authLoading, isAuthenticated } = useAuth();

  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [checkingOut, setCheckingOut] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  const [paymentMode, setPaymentMode] = useState("FULL");
  const [customer, setCustomer] = useState({
    name: "",
    phone: "",
    id_number: "",
  });

  const [payments, setPayments] = useState([
    { method: "CASH", amount: "" },
  ]);

  const loadCart = async () => {
    setLoading(true);
    setMsg("");
    try {
      const res = await api.get("/api/cart/pos/cart/");
      setCart(res.data);
    } catch (err) {
      console.error(err);
      setMsg("❌ Failed to load cart");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && isAuthenticated) loadCart();
  }, [authLoading, isAuthenticated]);

  const items = cart?.items || [];

  // USE BACKEND SUBTOTAL - NO FRONTEND CALCULATIONS
  const subtotal = useMemo(() => {
    return items.reduce((sum, i) => sum + Number(i.subtotal), 0);
  }, [items]);

  // AUTO-FILL CASH = total for FULL payment mode
  useEffect(() => {
    if (paymentMode === "FULL" && subtotal > 0) {
      setPayments([{ method: "CASH", amount: subtotal.toFixed(2) }]);
    }
  }, [paymentMode, subtotal]);

  const totalPaid = useMemo(() => {
    return payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  }, [payments]);

  const balanceDue = subtotal - totalPaid;

  // UPDATE QUANTITY - Pass unit to backend
  const updateQty = async (productId, quantity, unit) => {
    try {
      await api.patch("/api/cart/pos/cart/update_item/", {
        product: productId,
        quantity: Math.max(1, Number(quantity)),
        unit: unit, // IMPORTANT: Include unit
      });
      await loadCart(); // Reload to get updated backend calculations
    } catch (err) {
      console.error(err);
      setMsg("❌ Failed to update quantity");
    }
  };

  // REMOVE ITEM - Pass unit to backend
  const removeItem = async (productId, unit) => {
    try {
      await api.post("/api/cart/pos/cart/remove/", {
        product: productId,
        unit: unit, // IMPORTANT: Include unit
      });
      await loadCart();
    } catch (err) {
      console.error(err);
      setMsg("❌ Failed to remove item");
    }
  };

  // CONFIRM CHECKOUT - Send payments as-is, backend handles totals
  const confirmCheckout = async () => {
    setCheckingOut(true);
    setMsg("");

    try {
      const payload = {
        cart_id: cart.id,
        payment_mode: paymentMode,
      };

      if (paymentMode !== "CREDIT") {
        payload.payments = payments.map((p) => ({
          method: p.method,
          amount: Number(p.amount),
        }));
      }

      if (paymentMode !== "FULL") {
        payload.customer = customer;
      }

      const res = await api.post("/api/cart/pos/checkout/", payload);

      setReceipt(res.data.receipt);
      setCheckoutOpen(false);
      await loadCart();
    } catch (err) {
      console.error(err);
      setMsg(err?.response?.data?.detail || "❌ Checkout failed");
    } finally {
      setCheckingOut(false);
    }
  };

  return (
    <AppLayout title="Cart" subtitle="Review items and checkout">
      <ReceiptModal receipt={receipt} onClose={() => setReceipt(null)} />

      <CheckoutModal
        open={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        cart={cart}
        subtotal={subtotal}
        paymentMode={paymentMode}
        setPaymentMode={setPaymentMode}
        customer={customer}
        setCustomer={setCustomer}
        payments={payments}
        setPayments={setPayments}
        totalPaid={totalPaid}
        balanceDue={balanceDue}
        onConfirm={confirmCheckout}
        checkingOut={checkingOut}
        msg={msg}
      />

      {loading ? (
        <div className="muted">Loading cart...</div>
      ) : items.length === 0 ? (
        <div className="muted">No items in cart.</div>
      ) : (
        <>
          <div className="card">
            <table className="table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Quantity</th>
                  <th>Unit</th>
                  <th>Unit Price</th>
                  <th>Subtotal</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {items.map((i) => (
                  <tr key={i.id}>
                    <td>
                      {i.product_name}
                      <div className="muted" style={{ fontSize: 12 }}>
                        SKU: {i.sku}
                      </div>
                    </td>
                    <td style={{ width: 120 }}>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={Number(i.quantity)}
                        onChange={(e) =>
                          updateQty(i.product, e.target.value, i.unit)
                        }
                        style={{
                          width: "80px",
                          padding: "6px 10px",
                          border: "1px solid #d1d5db",
                          borderRadius: "10px",
                          outline: "none",
                        }}
                      />
                    </td>
                    <td>
                      <span className="badge" style={{ 
                        background: i.unit === "BAG" ? "#e6f7ff" : "#f6ffed",
                        padding: "4px 8px",
                        borderRadius: "6px",
                        fontSize: 12,
                        fontWeight: 500
                      }}>
                        {i.unit}
                      </span>
                    </td>
                    <td>
                      KES {Number(i.unit_price).toFixed(2)}/{i.unit}
                    </td>
                    <td>
                      <strong>KES {Number(i.subtotal).toFixed(2)}</strong>
                    </td>
                    <td>
                      <button
                        className="btn btn-danger"
                        size="sm"
                        onClick={() => removeItem(i.product, i.unit)}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan="4" style={{ textAlign: "right" }}>
                    <strong>Cart Total:</strong>
                  </td>
                  <td colSpan="2">
                    <strong style={{ fontSize: 18 }}>
                      KES {subtotal.toFixed(2)}
                    </strong>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div style={{ marginTop: 16, display: "flex", gap: 12 }}>
            <button
              className="btn btn-primary"
              onClick={() => setCheckoutOpen(true)}
            >
              Proceed to Checkout
            </button>
            
            <button
              className="btn muted"
              onClick={loadCart}
              disabled={loading}
            >
              Refresh Cart
            </button>
          </div>
        </>
      )}
    </AppLayout>
  );
}