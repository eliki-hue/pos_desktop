import React from "react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "../components/AppLayout";
import { api } from "../api/client";

export default function Products() {
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [addingId, setAddingId] = useState(null);

  const loadProducts = async () => {
    setLoading(true);
    setMsg("");
    try {
      const res = await api.get("/api/products/");
      setProducts(res.data || []);
    } catch (err) {
      setProducts([]);
      setMsg(err?.response?.data?.detail || "❌ Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return products;

    return products.filter((p) =>
      String(p.name || "").toLowerCase().includes(query)
    );
  }, [products, q]);

  const addToCart = async (productId) => {
    setMsg("");
    setAddingId(productId);

    try {
      await api.post("/api/cart/pos/cart/add/", {
        product: productId,
        quantity: 1,
      });

      setMsg("✅ Added to cart");
    } catch (err) {
      setMsg(err?.response?.data?.detail || "❌ Failed to add to cart");
    } finally {
      setAddingId(null);
    }
  };

  return (
    <AppLayout title="Products" subtitle="Search products and add to cart">
      <div className="card">
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <input
            className="input"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search product name or scan barcode..."
            style={{ flex: 1 }}
          />

          <button className="btn btn-primary" onClick={() => navigate("/cart")}>
            Go to Cart
          </button>
        </div>

        {msg && <div style={{ marginTop: 10, fontWeight: 800 }}>{msg}</div>}
      </div>

      <div style={{ marginTop: 16 }}>
        {loading ? (
          <div className="muted">Loading products...</div>
        ) : filtered.length === 0 ? (
          <div className="muted">No products found.</div>
        ) : (
          <div className="grid grid-4">
            {filtered.map((p) => (
              <div className="card" key={p.id}>
                <div style={{ fontWeight: 900 }}>{p.name}</div>

                <div className="muted" style={{ marginTop: 4 }}>
                  ID: {p.id}
                </div>

                <div style={{ marginTop: 8, fontWeight: 900 }}>
                  KES {p.unit_price}
                </div>

                <button
                  className="btn btn-primary"
                  style={{ width: "100%", marginTop: 10 }}
                  disabled={addingId === p.id}
                  onClick={() => addToCart(p.id)}
                >
                  {addingId === p.id ? "Adding..." : "Add to Cart"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
