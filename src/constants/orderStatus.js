// constants/orderStatus.js
export const STATUS_OPTIONS = ["PENDING", "PAID", "PROCESSING", "IN_TRANSIT", "DELIVERED", "CONFLICT", "CANCELLED", "COMPLETED"];

export const STATUS_COLORS = {
  pending: { bg: "bg-warning bg-opacity-10", text: "text-warning", dot: "bg-warning" },
  paid: { bg: "bg-success bg-opacity-10", text: "text-success", dot: "bg-success" },
  processing: { bg: "bg-primary bg-opacity-10", text: "text-primary", dot: "bg-primary" },
  "in-transit": { bg: "bg-info bg-opacity-10", text: "text-info", dot: "bg-info" },
  delivered: { bg: "bg-success bg-opacity-10", text: "text-success", dot: "bg-success" },
  completed: { bg: "bg-success bg-opacity-10", text: "text-success", dot: "bg-success" },
  conflict: { bg: "bg-danger bg-opacity-10", text: "text-danger", dot: "bg-danger" },
  cancelled: { bg: "bg-secondary bg-opacity-10", text: "text-secondary", dot: "bg-secondary" },
  default: { bg: "bg-light bg-opacity-10", text: "text-dark", dot: "bg-secondary" },
};

export const getStatusStyle = (status) => {
  const key = status?.toLowerCase() || "default";
  return STATUS_COLORS[key] || STATUS_COLORS.default;
};