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

    if (product.out_of_stock) {
      setMsg("This product is out of stock");
      return;
    }

    if (!qty || totalKg <= 0) {
      setMsg("Enter a valid quantity");
      return;
    }

    setLoading(true);

    try {
      await api.post("/api/cart/pos/cart/add/", {
        product: product.id,
        unit: unit,
        quantity: Number(qty),
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

          <div className="muted" style={{ marginTop: 4 }}>
            {product.out_of_stock ? (
              <span style={{ color: "red" }}>Out of stock</span>
            ) : (
              <span>
                Available: {Number(product.stock_kg).toFixed(2)} KG
              </span>
            )}
          </div>

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
              <option value="BAG">BAG ({kgPerBag} KG)</option>
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
          disabled={loading || !qty || totalKg <= 0 || product.out_of_stock}
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
  const [categories, setCategories] = useState([]);
  const [q, setQ] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [backendSearched, setBackendSearched] = useState(false);

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

  const loadCategories = async () => {
    try {
      const res = await api.get("/api/categories/");
      setCategories(res.data || []);
    } catch (err) {
      console.error("Failed to load categories", err);
    }
  };

  useEffect(() => {
    loadProducts();
    loadCategories();
  }, []);

  useEffect(() => {
    setBackendSearched(false);
  }, [q, selectedCategory]);

  const localResults = useMemo(() => {
    let filtered = products;
    
    // Filter by search query
    const query = q.trim().toLowerCase();
    if (query) {
      filtered = filtered.filter((p) =>
        String(p.name || "").toLowerCase().includes(query)
      );
    }
    
    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter((p) => p.category === parseInt(selectedCategory) || p.category?.toString() === selectedCategory);
    }
    
    return filtered;
  }, [products, q, selectedCategory]);

  const searchBackend = async () => {
    if (!q.trim() && !selectedCategory) return;

    setLoading(true);
    setMsg("");

    try {
      const params = {};
      if (q.trim()) params.search = q;
      if (selectedCategory) params.category = selectedCategory;
      
      const res = await api.get(`/api/products/`, { params });
      setProducts(res.data || []);
      setBackendSearched(true);
    } catch (err) {
      setMsg("❌ Failed to search in store");
    } finally {
      setLoading(false);
    }
  };

  const resetSearch = async () => {
    setQ("");
    setSelectedCategory("");
    setBackendSearched(false);
    await loadProducts();
  };

  const displayProducts = q || selectedCategory
    ? backendSearched
      ? products
      : localResults
    : products;

  return (
    <AppLayout title="Products" subtitle="Search products and add to cart">
      <AddToCartModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAdded={() => setMsg("✅ Added to cart")}
      />

      <div className="card">
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <input
            className="input"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search product name or scan barcode..."
            style={{ flex: 2, minWidth: 200 }}
          />

          <select
            className="input"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            style={{ flex: 1, minWidth: 150 }}
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>

          {(q || selectedCategory) && (
            <button className="btn btn-secondary" onClick={resetSearch}>
              Clear
            </button>
          )}

          <button className="btn btn-primary" onClick={() => navigate("/cart")}>
            Go to Cart
          </button>
        </div>

        {(q || selectedCategory) && !backendSearched && (
          <div style={{ marginTop: 12 }}>
            <button
              className="btn btn-primary"
              onClick={searchBackend}
              style={{ width: "100%" }}
            >
              Search in Store
            </button>
          </div>
        )}

        {msg && <div style={{ marginTop: 10, fontWeight: 800 }}>{msg}</div>}
      </div>

      <div style={{ marginTop: 16 }}>
        {loading ? (
          <div className="muted">Loading products...</div>
        ) : displayProducts.length === 0 ? (
          <div className="card" style={{ textAlign: "center" }}>
            <div className="muted">No products found.</div>
            {(q || selectedCategory) && !backendSearched && (
              <button
                className="btn btn-primary"
                style={{ marginTop: 10 }}
                onClick={searchBackend}
              >
                Search in Store
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-4">
            {displayProducts.map((p) => (
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

                <div style={{ marginTop: 6 }}>
                  {p.out_of_stock ? (
                    <span style={{ color: "red", fontWeight: 800 }}>
                      OUT OF STOCK
                    </span>
                  ) : (
                    <span style={{ color: "green", fontWeight: 800 }}>
                      Stock: {Number(p.stock_kg).toFixed(2)} KG
                    </span>
                  )}
                </div>

                <button
                  className="btn btn-primary"
                  style={{
                    width: "100%",
                    marginTop: 10,
                    opacity: p.out_of_stock ? 0.6 : 1,
                    cursor: p.out_of_stock ? "not-allowed" : "pointer",
                  }}
                  disabled={p.out_of_stock}
                  onClick={() => {
                    if (!p.out_of_stock) {
                      setSelectedProduct(p);
                    }
                  }}
                >
                  {p.out_of_stock ? "Out of Stock" : "Add to Cart"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}