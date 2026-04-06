// components/modals/TransportChargeModal.js
import { useState } from "react";
import { api } from "../../api/client";

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
        zIndex: 2100
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: 12,
          width: '90%',
          maxWidth: 500,
          padding: 24
        }}
        onClick={(e) => e.stopPropagation()}
      >
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
            style={{
              width: '100%',
              padding: 8,
              marginTop: 4,
              border: '1px solid #ddd',
              borderRadius: 4,
              minHeight: 80
            }}
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

export default TransportChargeModal;