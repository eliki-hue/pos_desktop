import React, { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "../api/axios";
import AppLayout from "../components/AppLayout";

function formatMoney(value) {
  const number = Number(value || 0);

  return `KES ${number.toLocaleString("en-KE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDateTime(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleString("en-KE", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatStatus(status) {
  switch (String(status || "").toUpperCase()) {
    case "PAID":
      return "Paid";

    case "PARTIAL":
      return "Partial";

    case "CREDIT":
      return "Credit";

    case "CANCELLED":
    case "CANCELED":
      return "Cancelled";

    default:
      return status || "-";
  }
}

function statusStyle(status) {
  const normalized = String(status || "").toUpperCase();

  if (normalized === "PAID") {
    return {
      background: "#ecfdf3",
      color: "#027a48",
    };
  }

  if (normalized === "PARTIAL") {
    return {
      background: "#fffaeb",
      color: "#b54708",
    };
  }

  if (normalized === "CREDIT") {
    return {
      background: "#fff1f3",
      color: "#c01048",
    };
  }

  if (
    normalized === "CANCELLED" ||
    normalized === "CANCELED"
  ) {
    return {
      background: "#f2f4f7",
      color: "#344054",
    };
  }

  return {
    background: "#f2f4f7",
    color: "#344054",
  };
}

function todayString() {
  const date = new Date();

  const year = date.getFullYear();
  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");
  const day = String(
    date.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export default function AccountantSales() {
  // ============================================================
  // FILTER STATE
  // ============================================================

  const [startDate, setStartDate] =
    useState(todayString());

  const [endDate, setEndDate] =
    useState(todayString());

  const [branch, setBranch] =
    useState("");

  const [cashier, setCashier] =
    useState("");

  const [status, setStatus] =
    useState("");

  // ============================================================
  // PAGINATION
  // ============================================================

  const [page, setPage] =
    useState(0);

  const [pageSize, setPageSize] =
    useState(25);

  const [totalRows, setTotalRows] =
    useState(0);

  // ============================================================
  // DATA
  // ============================================================

  const [sales, setSales] =
    useState([]);

  const [branches, setBranches] =
    useState([]);

  const [cashiers, setCashiers] =
    useState([]);

  // ============================================================
  // LOADING / ERRORS
  // ============================================================

  const [loading, setLoading] =
    useState(false);

  const [loadingBranches, setLoadingBranches] =
    useState(false);

  const [loadingCashiers, setLoadingCashiers] =
    useState(false);

  const [error, setError] =
    useState("");

  const [cashierError, setCashierError] =
    useState("");

  // ============================================================
  // SELECTED SALE
  // ============================================================

  const [selectedSaleId, setSelectedSaleId] =
    useState(null);

  const [selectedSale, setSelectedSale] =
    useState(null);

  const [loadingSaleDetails, setLoadingSaleDetails] =
    useState(false);

  const [saleDetailsError, setSaleDetailsError] =
    useState("");

  // ============================================================
  // LOAD BRANCHES
  // ============================================================

  useEffect(() => {
    let cancelled = false;

    async function loadBranches() {
      setLoadingBranches(true);

      try {
        const response = await api.get(
          "/api/branches/"
        );

        if (cancelled) {
          return;
        }

        const data = Array.isArray(
          response.data
        )
          ? response.data
          : Array.isArray(
              response.data?.results
            )
          ? response.data.results
          : [];

        setBranches(data);
      } catch (err) {
        if (!cancelled) {
          setBranches([]);
        }

        console.error(
          "Failed to load branches:",
          err
        );
      } finally {
        if (!cancelled) {
          setLoadingBranches(false);
        }
      }
    }

    loadBranches();

    return () => {
      cancelled = true;
    };
  }, []);

  // ============================================================
  // LOAD CASHIERS
  // ============================================================

  useEffect(() => {
    let cancelled = false;

    async function loadCashiers() {
      setLoadingCashiers(true);
      setCashierError("");

      try {
        const response = await api.get(
            "/api/reports/cashiers/",
            {
                params: {
                ...(branch
                    ? { branch }
                    : {}),
                },
            }
            );
        if (cancelled) {
          return;
        }

        const data = Array.isArray(response.data)
            ? response.data
            : [];

        setCashiers(data);

        // If the currently selected cashier
        // is no longer available after a branch
        // change, clear it.
        if (
          cashier &&
          !data.some(
            (item) =>
              String(item.id) ===
              String(cashier)
          )
        ) {
          setCashier("");
        }
      } catch (err) {
        if (!cancelled) {
          setCashiers([]);

          setCashierError(
            err?.response?.data?.detail ||
              err?.response?.data?.error ||
              "Failed to load cashiers."
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingCashiers(false);
        }
      }
    }

    loadCashiers();

    return () => {
      cancelled = true;
    };
  }, [branch]);

  // ============================================================
  // LOAD SALES
  // ============================================================

  const loadSales = useCallback(
    async () => {
      if (!startDate || !endDate) {
        return;
      }

      if (startDate > endDate) {
        setError(
          "Start date cannot be after end date."
        );
        setSales([]);
        setTotalRows(0);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const response = await api.get(
          "/api/reports/all-sales/",
          {
            params: {
              start: startDate,
              end: endDate,

              limit: pageSize,
              offset:
                page * pageSize,

              ...(branch
                ? { branch }
                : {}),

              ...(cashier
                ? { cashier }
                : {}),

              ...(status
                ? { status }
                : {}),
            },
          }
        );

        const data =
          response.data || {};

        const results = Array.isArray(
          data.results
        )
          ? data.results
          : [];

        setSales(results);

        setTotalRows(
          Number(data.count || 0)
        );
      } catch (err) {
        console.error(
          "Failed to load sales:",
          err
        );

        setSales([]);
        setTotalRows(0);

        setError(
          err?.response?.data?.detail ||
            err?.response?.data?.error ||
            "Failed to load sales."
        );
      } finally {
        setLoading(false);
      }
    },
    [
      startDate,
      endDate,
      branch,
      cashier,
      status,
      page,
      pageSize,
    ]
  );

  useEffect(() => {
    loadSales();
  }, [loadSales]);

  // ============================================================
  // RESET PAGE WHEN FILTERS CHANGE
  // ============================================================

  useEffect(() => {
    setPage(0);
  }, [
    startDate,
    endDate,
    branch,
    cashier,
    status,
  ]);

  // ============================================================
  // SUMMARY FOR CURRENT RESULT SET
  // ============================================================

  const summary = useMemo(() => {
    return sales.reduce(
      (result, sale) => {
        result.total += Number(
          sale.total || 0
        );

        result.paid += Number(
          sale.amount_paid || 0
        );

        result.balance += Number(
          sale.balance_due || 0
        );

        if (
          String(sale.status || "").toUpperCase() ===
            "CANCELLED" ||
          String(sale.status || "").toUpperCase() ===
            "CANCELED"
        ) {
          result.cancelled += 1;
        } else {
          result.active += 1;
        }

        return result;
      },
      {
        total: 0,
        paid: 0,
        balance: 0,
        active: 0,
        cancelled: 0,
      }
    );
  }, [sales]);

  // ============================================================
  // VIEW SALE DETAILS
  // ============================================================

  const openSaleDetails = async (saleId) => {
    setSelectedSaleId(saleId);
    setSelectedSale(null);
    setSaleDetailsError("");
    setLoadingSaleDetails(true);

    try {
      const response = await api.get(
        `/api/cart/sales/${saleId}/`
      );

      setSelectedSale(
        response.data
      );
    } catch (err) {
      console.error(
        "Failed to load sale details:",
        err
      );

      setSaleDetailsError(
        err?.response?.data?.detail ||
          err?.response?.data?.error ||
          "Failed to load sale details."
      );
    } finally {
      setLoadingSaleDetails(false);
    }
  };

  const closeSaleDetails = () => {
    setSelectedSaleId(null);
    setSelectedSale(null);
    setSaleDetailsError("");
  };

  // ============================================================
  // PAGINATION
  // ============================================================

  const totalPages = Math.max(
    1,
    Math.ceil(
      totalRows / pageSize
    )
  );

  const firstRow =
    totalRows === 0
      ? 0
      : page * pageSize + 1;

  const lastRow =
    totalRows === 0
      ? 0
      : Math.min(
          (page + 1) * pageSize,
          totalRows
        );

  const canGoPrevious =
    page > 0 && !loading;

  const canGoNext =
    (page + 1) * pageSize <
      totalRows &&
    !loading;

  // ============================================================
  // FILTER ACTIONS
  // ============================================================

  const clearFilters = () => {
    const today = todayString();

    setStartDate(today);
    setEndDate(today);
    setBranch("");
    setCashier("");
    setStatus("");
    setPage(0);
  };

  return (
    <AppLayout
      title="Sales Register"
      subtitle="Complete sales records for accounting, review and audit"
    >
      {/* ====================================================== */}
      {/* FILTER CARD */}
      {/* ====================================================== */}

      <div
        className="card"
        style={{
          padding: 20,
          marginBottom: 20,
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 12,
            alignItems: "end",
          }}
        >
          {/* DATE FROM */}

          <label>
            <div
              className="muted"
              style={{
                marginBottom: 6,
              }}
            >
              Date From
            </div>

            <input
              className="input"
              type="date"
              value={startDate}
              onChange={(event) =>
                setStartDate(
                  event.target.value
                )
              }
            />
          </label>

          {/* DATE TO */}

          <label>
            <div
              className="muted"
              style={{
                marginBottom: 6,
              }}
            >
              Date To
            </div>

            <input
              className="input"
              type="date"
              value={endDate}
              onChange={(event) =>
                setEndDate(
                  event.target.value
                )
              }
            />
          </label>

          {/* BRANCH */}

          <label>
            <div
              className="muted"
              style={{
                marginBottom: 6,
              }}
            >
              Branch
            </div>

            <select
              className="input"
              value={branch}
              disabled={loadingBranches}
              onChange={(event) =>
                setBranch(
                  event.target.value
                )
              }
            >
              <option value="">
                All Branches
              </option>

              {branches.map(
                (item) => (
                  <option
                    key={item.id}
                    value={item.id}
                  >
                    {item.name}
                  </option>
                )
              )}
            </select>
          </label>

          {/* CASHIER */}

          <label>
            <div
              className="muted"
              style={{
                marginBottom: 6,
              }}
            >
              Cashier
            </div>

            <select
              className="input"
              value={cashier}
              disabled={loadingCashiers}
              onChange={(event) =>
                setCashier(
                  event.target.value
                )
              }
            >
              <option value="">
                All Cashiers
              </option>

              {cashiers.map(
                (item) => (
                  <option
                    key={item.id}
                    value={item.id}
                  >
                    {item.name ||
                      item.username}
                  </option>
                )
              )}
            </select>
          </label>

          {/* STATUS */}

          <label>
            <div
              className="muted"
              style={{
                marginBottom: 6,
              }}
            >
              Status
            </div>

            <select
              className="input"
              value={status}
              onChange={(event) =>
                setStatus(
                  event.target.value
                )
              }
            >
              <option value="">
                All Status
              </option>

              <option value="PAID">
                Paid
              </option>

              <option value="PARTIAL">
                Partial
              </option>

              <option value="CREDIT">
                Credit
              </option>

              <option value="CANCELLED">
                Cancelled
              </option>
            </select>
          </label>

          {/* CLEAR */}

          <button
            type="button"
            className="btn-secondary"
            onClick={clearFilters}
            style={{
              height: 40,
            }}
          >
            Clear Filters
          </button>
        </div>

        {cashierError && (
          <div
            style={{
              marginTop: 10,
              color: "#b42318",
              fontSize: 13,
            }}
          >
            {cashierError}
          </div>
        )}
      </div>

      {/* ====================================================== */}
      {/* SUMMARY */}
      {/* ====================================================== */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 12,
          marginBottom: 20,
        }}
      >
        <div
          className="card"
          style={{
            padding: 16,
          }}
        >
          <div className="muted">
            Records on Page
          </div>

          <h3
            style={{
              margin: "7px 0 0",
            }}
          >
            {sales.length.toLocaleString()}
          </h3>
        </div>

        <div
          className="card"
          style={{
            padding: 16,
          }}
        >
          <div className="muted">
            Total Records
          </div>

          <h3
            style={{
              margin: "7px 0 0",
            }}
          >
            {totalRows.toLocaleString()}
          </h3>
        </div>

        <div
          className="card"
          style={{
            padding: 16,
          }}
        >
          <div className="muted">
            Current Page Value
          </div>

          <h3
            style={{
              margin: "7px 0 0",
            }}
          >
            {formatMoney(
              summary.total
            )}
          </h3>
        </div>

        <div
          className="card"
          style={{
            padding: 16,
          }}
        >
          <div className="muted">
            Current Page Paid
          </div>

          <h3
            style={{
              margin: "7px 0 0",
            }}
          >
            {formatMoney(
              summary.paid
            )}
          </h3>
        </div>

        <div
          className="card"
          style={{
            padding: 16,
          }}
        >
          <div className="muted">
            Cancelled on Page
          </div>

          <h3
            style={{
              margin: "7px 0 0",
            }}
          >
            {summary.cancelled.toLocaleString()}
          </h3>
        </div>
      </div>

      {/* ====================================================== */}
      {/* ERROR */}
      {/* ====================================================== */}

      {error && (
        <div
          style={{
            padding: 14,
            marginBottom: 16,
            borderRadius: 8,
            background: "#fff3f3",
            color: "#b42318",
          }}
        >
          {error}
        </div>
      )}

      {/* ====================================================== */}
      {/* TABLE */}
      {/* ====================================================== */}

      <div
        className="card"
        style={{
          padding: 0,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            overflowX: "auto",
          }}
        >
          <table
            className="table"
            style={{
              width: "100%",
              minWidth: 1150,
            }}
          >
            <thead>
              <tr>
                <th>Sale #</th>
                <th>Date</th>
                <th>Branch</th>
                <th>Cashier</th>
                <th>Customer</th>

                <th
                  style={{
                    textAlign: "right",
                  }}
                >
                  Total
                </th>

                <th
                  style={{
                    textAlign: "right",
                  }}
                >
                  Paid
                </th>

                <th
                  style={{
                    textAlign: "right",
                  }}
                >
                  Balance
                </th>

                <th>Status</th>

                <th
                  style={{
                    textAlign: "center",
                  }}
                >
                  Action
                </th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={10}
                    style={{
                      padding: 40,
                      textAlign: "center",
                    }}
                    className="muted"
                  >
                    Loading sales...
                  </td>
                </tr>
              ) : sales.length === 0 ? (
                <tr>
                  <td
                    colSpan={10}
                    style={{
                      padding: 40,
                      textAlign: "center",
                    }}
                    className="muted"
                  >
                    No sales found for the
                    selected filters.
                  </td>
                </tr>
              ) : (
                sales.map((sale) => {
                  const status =
                    String(
                      sale.status ||
                        ""
                    ).toUpperCase();

                  return (
                    <tr
                      key={
                        sale.sale_id
                      }
                    >
                      <td
                        style={{
                          fontWeight: 600,
                          whiteSpace:
                            "nowrap",
                        }}
                      >
                        #{sale.sale_id}
                      </td>

                      <td
                        style={{
                          whiteSpace:
                            "nowrap",
                        }}
                      >
                        {formatDateTime(
                          sale.date
                        )}
                      </td>

                      <td>
                        {sale.branch ||
                          "-"}
                      </td>

                      <td>
                        {sale.cashier ||
                          "-"}
                      </td>

                      <td>
                        <div>
                          {sale.customer ||
                            "Walk-in"}
                        </div>

                        {sale.customer_phone && (
                          <div
                            className="muted"
                            style={{
                              fontSize: 12,
                              marginTop: 2,
                            }}
                          >
                            {
                              sale.customer_phone
                            }
                          </div>
                        )}
                      </td>

                      <td
                        style={{
                          textAlign:
                            "right",
                          whiteSpace:
                            "nowrap",
                        }}
                      >
                        {formatMoney(
                          sale.total
                        )}
                      </td>

                      <td
                        style={{
                          textAlign:
                            "right",
                          whiteSpace:
                            "nowrap",
                        }}
                      >
                        {formatMoney(
                          sale.amount_paid
                        )}
                      </td>

                      <td
                        style={{
                          textAlign:
                            "right",
                          whiteSpace:
                            "nowrap",
                        }}
                      >
                        {formatMoney(
                          sale.balance_due
                        )}
                      </td>

                      <td>
                        <span
                          style={{
                            display:
                              "inline-flex",
                            alignItems:
                              "center",
                            padding:
                              "4px 9px",
                            borderRadius:
                              999,
                            fontSize: 12,
                            fontWeight: 600,
                            ...statusStyle(
                              status
                            ),
                          }}
                        >
                          {formatStatus(
                            status
                          )}
                        </span>
                      </td>

                      <td
                        style={{
                          textAlign:
                            "center",
                        }}
                      >
                        <button
                          type="button"
                          className="btn-secondary"
                          onClick={() =>
                            openSaleDetails(
                              sale.sale_id
                            )
                          }
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ==================================================== */}
        {/* PAGINATION */}
        {/* ==================================================== */}

        <div
          style={{
            display: "flex",
            justifyContent:
              "space-between",
            alignItems: "center",
            gap: 16,
            flexWrap: "wrap",
            padding: 16,
            borderTop:
              "1px solid #eaecf0",
          }}
        >
          <div className="muted">
            Showing{" "}
            {firstRow.toLocaleString()}
            {" – "}
            {lastRow.toLocaleString()}
            {" of "}
            {totalRows.toLocaleString()}
            {" sales"}
          </div>

          <div
            style={{
              display: "flex",
              alignItems:
                "center",
              gap: 8,
              flexWrap: "wrap",
            }}
          >
            <label
              className="muted"
              style={{
                display: "flex",
                alignItems:
                  "center",
                gap: 6,
              }}
            >
              Rows:

              <select
                className="input"
                value={pageSize}
                onChange={(
                  event
                ) => {
                  setPageSize(
                    Number(
                      event.target
                        .value
                    )
                  );
                  setPage(
                    0
                  );
                }}
                style={{
                  width: 80,
                }}
              >
                <option value={10}>
                  10
                </option>

                <option value={25}>
                  25
                </option>

                <option value={50}>
                  50
                </option>

                <option value={100}>
                  100
                </option>
              </select>
            </label>

            <button
              type="button"
              className="btn-secondary"
              disabled={
                !canGoPrevious
              }
              onClick={() =>
                setPage(
                  (value) =>
                    Math.max(
                      value - 1,
                      0
                    )
                )
              }
            >
              Previous
            </button>

            <span
              style={{
                minWidth: 110,
                textAlign:
                  "center",
              }}
            >
              Page{" "}
              {Math.min(
                page + 1,
                totalPages
              )}{" "}
              of {totalPages}
            </span>

            <button
              type="button"
              className="btn-secondary"
              disabled={
                !canGoNext
              }
              onClick={() =>
                setPage(
                  (value) =>
                    value + 1
                )
              }
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* ====================================================== */}
      {/* SALE DETAILS MODAL */}
      {/* ====================================================== */}

      {selectedSaleId && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            background:
              "rgba(0, 0, 0, 0.45)",
            display: "flex",
            alignItems:
              "center",
            justifyContent:
              "center",
            padding: 20,
          }}
          onClick={
            closeSaleDetails
          }
        >
          <div
            className="card"
            style={{
              width:
                "min(850px, 100%)",
              maxHeight: "90vh",
              overflowY: "auto",
              padding: 24,
            }}
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            {/* HEADER */}

            <div
              style={{
                display: "flex",
                justifyContent:
                  "space-between",
                alignItems:
                  "flex-start",
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
                  Sale #
                  {
                    selectedSaleId
                  }
                </h2>

                {selectedSale && (
                  <div
                    className="muted"
                    style={{
                      marginTop: 5,
                    }}
                  >
                    {formatDateTime(
                      selectedSale.created_at
                    )}
                  </div>
                )}
              </div>

              <button
                type="button"
                className="btn-secondary"
                onClick={
                  closeSaleDetails
                }
              >
                Close
              </button>
            </div>

            {/* LOADING */}

            {loadingSaleDetails && (
              <div
                style={{
                  padding: 40,
                  textAlign:
                    "center",
                }}
                className="muted"
              >
                Loading sale details...
              </div>
            )}

            {/* ERROR */}

            {!loadingSaleDetails &&
              saleDetailsError && (
                <div
                  style={{
                    padding: 14,
                    borderRadius: 8,
                    background:
                      "#fff3f3",
                    color:
                      "#b42318",
                  }}
                >
                  {
                    saleDetailsError
                  }
                </div>
              )}

            {/* DETAILS */}

            {!loadingSaleDetails &&
              !saleDetailsError &&
              selectedSale && (
                <>
                  {/* SALE SUMMARY */}

                  <div
                    style={{
                      display:
                        "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(200px, 1fr))",
                      gap: 16,
                      marginBottom: 24,
                    }}
                  >
                    <div>
                      <div className="muted">
                        Status
                      </div>

                      <div
                        style={{
                          marginTop: 5,
                        }}
                      >
                        <span
                          style={{
                            display:
                              "inline-flex",
                            padding:
                              "4px 9px",
                            borderRadius:
                              999,
                            fontSize: 12,
                            fontWeight: 600,
                            ...statusStyle(
                              selectedSale.status
                            ),
                          }}
                        >
                          {formatStatus(
                            selectedSale.status
                          )}
                        </span>
                      </div>
                    </div>

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
                        {selectedSale.customer_name ||
                          "Walk-in"}
                      </strong>
                    </div>

                    <div>
                      <div className="muted">
                        Total
                      </div>

                      <strong>
                        {formatMoney(
                          selectedSale.total
                        )}
                      </strong>
                    </div>

                    <div>
                      <div className="muted">
                        Paid
                      </div>

                      <strong>
                        {formatMoney(
                          selectedSale.paid
                        )}
                      </strong>
                    </div>

                    <div>
                      <div className="muted">
                        Balance
                      </div>

                      <strong>
                        {formatMoney(
                          selectedSale.balance
                        )}
                      </strong>
                    </div>

                    <div>
                      <div className="muted">
                        Customer Phone
                      </div>

                      <strong>
                        {selectedSale.customer_phone ||
                          "-"}
                      </strong>
                    </div>
                  </div>

                  {/* ITEMS */}

                  <div
                    style={{
                      marginBottom: 24,
                    }}
                  >
                    <h3>
                      Items
                    </h3>

                    {Array.isArray(
                      selectedSale.items
                    ) &&
                    selectedSale.items.length >
                      0 ? (
                      <div
                        style={{
                          overflowX:
                            "auto",
                        }}
                      >
                        <table
                          className="table"
                          style={{
                            width:
                              "100%",
                          }}
                        >
                          <thead>
                            <tr>
                              <th>
                                Product
                              </th>

                              <th
                                style={{
                                  textAlign:
                                    "right",
                                }}
                              >
                                Quantity
                              </th>

                              <th
                                style={{
                                  textAlign:
                                    "right",
                                }}
                              >
                                Unit Price
                              </th>

                              <th
                                style={{
                                  textAlign:
                                    "right",
                                }}
                              >
                                Subtotal
                              </th>
                            </tr>
                          </thead>

                          <tbody>
                            {selectedSale.items.map(
                              (
                                item,
                                index
                              ) => (
                                <tr
                                  key={
                                    item.id ||
                                    `${item.product_id}-${index}`
                                  }
                                >
                                  <td>
                                    {
                                      item.product_name
                                    }
                                  </td>

                                  <td
                                    style={{
                                      textAlign:
                                        "right",
                                    }}
                                  >
                                    {
                                      item.quantity
                                    }
                                  </td>

                                  <td
                                    style={{
                                      textAlign:
                                        "right",
                                    }}
                                  >
                                    {formatMoney(
                                      item.unit_price
                                    )}
                                  </td>

                                  <td
                                    style={{
                                      textAlign:
                                        "right",
                                    }}
                                  >
                                    {formatMoney(
                                      item.subtotal
                                    )}
                                  </td>
                                </tr>
                              )
                            )}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div
                        className="muted"
                      >
                        No items recorded.
                      </div>
                    )}
                  </div>

                  {/* PAYMENTS */}

                  <div
                    style={{
                      marginBottom: 24,
                    }}
                  >
                    <h3>
                      Payments
                    </h3>

                    {Array.isArray(
                      selectedSale.payments
                    ) &&
                    selectedSale.payments.length >
                      0 ? (
                      <div
                        style={{
                          overflowX:
                            "auto",
                        }}
                      >
                        <table
                          className="table"
                          style={{
                            width:
                              "100%",
                          }}
                        >
                          <thead>
                            <tr>
                              <th>
                                Date
                              </th>

                              <th>
                                Method
                              </th>

                              <th>
                                Reference
                              </th>

                              <th
                                style={{
                                  textAlign:
                                    "right",
                                }}
                              >
                                Amount
                              </th>
                            </tr>
                          </thead>

                          <tbody>
                            {selectedSale.payments.map(
                              (
                                payment
                              ) => (
                                <tr
                                  key={
                                    payment.id
                                  }
                                >
                                  <td>
                                    {formatDateTime(
                                      payment.date
                                    )}
                                  </td>

                                  <td>
                                    {
                                      payment.method
                                    }
                                  </td>

                                  <td>
                                    {
                                      payment.reference ||
                                      "-"
                                    }
                                  </td>

                                  <td
                                    style={{
                                      textAlign:
                                        "right",
                                    }}
                                  >
                                    {formatMoney(
                                      payment.amount
                                    )}
                                  </td>
                                </tr>
                              )
                            )}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div
                        className="muted"
                      >
                        No payment records.
                      </div>
                    )}
                  </div>

                  {/* CANCELLED NOTICE */}

                  {(
                    String(
                      selectedSale.status ||
                        ""
                    ).toUpperCase() ===
                      "CANCELLED" ||
                    String(
                      selectedSale.status ||
                        ""
                    ).toUpperCase() ===
                      "CANCELED"
                  ) && (
                    <div
                      style={{
                        padding: 14,
                        borderRadius: 8,
                        background:
                          "#f2f4f7",
                        border:
                          "1px solid #d0d5dd",
                        color:
                          "#344054",
                      }}
                    >
                      <strong>
                        Cancelled Sale
                      </strong>

                      <div
                        style={{
                          marginTop: 5,
                        }}
                      >
                        This transaction is
                        retained for audit
                        purposes but excluded
                        from operational
                        financial reports.
                      </div>
                    </div>
                  )}
                </>
              )}
          </div>
        </div>
      )}
    </AppLayout>
  );
}