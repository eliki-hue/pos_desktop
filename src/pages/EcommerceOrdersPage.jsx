import { useEffect, useState, useRef } from "react";
import AppLayout from "../components/AppLayout";
import { api } from "../api/client";

/* =========================
   STATUS CONFIG
========================= */
const STATUS_OPTIONS = ["PENDING", "PAID", "PROCESSING", "IN_TRANSIT", "DELIVERED", "CONFLICT", "CANCELLED", "COMPLETED"];

const STATUS_COLORS = {
  pending: { bg: "bg-warning bg-opacity-10", text: "text-warning", dot: "bg-warning" },
  paid: { bg: "bg-success bg-opacity-10", text: "text-success", dot: "bg-success" },
  processing: { bg: "bg-primary bg-opacity-10", text: "text-primary", dot: "bg-primary" },
  "in-transit": { bg: "bg-info bg-opacity-10", text: "text-info", dot: "bg-info" },
  delivered: { bg: "bg-success bg-opacity-10", text: "text-success", dot: "bg-success" },
  completed: { bg: "bg-success bg-opacity-10", text: "text-success", dot: "bg-success" },
  conflict: { bg: "bg-danger bg-opacity-10", text: "text-danger", dot: "bg-danger" },
  cancelled: { bg: "bg-secondary bg-opacity-10", text: "text-secondary", dot: "bg-secondary" },
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

// Transport Charge Modal Component
function TransportChargeModal({ order, onClose, onUpdate, formatCurrency }) {
  const [transportCharge, setTransportCharge] = useState(order.transport_charge || 0);
  const [notes, setNotes] = useState(order.transport_charge_notes || '');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const response = await api.post(
        `/api/ecommerce/orders/${order.order_id}/transport-charge/`,
        { transport_charge: transportCharge, notes: notes }
      );
      
      alert('Transport charge added successfully!');
      onUpdate(response.data.order);
      onClose();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to add transport charge');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', zIndex: 2100
    }} onClick={onClose}>
      <div style={{
        backgroundColor: 'white', borderRadius: 12, width: '90%', maxWidth: 500,
        padding: 24
      }} onClick={(e) => e.stopPropagation()}>
        <h3>🚚 Add Transport Charge</h3>
        <p style={{ color: "#666", marginBottom: 16 }}>Order: {order.order_number}</p>
        
        <div style={{ marginBottom: 16 }}>
          <label>Transport Amount (KES)</label>
          <input
            type="number"
            value={transportCharge}
            onChange={(e) => setTransportCharge(parseFloat(e.target.value) || 0)}
            style={{ width: '100%', padding: 8, marginTop: 4, border: '1px solid #ddd', borderRadius: 4 }}
            min="0"
            step="50"
          />
        </div>
        
        <div style={{ marginBottom: 20 }}>
          <label>Notes (Required)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            style={{ width: '100%', padding: 8, marginTop: 4, border: '1px solid #ddd', borderRadius: 4, minHeight: 80 }}
            placeholder="E.g., Delivery to Westlands - 5km distance"
            required
          />
        </div>
        
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button className="btn outline" onClick={onClose}>Cancel</button>
          <button className="btn" onClick={handleSubmit} disabled={loading || !notes}>
            {loading ? 'Adding...' : 'Add Transport Charge'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Driver Assignment Modal Component
function DriverAssignmentModal({ order, onClose, onAssign, formatCurrency }) {
  const [driverName, setDriverName] = useState('');
  const [driverPhone, setDriverPhone] = useState('');
  const [estimatedTime, setEstimatedTime] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAssign = async () => {
    if (!driverName || !driverPhone) {
      alert('Please fill driver name and phone');
      return;
    }
    
    setLoading(true);
    try {
      const response = await api.post(
        `/api/ecommerce/orders/${order.order_id}/assign-driver/`,
        { 
          driver_name: driverName, 
          driver_phone: driverPhone, 
          estimated_delivery_time: estimatedTime 
        }
      );
      
      alert('Driver assigned successfully!');
      onAssign(response.data.order);
      onClose();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to assign driver');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', zIndex: 2100
    }} onClick={onClose}>
      <div style={{
        backgroundColor: 'white', borderRadius: 12, width: '90%', maxWidth: 500,
        padding: 24
      }} onClick={(e) => e.stopPropagation()}>
        <h3>👨‍✈️ Assign Driver</h3>
        <p style={{ color: "#666", marginBottom: 16 }}>Order: {order.order_number}</p>
        
        <div style={{ marginBottom: 12 }}>
          <label>Driver Name *</label>
          <input
            type="text"
            value={driverName}
            onChange={(e) => setDriverName(e.target.value)}
            style={{ width: '100%', padding: 8, marginTop: 4, border: '1px solid #ddd', borderRadius: 4 }}
            placeholder="Enter driver name"
          />
        </div>
        
        <div style={{ marginBottom: 12 }}>
          <label>Driver Phone *</label>
          <input
            type="tel"
            value={driverPhone}
            onChange={(e) => setDriverPhone(e.target.value)}
            style={{ width: '100%', padding: 8, marginTop: 4, border: '1px solid #ddd', borderRadius: 4 }}
            placeholder="Enter driver phone number"
          />
        </div>
        
        <div style={{ marginBottom: 20 }}>
          <label>Estimated Delivery Time</label>
          <input
            type="datetime-local"
            value={estimatedTime}
            onChange={(e) => setEstimatedTime(e.target.value)}
            style={{ width: '100%', padding: 8, marginTop: 4, border: '1px solid #ddd', borderRadius: 4 }}
          />
        </div>
        
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button className="btn outline" onClick={onClose}>Cancel</button>
          <button className="btn" onClick={handleAssign} disabled={loading}>
            {loading ? 'Assigning...' : 'Assign Driver'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Payment Details Modal Component
function PaymentDetailsModal({ details, onClose, formatCurrency, formatDate }) {
  const [expandedAttempt, setExpandedAttempt] = useState(null);
  
  if (!details) return null;

  const getStatusColor = (status) => {
    switch(status?.toUpperCase()) {
      case 'SUCCESS':
      case 'PAID':
        return { bg: '#d1fae5', color: '#065f46', icon: '✅' };
      case 'FAILED':
        return { bg: '#fee2e2', color: '#991b1b', icon: '❌' };
      case 'PENDING':
        return { bg: '#fef3c7', color: '#92400e', icon: '⏳' };
      case 'TIMEOUT':
        return { bg: '#fed7aa', color: '#9a3412', icon: '⏰' };
      default:
        return { bg: '#f3f4f6', color: '#374151', icon: '❓' };
    }
  };

  const getResultCodeMessage = (code) => {
    const messages = {
      '0': 'Success',
      '1032': 'Request cancelled by user',
      '1037': 'User cancelled the transaction (timeout)',
      '1001': 'Insufficient funds',
      '1003': 'Invalid account',
      '2001': 'Invalid phone number',
      '2002': 'Invalid amount',
      '2003': 'Invalid reference',
      'TIMEOUT': 'Request timed out',
      'ERROR': 'System error'
    };
    return messages[code] || code;
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
        zIndex: 2000,
        padding: 20,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "white",
          borderRadius: 12,
          width: "90%",
          maxWidth: 1000,
          maxHeight: "90vh",
          overflow: "auto",
          boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ 
          padding: "20px 24px", 
          borderBottom: "1px solid #e5e7eb",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          backgroundColor: "#f9fafb",
          borderRadius: "12px 12px 0 0"
        }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>
              💳 Payment History
            </h3>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: "#6b7280" }}>
              Order #{details.order.order_number} - {details.total_attempts} payment attempt(s)
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: 24,
              cursor: "pointer",
              padding: "0 8px",
              color: "#6b7280",
            }}
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: 24 }}>
          {/* Order Summary */}
          <div style={{ marginBottom: 24 }}>
            <h4 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: "#374151" }}>
              🛍️ Order Information
            </h4>
            <div style={{ 
              display: "grid", 
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", 
              gap: 16,
              backgroundColor: "#f9fafb",
              padding: 16,
              borderRadius: 8,
              border: "1px solid #e5e7eb"
            }}>
              <div>
                <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>Order Number</div>
                <div style={{ fontWeight: 600 }}>{details.order.order_number}</div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>Status</div>
                <span style={{
                  display: "inline-block",
                  padding: "4px 12px",
                  borderRadius: 20,
                  fontSize: 12,
                  fontWeight: 500,
                  backgroundColor: details.order.status === 'PAID' ? '#d1fae5' : '#fee2e2',
                  color: details.order.status === 'PAID' ? '#065f46' : '#991b1b',
                }}>
                  {details.order.status}
                </span>
              </div>
              <div>
                <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>Total Amount</div>
                <div style={{ fontSize: 18, fontWeight: 600, color: "#111827" }}>
                  {formatCurrency(details.order.total)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>Customer</div>
                <div>{details.order.customer || 'Guest'}</div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>Phone</div>
                <div>{details.order.phone || 'N/A'}</div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>Order Date</div>
                <div>{formatDate(details.order.created_at)}</div>
              </div>
            </div>
          </div>

          {/* Payment Attempts */}
          <div>
            <h4 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: "#374151" }}>
              💰 Payment Attempts ({details.total_attempts})
            </h4>
            
            {details.payment_attempts.length === 0 ? (
              <div style={{ textAlign: "center", padding: 40, color: "#6b7280" }}>
                No payment attempts recorded for this order
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {details.payment_attempts.map((attempt, attemptIdx) => {
                  const attemptStyle = getStatusColor(attempt.status);
                  const isExpanded = expandedAttempt === attempt.payment_intent_id;
                  
                  return (
                    <div
                      key={attempt.payment_intent_id}
                      style={{
                        border: "1px solid #e5e7eb",
                        borderRadius: 8,
                        overflow: "hidden",
                        transition: "all 0.2s"
                      }}
                    >
                      {/* Attempt Header */}
                      <div
                        style={{
                          padding: "16px",
                          backgroundColor: "#f9fafb",
                          cursor: "pointer",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          borderBottom: isExpanded ? "1px solid #e5e7eb" : "none"
                        }}
                        onClick={() => setExpandedAttempt(isExpanded ? null : attempt.payment_intent_id)}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <span style={{ fontSize: 20 }}>{attemptStyle.icon}</span>
                          <div>
                            <div style={{ fontWeight: 600, marginBottom: 4 }}>
                              Attempt #{attemptIdx + 1} - {formatCurrency(attempt.amount)}
                            </div>
                            <div style={{ fontSize: 12, color: "#6b7280" }}>
                              {formatDate(attempt.created_at)}
                            </div>
                          </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <span style={{
                            padding: "4px 8px",
                            borderRadius: 4,
                            fontSize: 12,
                            fontWeight: 500,
                            backgroundColor: attemptStyle.bg,
                            color: attemptStyle.color,
                          }}>
                            {attempt.status}
                          </span>
                          <span style={{ fontSize: 16, color: "#6b7280" }}>
                            {isExpanded ? '▼' : '▶'}
                          </span>
                        </div>
                      </div>

                      {/* Attempt Details (Expanded) */}
                      {isExpanded && (
                        <div style={{ padding: 16 }}>
                          {/* Attempt Summary */}
                          <div style={{ 
                            display: "grid", 
                            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", 
                            gap: 12,
                            marginBottom: 20,
                            backgroundColor: "#fef3c7",
                            padding: 12,
                            borderRadius: 6
                          }}>
                            <div>
                              <div style={{ fontSize: 11, color: "#6b7280" }}>Payment Intent ID</div>
                              <code style={{ fontSize: 11 }}>{attempt.payment_intent_id}</code>
                            </div>
                            {attempt.receipt_number && (
                              <div>
                                <div style={{ fontSize: 11, color: "#6b7280" }}>Receipt Number</div>
                                <div style={{ fontFamily: "monospace", fontSize: 12 }}>{attempt.receipt_number}</div>
                              </div>
                            )}
                            {attempt.failure_reason && (
                              <div>
                                <div style={{ fontSize: 11, color: "#6b7280" }}>Failure Reason</div>
                                <div style={{ fontSize: 12, color: "#dc2626" }}>⚠️ {attempt.failure_reason}</div>
                              </div>
                            )}
                          </div>

                          {/* Transactions for this attempt */}
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 12, color: "#6b7280" }}>
                              Transaction Details
                            </div>
                            {attempt.transactions.map((tx) => (
                              <div
                                key={tx.id}
                                style={{
                                  marginBottom: 12,
                                  padding: 12,
                                  backgroundColor: "#f9fafb",
                                  borderRadius: 6,
                                  borderLeft: `3px solid ${tx.status === 'SUCCESS' ? '#10b981' : tx.status === 'FAILED' ? '#ef4444' : '#f59e0b'}`
                                }}
                              >
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                                  <strong style={{ fontSize: 13 }}>
                                    {tx.type === 'STK_PUSH' ? '💳 STK Push Request' : '📞 Webhook Callback'}
                                  </strong>
                                  <span style={{ fontSize: 11, color: "#6b7280" }}>{formatDate(tx.created_at)}</span>
                                </div>
                                
                                {tx.result_code && (
                                  <div style={{ fontSize: 12, marginBottom: 4 }}>
                                    <strong>Result:</strong> {tx.result_code}
                                    {tx.result_code !== '0' && ` - ${getResultCodeMessage(tx.result_code)}`}
                                  </div>
                                )}
                                
                                {tx.result_desc && (
                                  <div style={{ fontSize: 12, marginBottom: 8, color: "#6b7280" }}>
                                    {tx.result_desc}
                                  </div>
                                )}
                                
                                {tx.checkout_request_id && (
                                  <details style={{ marginTop: 8 }}>
                                    <summary style={{ fontSize: 11, color: "#3b82f6", cursor: "pointer" }}>
                                      View Full Details
                                    </summary>
                                    <pre style={{
                                      backgroundColor: "#1e293b",
                                      color: "#e2e8f0",
                                      padding: 8,
                                      borderRadius: 4,
                                      overflow: "auto",
                                      maxHeight: 200,
                                      fontSize: 10,
                                      marginTop: 8,
                                      fontFamily: "monospace"
                                    }}>
                                      {JSON.stringify(tx.request_payload || tx.response_payload, null, 2)}
                                    </pre>
                                  </details>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{ 
          padding: "16px 24px", 
          borderTop: "1px solid #e5e7eb",
          backgroundColor: "#f9fafb",
          display: "flex",
          justifyContent: "flex-end",
          borderRadius: "0 0 12px 12px"
        }}>
          <button
            onClick={onClose}
            style={{
              padding: "8px 24px",
              backgroundColor: "#3b82f6",
              color: "white",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
              fontWeight: 500
            }}
          >
            Close
          </button>
        </div>
      </div>
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

  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewMessage, setPreviewMessage] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [currentOrderForWhatsApp, setCurrentOrderForWhatsApp] = useState(null);
  const [loadingWhatsApp, setLoadingWhatsApp] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  // For real-time updates
  const [loadingOrders, setLoadingOrders] = useState({});
  const pollingIntervals = useRef({});
  const [toast, setToast] = useState(null);
  
  // For payment details modal
  const [showPaymentDetails, setShowPaymentDetails] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [loadingPaymentDetails, setLoadingPaymentDetails] = useState(false);
  
  // For transport and driver modals
  const [showTransportModal, setShowTransportModal] = useState(false);
  const [showDriverModal, setShowDriverModal] = useState(false);
  const [selectedOrderForModal, setSelectedOrderForModal] = useState(null);

  /* ========================= HELPERS ========================= */
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const updateOrderStatus = (orderId, newStatus, additionalData = {}) => {
    setOrders(prevOrders => 
      prevOrders.map(order => 
        order.order_id === orderId 
          ? { ...order, status: newStatus, ...additionalData }
          : order
      )
    );
    
    if (selectedOrder?.order_id === orderId) {
      setSelectedOrder(prev => ({ ...prev, status: newStatus, ...additionalData }));
    }
  };

  const startPolling = (orderId) => {
    if (pollingIntervals.current[orderId]) {
      clearInterval(pollingIntervals.current[orderId]);
    }
    
    console.log(`Starting polling for order ${orderId}`);
    
    const timeoutId = setTimeout(() => {
      if (pollingIntervals.current[orderId]) {
        console.log(`Polling timeout for order ${orderId} after 5 minutes`);
        clearInterval(pollingIntervals.current[orderId]);
        delete pollingIntervals.current[orderId];
        
        const order = orders.find(o => o.order_id === orderId);
        if (order && order.status === 'PROCESSING') {
          updateOrderStatus(orderId, 'PENDING');
          showToast(`Payment timeout for order ${order.order_number}. Please retry.`, 'warning');
        }
      }
    }, 300000);
    
    const interval = setInterval(async () => {
      try {
        const response = await api.get(`/api/reports/${orderId}/details/`);
        const order = response.data;
        
        console.log(`Polling order ${orderId}: status = ${order.status}`);
        
        if (order.status !== 'PENDING' && order.status !== 'PROCESSING') {
          console.log(`Order ${orderId} status changed to ${order.status}, stopping polling`);
          clearInterval(pollingIntervals.current[orderId]);
          clearTimeout(timeoutId);
          delete pollingIntervals.current[orderId];
          
          updateOrderStatus(orderId, order.status);
          
          if (order.status === 'PAID') {
            showToast(`Order ${order.order_number} paid successfully!`, 'success');
          } else if (order.status === 'FAILED') {
            showToast(`Order ${order.order_number} payment failed. You can retry.`, 'error');
          }
        }
      } catch (err) {
        console.error(`Polling error for order ${orderId}:`, err);
      }
    }, 2000);
    
    pollingIntervals.current[orderId] = interval;
    pollingIntervals.current[`${orderId}_timeout`] = timeoutId;
  };

  const viewOrderPaymentDetails = async (orderId) => {
    setLoadingPaymentDetails(true);
    try {
      const response = await api.get(`/api/ecommerce/orders/${orderId}/payment-transactions/`);
      setPaymentDetails(response.data);
      setShowPaymentDetails(true);
    } catch (err) {
      console.error("Failed to load payment details:", err);
      alert("Failed to load payment details");
    } finally {
      setLoadingPaymentDetails(false);
    }
  };

  // Transport Charge Functions
  const openTransportModal = (order) => {
    setSelectedOrderForModal(order);
    setShowTransportModal(true);
  };
  
  const handleTransportUpdate = (updatedOrder) => {
    setOrders(prevOrders => 
      prevOrders.map(order => 
        order.order_id === updatedOrder.id 
          ? { 
              ...order, 
              transport_charge: updatedOrder.transport_charge,
              total: updatedOrder.total,
              transport_charge_notes: updatedOrder.transport_charge_notes
            }
          : order
      )
    );
    
    if (selectedOrder?.order_id === updatedOrder.id) {
      setSelectedOrder(prev => ({ 
        ...prev, 
        transport_charge: updatedOrder.transport_charge,
        total: updatedOrder.total,
        transport_charge_notes: updatedOrder.transport_charge_notes
      }));
    }
    
    showToast(`Transport charge updated to ${formatCurrency(updatedOrder.transport_charge)}`, 'success');
  };
  
  // Driver Assignment Functions
  const openDriverModal = (order) => {
    setSelectedOrderForModal(order);
    setShowDriverModal(true);
  };
  
  const handleDriverAssign = (updatedOrder) => {
    setOrders(prevOrders => 
      prevOrders.map(order => 
        order.order_id === updatedOrder.id 
          ? { 
              ...order, 
              driver_name: updatedOrder.driver_name,
              driver_phone: updatedOrder.driver_phone,
              estimated_delivery_time: updatedOrder.estimated_delivery_time
            }
          : order
      )
    );
    
    if (selectedOrder?.order_id === updatedOrder.id) {
      setSelectedOrder(prev => ({ 
        ...prev, 
        driver_name: updatedOrder.driver_name,
        driver_phone: updatedOrder.driver_phone,
        estimated_delivery_time: updatedOrder.estimated_delivery_time
      }));
    }
    
    showToast(`Driver ${updatedOrder.driver_name} assigned`, 'success');
  };
  
  // Driver Receipt Function
  const generateDriverReceipt = async (orderId) => {
    try {
      const response = await api.get(`/api/ecommerce/orders/${orderId}/driver-receipt/print/`);
      const receiptWindow = window.open('', '_blank');
      receiptWindow.document.write(response.data);
      receiptWindow.document.close();
    } catch (err) {
      console.error("Failed to generate driver receipt:", err);
      showToast(err.response?.data?.error || "Failed to generate driver receipt", 'error');
    }
  };

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
      Object.keys(pollingIntervals.current).forEach(key => {
        if (key.includes('_timeout')) {
          clearTimeout(pollingIntervals.current[key]);
        } else {
          clearInterval(pollingIntervals.current[key]);
        }
      });
    };
  }, []);

  /* ========================= ACTIONS ========================= */
  const updateStatus = async (orderId, status) => {
    const originalOrder = orders.find(o => o.order_id === orderId);
    if (!originalOrder) return;
    
    updateOrderStatus(orderId, status);
    
    try {
      await api.patch(`/api/ecommerce/orders/${orderId}/status/`, { status });
      showToast(`Order status updated to ${status}`, 'success');
    } catch (err) {
      updateOrderStatus(orderId, originalOrder.status);
      showToast("Failed to update status", 'error');
    }
  };

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

    // ==============================
    //  UTIL: Phone Normalization
   // ==============================
    const normalizePhone = (phone) => {
      if (!phone) return null;

      let cleaned = phone.replace(/[^0-9]/g, '');

      if (cleaned.startsWith('0')) {
        return '254' + cleaned.slice(1);
      }

      if (cleaned.startsWith('254')) {
        return cleaned;
      }

      return cleaned;
    };


    // ==============================
    //  WHATSAPP SEND FUNCTION
    // ==============================
    const sendToWhatsApp = () => {
      const order = currentOrderForWhatsApp;

      if (!order) return;

      const phoneRaw = order.phone || order.guest_phone;
      const phone = normalizePhone(phoneRaw);

      // Message with transport included
      const message = `
        Hello ${order.customer || order.guest_name || "Customer"},

        Your order ${order.order_number} is confirmed.

        Order Summary:
        Subtotal: KES ${order.subtotal}
        Transport: KES ${order.transport_fee}
        Total: KES ${order.total}

        Pay here:
        ${order.payment_link}

        Or wait for M-Pesa prompt.
        `;

      let finalUrl;

      if (phone) {
        const encodedMessage = encodeURIComponent(message);
        finalUrl = `https://wa.me/${phone}?text=${encodedMessage}`;
      } else {
        // fallback
        finalUrl = order.payment_link;
      }

      // Safe tab handling
      if (whatsappWindowRef.current && !whatsappWindowRef.current.closed) {
        whatsappWindowRef.current.location.replace(finalUrl);
        whatsappWindowRef.current.focus();
      } else {
        whatsappWindowRef.current = window.open(finalUrl, "_blank");
      }

      setPreviewOpen(false);
      setIsEditing(false);
    };
  }  

// ==============================
// STK PUSH FUNCTION
// ==============================
const sendSTK = async (order) => {
  //  Prevent duplicate clicks
  if (loadingOrders[order.order_id]) return;

  const phone = normalizePhone(order.phone || order.guest_phone);

  if (!phone) {
    showToast("Invalid phone number", "error");
    return;
  }

  setLoadingOrders(prev => ({
    ...prev,
    [order.order_id]: true
  }));

  updateOrderStatus(order.order_id, 'PROCESSING');

  try {
    await api.post("/api/ecommerce/payments/stk-push/", {
      customer_phone: phone,
      order_number: order.order_number,
      order_id: order.order_id,
      customer_name: order.customer || order.guest_name,
      amount: order.total   // includes transport
    });

    startPolling(order.order_id);

    showToast(
      `STK Push sent for KES ${order.total}. Check your phone.`,
      "success"
    );

  } catch (err) {
    console.error("STK push failed:", err);

    updateOrderStatus(order.order_id, 'PENDING');

    const errorMessage =
      err.response?.data?.detail ||
      err.response?.data?.error ||
      "STK push failed";

    showToast(errorMessage, "error");

  } finally {
    setLoadingOrders(prev => ({
      ...prev,
      [order.order_id]: false
    }));
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
    (o) => o.status?.toLowerCase() === "paid" || o.status?.toLowerCase() === "completed"
  ).length;

  return (
    <AppLayout title="Ecommerce Orders" subtitle="Manage and track all ecommerce orders">
      {/* Toast Notification */}
      {toast && (
        <div style={{
          position: 'fixed',
          top: 20,
          right: 20,
          zIndex: 9999,
          padding: '12px 24px',
          borderRadius: 8,
          backgroundColor: toast.type === 'success' ? '#10b981' : '#ef4444',
          color: 'white',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          animation: 'slideIn 0.3s ease-out'
        }}>
          {toast.message}
        </div>
      )}

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
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button className={`btn ${filter === "all" ? "" : "outline"}`} onClick={() => setFilter("all")}>All</button>
          
          <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
            <span style={{ fontSize: 12, color: "#6b7280", paddingRight: 4 }}>Payment:</span>
            <button className={`btn ${filter === "pending" ? "" : "outline"}`} onClick={() => setFilter("pending")} style={{ fontSize: 12, padding: "4px 12px" }}>Pending</button>
            <button className={`btn ${filter === "paid" ? "" : "outline"}`} onClick={() => setFilter("paid")} style={{ fontSize: 12, padding: "4px 12px" }}>Paid</button>
          </div>

          <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
            <span style={{ fontSize: 12, color: "#6b7280", paddingRight: 4 }}>Delivery:</span>
            <button className={`btn ${filter === "processing" ? "" : "outline"}`} onClick={() => setFilter("processing")} style={{ fontSize: 12, padding: "4px 12px" }}>Processing</button>
            <button className={`btn ${filter === "in-transit" ? "" : "outline"}`} onClick={() => setFilter("in-transit")} style={{ fontSize: 12, padding: "4px 12px" }}>In-Transit</button>
            <button className={`btn ${filter === "delivered" ? "" : "outline"}`} onClick={() => setFilter("delivered")} style={{ fontSize: 12, padding: "4px 12px" }}>Delivered</button>
            <button className={`btn ${filter === "completed" ? "" : "outline"}`} onClick={() => setFilter("completed")} style={{ fontSize: 12, padding: "4px 12px" }}>Completed</button>
          </div>

          <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
            <span style={{ fontSize: 12, color: "#6b7280", paddingRight: 4 }}>Issues:</span>
            <button className={`btn ${filter === "conflict" ? "" : "outline"}`} onClick={() => setFilter("conflict")} style={{ fontSize: 12, padding: "4px 12px", color: "#dc2626" }}>Conflict</button>
            <button className={`btn ${filter === "cancelled" ? "" : "outline"}`} onClick={() => setFilter("cancelled")} style={{ fontSize: 12, padding: "4px 12px", color: "#6b7280" }}>Cancelled</button>
          </div>
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
        <table className="table" style={{ minWidth: 1200 }}>
          <thead>
            <tr>
              <th>Order #</th>
              <th>Customer</th>
              <th>Phone</th>
              <th>Items</th>
              <th>Delivery</th>
              <th>Total</th>
              <th>Status</th>
              <th>Driver</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {loading && (
              <tr><td colSpan="10" style={{ textAlign: "center", padding: 24 }}>Loading orders...</td></tr>
            )}

            {!loading && filteredOrders.length === 0 && (
              <tr><td colSpan="10" style={{ textAlign: "center", padding: 24 }}>No orders match your filters</td></tr>
            )}

            {filteredOrders.map((order) => {
              const statusStyle = getStatusStyle(order.status);
              const isLoading = loadingOrders[order.order_id];

              return (
                <tr key={order.order_id}>
                  <td>
                    <strong>{order.order_number}</strong>
                    <div style={{ fontSize: 12, color: "#666" }}>ID: {order.order_id}</div>
                  </td>
                  <td>{order.customer || "Guest"}</td>
                  <td>{order.phone || order.guest_phone || "—"}</td>
                  <td>{order.items || 0} items ({order.quantity || 0} qty)</td>
                  <td>
                    {order.transport_charge ? formatCurrency(order.transport_charge) : '—'}
                    {order.transport_charge_notes && (
                      <div style={{ fontSize: 10, color: "#6b7280" }}>{order.transport_charge_notes.substring(0, 20)}...</div>
                    )}
                  </td>
                  <td><strong>{formatCurrency(order.total)}</strong></td>
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
                      disabled={order.status === 'PROCESSING'}
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </td>
                  <td>
                    {order.driver.name ? (
                      <div>
                        <div>{order.driver.name}</div>
                        <div style={{ fontSize: 11, color: "#666" }}>{order.driver.phone}</div>
                      </div>
                    ) : (
                      <span style={{ color: "#999" }}>Not assigned</span>
                    )}
                  </td>
                  <td style={{ fontSize: 14 }}>{order.created_at ? formatDate(order.created_at) : "—"}</td>
                  <td>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <button className="btn" onClick={() => loadOrderDetails(order.order_id)}>View</button>
                      
                      <button className="btn outline" onClick={() => viewOrderPaymentDetails(order.order_id)} disabled={loadingPaymentDetails} style={{ fontSize: 12, padding: "4px 8px" }} title="Payment History">
                        📋 Log
                      </button>
                      
                      {order.status === "PENDING" && (
                        <button className="btn outline" onClick={() => openTransportModal(order)} style={{ fontSize: 12, padding: "4px 8px", backgroundColor: "#fef3c7" }} title="Add Transport Charge">
                          🚚 Add Delivery
                        </button>
                      )}
                      
                      {(order.status === "PAID" || order.status === "PROCESSING") && (
                        <button className="btn outline" onClick={() => openDriverModal(order)} style={{ fontSize: 12, padding: "4px 8px", backgroundColor: "#dbeafe" }} title="Assign Driver">
                          👨‍✈️ Assign Driver
                        </button>
                      )}
                      
                      {order.driver_name && (
                        <button className="btn outline" onClick={() => generateDriverReceipt(order.order_id)} style={{ fontSize: 12, padding: "4px 8px" }} title="Driver Receipt">
                          🧾 Receipt
                        </button>
                      )}
                      
                      {order.status === "PENDING" && (
                        <>
                          <button className="btn" onClick={() => openWhatsAppPreview(order)} disabled={loadingWhatsApp}>
                            {loadingWhatsApp && currentOrderForWhatsApp?.order_id === order.order_id ? "Loading..." : "WhatsApp"}
                          </button>
                          <button className="btn" onClick={() => sendSTK(order)} disabled={isLoading || order.status === 'PROCESSING'} style={{ opacity: isLoading || order.status === 'PROCESSING' ? 0.6 : 1 }}>
                            {isLoading ? 'Sending...' : order.status === 'PROCESSING' ? 'Processing...' : 'STK'}
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

      {/* MODALS */}
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
          loadingOrders={loadingOrders}
          openTransportModal={openTransportModal}
          openDriverModal={openDriverModal}
          generateDriverReceipt={generateDriverReceipt}
        />
      )}

      {previewOpen && (
        <WhatsAppPreviewModal
          message={previewMessage}
          onMessageChange={setPreviewMessage}
          onClose={() => { setPreviewOpen(false); setIsEditing(false); }}
          onSend={sendWhatsAppWithMessage}
          order={currentOrderForWhatsApp}
          formatCurrency={formatCurrency}
          isEditing={isEditing}
          setIsEditing={setIsEditing}
        />
      )}

      {showPaymentDetails && (
        <PaymentDetailsModal
          details={paymentDetails}
          onClose={() => { setShowPaymentDetails(false); setPaymentDetails(null); }}
          formatCurrency={formatCurrency}
          formatDate={formatDate}
        />
      )}

      {showTransportModal && selectedOrderForModal && (
        <TransportChargeModal
          order={selectedOrderForModal}
          onClose={() => { setShowTransportModal(false); setSelectedOrderForModal(null); }}
          onUpdate={handleTransportUpdate}
          formatCurrency={formatCurrency}
        />
      )}

      {showDriverModal && selectedOrderForModal && (
        <DriverAssignmentModal
          order={selectedOrderForModal}
          onClose={() => { setShowDriverModal(false); setSelectedOrderForModal(null); }}
          onAssign={handleDriverAssign}
          formatCurrency={formatCurrency}
        />
      )}

      <style>
        {`
          .grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
          @media (max-width: 768px) { .grid-4 { grid-template-columns: repeat(2, 1fr); } }
          @media (max-width: 480px) { .grid-4 { grid-template-columns: 1fr; } }
          .btn.outline { background: white; border: 1px solid #ddd; }
          .btn.outline:hover { background: #f5f5f5; }
          @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
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
  loadingWhatsApp,
  loadingOrders
}) {
  if (!order) return null;

  const statusStyle = getStatusStyle(order.status);
  const isLoading = loadingOrders?.[order.order_id];

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
                      disabled={order.status === 'PROCESSING'}
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
                  <button 
                    className="btn" 
                    onClick={() => sendSTK(order)}
                    disabled={isLoading || order.status === 'PROCESSING'}
                  >
                    {isLoading ? 'Sending...' : order.status === 'PROCESSING' ? 'Processing...' : '💳 Send STK Push'}
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
          {/* Message Preview */}
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

          {/* Quick Insert Buttons */}
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