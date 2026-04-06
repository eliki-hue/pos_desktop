// components/orders/WhatsAppPreviewModal.js
import { useEffect, useState } from "react";

function WhatsAppPreviewModal({ message, onMessageChange, onClose, onSend, order, formatCurrency, isEditing, setIsEditing }) {
  const [editMessage, setEditMessage] = useState(message);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => { setEditMessage(message); }, [message]);

  const handleSend = () => { setIsSending(true); onMessageChange(editMessage); onSend(); setIsSending(false); };
  const toggleEdit = () => { setIsEditing(!isEditing); };

  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1100 }} onClick={onClose}>
      <div style={{ backgroundColor: "white", borderRadius: 8, width: "90%", maxWidth: 600, maxHeight: "90vh", overflow: "auto" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: 16, borderBottom: "1px solid #eee" }}>
          <div><h3 style={{ margin: 0, fontSize: 18 }}>WhatsApp Message Preview</h3><p style={{ margin: "4px 0 0", fontSize: 12, color: "#666" }}>Order: {order?.order_number} | Customer: {order?.customer || "Guest"}</p></div>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", padding: "0 8px" }}>×</button>
        </div>
        <div style={{ padding: 16 }}>
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}><label style={{ fontWeight: 500 }}>Message Preview:</label><button className="btn outline" onClick={toggleEdit} style={{ fontSize: 12, padding: "4px 12px" }}>{isEditing ? "Cancel Edit" : "✏️ Edit Message"}</button></div>
            {isEditing ? (<textarea value={editMessage} onChange={(e) => setEditMessage(e.target.value)} style={{ width: "100%", padding: 12, border: "1px solid #ddd", borderRadius: 4, fontSize: 13, fontFamily: "monospace", minHeight: 250, resize: "vertical", lineHeight: 1.5 }} placeholder="Edit your WhatsApp message here..." />) : (<div style={{ backgroundColor: "#DCF8C6", borderRadius: 8, padding: 12, maxHeight: 250, overflow: "auto", whiteSpace: "pre-wrap", fontFamily: "monospace", fontSize: 13, lineHeight: 1.5 }}>{editMessage}</div>)}
          </div>
          <div style={{ backgroundColor: "#f5f5f5", borderRadius: 4, padding: 12, marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 8 }}>Order Summary:</div>
            <div style={{ fontSize: 12, color: "#666" }}><div><strong>Order #:</strong> {order?.order_number}</div><div><strong>Customer:</strong> {order?.customer || "Guest"}</div><div><strong>Phone:</strong> {order?.phone || order?.guest_phone || "—"}</div><div><strong>Total:</strong> {formatCurrency(order?.total)}</div><div><strong>Items:</strong> {order?.items || 0} items ({order?.quantity || 0} units)</div></div>
          </div>
          {isEditing && (<div style={{ marginBottom: 16 }}><div style={{ fontSize: 12, fontWeight: 500, marginBottom: 8 }}>Quick Insert:</div><div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}><button className="btn outline" onClick={() => setEditMessage(prev => `${prev}\n\nTotal: ${formatCurrency(order?.total)}`)} style={{ fontSize: 12, padding: "4px 8px" }}>Insert Total</button><button className="btn outline" onClick={() => setEditMessage(prev => `${prev}\n\nThank you for your order!`)} style={{ fontSize: 12, padding: "4px 8px" }}>Add Thank You</button><button className="btn outline" onClick={() => setEditMessage(prev => `${prev}\n\nWe'll notify you once your order is ready.`)} style={{ fontSize: 12, padding: "4px 8px" }}>Add Ready Notification</button></div></div>)}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, paddingTop: 16, borderTop: "1px solid #eee" }}><button className="btn outline" onClick={onClose} disabled={isSending}>Cancel</button><button className="btn" onClick={handleSend} disabled={isSending}>{isSending ? "Sending..." : "📱 Send WhatsApp"}</button></div>
        </div>
      </div>
    </div>
  );
}

export default WhatsAppPreviewModal;