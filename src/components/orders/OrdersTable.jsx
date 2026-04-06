// components/orders/OrdersTable.js
import { getStatusStyle } from "../../constants/orderStatus";

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
                    <div style={{ fontSize: 10, color: "#6b7280" }}>
                      {order.transport_charge_notes.substring(0, 20)}...
                    </div>
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
                <td style={{ fontSize: 14 }}>
                  {order.created_at ? formatDate(order.created_at) : "—"}
                </td>
                <td>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <button 
                      className="btn" 
                      onClick={() => onViewOrder(order.order_id)}
                      title="View Order Details"
                    >
                      View
                    </button>
                    
                    <button 
                      className="btn outline" 
                      onClick={() => onViewPaymentLog(order.order_id)} 
                      style={{ fontSize: 12, padding: "4px 8px" }}
                      title="View Payment History"
                    >
                      📋 Log
                    </button>
                    
                    {order.status === "PENDING" && (
                      <button 
                        className="btn outline" 
                        onClick={() => onAddTransport(order)} 
                        style={{ fontSize: 12, padding: "4px 8px", backgroundColor: "#fef3c7" }}
                        title="Add Transport/Delivery Charge"
                      >
                        🚚 Add Delivery
                      </button>
                    )}
                    
                    {(order.status === "PAID" || order.status === "PROCESSING") && (
                      <button 
                        className="btn outline" 
                        onClick={() => onAssignDriver(order)} 
                        style={{ fontSize: 12, padding: "4px 8px", backgroundColor: "#dbeafe" }}
                        title="Assign Driver to Order"
                      >
                        👨‍✈️ Assign Driver
                      </button>
                    )}
                    
                    {order.driver.name && (
                      <button 
                        className="btn" 
                        onClick={() => onPrintReceipt(order.order_id)} 
                        style={{ fontSize: 12, padding: "4px 8px", backgroundColor: "#10b981", color: "white", border: "none" }}
                        title="Print Driver Receipt/Waybill"
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
                          title="Send WhatsApp Message"
                        >
                          {loadingWhatsApp && currentOrderForWhatsApp?.order_id === order.order_id ? "Loading..." : "WhatsApp"}
                        </button>
                        <button 
                          className="btn" 
                          onClick={() => onSendSTK(order)} 
                          disabled={isLoading || order.status === 'PROCESSING'} 
                          style={{ opacity: isLoading || order.status === 'PROCESSING' ? 0.6 : 1 }}
                          title="Send STK Push for Payment"
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