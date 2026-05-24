import React, { useEffect, useMemo, useState } from "react";
import AppLayout from "../components/AppLayout";
import { api } from "../api/client";
import { useAuth } from "../auth/AuthContext";

/* =====================================================
   RECEIPT MODAL - UPDATED TO SHOW UNIT INFO
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
              {/* <div style={{ fontWeight: 900, fontSize: 18 }}>
                {receipt.branch_name}
              </div> */}
              <div className="muted">SALES RECEIPT</div>
            </div>

            <div className="muted">
              Receipt #: <b>{receipt.id}</b><br />
              Date: <b>{new Date(receipt.created_at).toLocaleString()}</b><br />
              Cashier: <b>{receipt.cashier_username}</b><br />
              Branch:<b>{receipt.branch_name}</b>
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

            {/* ITEMS - UPDATED TO SHOW UNIT */}
            <table className="table" style={{ fontSize: 13 }}>
              <thead>
                <tr>
                  <th>Item</th>
                  <th style={{ textAlign: "right" }}>Qty </th>
                  <th style={{ textAlign: "right" }}>Unit </th>
                  <th style={{ textAlign: "right" }}>Unit Price</th>
                  <th style={{ textAlign: "right" }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {(receipt.items || []).map((i) => (
                  <tr key={i.id}>
                    <td>
                      {i.product_name}
                    </td>
                    <td style={{ textAlign: "right" }}>
                      {i.quantity} 
                    </td>
                    <td style={{ textAlign: "right" }}>
                       {i.unit}
                    </td>
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
              <div style={{ fontWeight: 900 }}>Payments</div>

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
              <div style={{ fontWeight: 900 }}>
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