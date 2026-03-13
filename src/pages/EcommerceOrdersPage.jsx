import { useEffect, useState } from "react";
import AppLayout from "../components/AppLayout";
import { api } from "../api/client";

// Status badge color mapping
const STATUS_COLORS = {
  pending: { bg: "bg-warning bg-opacity-10", text: "text-warning", dot: "bg-warning" },
  processing: { bg: "bg-info bg-opacity-10", text: "text-info", dot: "bg-info" },
  completed: { bg: "bg-success bg-opacity-10", text: "text-success", dot: "bg-success" },
  cancelled: { bg: "bg-danger bg-opacity-10", text: "text-danger", dot: "bg-danger" },
  refunded: { bg: "bg-secondary bg-opacity-10", text: "text-secondary", dot: "bg-secondary" },
  default: { bg: "bg-light bg-opacity-10", text: "text-dark", dot: "bg-secondary" },
};

function StatCard({ label, value }) {
  return (
    <div className="card">
      <div className="muted">{label}</div>
      <div style={{ fontSize: 22, fontWeight: 900 }}>{value}</div>
    </div>
  );
}

export default function EcommerceOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null); // null | order
  const [loading, setLoading] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const loadOrders = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/reports/ecommerce-orders/");
      setOrders(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Failed loading orders", err);
    } finally {
      setLoading(false);
    }
  };

  const loadOrderDetails = async (id) => {
    setLoadingDetails(true);
    try {
      const res = await api.get(`/api/reports/${id}/details/`);
      setSelectedOrder(res.data);
    } catch (err) {
      console.error("Failed loading order details", err);
    } finally {
      setLoadingDetails(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  // Format currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(value || 0);
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  // Get status badge style
  const getStatusStyle = (status) => {
    const key = status?.toLowerCase() || "default";
    return STATUS_COLORS[key] || STATUS_COLORS.default;
  };

  // Filter orders
  const filteredOrders = orders.filter((order) => {
    if (filter !== "all" && order.status?.toLowerCase() !== filter) {
      return false;
    }
    
    if (search) {
      const searchLower = search.toLowerCase();
      return (
        order.order_number?.toLowerCase().includes(searchLower) ||
        order.customer?.toLowerCase().includes(searchLower) ||
        order.branch?.toLowerCase().includes(searchLower)
      );
    }
    
    return true;
  });

  // Calculate summary stats
  const totalRevenue = orders.reduce((sum, order) => sum + (order.total || 0), 0);
  const totalOrders = orders.length;
  const pendingOrders = orders.filter(
    (order) => order.status?.toLowerCase() === "pending"
  ).length;
  const completedOrders = orders.filter(
    (order) => order.status?.toLowerCase() === "completed"
  ).length;

  return (
    <AppLayout title="Ecommerce Orders" subtitle="Manage and track all ecommerce orders">
      {/* Header with Add button style matching Products page */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <strong>Orders</strong>
        <button className="btn" onClick={loadOrders} disabled={loading}>
          ↻ Refresh
        </button>
      </div>

      {/* Stats Cards using StatCard component */}
      <div className="grid-4" style={{ marginTop: 16, marginBottom: 24 }}>
        <StatCard label="Total Orders" value={totalOrders} />
        <StatCard label="Completed" value={completedOrders} />
        <StatCard label="Pending" value={pendingOrders} />
        <StatCard label="Total Revenue" value={formatCurrency(totalRevenue)} />
      </div>

      {/* Filters and Search */}
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            className={`btn ${filter === "all" ? "" : "outline"}`}
            onClick={() => setFilter("all")}
          >
            All
          </button>
          <button
            className={`btn ${filter === "pending" ? "" : "outline"}`}
            onClick={() => setFilter("pending")}
          >
            Pending
          </button>
          <button
            className={`btn ${filter === "processing" ? "" : "outline"}`}
            onClick={() => setFilter("processing")}
          >
            Processing
          </button>
          <button
            className={`btn ${filter === "completed" ? "" : "outline"}`}
            onClick={() => setFilter("completed")}
          >
            Completed
          </button>
        </div>

        <input
          type="text"
          placeholder="Search orders..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ padding: "6px 12px", border: "1px solid #ddd", borderRadius: 4 }}
        />
      </div>

      {/* Orders Table */}
      <div className="card" style={{ marginTop: 12 }}>
        <table className="table">
          <thead>
            <tr>
              <th>Order #</th>
              <th>Customer</th>
              <th>Branch</th>
              <th>Items</th>
              <th>Qty</th>
              <th>Total</th>
              <th>Status</th>
              <th>Date</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan="9" style={{ textAlign: "center", padding: 24 }}>
                  Loading orders...
                </td>
              </tr>
            )}

            {!loading && filteredOrders.length === 0 && (
              <tr>
                <td colSpan="9" style={{ textAlign: "center", padding: 24 }}>
                  {orders.length === 0 ? "No ecommerce orders found" : "No orders match your filters"}
                </td>
              </tr>
            )}

            {filteredOrders.map((order) => {
              const statusStyle = getStatusStyle(order.status);
              
              return (
                <tr key={order.order_id}>
                  <td>
                    <strong>{order.order_number}</strong>
                    <div style={{ fontSize: 12, color: "#666" }}>ID: {order.order_id}</div>
                  </td>
                  <td>
                    {order.customer || "Guest"}
                    {order.email && <div style={{ fontSize: 12, color: "#666" }}>{order.email}</div>}
                  </td>
                  <td>{order.branch || "—"}</td>
                  <td>{order.items || 0}</td>
                  <td>{order.quantity || 0}</td>
                  <td>
                    <strong>{formatCurrency(order.total)}</strong>
                  </td>
                  <td>
                    <span
                      style={{
                        display: "inline-block",
                        padding: "4px 8px",
                        borderRadius: 4,
                        fontSize: 12,
                        backgroundColor: statusStyle.bg.replace("bg-", "").replace(" bg-opacity-10", ""),
                        color: statusStyle.text.replace("text-", ""),
                      }}
                    >
                      {order.status || "Pending"}
                    </span>
                  </td>
                  <td style={{ fontSize: 14 }}>
                    {order.created_at ? formatDate(order.created_at) : "—"}
                  </td>
                  <td>
                    <button
                      className="btn"
                      onClick={() => loadOrderDetails(order.order_id)}
                    >
                      View
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Order Details Modal - Matching ProductFormModal style */}
      {selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          loading={loadingDetails}
          onClose={() => {
            setSelectedOrder(null);
          }}
          formatCurrency={formatCurrency}
          formatDate={formatDate}
          getStatusStyle={getStatusStyle}
        />
      )}

      {/* Add CSS for grid-4 */}
      <style>
        {`
          .grid-4 {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 16px;
          }
          
          @media (max-width: 768px) {
            .grid-4 {
              grid-template-columns: repeat(2, 1fr);
            }
          }
          
          @media (max-width: 480px) {
            .grid-4 {
              grid-template-columns: 1fr;
            }
          }

          .btn.outline {
            background: white;
            border: 1px solid #ddd;
          }
          .btn.outline:hover {
            background: #f5f5f5;
          }
        `}
      </style>
    </AppLayout>
  );
}

/* ========================================
   ORDER DETAILS MODAL - Matching ProductFormModal style
======================================== */
function OrderDetailsModal({ order, loading, onClose, formatCurrency, formatDate, getStatusStyle }) {
  if (!order) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "white",
          borderRadius: 8,
          width: "90%",
          maxWidth: 700,
          maxHeight: "90vh",
          overflow: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header - matching ProductFormModal */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: 16,
            borderBottom: "1px solid #eee",
          }}
        >
          <h3 style={{ margin: 0, fontSize: 18 }}>Order Details</h3>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: 20,
              cursor: "pointer",
              padding: "0 8px",
            }}
          >
            ×
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: 16 }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: 32 }}>
              Loading order details...
            </div>
          ) : (
            <>
              {/* Order Summary Stats - using StatCard style */}
              <div className="grid-4" style={{ marginBottom: 24 }}>
                <StatCard label="Order #" value={order.order_number} />
                <StatCard label="Customer" value={order.customer || "Guest"} />
                <StatCard label="Branch" value={order.branch || "—"} />
                <StatCard 
                  label="Status" 
                  value={
                    <span
                      style={{
                        display: "inline-block",
                        padding: "4px 8px",
                        borderRadius: 4,
                        fontSize: 14,
                        backgroundColor: getStatusStyle(order.status).bg.replace("bg-", "").replace(" bg-opacity-10", ""),
                        color: getStatusStyle(order.status).text.replace("text-", ""),
                      }}
                    >
                      {order.status || "Pending"}
                    </span>
                  } 
                />
                <StatCard 
                  label="Order Date" 
                  value={order.created_at ? formatDate(order.created_at) : "—"} 
                />
                <StatCard 
                  label="Total Amount" 
                  value={formatCurrency(order.total)} 
                />
              </div>

              {/* Order Items */}
              <h4 style={{ margin: "24px 0 12px", fontSize: 16 }}>Order Items</h4>
              
              {order.items && order.items.length > 0 ? (
                <div className="card">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>Qty</th>
                        <th>Price</th>
                        <th>Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {order.items.map((item, i) => {
                        const subtotal = (item.price || 0) * (item.quantity || 0);
                        return (
                          <tr key={i}>
                            <td>
                              {item.product}
                              {item.sku && (
                                <div style={{ fontSize: 12, color: "#666" }}>SKU: {item.sku}</div>
                              )}
                            </td>
                            <td>{item.quantity}</td>
                            <td>{formatCurrency(item.price)}</td>
                            <td>
                              <strong>{formatCurrency(subtotal)}</strong>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan="3" style={{ textAlign: "right", fontWeight: "bold" }}>
                          Total
                        </td>
                        <td style={{ fontWeight: "bold" }}>
                          {formatCurrency(order.total)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              ) : (
                <p style={{ color: "#666", textAlign: "center", padding: 24 }}>
                  No items found for this order
                </p>
              )}

              {/* Modal Footer with buttons matching ProductFormModal */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: 8,
                  marginTop: 24,
                  paddingTop: 16,
                  borderTop: "1px solid #eee",
                }}
              >
                <button className="btn outline" onClick={onClose}>
                  Close
                </button>
                <button className="btn">
                  🖨️ Print Invoice
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}