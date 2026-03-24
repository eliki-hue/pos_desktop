import { useEffect, useState, useRef } from "react";
import AppLayout from "../components/AppLayout";
import { api } from "../api/client";

/* =========================
   STATUS CONFIG
========================= */
const STATUS_OPTIONS = ["PENDING", "PAID", "CANCELLED", "FULFILLED"];

const STATUS_COLORS = {
  pending: { bg: "bg-warning bg-opacity-10", text: "text-warning", dot: "bg-warning" },
  paid: { bg: "bg-success bg-opacity-10", text: "text-success", dot: "bg-success" },
  fulfilled: { bg: "bg-info bg-opacity-10", text: "text-info", dot: "bg-info" },
  cancelled: { bg: "bg-danger bg-opacity-10", text: "text-danger", dot: "bg-danger" },
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
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const whatsappWindowRef = useRef(null);
  const whatsappTabId = useRef(null);

  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewMessage, setPreviewMessage] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [currentOrderForWhatsApp, setCurrentOrderForWhatsApp] = useState(null);
  const [loadingWhatsApp, setLoadingWhatsApp] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  /* ========================= LOAD ========================= */
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

    return () => {
      if (whatsappWindowRef.current && !whatsappWindowRef.current.closed) {
        whatsappWindowRef.current.close();
      }
    };
  }, []);

  /* ========================= ACTIONS ========================= */
  const updateStatus = async (orderId, status) => {
    try {
      await api.patch(`/api/ecommerce/orders/${orderId}/status/`, { status });

      setOrders((prev) =>
        prev.map((o) =>
          o.order_id === orderId ? { ...o, status } : o
        )
      );

      if (selectedOrder?.order_id === orderId) {
        setSelectedOrder((prev) => ({ ...prev, status }));
      }
    } catch {
      alert("Failed to update status");
    }
  };

  // ✅ FIXED: PREVIEW ONLY (NO PAYMENT CREATION)
  const generateWhatsAppLink = async (order) => {
    setLoadingWhatsApp(true);

    try {
      const res = await api.post(
        `/api/ecommerce/orders/${order.order_id}/preview-message/`
      );

      if (res.data && res.data.whatsapp_url) {
        return {
          url: res.data.whatsapp_url,
          message: extractMessageFromUrl(res.data.whatsapp_url),
          paymentLink: null,
        };
      }

      throw new Error("No WhatsApp URL returned");
    } catch (err) {
      console.error("Failed to get WhatsApp URL:", err);

      const phone = order.phone || order.guest_phone;

      if (phone) {
        const fallbackMessage = `Hello ${order.customer || "Customer"},

Your order ${order.order_number} is confirmed.

Total: ${formatCurrency(order.total)}

Thank you for shopping with us!`;

        const encodedMessage = encodeURIComponent(fallbackMessage);
        const fallbackUrl = `https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${encodedMessage}`;

        return {
          url: fallbackUrl,
          message: fallbackMessage,
          paymentLink: null,
        };
      }

      throw new Error("No phone number available");
    } finally {
      setLoadingWhatsApp(false);
    }
  };

  const extractMessageFromUrl = (url) => {
    try {
      const urlObj = new URL(url);
      const encodedMessage = urlObj.searchParams.get('text');
      if (encodedMessage) {
        return decodeURIComponent(encodedMessage);
      }
    } catch (e) {
      console.error("Failed to extract message from URL:", e);
    }
    return "";
  };

  const openWhatsAppPreview = async (order) => {
    setCurrentOrderForWhatsApp(order);
    setIsEditing(false);
    setLoadingWhatsApp(true);

    try {
      const { url, message } = await generateWhatsAppLink(order);
      setPreviewUrl(url);
      setPreviewMessage(message);
      setPreviewOpen(true);
    } catch (err) {
      alert(err.message || "Failed to generate WhatsApp message");
    } finally {
      setLoadingWhatsApp(false);
    }
  };

  // ✅ FIXED: PAYMENT CREATED ONLY HERE
  const sendWhatsAppWithMessage = async () => {
    if (!previewUrl) {
      alert("No WhatsApp URL available");
      return;
    }

    try {
      await api.post(
        `/api/ecommerce/orders/${currentOrderForWhatsApp.order_id}/confirm-send/`,
        {
          message: previewMessage,
        }
      );
    } catch (err) {
      console.error("Failed to confirm order:", err);
      alert("Failed to confirm order");
      return;
    }

    const phone = currentOrderForWhatsApp?.phone || currentOrderForWhatsApp?.guest_phone;
    let finalUrl;

    if (phone) {
      const encodedMessage = encodeURIComponent(previewMessage);
      finalUrl = `https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${encodedMessage}`;
    } else {
      finalUrl = previewUrl;
    }

    if (whatsappWindowRef.current && !whatsappWindowRef.current.closed) {
      whatsappWindowRef.current.location.href = finalUrl;
      whatsappWindowRef.current.focus();
    } else {
      whatsappWindowRef.current = window.open(finalUrl, "whatsapp_tab");
    }

    setPreviewOpen(false);
    setIsEditing(false);
  };

  const sendSTK = async (order) => {
    try {
      await api.post("/api/ecommerce/payments/stk-push/", {
        customer_phone: order.phone || order.guest_phone,
        order_number: order.order_number,order_id: order.order_id,
        customer_name :order.customer
      });
      alert("STK Push sent successfully");
    } catch {
      alert("STK push failed");
    }
  };

  /* =========================
     HELPERS
  ========================= */
  const formatCurrency = (value) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "KES",
      minimumFractionDigits: 2,
    }).format(value || 0);

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

  const getStatusStyle = (status) => {
    const key = status?.toLowerCase() || "default";
    return STATUS_COLORS[key] || STATUS_COLORS.default;
  };

  /* =========================
     FILTER
  ========================= */
  const filteredOrders = orders.filter((order) => {
    if (filter !== "all" && order.status?.toLowerCase() !== filter) {
      return false;
    }

    if (search) {
      const s = search.toLowerCase();
      return (
        order.order_number?.toLowerCase().includes(s) ||
        order.customer?.toLowerCase().includes(s) ||
        order.branch?.toLowerCase().includes(s) ||
        order.phone?.toLowerCase().includes(s) ||
        order.guest_phone?.toLowerCase().includes(s)
      );
    }

    return true;
  });

  /* =========================
     STATS
  ========================= */
  const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
  const totalOrders = orders.length;
  const pendingOrders = orders.filter(
    (o) => o.status?.toLowerCase() === "pending"
  ).length;
  const completedOrders = orders.filter(
    (o) => o.status?.toLowerCase() === "paid" || o.status?.toLowerCase() === "fulfilled"
  ).length;

  return (
    <AppLayout title="Ecommerce Orders" subtitle="Manage and track all ecommerce orders">
      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <strong>Orders</strong>
        <button className="btn" onClick={loadOrders} disabled={loading}>
          ↻ Refresh
        </button>
      </div>

      {/* STATS */}
      <div className="grid-4" style={{ marginTop: 16, marginBottom: 24 }}>
        <StatCard label="Total Orders" value={totalOrders} />
        <StatCard label="Completed" value={completedOrders} />
        <StatCard label="Pending" value={pendingOrders} />
        <StatCard label="Total Revenue" value={formatCurrency(totalRevenue)} />
      </div>

      {/* FILTERS */}
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
            className={`btn ${filter === "paid" ? "" : "outline"}`}
            onClick={() => setFilter("paid")}
          >
            Paid
          </button>
          <button
            className={`btn ${filter === "fulfilled" ? "" : "outline"}`}
            onClick={() => setFilter("fulfilled")}
          >
            Fulfilled
          </button>
          <button
            className={`btn ${filter === "cancelled" ? "" : "outline"}`}
            onClick={() => setFilter("cancelled")}
          >
            Cancelled
          </button>
        </div>

        <input
          type="text"
          placeholder="Search by order #, customer, branch, phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ padding: "6px 12px", border: "1px solid #ddd", borderRadius: 4, width: 300 }}
        />
      </div>

      {/* TABLE */}
      <div className="card" style={{ marginTop: 12, overflowX: "auto" }}>
        <table className="table" style={{ minWidth: 1000 }}>
          <thead>
            <tr>
              <th>Order #</th>
              <th>Customer</th>
              <th>Phone</th>
              <th>Branch</th>
              <th>Items</th>
              <th>Qty</th>
              <th>Total</th>
              <th>Status</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {loading && (
              <tr>
                <td colSpan="10" style={{ textAlign: "center", padding: 24 }}>
                  Loading orders...
                </td>
              </tr>
            )}

            {!loading && filteredOrders.length === 0 && (
              <tr>
                <td colSpan="10" style={{ textAlign: "center", padding: 24 }}>
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
                  <td>{order.customer || "Guest"}</td>
                  <td>{order.phone || order.guest_phone || "—"}</td>
                  <td>{order.branch || "—"}</td>
                  <td>{order.items || 0}</td>
                  <td>{order.quantity || 0}</td>
                  <td>
                    <strong>{formatCurrency(order.total)}</strong>
                  </td>
                  <td>
                    <select
                      value={order.status}
                      onChange={(e) => updateStatus(order.order_id, e.target.value)}
                      style={{
                        padding: "4px 8px",
                        borderRadius: 4,
                        border: "1px solid #ddd",
                        backgroundColor: statusStyle.bg?.replace("bg-", "").replace(" bg-opacity-10", "") || "#fff",
                        color: statusStyle.text?.replace("text-", "") || "#000",
                        fontSize: 12,
                      }}
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td style={{ fontSize: 14 }}>
                    {order.created_at ? formatDate(order.created_at) : "—"}
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <button
                        className="btn"
                        onClick={() => loadOrderDetails(order.order_id)}
                      >
                        View
                      </button>

                      {order.status === "PENDING" && (
                        <>
                          <button
                            className="btn"
                            onClick={() => openWhatsAppPreview(order)}
                            disabled={loadingWhatsApp}
                          >
                            {loadingWhatsApp && currentOrderForWhatsApp?.order_id === order.order_id 
                              ? "Loading..." 
                              : "WhatsApp"}
                          </button>
                          <button
                            className="btn"
                            onClick={() => sendSTK(order)}
                          >
                            STK
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* MODAL */}
      {selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          loading={loadingDetails}
          onClose={() => setSelectedOrder(null)}
          formatCurrency={formatCurrency}
          formatDate={formatDate}
          getStatusStyle={getStatusStyle}
          updateStatus={updateStatus}
          openWhatsAppPreview={openWhatsAppPreview}
          sendSTK={sendSTK}
          STATUS_OPTIONS={STATUS_OPTIONS}
          loadingWhatsApp={loadingWhatsApp}
        />
      )}

      {/* WhatsApp Preview Modal */}
      {previewOpen && (
        <WhatsAppPreviewModal
          message={previewMessage}
          onMessageChange={setPreviewMessage}
          onClose={() => {
            setPreviewOpen(false);
            setIsEditing(false);
          }}
          onSend={sendWhatsAppWithMessage}
          order={currentOrderForWhatsApp}
          formatCurrency={formatCurrency}
          isEditing={isEditing}
          setIsEditing={setIsEditing}
        />
      )}

      {/* CSS STYLES */}
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

/* =========================
   ORDER DETAILS MODAL
========================= */
function OrderDetailsModal({ 
  order, 
  loading, 
  onClose, 
  formatCurrency, 
  formatDate, 
  getStatusStyle, 
  updateStatus,
  openWhatsAppPreview,
  sendSTK,
  STATUS_OPTIONS,
  loadingWhatsApp
}) {
  if (!order) return null;

  const statusStyle = getStatusStyle(order.status);

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
        {/* Modal Header */}
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
              {/* Order Summary Stats */}
              <div className="grid-4" style={{ marginBottom: 24 }}>
                <StatCard label="Order #" value={order.order_number} />
                <StatCard label="Customer" value={order.customer || "Guest"} />
                <StatCard label="Phone" value={order.phone || order.guest_phone || "—"} />
                <StatCard label="Branch" value={order.branch || "—"} />
                <StatCard 
                  label="Status" 
                  value={
                    <select
                      value={order.status}
                      onChange={(e) => updateStatus(order.order_id, e.target.value)}
                      style={{
                        padding: "6px 12px",
                        borderRadius: 4,
                        border: "1px solid #ddd",
                        backgroundColor: statusStyle.bg?.replace("bg-", "").replace(" bg-opacity-10", "") || "#fff",
                        color: statusStyle.text?.replace("text-", "") || "#000",
                        fontSize: 14,
                        fontWeight: 500,
                        width: "100%",
                      }}
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
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

              {/* Action Buttons */}
              {order.status === "PENDING" && (
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
                  <button 
                    className="btn" 
                    onClick={() => openWhatsAppPreview(order)}
                    disabled={loadingWhatsApp}
                  >
                    {loadingWhatsApp ? "Loading..." : "📱 Send WhatsApp"}
                  </button>
                  <button className="btn" onClick={() => sendSTK(order)}>
                    💳 Send STK Push
                  </button>
                </div>
              )}

              {order.status !== "PENDING" && (
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
                  <button className="btn" onClick={() => {
                    window.print();
                  }}>
                    🖨️ Print Invoice
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* =========================
   WHATSAPP PREVIEW MODAL
========================= */
function WhatsAppPreviewModal({ message, onMessageChange, onClose, onSend, order, formatCurrency, isEditing, setIsEditing }) {
  const [editMessage, setEditMessage] = useState(message);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    setEditMessage(message);
  }, [message]);

  const handleSend = () => {
    setIsSending(true);
    onMessageChange(editMessage);
    onSend();
    setIsSending(false);
  };

  const toggleEdit = () => {
    setIsEditing(!isEditing);
  };

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
        zIndex: 1100,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "white",
          borderRadius: 8,
          width: "90%",
          maxWidth: 600,
          maxHeight: "90vh",
          overflow: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: 16,
            borderBottom: "1px solid #eee",
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: 18 }}>WhatsApp Message Preview</h3>
            <p style={{ margin: "4px 0 0", fontSize: 12, color: "#666" }}>
              Order: {order?.order_number} | Customer: {order?.customer || "Guest"}
            </p>
          </div>
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
          {/* Message Preview - Always visible */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <label style={{ fontWeight: 500 }}>Message Preview:</label>
              <button
                className="btn outline"
                onClick={toggleEdit}
                style={{ fontSize: 12, padding: "4px 12px" }}
              >
                {isEditing ? "Cancel Edit" : "✏️ Edit Message"}
              </button>
            </div>
            
            {isEditing ? (
              <textarea
                value={editMessage}
                onChange={(e) => setEditMessage(e.target.value)}
                style={{
                  width: "100%",
                  padding: 12,
                  border: "1px solid #ddd",
                  borderRadius: 4,
                  fontSize: 13,
                  fontFamily: "monospace",
                  minHeight: 250,
                  resize: "vertical",
                  lineHeight: 1.5,
                }}
                placeholder="Edit your WhatsApp message here..."
              />
            ) : (
              <div
                style={{
                  backgroundColor: "#DCF8C6",
                  borderRadius: 8,
                  padding: 12,
                  maxHeight: 250,
                  overflow: "auto",
                  whiteSpace: "pre-wrap",
                  fontFamily: "monospace",
                  fontSize: 13,
                  lineHeight: 1.5,
                }}
              >
                {editMessage}
              </div>
            )}
          </div>

          {/* Order Summary */}
          <div
            style={{
              backgroundColor: "#f5f5f5",
              borderRadius: 4,
              padding: 12,
              marginBottom: 16,
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 8 }}>
              Order Summary:
            </div>
            <div style={{ fontSize: 12, color: "#666" }}>
              <div><strong>Order #:</strong> {order?.order_number}</div>
              <div><strong>Customer:</strong> {order?.customer || "Guest"}</div>
              <div><strong>Phone:</strong> {order?.phone || order?.guest_phone || "—"}</div>
              <div><strong>Total:</strong> {formatCurrency(order?.total)}</div>
              <div><strong>Items:</strong> {order?.items || 0} items ({order?.quantity || 0} units)</div>
            </div>
          </div>

          {/* Quick Insert Buttons - Only show when editing */}
          {isEditing && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 8 }}>
                Quick Insert:
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button
                  className="btn outline"
                  onClick={() => setEditMessage(prev => `${prev}\n\nTotal: ${formatCurrency(order?.total)}`)}
                  style={{ fontSize: 12, padding: "4px 8px" }}
                >
                  Insert Total
                </button>
                <button
                  className="btn outline"
                  onClick={() => setEditMessage(prev => `${prev}\n\nThank you for your order!`)}
                  style={{ fontSize: 12, padding: "4px 8px" }}
                >
                  Add Thank You
                </button>
                <button
                  className="btn outline"
                  onClick={() => setEditMessage(prev => `${prev}\n\nWe'll notify you once your order is ready.`)}
                  style={{ fontSize: 12, padding: "4px 8px" }}
                >
                  Add Ready Notification
                </button>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 8,
              paddingTop: 16,
              borderTop: "1px solid #eee",
            }}
          >
            <button className="btn outline" onClick={onClose} disabled={isSending}>
              Cancel
            </button>
            <button className="btn" onClick={handleSend} disabled={isSending}>
              {isSending ? "Sending..." : "📱 Send WhatsApp"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}