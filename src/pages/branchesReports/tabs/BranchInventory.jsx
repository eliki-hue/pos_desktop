import { useEffect, useState } from "react";
import { api } from "../../../api/client";

export default function AdminBranchInventory({ branchId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // inline edit state
  const [editing, setEditing] = useState(null); // product_id
  const [newThreshold, setNewThreshold] = useState("");
  const [saving, setSaving] = useState(false);

  /* ================= LOAD INVENTORY ================= */

  useEffect(() => {
    if (!branchId) return;

    async function loadInventory() {
      setLoading(true);
      setError("");

      try {
        const res = await api.get("/api/inventory/admin-branch/", {
          params: { branch: branchId },
        });
        setData(res.data);
      } catch (err) {
        console.error(err);
        setError("Failed to load inventory");
      } finally {
        setLoading(false);
      }
    }

    loadInventory();
  }, [branchId]);

  /* ================= SAVE THRESHOLD ================= */

  async function saveThreshold(productId) {
  if (newThreshold === "") return;

  try {
    setSaving(true);

    await api.post("/api/inventory/threshold/", {
      branch: branchId,
      product: productId,
      threshold: Number(newThreshold),
    });

    // update UI locally
    setData((prev) => ({
      ...prev,
      items: prev.items.map((i) =>
        i.product_id === productId
          ? {
              ...i,
              threshold_kg: Number(newThreshold),
              is_ok: i.stock > Number(newThreshold),
              status: i.stock > Number(newThreshold) ? "OK" : "LOW",
            }
          : i
      ),
    }));

    setEditing(null);
    setNewThreshold("");
  } catch (err) {
    console.error(err);
    alert("Failed to update threshold");
  } finally {
    setSaving(false);
  }
}

  /* ================= UI ================= */

  if (loading) return <div className="muted">Loading inventory…</div>;
  if (error) return <div className="card error">{error}</div>;
  if (!data) return null;

  return (
    <>
      {/* ================= SUMMARY ================= */}
      <div className="grid grid-3" style={{ marginTop: 20 }}>
        <StatCard label="Total Stock Units in kg" value={data.total_stock_kg}  />
        <StatCard label="Low Stock Items" value={data.low_stock_items} />
        <StatCard label="Branch ID" value={data.branch_id} />
      </div>

      {/* ================= INVENTORY TABLE ================= */}
      <div className="card" style={{ marginTop: 20 }}>
        <div style={{ fontWeight: 900, marginBottom: 10 }}>
          Branch Inventory
        </div>

        {data.items.length === 0 ? (
          <div className="muted">No inventory data</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Image</th>
                <th>Product</th>
                <th>SKU</th>
                <th>Stock</th>
                <th>Threshold</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((i) => (
                <tr key={i.product_id}>
                  <td>
                  {i.image ? (
                    <img
                      src={i.image}
                      alt=""
                      style={{ width: 40, height: 40, objectFit: "cover" }}
                    />
                  ) : (
                    "—"
                  )}
                </td>
                  <td>{i.product}</td>
                  <td>{i.sku}</td>
                  <td>{i.stock_kg}kg ({i.full_bags}bags {i.remaining_kg}kg)</td>

                  {/* ===== INLINE THRESHOLD EDIT ===== */}
                  <td>
                    {editing === i.product_id ? (
                      <div style={{ display: "flex", gap: 6 }}>
                        <input
                          type="number"
                          className="input"
                          style={{ width: 70 }}
                          value={newThreshold}
                          onChange={(e) => setNewThreshold(e.target.value)}
                        />

                        <button
                          className="btn"
                          disabled={saving}
                          onClick={() => saveThreshold(i.product_id)}
                        >
                          ✓
                        </button>

                        <button
                          className="btn"
                          onClick={() => {
                            setEditing(null);
                            setNewThreshold("");
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <span>{i.threshold_kg} kg</span>

                        <button
                          className="btn"
                          style={{ padding: "2px 6px" }}
                          onClick={() => {
                            setEditing(i.product_id);
                            setNewThreshold(i.threshold_kg);
                          }}
                        >
                          ✎
                        </button>
                      </div>
                    )}
                  </td>

                  {/* ===== STATUS ===== */}
                  <td>
                    {i.is_ok ? (
                      <span style={{ color: "green", fontWeight: 700 }}>
                        OK
                      </span>
                    ) : (
                      <span style={{ color: "red", fontWeight: 700 }}>
                        LOW
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}

/* ================= SMALL UI ================= */

function StatCard({ label, value }) {
  return (
    <div className="card">
      <div className="muted">{label}</div>
      <div style={{ fontSize: 22, fontWeight: 900 }}>{value}</div>
    </div>
  );
}
