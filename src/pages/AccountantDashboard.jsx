import React, { useEffect, useState } from "react";
import AppLayout from "../components/AppLayout";
import AccountantReportFilters from "../components/accounting/AccountantReportFilters";
import { api } from "../api/axios";

/* -------------------------------------------------------------------------- */
/* Date Helpers                                                               */
/* -------------------------------------------------------------------------- */

const formatLocalDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const getRecommendedChartType = (range, start, end) => {
  switch (range) {
    case "today":
    case "7d":
    case "30d":
    case "this_month":
      return "daily";

    case "90d":
      return "weekly";

    case "this_year":
      return "monthly";

    case "custom": {
      if (!start || !end) {
        return "daily";
      }

      const startDate = new Date(`${start}T00:00:00`);
      const endDate = new Date(`${end}T00:00:00`);

      const diffDays = Math.ceil(
        (endDate - startDate) /
          (1000 * 60 * 60 * 24)
      );

      if (diffDays <= 31) {
        return "daily";
      }

      if (diffDays <= 120) {
        return "weekly";
      }

      if (diffDays <= 730) {
        return "monthly";
      }

      return "yearly";
    }

    default:
      return "daily";
  }
};

/* -------------------------------------------------------------------------- */
/* Initial Filters                                                            */
/* -------------------------------------------------------------------------- */

const getInitialFilters = () => {
  const today = new Date();
  const start = new Date(today);

  start.setDate(today.getDate() - 6);

  return {
    start: formatLocalDate(start),
    end: formatLocalDate(today),
    range: "7d",
    branch: "",
  };
};

/* -------------------------------------------------------------------------- */
/* Formatting Helpers                                                         */
/* -------------------------------------------------------------------------- */

const formatCurrency = (value) =>
  `KES ${Number(value || 0).toLocaleString("en-KE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const formatNumber = (value) =>
  Number(value || 0).toLocaleString("en-KE");

/* -------------------------------------------------------------------------- */
/* Trend Calculation                                                          */
/* -------------------------------------------------------------------------- */

const calculateTrendData = (data) => {
  const values = data?.values;
  const labels = data?.labels;

  if (
    !Array.isArray(values) ||
    !Array.isArray(labels) ||
    values.length === 0
  ) {
    return null;
  }

  const numericValues = values.map(
    (value) => Number(value) || 0
  );

  const total = numericValues.reduce(
    (sum, value) => sum + value,
    0
  );

  const average = numericValues.length
    ? total / numericValues.length
    : 0;

  const activePeriods = numericValues
    .map((value, index) => ({
      value,
      index,
      label: labels[index],
    }))
    .filter((period) => period.value > 0);

  if (activePeriods.length < 2) {
    return {
      hasComparison: false,
      change: null,
      trend: null,
      total,
      average,
      maxValue:
        activePeriods.length === 1
          ? activePeriods[0].value
          : 0,
      minValue:
        activePeriods.length === 1
          ? activePeriods[0].value
          : 0,
      maxPeriod:
        activePeriods.length === 1
          ? activePeriods[0].label
          : "",
      minPeriod: "",
    };
  }

  const previous =
    activePeriods[activePeriods.length - 2];

  const current =
    activePeriods[activePeriods.length - 1];

  const change =
    previous.value !== 0
      ? ((current.value - previous.value) /
          Math.abs(previous.value)) *
        100
      : 0;

  const trend =
    change > 5
      ? "up"
      : change < -5
      ? "down"
      : "stable";

  const best = activePeriods.reduce(
    (a, b) => (a.value > b.value ? a : b)
  );

  const worst = activePeriods.reduce(
    (a, b) => (a.value < b.value ? a : b)
  );

  return {
    hasComparison: true,
    change,
    trend,
    total,
    average,
    maxValue: best.value,
    minValue: worst.value,
    maxPeriod: best.label,
    minPeriod: worst.label,
  };
};

/* -------------------------------------------------------------------------- */
/* Component                                                                  */
/* -------------------------------------------------------------------------- */

export default function AccountantDashboard() {
  /* ------------------------------------------------------------------------ */
  /* Filter State                                                             */
  /* ------------------------------------------------------------------------ */

  const [filters, setFilters] = useState(
    getInitialFilters
  );

  /* ------------------------------------------------------------------------ */
  /* Overview State                                                           */
  /* ------------------------------------------------------------------------ */

  const [overview, setOverview] = useState(null);
  const [loadingOverview, setLoadingOverview] =
    useState(false);
  const [overviewError, setOverviewError] =
    useState("");

  /* ------------------------------------------------------------------------ */
  /* Chart State                                                              */
  /* ------------------------------------------------------------------------ */

  const [chartData, setChartData] = useState(null);
  const [chartType, setChartType] =
    useState("daily");
  const [chartMetric, setChartMetric] =
    useState("revenue");
  const [trendData, setTrendData] =
    useState(null);
  const [loadingChart, setLoadingChart] =
    useState(false);
  const [chartError, setChartError] =
    useState("");

  /* ------------------------------------------------------------------------ */
  /* Payment State                                                            */
  /* ------------------------------------------------------------------------ */

  const [paymentMethods, setPaymentMethods] =
    useState([]);
  const [loadingPayments, setLoadingPayments] =
    useState(false);
  const [paymentError, setPaymentError] =
    useState("");

  /* ------------------------------------------------------------------------ */
  /* Revenue Report State                                                     */
  /* ------------------------------------------------------------------------ */

  const [revenueReport, setRevenueReport] =
    useState(null);
  const [
    loadingRevenueReport,
    setLoadingRevenueReport,
  ] = useState(false);
  const [
    revenueReportError,
    setRevenueReportError,
  ] = useState("");

  /* ------------------------------------------------------------------------ */
  /* Branch Performance State                                                */
  /* ------------------------------------------------------------------------ */

  const [branches, setBranches] = useState([]);
  const [loadingBranches, setLoadingBranches] =
    useState(false);
  const [branchError, setBranchError] =
    useState("");

  /* ------------------------------------------------------------------------ */
  /* Branch Options State                                                    */
  /* ------------------------------------------------------------------------ */

  const [branchOptions, setBranchOptions] =
    useState([]);
  const [
    loadingBranchOptions,
    setLoadingBranchOptions,
  ] = useState(false);
  const [
    branchOptionsError,
    setBranchOptionsError,
  ] = useState("");

  /* ------------------------------------------------------------------------ */
  /* Chart Options                                                            */
  /* ------------------------------------------------------------------------ */

  const chartTypes = [
    { value: "daily", label: "Daily" },
    { value: "weekly", label: "Weekly" },
    { value: "monthly", label: "Monthly" },
    { value: "yearly", label: "Yearly" },
  ];

  const chartMetrics = [
    { value: "revenue", label: "Revenue" },
    { value: "orders", label: "Orders" },
    { value: "items", label: "Items Sold" },
  ];

  /* ------------------------------------------------------------------------ */
  /* Auto-select Chart Type                                                   */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    setChartType(
      getRecommendedChartType(
        filters.range,
        filters.start,
        filters.end
      )
    );
  }, [
    filters.range,
    filters.start,
    filters.end,
  ]);

  /* ------------------------------------------------------------------------ */
  /* Load Branch Options                                                      */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    let cancelled = false;

    const loadBranches = async () => {
      setLoadingBranchOptions(true);
      setBranchOptionsError("");

      try {
        const response = await api.get(
          "/api/branches/"
        );

        if (!cancelled) {
          setBranchOptions(
            Array.isArray(response.data)
              ? response.data
              : []
          );
        }
      } catch (error) {
        if (!cancelled) {
          setBranchOptions([]);

          setBranchOptionsError(
            error?.response?.data?.detail ||
              error?.response?.data?.error ||
              "Failed to load branches."
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingBranchOptions(false);
        }
      }
    };

    loadBranches();

    return () => {
      cancelled = true;
    };
  }, []);

  /* ------------------------------------------------------------------------ */
  /* Financial Overview API                                                   */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    let cancelled = false;

    const loadOverview = async () => {
      setLoadingOverview(true);
      setOverviewError("");

      try {
        const response = await api.get(
          "/api/reports/admin-overview/",
          {
            params: {
              start: filters.start,
              end: filters.end,
              branch:
                filters.branch || undefined,
            },
          }
        );

        if (!cancelled) {
          setOverview(response.data);
        }
      } catch (error) {
        if (!cancelled) {
          setOverview(null);

          setOverviewError(
            error?.response?.data?.detail ||
              error?.response?.data?.error ||
              "Failed to load financial overview."
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingOverview(false);
        }
      }
    };

    if (filters.start && filters.end) {
      loadOverview();
    }

    return () => {
      cancelled = true;
    };
  }, [
    filters.start,
    filters.end,
    filters.branch,
  ]);

  /* ------------------------------------------------------------------------ */
  /* Chart Data API                                                           */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    let cancelled = false;

    const loadChartData = async () => {
      setLoadingChart(true);
      setChartError("");

      try {
        const response = await api.get(
          "/api/reports/chart-data/",
          {
            params: {
              start: filters.start,
              end: filters.end,
              chart_type: chartType,
              metric: chartMetric,
              branch:
                filters.branch || undefined,
            },
          }
        );

        if (!cancelled) {
          setChartData(response.data);

          setTrendData(
            calculateTrendData(response.data)
          );
        }
      } catch (error) {
        if (!cancelled) {
          setChartData(null);
          setTrendData(null);

          setChartError(
            error?.response?.data?.detail ||
              error?.response?.data?.error ||
              "Failed to load trend data."
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingChart(false);
        }
      }
    };

    if (filters.start && filters.end) {
      loadChartData();
    }

    return () => {
      cancelled = true;
    };
  }, [
    filters.start,
    filters.end,
    filters.branch,
    chartType,
    chartMetric,
  ]);

  /* ------------------------------------------------------------------------ */
  /* Payment Methods API                                                      */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    let cancelled = false;

    const loadPaymentMethods = async () => {
      setLoadingPayments(true);
      setPaymentError("");

      try {
        const response = await api.get(
          "/api/reports/payment-methods/",
          {
            params: {
              start: filters.start,
              end: filters.end,
              branch:
                filters.branch || undefined,
            },
          }
        );

        if (!cancelled) {
          setPaymentMethods(
            Array.isArray(response.data)
              ? response.data
              : []
          );
        }
      } catch (error) {
        if (!cancelled) {
          setPaymentMethods([]);

          setPaymentError(
            error?.response?.data?.detail ||
              error?.response?.data?.error ||
              "Failed to load payment methods."
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingPayments(false);
        }
      }
    };

    if (filters.start && filters.end) {
      loadPaymentMethods();
    }

    return () => {
      cancelled = true;
    };
  }, [
    filters.start,
    filters.end,
    filters.branch,
  ]);

  /* ------------------------------------------------------------------------ */
  /* Consolidated Revenue Report API                                          */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    let cancelled = false;

    const loadRevenueReport = async () => {
      setLoadingRevenueReport(true);
      setRevenueReportError("");

      try {
        const response = await api.get(
          "/api/reports/revenue-report/",
          {
            params: {
              start: filters.start,
              end: filters.end,
              chart_type: chartType,
              branch:
                filters.branch || undefined,
            },
          }
        );

        if (!cancelled) {
          setRevenueReport(response.data);
        }
      } catch (error) {
        if (!cancelled) {
          setRevenueReport(null);

          setRevenueReportError(
            error?.response?.data?.detail ||
              error?.response?.data?.error ||
              "Failed to load revenue report."
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingRevenueReport(false);
        }
      }
    };

    if (filters.start && filters.end) {
      loadRevenueReport();
    }

    return () => {
      cancelled = true;
    };
  }, [
    filters.start,
    filters.end,
    filters.branch,
    chartType,
  ]);

  /* ------------------------------------------------------------------------ */
  /* Branch Performance API                                                   */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    let cancelled = false;

    const loadBranchPerformance = async () => {
      setLoadingBranches(true);
      setBranchError("");

      try {
        const response = await api.get(
          "/api/reports/branches-performance/",
          {
            params: {
              start: filters.start,
              end: filters.end,
              branch:
                filters.branch || undefined,
            },
          }
        );

        if (!cancelled) {
          setBranches(
            Array.isArray(response.data)
              ? response.data
              : []
          );
        }
      } catch (error) {
        if (!cancelled) {
          setBranches([]);

          setBranchError(
            error?.response?.data?.detail ||
              error?.response?.data?.error ||
              "Failed to load branch performance."
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingBranches(false);
        }
      }
    };

    if (filters.start && filters.end) {
      loadBranchPerformance();
    }

    return () => {
      cancelled = true;
    };
  }, [
    filters.start,
    filters.end,
    filters.branch,
  ]);

  /* ------------------------------------------------------------------------ */
  /* Derived Branch Summary                                                   */
  /* ------------------------------------------------------------------------ */

  const branchTotalRevenue = branches.reduce(
    (sum, branch) =>
      sum + Number(branch.revenue || 0),
    0
  );

  const branchTotalOrders = branches.reduce(
    (sum, branch) =>
      sum + Number(branch.orders || 0),
    0
  );

  const branchTotalItems = branches.reduce(
    (sum, branch) =>
      sum + Number(branch.items_sold || 0),
    0
  );

  const branchAverageOrderValue =
    branchTotalOrders > 0
      ? branchTotalRevenue / branchTotalOrders
      : 0;

  const paymentTotalAmount =
    paymentMethods.reduce(
      (sum, item) =>
        sum + Number(item.amount || 0),
      0
    );

  const paymentTotalTransactions =
    paymentMethods.reduce(
      (sum, item) =>
        sum +
        Number(item.transactions || 0),
      0
    );

  /* ------------------------------------------------------------------------ */
  /* Render                                                                   */
  /* ------------------------------------------------------------------------ */

  return (
    <AppLayout
      title="Accountant Dashboard"
      subtitle="Financial reports and accounting overview"
    >
      {/* ================================================================== */}
      {/* DATE / BRANCH FILTERS                                              */}
      {/* ================================================================== */}

      <AccountantReportFilters
        filters={filters}
        onChange={setFilters}
        branches={branchOptions}
        loadingBranches={
          loadingBranchOptions
        }
      />

      {branchOptionsError && (
        <div
          className="error-state"
          style={{ marginBottom: 20 }}
        >
          {branchOptionsError}
        </div>
      )}

      {/* ================================================================== */}
      {/* FINANCIAL OVERVIEW                                                  */}
      {/* ================================================================== */}

      <div
        className="card"
        style={{
          padding: 24,
          marginBottom: 20,
        }}
      >
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
            <h2 style={{ margin: 0 }}>
              Financial Overview
            </h2>

            <div
              className="muted"
              style={{ marginTop: 6 }}
            >
              {filters.start} →{" "}
              {filters.end}
            </div>

            <div
              className="muted"
              style={{ marginTop: 4 }}
            >
              Branch:{" "}
              {filters.branch
                ? branchOptions.find(
                    (branch) =>
                      String(branch.id) ===
                      String(
                        filters.branch
                      )
                  )?.name ||
                  "Selected Branch"
                : "All Branches"}
            </div>
          </div>
        </div>

        {loadingOverview && (
          <div className="loading-state">
            <div className="spinner" />
            <p>
              Loading financial overview…
            </p>
          </div>
        )}

        {!loadingOverview &&
          overviewError && (
            <div className="error-state">
              {overviewError}
            </div>
          )}

        {!loadingOverview &&
          !overviewError &&
          overview && (
            <>
              {/* Main KPIs */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fit, minmax(200px, 1fr))",
                  gap: 16,
                }}
              >
                <div className="card">
                  <div className="muted">
                    Total Revenue
                  </div>

                  <h2
                    style={{
                      margin: "8px 0 0",
                    }}
                  >
                    {formatCurrency(
                      overview.total_revenue
                    )}
                  </h2>
                </div>

                <div className="card">
                  <div className="muted">
                    POS Revenue
                  </div>

                  <h2
                    style={{
                      margin: "8px 0 0",
                    }}
                  >
                    {formatCurrency(
                      overview.pos_revenue
                    )}
                  </h2>
                </div>

                <div className="card">
                  <div className="muted">
                    Ecommerce Revenue
                  </div>

                  <h2
                    style={{
                      margin: "8px 0 0",
                    }}
                  >
                    {formatCurrency(
                      overview.ecommerce_revenue
                    )}
                  </h2>
                </div>

                <div className="card">
                  <div className="muted">
                    Company Profit
                  </div>

                  <h2
                    style={{
                      margin: "8px 0 0",
                    }}
                  >
                    {formatCurrency(
                      overview.company_profit
                    )}
                  </h2>
                </div>

                <div className="card">
                  <div className="muted">
                    Total Orders
                  </div>

                  <h2
                    style={{
                      margin: "8px 0 0",
                    }}
                  >
                    {formatNumber(
                      overview.total_orders
                    )}
                  </h2>
                </div>

                <div className="card">
                  <div className="muted">
                    Items Sold
                  </div>

                  <h2
                    style={{
                      margin: "8px 0 0",
                    }}
                  >
                    {formatNumber(
                      overview.total_items_sold
                    )}
                  </h2>
                </div>
              </div>

              {/* POS / Ecommerce Breakdown */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fit, minmax(220px, 1fr))",
                  gap: 16,
                  marginTop: 16,
                }}
              >
                <div className="card">
                  <div className="muted">
                    POS Orders
                  </div>

                  <h3
                    style={{
                      margin: "8px 0 0",
                    }}
                  >
                    {formatNumber(
                      overview.pos_orders
                    )}
                  </h3>
                </div>

                <div className="card">
                  <div className="muted">
                    Ecommerce Orders
                  </div>

                  <h3
                    style={{
                      margin: "8px 0 0",
                    }}
                  >
                    {formatNumber(
                      overview.ecommerce_orders
                    )}
                  </h3>
                </div>

                <div className="card">
                  <div className="muted">
                    POS Items Sold
                  </div>

                  <h3
                    style={{
                      margin: "8px 0 0",
                    }}
                  >
                    {formatNumber(
                      overview.pos_items_sold
                    )}
                  </h3>
                </div>

                <div className="card">
                  <div className="muted">
                    Ecommerce Items Sold
                  </div>

                  <h3
                    style={{
                      margin: "8px 0 0",
                    }}
                  >
                    {formatNumber(
                      overview.ecommerce_items_sold
                    )}
                  </h3>
                </div>
              </div>
            </>
          )}
      {/* </div> */}

      <br/>

      {/* ================================================================== */}
      {/* BRANCH PERFORMANCE                                                 */}
      {/* ================================================================== */}

      <div
        className="card"
        style={{
          padding: 24,
          marginBottom: 20,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
            marginBottom: 16,
          }}
        >
          <div>
            <h3 style={{ margin: 0 }}>
              Branch Performance
            </h3>

            <p
              className="muted"
              style={{
                marginTop: 5,
                marginBottom: 0,
              }}
            >
              {filters.branch
                ? "Selected branch performance"
                : "Branch performance comparison"}{" "}
              for {filters.start} →{" "}
              {filters.end}
            </p>
          </div>
        </div>

        {loadingBranches && (
          <div className="loading-state">
            <div className="spinner" />
            <p>
              Loading branch performance...
            </p>
          </div>
        )}

        {!loadingBranches &&
          branchError && (
            <div className="error-state">
              {branchError}
            </div>
          )}

        {!loadingBranches &&
          !branchError &&
          branches.length > 0 && (
            <>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fit, minmax(200px, 1fr))",
                  gap: 16,
                  marginBottom: 20,
                }}
              >
                {/* <div className="card">
                  <div className="muted">
                    Branches
                  </div>

                  <h2
                    style={{
                      margin: "8px 0 0",
                    }}
                  >
                    {branches.length}
                  </h2>
                </div> */}

                {/* <div className="card">
                  <div className="muted">
                    Total Revenue
                  </div>

                  <h2
                    style={{
                      margin: "8px 0 0",
                    }}
                  >
                    {formatCurrency(
                      branchTotalRevenue
                    )}
                  </h2>
                </div> */}

                {/* <div className="card">
                  <div className="muted">
                    Total Orders
                  </div>

                  <h2
                    style={{
                      margin: "8px 0 0",
                    }}
                  >
                    {formatNumber(
                      branchTotalOrders
                    )}
                  </h2>
                </div> */}

                {/* <div className="card">
                  <div className="muted">
                    Items Sold
                  </div>

                  <h2
                    style={{
                      margin: "8px 0 0",
                    }}
                  >
                    {formatNumber(
                      branchTotalItems
                    )}
                  </h2>
                </div> */}
              </div>

              <div
                style={{
                  overflowX: "auto",
                }}
              >
                <table
                  style={{
                    width: "100%",
                    borderCollapse:
                      "collapse",
                    minWidth: 750,
                  }}
                >
                  <thead>
                    <tr>
                      <th
                        style={{
                          textAlign: "left",
                          padding: "12px",
                          borderBottom:
                            "2px solid #ddd",
                        }}
                      >
                        Branch
                      </th>

                      <th
                        style={{
                          textAlign: "right",
                          padding: "12px",
                          borderBottom:
                            "2px solid #ddd",
                        }}
                      >
                        Revenue
                      </th>

                      <th
                        style={{
                          textAlign: "right",
                          padding: "12px",
                          borderBottom:
                            "2px solid #ddd",
                        }}
                      >
                        Orders
                      </th>

                      <th
                        style={{
                          textAlign: "right",
                          padding: "12px",
                          borderBottom:
                            "2px solid #ddd",
                        }}
                      >
                        Items Sold
                      </th>

                      <th
                        style={{
                          textAlign: "right",
                          padding: "12px",
                          borderBottom:
                            "2px solid #ddd",
                        }}
                      >
                        Avg. Order Value
                      </th>

                      <th
                        style={{
                          textAlign: "right",
                          padding: "12px",
                          borderBottom:
                            "2px solid #ddd",
                        }}
                      >
                        Revenue Share
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {branches.map(
                      (branch, index) => {
                        const revenue =
                          Number(
                            branch.revenue || 0
                          );

                        const orders =
                          Number(
                            branch.orders || 0
                          );

                        const averageOrderValue =
                          orders > 0
                            ? revenue /
                              orders
                            : 0;

                        const revenueShare =
                          branchTotalRevenue >
                          0
                            ? (revenue /
                                branchTotalRevenue) *
                              100
                            : 0;

                        return (
                          <tr
                            key={
                              branch.branch_id ??
                              index
                            }
                          >
                            <td
                              style={{
                                padding:
                                  "11px 12px",
                                borderBottom:
                                  "1px solid #eee",
                                fontWeight: 600,
                              }}
                            >
                              {
                                branch.branch_name
                              }
                            </td>

                            <td
                              style={{
                                padding:
                                  "11px 12px",
                                textAlign:
                                  "right",
                                borderBottom:
                                  "1px solid #eee",
                              }}
                            >
                              {formatCurrency(
                                revenue
                              )}
                            </td>

                            <td
                              style={{
                                padding:
                                  "11px 12px",
                                textAlign:
                                  "right",
                                borderBottom:
                                  "1px solid #eee",
                              }}
                            >
                              {formatNumber(
                                orders
                              )}
                            </td>

                            <td
                              style={{
                                padding:
                                  "11px 12px",
                                textAlign:
                                  "right",
                                borderBottom:
                                  "1px solid #eee",
                              }}
                            >
                              {formatNumber(
                                branch.items_sold
                              )}
                            </td>

                            <td
                              style={{
                                padding:
                                  "11px 12px",
                                textAlign:
                                  "right",
                                borderBottom:
                                  "1px solid #eee",
                              }}
                            >
                              {formatCurrency(
                                averageOrderValue
                              )}
                            </td>

                            <td
                              style={{
                                padding:
                                  "11px 12px",
                                textAlign:
                                  "right",
                                borderBottom:
                                  "1px solid #eee",
                              }}
                            >
                              {revenueShare.toFixed(
                                1
                              )}
                              %
                            </td>
                          </tr>
                        );
                      }
                    )}
                  </tbody>

                  <tfoot>
                    <tr>
                      <td
                        style={{
                          padding: 13,
                          fontWeight: 700,
                          borderTop:
                            "2px solid #ddd",
                        }}
                      >
                        Total
                      </td>

                      <td
                        style={{
                          padding: 13,
                          textAlign: "right",
                          fontWeight: 700,
                          borderTop:
                            "2px solid #ddd",
                        }}
                      >
                        {formatCurrency(
                          branchTotalRevenue
                        )}
                      </td>

                      <td
                        style={{
                          padding: 13,
                          textAlign: "right",
                          fontWeight: 700,
                          borderTop:
                            "2px solid #ddd",
                        }}
                      >
                        {formatNumber(
                          branchTotalOrders
                        )}
                      </td>

                      <td
                        style={{
                          padding: 13,
                          textAlign: "right",
                          fontWeight: 700,
                          borderTop:
                            "2px solid #ddd",
                        }}
                      >
                        {formatNumber(
                          branchTotalItems
                        )}
                      </td>

                      <td
                        style={{
                          padding: 13,
                          textAlign: "right",
                          fontWeight: 700,
                          borderTop:
                            "2px solid #ddd",
                        }}
                      >
                        {formatCurrency(
                          branchAverageOrderValue
                        )}
                      </td>

                      <td
                        style={{
                          padding: 13,
                          textAlign: "right",
                          fontWeight: 700,
                          borderTop:
                            "2px solid #ddd",
                        }}
                      >
                        100%
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </>
          )}

        {!loadingBranches &&
          !branchError &&
          branches.length === 0 && (
            <div
              className="muted"
              style={{
                textAlign: "center",
                padding: 20,
              }}
            >
              No branch sales data found for
              the selected period.
            </div>
          )}
      </div>
      </div>

      {/* ================================================================== */}
      {/* PERFORMANCE TRENDS                                                 */}
      {/* ================================================================== */}

      <div
        className="card"
        style={{
          padding: 24,
          marginBottom: 20,
        }}
      >
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent:
              "space-between",
            alignItems: "center",
            gap: 12,
            marginBottom: 20,
          }}
        >
          <h4 style={{ margin: 0 }}>
            📈 Performance Trends
          </h4>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 16,
              alignItems: "center",
            }}
          >
            <div className="control-group">
              <label
                className="muted"
                style={{
                  marginRight: 8,
                }}
              >
                View:
              </label>

              <div className="button-group">
                {chartTypes.map(
                  (type) => (
                    <button
                      key={type.value}
                      type="button"
                      className={`btn ${
                        chartType ===
                        type.value
                          ? "btn-primary"
                          : ""
                      }`}
                      onClick={() =>
                        setChartType(
                          type.value
                        )
                      }
                      style={{
                        padding:
                          "6px 12px",
                        fontSize: 13,
                      }}
                    >
                      {type.label}
                    </button>
                  )
                )}
              </div>
            </div>

            <div className="control-group">
              <label
                className="muted"
                style={{
                  marginRight: 8,
                }}
              >
                Metric:
              </label>

              <div className="button-group">
                {chartMetrics.map(
                  (metric) => (
                    <button
                      key={
                        metric.value
                      }
                      type="button"
                      className={`btn ${
                        chartMetric ===
                        metric.value
                          ? "btn-primary"
                          : ""
                      }`}
                      onClick={() =>
                        setChartMetric(
                          metric.value
                        )
                      }
                      style={{
                        padding:
                          "6px 12px",
                        fontSize: 13,
                      }}
                    >
                      {metric.label}
                    </button>
                  )
                )}
              </div>
            </div>
          </div>
        </div>

        {loadingChart && (
          <div className="loading-state">
            <div className="spinner" />
            <p>
              Loading trend data…
            </p>
          </div>
        )}

        {!loadingChart &&
          chartError && (
            <div className="error-state">
              {chartError}
            </div>
          )}

        {!loadingChart &&
          !chartError &&
          trendData && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(160px, 1fr))",
                gap: 12,
                marginBottom: 20,
              }}
            >
              <div
                className="card"
                style={{ padding: 16 }}
              >
                <div
                  className="muted"
                  style={{
                    fontSize: 12,
                  }}
                >
                  Total{" "}
                  {chartMetric ===
                  "revenue"
                    ? "Revenue"
                    : chartMetric ===
                      "orders"
                    ? "Orders"
                    : "Items Sold"}
                </div>

                <div
                  style={{
                    fontSize: 20,
                    fontWeight: 700,
                  }}
                >
                  {chartMetric ===
                  "revenue"
                    ? formatCurrency(
                        trendData.total
                      )
                    : formatNumber(
                        trendData.total
                      )}
                </div>
              </div>

              <div
                className="card"
                style={{ padding: 16 }}
              >
                <div
                  className="muted"
                  style={{
                    fontSize: 12,
                  }}
                >
                  Average per Period
                </div>

                <div
                  style={{
                    fontSize: 20,
                    fontWeight: 700,
                  }}
                >
                  {chartMetric ===
                  "revenue"
                    ? formatCurrency(
                        trendData.average
                      )
                    : Number(
                        trendData.average
                      ).toLocaleString(
                        "en-KE",
                        {
                          maximumFractionDigits: 2,
                        }
                      )}
                </div>
              </div>

              {trendData.hasComparison ? (
                <>
                  <div
                    className="card"
                    style={{
                      padding: 16,
                      background:
                        trendData.trend ===
                        "up"
                          ? "#e6f4ea"
                          : trendData.trend ===
                            "down"
                          ? "#fef2f2"
                          : "#fefce8",
                    }}
                  >
                    <div
                      className="muted"
                      style={{
                        fontSize: 12,
                      }}
                    >
                      Latest Trend
                    </div>

                    <div
                      style={{
                        fontSize: 20,
                        fontWeight: 700,
                      }}
                    >
                      {trendData.change >
                      0
                        ? "↑"
                        : trendData.change <
                          0
                        ? "↓"
                        : "→"}{" "}
                      {Math.abs(
                        trendData.change
                      ).toFixed(1)}
                      %
                    </div>

                    <div
                      className="muted"
                      style={{
                        fontSize: 12,
                      }}
                    >
                      {trendData.trend ===
                      "up"
                        ? "Improving"
                        : trendData.trend ===
                          "down"
                        ? "Declining"
                        : "Stable"}
                    </div>
                  </div>

                  <div
                    className="card"
                    style={{ padding: 16 }}
                  >
                    <div
                      className="muted"
                      style={{
                        fontSize: 12,
                      }}
                    >
                      Best Period
                    </div>

                    <div
                      style={{
                        fontSize: 20,
                        fontWeight: 700,
                      }}
                    >
                      {
                        trendData.maxPeriod
                      }
                      :{" "}
                      {chartMetric ===
                      "revenue"
                        ? formatCurrency(
                            trendData.maxValue
                          )
                        : formatNumber(
                            trendData.maxValue
                          )}
                    </div>
                  </div>

                  <div
                    className="card"
                    style={{ padding: 16 }}
                  >
                    <div
                      className="muted"
                      style={{
                        fontSize: 12,
                      }}
                    >
                      Lowest Active
                      Period
                    </div>

                    <div
                      style={{
                        fontSize: 20,
                        fontWeight: 700,
                      }}
                    >
                      {
                        trendData.minPeriod
                      }
                      :{" "}
                      {chartMetric ===
                      "revenue"
                        ? formatCurrency(
                            trendData.minValue
                          )
                        : formatNumber(
                            trendData.minValue
                          )}
                    </div>
                  </div>
                </>
              ) : (
                <div
                  className="card"
                  style={{ padding: 16 }}
                >
                  <div
                    className="muted"
                    style={{
                      fontSize: 12,
                    }}
                  >
                    Trend
                  </div>

                  <div
                    style={{
                      fontSize: 20,
                      fontWeight: 700,
                    }}
                  >
                    Not enough data
                  </div>

                  <div
                    className="muted"
                    style={{
                      fontSize: 12,
                    }}
                  >
                    At least two active
                    periods required
                  </div>
                </div>
              )}
            </div>
          )}

        {/* Horizontally Scrollable Bar Chart */}
        {!loadingChart &&
          !chartError &&
          chartData &&
          Array.isArray(
            chartData.labels
          ) &&
          Array.isArray(
            chartData.values
          ) &&
          chartData.values.length >
            0 && (
            <div
              className="chart-container"
              style={{
                marginTop: 12,
                paddingTop: 20,
                borderTop:
                  "1px solid #e5e7eb",
                overflowX: "auto",
              }}
            >
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  height: 250,
                  alignItems:
                    "flex-end",
                  paddingBottom: 30,
                  position: "relative",
                  minWidth:
                    chartData.labels
                      .length * 70,
                }}
              >
                {chartData.values.map(
                  (
                    rawValue,
                    index
                  ) => {
                    const numericValues =
                      chartData.values.map(
                        (value) =>
                          Number(
                            value
                          ) || 0
                      );

                    const value =
                      Number(
                        rawValue
                      ) || 0;

                    const maxValue =
                      Math.max(
                        ...numericValues
                      );

                    const minValue =
                      Math.min(
                        ...numericValues
                      );

                    const heightPercent =
                      maxValue > 0
                        ? (value /
                            maxValue) *
                          100
                        : 0;

                    const isBest =
                      value ===
                        maxValue &&
                      maxValue > 0;

                    const isWorst =
                      value ===
                        minValue &&
                      minValue > 0 &&
                      value > 0;

                    return (
                      <div
                        key={`${chartData.labels[index]}-${index}`}
                        style={{
                          flex:
                            "0 0 60px",
                          height: "100%",
                          display:
                            "flex",
                          flexDirection:
                            "column",
                          justifyContent:
                            "flex-end",
                          alignItems:
                            "center",
                          position:
                            "relative",
                        }}
                      >
                        <div
                          style={{
                            width: "100%",
                            maxWidth: 50,
                            height: `${
                              Math.max(
                                heightPercent,
                                4
                              )
                            }%`,
                            minHeight: 4,
                            background:
                              isBest
                                ? "#137333"
                                : isWorst
                                ? "#991b1b"
                                : "#3b82f6",
                            borderRadius:
                              "4px 4px 0 0",
                            transition:
                              "height 0.4s ease",
                            position:
                              "relative",
                          }}
                        >
                          <span
                            style={{
                              position:
                                "absolute",
                              top: -18,
                              left: "50%",
                              transform:
                                "translateX(-50%)",
                              fontSize: 10,
                              fontWeight: 600,
                              whiteSpace:
                                "nowrap",
                              color:
                                "#1e293b",
                            }}
                          >
                            {chartMetric ===
                            "revenue"
                              ? formatCurrency(
                                  value
                                )
                              : formatNumber(
                                  value
                                )}
                          </span>
                        </div>

                        <div
                          style={{
                            fontSize: 11,
                            marginTop: 6,
                            color:
                              "#64748b",
                            textAlign:
                              "center",
                            width: "100%",
                            overflow:
                              "hidden",
                            textOverflow:
                              "ellipsis",
                            whiteSpace:
                              "nowrap",
                          }}
                        >
                          {
                            chartData
                              .labels[
                              index
                            ]
                          }
                        </div>
                      </div>
                    );
                  }
                )}
              </div>

              <div
                style={{
                  display: "flex",
                  gap: 16,
                  justifyContent:
                    "center",
                  marginTop: 12,
                  fontSize: 12,
                  color: "#64748b",
                }}
              >
                <span
                  style={{
                    display: "flex",
                    alignItems:
                      "center",
                    gap: 4,
                  }}
                >
                  <span
                    style={{
                      display:
                        "inline-block",
                      width: 12,
                      height: 12,
                      background:
                        "#3b82f6",
                      borderRadius: 2,
                    }}
                  />
                  Regular
                </span>

                <span
                  style={{
                    display: "flex",
                    alignItems:
                      "center",
                    gap: 4,
                  }}
                >
                  <span
                    style={{
                      display:
                        "inline-block",
                      width: 12,
                      height: 12,
                      background:
                        "#137333",
                      borderRadius: 2,
                    }}
                  />
                  Best
                </span>

                <span
                  style={{
                    display: "flex",
                    alignItems:
                      "center",
                    gap: 4,
                  }}
                >
                  <span
                    style={{
                      display:
                        "inline-block",
                      width: 12,
                      height: 12,
                      background:
                        "#991b1b",
                      borderRadius: 2,
                    }}
                  />
                  Lowest
                </span>
              </div>
            </div>
          )}
      </div>

      {/* ================================================================== */}
      {/* PAYMENT METHODS                                                     */}
      {/* ================================================================== */}

      <div
        className="card"
        style={{
          padding: 24,
          marginBottom: 20,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent:
              "space-between",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
            marginBottom: 16,
          }}
        >
          <div>
            <h3 style={{ margin: 0 }}>
              Payment Methods
            </h3>

            <p
              className="muted"
              style={{
                marginTop: 5,
                marginBottom: 0,
              }}
            >
              Payment collection for{" "}
              {filters.start} →{" "}
              {filters.end}
            </p>
          </div>
        </div>

        {loadingPayments && (
          <div className="loading-state">
            <div className="spinner" />
            <p>
              Loading payment methods…
            </p>
          </div>
        )}

        {!loadingPayments &&
          paymentError && (
            <div className="error-state">
              {paymentError}
            </div>
          )}

        {!loadingPayments &&
          !paymentError &&
          paymentMethods.length >
            0 && (
            <>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fit, minmax(220px, 1fr))",
                  gap: 16,
                  marginBottom: 20,
                }}
              >
                <div className="card">
                  <div className="muted">
                    Total Collected
                  </div>

                  <h2
                    style={{
                      margin: "8px 0 0",
                    }}
                  >
                    {formatCurrency(
                      paymentTotalAmount
                    )}
                  </h2>
                </div>

                <div className="card">
                  <div className="muted">
                    Transactions
                  </div>

                  <h2
                    style={{
                      margin: "8px 0 0",
                    }}
                  >
                    {formatNumber(
                      paymentTotalTransactions
                    )}
                  </h2>
                </div>

                <div className="card">
                  <div className="muted">
                    Payment Methods
                  </div>

                  <h2
                    style={{
                      margin: "8px 0 0",
                    }}
                  >
                    {
                      paymentMethods.length
                    }
                  </h2>
                </div>
              </div>

              <div
                style={{
                  overflowX: "auto",
                }}
              >
                <table
                  style={{
                    width: "100%",
                    borderCollapse:
                      "collapse",
                  }}
                >
                  <thead>
                    <tr>
                      <th
                        style={{
                          textAlign: "left",
                          padding:
                            "10px 12px",
                          borderBottom:
                            "2px solid #ddd",
                        }}
                      >
                        Payment Method
                      </th>

                      <th
                        style={{
                          textAlign:
                            "right",
                          padding:
                            "10px 12px",
                          borderBottom:
                            "2px solid #ddd",
                        }}
                      >
                        Transactions
                      </th>

                      <th
                        style={{
                          textAlign:
                            "right",
                          padding:
                            "10px 12px",
                          borderBottom:
                            "2px solid #ddd",
                        }}
                      >
                        Amount
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {paymentMethods.map(
                      (
                        payment,
                        index
                      ) => (
                        <tr
                          key={
                            payment.method ||
                            index
                          }
                        >
                          <td
                            style={{
                              padding:
                                "10px 12px",
                              borderBottom:
                                "1px solid #eee",
                            }}
                          >
                            {
                              payment.method
                            }
                          </td>

                          <td
                            style={{
                              padding:
                                "10px 12px",
                              textAlign:
                                "right",
                              borderBottom:
                                "1px solid #eee",
                            }}
                          >
                            {formatNumber(
                              payment.transactions
                            )}
                          </td>

                          <td
                            style={{
                              padding:
                                "10px 12px",
                              textAlign:
                                "right",
                              fontWeight: 600,
                              borderBottom:
                                "1px solid #eee",
                            }}
                          >
                            {formatCurrency(
                              payment.amount
                            )}
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>

                  <tfoot>
                    <tr>
                      <td
                        style={{
                          padding: 12,
                          fontWeight: 700,
                          borderTop:
                            "2px solid #ddd",
                        }}
                      >
                        Total
                      </td>

                      <td
                        style={{
                          padding: 12,
                          textAlign:
                            "right",
                          fontWeight: 700,
                          borderTop:
                            "2px solid #ddd",
                        }}
                      >
                        {formatNumber(
                          paymentTotalTransactions
                        )}
                      </td>

                      <td
                        style={{
                          padding: 12,
                          textAlign:
                            "right",
                          fontWeight: 700,
                          borderTop:
                            "2px solid #ddd",
                        }}
                      >
                        {formatCurrency(
                          paymentTotalAmount
                        )}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </>
          )}

        {!loadingPayments &&
          !paymentError &&
          paymentMethods.length ===
            0 && (
            <div
              className="muted"
              style={{
                padding: 20,
                textAlign:
                  "center",
              }}
            >
              No payment transactions
              found for the selected
              period.
            </div>
          )}
      </div>

      {/* ================================================================== */}
      {/* CONSOLIDATED REVENUE REPORT                                        */}
      {/* ================================================================== */}

      <div
        className="card"
        style={{
          padding: 24,
          marginBottom: 20,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent:
              "space-between",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
            marginBottom: 16,
          }}
        >
          <div>
            <h3 style={{ margin: 0 }}>
              Revenue Report
            </h3>

            <p
              className="muted"
              style={{
                marginTop: 5,
                marginBottom: 0,
              }}
            >
              Revenue, collections and
              credit sales for{" "}
              {filters.start} →{" "}
              {filters.end}
            </p>
          </div>
        </div>

        {loadingRevenueReport && (
          <div className="loading-state">
            <div className="spinner" />
            <p>
              Loading revenue report...
            </p>
          </div>
        )}

        {!loadingRevenueReport &&
          revenueReportError && (
            <div className="error-state">
              {revenueReportError}
            </div>
          )}

        {!loadingRevenueReport &&
          !revenueReportError &&
          revenueReport && (
            <div
              style={{
                overflowX: "auto",
              }}
            >
              <table
                style={{
                  width: "100%",
                  borderCollapse:
                    "collapse",
                  minWidth: 1050,
                }}
              >
                <thead>
                  <tr>
                    <th
                      style={{
                        textAlign: "left",
                        padding: 12,
                        borderBottom:
                          "2px solid #ddd",
                      }}
                    >
                      Period
                    </th>

                    <th
                      style={{
                        textAlign:
                          "right",
                        padding: 12,
                        borderBottom:
                          "2px solid #ddd",
                      }}
                    >
                      Revenue
                    </th>

                    <th
                      style={{
                        textAlign:
                          "right",
                        padding: 12,
                        borderBottom:
                          "2px solid #ddd",
                      }}
                    >
                      Cash
                    </th>

                    <th
                      style={{
                        textAlign:
                          "right",
                        padding: 12,
                        borderBottom:
                          "2px solid #ddd",
                      }}
                    >
                      M-Pesa
                    </th>

                    <th
                      style={{
                        textAlign:
                          "right",
                        padding: 12,
                        borderBottom:
                          "2px solid #ddd",
                      }}
                    >
                      Credit
                    </th>

                    <th
                      style={{
                        textAlign:
                          "right",
                        padding: 12,
                        borderBottom:
                          "2px solid #ddd",
                      }}
                    >
                      Orders
                    </th>

                    <th
                      style={{
                        textAlign:
                          "right",
                        padding: 12,
                        borderBottom:
                          "2px solid #ddd",
                      }}
                    >
                      Items Sold
                    </th>

                    <th
                      style={{
                        textAlign:
                          "right",
                        padding: 12,
                        borderBottom:
                          "2px solid #ddd",
                      }}
                    >
                      Avg. Order Value
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {revenueReport.rows.map(
                    (row, index) => (
                      <tr
                        key={`${row.date}-${index}`}
                      >
                        <td
                          style={{
                            padding:
                              "11px 12px",
                            borderBottom:
                              "1px solid #eee",
                          }}
                        >
                          {row.period}
                        </td>

                        <td
                          style={{
                            padding:
                              "11px 12px",
                            textAlign:
                              "right",
                            borderBottom:
                              "1px solid #eee",
                            fontWeight: 600,
                          }}
                        >
                          {formatCurrency(
                            row.revenue
                          )}
                        </td>

                        <td
                          style={{
                            padding:
                              "11px 12px",
                            textAlign:
                              "right",
                            borderBottom:
                              "1px solid #eee",
                          }}
                        >
                          {formatCurrency(
                            row.cash
                          )}
                        </td>

                        <td
                          style={{
                            padding:
                              "11px 12px",
                            textAlign:
                              "right",
                            borderBottom:
                              "1px solid #eee",
                          }}
                        >
                          {formatCurrency(
                            row.mpesa
                          )}
                        </td>

                        <td
                          style={{
                            padding:
                              "11px 12px",
                            textAlign:
                              "right",
                            borderBottom:
                              "1px solid #eee",
                          }}
                        >
                          {formatCurrency(
                            row.credit
                          )}
                        </td>

                        <td
                          style={{
                            padding:
                              "11px 12px",
                            textAlign:
                              "right",
                            borderBottom:
                              "1px solid #eee",
                          }}
                        >
                          {formatNumber(
                            row.orders
                          )}
                        </td>

                        <td
                          style={{
                            padding:
                              "11px 12px",
                            textAlign:
                              "right",
                            borderBottom:
                              "1px solid #eee",
                          }}
                        >
                          {formatNumber(
                            row.items_sold
                          )}
                        </td>

                        <td
                          style={{
                            padding:
                              "11px 12px",
                            textAlign:
                              "right",
                            borderBottom:
                              "1px solid #eee",
                          }}
                        >
                          {formatCurrency(
                            row.average_order_value
                          )}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>

                <tfoot>
                  <tr>
                    <td
                      style={{
                        padding:
                          "13px 12px",
                        fontWeight: 700,
                        borderTop:
                          "2px solid #ddd",
                      }}
                    >
                      Total
                    </td>

                    <td
                      style={{
                        padding:
                          "13px 12px",
                        textAlign:
                          "right",
                        fontWeight: 700,
                        borderTop:
                          "2px solid #ddd",
                      }}
                    >
                      {formatCurrency(
                        revenueReport.totals
                          .revenue
                      )}
                    </td>

                    <td
                      style={{
                        padding:
                          "13px 12px",
                        textAlign:
                          "right",
                        fontWeight: 700,
                        borderTop:
                          "2px solid #ddd",
                      }}
                    >
                      {formatCurrency(
                        revenueReport.totals
                          .cash
                      )}
                    </td>

                    <td
                      style={{
                        padding:
                          "13px 12px",
                        textAlign:
                          "right",
                        fontWeight: 700,
                        borderTop:
                          "2px solid #ddd",
                      }}
                    >
                      {formatCurrency(
                        revenueReport.totals
                          .mpesa
                      )}
                    </td>

                    <td
                      style={{
                        padding:
                          "13px 12px",
                        textAlign:
                          "right",
                        fontWeight: 700,
                        borderTop:
                          "2px solid #ddd",
                      }}
                    >
                      {formatCurrency(
                        revenueReport.totals
                          .credit
                      )}
                    </td>

                    <td
                      style={{
                        padding:
                          "13px 12px",
                        textAlign:
                          "right",
                        fontWeight: 700,
                        borderTop:
                          "2px solid #ddd",
                      }}
                    >
                      {formatNumber(
                        revenueReport.totals
                          .orders
                      )}
                    </td>

                    <td
                      style={{
                        padding:
                          "13px 12px",
                        textAlign:
                          "right",
                        fontWeight: 700,
                        borderTop:
                          "2px solid #ddd",
                      }}
                    >
                      {formatNumber(
                        revenueReport.totals
                          .items_sold
                      )}
                    </td>

                    <td
                      style={{
                        padding:
                          "13px 12px",
                        textAlign:
                          "right",
                        fontWeight: 700,
                        borderTop:
                          "2px solid #ddd",
                      }}
                    >
                      {formatCurrency(
                        revenueReport.totals
                          .average_order_value
                      )}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
      </div>
    </AppLayout>
  );
}