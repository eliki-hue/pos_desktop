import { useEffect, useState } from "react";
import AppLayout from "../../components/AppLayout";
import { api } from "../../api/client";
import { stockIn } from "../../api/inventory";

export default function StockIn() {
  const [branches, setBranches] = useState([]);
  const [products, setProducts] = useState([]);

  const [branch, setBranch] = useState("");
  const [product, setProduct] = useState("");
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  /* =========================
     LOAD BRANCHES & PRODUCTS
     ========================= */
  useEffect(() => {
    api.get("/api/branches/")
      .then(res => {
        const data = res.data.results ?? res.data;
        setBranches(data);
      })
      .catch(() => setError("Failed to load branches"));

    api.get("/api/products/")
      .then(res => {
        const data = res.data.results ?? res.data;
        setProducts(data);
      })
      .catch(() => setError("Failed to load products"));
  }, []);

  /* =========================
     SUBMIT HANDLER
     ========================= */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!branch || !product || !quantity) {
      setError("Branch, product and quantity are required");
      return;
    }

    if (Number(quantity) <= 0) {
      setError("Quantity must be greater than zero");
      return;
    }

    setLoading(true);
    try {
      const res = await stockIn({
        branch: Number(branch),
        product: Number(product),
        quantity: Number(quantity),
        reason,
      });

      setSuccess(`Stock added successfully. New quantity: ${res.data.stock_kg} Kgs`);
      setQuantity("");
      setReason("");
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        err.response?.data?.error ||
        "Failed to stock product"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout title="Stock In">
      <div className="card">
        <div className="card-header">
          <h4>Receive Stock</h4>
        </div>

        <div className="card-body">
          {error && <div className="alert alert-danger">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          <form onSubmit={handleSubmit}>
            {/* Branch */}
            <div className="form-group">
              <label>Branch</label>
              <select
                className="form-control"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
              >
                <option value="">-- Select branch --</option>
                {branches.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Product */}
            <div className="form-group">
              <label>Product</label>
              <select
                className="form-control"
                value={product}
                onChange={(e) => setProduct(e.target.value)}
              >
                <option value="">-- Select product --</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Quantity */}
            <div className="form-group">
              <label>Quantity Received</label>
              <input
                type="number"
                min="1"
                className="form-control"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>

            {/* Reason */}
            <div className="form-group">
              <label>Reason (optional)</label>
              <input
                type="text"
                className="form-control"
                placeholder="Supplier delivery"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>

            <div className="form-actions">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? "Saving..." : "Stock In"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AppLayout>
  );
}