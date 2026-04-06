// components/orders/OrderDetailsModal.js
import { getStatusStyle } from "../../constants/orderStatus";

// ============================================================
// HELPER FUNCTIONS - Safe data extraction
// ============================================================

const getCustomerName = (order) => {
  if (!order?.customer) return "Guest";
  if (order.customer.full_name) return order.customer.full_name;
  if (order.customer.username) return order.customer.username;
  if (order.customer.guest_name) return order.customer.guest_name;
  return "Guest";
};

const getCustomerPhone = (order) => {
  if (!order?.customer) return "—";
  if (order.customer.phone) return order.customer.phone;
  if (order.customer.guest_phone) return order.customer.guest_phone;
  return "—";
};

const getTotal = (order) => {
  return order?.financial?.total || 0;
};

const getSubtotal = (order) => {
  return order?.financial?.subtotal || 0;
};

const getTransportCharge = (order) => {
  return order?.financial?.transport_charge || 0;
};

const getTax = (order) => {
  return order?.financial?.tax || 0;
};

const getDriverName = (order) => {
  return order?.driver?.name || null;
};

const getDriverPhone = (order) => {
  return order?.driver?.phone || null;
};

const getDriverAssignedAt = (order) => {
  return order?.driver?.assigned_at || null;
};

const getDeliveryAddress = (order) => {
  return order?.delivery?.address || null;
};

const getDeliveryContactName = (order) => {
  return order?.delivery?.contact_name || null;
};

const getDeliveryContactPhone = (order) => {
  return order?.delivery?.contact_phone || null;
};

const getEstimatedDeliveryTime = (order) => {
  return order?.delivery?.estimated_time || null;
};

const getWaybillNumber = (order) => {
  return order?.waybill?.number || null;
};

const getWaybillGeneratedAt = (order) => {
  return order?.waybill?.generated_at || null;
};

const getWaybillGeneratedBy = (order) => {
  return order?.waybill?.generated_by || null;
};

const getPaymentStatus = (order) => {
  return order?.payment?.status || "PENDING";
};

const getPaymentAmount = (order) => {
  return order?.payment?.amount || 0;
};

const getMpesaReceiptNumber = (order) => {
  return order?.payment?.mpesa_receipt_number || null;
};

// ============================================================
// MAIN COMPONENT
// ============================================================

function OrderDetailsModal({ 
  order, 
  loading, 
  onClose, 
  formatCurrency, 
  formatDate, 
  updateStatus,
  openWhatsAppPreview,
  sendSTK,
  STATUS_OPTIONS,
  loadingWhatsApp,
  loadingOrders,
  openTransportModal,
  openDriverModal,
  generateDriverReceipt
}) {
  // Early return if no order
  if (!order) return null;
  
  // Safe extraction of nested data
  const status = order.status || "PENDING";
  const statusStyle = getStatusStyle(status);
  const isLoading = loadingOrders?.[order.order_id];
  
  // Check order states
  const isPendingPayment = status === "PENDING";
  const isPaidOrProcessing = status === "PAID" || status === "PROCESSING" || status === "IN_TRANSIT";
  
  // Safe items list
  const items = order.items || [];
  const itemsCount = items.length;
  const totalQuantity = items.reduce((sum, item) => sum + (item.quantity || 0), 0);
  
  // Safe customer info
  const customerName = getCustomerName(order);
  const customerPhone = getCustomerPhone(order);
  
  // Safe financial info
  const subtotal = getSubtotal(order);
  const transportCharge = getTransportCharge(order);
  const tax = getTax(order);
  const total = getTotal(order);
  const transportNotes = order?.financial?.transport_charge_notes || order?.transport_charge_notes;
  
  // Safe driver info
  const driverName = getDriverName(order);
  const driverPhone = getDriverPhone(order);
  const driverAssignedAt = getDriverAssignedAt(order);
  
  // Safe delivery info
  const deliveryAddress = getDeliveryAddress(order);
  const deliveryContactName = getDeliveryContactName(order);
  const deliveryContactPhone = getDeliveryContactPhone(order);
  const estimatedDeliveryTime = getEstimatedDeliveryTime(order);
  
  // Safe waybill info
  const waybillNumber = getWaybillNumber(order);
  const waybillGeneratedAt = getWaybillGeneratedAt(order);
  const waybillGeneratedBy = getWaybillGeneratedBy(order);
  
  // Safe payment info
  const paymentStatus = getPaymentStatus(order);
  const paymentAmount = getPaymentAmount(order);
  const mpesaReceiptNumber = getMpesaReceiptNumber(order);
  
  // Check if driver is assigned
  const hasDriver = !!(driverName || driverPhone);

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
        padding: "20px",
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "white",
          borderRadius: 12,
          width: "90%",
          maxWidth: 900,
          maxHeight: "90vh",
          overflow: "auto",
          boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "20px 24px",
            borderBottom: "1px solid #e5e7eb",
            backgroundColor: "#f9fafb",
            position: "sticky",
            top: 0,
            zIndex: 10,
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>
              Order Details
            </h3>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: "#6b7280" }}>
              Complete order information
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

        {/* Modal Body */}
        <div style={{ padding: "24px" }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: 60, color: "#6b7280" }}>
              Loading order details...
            </div>
          ) : (
            <>
              {/* Order Summary Stats */}
              <div style={{ marginBottom: 24 }}>
                <h4 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: "#374151" }}>
                  📋 Order Summary
                </h4>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                    gap: 16,
                    backgroundColor: "#f9fafb",
                    padding: 16,
                    borderRadius: 8,
                    border: "1px solid #e5e7eb",
                  }}
                >
                  <div>
                    <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>Order Number</div>
                    <div style={{ fontWeight: 600, fontSize: 16 }}>{order.order_number || "N/A"}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>Order ID</div>
                    <div style={{ fontFamily: "monospace", fontSize: 13 }}>{order.order_id || "N/A"}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>Status</div>
                    <select
                      value={status}
                      onChange={(e) => updateStatus(order.order_id, e.target.value)}
                      style={{
                        padding: "6px 12px",
                        borderRadius: 6,
                        border: "1px solid #d1d5db",
                        backgroundColor: statusStyle.bg?.replace("bg-", "").replace(" bg-opacity-10", "") || "#fff",
                        color: statusStyle.text?.replace("text-", "") || "#000",
                        fontSize: 13,
                        fontWeight: 500,
                        width: "100%",
                      }}
                      disabled={status === 'PROCESSING'}
                    >
                      {(STATUS_OPTIONS || []).map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>Order Date</div>
                    <div style={{ fontSize: 14 }}>{order.created_at ? formatDate(order.created_at) : "—"}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>Branch</div>
                    <div style={{ fontSize: 14 }}>{order.branch || "—"}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>Waybill Number</div>
                    <div style={{ fontSize: 13, fontFamily: "monospace", fontWeight: 500 }}>
                      {waybillNumber || "Not generated yet"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Customer Information */}
              <div style={{ marginBottom: 24 }}>
                <h4 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: "#374151" }}>
                  👤 Customer Information
                </h4>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                    gap: 16,
                    backgroundColor: "#f9fafb",
                    padding: 16,
                    borderRadius: 8,
                    border: "1px solid #e5e7eb",
                  }}
                >
                  <div>
                    <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>Customer Name</div>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>{customerName}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>Phone Number</div>
                    <div style={{ fontSize: 14 }}>{customerPhone}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>Delivery Address</div>
                    <div style={{ fontSize: 14 }}>{deliveryAddress || "No address provided"}</div>
                  </div>
                  {(deliveryContactName || deliveryContactPhone) && (
                    <>
                      <div>
                        <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>Delivery Contact</div>
                        <div style={{ fontSize: 14 }}>{deliveryContactName || "—"}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>Delivery Contact Phone</div>
                        <div style={{ fontSize: 14 }}>{deliveryContactPhone || "—"}</div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Financial Summary */}
              <div style={{ marginBottom: 24 }}>
                <h4 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: "#374151" }}>
                  💰 Financial Summary
                </h4>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                    gap: 16,
                    backgroundColor: "#f9fafb",
                    padding: 16,
                    borderRadius: 8,
                    border: "1px solid #e5e7eb",
                  }}
                >
                  <div>
                    <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>Subtotal</div>
                    <div style={{ fontSize: 16, fontWeight: 600 }}>{formatCurrency(subtotal)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>Transport/Delivery Fee</div>
                    <div style={{ fontSize: 16, fontWeight: 600, color: "#f59e0b" }}>
                      {transportCharge ? formatCurrency(transportCharge) : "KES 0.00"}
                    </div>
                    {transportNotes && (
                      <div style={{ fontSize: 11, color: "#6b7280", marginTop: 4 }}>
                        Note: {transportNotes}
                      </div>
                    )}
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>Tax</div>
                    <div style={{ fontSize: 14 }}>{formatCurrency(tax)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>Total Amount</div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: "#10b981" }}>{formatCurrency(total)}</div>
                  </div>
                </div>
              </div>

              {/* Delivery Information */}
              {estimatedDeliveryTime && (
                <div style={{ marginBottom: 24 }}>
                  <h4 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: "#374151" }}>
                    🚚 Delivery Information
                  </h4>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                      gap: 16,
                      backgroundColor: "#f9fafb",
                      padding: 16,
                      borderRadius: 8,
                      border: "1px solid #e5e7eb",
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>Estimated Delivery Time</div>
                      <div style={{ fontSize: 14 }}>{formatDate(estimatedDeliveryTime)}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Driver Information */}
              {hasDriver && (
                <div style={{ marginBottom: 24 }}>
                  <h4 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: "#374151" }}>
                    👨‍✈️ Driver Information
                  </h4>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                      gap: 16,
                      backgroundColor: "#f9fafb",
                      padding: 16,
                      borderRadius: 8,
                      border: "1px solid #e5e7eb",
                    }}
                  >
                    {driverName && (
                      <div>
                        <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>Driver Name</div>
                        <div style={{ fontSize: 14, fontWeight: 500 }}>{driverName}</div>
                      </div>
                    )}
                    {driverPhone && (
                      <div>
                        <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>Driver Phone</div>
                        <div style={{ fontSize: 14 }}>{driverPhone}</div>
                      </div>
                    )}
                    {driverAssignedAt && (
                      <div>
                        <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>Assigned At</div>
                        <div style={{ fontSize: 14 }}>{formatDate(driverAssignedAt)}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Order Items */}
              <div style={{ marginBottom: 24 }}>
                <h4 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: "#374151" }}>
                  📦 Order Items ({itemsCount} items)
                </h4>
                <div className="card" style={{ overflowX: "auto" }}>
                  <table className="table" style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ backgroundColor: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                        <th style={{ padding: "12px", textAlign: "left" }}>Product</th>
                        <th style={{ padding: "12px", textAlign: "center" }}>Quantity</th>
                        <th style={{ padding: "12px", textAlign: "right" }}>Unit Price</th>
                        <th style={{ padding: "12px", textAlign: "right" }}>Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.length > 0 ? (
                        items.map((item, index) => {
                          const productName = item.product_name || item.product || "Unknown Product";
                          const quantity = item.quantity || 0;
                          const unitPrice = item.unit_price || 0;
                          const subtotal = (unitPrice * quantity);
                          return (
                            <tr key={index} style={{ borderBottom: "1px solid #e5e7eb" }}>
                              <td style={{ padding: "12px" }}>
                                <div style={{ fontWeight: 500 }}>{productName}</div>
                                {item.product_sku && <div style={{ fontSize: 11, color: "#6b7280" }}>SKU: {item.product_sku}</div>}
                              </td>
                              <td style={{ padding: "12px", textAlign: "center" }}>{quantity}</td>
                              <td style={{ padding: "12px", textAlign: "right" }}>{formatCurrency(unitPrice)}</td>
                              <td style={{ padding: "12px", textAlign: "right", fontWeight: 500 }}>
                                {formatCurrency(subtotal)}
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan="4" style={{ padding: "40px", textAlign: "center", color: "#6b7280" }}>
                            No items found for this order
                          </td>
                        </tr>
                      )}
                    </tbody>
                    <tfoot style={{ backgroundColor: "#f9fafb", borderTop: "2px solid #e5e7eb" }}>
                      <tr>
                        <td colSpan="3" style={{ padding: "12px", textAlign: "right", fontWeight: 600 }}>
                          Subtotal:
                        </td>
                        <td style={{ padding: "12px", textAlign: "right", fontWeight: 600 }}>
                          {formatCurrency(subtotal)}
                        </td>
                      </tr>
                      {transportCharge > 0 && (
                        <tr>
                          <td colSpan="3" style={{ padding: "12px", textAlign: "right", fontWeight: 600 }}>
                            Delivery Fee:
                          </td>
                          <td style={{ padding: "12px", textAlign: "right", fontWeight: 600, color: "#f59e0b" }}>
                            {formatCurrency(transportCharge)}
                          </td>
                        </tr>
                      )}
                      {tax > 0 && (
                        <tr>
                          <td colSpan="3" style={{ padding: "12px", textAlign: "right", fontWeight: 600 }}>
                            Tax:
                          </td>
                          <td style={{ padding: "12px", textAlign: "right", fontWeight: 600 }}>
                            {formatCurrency(tax)}
                          </td>
                        </tr>
                      )}
                      <tr style={{ borderTop: "1px solid #e5e7eb" }}>
                        <td colSpan="3" style={{ padding: "12px", textAlign: "right", fontWeight: 700, fontSize: 16 }}>
                          Total:
                        </td>
                        <td style={{ padding: "12px", textAlign: "right", fontWeight: 700, fontSize: 16, color: "#10b981" }}>
                          {formatCurrency(total)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Payment Information */}
              {paymentStatus !== "PENDING" && (
                <div style={{ marginBottom: 24 }}>
                  <h4 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: "#374151" }}>
                    💳 Payment Information
                  </h4>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                      gap: 16,
                      backgroundColor: "#f9fafb",
                      padding: 16,
                      borderRadius: 8,
                      border: "1px solid #e5e7eb",
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>Payment Status</div>
                      <div style={{ fontSize: 14, fontWeight: 500, color: paymentStatus === "PAID" ? "#10b981" : "#f59e0b" }}>
                        {paymentStatus}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>Amount Paid</div>
                      <div style={{ fontSize: 14 }}>{formatCurrency(paymentAmount)}</div>
                    </div>
                    {mpesaReceiptNumber && (
                      <div>
                        <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>M-PESA Receipt</div>
                        <div style={{ fontSize: 13, fontFamily: "monospace" }}>{mpesaReceiptNumber}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: 12,
                  marginTop: 24,
                  paddingTop: 20,
                  borderTop: "1px solid #e5e7eb",
                  position: "sticky",
                  bottom: 0,
                  backgroundColor: "white",
                }}
              >
                <button
                  className="btn outline"
                  onClick={onClose}
                  style={{ padding: "8px 20px", cursor: "pointer" }}
                >
                  Close
                </button>

                {isPendingPayment && (
                  <>
                    <button
                      className="btn"
                      onClick={() => openTransportModal(order)}
                      style={{ backgroundColor: "#fef3c7", color: "#92400e", border: "none", padding: "8px 20px", cursor: "pointer" }}
                    >
                      🚚 Add Delivery
                    </button>
                    <button
                      className="btn"
                      onClick={() => openWhatsAppPreview(order)}
                      disabled={loadingWhatsApp}
                      style={{ padding: "8px 20px", cursor: "pointer" }}
                    >
                      {loadingWhatsApp ? "Loading..." : "📱 Send WhatsApp"}
                    </button>
                    <button
                      className="btn"
                      onClick={() => sendSTK(order)}
                      disabled={isLoading || status === 'PROCESSING'}
                      style={{ padding: "8px 20px", cursor: "pointer" }}
                    >
                      {isLoading ? 'Sending...' : status === 'PROCESSING' ? 'Processing...' : '💳 Send STK Push'}
                    </button>
                  </>
                )}

                {isPaidOrProcessing && (
                  <button
                    className="btn"
                    onClick={() => openDriverModal(order)}
                    style={{ backgroundColor: "#dbeafe", color: "#1e40af", border: "none", padding: "8px 20px", cursor: "pointer" }}
                  >
                    👨‍✈️ Assign Driver
                  </button>
                )}

                {hasDriver && (
                  <button
                    className="btn"
                    onClick={() => generateDriverReceipt(order.order_id)}
                    style={{ backgroundColor: "#10b981", color: "white", border: "none", padding: "8px 20px", cursor: "pointer" }}
                  >
                    🧾 Driver Receipt
                  </button>
                )}

                <button
                  className="btn"
                  onClick={() => window.print()}
                  style={{ padding: "8px 20px", cursor: "pointer" }}
                >
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

export default OrderDetailsModal;