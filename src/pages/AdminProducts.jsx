import React from "react";
import { useEffect, useMemo, useState } from "react";
import AppLayout from "../components/AppLayout";
import { api } from "../api/client";

const emptyProduct = {
  name: "",
  sku: "",
  unit_price: "",
  unit_cost: "",
  slug: "",
  category_id: "",
  image: "",
  is_active: true,
};

function Modal({ open, title, children, onClose }) {
  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.45)",
        display: "grid",
        placeItems: "center",
        zIndex: 50,
        padding: 16,
      }}
      onMouseDown={onClose}
    >
      <div
        className="card"
        style={{
          width: "min(950px, 100%)",
          maxHeight: "85vh",
          overflow: "auto",
        }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            alignItems: "center",
            marginBottom: 12,
          }}
        >
          <div style={{ fontWeight: 900, fontSize: 18 }}>{title}</div>

          <button className="btn" onClick={onClose}>
            Close
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const [openAdd, setOpenAdd] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);

  const [form, setForm] = useState(emptyProduct);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const getCategoryLabel = (p) => {
    if (!p.category) return "-";
    if (typeof p.category === "object") return p.category?.name || "-";
    return String(p.category);
  };

  const load = async () => {
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
    load();
  }, []);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return products;

    return products.filter((p) => {
      const name = (p.name || "").toLowerCase();
      const sku = (p.sku || "").toLowerCase();
      const slug = (p.slug || "").toLowerCase();
      const category = (getCategoryLabel(p) || "").toLowerCase();

      return (
        name.includes(query) ||
        sku.includes(query) ||
        slug.includes(query) ||
        category.includes(query)
      );
    });
  }, [products, q]);

  const onChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const openAddModal = () => {
    setMsg("");
    setForm(emptyProduct);
    setOpenAdd(true);
  };

  const openEditModal = (p) => {
    setMsg("");
    setEditingId(p.id);

    setForm({
      name: p.name || "",
      sku: p.sku || "",
      unit_price: p.unit_price ?? "",
      unit_cost: p.unit_cost ?? "",
      slug: p.slug || "",
      category_id:
        typeof p.category === "object" ? p.category?.id ?? "" : p.category ?? "",
      image: p.image || "",
      is_active: !!p.is_active,
    });

    setOpenEdit(true);
  };

  const closeAll = () => {
    setOpenAdd(false);
    setOpenEdit(false);
    setEditingId(null);
    setForm(emptyProduct);
  };

  const validate = () => {
    if (!form.name.trim()) return "Product name is required";
    if (form.unit_price === "" || Number(form.unit_price) <= 0)
      return "Unit price must be greater than 0";
    if (form.unit_cost === "" || Number(form.unit_cost) < 0)
      return "Unit cost must be 0 or greater";
    return null;
  };

  const buildPayload = () => {
    return {
      name: form.name.trim(),
      sku: form.sku || null,
      unit_price: form.unit_price,
      unit_cost: form.unit_cost,
      slug: form.slug || null,
      category: form.category_id ? Number(form.category_id) : null,
      image: form.image || null,
      is_active: !!form.is_active,
    };
  };

  const createProduct = async () => {
    const errMsg = validate();
    if (errMsg) {
      setMsg(`❌ ${errMsg}`);
      return;
    }

    setSaving(true);
    setMsg("");

    try {
      await api.post("/api/products/", buildPayload());
      setMsg("✅ Product created");
      closeAll();
      await load();
    } catch (err) {
      setMsg(
        err?.response?.data?.detail ||
          "❌ Failed to create product (check required fields)"
      );
    } finally {
      setSaving(false);
    }
  };

  const updateProduct = async () => {
    if (!editingId) return;

    const errMsg = validate();
    if (errMsg) {
      setMsg(`❌ ${errMsg}`);
      return;
    }

    setSaving(true);
    setMsg("");

    try {
      await api.patch(`/api/products/${editingId}/`, buildPayload());
      setMsg("✅ Product updated");
      closeAll();
      await load();
    } catch (err) {
      setMsg(err?.response?.data?.detail || "❌ Failed to update product");
    } finally {
      setSaving(false);
    }
  };

  const deleteProduct = async (id) => {
    const ok = window.confirm(
      "Delete this product? This cannot be undone."
    );
    if (!ok) return;

    setMsg("");

    try {
      await api.delete(`/api/products/${id}/`);
      setMsg("✅ Product deleted");
      await load();
    } catch (err) {
      setMsg(
        err?.response?.data?.detail ||
          "❌ Failed to delete (may be linked to sales)"
      );
    }
  };

  return (
    <AppLayout title="Admin Products" subtitle="Manage all products">
      <div className="card">
        <div
          style={{
            display: "flex",
            gap: 12,
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <input
            className="input"
            style={{ maxWidth: 420 }}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name, sku, slug, category..."
          />

          <button className="btn btn-primary" onClick={openAddModal}>
            + Add Product
          </button>
        </div>

        {msg && <div style={{ marginTop: 10, fontWeight: 800 }}>{msg}</div>}
      </div>

      <div style={{ marginTop: 16 }} className="card">
        {loading ? (
          <div className="muted">Loading products...</div>
        ) : filtered.length === 0 ? (
          <div className="muted">No products found.</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Category</th>
                  <th>SKU</th>
                  <th>Price</th>
                  <th>Cost</th>
                  <th>Slug</th>
                  <th>Active</th>
                  <th>Created</th>
                  <th style={{ width: 200 }}>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id}>
                    <td>{p.id}</td>
                    <td style={{ fontWeight: 800 }}>{p.name}</td>
                    <td>{getCategoryLabel(p)}</td>
                    <td>{p.sku || "-"}</td>
                    <td>KES {Number(p.unit_price || 0).toFixed(2)}</td>
                    <td>KES {Number(p.unit_cost || 0).toFixed(2)}</td>
                    <td className="muted">{p.slug || "-"}</td>
                    <td>
                      {p.is_active ? (
                        <span style={{ fontWeight: 800 }}>✅ Yes</span>
                      ) : (
                        <span style={{ fontWeight: 800 }}>❌ No</span>
                      )}
                    </td>
                    <td className="muted">
                      {p.created_at
                        ? new Date(p.created_at).toLocaleString()
                        : "-"}
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button className="btn" onClick={() => openEditModal(p)}>
                          Edit
                        </button>
                        <button
                          className="btn btn-danger"
                          onClick={() => deleteProduct(p.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ADD */}
      <Modal open={openAdd} title="Add Product" onClose={() => setOpenAdd(false)}>
        <div className="grid grid-2" style={{ gap: 12 }}>
          <div>
            <div style={{ fontWeight: 800, marginBottom: 6 }}>Name</div>
            <input
              className="input"
              value={form.name}
              onChange={(e) => onChange("name", e.target.value)}
            />
          </div>

          <div>
            <div style={{ fontWeight: 800, marginBottom: 6 }}>Category ID</div>
            <input
              className="input"
              value={form.category_id}
              onChange={(e) => onChange("category_id", e.target.value)}
              placeholder="e.g 1"
            />
          </div>

          <div>
            <div style={{ fontWeight: 800, marginBottom: 6 }}>SKU</div>
            <input
              className="input"
              value={form.sku}
              onChange={(e) => onChange("sku", e.target.value)}
            />
          </div>

          <div>
            <div style={{ fontWeight: 800, marginBottom: 6 }}>Slug</div>
            <input
              className="input"
              value={form.slug}
              onChange={(e) => onChange("slug", e.target.value)}
              placeholder="optional (auto if backend generates)"
            />
          </div>

          <div>
            <div style={{ fontWeight: 800, marginBottom: 6 }}>Unit Price</div>
            <input
              className="input"
              type="number"
              value={form.unit_price}
              onChange={(e) => onChange("unit_price", e.target.value)}
            />
          </div>

          <div>
            <div style={{ fontWeight: 800, marginBottom: 6 }}>Unit Cost</div>
            <input
              className="input"
              type="number"
              value={form.unit_cost}
              onChange={(e) => onChange("unit_cost", e.target.value)}
            />
          </div>

          <div style={{ gridColumn: "1 / -1" }}>
            <div style={{ fontWeight: 800, marginBottom: 6 }}>Image URL</div>
            <input
              className="input"
              value={form.image}
              onChange={(e) => onChange("image", e.target.value)}
              placeholder="optional"
            />
          </div>

          <div style={{ gridColumn: "1 / -1" }}>
            <label style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => onChange("is_active", e.target.checked)}
              />
              <span style={{ fontWeight: 800 }}>Active</span>
            </label>
          </div>
        </div>

        <div style={{ marginTop: 14, display: "flex", gap: 10 }}>
          <button
            className="btn btn-primary"
            disabled={saving}
            onClick={createProduct}
          >
            {saving ? "Saving..." : "Save Product"}
          </button>
          <button className="btn" onClick={closeAll}>
            Cancel
          </button>
        </div>
      </Modal>

      {/* EDIT */}
      <Modal
        open={openEdit}
        title="Edit Product"
        onClose={() => setOpenEdit(false)}
      >
        <div className="grid grid-2" style={{ gap: 12 }}>
          <div>
            <div style={{ fontWeight: 800, marginBottom: 6 }}>Name</div>
            <input
              className="input"
              value={form.name}
              onChange={(e) => onChange("name", e.target.value)}
            />
          </div>

          <div>
            <div style={{ fontWeight: 800, marginBottom: 6 }}>Category ID</div>
            <input
              className="input"
              value={form.category_id}
              onChange={(e) => onChange("category_id", e.target.value)}
            />
          </div>

          <div>
            <div style={{ fontWeight: 800, marginBottom: 6 }}>SKU</div>
            <input
              className="input"
              value={form.sku}
              onChange={(e) => onChange("sku", e.target.value)}
            />
          </div>

          <div>
            <div style={{ fontWeight: 800, marginBottom: 6 }}>Slug</div>
            <input
              className="input"
              value={form.slug}
              onChange={(e) => onChange("slug", e.target.value)}
            />
          </div>

          <div>
            <div style={{ fontWeight: 800, marginBottom: 6 }}>Unit Price</div>
            <input
              className="input"
              type="number"
              value={form.unit_price}
              onChange={(e) => onChange("unit_price", e.target.value)}
            />
          </div>

          <div>
            <div style={{ fontWeight: 800, marginBottom: 6 }}>Unit Cost</div>
            <input
              className="input"
              type="number"
              value={form.unit_cost}
              onChange={(e) => onChange("unit_cost", e.target.value)}
            />
          </div>

          <div style={{ gridColumn: "1 / -1" }}>
            <div style={{ fontWeight: 800, marginBottom: 6 }}>Image URL</div>
            <input
              className="input"
              value={form.image}
              onChange={(e) => onChange("image", e.target.value)}
            />
          </div>

          <div style={{ gridColumn: "1 / -1" }}>
            <label style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => onChange("is_active", e.target.checked)}
              />
              <span style={{ fontWeight: 800 }}>Active</span>
            </label>
          </div>
        </div>

        <div style={{ marginTop: 14, display: "flex", gap: 10 }}>
          <button
            className="btn btn-primary"
            disabled={saving}
            onClick={updateProduct}
          >
            {saving ? "Saving..." : "Update Product"}
          </button>
          <button className="btn" onClick={closeAll}>
            Cancel
          </button>
        </div>
      </Modal>
    </AppLayout>
  );
}
