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
    allows_bag: false,
    bag_weight_kg: "",
    image: null,
    is_active: true,
  });

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [creatingCategory, setCreatingCategory] = useState(false);

  /* ================= LOAD CATEGORIES ================= */

  async function loadCategories() {
    try {
      const res = await api.get("/api/categories/");
      setCategories(res.data || []);
    } catch (err) {
      console.error(err);
    }
  }

  useEffect(() => {
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
        allows_bag: product.allows_bag || false,
        bag_weight_kg: product.bag_weight_kg || "",
        image: null,
        is_active: product.is_active ?? true,
      });
    }
  }, [product]);

  /* ================= HELPERS ================= */

  function updateField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  /* ================= CREATE NEW CATEGORY ================= */

  async function handleCreateCategory() {
    if (!newCategoryName.trim()) {
      setError("Category name is required");
      return;
    }

    try {
      setCreatingCategory(true);
      // Using the same endpoint - POST to /api/categories/
      const response = await api.post("/api/categories/", {
        name: newCategoryName.trim(),
      });
      
      const newCategory = response.data;
      setCategories(prev => [...prev, newCategory]);
      updateField("category", newCategory.id);
      setShowNewCategoryInput(false);
      setNewCategoryName("");
      setError("");
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.detail || 
        err.response?.data?.name?.[0] || 
        "Failed to create category"
      );
    } finally {
      setCreatingCategory(false);
    }
  }

  /* ================= SUBMIT ================= */

  async function submit(e) {
    e.preventDefault();
    setError("");

    if (!form.name || !form.sku || !form.category) {
      setError("Name, SKU and category are required");
      return;
    }

    if (form.allows_bag && !form.bag_weight_kg) {
      setError("Bag weight (KG) is required when bags are enabled");
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
      data.append("allows_bag", form.allows_bag);
      data.append(
        "bag_weight_kg",
        form.allows_bag ? form.bag_weight_kg : ""
      );
      data.append("is_active", form.is_active);

      if (form.image) {
        data.append("image", form.image);
      }

      if (isEdit) {
        await api.patch(
          `/api/products/${product.id}/update/`,
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
        err.response?.data?.detail ||
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
      <form className="card" onSubmit={submit} style={{ maxWidth: 460 }}>
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
          disabled={isEdit}
        />

        {/* CATEGORY SELECTION */}
        {!showNewCategoryInput ? (
          <div style={{ display: "flex", gap: 8 }}>
            <select
              className="input"
              value={form.category}
              onChange={(e) => updateField("category", e.target.value)}
              required
              style={{ flex: 1 }}
            >
              <option value="">Select category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="btn muted"
              onClick={() => setShowNewCategoryInput(true)}
              style={{ padding: "0 12px" }}
              disabled={loading}
            >
              + New
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                className="input"
                placeholder="New category name"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                autoFocus
                disabled={creatingCategory}
              />
              <button
                type="button"
                className="btn"
                onClick={handleCreateCategory}
                disabled={creatingCategory}
                style={{ padding: "0 12px" }}
              >
                {creatingCategory ? "..." : "Create"}
              </button>
              <button
                type="button"
                className="btn muted"
                onClick={() => {
                  setShowNewCategoryInput(false);
                  setNewCategoryName("");
                  setError("");
                }}
                disabled={creatingCategory}
                style={{ padding: "0 12px" }}
              >
                Cancel
              </button>
            </div>
            <small style={{ color: "#666" }}>
              Create a new category. This will be available for future products.
            </small>
          </div>
        )}

        {/* PRICING */}
        <input
          className="input"
          type="number"
          step="0.01"
          placeholder="Unit price (per KG)"
          value={form.unit_price}
          onChange={(e) => updateField("unit_price", e.target.value)}
          required
        />

        <input
          className="input"
          type="number"
          step="0.01"
          placeholder="Unit cost (per KG)"
          value={form.unit_cost}
          onChange={(e) => updateField("unit_cost", e.target.value)}
          required
        />

        {/* BAG SUPPORT */}
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
            checked={form.allows_bag}
            onChange={(e) =>
              updateField("allows_bag", e.target.checked)
            }
          />
          Allow selling by bag
        </label>

        {form.allows_bag && (
          <input
            className="input"
            type="number"
            step="0.01"
            placeholder="Bag weight (KG)"
            value={form.bag_weight_kg}
            onChange={(e) =>
              updateField("bag_weight_kg", e.target.value)
            }
            required
          />
        )}

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
            disabled={loading || creatingCategory}
          >
            Cancel
          </button>

          <button className="btn" disabled={loading || creatingCategory}>
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