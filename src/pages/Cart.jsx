import React from "react";
import { useEffect, useMemo, useState } from "react";
import AppLayout from "../components/AppLayout";
import { api } from "../api/client";
import { useAuth } from "../auth/AuthContext";

/**
 * Simple receipt modal (print-ready)
 */
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
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 10,
            alignItems: "center",
          }}
        >
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
          Date:{" "}
          <b>{new Date(receipt.created_at).toLocaleString()}</b>
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

export default function Cart() {
  const { loading: authLoading, isAuthenticated } = useAuth();

  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [checkingOut, setCheckingOut] = useState(false);

  // ✅ receipt state
  const [receipt, setReceipt] = useState(null);

  const loadCart = async () => {
    setLoading(true);
    setMsg("");
    try {
      const res = await api.get("/api/cart/pos/cart/");
      setCart(res.data);
    } catch (err) {
      setCart(null);
      setMsg(err?.response?.data?.detail || "❌ Failed to load cart");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) return;
    loadCart();
  }, [authLoading, isAuthenticated]);

  const items = cart?.items || [];

  const subtotal = useMemo(() => {
    return items.reduce(
      (sum, i) => sum + Number(i.unit_price || 0) * Number(i.quantity || 0),
      0
    );
  }, [items]);

  const updateItem = async (productId, quantity) => {
    setMsg("");
    try {
      await api.patch("/api/cart/pos/cart/update_item/", {
        product: productId,
        quantity: Math.max(1, Number(quantity || 1)),
      });
      await loadCart();
    } catch (err) {
      setMsg(err?.response?.data?.detail || "❌ Failed to update item");
    }
  };

  const removeItem = async (productId) => {
    setMsg("");
    try {
      await api.post("/api/cart/pos/cart/remove/", { product: productId });
      await loadCart();
    } catch (err) {
      setMsg(err?.response?.data?.detail || "❌ Failed to remove item");
    }
  };

  const checkout = async () => {
    setMsg("");
    setCheckingOut(true);

    try {
      const res = await api.post("/api/cart/pos/checkout/", {});

      // ✅ show receipt if backend returns it
      const backendReceipt = res?.data?.receipt;
      if (backendReceipt) {
        setReceipt(backendReceipt);
      }

      setMsg("✅ Checkout successful. Receipt generated.");
      await loadCart(); // should now show empty cart after checkout
    } catch (err) {
      setMsg(err?.response?.data?.detail || "❌ Checkout failed");
    } finally {
      setCheckingOut(false);
    }
  };

  return (
    <AppLayout title="Cart" subtitle="Review items and checkout">
      {/* ✅ Receipt popup */}
      <ReceiptModal receipt={receipt} onClose={() => setReceipt(null)} />

      {authLoading ? (
        <div className="muted">Restoring session...</div>
      ) : !isAuthenticated ? (
        <div className="muted">Please login to view your cart.</div>
      ) : loading ? (
        <div className="muted">Loading cart...</div>
      ) : (
        <>
          <div className="card">
            <div style={{ fontWeight: 900 }}>Cart Items</div>
            <div className="muted">Total items: {items.length}</div>

            {msg && (
              <div style={{ marginTop: 10, fontWeight: 800 }}>{msg}</div>
            )}
          </div>

          <div style={{ marginTop: 16 }} className="card">
            {items.length === 0 ? (
              <div className="muted">No items in cart.</div>
            ) : (
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
                      <td>{i.product_name || i.product}</td>

                      <td style={{ width: 120 }}>
                        <input
                          className="input"
                          type="number"
                          min="1"
                          value={i.quantity}
                          onChange={(e) =>
                            updateItem(i.product, Number(e.target.value))
                          }
                        />
                      </td>

                      <td>KES {i.unit_price}</td>

                      <td>
                        KES{" "}
                        {(Number(i.unit_price) * Number(i.quantity)).toFixed(2)}
                      </td>

                      <td style={{ width: 120 }}>
                        <button
                          className="btn btn-danger"
                          onClick={() => removeItem(i.product)}
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            <div
              style={{
                marginTop: 14,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 10,
              }}
            >
              <div style={{ fontWeight: 900 }}>
                Subtotal: KES {subtotal.toFixed(2)}
              </div>

              <button
                className="btn btn-primary"
                disabled={items.length === 0 || checkingOut}
                onClick={checkout}
              >
                {checkingOut ? "Processing..." : "Checkout"}
              </button>
            </div>
          </div>
        </>
      )}
    </AppLayout>
  );
}
