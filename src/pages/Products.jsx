import React from "react";
import { useEffect, useMemo, useState } from "react";
import AppLayout from "../components/AppLayout";
import { api } from "../api/client";

export default function Products() {
  const [products, setProducts] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get("/products/");
      setProducts(res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return products;
    return products.filter((p) => p.name.toLowerCase().includes(query));
  }, [products, q]);

  const addToCart = async (productId) => {
    setMsg("");
    try {
      // Adjust if your POS cart endpoint differs
      await api.post("/cart/add/", { product: productId, quantity: 1 });
      setMsg("✅ Added to cart");
    } catch (err) {
      setMsg(err?.response?.data?.detail || "❌ Failed to add to cart");
    }
  };

  return (
    <AppLayout
      title="Products"
      subtitle="Search products and add to cart"
    >
      <div className="card">
        <input
          className="input"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search product name or scan barcode..."
        />
        {msg && <div style={{ marginTop: 10, fontWeight: 800 }}>{msg}</div>}
      </div>

      <div style={{ marginTop: 16 }}>
        {loading ? (
          <div className="muted">Loading products...</div>
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
                  onClick={() => addToCart(p.id)}
                >
                  Add to Cart
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
