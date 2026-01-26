import React, { useEffect, useMemo, useState } from "react";
import AppLayout from "../components/AppLayout";
import { api } from "../api/client";
import { useAuth } from "../auth/AuthContext";

export default function AdminProducts() {
  const { user } = useAuth();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const [q, setQ] = useState("");

  const [name, setName] = useState("");
  const [unitPrice, setUnitPrice] = useState("");

  const loadProducts = async () => {
    setLoading(true);
    setMsg("");
    try {
      const res = await api.get("/api/products/");
      setProducts(res.data || []);
    } catch (err) {
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
    return products.filter((p) => (p.name || "").toLowerCase().includes(query));
  }, [products, q]);

  const createProduct = async () => {
    setMsg("");
    const trimmed = name.trim();
    const price = Number(unitPrice);

    if (!trimmed) {
      setMsg("❌ Product name is required");
      return;
    }
    if (!Number.isFinite(price) || price <= 0) {
      setMsg("❌ Unit price must be a valid number > 0");
      return;
    }

    try {
      await api.post("/api/products/", {
        name: trimmed,
        unit_price: price,
      });
      setName("");
      setUnitPrice("");
      setMsg("✅ Product created");
      await loadProducts();
    } catch (err) {
      setMsg(err?.response?.data?.detail || "❌ Failed to create product");
    }
  };

  if (user?.role !== "admin" ) {
    return (
      <AppLayout title="Products" subtitle="Admin only">
        <div className="card">
          <div style={{ fontWeight: 900 }}>Access denied</div>
          <div className="muted">Only ADMIN can manage products.</div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Products" subtitle="Create and manage products">
      <div className="card">
        <div style={{ fontWeight: 900 }}>Create Product</div>
        <div className="muted" style={{ marginTop: 4 }}>
          Add products that will appear in POS and eCommerce.
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
          <input
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Product name e.g. Sugar 2kg"
            style={{ flex: 1, minWidth: 220 }}
          />

          <input
            className="input"
            value={unitPrice}
            onChange={(e) => setUnitPrice(e.target.value)}
            placeholder="Unit price (KES)"
            type="number"
            min="0"
            style={{ width: 180 }}
          />

          <button className="btn btn-primary" onClick={createProduct}>
            Add
          </button>
        </div>

        <div style={{ marginTop: 12 }}>
          <input
            className="input"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search products..."
          />
        </div>

        {msg && <div style={{ marginTop: 10, fontWeight: 800 }}>{msg}</div>}
      </div>

      <div style={{ marginTop: 16 }} className="card">
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
          <div>
            <div style={{ fontWeight: 900 }}>All Products</div>
            <div className="muted">Total: {filtered.length}</div>
          </div>

          <button className="btn btn-primary" onClick={loadProducts}>
            Refresh
          </button>
        </div>

        <div style={{ marginTop: 12 }}>
          {loading ? (
            <div className="muted">Loading products...</div>
          ) : filtered.length === 0 ? (
            <div className="muted">No products found.</div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Unit Price</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id}>
                    <td>{p.id}</td>
                    <td style={{ fontWeight: 900 }}>{p.name}</td>
                    <td>KES {p.unit_price}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
