
import React from "react";
import { useEffect, useMemo, useState } from "react";
import AppLayout from "../components/AppLayout";
import { api } from "../api/client";

export default function Cart() {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const loadCart = async () => {
    setLoading(true);
    try {
      // Adjust if your POS cart endpoint differs
      const res = await api.get("/cart/");
      setCart(res.data);
    } catch {
      setCart(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCart();
  }, []);

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
      await api.patch("/cart/update_item/", {
        product: productId,
        quantity,
      });
      await loadCart();
    } catch (err) {
      setMsg(err?.response?.data?.detail || "❌ Failed to update item");
    }
  };

  const removeItem = async (productId) => {
    setMsg("");
    try {
      await api.post("/cart/remove/", { product: productId });
      await loadCart();
    } catch (err) {
      setMsg(err?.response?.data?.detail || "❌ Failed to remove item");
    }
  };

  const checkout = async () => {
    setMsg("");
    try {
      await api.post("/checkout/", {});
      setMsg("✅ Checkout completed successfully");
      await loadCart();
    } catch (err) {
      setMsg(err?.response?.data?.detail || "❌ Checkout failed");
    }
  };

  return (
    <AppLayout title="Cart" subtitle="Review items and checkout">
      {loading ? (
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
                disabled={items.length === 0}
                onClick={checkout}
              >
                Checkout
              </button>
            </div>
          </div>
        </>
      )}
    </AppLayout>
  );
}
