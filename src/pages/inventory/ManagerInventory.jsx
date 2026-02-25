import { useEffect, useState, useRef } from "react";
import AppLayout from "../../components/AppLayout";
import { api } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";

/* ===============================
   CONSTANTS
================================ */
const ACTIONS = {
  IN: "IN",
  OUT: "OUT",
  ADJUST: "ADJUST",
};

/* ===============================
   COMPONENT
================================ */
export default function InventoryManager() {
  const { user } = useAuth();

  const branchId = user?.branch?.id;
  const branchName = user?.branch?.name;

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [actionType, setActionType] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);

  const [unit, setUnit] = useState("kg");
  const [quantity, setQuantity] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const noteRef = useRef(null);

  /* ===============================
     LOAD INVENTORY
  ================================ */
  useEffect(() => {
    if (!branchId) return;

    setLoading(true);
    api
      .get(`/api/inventory/admin-branch/?branch=${branchId}`)
      .then((res) => setItems(res.data.items || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [branchId]);

  
  /* ===============================
     OPEN / CLOSE MODAL
  ================================ */
  const openModal = (type, item) => {
    setActionType(type);
    setSelectedItem(item);
    setUnit("kg");
    setQuantity("");
    setNote("");
    setError(null);
    setShowModal(true);
  };

  const closeModal = () => {
    if (submitting) return;
    setShowModal(false);
  };

  /* ===============================
     SUBMIT ACTION
  ================================ */
  const submitAction = async () => {
    if (!quantity || Number(quantity) <= 0) {
      setError("Quantity must be greater than zero");
      return;
    }

    setSubmitting(true);
    setError(null);

    const payload = {
      branch: branchId,
      product: selectedItem.product_id,
      quantity: Number(quantity),
      unit,
      note,
    };

    try {
      if (actionType === ACTIONS.IN) {
        await api.post("/api/inventory/stock-in/", payload);
      } else if (actionType === ACTIONS.OUT) {
        await api.post("/api/inventory/stock-out/", payload);
      } else if (actionType === ACTIONS.ADJUST) {
        await api.post("/api/inventory/adjust/", payload);
      }

      // Reload inventory
      const res = await api.get(
        `/api/inventory/admin-branch/?branch=${branchId}`
      );
      setItems(res.data.items || []);
      setShowModal(false);
    } catch (err) {
      setError(err.response?.data?.error || "Action failed");
    } finally {
      setSubmitting(false);
    }
  };

  /* ===============================
     RENDER
  ================================ */
  return (
    <AppLayout title="Inventory Management">
      {/* Branch Info */}
      <div className="card mb-3">
        <div className="card-body">
          <strong>Branch:</strong> {branchName}
        </div>
      </div>

      {/* Inventory Table */}
      <div className="card">
        <div className="card-header">
          <h5 className="mb-0">Branch Inventory</h5>
        </div>

        <div className="card-body p-0">
          {loading ? (
            <div className="p-4 text-center">Loading inventory…</div>
          ) : items.length === 0 ? (
            <div className="p-4 text-center text-muted">
              No inventory items found.
            </div>
          ) : (
            <table className="table table-hover mb-0">
              <thead className="table-light">
                <tr>
                  <th>Product</th>
                  <th>Stock</th>
                  <th>Status</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const bags =
                    item.bag_weight_kg
                      ? (item.stock_kg / item.bag_weight_kg).toFixed(1)
                      : null;

                  return (
                    <tr
                      key={item.product_id}
                      className={!item.is_ok ? "table-danger" : ""}
                    >
                      <td>{item.product}</td>
                      <td>
                        {item.stock_kg} KG
                        {bags && (
                          <span className="text-muted">
                            {" "}
                            ({bags} bags)
                          </span>
                        )}
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            item.is_ok ? "bg-success" : "bg-danger"
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td className="text-end">
                        <button
                          type="button"
                          className="btn btn-sm btn-success me-1"
                          onClick={() => openModal(ACTIONS.IN, item)}
                        >
                          Stock In
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-warning me-1"
                          onClick={() => openModal(ACTIONS.OUT, item)}
                        >
                          Stock Out
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-secondary"
                          onClick={() => openModal(ACTIONS.ADJUST, item)}
                        >
                          Adjust
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ===============================
         MODAL OVERLAY
      ================================ */}
      {showModal && (
        <>
          {/* Overlay */}
          <div
            onClick={closeModal}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.6)",
              zIndex: 1040,
            }}
          />

          {/* Modal container */}
          <div
            style={{
              position: "fixed",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: "100%",
              maxWidth: "560px",
              zIndex: 1050,
            }}
          >
            <div
              style={{
                backgroundColor: "#ffffff",   
                borderRadius: "8px",
                boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
                overflow: "hidden",
              }}
            >
              {/* Header */}
              <div
                style={{
                  padding: "16px 20px",
                  borderBottom: "1px solid #e5e7eb",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  backgroundColor: "#ffffff",
                }}
              >
                <div>
                  <h5 style={{ margin: 0 }}>
                    {actionType === ACTIONS.IN && "Stock In"}
                    {actionType === ACTIONS.OUT && "Stock Out"}
                    {actionType === ACTIONS.ADJUST && "Adjust Stock"}
                  </h5>
                  <small style={{ color: "#6b7280" }}>
                    {selectedItem.product}
                  </small>
                </div>

                <button
                  type="button"
                  onClick={closeModal}
                  style={{
                    border: "none",
                    background: "transparent",
                    fontSize: "20px",
                    cursor: "pointer",
                    color: "#374151",
                  }}
                  aria-label="Close"
                >
                  ×
                </button>
              </div>

              {/* Body */}
              <div
                style={{
                  padding: "20px",
                  backgroundColor: "#ffffff", 
                }}
              >
                {/* Current stock */}
                <div
                  style={{
                    marginBottom: "16px",
                    padding: "12px",
                    background: "#f9fafb",
                    borderRadius: "6px",
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                >
                  <span style={{ color: "#6b7280" }}>Current Stock</span>
                  <strong>{selectedItem.stock_kg} KG</strong>
                </div>

                {error && (
                  <div className="alert alert-danger py-2 mb-3">
                    {error}
                  </div>
                )}

                {/* Unit + Quantity */}
                <div style={{ marginBottom: "24px" }}>
                  <div className="row g-3">
                    <div className="col-4">
                      <label className="form-label">Unit</label>
                      <select
                        className="form-select"
                        value={unit}
                        onChange={(e) => setUnit(e.target.value)}
                      >
                        <option value="kg">KG</option>
                        {selectedItem.bag_weight_kg && (
                          <option value="bag">Bag</option>
                        )}
                      </select>
                    </div>

                    <div className="col-8">
                      <label className="form-label">
                        Quantity ({unit === "bag" ? "Bags" : "KG"})
                      </label>
                      <input
                        type="number"
                        step="any"
                        className="form-control"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Note */}
                <div className="mt-2">
                  <label className="form-label">Note (optional)</label>
                  <textarea
                    rows="2"
                    className="form-control"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />
                </div>
              </div>

              {/* Footer */}
              <div
                style={{
                  padding: "16px 20px",
                  borderTop: "1px solid #e5e7eb",
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "12px",
                  backgroundColor: "#f9fafb",
                }}
              >
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={closeModal}
                  disabled={submitting}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={submitAction}
                  disabled={submitting}
                >
                  {submitting ? "Processing…" : "Confirm"}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </AppLayout>
  );
}