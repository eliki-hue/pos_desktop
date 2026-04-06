// components/modals/TransportChargeModal.js
import { useState } from "react";
import { api } from "../../api/client";

function TransportChargeModal({ order, onClose, onUpdate, formatCurrency }) {
  const [transportCharge, setTransportCharge] = useState(order.transport_charge || 0);
  const [notes, setNotes] = useState(order.transport_charge_notes || '');
  
  // Delivery details state
  const [deliveryAddress, setDeliveryAddress] = useState(order.delivery?.address || '');
  const [deliveryContactName, setDeliveryContactName] = useState(order.delivery?.contact_name || '');
  const [deliveryContactPhone, setDeliveryContactPhone] = useState(order.delivery?.contact_phone || '');
  const [deliveryInstructions, setDeliveryInstructions] = useState(order.delivery?.instructions || '');
  const [estimatedDeliveryTime, setEstimatedDeliveryTime] = useState(order.delivery?.estimated_time || '');
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    
    // Delivery address is required
    if (!deliveryAddress.trim()) {
      newErrors.deliveryAddress = "Delivery address is required";
    }
    
    // Transport charge validation
    if (transportCharge < 0) {
      newErrors.transportCharge = "Transport charge cannot be negative";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    try {
      const response = await api.post(
        `/api/ecommerce/orders/${order.order_id}/transport-charge/`,
        { 
          transport_charge: transportCharge, 
          notes: notes || null,  // Send null if empty
          // Include delivery details
          delivery_address: deliveryAddress,
          delivery_contact_name: deliveryContactName || null,
          delivery_contact_phone: deliveryContactPhone || null,
          delivery_instructions: deliveryInstructions || null,
          estimated_delivery_time: estimatedDeliveryTime || null
        }
      );
      alert('Transport charge and delivery details saved successfully!');
      onUpdate(response.data.order);
      onClose();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to save transport charge');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2100,
        padding: "20px",
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: 12,
          width: '90%',
          maxWidth: 550,
          maxHeight: "90vh",
          overflow: "auto",
          padding: 24,
          boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h3 style={{ margin: 0 }}>🚚 Add Transport & Delivery Details</h3>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: 24,
              cursor: "pointer",
              color: "#6b7280",
            }}
          >
            ×
          </button>
        </div>
        
        <p style={{ color: "#666", marginBottom: 16, fontSize: 13 }}>
          Order: <strong>{order.order_number}</strong> | Customer: <strong>{order.customer?.username || order.customer?.guest_name || "Guest"}</strong>
        </p>

        {/* Transport Charge Section */}
        <div style={{ 
          marginBottom: 20, 
          padding: "12px", 
          backgroundColor: "#fef3c7", 
          borderRadius: 8,
          borderLeft: "3px solid #f59e0b"
        }}>
          <div style={{ fontWeight: 600, marginBottom: 12, color: "#92400e" }}>
            💰 Transport/Delivery Fee
          </div>
          <div>
            <label style={{ display: "block", marginBottom: 6, fontWeight: 500 }}>Amount (KES)</label>
            <input
              type="number"
              value={transportCharge}
              onChange={(e) => setTransportCharge(parseFloat(e.target.value) || 0)}
              style={{ 
                width: '100%', 
                padding: "10px 12px", 
                border: errors.transportCharge ? '1px solid #ef4444' : '1px solid #d1d5db', 
                borderRadius: 6 
              }}
              min="0"
              step="50"
              placeholder="Enter delivery fee"
            />
            {errors.transportCharge && (
              <div style={{ color: "#ef4444", fontSize: 12, marginTop: 4 }}>{errors.transportCharge}</div>
            )}
          </div>
          <div style={{ marginTop: 12 }}>
            <label style={{ display: "block", marginBottom: 6, fontWeight: 500 }}>Notes (Optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              style={{ width: '100%', padding: "10px 12px", border: '1px solid #d1d5db', borderRadius: 6, minHeight: 60 }}
              placeholder="E.g., Delivery to Westlands - 5km distance, Heavy items, etc."
            />
          </div>
        </div>

        {/* Delivery Details Section */}
        <div style={{ 
          marginBottom: 20, 
          padding: "12px", 
          backgroundColor: "#f0fdf4", 
          borderRadius: 8,
          borderLeft: "3px solid #10b981"
        }}>
          <div style={{ fontWeight: 600, marginBottom: 12, color: "#065f46" }}>
            📦 Delivery Details
          </div>
          
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: "block", marginBottom: 6, fontWeight: 500 }}>
              Delivery Address <span style={{ color: "#ef4444" }}>*</span>
            </label>
            <textarea
              value={deliveryAddress}
              onChange={(e) => setDeliveryAddress(e.target.value)}
              style={{ 
                width: '100%', 
                padding: "10px 12px", 
                border: errors.deliveryAddress ? '1px solid #ef4444' : '1px solid #d1d5db', 
                borderRadius: 6, 
                minHeight: 60 
              }}
              placeholder="Full delivery address (required)"
            />
            {errors.deliveryAddress && (
              <div style={{ color: "#ef4444", fontSize: 12, marginTop: 4 }}>{errors.deliveryAddress}</div>
            )}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div>
              <label style={{ display: "block", marginBottom: 6, fontWeight: 500 }}>Contact Name (Optional)</label>
              <input
                type="text"
                value={deliveryContactName}
                onChange={(e) => setDeliveryContactName(e.target.value)}
                style={{ width: '100%', padding: "10px 12px", border: '1px solid #d1d5db', borderRadius: 6 }}
                placeholder="Recipient name"
              />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: 6, fontWeight: 500 }}>Contact Phone (Optional)</label>
              <input
                type="tel"
                value={deliveryContactPhone}
                onChange={(e) => setDeliveryContactPhone(e.target.value)}
                style={{ width: '100%', padding: "10px 12px", border: '1px solid #d1d5db', borderRadius: 6 }}
                placeholder="Recipient phone"
              />
            </div>
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={{ display: "block", marginBottom: 6, fontWeight: 500 }}>Delivery Instructions (Optional)</label>
            <textarea
              value={deliveryInstructions}
              onChange={(e) => setDeliveryInstructions(e.target.value)}
              style={{ width: '100%', padding: "10px 12px", border: '1px solid #d1d5db', borderRadius: 6, minHeight: 60 }}
              placeholder="Gate code, landmark, special instructions for driver"
            />
          </div>

          <div>
            <label style={{ display: "block", marginBottom: 6, fontWeight: 500 }}>Estimated Delivery Time (Optional)</label>
            <input
              type="datetime-local"
              value={estimatedDeliveryTime}
              onChange={(e) => setEstimatedDeliveryTime(e.target.value)}
              style={{ width: '100%', padding: "10px 12px", border: '1px solid #d1d5db', borderRadius: 6 }}
            />
          </div>
        </div>

        {/* Order Summary Preview */}
        <div style={{ 
          marginBottom: 20, 
          padding: "12px", 
          backgroundColor: "#f9fafb", 
          borderRadius: 8,
          border: "1px solid #e5e7eb"
        }}>
          <div style={{ fontWeight: 600, marginBottom: 8, color: "#374151" }}>
            📋 Order Summary Preview
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <span>Order Subtotal:</span>
            <span>{formatCurrency(order.financial?.subtotal || order.subtotal || 0)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, color: "#f59e0b" }}>
            <span>Delivery Fee:</span>
            <span>{formatCurrency(transportCharge)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold", marginTop: 8, paddingTop: 8, borderTop: "1px solid #e5e7eb" }}>
            <span>New Total:</span>
            <span>{formatCurrency((order.financial?.subtotal || order.subtotal || 0) + transportCharge)}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button 
            className="btn outline" 
            onClick={onClose} 
            disabled={loading}
            style={{ padding: "10px 20px", cursor: "pointer" }}
          >
            Cancel
          </button>
          <button 
            className="btn" 
            onClick={handleSubmit} 
            disabled={loading || !deliveryAddress.trim()}
            style={{ 
              padding: "10px 20px", 
              cursor: "pointer",
              backgroundColor: "#10b981",
              color: "white",
              border: "none",
              borderRadius: 6,
              opacity: (!deliveryAddress.trim() || loading) ? 0.6 : 1
            }}
          >
            {loading ? 'Saving...' : 'Save Transport & Delivery Details'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default TransportChargeModal;