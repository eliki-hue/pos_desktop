import { useEffect, useState } from "react";
import { api } from "../../api/client";
import Modal from "../../components/Modal";

export default function ProductFormModal({ product, onClose }) {
  const isEdit = Boolean(product);

  const [form, setForm] = useState({
    name: "",
    sku: "",
    category: "",
    unit_price: "",
    unit_cost: "",
    image: null,
    is_active: true,
  });

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /* ================= LOAD CATEGORIES ================= */

  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await api.get("/api/public/categories/");
        setCategories(res.data || []);
      } catch (err) {
        console.error(err);
      }
    }
    loadCategories();
  }, []);

  /* ================= LOAD PRODUCT (EDIT MODE) ================= */

  useEffect(() => {
    if (product) {
      setForm({
        name: product.name || "",
        sku: product.sku || "",
        category: product.category || "",
        unit_price: product.unit_price || "",
        unit_cost: product.unit_cost || "",
        image: null, // never preload file input
        is_active: product.is_active ?? true,
      });
    }
  }, [product]);

  /* ================= HELPERS ================= */

  function updateField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  /* ================= SUBMIT ================= */

  async function submit(e) {
    e.preventDefault();
    setError("");

    if (!form.name || !form.sku || !form.category) {
      setError("Name, SKU and category are required");
      return;
    }

    try {
      setLoading(true);

      const data = new FormData();
      data.append("name", form.name);
      data.append("sku", form.sku);
      data.append("category", form.category);
      data.append("unit_price", form.unit_price);
      data.append("unit_cost", form.unit_cost);
      data.append("is_active", form.is_active);

      if (form.image) {
        data.append("image", form.image);
      }

      if (isEdit) {
        await api.patch(
          `/api/products/admin/${product.id}/update/`,
          data,
          { headers: { "Content-Type": "multipart/form-data" } }
        );
      } else {
        await api.post(
          "/api/products/admin/create/",
          data,
          { headers: { "Content-Type": "multipart/form-data" } }
        );
      }

      onClose();
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.sku?.[0] ||
          "Failed to save product"
      );
    } finally {
      setLoading(false);
    }
  }

  /* ================= UI ================= */

  return (
    <Modal onClose={onClose}>
      <form
        className="card"
        onSubmit={submit}
        style={{ maxWidth: 460 }}
      >
        <div style={{ fontSize: 18, fontWeight: 900 }}>
          {isEdit ? "Edit Product" : "Add Product"}
        </div>

        {/* NAME */}
        <input
          className="input"
          placeholder="Product name"
          value={form.name}
          onChange={(e) => updateField("name", e.target.value)}
          required
        />

        {/* SKU */}
        <input
          className="input"
          placeholder="SKU"
          value={form.sku}
          onChange={(e) => updateField("sku", e.target.value)}
          required
          disabled={isEdit} // SKU usually immutable
        />

        {/* CATEGORY */}
        <select
          className="input"
          value={form.category}
          onChange={(e) => updateField("category", e.target.value)}
          required
        >
          <option value="">Select category</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        {/* PRICING */}
        <input
          className="input"
          type="number"
          step="0.01"
          placeholder="Unit price"
          value={form.unit_price}
          onChange={(e) =>
            updateField("unit_price", e.target.value)
          }
          required
        />

        <input
          className="input"
          type="number"
          step="0.01"
          placeholder="Unit cost"
          value={form.unit_cost}
          onChange={(e) =>
            updateField("unit_cost", e.target.value)
          }
          required
        />

        {/* IMAGE */}
        <input
          type="file"
          accept="image/*"
          className="input"
          onChange={(e) =>
            updateField("image", e.target.files[0])
          }
        />

        {/* ACTIVE */}
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginTop: 8,
          }}
        >
          <input
            type="checkbox"
            checked={form.is_active}
            onChange={(e) =>
              updateField("is_active", e.target.checked)
            }
          />
          Active
        </label>

        {/* ERROR */}
        {error && (
          <div
            style={{
              color: "red",
              fontWeight: 700,
              marginTop: 8,
            }}
          >
            {error}
          </div>
        )}

        {/* ACTIONS */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 10,
            marginTop: 14,
          }}
        >
          <button
            type="button"
            className="btn muted"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>

          <button className="btn" disabled={loading}>
            {loading
              ? "Saving…"
              : isEdit
              ? "Update Product"
              : "Create Product"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
