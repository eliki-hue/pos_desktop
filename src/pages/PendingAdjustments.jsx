// pages/PendingAdjustments.jsx

import React, { useState, useEffect } from "react";
import {
  RefreshCw,
  Check,
  X,
  Eye,
  Clock,
  AlertCircle,
  FileText,
  ArrowLeftRight,
  Ban,
  PackageX,
  Info,
  Banknote,
  Smartphone,
} from "lucide-react";

import { api } from "../api/client";
import AppLayout from "../components/AppLayout";
import { formatDate, formatCurrency } from "../utils/formatters";
import { useAuth } from "../auth/AuthContext";
import { useNavigate } from "react-router-dom";


export default function PendingAdjustments() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  const [toast, setToast] = useState(null);

  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvalRequest, setApprovalRequest] = useState(null);
  const [refundMethod, setRefundMethod] = useState("");


  // ==========================================================
  // Toast
  // ==========================================================

  const showToast = (message, type = "success") => {
    setToast({ message, type });

    setTimeout(() => {
      setToast(null);
    }, 3000);
  };


  // ==========================================================
  // LOAD PENDING REQUESTS
  // ==========================================================

  const loadRequests = async () => {
    setLoading(true);

    try {
      const res = await api.get("/api/adjustments/pending/");

      setRequests(
        Array.isArray(res.data)
          ? res.data
          : res.data?.results || []
      );
    } catch (err) {
      console.error("Failed to load requests:", err);

      showToast(
        err.response?.data?.error ||
          err.response?.data?.detail ||
          "Failed to load pending requests.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    loadRequests();
  }, []);


  // ==========================================================
  // APPROVAL
  // ==========================================================

  const openApprovalModal = (request) => {
    const needsRefund = request.refund_required === true;

    /*
     * No refund required:
     * approve immediately.
     */
    if (!needsRefund) {
      approveRequest(request.id, null);
      return;
    }

    /*
     * Refund required:
     * manager must select refund method.
     */
    setApprovalRequest(request);

    setRefundMethod(
      request.refund_method || "CASH"
    );

    setShowApprovalModal(true);
  };


  const closeApprovalModal = () => {
    if (processingId !== null) {
      return;
    }

    setShowApprovalModal(false);
    setApprovalRequest(null);
    setRefundMethod("");
  };


  const approveRequest = async (
    id,
    selectedRefundMethod = null
  ) => {
    setProcessingId(id);

    try {
      await api.post(
        "/api/adjustments/approve/",
        {
          request_id: id,
          refund_method: selectedRefundMethod,
        }
      );

      showToast(
        selectedRefundMethod
          ? "Request approved and refund prepared successfully."
          : "Request approved successfully."
      );

      setShowApprovalModal(false);
      setApprovalRequest(null);
      setRefundMethod("");

      await loadRequests();

    } catch (err) {
      console.error(
        "Failed to approve request:",
        err
      );

      showToast(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Failed to approve request.",
        "error"
      );
    } finally {
      setProcessingId(null);
    }
  };


  const confirmApproval = () => {
    if (!approvalRequest) {
      return;
    }

    if (
      approvalRequest.refund_required === true &&
      !refundMethod
    ) {
      showToast(
        "Please select a refund method.",
        "error"
      );

      return;
    }

    approveRequest(
      approvalRequest.id,
      approvalRequest.refund_required === true
        ? refundMethod
        : null
    );
  };


  // ==========================================================
  // REJECT
  // ==========================================================

  const handleReject = async (id) => {
    setProcessingId(id);

    try {
      await api.post(
        "/api/adjustments/reject/",
        {
          request_id: id,
        }
      );

      showToast("Request rejected.");

      await loadRequests();

    } catch (err) {
      console.error(
        "Failed to reject request:",
        err
      );

      showToast(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Failed to reject request.",
        "error"
      );
    } finally {
      setProcessingId(null);
    }
  };


  // ==========================================================
  // VIEW SALE
  // ==========================================================

  const handleViewSale = (saleId) => {
    if (!saleId) {
      return;
    }

    navigate(`/balance/sales/${saleId}`);
  };


  // ==========================================================
  // STATUS
  // ==========================================================

  const getStatusBadge = (status) => {
    const s = status?.toUpperCase();

    if (s === "PENDING") {
      return {
        bg: "#fef3c7",
        color: "#92400e",
        text: "Pending",
        icon: Clock,
      };
    }

    if (s === "APPROVED") {
      return {
        bg: "#d1fae5",
        color: "#065f46",
        text: "Approved",
        icon: Check,
      };
    }

    if (s === "REJECTED") {
      return {
        bg: "#fee2e2",
        color: "#991b1b",
        text: "Rejected",
        icon: X,
      };
    }

    return {
      bg: "#f3f4f6",
      color: "#374151",
      text: status || "Unknown",
      icon: AlertCircle,
    };
  };


  // ==========================================================
  // ACTION DISPLAY
  // ==========================================================

  const getActionDisplay = (action) => {
    const actions = {
      CHANGE_QUANTITY: "Change Quantity",
      REMOVE_ITEM: "Remove Item",
      VOID_SALE: "Void Sale",
    };

    return (
      actions[action] ||
      action ||
      "Unknown"
    );
  };


  // ==========================================================
  // ACTION ICON
  // ==========================================================

  const getActionIcon = (action) => {
    const icons = {
      CHANGE_QUANTITY: (
        <ArrowLeftRight size={14} />
      ),

      REMOVE_ITEM: (
        <PackageX size={14} />
      ),

      VOID_SALE: (
        <Ban size={14} />
      ),
    };

    return (
      icons[action] ||
      <FileText size={14} />
    );
  };


  // ==========================================================
  // ACTION DESCRIPTION
  // ==========================================================

  const getActionDescription = (request) => {
    switch (request.action) {
      case "CHANGE_QUANTITY":
        return (
          `Change from ${
            request.current_quantity ?? "?"
          } → ${
            request.requested_quantity
          }`
        );

      case "REMOVE_ITEM":
        return (
          `Remove ${
            request.current_quantity ||
            request.requested_quantity ||
            "all"
          } units`
        );

      case "VOID_SALE":
        return "Void entire sale.";

      default:
        return "";
    }
  };


  // ==========================================================
  // DETAIL DESCRIPTION
  // ==========================================================

  const getDetailDescription = (request) => {
    switch (request.action) {

      case "CHANGE_QUANTITY":
        return {
          title: "Quantity Change Request",

          icon: (
            <ArrowLeftRight
              size={24}
              style={{ color: "#2563eb" }}
            />
          ),

          details: [
            {
              label: "Current Quantity",
              value:
                request.current_quantity ??
                "N/A",
            },

            {
              label: "Requested Quantity",
              value:
                request.requested_quantity ??
                "N/A",
            },

            {
              label: "Change",
              value:
                `${request.requested_quantity} ` +
                `(from ${
                  request.current_quantity ??
                  "N/A"
                })`,
            },

            {
              label: "Reason",
              value:
                request.reason ||
                "No reason provided",
            },
          ],
        };


      case "REMOVE_ITEM":
        return {
          title: "Item Removal Request",

          icon: (
            <PackageX
              size={24}
              style={{ color: "#dc2626" }}
            />
          ),

          details: [
            {
              label: "Product",
              value:
                request.product_name ||
                "Unknown Product",
            },

            {
              label: "Quantity",
              value:
                request.current_quantity ??
                request.requested_quantity ??
                "All",
            },

            {
              label: "Reason",
              value:
                request.reason ||
                "No reason provided",
            },
          ],
        };


      case "VOID_SALE":
        return {
          title: "Sale Void Request",

          icon: (
            <Ban
              size={24}
              style={{ color: "#dc2626" }}
            />
          ),

          details: [
            {
              label: "Sale #",
              value:
                `#${
                  request.sale_number ??
                  request.sale_id ??
                  request.sale ??
                  "N/A"
                }`,
            },

            {
              label: "Reason",
              value:
                request.reason ||
                "No reason provided",
            },
          ],
        };


      default:
        return {
          title: "Request Details",

          icon: (
            <Info
              size={24}
              style={{ color: "#6b7280" }}
            />
          ),

          details: [
            {
              label: "Action",
              value:
                getActionDisplay(
                  request.action
                ),
            },

            {
              label: "Reason",
              value:
                request.reason ||
                "No reason provided",
            },
          ],
        };
    }
  };


  // ==========================================================
  // STATUS BADGE COMPONENT
  // ==========================================================

  const StatusBadge = ({ status }) => {
    const config =
      getStatusBadge(status);

    const Icon = config.icon;

    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
          padding: "3px 10px",
          borderRadius: 12,
          fontSize: 11,
          fontWeight: 500,
          backgroundColor: config.bg,
          color: config.color,
        }}
      >
        <Icon size={12} />

        {config.text}
      </span>
    );
  };


  // ==========================================================
  // ROLE CHECK
  // ==========================================================

  const userRole =
    user?.role?.toLowerCase();

  const isManagerOrAdmin =
    userRole === "manager" ||
    userRole === "admin";


  if (!isManagerOrAdmin) {
    return (
      <AppLayout
        title="Pending Adjustments"
        subtitle="Review adjustment requests"
      >
        <div
          className="card"
          style={{
            textAlign: "center",
            padding: 60,
          }}
        >
          <p
            style={{
              color: "#dc2626",
            }}
          >
            Access denied. Manager or Admin only.
          </p>
        </div>
      </AppLayout>
    );
  }


  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <AppLayout
      title="Pending Adjustments"
      subtitle="Review and approve adjustment requests"
    >

      {/* TOAST */}

      {toast && (
        <div
          style={{
            position: "fixed",
            top: 20,
            right: 20,
            zIndex: 9999,
            padding: "10px 16px",
            borderRadius: 8,
            backgroundColor:
              toast.type === "success"
                ? "#10b981"
                : "#ef4444",
            color: "white",
            fontSize: 13,
            boxShadow:
              "0 4px 12px rgba(0,0,0,0.15)",
          }}
        >
          {toast.message}
        </div>
      )}


      {/* HEADER */}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
        }}
      >
        <div>
          <strong
            style={{
              fontSize: 20,
            }}
          >
            Pending Requests
          </strong>

          <div className="muted">
            Review adjustment requests from cashiers
          </div>
        </div>

        <button
          className="btn outline"
          onClick={loadRequests}
          disabled={loading}
        >
          <RefreshCw
            size={16}
            style={{
              marginRight: 8,
            }}
          />

          {loading
            ? "Refreshing..."
            : "Refresh"}
        </button>
      </div>


      {/* TABLE */}

      <div
        className="card"
        style={{
          overflowX: "auto",
        }}
      >

        {loading ? (

          <div
            style={{
              textAlign: "center",
              padding: 40,
            }}
          >
            Loading pending requests...
          </div>

        ) : requests.length === 0 ? (

          <div
            style={{
              textAlign: "center",
              padding: 40,
            }}
          >
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: 60,
                height: 60,
                backgroundColor: "#f3f4f6",
                borderRadius: 16,
                marginBottom: 12,
              }}
            >
              <span
                style={{
                  fontSize: 30,
                }}
              >
                ✅
              </span>
            </div>

            <p
              style={{
                color: "#6b7280",
              }}
            >
              No pending requests
            </p>

            <p
              style={{
                fontSize: 13,
                color: "#9ca3af",
              }}
            >
              All requests have been processed.
            </p>
          </div>

        ) : (

          <table
            className="table"
            style={{
              width: "100%",
              minWidth: 1000,
            }}
          >

            <thead>

              <tr>

                <th>#</th>

                <th>Request ID</th>

                <th>Sale #</th>

                <th>Product</th>

                <th>Action</th>

                <th>Request Details</th>

                <th>Requested By</th>

                <th>Refund</th>

                <th>Date</th>

                <th>Actions</th>

              </tr>

            </thead>


            <tbody>

              {requests.map(
                (req, index) => (

                  <tr
                    key={req.id}
                    style={{
                      borderBottom:
                        "1px solid #f3f4f6",
                    }}
                  >

                    <td>
                      {index + 1}
                    </td>


                    <td
                      style={{
                        fontWeight: 500,
                      }}
                    >
                      #{req.id}
                    </td>


                    <td>
                      #
                      {req.sale_number ??
                        req.sale_id ??
                        req.sale ??
                        "N/A"}
                    </td>


                    <td>
                      {req.product_name ||
                        "N/A"}
                    </td>


                    <td>

                      <span
                        style={{
                          display:
                            "inline-flex",
                          alignItems:
                            "center",
                          gap: 4,
                          padding:
                            "4px 8px",
                          borderRadius: 4,
                          fontSize: 11,
                          fontWeight: 500,
                          backgroundColor:
                            "#dbeafe",
                          color:
                            "#1e40af",
                        }}
                      >

                        {getActionIcon(
                          req.action
                        )}

                        {getActionDisplay(
                          req.action
                        )}

                      </span>

                    </td>


                    <td>

                      <span
                        style={{
                          fontSize: 12,
                          color: "#6b7280",
                        }}
                      >
                        {getActionDescription(
                          req
                        )}
                      </span>

                    </td>


                    <td>
                      {req.requested_by_name ||
                        req.requested_by ||
                        req.cashier_name ||
                        "—"}
                    </td>


                    <td>

                      {req.refund_required ? (

                        <div>
                          <strong
                            style={{
                              color:
                                "#b45309",
                            }}
                          >
                            {formatCurrency(
                              Number(
                                req.refund_amount ||
                                  0
                              )
                            )}
                          </strong>

                          <div
                            style={{
                              fontSize: 11,
                              color: "#6b7280",
                              marginTop: 2,
                            }}
                          >
                            {req.refund_method ||
                              "Method not selected"}
                          </div>
                        </div>

                      ) : (

                        <span
                          style={{
                            color:
                              "#6b7280",
                            fontSize: 12,
                          }}
                        >
                          None
                        </span>

                      )}

                    </td>


                    <td
                      style={{
                        fontSize: 12,
                        color: "#6b7280",
                      }}
                    >
                      {req.created_at
                        ? formatDate(
                            req.created_at
                          )
                        : "N/A"}
                    </td>


                    <td>

                      <div
                        style={{
                          display: "flex",
                          gap: 5,
                          flexWrap: "wrap",
                        }}
                      >

                        {/* VIEW */}

                        <button
                          className="btn outline"
                          onClick={() => {
                            setSelectedRequest(
                              req
                            );

                            setShowDetailModal(
                              true
                            );
                          }}
                          style={{
                            padding:
                              "4px 8px",
                            fontSize: 11,
                            display:
                              "inline-flex",
                            alignItems:
                              "center",
                            gap: 4,
                          }}
                        >
                          <Eye size={14} />
                          View
                        </button>


                        {/* APPROVE */}

                        <button
                          className="btn"
                          onClick={() =>
                            openApprovalModal(
                              req
                            )
                          }
                          disabled={
                            processingId ===
                            req.id
                          }
                          style={{
                            padding:
                              "4px 10px",
                            fontSize: 11,
                            backgroundColor:
                              "#10b981",
                            color: "white",
                            border: "none",
                            borderRadius: 6,
                            opacity:
                              processingId ===
                              req.id
                                ? 0.6
                                : 1,
                          }}
                        >
                          <Check
                            size={14}
                          />

                          {processingId ===
                          req.id
                            ? "..."
                            : "Approve"}
                        </button>


                        {/* REJECT */}

                        <button
                          className="btn"
                          onClick={() =>
                            handleReject(
                              req.id
                            )
                          }
                          disabled={
                            processingId ===
                            req.id
                          }
                          style={{
                            padding:
                              "4px 10px",
                            fontSize: 11,
                            backgroundColor:
                              "#ef4444",
                            color: "white",
                            border: "none",
                            borderRadius: 6,
                            opacity:
                              processingId ===
                              req.id
                                ? 0.6
                                : 1,
                          }}
                        >
                          <X size={14} />
                          Reject
                        </button>

                      </div>

                    </td>

                  </tr>
                )
              )}

            </tbody>

          </table>

        )}

      </div>


      {/* ======================================================
          DETAIL MODAL
      ====================================================== */}

      {showDetailModal &&
        selectedRequest && (

          <div
            style={modalOverlayStyle}
            onClick={() =>
              setShowDetailModal(false)
            }
          >

            <div
              style={modalStyle}
              onClick={(e) =>
                e.stopPropagation()
              }
            >

              <div
                style={{
                  display: "flex",
                  justifyContent:
                    "space-between",
                  alignItems: "center",
                  marginBottom: 20,
                }}
              >

                <h3
                  style={{
                    margin: 0,
                    display: "flex",
                    alignItems:
                      "center",
                    gap: 8,
                  }}
                >
                  <FileText
                    size={20}
                  />

                  Request Details
                </h3>

                <button
                  onClick={() =>
                    setShowDetailModal(
                      false
                    )
                  }
                  style={closeButtonStyle}
                >
                  ×
                </button>

              </div>


              {/* SUMMARY */}

              <div
                style={detailBoxStyle}
              >

                <DetailRow
                  label="Request ID"
                  value={`#${selectedRequest.id}`}
                />

                <DetailRow
                  label="Status"
                  value={
                    <StatusBadge
                      status={
                        selectedRequest.status
                      }
                    />
                  }
                />

                <DetailRow
                  label="Requested By"
                  value={
                    selectedRequest.requested_by_name ||
                    selectedRequest.requested_by ||
                    "—"
                  }
                />

                <DetailRow
                  label="Requested At"
                  value={
                    selectedRequest.created_at
                      ? formatDate(
                          selectedRequest.created_at
                        )
                      : "N/A"
                  }
                />

                <DetailRow
                  label="Sale"
                  value={`#${
                    selectedRequest.sale_number ??
                    selectedRequest.sale_id ??
                    selectedRequest.sale ??
                    "N/A"
                  }`}
                />

              </div>


              {/* ACTION DETAILS */}

              <div
                style={{
                  marginBottom: 16,
                  padding: 16,
                  backgroundColor:
                    "#f0fdf4",
                  borderRadius: 8,
                  border:
                    "1px solid #bbf7d0",
                }}
              >

                <div
                  style={{
                    display: "flex",
                    alignItems:
                      "center",
                    gap: 8,
                    marginBottom: 10,
                  }}
                >

                  {
                    getDetailDescription(
                      selectedRequest
                    ).icon
                  }

                  <h4
                    style={{
                      margin: 0,
                    }}
                  >
                    {
                      getDetailDescription(
                        selectedRequest
                      ).title
                    }
                  </h4>

                </div>


                <div
                  style={{
                    display: "flex",
                    flexDirection:
                      "column",
                    gap: 6,
                  }}
                >

                  {getDetailDescription(
                    selectedRequest
                  ).details.map(
                    (detail, index) => (

                      <DetailRow
                        key={index}
                        label={
                          detail.label
                        }
                        value={
                          detail.value
                        }
                      />

                    )
                  )}

                </div>

              </div>


              {/* REFUND */}

              {selectedRequest.refund_required && (

                <div
                  style={{
                    marginBottom: 16,
                    padding: 14,
                    backgroundColor:
                      "#fff7ed",
                    border:
                      "1px solid #fed7aa",
                    borderRadius: 8,
                  }}
                >

                  <div
                    style={{
                      display: "flex",
                      alignItems:
                        "center",
                      gap: 8,
                      marginBottom: 8,
                    }}
                  >

                    <AlertCircle
                      size={18}
                      style={{
                        color:
                          "#ea580c",
                      }}
                    />

                    <strong
                      style={{
                        color:
                          "#9a3412",
                      }}
                    >
                      Refund Required
                    </strong>

                  </div>


                  <div
                    style={{
                      fontSize: 14,
                      color: "#7c2d12",
                    }}
                  >
                    Refund Amount:{" "}

                    <strong>
                      {formatCurrency(
                        Number(
                          selectedRequest.refund_amount ||
                            0
                        )
                      )}
                    </strong>
                  </div>


                  <div
                    style={{
                      marginTop: 6,
                      fontSize: 12,
                      color: "#7c2d12",
                    }}
                  >
                    Method:{" "}
                    {selectedRequest.refund_method ||
                      "Not selected"}
                  </div>

                </div>

              )}


              {/* WARNINGS */}

              {selectedRequest.action ===
                "CHANGE_QUANTITY" && (

                <div
                  style={{
                    marginBottom: 16,
                    padding: 12,
                    backgroundColor:
                      "#dbeafe",
                    border:
                      "1px solid #93c5fd",
                    borderRadius: 8,
                  }}
                >

                  Quantity will change from{" "}

                  <strong>
                    {selectedRequest.current_quantity ??
                      "?"}
                  </strong>

                  {" "}to{" "}

                  <strong>
                    {selectedRequest.requested_quantity}
                  </strong>

                </div>
              )}


              {selectedRequest.action ===
                "VOID_SALE" && (

                <div
                  style={{
                    marginBottom: 16,
                    padding: 12,
                    backgroundColor:
                      "#fee2e2",
                    border:
                      "1px solid #fca5a5",
                    borderRadius: 8,
                    color: "#991b1b",
                  }}
                >

                  <strong>
                    Warning:
                  </strong>{" "}

                  This request will void
                  the entire sale and
                  restore the inventory.

                </div>
              )}


              {/* BUTTONS */}

              <div
                style={{
                  display: "flex",
                  gap: 10,
                  justifyContent:
                    "flex-end",
                  marginTop: 20,
                  paddingTop: 16,
                  borderTop:
                    "1px solid #e5e7eb",
                  flexWrap: "wrap",
                }}
              >

                <button
                  className="btn outline"
                  onClick={() =>
                    handleViewSale(
                      selectedRequest.sale_id ??
                        selectedRequest.sale
                    )
                  }
                  disabled={
                    !(
                      selectedRequest.sale_id ??
                      selectedRequest.sale
                    )
                  }
                >
                  <Eye size={15} />
                  View Sale
                </button>


                {selectedRequest.status ===
                  "PENDING" && (

                  <>
                    <button
                      className="btn"
                      onClick={() =>
                        openApprovalModal(
                          selectedRequest
                        )
                      }
                      disabled={
                        processingId ===
                        selectedRequest.id
                      }
                      style={{
                        backgroundColor:
                          "#10b981",
                        color: "white",
                        border: "none",
                      }}
                    >
                      <Check
                        size={15}
                      />
                      Approve
                    </button>


                    <button
                      className="btn"
                      onClick={async () => {
                        await handleReject(
                          selectedRequest.id
                        );

                        setShowDetailModal(
                          false
                        );
                      }}
                      disabled={
                        processingId ===
                        selectedRequest.id
                      }
                      style={{
                        backgroundColor:
                          "#ef4444",
                        color: "white",
                        border: "none",
                      }}
                    >
                      <X size={15} />
                      Reject
                    </button>
                  </>
                )}


                <button
                  className="btn outline"
                  onClick={() =>
                    setShowDetailModal(
                      false
                    )
                  }
                >
                  Close
                </button>

              </div>

            </div>

          </div>
        )}


      {/* ======================================================
          REFUND APPROVAL MODAL
      ====================================================== */}

      {showApprovalModal &&
        approvalRequest && (

          <div
            style={modalOverlayStyle}
            onClick={closeApprovalModal}
          >

            <div
              style={{
                ...modalStyle,
                maxWidth: 520,
              }}
              onClick={(e) =>
                e.stopPropagation()
              }
            >

              <div
                style={{
                  display: "flex",
                  justifyContent:
                    "space-between",
                  alignItems: "center",
                  marginBottom: 20,
                }}
              >

                <div>

                  <h3
                    style={{
                      margin: 0,
                    }}
                  >
                    Approve Adjustment
                  </h3>

                  <div
                    style={{
                      marginTop: 4,
                      fontSize: 12,
                      color: "#6b7280",
                    }}
                  >
                    Request #
                    {approvalRequest.id}
                  </div>

                </div>


                <button
                  onClick={
                    closeApprovalModal
                  }
                  disabled={
                    processingId !== null
                  }
                  style={
                    closeButtonStyle
                  }
                >
                  ×
                </button>

              </div>


              {/* SALE / PRODUCT */}

              <div
                style={{
                  backgroundColor:
                    "#f9fafb",
                  padding: 14,
                  borderRadius: 8,
                  marginBottom: 18,
                }}
              >

                <DetailRow
                  label="Sale"
                  value={`#${
                    approvalRequest.sale_number ??
                    approvalRequest.sale_id ??
                    approvalRequest.sale ??
                    "N/A"
                  }`}
                />

                <DetailRow
                  label="Product"
                  value={
                    approvalRequest.product_name ||
                    "Unknown Product"
                  }
                />

                <DetailRow
                  label="Action"
                  value={getActionDisplay(
                    approvalRequest.action
                  )}
                />

              </div>


              {/* REFUND */}

              <div
                style={{
                  backgroundColor:
                    "#fff7ed",
                  border:
                    "1px solid #fed7aa",
                  borderRadius: 8,
                  padding: 14,
                  marginBottom: 20,
                }}
              >

                <div
                  style={{
                    display: "flex",
                    alignItems:
                      "center",
                    gap: 8,
                    marginBottom: 8,
                  }}
                >

                  <AlertCircle
                    size={18}
                    style={{
                      color:
                        "#ea580c",
                    }}
                  />

                  <strong
                    style={{
                      color:
                        "#9a3412",
                    }}
                  >
                    Customer Refund Required
                  </strong>

                </div>


                <div
                  style={{
                    fontSize: 14,
                    color: "#7c2d12",
                  }}
                >

                  Refund Amount:{" "}

                  <strong>
                    {formatCurrency(
                      Number(
                        approvalRequest.refund_amount ||
                          0
                      )
                    )}
                  </strong>

                </div>


                <p
                  style={{
                    fontSize: 12,
                    color: "#7c2d12",
                    margin:
                      "8px 0 0",
                  }}
                >
                  Select how the cashier
                  will return the money.
                  The M-Pesa transaction
                  reference is entered by
                  the cashier when the
                  refund is actually sent.
                </p>

              </div>


              {/* REFUND METHOD */}

              <div
                style={{
                  marginBottom: 20,
                }}
              >

                <label
                  style={{
                    display: "block",
                    marginBottom: 8,
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  Refund Method *
                </label>


                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "1fr 1fr",
                    gap: 12,
                  }}
                >

                  {/* CASH */}

                  <button
                    type="button"
                    onClick={() =>
                      setRefundMethod(
                        "CASH"
                      )
                    }
                    style={{
                      padding: 16,
                      borderRadius: 10,

                      border:
                        refundMethod ===
                        "CASH"
                          ? "2px solid #16a34a"
                          : "1px solid #d1d5db",

                      backgroundColor:
                        refundMethod ===
                        "CASH"
                          ? "#f0fdf4"
                          : "white",

                      cursor: "pointer",
                      textAlign: "left",
                    }}
                  >

                    <div
                      style={{
                        display:
                          "flex",
                        alignItems:
                          "center",
                        gap: 8,
                        marginBottom: 6,
                      }}
                    >

                      <Banknote
                        size={20}
                      />

                      <strong>
                        Cash
                      </strong>

                    </div>

                    <div
                      style={{
                        fontSize: 12,
                        color:
                          "#6b7280",
                      }}
                    >
                      Cashier hands the
                      refund directly to
                      the customer.
                    </div>

                  </button>


                  {/* MPESA */}

                  <button
                    type="button"
                    onClick={() =>
                      setRefundMethod(
                        "MPESA"
                      )
                    }
                    style={{
                      padding: 16,
                      borderRadius: 10,

                      border:
                        refundMethod ===
                        "MPESA"
                          ? "2px solid #16a34a"
                          : "1px solid #d1d5db",

                      backgroundColor:
                        refundMethod ===
                        "MPESA"
                          ? "#f0fdf4"
                          : "white",

                      cursor: "pointer",
                      textAlign: "left",
                    }}
                  >

                    <div
                      style={{
                        display:
                          "flex",
                        alignItems:
                          "center",
                        gap: 8,
                        marginBottom: 6,
                      }}
                    >

                      <Smartphone
                        size={20}
                      />

                      <strong>
                        M-Pesa
                      </strong>

                    </div>

                    <div
                      style={{
                        fontSize: 12,
                        color:
                          "#6b7280",
                      }}
                    >
                      Cashier sends the
                      refund and records
                      the reference.
                    </div>

                  </button>

                </div>

              </div>


              {/* MODAL ACTIONS */}

              <div
                style={{
                  display: "flex",
                  justifyContent:
                    "flex-end",
                  gap: 10,
                }}
              >

                <button
                  className="btn outline"
                  onClick={
                    closeApprovalModal
                  }
                  disabled={
                    processingId !== null
                  }
                >
                  Cancel
                </button>


                <button
                  className="btn"
                  onClick={
                    confirmApproval
                  }
                  disabled={
                    processingId ===
                    approvalRequest.id
                  }
                  style={{
                    backgroundColor:
                      "#10b981",
                    color: "white",
                    border: "none",
                  }}
                >

                  {processingId ===
                  approvalRequest.id
                    ? "Approving..."
                    : "Approve Request"}

                </button>

              </div>

            </div>

          </div>
        )}

    </AppLayout>
  );
}


// ==========================================================
// HELPER COMPONENTS
// ==========================================================

function DetailRow({
  label,
  value,
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent:
          "space-between",
        gap: 15,
        padding: "5px 0",
      }}
    >
      <span
        style={{
          color: "#6b7280",
          fontSize: 13,
        }}
      >
        {label}
      </span>

      <span
        style={{
          fontWeight: 500,
          fontSize: 13,
          textAlign: "right",
        }}
      >
        {value}
      </span>
    </div>
  );
}


// ==========================================================
// STYLES
// ==========================================================

const modalOverlayStyle = {
  position: "fixed",
  inset: 0,
  backgroundColor:
    "rgba(0,0,0,0.5)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 2100,
  padding: 20,
};


const modalStyle = {
  backgroundColor: "white",
  borderRadius: 12,
  width: "90%",
  maxWidth: 600,
  maxHeight: "90vh",
  overflow: "auto",
  padding: 24,
  boxShadow:
    "0 20px 40px rgba(0,0,0,0.18)",
};


const detailBoxStyle = {
  marginBottom: 16,
  padding: 12,
  backgroundColor: "#f9fafb",
  borderRadius: 8,
};


const closeButtonStyle = {
  background: "none",
  border: "none",
  fontSize: 24,
  cursor: "pointer",
  color: "#6b7280",
  lineHeight: 1,
};