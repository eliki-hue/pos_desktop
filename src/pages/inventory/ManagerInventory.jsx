import { useEffect, useState } from "react";
import AppLayout from "../../components/AppLayout";
import { api } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";

/* ========================================
   ACTION TYPES
======================================== */
const ACTIONS = {
  IN: "IN",
  ADJUST: "ADJUST",
};

/* ========================================
   UNIT TYPES - EXACTLY AS BACKEND EXPECTS
======================================== */
const UNITS = {
  KG: "kg",      // backend expects "kg"
  BAG: "bag",    // backend expects "bag" (singular)
  PIECE: "piece" // backend expects "piece"
};

export default function InventoryManager() {
  const { user } = useAuth();

  const branchId = user?.branch?.id;
  const branchName = user?.branch?.name;

  const [items, setItems] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [productUnits, setProductUnits] = useState({}); // Store available units per product

  const [selectedItem, setSelectedItem] = useState(null);

  /* ---------- MAIN MODAL ---------- */
  const [showMainModal, setShowMainModal] = useState(false);
  const [actionType, setActionType] = useState(null);
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState(UNITS.KG);
  const [note, setNote] = useState("");

  /* ---------- STOCK OUT MODAL ---------- */
  const [showStockOutModal, setShowStockOutModal] = useState(false);
  const [stockOutQuantity, setStockOutQuantity] = useState("");
  const [stockOutUnit, setStockOutUnit] = useState(UNITS.KG);
  const [stockOutNote, setStockOutNote] = useState("");
  const [stockOutSource, setStockOutSource] = useState("internal_use");
  const [destinationBranch, setDestinationBranch] = useState("");

  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  /* ========================================
     LOAD INVENTORY
  ======================================== */
  useEffect(() => {
    if (!branchId) return;

    setLoading(true);

    api
      .get(`/api/inventory/admin-branch/?branch=${branchId}`)
      .then((res) => {
        setItems(res.data.items || []);
        // Build available units per product from product data
        const unitsMap = {};
        (res.data.items || []).forEach((item) => {
          const available = ["kg"];
          if (item.allows_bag) available.push("bag");
          if (item.allows_piece) available.push("piece");
          unitsMap[item.product_id] = available;
        });
        setProductUnits(unitsMap);
      })
      .finally(() => setLoading(false));

    api.get("/api/branches/").then((res) => {
      setBranches(res.data || []);
    });
  }, [branchId]);

  const reloadInventory = async () => {
    const res = await api.get(
      `/api/inventory/admin-branch/?branch=${branchId}`
    );
    setItems(res.data.items || []);
    // Update units map
    const unitsMap = {};
    (res.data.items || []).forEach((item) => {
      const available = ["kg"];
      if (item.allows_bag) available.push("bag");
      if (item.allows_piece) available.push("piece");
      unitsMap[item.product_id] = available;
    });
    setProductUnits(unitsMap);
  };

  const closeModals = () => {
    if (submitting) return;
    setShowMainModal(false);
    setShowStockOutModal(false);
    setError(null);
  };

  /* ========================================
     OPEN MODALS
  ======================================== */
  const openMainModal = (type, item) => {
    setSelectedItem(item);
    setActionType(type);
    setQuantity("");
    // Set default unit to KG, but if product only allows piece, set to piece
    const availableUnits = productUnits[item.product_id] || ["kg"];
    setUnit(availableUnits.includes("kg") ? UNITS.KG : (availableUnits.includes("piece") ? UNITS.PIECE : UNITS.BAG));
    setNote("");
    setShowMainModal(true);
  };

  const openStockOutModal = (item) => {
    setSelectedItem(item);
    setStockOutQuantity("");
    const availableUnits = productUnits[item.product_id] || ["kg"];
    setStockOutUnit(availableUnits.includes("kg") ? UNITS.KG : (availableUnits.includes("piece") ? UNITS.PIECE : UNITS.BAG));
    setStockOutNote("");
    setStockOutSource("internal_use");
    setDestinationBranch("");
    setShowStockOutModal(true);
  };

  /* ========================================
     SUBMIT MAIN
  ======================================== */
  const submitMain = async () => {
    if (!quantity || Number(quantity) <= 0) {
      setError("Quantity must be greater than zero.");
      return;
    }

    setSubmitting(true);
    setError(null);

    const payload = {
      branch: branchId,
      product: selectedItem.product_id,
      quantity: Number(quantity),
      unit: unit,  // This will be either "kg", "bag", or "piece"
      note,
    };

    try {
      if (actionType === ACTIONS.IN) {
        await api.post("/api/inventory/stock-in/", payload);
      } else {
        await api.post("/api/inventory/adjust/", payload);
      }

      await reloadInventory();
      closeModals();
    } catch (err) {
      setError(err.response?.data?.error || "Action failed.");
    } finally {
      setSubmitting(false);
    }
  };

  /* ========================================
     SUBMIT STOCK OUT
  ======================================== */
  const submitStockOut = async () => {
    if (!stockOutQuantity || Number(stockOutQuantity) <= 0) {
      setError("Quantity must be greater than zero.");
      return;
    }

    if (stockOutSource === "transfer" && !destinationBranch) {
      setError("Please select destination branch.");
      return;
    }

    setSubmitting(true);
    setError(null);

    const payload = {
      branch: branchId,
      product: selectedItem.product_id,
      quantity: Number(stockOutQuantity),
      unit: stockOutUnit,  // This will be either "kg", "bag", or "piece"
      source: stockOutSource,
      note: stockOutNote,
    };

    if (stockOutSource === "transfer") {
      payload.to_branch = destinationBranch;
    }

    try {
      await api.post("/api/inventory/stock-out/", payload);
      await reloadInventory();
      closeModals();
    } catch (err) {
      setError(err.response?.data?.error || "Stock out failed.");
    } finally {
      setSubmitting(false);
    }
  };

  // Helper to get available units for a product
  const getAvailableUnits = (item) => {
    const units = [];
    units.push({ value: UNITS.KG, label: "KG" });
    if (item.allows_bag) units.push({ value: UNITS.BAG, label: "Bag" });
    if (item.allows_piece) units.push({ value: UNITS.PIECE, label: "Piece" });
    return units;
  };

  // Helper to display stock in human-readable format
  const getStockDisplay = (item) => {
    const parts = [];
    
    // Show full bags if available
    if (item.allows_bag && item.full_bags > 0) {
      parts.push(`${item.full_bags} bag${item.full_bags !== 1 ? "s" : ""}`);
    }
    
    // Show remaining KG
    if (item.remaining_kg > 0) {
      parts.push(`${item.remaining_kg} kg`);
    }
    
    // Show pieces if product allows pieces
    if (item.allows_piece && item.full_pieces > 0) {
      parts.push(`${item.full_pieces} piece${item.full_pieces !== 1 ? "s" : ""}`);
    }
    
    if (parts.length === 0 && item.stock_kg > 0) {
      return `${item.stock_kg} kg`;
    }
    
    return parts.join(" + ");
  };

  return (
    <AppLayout title="Inventory Management">
      {/* Branch Card */}
      <div className="card mb-4 border-0 shadow-sm">
        <div className="card-body py-3">
          <span className="text-muted">Branch</span>
          <h6 className="mb-0">{branchName}</h6>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="card border-0 shadow-sm">
        <div className="card-body p-0">
          {loading ? (
            <div className="p-5 text-center text-muted">
              Loading inventory...
            </div>
          ) : (
            <table className="table align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>Product</th>
                  <th>Stock (KG)</th>
                  <th>Breakdown</th>
                  <th>Status</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.product_id}>
                    <td>
                      <div style={{ fontWeight: 500 }}>
                        {item.product}
                      </div>
                      <div
                        style={{
                          fontSize: "0.8rem",
                          color: "#64748b",
                        }}
                      >
                        SKU: {item.sku}
                      </div>
                      {/* Show available units badge */}
                      <div style={{ display: "flex", gap: "4px", marginTop: "4px" }}>
                        <span style={{
                          fontSize: "10px",
                          padding: "2px 6px",
                          background: "#e2e8f0",
                          borderRadius: "4px",
                        }}>KG</span>
                        {item.allows_bag && (
                          <span style={{
                            fontSize: "10px",
                            padding: "2px 6px",
                            background: "#dbeafe",
                            borderRadius: "4px",
                            color: "#1e40af",
                          }}>BAG</span>
                        )}
                        {item.allows_piece && (
                          <span style={{
                            fontSize: "10px",
                            padding: "2px 6px",
                            background: "#dcfce7",
                            borderRadius: "4px",
                            color: "#166534",
                          }}>PIECE</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <strong>{item.stock_kg} kg</strong>
                    </td>
                    <td>
                      <div style={{ fontSize: "0.85rem", color: "#475569" }}>
                        {getStockDisplay(item)}
                      </div>
                      {item.allows_bag && item.bag_weight_kg && (
                        <div style={{ fontSize: "0.7rem", color: "#94a3b8" }}>
                          Bag: {item.bag_weight_kg} kg/bag
                        </div>
                      )}
                      {item.allows_piece && item.piece_weight_kg && (
                        <div style={{ fontSize: "0.7rem", color: "#94a3b8" }}>
                          Piece: {item.piece_weight_kg} kg/piece
                        </div>
                      )}
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          item.is_ok
                            ? "bg-success"
                            : "bg-danger"
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="text-end">
                      <button
                        className="btn btn-sm btn-dark me-2"
                        onClick={() =>
                          openMainModal(ACTIONS.IN, item)
                        }
                      >
                        Stock In
                      </button>
                      <button
                        className="btn btn-sm btn-outline-dark me-2"
                        onClick={() =>
                          openMainModal(ACTIONS.ADJUST, item)
                        }
                      >
                        Adjust
                      </button>
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() =>
                          openStockOutModal(item)
                        }
                      >
                        Stock Out
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ================= MAIN MODAL ================= */}
      {showMainModal && (
        <ModernModal
          title={actionType === ACTIONS.IN ? "Stock In" : "Adjust Stock"}
          subtitle={selectedItem?.product}
          onClose={closeModals}
          size="md"
        >
          {error && (
            <div style={{
              padding: "16px 20px",
              borderRadius: "12px",
              background: "#fef2f2",
              border: "1px solid #fee2e2",
              color: "#991b1b",
              fontSize: "0.95rem",
              marginBottom: "24px",
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}>
              <span style={{ fontSize: "1.2rem" }}>⚠️</span>
              {error}
            </div>
          )}

          <FormField 
            label="Quantity" 
            required 
            helper="Enter amount"
          >
            <div style={{ display: "flex", gap: "12px" }}>
              <div style={{ flex: 1, position: "relative" }}>
                <input
                  type="number"
                  step={unit === UNITS.KG ? "0.01" : "1"}
                  min="0"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "14px 16px",
                    fontSize: "1rem",
                    border: "1px solid #e2e8f0",
                    borderRadius: "12px",
                    transition: "all 0.2s ease",
                    outline: "none",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#3b82f6";
                    e.target.style.boxShadow = "0 0 0 4px rgba(59, 130, 246, 0.1)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "#e2e8f0";
                    e.target.style.boxShadow = "none";
                  }}
                  placeholder="0.00"
                />
              </div>
              {selectedItem && (
                <UnitSelector
                  value={unit}
                  onChange={setUnit}
                  availableUnits={getAvailableUnits(selectedItem)}
                />
              )}
            </div>
          </FormField>

          <FormField label="Note (Optional)">
            <textarea
              rows="4"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              style={{
                width: "100%",
                padding: "14px 16px",
                fontSize: "0.95rem",
                border: "1px solid #e2e8f0",
                borderRadius: "12px",
                transition: "all 0.2s ease",
                outline: "none",
                resize: "vertical",
                fontFamily: "inherit",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "#3b82f6";
                e.target.style.boxShadow = "0 0 0 4px rgba(59, 130, 246, 0.1)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#e2e8f0";
                e.target.style.boxShadow = "none";
              }}
              placeholder="Add any additional notes here..."
            />
          </FormField>

          <ActionButtons
            onCancel={closeModals}
            onSubmit={submitMain}
            submitting={submitting}
            submitText={actionType === ACTIONS.IN ? "Complete Stock In" : "Apply Adjustment"}
            submitVariant="primary"
          />
        </ModernModal>
      )}

      {/* ================= STOCK OUT MODAL ================= */}
      {showStockOutModal && (
        <ModernModal
          title="Stock Out"
          subtitle={selectedItem?.product}
          onClose={closeModals}
          size="lg"
        >
          {error && (
            <div style={{
              padding: "16px 20px",
              borderRadius: "12px",
              background: "#fef2f2",
              border: "1px solid #fee2e2",
              color: "#991b1b",
              fontSize: "0.95rem",
              marginBottom: "24px",
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}>
              <span style={{ fontSize: "1.2rem" }}>⚠️</span>
              {error}
            </div>
          )}

          <SelectCard
            value={stockOutSource}
            onChange={setStockOutSource}
            options={[
              {
                value: "internal_use",
                label: "🏢 Internal Use",
                description: "Stock used within the branch"
              },
              {
                value: "transfer",
                label: "🔄 Transfer",
                description: "Move stock to another branch"
              }
            ]}
          />

          {stockOutSource === "transfer" && (
            <FormField label="Destination Branch" required>
              <select
                value={destinationBranch}
                onChange={(e) => setDestinationBranch(e.target.value)}
                style={{
                  width: "100%",
                  padding: "14px 16px",
                  fontSize: "0.95rem",
                  border: "1px solid #e2e8f0",
                  borderRadius: "12px",
                  background: "#ffffff",
                  cursor: "pointer",
                  outline: "none",
                  appearance: "none",
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "right 16px center",
                  backgroundSize: "16px",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "#3b82f6";
                  e.target.style.boxShadow = "0 0 0 4px rgba(59, 130, 246, 0.1)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "#e2e8f0";
                  e.target.style.boxShadow = "none";
                }}
              >
                <option value="">Select destination branch</option>
                {branches
                  .filter((b) => b.id !== branchId)
                  .map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
              </select>
            </FormField>
          )}

          <FormField 
            label="Quantity" 
            required 
            helper="Enter amount"
          >
            <div style={{ display: "flex", gap: "12px" }}>
              <div style={{ flex: 1, position: "relative" }}>
                <input
                  type="number"
                  step={stockOutUnit === UNITS.KG ? "0.01" : "1"}
                  min="0"
                  value={stockOutQuantity}
                  onChange={(e) => setStockOutQuantity(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "14px 16px",
                    fontSize: "1rem",
                    border: "1px solid #e2e8f0",
                    borderRadius: "12px",
                    transition: "all 0.2s ease",
                    outline: "none",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#3b82f6";
                    e.target.style.boxShadow = "0 0 0 4px rgba(59, 130, 246, 0.1)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "#e2e8f0";
                    e.target.style.boxShadow = "none";
                  }}
                  placeholder="0.00"
                />
              </div>
              {selectedItem && (
                <UnitSelector
                  value={stockOutUnit}
                  onChange={setStockOutUnit}
                  availableUnits={getAvailableUnits(selectedItem)}
                />
              )}
            </div>
          </FormField>

          <FormField label="Note (Optional)">
            <textarea
              rows="4"
              value={stockOutNote}
              onChange={(e) => setStockOutNote(e.target.value)}
              style={{
                width: "100%",
                padding: "14px 16px",
                fontSize: "0.95rem",
                border: "1px solid #e2e8f0",
                borderRadius: "12px",
                transition: "all 0.2s ease",
                outline: "none",
                resize: "vertical",
                fontFamily: "inherit",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "#3b82f6";
                e.target.style.boxShadow = "0 0 0 4px rgba(59, 130, 246, 0.1)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#e2e8f0";
                e.target.style.boxShadow = "none";
              }}
              placeholder="Add reason or additional notes..."
            />
          </FormField>

          <ActionButtons
            onCancel={closeModals}
            onSubmit={submitStockOut}
            submitting={submitting}
            submitText="Complete Stock Out"
            submitVariant="danger"
          />
        </ModernModal>
      )}
    </AppLayout>
  );
}

/* ========================================
   UNIT SELECTOR COMPONENT (UPDATED)
======================================== */
function UnitSelector({ value, onChange, availableUnits = [] }) {
  // Default units if none provided
  const units = availableUnits.length > 0 ? availableUnits : [
    { value: "kg", label: "KG" },
    { value: "bag", label: "Bag" },
    { value: "piece", label: "Piece" }
  ];

  return (
    <div style={{
      display: "flex",
      background: "#f1f5f9",
      borderRadius: "12px",
      padding: "4px",
    }}>
      {units.map((unit) => (
        <button
          key={unit.value}
          type="button"
          onClick={() => onChange(unit.value)}
          style={{
            padding: "10px 20px",
            borderRadius: "10px",
            border: "none",
            background: value === unit.value ? "#ffffff" : "transparent",
            color: value === unit.value ? "#0f172a" : "#64748b",
            fontSize: "0.95rem",
            fontWeight: "500",
            cursor: "pointer",
            transition: "all 0.2s ease",
            boxShadow: value === unit.value ? "0 2px 8px rgba(0,0,0,0.05)" : "none",
          }}
        >
          {unit.label}
        </button>
      ))}
    </div>
  );
}

/* ========================================
   MODERN ENTERPRISE MODAL COMPONENT
======================================== */
function ModernModal({ title, subtitle, children, onClose, size = "md" }) {
  // Handle ESC key press
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const sizes = {
    sm: '400px',
    md: '560px',
    lg: '720px',
    xl: '900px'
  };

  return (
    <>
      {/* Backdrop with refined blur and gradient */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0, 0, 0, 0.7)",
          backdropFilter: "blur(12px) saturate(180%)",
          WebkitBackdropFilter: "blur(12px) saturate(180%)",
          zIndex: 2000,
          animation: "fadeIn 0.2s ease-out",
        }}
      />
      
      {/* Modal container with centered positioning */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 2010,
          padding: "24px",
          animation: "slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: sizes[size],
            background: "#ffffff",
            borderRadius: "24px",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05)",
            overflow: "hidden",
            position: "relative",
          }}
        >
          {/* Subtle gradient accent line at top */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: "4px",
              background: "linear-gradient(90deg, #3b82f6 0%, #8b5cf6 50%, #ec4899 100%)",
            }}
          />

          {/* Header with refined typography */}
          <div
            style={{
              padding: "28px 32px",
              borderBottom: "1px solid #f1f5f9",
              background: "#ffffff",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <h3
                  style={{
                    fontSize: "1.5rem",
                    fontWeight: "600",
                    letterSpacing: "-0.025em",
                    color: "#0f172a",
                    margin: 0,
                    lineHeight: 1.4,
                  }}
                >
                  {title}
                </h3>
                {subtitle && (
                  <p
                    style={{
                      fontSize: "0.95rem",
                      color: "#64748b",
                      marginTop: "6px",
                      marginBottom: 0,
                      fontWeight: "400",
                    }}
                  >
                    {subtitle}
                  </p>
                )}
              </div>
              
              {/* Close button with hover effect */}
              <button
                onClick={onClose}
                style={{
                  background: "transparent",
                  border: "none",
                  width: "36px",
                  height: "36px",
                  borderRadius: "10px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  color: "#94a3b8",
                  transition: "all 0.2s ease",
                  fontSize: "20px",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#f1f5f9";
                  e.currentTarget.style.color = "#0f172a";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "#94a3b8";
                }}
              >
                ✕
              </button>
            </div>
          </div>

          {/* Content with refined spacing */}
          <div
            style={{
              padding: "32px",
              background: "#ffffff",
              maxHeight: "calc(90vh - 140px)",
              overflowY: "auto",
            }}
          >
            {children}
          </div>
        </div>
      </div>

      {/* Global styles for animations */}
      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          
          @keyframes slideUp {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </>
  );
}

/* ========================================
   FORM FIELD COMPONENT
======================================== */
function FormField({ label, children, required, error, helper }) {
  return (
    <div style={{ marginBottom: "24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
        <label
          style={{
            fontSize: "0.9rem",
            fontWeight: "500",
            color: "#334155",
            letterSpacing: "-0.01em",
          }}
        >
          {label}
          {required && <span style={{ color: "#ef4444", marginLeft: "4px" }}>*</span>}
        </label>
        {helper && (
          <span style={{ fontSize: "0.85rem", color: "#94a3b8" }}>{helper}</span>
        )}
      </div>
      {children}
      {error && (
        <p style={{ fontSize: "0.85rem", color: "#ef4444", marginTop: "6px", marginBottom: 0 }}>
          {error}
        </p>
      )}
    </div>
  );
}

/* ========================================
   SELECT CARD COMPONENT
======================================== */
function SelectCard({ value, onChange, options }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${options.length}, 1fr)`,
        gap: "12px",
        marginBottom: "24px",
      }}
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          style={{
            padding: "16px 20px",
            borderRadius: "14px",
            border: value === option.value 
              ? "2px solid #3b82f6" 
              : "1px solid #e2e8f0",
            background: value === option.value ? "#eff6ff" : "#ffffff",
            cursor: "pointer",
            transition: "all 0.2s ease",
            textAlign: "left",
            width: "100%",
            boxShadow: value === option.value 
              ? "0 4px 12px rgba(59, 130, 246, 0.15)" 
              : "none",
          }}
          onMouseEnter={(e) => {
            if (value !== option.value) {
              e.currentTarget.style.background = "#f8fafc";
              e.currentTarget.style.borderColor = "#cbd5e1";
            }
          }}
          onMouseLeave={(e) => {
            if (value !== option.value) {
              e.currentTarget.style.background = "#ffffff";
              e.currentTarget.style.borderColor = "#e2e8f0";
            }
          }}
        >
          <div style={{ fontWeight: "600", color: "#0f172a", marginBottom: "4px" }}>
            {option.label}
          </div>
          {option.description && (
            <div style={{ fontSize: "0.85rem", color: "#64748b" }}>
              {option.description}
            </div>
          )}
        </button>
      ))}
    </div>
  );
}

/* ========================================
   ACTION BUTTONS COMPONENT
======================================== */
function ActionButtons({ onCancel, onSubmit, submitting, submitText, submitVariant = "primary" }) {
  const variantStyles = {
    primary: {
      background: "#0f172a",
      color: "#ffffff",
      hover: "#1e293b",
    },
    danger: {
      background: "#dc2626",
      color: "#ffffff",
      hover: "#b91c1c",
    },
    success: {
      background: "#059669",
      color: "#ffffff",
      hover: "#047857",
    },
  };

  const style = variantStyles[submitVariant];

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "flex-end",
        gap: "12px",
        marginTop: "32px",
        borderTop: "1px solid #f1f5f9",
        paddingTop: "24px",
      }}
    >
      <button
        type="button"
        onClick={onCancel}
        disabled={submitting}
        style={{
          padding: "12px 24px",
          borderRadius: "12px",
          border: "1px solid #e2e8f0",
          background: "#ffffff",
          color: "#475569",
          fontSize: "0.95rem",
          fontWeight: "500",
          cursor: submitting ? "not-allowed" : "pointer",
          transition: "all 0.2s ease",
          opacity: submitting ? 0.6 : 1,
        }}
        onMouseEnter={(e) => {
          if (!submitting) {
            e.currentTarget.style.background = "#f8fafc";
            e.currentTarget.style.borderColor = "#cbd5e1";
          }
        }}
        onMouseLeave={(e) => {
          if (!submitting) {
            e.currentTarget.style.background = "#ffffff";
            e.currentTarget.style.borderColor = "#e2e8f0";
          }
        }}
      >
        Cancel
      </button>
      
      <button
        type="button"
        onClick={onSubmit}
        disabled={submitting}
        style={{
          padding: "12px 28px",
          borderRadius: "12px",
          border: "none",
          background: style.background,
          color: style.color,
          fontSize: "0.95rem",
          fontWeight: "500",
          cursor: submitting ? "not-allowed" : "pointer",
          transition: "all 0.2s ease",
          opacity: submitting ? 0.6 : 1,
          display: "flex",
          alignItems: "center",
          gap: "8px",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
        }}
        onMouseEnter={(e) => {
          if (!submitting) {
            e.currentTarget.style.background = style.hover;
            e.currentTarget.style.transform = "translateY(-1px)";
            e.currentTarget.style.boxShadow = "0 6px 16px rgba(0, 0, 0, 0.15)";
          }
        }}
        onMouseLeave={(e) => {
          if (!submitting) {
            e.currentTarget.style.background = style.background;
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.1)";
          }
        }}
      >
        {submitting ? (
          <>
            <span style={{
              display: "inline-block",
              width: "16px",
              height: "16px",
              border: "2px solid rgba(255,255,255,0.3)",
              borderTopColor: "#ffffff",
              borderRadius: "50%",
              animation: "spin 0.6s linear infinite",
            }} />
            Processing...
          </>
        ) : (
          submitText || "Confirm"
        )}
      </button>
    </div>
  );
}

// Export units for use in other components if needed
export { UNITS };