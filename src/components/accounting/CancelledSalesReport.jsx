import React, { useEffect, useMemo, useState } from "react";
import { api } from "../../api/axios";

function formatMoney(value) {
  return Number(value || 0).toLocaleString("en-KE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatDateTime(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("en-KE", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function formatDate(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-KE", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatPaymentMethods(paymentMethods) {
  if (!paymentMethods || typeof paymentMethods !== "object") {
    return "-";
  }

  const entries = Object.entries(paymentMethods);

  if (!entries.length) {
    return "-";
  }

  return entries
    .map(
      ([method, amount]) =>
        `${method}: KES ${formatMoney(amount)}`
    )
    .join(" • ");
}

export default function CancelledSalesReport({
  filters,
}) {
  const [rows, setRows] = useState([]);
  const [reportMeta, setReportMeta] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [selectedSale, setSelectedSale] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function loadCancelledSales() {
      if (!filters?.start || !filters?.end) {
        setRows([]);
        setReportMeta(null);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const response = await api.get(
          "/api/reports/cancelled-sales/",
          {
            params: {
              start: filters.start,
              end: filters.end,
              ...(filters.branch
                ? { branch: filters.branch }
                : {}),
            },
          }
        );

        if (cancelled) {
          return;
        }

        const data = response.data || {};

        setRows(
          Array.isArray(data.rows)
            ? data.rows
            : []
        );

        setReportMeta(data);
      } catch (err) {
        if (cancelled) {
          return;
        }

        setRows([]);
        setReportMeta(null);

        setError(
          err?.response?.data?.detail ||
            err?.response?.data?.error ||
            "Failed to load cancelled sales."
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadCancelledSales();

    return () => {
      cancelled = true;
    };
  }, [
    filters?.start,
    filters?.end,
    filters?.branch,
  ]);

  const summary = useMemo(() => {
    return rows.reduce(
      (result, row) => {
        result.sales += 1;

        result.originalValue += Number(
          row.original_total || 0
        );

        result.historicalPayments += Number(
          row.payment_total || 0
        );

        return result;
      },
      {
        sales: 0,
        originalValue: 0,
        historicalPayments: 0,
      }
    );
  }, [rows]);

  const hasRows = rows.length > 0;

  return (
    <div
      className="card"
      style={{
        padding: 24,
        marginTop: 20,
      }}
    >
      {/* ===================================================== */}
      {/* HEADER */}
      {/* ===================================================== */}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 16,
          flexWrap: "wrap",
          marginBottom: 20,
        }}
      >
        <div>
          <h2 style={{ margin: 0 }}>
            Cancelled Sales
          </h2>

          <p
            className="muted"
            style={{
              marginTop: 6,
              marginBottom: 0,
            }}
          >
            Cancelled transactions retained for
            audit and review.
          </p>

          {filters?.start && filters?.end && (
            <div
              className="muted"
              style={{
                marginTop: 8,
                fontSize: 14,
              }}
            >
              {filters.start} → {filters.end}
              {filters.branch && (
                <>
                  {" "}
                  • Branch selected
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ===================================================== */}
      {/* SUMMARY CARDS */}
      {/* ===================================================== */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 16,
          marginBottom: 24,
        }}
      >
        <div
          className="card"
          style={{
            padding: 18,
          }}
        >
          <div className="muted">
            Cancelled Sales
          </div>

          <h2
            style={{
              margin: "8px 0 0",
            }}
          >
            {loading
              ? "..."
              : summary.sales.toLocaleString()}
          </h2>
        </div>

        <div
          className="card"
          style={{
            padding: 18,
          }}
        >
          <div className="muted">
            Original Sale Value
          </div>

          <h2
            style={{
              margin: "8px 0 0",
            }}
          >
            KES{" "}
            {loading
              ? "..."
              : formatMoney(
                  summary.originalValue
                )}
          </h2>
        </div>

        <div
          className="card"
          style={{
            padding: 18,
          }}
        >
          <div className="muted">
            Historical Payments
          </div>

          <h2
            style={{
              margin: "8px 0 0",
            }}
          >
            KES{" "}
            {loading
              ? "..."
              : formatMoney(
                  summary.historicalPayments
                )}
          </h2>
        </div>
      </div>

      {/* ===================================================== */}
      {/* ERROR */}
      {/* ===================================================== */}

      {error && (
        <div
          style={{
            padding: 14,
            marginBottom: 20,
            borderRadius: 8,
            background: "#fff3f3",
            color: "#b42318",
          }}
        >
          {error}
        </div>
      )}

      {/* ===================================================== */}
      {/* LOADING */}
      {/* ===================================================== */}

      {loading && (
        <div
          style={{
            padding: 20,
            textAlign: "center",
          }}
          className="muted"
        >
          Loading cancelled sales...
        </div>
      )}

      {/* ===================================================== */}
      {/* EMPTY */}
      {/* ===================================================== */}

      {!loading && !error && !hasRows && (
        <div
          style={{
            padding: 30,
            textAlign: "center",
            border: "1px dashed #ddd",
            borderRadius: 10,
          }}
        >
          <div
            style={{
              fontSize: 18,
              fontWeight: 600,
              marginBottom: 6,
            }}
          >
            No cancelled sales
          </div>

          <div className="muted">
            There are no cancelled sales for the
            selected period and branch.
          </div>
        </div>
      )}

      {/* ===================================================== */}
      {/* TABLE */}
      {/* ===================================================== */}

      {!loading && !error && hasRows && (
        <div
          style={{
            overflowX: "auto",
          }}
        >
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              minWidth: 1250,
            }}
          >
            <thead>
              <tr>
                <th
                  style={{
                    textAlign: "left",
                    padding: "12px 10px",
                    borderBottom: "1px solid #ddd",
                  }}
                >
                  Date
                </th>

                <th
                  style={{
                    textAlign: "left",
                    padding: "12px 10px",
                    borderBottom: "1px solid #ddd",
                  }}
                >
                  Sale
                </th>

                <th
                  style={{
                    textAlign: "left",
                    padding: "12px 10px",
                    borderBottom: "1px solid #ddd",
                  }}
                >
                  Branch
                </th>

                <th
                  style={{
                    textAlign: "left",
                    padding: "12px 10px",
                    borderBottom: "1px solid #ddd",
                  }}
                >
                  Cashier
                </th>

                <th
                  style={{
                    textAlign: "left",
                    padding: "12px 10px",
                    borderBottom: "1px solid #ddd",
                  }}
                >
                  Customer
                </th>

                <th
                  style={{
                    textAlign: "right",
                    padding: "12px 10px",
                    borderBottom: "1px solid #ddd",
                  }}
                >
                  Original Total
                </th>

                <th
                  style={{
                    textAlign: "right",
                    padding: "12px 10px",
                    borderBottom: "1px solid #ddd",
                  }}
                >
                  Historical Paid
                </th>

                <th
                  style={{
                    textAlign: "left",
                    padding: "12px 10px",
                    borderBottom: "1px solid #ddd",
                  }}
                >
                  Reason
                </th>

                <th
                  style={{
                    textAlign: "left",
                    padding: "12px 10px",
                    borderBottom: "1px solid #ddd",
                  }}
                >
                  Cancelled By
                </th>

                <th
                  style={{
                    textAlign: "left",
                    padding: "12px 10px",
                    borderBottom: "1px solid #ddd",
                  }}
                >
                  Cancelled At
                </th>

                <th
                  style={{
                    textAlign: "center",
                    padding: "12px 10px",
                    borderBottom: "1px solid #ddd",
                  }}
                >
                  Action
                </th>
              </tr>
            </thead>

            <tbody>
              {rows.map((row) => (
                <tr key={row.sale_id}>
                  <td
                    style={{
                      padding: "12px 10px",
                      borderBottom:
                        "1px solid #eee",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {formatDate(row.date)}
                  </td>

                  <td
                    style={{
                      padding: "12px 10px",
                      borderBottom:
                        "1px solid #eee",
                      fontWeight: 600,
                      whiteSpace: "nowrap",
                    }}
                  >
                    #{row.sale_id}
                  </td>

                  <td
                    style={{
                      padding: "12px 10px",
                      borderBottom:
                        "1px solid #eee",
                    }}
                  >
                    {row.branch || "-"}
                  </td>

                  <td
                    style={{
                      padding: "12px 10px",
                      borderBottom:
                        "1px solid #eee",
                    }}
                  >
                    {row.cashier || "-"}
                  </td>

                  <td
                    style={{
                      padding: "12px 10px",
                      borderBottom:
                        "1px solid #eee",
                    }}
                  >
                    {row.customer || "Walk-in"}
                  </td>

                  <td
                    style={{
                      padding: "12px 10px",
                      borderBottom:
                        "1px solid #eee",
                      textAlign: "right",
                      whiteSpace: "nowrap",
                    }}
                  >
                    KES{" "}
                    {formatMoney(
                      row.original_total
                    )}
                  </td>

                  <td
                    style={{
                      padding: "12px 10px",
                      borderBottom:
                        "1px solid #eee",
                      textAlign: "right",
                      whiteSpace: "nowrap",
                    }}
                  >
                    KES{" "}
                    {formatMoney(
                      row.payment_total
                    )}
                  </td>

                  <td
                    style={{
                      padding: "12px 10px",
                      borderBottom:
                        "1px solid #eee",
                      maxWidth: 260,
                    }}
                  >
                    {row.reason || "-"}
                  </td>

                  <td
                    style={{
                      padding: "12px 10px",
                      borderBottom:
                        "1px solid #eee",
                    }}
                  >
                    {row.cancelled_by || "-"}
                  </td>

                  <td
                    style={{
                      padding: "12px 10px",
                      borderBottom:
                        "1px solid #eee",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {formatDateTime(
                      row.cancelled_at
                    )}
                  </td>

                  <td
                    style={{
                      padding: "12px 10px",
                      borderBottom:
                        "1px solid #eee",
                      textAlign: "center",
                    }}
                  >
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() =>
                        setSelectedSale(row)
                      }
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>

            {/* ================================================= */}
            {/* TOTAL */}
            {/* ================================================= */}

            <tfoot>
              <tr>
                <td
                  colSpan={5}
                  style={{
                    padding: "14px 10px",
                    fontWeight: 700,
                    borderTop:
                      "2px solid #ddd",
                  }}
                >
                  Total
                </td>

                <td
                  style={{
                    padding: "14px 10px",
                    textAlign: "right",
                    fontWeight: 700,
                    borderTop:
                      "2px solid #ddd",
                    whiteSpace: "nowrap",
                  }}
                >
                  KES{" "}
                  {formatMoney(
                    summary.originalValue
                  )}
                </td>

                <td
                  style={{
                    padding: "14px 10px",
                    textAlign: "right",
                    fontWeight: 700,
                    borderTop:
                      "2px solid #ddd",
                    whiteSpace: "nowrap",
                  }}
                >
                  KES{" "}
                  {formatMoney(
                    summary.historicalPayments
                  )}
                </td>

                <td
                  colSpan={4}
                  style={{
                    borderTop:
                      "2px solid #ddd",
                  }}
                />
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* ===================================================== */}
      {/* DETAIL MODAL */}
      {/* ===================================================== */}

      {selectedSale && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background:
              "rgba(0, 0, 0, 0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
            zIndex: 1000,
          }}
          onClick={() =>
            setSelectedSale(null)
          }
        >
          <div
            className="card"
            style={{
              width: "min(800px, 100%)",
              maxHeight: "90vh",
              overflowY: "auto",
              padding: 24,
            }}
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div
              style={{
                display: "flex",
                justifyContent:
                  "space-between",
                alignItems: "center",
                gap: 16,
                marginBottom: 20,
              }}
            >
              <div>
                <h2
                  style={{
                    margin: 0,
                  }}
                >
                  Cancelled Sale #
                  {selectedSale.sale_id}
                </h2>

                <div
                  className="muted"
                  style={{
                    marginTop: 5,
                  }}
                >
                  {formatDateTime(
                    selectedSale.date
                  )}
                </div>
              </div>

              <button
                type="button"
                className="btn-secondary"
                onClick={() =>
                  setSelectedSale(null)
                }
              >
                Close
              </button>
            </div>

            {/* SALE INFORMATION */}

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(220px, 1fr))",
                gap: 14,
                marginBottom: 22,
              }}
            >
              <div>
                <div className="muted">
                  Branch
                </div>
                <strong>
                  {selectedSale.branch ||
                    "-"}
                </strong>
              </div>

              <div>
                <div className="muted">
                  Cashier
                </div>
                <strong>
                  {selectedSale.cashier ||
                    "-"}
                </strong>
              </div>

              <div>
                <div className="muted">
                  Customer
                </div>
                <strong>
                  {selectedSale.customer ||
                    "Walk-in"}
                </strong>
              </div>

              <div>
                <div className="muted">
                  Original Total
                </div>
                <strong>
                  KES{" "}
                  {formatMoney(
                    selectedSale.original_total
                  )}
                </strong>
              </div>

              <div>
                <div className="muted">
                  Historical Paid
                </div>
                <strong>
                  KES{" "}
                  {formatMoney(
                    selectedSale.payment_total
                  )}
                </strong>
              </div>

              <div>
                <div className="muted">
                  Historical Balance
                </div>
                <strong>
                  KES{" "}
                  {formatMoney(
                    selectedSale.balance_due
                  )}
                </strong>
              </div>
            </div>

            {/* CANCELLATION */}

            <div
              style={{
                padding: 16,
                borderRadius: 10,
                border: "1px solid #e5e7eb",
                marginBottom: 20,
              }}
            >
              <h3
                style={{
                  marginTop: 0,
                }}
              >
                Cancellation
              </h3>

              <div
                style={{
                  display: "grid",
                  gap: 12,
                }}
              >
                <div>
                  <div className="muted">
                    Reason
                  </div>

                  <div
                    style={{
                      marginTop: 4,
                    }}
                  >
                    {selectedSale.reason ||
                      "No reason recorded"}
                  </div>
                </div>

                <div>
                  <div className="muted">
                    Cancelled By
                  </div>

                  <div
                    style={{
                      marginTop: 4,
                    }}
                  >
                    {selectedSale.cancelled_by ||
                      "-"}
                  </div>
                </div>

                <div>
                  <div className="muted">
                    Cancelled At
                  </div>

                  <div
                    style={{
                      marginTop: 4,
                    }}
                  >
                    {formatDateTime(
                      selectedSale.cancelled_at
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* PAYMENT METHODS */}

            <div
              style={{
                padding: 16,
                borderRadius: 10,
                border: "1px solid #e5e7eb",
                marginBottom: 20,
              }}
            >
              <h3
                style={{
                  marginTop: 0,
                }}
              >
                Historical Payments
              </h3>

              <div
                style={{
                  marginTop: 8,
                }}
              >
                {formatPaymentMethods(
                  selectedSale.payment_methods
                )}
              </div>
            </div>

            {/* AUDIT WARNING */}

            <div
              style={{
                padding: 14,
                borderRadius: 8,
                background: "#fff8e6",
                border: "1px solid #f0d98c",
                fontSize: 14,
              }}
            >
              This transaction is cancelled and
              is excluded from operational revenue,
              collections, profit, orders, and
              items-sold reports. The record remains
              available here for audit purposes.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}