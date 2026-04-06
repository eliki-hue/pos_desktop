// components/orders/OrdersTable.js
import { getStatusStyle } from "../../constants/orderStatus";

// Define allowed transitions for each status
const STATUS_TRANSITIONS = {
  "PENDING": ["PAID", "PROCESSING", "CANCELLED", "CONFLICT"],
  // "PENDING_PAYMENT": ["PAID", "PROCESSING", "CANCELLED", "CONFLICT"],
  "PAID": ["PENDING","PROCESSING", "IN_TRANSIT", "CANCELLED", "CONFLICT"],
  "PROCESSING": ["IN_TRANSIT", "DELIVERED", "CANCELLED", "CONFLICT"],
  "IN_TRANSIT": ["DELIVERED", "COMPLETED","CONFLICT"],
  "DELIVERED": ["COMPLETED","CONFLICT"],
  "COMPLETED": ["IN_TRANSIT", "DELIVERED","CONFLICT"],
  "CONFLICT": ["PENDING", "PAID", "PROCESSING", "IN_TRANSIT", "DELIVERED", "COMPLETED", "CANCELLED"],
  "CANCELLED": []
};

function OrdersTable({ 
  orders, 
  loading, 
  onViewOrder, 
  onViewPaymentLog, 
  onAddTransport, 
  onAssignDriver, 
  onPrintReceipt, 
  onOpenWhatsApp, 
  onSendSTK,
  loadingOrders,
  loadingWhatsApp,
  currentOrderForWhatsApp,
  formatCurrency,
  formatDate,
  STATUS_OPTIONS,
  updateStatus
}) {
  
  // Get allowed next statuses for current status
  const getAllowedStatuses = (currentStatus) => {
    return STATUS_TRANSITIONS[currentStatus] || [currentStatus];
  };

  return (
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
            <tr>
              <td colSpan="10" style={{ textAlign: "center", padding: 24 }}>
                Loading orders...
              </td>
            </tr>
          )}
          {!loading && orders.length === 0 && (
            <tr>
              <td colSpan="10" style={{ textAlign: "center", padding: 24 }}>
                No orders match your filters
              </td>
            </tr>
          )}
          {orders.map((order) => {
            const statusStyle = getStatusStyle(order.status);
            const isLoading = loadingOrders[order.order_id];
            const allowedStatuses = getAllowedStatuses(order.status);
            
            // Get customer name safely from nested structure
            const customerName = order.customer || "Guest";
            const customerPhone = order.phone || order.guest_phone || "—";
            
            // Get financial data safely
            const transportCharge = order.financial?.transport_charge || order.transport_charge || 0;
            // const transportNotes = order.financial?.transport_charge_notes || order.address;
            const total = order.financial?.total || order.total || 0;
            
            // Get driver info safely
            const driverName = order.driver.name || "-"
            const driverPhone = order.driver.phone || "-"
            
            return (
              <tr key={order.order_id}>
                <td>
                  <strong>{order.order_number}</strong>
                  <div style={{ fontSize: 12, color: "#666" }}>ID: {order.order_id}</div>
                </td>
                <td>{customerName}</td>
                <td>{customerPhone}</td>
                <td>{order.items || 0} items ({order.quantity || 0} qty)</td>
                <td>
                  {transportCharge ? formatCurrency(transportCharge) : '—'}
                  {/* {transportNotes && (
                    <div style={{ fontSize: 10, color: "#6b7280" }}>
                      {transportNotes.substring(0, 20)}...
                    </div>
                  )} */}
                </td>
                <td><strong>{formatCurrency(total)}</strong></td>
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
                      cursor: "pointer",
                    }}
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option 
                        key={s} 
                        value={s}
                        disabled={!allowedStatuses.includes(s)}
                        style={{
                          opacity: allowedStatuses.includes(s) ? 1 : 0.5,
                          backgroundColor: allowedStatuses.includes(s) ? "white" : "#f3f4f6"
                        }}
                      >
                        {s} {!allowedStatuses.includes(s)}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  {driverName ? (
                    <div>
                      <div>{driverName}</div>
                      <div style={{ fontSize: 11, color: "#666" }}>{driverPhone}</div>
                    </div>
                  ) : (
                    <span style={{ color: "#999" }}>Not assigned</span>
                  )}
                </td>
                <td style={{ fontSize: 14 }}>
                  {order.created_at ? formatDate(order.created_at) : "—"}
                </td>
                <td>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <button className="btn" onClick={() => onViewOrder(order.order_id)}>
                      View
                    </button>
                    <button 
                      className="btn outline" 
                      onClick={() => onViewPaymentLog(order.order_id)} 
                      style={{ fontSize: 12, padding: "4px 8px" }}
                    >
                      📋 Log
                    </button>
                    
                    {order.status === "PENDING"  && (
                      <button 
                        className="btn outline" 
                        onClick={() => onAddTransport(order)} 
                        style={{ fontSize: 12, padding: "4px 8px", backgroundColor: "#fef3c7" }}
                      >
                        🚚 Add Delivery
                      </button>
                    )}
                    
                    {(order.status === "PAID" || order.status === "PROCESSING") && (
                      <button 
                        className="btn outline" 
                        onClick={() => onAssignDriver(order)} 
                        style={{ fontSize: 12, padding: "4px 8px", backgroundColor: "#dbeafe" }}
                      >
                        👨‍✈️ Assign Driver
                      </button>
                    )}
                    
                    {driverName && (
                      <button 
                        className="btn" 
                        onClick={() => onPrintReceipt(order.order_id)} 
                        style={{ fontSize: 12, padding: "4px 8px", backgroundColor: "#10b981", color: "white", border: "none" }}
                      >
                        🧾 Receipt
                      </button>
                    )}
                    
                    {order.status === "PENDING" && (
                      <>
                        <button 
                          className="btn" 
                          onClick={() => onOpenWhatsApp(order)} 
                          disabled={loadingWhatsApp}
                        >
                          {loadingWhatsApp && currentOrderForWhatsApp?.order_id === order.order_id ? "Loading..." : "WhatsApp"}
                        </button>
                        <button 
                          className="btn" 
                          onClick={() => onSendSTK(order)} 
                          disabled={isLoading || order.status === 'PROCESSING'} 
                          style={{ opacity: isLoading || order.status === 'PROCESSING' ? 0.6 : 1 }}
                        >
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
  );
}

export default OrdersTable;