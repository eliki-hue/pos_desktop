import React, { useEffect, useMemo, useState } from "react";
import AppLayout from "../components/AppLayout";
import { api } from "../api/client";
import { useAuth } from "../auth/AuthContext";

/* =====================================================
   RECEIPT MODAL (UNCHANGED – YOUR STYLE)
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
          {/* SCROLLABLE CONTENT */}
          <div style={{ overflowY: "auto", paddingRight: 4 }}>
            {/* HEADER */}
            <div style={{ textAlign: "center", marginBottom: 12 }}>
              <div style={{ fontWeight: 900, fontSize: 18 }}>
                {receipt.branch_name}
              </div>
              <div className="muted">OFFICIAL RECEIPT</div>
            </div>

            <div className="muted">
              Receipt #: <b>{receipt.id}</b><br />
              Date: <b>{new Date(receipt.created_at).toLocaleString()}</b><br />
              Cashier: <b>{receipt.cashier_username}</b>
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

            {/* ITEMS */}
            <table className="table" style={{ fontSize: 13 }}>
              <thead>
                <tr>
                  <th>Item</th>
                  <th style={{ textAlign: "right" }}>Qty</th>
                  <th style={{ textAlign: "right" }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {(receipt.items || []).map((i) => (
                  <tr key={i.id}>
                    <td>
                      {i.product_name}
                      <div className="muted">
                        {i.quantity} × {i.unit_price}
                      </div>
                    </td>
                    <td style={{ textAlign: "right" }}>{i.quantity}</td>
                    <td style={{ textAlign: "right" }}>
                      KES {i.subtotal}
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
                <b>KES {receipt.subtotal}</b>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Discount</span>
                <b>KES {receipt.discount}</b>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Tax</span>
                <b>KES {receipt.tax}</b>
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
                <span>KES {receipt.total}</span>
              </div>
            </div>

            <hr />

            {/* PAYMENTS */}
            <div>
              <div style={{ fontWeight: 900 }}>Payments</div>

              {cashPaid > 0 && (
                <div className="muted">Cash: KES {cashPaid}</div>
              )}
              {mpesaPaid > 0 && (
                <div className="muted">MPESA: KES {mpesaPaid}</div>
              )}

              <div className="muted">
                Paid: KES {totalPaid}
              </div>

              {receipt.status !== "PAID" && (
                <div className="muted">
                  Balance Due: KES {receipt.total - totalPaid}
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
   CHECKOUT MODAL (YOUR PAYMENT SECTION, MOVED INTO MODAL)
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
                <div key={idx} style={{ display: "flex", gap: 8 }}>
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
                    placeholder="Amount"
                    value={p.amount}
                    onChange={(e) => {
                      const copy = [...payments];
                      copy[idx].amount = e.target.value;
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
                Paid: KES {totalPaid.toFixed(2)} <br />
                Balance: KES {balanceDue.toFixed(2)}
              </div>
            </div>
          )}

          {msg && <div style={{ marginTop: 10 }}>{msg}</div>}

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
   CART PAGE
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
    } catch {
      setMsg("❌ Failed to load cart");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && isAuthenticated) loadCart();
  }, [authLoading, isAuthenticated]);

  const items = cart?.items || [];

  const subtotal = useMemo(
    () =>
      items.reduce(
        (sum, i) => sum + Number(i.subtotal),
        0
      ),
    [items]
  );

  // 🔹 auto-fill CASH = total for FULL
  useEffect(() => {
    if (paymentMode === "FULL") {
      setPayments([{ method: "CASH", amount: subtotal.toFixed(2) }]);
    }
  }, [paymentMode, subtotal]);

  const totalPaid = useMemo(
    () =>
      payments.reduce((sum, p) => sum + Number(p.amount || 0), 0),
    [payments]
  );

  const balanceDue = subtotal - totalPaid;

  const updateQty = async (productId, quantity, unit) => {
    await api.patch("/api/cart/pos/cart/update_item/", {
      product: productId,
      quantity: Math.max(1, Number(quantity)),
      unit,
    });
    await loadCart();
  };

  const removeItem = async (productId, unit) => {
  await api.post("/api/cart/pos/cart/remove/", {
    product: productId,
    unit,
  });
    await loadCart();
  };

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
                  <th>Qty</th>
                  <th>Price</th>
                  <th>Total</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {items.map((i) => (
                  <tr key={i.id}>
                    <td>
                      {i.product_name}

                      
                    </td>
                    <td style={{ width: 100 }}>
                      <input
                        className="input"
                        type="number"
                        min="1"
                        value={i.quantity}
                        onChange={(e) =>
                          updateQty(i.product, e.target.value, i.unit)
                        }
                      />
                      <span className="muted">
                        {i.unit}
                      </span>
                    </td>
                    <td>KES {Number(i.display_unit_price).toFixed(0)}</td>
                    <td>KES KES {Number(i.subtotal).toFixed(0)}</td>
                    <td>
                      <button
                        className="btn btn-danger"
                        onClick={() => removeItem(i.product, i.unit)}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            className="btn btn-primary"
            style={{ marginTop: 16 }}
            onClick={() => setCheckoutOpen(true)}
          >
            Checkout
          </button>
        </>
      )}
    </AppLayout>
  );
}
