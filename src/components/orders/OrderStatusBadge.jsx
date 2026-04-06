// components/orders/OrderStatusBadge.js
import { getStatusStyle } from "../../constants/orderStatus";

function OrderStatusBadge({ status, showIcon = true, showLabel = true, size = "sm" }) {
  const statusStyle = getStatusStyle(status);
  
  const sizeClasses = {
    sm: { padding: "2px 8px", fontSize: 11 },
    md: { padding: "4px 12px", fontSize: 13 },
    lg: { padding: "6px 16px", fontSize: 15 }
  };
  
  const currentSize = sizeClasses[size] || sizeClasses.sm;
  
  // Map status to icon
  const getIcon = () => {
    switch(status?.toLowerCase()) {
      case 'pending':
        return '⏳';
      case 'paid':
        return '✅';
      case 'processing':
        return '🔄';
      case 'in-transit':
        return '🚚';
      case 'delivered':
        return '📦';
      case 'completed':
        return '🎉';
      case 'conflict':
        return '⚠️';
      case 'cancelled':
        return '❌';
      default:
        return '❓';
    }
  };
  
  // Map status to label
  const getLabel = () => {
    switch(status?.toLowerCase()) {
      case 'pending':
        return 'Pending Payment';
      case 'paid':
        return 'Paid';
      case 'processing':
        return 'Processing';
      case 'in-transit':
        return 'In Transit';
      case 'delivered':
        return 'Delivered';
      case 'completed':
        return 'Completed';
      case 'conflict':
        return 'Conflict';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status || 'Unknown';
    }
  };
  
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        padding: currentSize.padding,
        borderRadius: "20px",
        fontSize: currentSize.fontSize,
        fontWeight: 500,
        backgroundColor: statusStyle.bg?.replace("bg-", "").replace(" bg-opacity-10", "") || "#f3f4f6",
        color: statusStyle.text?.replace("text-", "") || "#374151",
        whiteSpace: "nowrap"
      }}
    >
      {showIcon && <span style={{ fontSize: currentSize.fontSize + 2 }}>{getIcon()}</span>}
      {showLabel && <span>{getLabel()}</span>}
      <span
        style={{
          width: currentSize.fontSize === 11 ? 6 : 8,
          height: currentSize.fontSize === 11 ? 6 : 8,
          borderRadius: "50%",
          backgroundColor: statusStyle.dot?.replace("bg-", "") || "#9ca3af",
          display: "inline-block"
        }}
      />
    </span>
  );
}

export default OrderStatusBadge;