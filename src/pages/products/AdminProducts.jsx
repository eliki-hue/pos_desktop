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
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <strong>Products</strong>
        <button className="btn" onClick={() => setModal("add")}>
          + Add Product
        </button>
      </div>

      <div className="card" style={{ marginTop: 12 }}>
        <table className="table">
          <thead>
            <tr>
              <th>Image</th>
              <th>Name</th>
              <th>SKU</th>
              <th>Price</th>
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
                      alt=""
                      style={{ width: 40, height: 40, objectFit: "cover" }}
                    />
                  ) : (
                    "—"
                  )}
                </td>
                <td>{p.name}</td>
                <td>{p.sku}</td>
                <td>KES {p.unit_price}</td>
                <td>{p.is_active ? "Active" : "Inactive"}</td>
                <td style={{ display: "flex", gap: 6 }}>
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
