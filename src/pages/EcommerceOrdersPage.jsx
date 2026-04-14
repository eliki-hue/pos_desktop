// pages/EcommerceOrdersPage.js
import { useEffect, useState, useRef } from "react";
import AppLayout from "../components/AppLayout";
import { api } from "../api/client";
import StatCard from "../components/orders/StatCard";
import OrderStatusFilter from "../components/orders/OrderStatusFilter";
import OrdersTable from "../components/orders/OrdersTable";
import OrderDetailsModal from "../components/orders/OrderDetailsModal";
import WhatsAppPreviewModal from "../components/orders/WhatsAppPreviewModal";
import TransportChargeModal from "../components/modals/TransportChargeModal";
import DriverAssignmentModal from "../components/modals/DriverAssignmentModal";
import PaymentDetailsModal from "../components/modals/PaymentDetailsModal";
import { STATUS_OPTIONS } from "../constants/orderStatus";

export default function EcommerceOrdersPage() {
  // ============================================================
  // STATE DECLARATIONS - ALL INITIALIZED TO FALSE/NULL
  // ============================================================
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const whatsappWindowRef = useRef(null);

  // IMPORTANT: These should start as FALSE
  const [previewOpen, setPreviewOpen] = useState(false);  // ← MUST be false
  const [previewMessage, setPreviewMessage] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [currentOrderForWhatsApp, setCurrentOrderForWhatsApp] = useState(null);
  const [loadingWhatsApp, setLoadingWhatsApp] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  const [loadingOrders, setLoadingOrders] = useState({});
  const pollingIntervals = useRef({});
  const [toast, setToast] = useState(null);
  
  const [showPaymentDetails, setShowPaymentDetails] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [loadingPaymentDetails, setLoadingPaymentDetails] = useState(false);
  
  const [showTransportModal, setShowTransportModal] = useState(false);
  const [showDriverModal, setShowDriverModal] = useState(false);
  const [selectedOrderForModal, setSelectedOrderForModal] = useState(null);

  // ============================================================
  // HELPER FUNCTIONS
  // ============================================================
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const formatCurrency = (value) => {
    if (!value && value !== 0) return "KES 0.00";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "KES",
      minimumFractionDigits: 2,
    }).format(value);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const normalizePhone = (phone) => {
  if (!phone) return null;

  let cleaned = phone.replace(/\D/g, '');

  // 07XXXXXXXX → 2547XXXXXXXX
  if (cleaned.startsWith('0')) {
    cleaned = '254' + cleaned.slice(1);
  }

  // 7XXXXXXXX → 2547XXXXXXXX
  if (cleaned.length === 9 && cleaned.startsWith('7')) {
    cleaned = '254' + cleaned;
  }

  // Already correct format → validate
  if (cleaned.startsWith('254') && cleaned.length === 12) {
    return cleaned;
  }

  // Invalid number
  return null;
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

  // ============================================================
  // LOAD ORDERS FUNCTION
  // ============================================================
  const loadOrders = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/reports/ecommerce-orders/");
      setOrders(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Failed loading orders", err);
      showToast("Failed to load orders", "error");
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // POLLING FUNCTION
  // ============================================================
  const startPolling = (orderId) => {
    if (pollingIntervals.current[orderId]) {
      clearInterval(pollingIntervals.current[orderId]);
    }
    
    const timeoutId = setTimeout(() => {
      if (pollingIntervals.current[orderId]) {
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
        
        if (order.status !== 'PENDING' && order.status !== 'PROCESSING') {
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

  // ============================================================
  // ORDER DETAILS
  // ============================================================
  const loadOrderDetails = async (id) => {
    setLoadingDetails(true);
    try {
      const res = await api.get(`/api/reports/${id}/details/`);
      setSelectedOrder(res.data);
    } catch (err) {
      console.error("Failed loading order details", err);
      showToast("Failed to load order details", "error");
    } finally {
      setLoadingDetails(false);
    }
  };

  // ============================================================
  // ORDER ACTIONS
  // ============================================================
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

  const sendSTK = async (order) => {
    if (loadingOrders[order.order_id]) return;

    const phone = normalizePhone(order.phone || order.guest_phone);

    if (!phone) {
      showToast("Invalid phone number", "error");
      return;
    }

    // setLoadingOrders(prev => ({ ...prev, [order.order_id]: true }));
    // updateOrderStatus(order.order_id, 'PROCESSING');

    try {
      await api.post("/api/ecommerce/payments/stk-push/", {
        customer_phone: phone,
        order_number: order.order_number,
        order_id: order.order_id,
        customer_name: order.customer || order.guest_name,
        amount: order.total
      });

      startPolling(order.order_id);
      showToast(`STK Push sent for KES ${order.total}. Check your phone.`, "success");

    } catch (err) {
      console.error("STK push failed:", err);
      updateOrderStatus(order.order_id, 'PENDING');
      const errorMessage = err.response?.data?.detail || err.response?.data?.error || "STK push failed";
      showToast(errorMessage, "error");
    } finally {
      setLoadingOrders(prev => ({ ...prev, [order.order_id]: false }));
    }
  };

  // ============================================================
  // WHATSAPP FUNCTIONS
  // ============================================================
  const generateWhatsAppLink = async (order) => {
    setLoadingWhatsApp(true);
    try {
      const res = await api.post(`/api/ecommerce/orders/${order.order_id}/preview-message/`);
      if (res.data && res.data.whatsapp_url) {
        return {
          url: res.data.whatsapp_url,
          message: extractMessageFromUrl(res.data.whatsapp_url),
        };
      }
      throw new Error("No WhatsApp URL returned");
    } catch (err) {
      console.error("Failed to get WhatsApp URL:", err);
      const phone = order.phone || order.guest_phone;
      if (phone) {
        const fallbackMessage = `Hello ${order.customer || "Customer"},\n\nYour order ${order.order_number} is confirmed.\n\nTotal: ${formatCurrency(order.total)}\n\nThank you for shopping with us!`;
        const encodedMessage = encodeURIComponent(fallbackMessage);
        const fallbackUrl = `https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${encodedMessage}`;
        return { url: fallbackUrl, message: fallbackMessage };
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

  // This function opens the WhatsApp preview modal - ONLY called when clicking WhatsApp button
  const openWhatsAppPreview = async (order) => {
    setCurrentOrderForWhatsApp(order);
    setIsEditing(false);
    setLoadingWhatsApp(true);
    
    try {
      const { url, message } = await generateWhatsAppLink(order);
      setPreviewUrl(url);
      setPreviewMessage(message);
      setPreviewOpen(true);  // This opens the modal - only happens on button click
    } catch (err) {
      alert(err.message || "Failed to generate WhatsApp message");
    } finally {
      setLoadingWhatsApp(false);
    }
  };

  // This sends the message and opens WhatsApp - called from preview modal
  const sendWhatsAppWithMessage = async () => {
    if (!previewUrl && !currentOrderForWhatsApp) {
      alert("No WhatsApp URL available");
      return;
    }

    try {
      if (currentOrderForWhatsApp?.order_id) {
        await api.post(`/api/ecommerce/orders/${currentOrderForWhatsApp.order_id}/confirm-send/`, {
          message: previewMessage,
        }).catch(err => console.error("Failed to confirm order:", err));
      }
    } catch (err) {
      console.error("Failed to confirm order:", err);
    }

    const phone = currentOrderForWhatsApp?.phone || currentOrderForWhatsApp?.guest_phone;
    const normalizedPhone = normalizePhone(phone);
    
    let finalUrl;
    if (normalizedPhone) {
      const encodedMessage = encodeURIComponent(previewMessage);
      finalUrl = `https://wa.me/${normalizedPhone}?text=${encodedMessage}`;
    } else {
      finalUrl = previewUrl;
    }

    // Close modal BEFORE opening WhatsApp
    setPreviewOpen(false);
    setIsEditing(false);

    // Open WhatsApp
    if (whatsappWindowRef.current && !whatsappWindowRef.current.closed) {
      whatsappWindowRef.current.location.href = finalUrl;
      whatsappWindowRef.current.focus();
    } else {
      whatsappWindowRef.current = window.open(finalUrl, "whatsapp_tab");
    }

    showToast("Opening WhatsApp...", "success");
  };

  // ============================================================
  // PAYMENT DETAILS
  // ============================================================
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

  // ============================================================
  // TRANSPORT CHARGE FUNCTIONS
  // ============================================================
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

  // ============================================================
  // DRIVER ASSIGNMENT FUNCTIONS
  // ============================================================
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
              drivername: updatedOrder.driver.name,
              driver_phone: updatedOrder.driver.phone,
              estimated_delivery_time: updatedOrder.estimated_delivery_time
            }
          : order
      )
    );
    
    if (selectedOrder?.order_id === updatedOrder.id) {
      setSelectedOrder(prev => ({ 
        ...prev, 
        driver_name: updatedOrder.driver.name,
        driver_phone: updatedOrder.driver.phone,
        estimated_delivery_time: updatedOrder.estimated_delivery_time
      }));
    }
    
    showToast(`Driver ${updatedOrder.driver.name} assigned`, 'success');
  };

  // ============================================================
  // DRIVER RECEIPT FUNCTION
  // ============================================================
  const generateDriverReceipt = async (orderId) => {
    const order = orders.find(o => o.order_id === orderId);
    if (!order) return;

    if (!order.driver.name) {
      showToast("No driver assigned to this order. Please assign a driver first.", "warning");
      return;
    }

    showToast("Opening receipt...", "info");

    try {
      await api.get(`/api/ecommerce/orders/${orderId}/driver-receipt/`);
      const printUrl = `/api/ecommerce/orders/${orderId}/driver-receipt/print/`;
      const receiptWindow = window.open(printUrl, "_blank");

      if (!receiptWindow) {
        showToast("Please allow popups to print receipt", "error");
        return;
      }

      receiptWindow.onload = () => {
        setTimeout(() => {
          receiptWindow.print();
        }, 500);
      };

      showToast("Receipt opened successfully", "success");

    } catch (err) {
      console.error("Failed to generate receipt:", err);
      const errorMessage = err.response?.data?.error || err.response?.data?.detail || "Failed to generate receipt";
      showToast(errorMessage, "error");
    }
  };

  // ============================================================
  // INITIAL LOAD & CLEANUP
  // ============================================================
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

  // ============================================================
  // FILTER & STATS
  // ============================================================
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

  const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
  const totalOrders = orders.length;
  const pendingOrders = orders.filter(o => o.status?.toLowerCase() === "pending").length;
  const completedOrders = orders.filter(o => o.status?.toLowerCase() === "paid" || o.status?.toLowerCase() === "completed").length;

  // ============================================================
  // RENDER
  // ============================================================
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
          backgroundColor: toast.type === 'success' ? '#10b981' : toast.type === 'error' ? '#ef4444' : toast.type === 'warning' ? '#f59e0b' : '#3b82f6',
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
        <OrderStatusFilter filter={filter} onFilterChange={setFilter} />
        <input
          type="text"
          placeholder="Search by order #, customer, branch, phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ padding: "6px 12px", border: "1px solid #ddd", borderRadius: 4, width: 300 }}
        />
      </div>

      {/* ORDERS TABLE */}
      <OrdersTable 
        orders={filteredOrders}
        loading={loading}
        onViewOrder={loadOrderDetails}
        onViewPaymentLog={viewOrderPaymentDetails}
        onAddTransport={openTransportModal}
        onAssignDriver={openDriverModal}
        onPrintReceipt={generateDriverReceipt}
        onOpenWhatsApp={openWhatsAppPreview}
        onSendSTK={sendSTK}
        loadingOrders={loadingOrders}
        loadingWhatsApp={loadingWhatsApp}
        currentOrderForWhatsApp={currentOrderForWhatsApp}
        formatCurrency={formatCurrency}
        formatDate={formatDate}
        STATUS_OPTIONS={STATUS_OPTIONS}
        updateStatus={updateStatus}
      />

      {/* MODALS - All start closed (show=false) */}
      {selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          loading={loadingDetails}
          onClose={() => setSelectedOrder(null)}
          formatCurrency={formatCurrency}
          formatDate={formatDate}
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

      {/* WhatsApp Preview Modal - Only opens when WhatsApp button is clicked */}
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

      {/* STYLES */}
      <style>
        {`
          .grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
          @media (max-width: 768px) { .grid-4 { grid-template-columns: repeat(2, 1fr); } }
          @media (max-width: 480px) { .grid-4 { grid-template-columns: 1fr; } }
          @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        `}
      </style>
    </AppLayout>
  );
}