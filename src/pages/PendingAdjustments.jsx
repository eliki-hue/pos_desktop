import React, { useCallback, useEffect, useMemo, useState } from "react";
import api from "../services/api";
import AppLayout from "../components/AppLayout";

const DISCOUNT_ACTION = "APPLY_DISCOUNT";
const PENDING_STATUS = "PENDING";

export default function DiscountRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [modalType, setModalType] = useState(null); // APPROVE | REJECT | VIEW
  const [note, setNote] = useState("");

  const loadRequests = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      // Single source of truth: SaleAdjustmentRequest.
      const res = await api.get("/api/adjustments/pending/");

      const allRequests = Array.isArray(res.data) ? res.data : [];

      // This page owns only APPLY_DISCOUNT requests.
      const discountRequests = allRequests.filter(
        (request) => request.action === DISCOUNT_ACTION
      );

      setRequests(discountRequests);
    } catch (err) {
      console.error("Failed to load discount requests:", err);
      setError(
        err.response?.data?.error ||
          err.response?.data?.detail ||
          "Failed to load discount requests."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRequests();

    const interval = window.setInterval(loadRequests, 30000);
    return () => window.clearInterval(interval);
  }, [loadRequests]);

  const filteredRequests = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) return requests;

    return requests.filter((request) => {
      const product = String(request.product_name ?? "").toLowerCase();
      const cashier = String(
        request.requested_by_name ??
          request.cashier_name ??
          request.requested_by?.username ??
          ""
      ).toLowerCase();
      const reason = String(request.reason ?? "").toLowerCase();
      const saleNumber = String(
        request.sale_number ?? request.sale ?? request.sale_id ?? ""
      ).toLowerCase();

      return (
        product.includes(term) ||
        cashier.includes(term) ||
        reason.includes(term) ||
        saleNumber.includes(term)
      );
    });
  }, [requests, search]);

  const pendingCount = requests.filter(
    (request) => request.status === PENDING_STATUS
  ).length;

  const openModal = (type, request) => {
    setSelectedRequest(request);
    setModalType(type);
    setNote("");
    setError("");
    setSuccess("");
  };

  const closeModal = () => {
    if (processingId !== null) return;
    setSelectedRequest(null);
    setModalType(null);
    setNote("");
  };

  const approveRequest = async () => {
    if (!selectedRequest) return;

    const requestId = selectedRequest.id;
    setProcessingId(requestId);
    setError("");
    setSuccess("");

    try {
      // Canonical approval endpoint for SaleAdjustmentRequest.
      await api.post("/api/adjustments/approve/", {
        request_id: requestId,
        ...(note.trim() ? { note: note.trim() } : {}),
      });

      setSuccess("Discount request approved successfully.");
      closeModal();
      await loadRequests();
    } catch (err) {
      console.error("Failed to approve discount request:", err);
      setError(
        err.response?.data?.error ||
          err.response?.data?.detail ||
          "Failed to approve discount request."
      );
    } finally {
      setProcessingId(null);
    }
  };

  const rejectRequest = async () => {
    if (!selectedRequest) return;

    const requestId = selectedRequest.id;
    setProcessingId(requestId);
    setError("");
    setSuccess("");

    try {
      // Canonical rejection endpoint for SaleAdjustmentRequest.
      await api.post("/api/adjustments/reject/", {
        request_id: requestId,
        ...(note.trim() ? { note: note.trim() } : {}),
      });

      setSuccess("Discount request rejected successfully.");
      closeModal();
      await loadRequests();
    } catch (err) {
      console.error("Failed to reject discount request:", err);
      setError(
        err.response?.data?.error ||
          err.response?.data?.detail ||
          "Failed to reject discount request."
      );
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <AppLayout>
      <div style={{ padding: 24 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
            marginBottom: 20,
          }}
        >
          <div>
            <h2 style={{ margin: 0 }}>Discount Requests</h2>
            <div style={{ color: "#6B7280", marginTop: 6, fontSize: 14 }}>
              Manager/Admin approval for cashier discount requests.
            </div>
          </div>

          <button className="btn" onClick={loadRequests} disabled={loading}>
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {success && (
          <div
            style={{
              padding: 12,
              marginBottom: 16,
              background: "#DCFCE7",
              color: "#166534",
              borderRadius: 8,
            }}
          >
            {success}
          </div>
        )}

        {error && (
          <div
            style={{
              padding: 12,
              marginBottom: 16,
              background: "#FEE2E2",
              color: "#991B1B",
              borderRadius: 8,
            }}
          >
            {error}
          </div>
        )}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
            gap: 16,
            marginBottom: 24,
          }}
        >
          <SummaryCard
            title="Pending Discount Requests"
            value={pendingCount}
            color="#F59E0B"
          />
        </div>

        <div
          style={{
            display: "flex",
            gap: 12,
            flexWrap: "wrap",
            marginBottom: 20,
          }}
        >
          <input
            placeholder="Search product, cashier, sale or reason..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            style={{
              flex: 1,
              minWidth: 280,
              padding: 10,
              borderRadius: 8,
              border: "1px solid #ddd",
            }}
          />
        </div>

        {loading ? (
          <div style={{ padding: 40, textAlign: "center" }}>
            Loading discount requests...
          </div>
        ) : filteredRequests.length === 0 ? (
          <div
            style={{
              padding: 40,
              textAlign: "center",
              color: "#6B7280",
              background: "#fff",
              borderRadius: 12,
              border: "1px solid #e5e7eb",
            }}
          >
            No pending discount requests found.
          </div>
        ) : (
          <div
            style={{
              overflowX: "auto",
              background: "#fff",
              borderRadius: 12,
              border: "1px solid #e5e7eb",
            }}
          >
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                minWidth: 900,
              }}
            >
              <thead>
                <tr
                  style={{
                    background: "#F9FAFB",
                    borderBottom: "1px solid #e5e7eb",
                  }}
                >
                  <th style={th}>Product</th>
                  <th style={th}>Cashier</th>
                  <th style={th}>Sale</th>
                  <th style={th}>Discount</th>
                  <th style={th}>Reason</th>
                  <th style={th}>Requested</th>
                  <th style={th}>Status</th>
                  <th style={th}>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredRequests.map((request) => {
                  const cashier =
                    request.requested_by_name ??
                    request.cashier_name ??
                    request.requested_by?.username ??
                    "-";

                  const saleNumber =
                    request.sale_number ??
                    request.sale_id ??
                    request.sale ??
                    "-";

                  const requestedDiscount = Number(
                    request.requested_discount ?? 0
                  );

                  const requestedAt =
                    request.created_at ?? request.requested_at;

                  return (
                    <tr
                      key={request.id}
                      style={{ borderBottom: "1px solid #f3f4f6" }}
                    >
                      <td style={td}>
                        <div style={{ fontWeight: 600 }}>
                          {request.product_name || "-"}
                        </div>
                        <div
                          style={{
                            color: "#6B7280",
                            fontSize: 12,
                            marginTop: 4,
                          }}
                        >
                          Item #{request.item ?? "-"}
                        </div>
                      </td>

                      <td style={td}>{cashier}</td>

                      <td style={td}>#{saleNumber}</td>

                      <td style={td}>
                        <div style={{ fontWeight: 700, color: "#15803d" }}>
                          KES {requestedDiscount.toFixed(2)}
                        </div>
                        <div
                          style={{
                            fontSize: 12,
                            color: "#6B7280",
                            marginTop: 4,
                          }}
                        >
                          per unit
                        </div>
                      </td>

                      <td style={td}>
                        <div style={{ maxWidth: 240, whiteSpace: "normal" }}>
                          {request.reason || "-"}
                        </div>
                      </td>

                      <td style={td}>
                        {requestedAt
                          ? new Date(requestedAt).toLocaleString()
                          : "-"}
                      </td>

                      <td style={td}>
                        <span
                          style={{
                            ...badgeStyle(request.status),
                            padding: "5px 10px",
                            borderRadius: 30,
                            fontSize: 12,
                            fontWeight: 600,
                          }}
                        >
                          {request.status || "-"}
                        </span>
                      </td>

                      <td style={td}>
                        <div
                          style={{
                            display: "flex",
                            gap: 8,
                            flexWrap: "wrap",
                          }}
                        >
                          <button
                            className="btn"
                            onClick={() => openModal("APPROVE", request)}
                            disabled={processingId === request.id}
                          >
                            Approve
                          </button>

                          <button
                            className="btn btn-danger"
                            onClick={() => openModal("REJECT", request)}
                            disabled={processingId === request.id}
                          >
                            Reject
                          </button>

                          <button
                            className="btn"
                            onClick={() => openModal("VIEW", request)}
                            disabled={processingId === request.id}
                          >
                            View
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {modalType && selectedRequest && (
          <RequestModal
            type={modalType}
            request={selectedRequest}
            note={note}
            setNote={setNote}
            processing={processingId === selectedRequest.id}
            onClose={closeModal}
            onApprove={approveRequest}
            onReject={rejectRequest}
          />
        )}
      </div>
    </AppLayout>
  );
}

function RequestModal({
  type,
  request,
  note,
  setNote,
  processing,
  onClose,
  onApprove,
  onReject,
}) {
  const isApprove = type === "APPROVE";
  const isReject = type === "REJECT";

  const title = isApprove
    ? "Approve Discount Request"
    : isReject
      ? "Reject Discount Request"
      : "Discount Request Details";

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 16,
            marginBottom: 20,
          }}
        >
          <h3 style={{ margin: 0 }}>{title}</h3>
          <button
            type="button"
            className="btn"
            onClick={onClose}
            disabled={processing}
          >
            Close
          </button>
        </div>

        <div style={detailGridStyle}>
          <Detail label="Request ID" value={`#${request.id}`} />
          <Detail
            label="Product"
            value={request.product_name || "Deleted Product"}
          />
          <Detail
            label="Cashier"
            value={
              request.requested_by_name ??
                request.cashier_name ??
                request.requested_by?.username ??
                "-"
            }
          />
          <Detail
            label="Sale"
            value={`#${
              request.sale_number ?? request.sale_id ?? request.sale ?? "-"
            }`}
          />
          <Detail
            label="Requested Discount"
            value={`KES ${Number(request.requested_discount ?? 0).toFixed(2)} per unit`}
          />
          <Detail label="Reason" value={request.reason || "-"} />
          <Detail label="Status" value={request.status || "-"} />
        </div>

        {(isApprove || isReject) && (
          <div style={{ marginTop: 20 }}>
            <label
              style={{
                display: "block",
                fontSize: 14,
                fontWeight: 600,
                marginBottom: 8,
              }}
            >
              Note (optional)
            </label>
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              rows={4}
              maxLength={500}
              placeholder={
                isApprove
                  ? "Optional approval note..."
                  : "Optional rejection reason..."
              }
              disabled={processing}
              style={textareaStyle}
            />
          </div>
        )}

        {(isApprove || isReject) && (
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 10,
              marginTop: 20,
            }}
          >
            <button
              type="button"
              className="btn"
              onClick={onClose}
              disabled={processing}
            >
              Cancel
            </button>

            {isApprove ? (
              <button
                type="button"
                className="btn"
                onClick={onApprove}
                disabled={processing}
              >
                {processing ? "Approving..." : "Confirm Approval"}
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-danger"
                onClick={onReject}
                disabled={processing}
              >
                {processing ? "Rejecting..." : "Confirm Rejection"}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Detail({ label, value }) {
  return (
    <div
      style={{
        padding: 12,
        background: "#F9FAFB",
        borderRadius: 8,
      }}
    >
      <div
        style={{
          color: "#6B7280",
          fontSize: 12,
          marginBottom: 4,
        }}
      >
        {label}
      </div>
      <div style={{ fontWeight: 600 }}>{value}</div>
    </div>
  );
}

function SummaryCard({ title, value, color }) {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 12,
        padding: 20,
        border: "1px solid #e5e7eb",
        borderLeft: `5px solid ${color}`,
      }}
    >
      <div
        style={{
          color: "#6b7280",
          fontSize: 14,
        }}
      >
        {title}
      </div>

      <div
        style={{
          fontSize: 28,
          fontWeight: 700,
          marginTop: 10,
        }}
      >
        {value}
      </div>
    </div>
  );
}

function badgeStyle(status) {
  switch (status) {
    case "APPROVED":
      return { background: "#DCFCE7", color: "#166534" };
    case "REJECTED":
      return { background: "#FEE2E2", color: "#991B1B" };
    case "PENDING":
      return { background: "#FEF3C7", color: "#92400E" };
    case "CANCELLED":
      return { background: "#E5E7EB", color: "#374151" };
    default:
      return { background: "#F3F4F6", color: "#374151" };
  }
}

const overlayStyle = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.45)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 20,
  zIndex: 2000,
};

const modalStyle = {
  width: "100%",
  maxWidth: 700,
  maxHeight: "90vh",
  overflowY: "auto",
  background: "#fff",
  borderRadius: 14,
  padding: 24,
  boxShadow: "0 20px 50px rgba(0,0,0,0.2)",
};

const detailGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
  gap: 12,
};

const textareaStyle = {
  width: "100%",
  boxSizing: "border-box",
  padding: 10,
  borderRadius: 8,
  border: "1px solid #ddd",
  resize: "vertical",
};

const th = {
  textAlign: "left",
  padding: "14px",
  fontWeight: 600,
  fontSize: 14,
};

const td = {
  padding: "14px",
  verticalAlign: "top",
};
