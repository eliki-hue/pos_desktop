import { useEffect, useState } from "react";
import AppLayout from "../../components/AppLayout";
import { api } from "../../api/client";
import ProductFormModal from "./ProductFormModal";

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [modal, setModal] = useState(null); // null | product | "add"

  async function load() {
    const res = await api.get("/api/products/admin/");
    setProducts(res.data || []);
  }

  useEffect(() => {
    load();
  }, []);

  async function deactivate(id) {
    if (!window.confirm("Deactivate this product?")) return;
    await api.post(`/api/products/${id}/deactivate/`);
    load();
  }

  return (
    <AppLayout title="Products" subtitle="Manage all products">
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
        <strong>Products</strong>
        <button className="btn" onClick={() => setModal("add")}>
          + Add Product
        </button>
      </div>

      <div className="card" style={{ marginTop: 12, overflowX: "auto" }}>
        <table className="table" style={{ minWidth: 800 }}>
          <thead>
            <tr>
              <th>Image</th>
              <th>Name</th>
              <th>Category</th>
              <th>SKU</th>
              <th>KG Price</th>
              <th>Bag Price</th>
              <th>Bag Info</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id}>
                <td>
                  {p.image ? (
                    <img
                      src={p.image}
                      alt={p.name}
                      style={{ width: 40, height: 40, objectFit: "cover", borderRadius: 4 }}
                    />
                  ) : (
                    "—"
                  )}
                </td>
                <td>
                  <div style={{ fontWeight: 500 }}>{p.name}</div>
                  <div style={{ fontSize: 12, color: "#666" }}>
                    ID: {p.id}
                  </div>
                </td>
                <td>{p.category_name || "—"}</td>
                <td>
                  <code style={{ fontSize: 12 }}>{p.sku}</code>
                </td>
                <td>
                  <strong>KES {Number(p.price_per_kg).toFixed(2)}</strong>
                  <div style={{ fontSize: 11, color: "#666" }}>
                    Cost: KES {Number(p.cost_per_kg).toFixed(2)}
                  </div>
                </td>
                <td>
                  {p.allows_bag ? (
                    <>
                      <strong>KES {Number(p.price_per_bag).toFixed(2)}</strong>
                      <div style={{ fontSize: 11, color: "#666" }}>
                        Cost: KES {Number(p.cost_per_bag).toFixed(2)}
                      </div>
                    </>
                  ) : (
                    <span style={{ color: "#999" }}>—</span>
                  )}
                </td>
                <td>
                  {p.allows_bag ? (
                    <>
                      <div>{p.bag_weight_kg} KG/bag</div>
                      <div style={{ fontSize: 11, color: "#666" }}>
                        {Number(p.price_per_bag / p.bag_weight_kg).toFixed(2)} KES/KG
                      </div>
                    </>
                  ) : (
                    <span style={{ color: "#999" }}>KG only</span>
                  )}
                </td>
                <td>
                  <span className={p.is_active ? "badge-success" : "badge-danger"}>
                    {p.is_active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td style={{ display: "flex", gap: 6, whiteSpace: "nowrap" }}>
                  <button className="btn" onClick={() => setModal(p)}>
                    Edit
                  </button>
                  {p.is_active && (
                    <button
                      className="btn danger"
                      onClick={() => deactivate(p.id)}
                    >
                      Deactivate
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <ProductFormModal
          product={modal === "add" ? null : modal}
          onClose={() => {
            setModal(null);
            load();
          }}
        />
      )}
    </AppLayout>
  );
}