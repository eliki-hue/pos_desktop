import React, { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import AppLayout from "../components/AppLayout";
import ApproveDiscountModal from "../components/discount/ApproveDiscountModal";
import RejectDiscountModal from "../components/discount/RejectDiscountModal";
import ViewDiscountRequestModal from "../components/discount/ViewDiscountRequestModal";

export default function DiscountRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [selectedRequest, setSelectedRequest] = useState(null);

  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);

  const loadRequests = async () => {
    try {
      setLoading(true);

      const res = await api.get(
        "/api/cart/pos/discount-requests/"
      );

      setRequests(res.data);
      setError("");
    } catch (err) {
      console.error(err);
      setError("Failed to load discount requests.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      const matchesStatus =
        statusFilter === "ALL"
          ? true
          : r.status === statusFilter;

      const term = search.toLowerCase();

      const matchesSearch =
          (r.product_name ?? "").toLowerCase().includes(term) ||
          (r.branch_name ?? "").toLowerCase().includes(term) ||
          (r.cashier_name ?? "").toLowerCase().includes(term);

      return matchesStatus && matchesSearch;
    });
  }, [requests, search, statusFilter]);

  const summary = useMemo(() => {
    return {
      pending: requests.filter(
        (r) => r.status === "PENDING"
      ).length,

      approved: requests.filter(
        (r) => r.status === "APPROVED"
      ).length,

      rejected: requests.filter(
        (r) => r.status === "REJECTED"
      ).length,

      cancelled: requests.filter(
        (r) => r.status === "CANCELLED"
      ).length,
    };
  }, [requests]);

  const badgeStyle = (status) => {
    switch (status) {
      case "APPROVED":
        return {
          background: "#DCFCE7",
          color: "#166534",
        };

      case "REJECTED":
        return {
          background: "#FEE2E2",
          color: "#991B1B",
        };

      case "PENDING":
        return {
          background: "#FEF3C7",
          color: "#92400E",
        };

      case "CANCELLED":
        return {
          background: "#E5E7EB",
          color: "#374151",
        };

      default:
        return {
          background: "#F3F4F6",
          color: "#374151",
        };
    }
  };

  return (
    <AppLayout>
    <div
      style={{
        padding: 24,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
        }}
      >
        <h2
          style={{
            margin: 0,
          }}
        >
          Discount Requests
        </h2>

        <button
          className="btn"
          onClick={loadRequests}
        >
          Refresh
        </button>
      </div>

      {/* SUMMARY */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit,minmax(180px,1fr))",
          gap: 16,
          marginBottom: 24,
        }}
      >
        <SummaryCard
          title="Pending"
          value={summary.pending}
          color="#F59E0B"
        />

        <SummaryCard
          title="Approved"
          value={summary.approved}
          color="#16A34A"
        />

        <SummaryCard
          title="Rejected"
          value={summary.rejected}
          color="#DC2626"
        />

        <SummaryCard
          title="Cancelled"
          value={summary.cancelled}
          color="#6B7280"
        />
      </div>

      {/* FILTERS */}

      <div
        style={{
          display: "flex",
          gap: 12,
          flexWrap: "wrap",
          marginBottom: 20,
        }}
      >
        <input
          placeholder="Search product, cashier or branch..."
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
          style={{
            flex: 1,
            minWidth: 260,
            padding: 10,
            borderRadius: 8,
            border: "1px solid #ddd",
          }}
        />

        <select
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(e.target.value)
          }
          style={{
            padding: 10,
            borderRadius: 8,
            border: "1px solid #ddd",
          }}
        >
          <option value="ALL">
            All Status
          </option>

          <option value="PENDING">
            Pending
          </option>

          <option value="APPROVED">
            Approved
          </option>

          <option value="REJECTED">
            Rejected
          </option>

          <option value="CANCELLED">
            Cancelled
          </option>
        </select>
      </div>


            {/* CONTENT */}

      {loading ? (
        <div
          style={{
            padding: 40,
            textAlign: "center",
          }}
        >
          Loading discount requests...
        </div>
      ) : error ? (
        <div
          style={{
            padding: 20,
            background: "#FEE2E2",
            color: "#991B1B",
            borderRadius: 8,
          }}
        >
          {error}
        </div>
      ) : filteredRequests.length === 0 ? (
        <div
          style={{
            padding: 40,
            textAlign: "center",
            color: "#6B7280",
          }}
        >
          No discount requests found.
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
                <th style={th}>Branch</th>
                <th style={th}>Qty</th>
                <th style={th}>Price</th>
                <th style={th}>Discount</th>
                <th style={th}>Reason</th>
                <th style={th}>Requested</th>
                <th style={th}>Status</th>
                <th style={th}>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredRequests.map((request) => (
                <tr
                  key={request.id}
                  style={{
                    borderBottom:
                      "1px solid #f3f4f6",
                  }}
                >
                  <td style={td}>
                    <div
                      style={{
                        fontWeight: 600,
                      }}
                    >
                      {request.product_name}
                    </div>

                    <div
                      style={{
                        color: "#6B7280",
                        fontSize: 12,
                      }}
                    >
                      #{request.product_id}
                    </div>
                  </td>

                  <td style={td}>
                    {request.cashier_name || request.requested_by?.username || "-"}
                  </td>

                  <td style={td}>
                    {request.branch_name}
                  </td>

                  <td style={td}>
                    {Number(
                      request.requested_quantity
                    ).toFixed(2)}{" "}
                    {request.requested_unit}
                  </td>

                  <td style={td}>
                    KES{" "}
                    {Number(
                      request.requested_unit_price
                    ).toFixed(2)}
                  </td>

                  <td style={td}>
                    <div
                      style={{
                        fontWeight: 700,
                        color: "#15803d",
                      }}
                    >
                      KES{" "}
                      {Number(
                        request.discount_per_unit
                      ).toFixed(2)}
                    </div>

                    <div
                      style={{
                        fontSize: 12,
                        color: "#6B7280",
                      }}
                    >
                      per {request.requested_unit}
                    </div>
                  </td>

                  <td style={td}>
                    <div
                      style={{
                        maxWidth: 180,
                        whiteSpace: "normal",
                      }}
                    >
                      {request.reason}
                    </div>
                  </td>

                  <td style={td}>
                    {new Date(
                      request.requested_at
                    ).toLocaleString()}
                  </td>

                  <td style={td}>
                    <span
                      style={{
                        ...badgeStyle(
                          request.status
                        ),
                        padding:
                          "5px 10px",
                        borderRadius: 30,
                        fontSize: 12,
                        fontWeight: 600,
                      }}
                    >
                      {request.status}
                    </span>
                  </td>

                  <td style={td}>
                    {request.status ===
                    "PENDING" ? (
                      <div
                        style={{
                          display: "flex",
                          gap: 8,
                          flexWrap: "wrap",
                        }}
                      >
                        <button
                          className="btn"
                          onClick={() => {
                            setSelectedRequest(
                              request
                            );
                            setApproveOpen(
                              true
                            );
                          }}
                        >
                          Approve
                        </button>

                        <button
                          className="btn btn-danger"
                          onClick={() => {
                            setSelectedRequest(
                              request
                            );
                            setRejectOpen(
                              true
                            );
                          }}
                        >
                          Reject
                        </button>
                      </div>
                    ) : (
                      <button
                        className="btn"
                        onClick={() => {
                          setSelectedRequest(
                            request
                          );
                          setViewOpen(
                            true
                          );
                        }}
                      >
                        View
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* MODALS */}

      {approveOpen && (
        <ApproveDiscountModal
          request={selectedRequest}
          onClose={() =>
            setApproveOpen(false)
          }
          onSuccess={() => {
            setApproveOpen(false);
            loadRequests();
          }}
        />
      )}

      {rejectOpen && (
        <RejectDiscountModal
          request={selectedRequest}
          onClose={() =>
            setRejectOpen(false)
          }
          onSuccess={() => {
            setRejectOpen(false);
            loadRequests();
          }}
        />
      )}

      {viewOpen && (
        <ViewDiscountRequestModal
          request={selectedRequest}
          onClose={() =>
            setViewOpen(false)
          }
        />
      )}
    </div>
    </AppLayout>
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