import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "../../components/AppLayout";
import { api } from "../../api/client";

/**
 * Modal for adding product with KG / BAG support
 */
function AddToCartModal({ product, onClose, onAdded }) {
  const [unit, setUnit] = useState("KG");
  const [qty, setQty] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  if (!product) return null;

  const kgPerBag = product.bag_weight_kg || 0;

  const totalKg =
    unit === "KG"
      ? Number(qty || 0)
      : Number(qty || 0) * Number(kgPerBag);

  const submit = async () => {
    setMsg("");

    if (!qty || totalKg <= 0) {
      setMsg("Enter a valid quantity");
      return;
    }

    setLoading(true);

    try {
      await api.post("/api/cart/pos/cart/add/", {
        product: product.id,
        unit: unit,          // ✅ backend expects `unit`
        quantity: Number(qty), // ✅ backend expects `quantity`
      });

      onAdded();
      onClose();
    } catch (err) {
      setMsg(err?.response?.data?.detail || "❌ Failed to add to cart");
    } finally {
      setLoading(false);
    }
  };

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
      <div className="card" style={{ width: "100%", maxWidth: 420 }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <div style={{ fontWeight: 900 }}>Add to Cart</div>
          <button className="btn btn-danger" onClick={onClose}>
            Close
          </button>
        </div>

        <div style={{ marginTop: 10 }}>
          <div style={{ fontWeight: 800 }}>{product.name}</div>
          <div className="muted">
            Price: KES {product.unit_price} / KG
          </div>
        </div>

        <div style={{ marginTop: 12 }}>
          {product.allows_bag ? (
            <select
              className="input"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
            >
              <option value="KG">KG</option>
              <option value="BAG">
                BAG ({kgPerBag} KG)
              </option>
            </select>
          ) : (
            <div className="muted">Sold in KG only</div>
          )}
        </div>

        <div style={{ marginTop: 10 }}>
          <input
            className="input"
            type="number"
            min="0.01"
            placeholder={unit === "KG" ? "Quantity in KG" : "Number of bags"}
            value={qty}
            onChange={(e) => setQty(e.target.value)}
          />
        </div>

        <div className="muted" style={{ marginTop: 8 }}>
          Total weight: <b>{totalKg.toFixed(3)} KG</b>
        </div>

        {msg && <div style={{ marginTop: 8 }}>{msg}</div>}

        <button
          className="btn btn-primary"
          style={{ width: "100%", marginTop: 14 }}
          disabled={loading || !qty || totalKg <= 0}
          onClick={submit}
        >
          {loading ? "Adding..." : "Add to Cart"}
        </button>
      </div>
    </div>
  );
}

export default function Products() {
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);

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

  return (
    <AppLayout title="Products" subtitle="Search products and add to cart">
      <AddToCartModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAdded={() => setMsg("✅ Added to cart")}
      />

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
                  {p.allows_bag
                    ? `Sold in KG / BAG (${p.bag_weight_kg} KG)`
                    : "Sold in KG"}
                </div>

                <div style={{ marginTop: 8, fontWeight: 900 }}>
                  KES {p.unit_price} / KG
                </div>

                <button
                  className="btn btn-primary"
                  style={{ width: "100%", marginTop: 10 }}
                  onClick={() => setSelectedProduct(p)}
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