// components/orders/OrderStatusFilter.js
const STATUS_FILTERS = {
  all: "All",
  pending: "Pending",
  paid: "Paid",
  processing: "Processing",
  "in-transit": "In-Transit",
  delivered: "Delivered",
  completed: "Completed",
  conflict: "Conflict",
  cancelled: "Cancelled",
};

function OrderStatusFilter({ filter, onFilterChange }) {
  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      {Object.entries(STATUS_FILTERS).map(([key, label]) => (
        <button
          key={key}
          className={`btn ${filter === key ? "" : "outline"}`}
          onClick={() => onFilterChange(key)}
          style={{ fontSize: 12, padding: "4px 12px" }}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

export default OrderStatusFilter;