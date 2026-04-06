// components/modals/DriverAssignmentModal.js
import { useState } from "react";
import { api } from "../../api/client";

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
      const response = await api.post(`/api/ecommerce/orders/${order.order_id}/assign-driver/`, { driver_name: driverName, driver_phone: driverPhone, estimated_delivery_time: estimatedTime });
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
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2100 }} onClick={onClose}>
      <div style={{ backgroundColor: 'white', borderRadius: 12, width: '90%', maxWidth: 500, padding: 24 }} onClick={(e) => e.stopPropagation()}>
        <h3>👨‍✈️ Assign Driver</h3>
        <p style={{ color: "#666", marginBottom: 16 }}>Order: {order.order_number}</p>
        
        <div style={{ marginBottom: 12 }}><label>Driver Name *</label><input type="text" value={driverName} onChange={(e) => setDriverName(e.target.value)} style={{ width: '100%', padding: 8, marginTop: 4, border: '1px solid #ddd', borderRadius: 4 }} placeholder="Enter driver name" /></div>
        <div style={{ marginBottom: 12 }}><label>Driver Phone *</label><input type="tel" value={driverPhone} onChange={(e) => setDriverPhone(e.target.value)} style={{ width: '100%', padding: 8, marginTop: 4, border: '1px solid #ddd', borderRadius: 4 }} placeholder="Enter driver phone number" /></div>
        <div style={{ marginBottom: 20 }}><label>Estimated Delivery Time</label><input type="datetime-local" value={estimatedTime} onChange={(e) => setEstimatedTime(e.target.value)} style={{ width: '100%', padding: 8, marginTop: 4, border: '1px solid #ddd', borderRadius: 4 }} /></div>
        
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button className="btn outline" onClick={onClose}>Cancel</button>
          <button className="btn" onClick={handleAssign} disabled={loading}>{loading ? 'Assigning...' : 'Assign Driver'}</button>
        </div>
      </div>
    </div>
  );
}

export default DriverAssignmentModal;