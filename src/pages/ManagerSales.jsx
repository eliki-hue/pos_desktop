import { useEffect, useState } from "react";
import AppLayout from "../components/AppLayout";
import { api } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const CHART_COLORS = {
  primary: "#3b82f6",
  secondary: "#10b981",
  warning: "#f59e0b",
  danger: "#ef4444",
  purple: "#8b5cf6",
  pink: "#ec4899",
  gray: "#6b7280",
  lightGray: "#e5e7eb",
};

const PIE_COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#8b5cf6",
  "#ef4444",
  "#ec4899",
  "#14b8a6",
  "#f97316",
];

export default function SalesReportManager() {
  const { user } = useAuth();
  const branchId = user?.branch?.id;
  const branchName = user?.branch?.name;

  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [period, setPeriod] = useState("month");

  const [summary, setSummary] = useState(null);
  const [topProducts, setTopProducts] = useState([]);
  const [dailySales, setDailySales] = useState([]);
  const [categoryBreakdown, setCategoryBreakdown] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [chartType, setChartType] = useState("line");
  const [timeRange, setTimeRange] = useState("daily");

  useEffect(() => {
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    setEnd(formatDate(today));
    setStart(formatDate(thirtyDaysAgo));
  }, []);

  useEffect(() => {
    if (branchId && start && end) {
      fetchReports();
    }
  }, [branchId, start, end, timeRange]);

  const formatDate = (date) => {
    return date.toISOString().split("T")[0];
  };

  const handlePeriodChange = (newPeriod) => {
    setPeriod(newPeriod);

    const today = new Date();
    let newStart = "";
    let newEnd = formatDate(today);

    switch (newPeriod) {
      case "today":
        newStart = formatDate(today);
        break;

      case "yesterday":
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        newStart = formatDate(yesterday);
        newEnd = formatDate(yesterday);
        break;

      case "week":
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        newStart = formatDate(weekAgo);
        break;

      case "month":
        const monthAgo = new Date();
        monthAgo.setDate(monthAgo.getDate() - 30);
        newStart = formatDate(monthAgo);
        break;

      case "quarter":
        const quarterAgo = new Date();
        quarterAgo.setMonth(quarterAgo.getMonth() - 3);
        newStart = formatDate(quarterAgo);
        break;

      default:
        return;
    }

    setStart(newStart);
    setEnd(newEnd);
  };

  const fetchReports = async () => {
    if (!start || !end || !branchId) return;

    setLoading(true);
    setError(null);

    try {
      const [
        summaryRes,
        topRes,
        trendRes,
        categoryRes,
        paymentRes,
      ] = await Promise.allSettled([
        api.get(`/api/reports/branch-sales-summary/?branch_id=${branchId}&start=${start}&end=${end}`),
        api.get(`/api/reports/top-products/?start=${start}&end=${end}&limit=10`),
        api.get(`/api/reports/sales-trend/?branch_id=${branchId}&start=${start}&end=${end}&group_by=${timeRange}`),
        api.get(`/api/reports/category-breakdown/?branch_id=${branchId}&start=${start}&end=${end}`),
        api.get(`/api/reports/payment-methods/?branch_id=${branchId}&start=${start}&end=${end}`),
      ]);

      if (summaryRes.status === "fulfilled") setSummary(summaryRes.value.data);
      if (topRes.status === "fulfilled") setTopProducts(topRes.value.data.results || []);
      if (trendRes.status === "fulfilled") setDailySales(trendRes.value.data || []);
      if (categoryRes.status === "fulfilled") setCategoryBreakdown(categoryRes.value.data || []);
      if (paymentRes.status === "fulfilled") setPaymentMethods(paymentRes.value.data || []);

    } catch (err) {
      setError("Failed to load analytics data");
    } finally {
      setLoading(false);
    }
  };

  const averageOrder =
    summary?.orders_count > 0
      ? summary.total_revenue / summary.orders_count
      : 0;

  const formatCurrency = (value) =>
    `KES ${Number(value).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const formatNumber = (value) => Number(value).toLocaleString();

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div
          style={{
            background: "white",
            padding: "12px 16px",
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          }}
        >
          <p style={{ margin: 0, fontWeight: 600 }}>{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ margin: "4px 0 0", color: entry.color }}>
              {entry.name}: {entry.name === "Orders" ? entry.value : formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Render loading state
  if (loading && !summary) {
    return (
      <AppLayout title="Branch Analytics">
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "60vh" }}>
          <div className="text-center">
            <div className="spinner-border text-primary mb-3" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="text-muted">Loading analytics data...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Branch Analytics">
      {/* Branch Header with Period Selector */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="mb-1">{branchName} Analytics</h4>
          <p className="text-muted mb-0">
            {new Date(start).toLocaleDateString()} - {new Date(end).toLocaleDateString()}
          </p>
        </div>

        <div className="d-flex gap-2">
          {/* Period Selector */}
          <div className="btn-group btn-group-sm me-2">
            {["today", "yesterday", "week", "month", "quarter"].map((p) => (
              <button
                key={p}
                className={`btn ${period === p ? "btn-dark" : "btn-outline-dark"}`}
                onClick={() => handlePeriodChange(p)}
              >
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>

          <button className="btn btn-outline-dark" onClick={fetchReports} disabled={loading}>
            <i className="bi bi-arrow-repeat me-2"></i>
            Refresh
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
         <div className="grid grid-4" style={{ marginTop: 20, marginBottom:20 }}> 
          <StatCard label="Branch Revenue" value={`KES ${Number(summary.total_revenue).toFixed(2)}`} /> 
          <StatCard label="Orders" value={summary.orders_count} /> 
          <StatCard label="Items Sold" value={summary.total_qty} />
          <StatCard label="Branch Profit" value={summary.total_profit} />   
        </div>
      )}

      {/* Payment Methods and Category Breakdown Row */}
      <div className="row g-4 mb-4">
        {/* Payment Methods Pie Chart */}
        <div className="col-md-6">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-white border-0 pt-4 pb-0">
              <h6 className="mb-0">Payment Methods</h6>
            </div>
            <div className="card-body">
              {paymentMethods.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={paymentMethods}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="amount"
                        nameKey="name"
                        label={({ name, percentage }) => 
                          `${name} (${percentage?.toFixed(1) || 0}%)`
                        }
                      >
                        {paymentMethods.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={PIE_COLORS[index % PIE_COLORS.length]} 
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value) => formatCurrency(value)}
                        contentStyle={{
                          backgroundColor: "#fff",
                          border: "1px solid #e2e8f0",
                          borderRadius: "8px",
                          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>

                  <div className="mt-3">
                    {paymentMethods.map((method, index) => (
                      <div key={method.name} className="d-flex justify-content-between align-items-center mb-2">
                        <div className="d-flex align-items-center">
                          <span
                            style={{
                              width: "12px",
                              height: "12px",
                              borderRadius: "4px",
                              backgroundColor: PIE_COLORS[index % PIE_COLORS.length],
                              display: "inline-block",
                              marginRight: "8px",
                            }}
                          />
                          <span>{method.name}</span>
                        </div>
                        <div className="text-end">
                          <strong>{formatCurrency(method.amount)}</strong>
                          <small className="text-muted ms-2">
                            ({method.percentage?.toFixed(1) || 0}%)
                          </small>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-5">
                  <p className="text-muted mb-0">No payment data available</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Category Breakdown Bar Chart */}
        {/* <div className="col-md-6">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-white border-0 pt-4 pb-0">
              <h6 className="mb-0">Category Breakdown</h6>
            </div>
            <div className="card-body">
              {categoryBreakdown.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart
                    data={categoryBreakdown.map((cat) => ({
                      ...cat,
                      name: cat.name || "Uncategorized",
                    }))}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis type="number" tickFormatter={formatCurrency} stroke="#94a3b8" />
                    <YAxis type="category" dataKey="name" stroke="#94a3b8" />
                    <Tooltip
                      formatter={(value) => formatCurrency(value)}
                      contentStyle={{
                        backgroundColor: "#fff",
                        border: "1px solid #e2e8f0",
                        borderRadius: "8px",
                        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                      }}
                    />
                    <Bar dataKey="value" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-5">
                  <p className="text-muted mb-0">No category data available</p>
                </div>
              )}
            </div>
          </div>
        </div> */}
      </div>

      {/* Chart Controls */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="mb-0">Sales Trend</h5>

        <div className="d-flex gap-2">
          <div className="btn-group btn-group-sm me-2">
            {["daily", "weekly", "monthly"].map((g) => (
              <button
                key={g}
                className={`btn ${timeRange === g ? "btn-dark" : "btn-outline-dark"}`}
                onClick={() => setTimeRange(g)}
              >
                {g.charAt(0).toUpperCase() + g.slice(1)}
              </button>
            ))}
          </div>

          <div className="btn-group btn-group-sm">
            <button
              className={`btn ${chartType === "line" ? "btn-dark" : "btn-outline-dark"}`}
              onClick={() => setChartType("line")}
            >
              <i className="bi bi-graph-up"></i>
            </button>

            <button
              className={`btn ${chartType === "bar" ? "btn-dark" : "btn-outline-dark"}`}
              onClick={() => setChartType("bar")}
            >
              <i className="bi bi-bar-chart"></i>
            </button>

            <button
              className={`btn ${chartType === "area" ? "btn-dark" : "btn-outline-dark"}`}
              onClick={() => setChartType("area")}
            >
              <i className="bi bi-area"></i>
            </button>
          </div>
        </div>
      </div>

      {/* Main Chart */}
      {dailySales.length > 0 ? (
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-body" style={{ height: "350px" }}>
            <ResponsiveContainer width="100%" height="100%">
              {chartType === "line" && (
                <LineChart data={dailySales}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="period"
                    tickFormatter={(value) => {
                      const d = new Date(value);
                      if (timeRange === "monthly") {
                        return d.toLocaleDateString("en-KE", { month: "short", year: "numeric" });
                      }
                      if (timeRange === "weekly") {
                        return `Week ${Math.ceil(d.getDate() / 7)}`;
                      }
                      return d.toLocaleDateString("en-KE", {
                        month: "short",
                        day: "numeric",
                      });
                    }}
                  />
                  <YAxis yAxisId="left" stroke={CHART_COLORS.primary} tickFormatter={formatCurrency} />
                  <YAxis yAxisId="right" orientation="right" stroke={CHART_COLORS.secondary} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="revenue"
                    stroke={CHART_COLORS.primary}
                    strokeWidth={2}
                    name="Revenue"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="orders"
                    stroke={CHART_COLORS.secondary}
                    strokeWidth={2}
                    name="Orders"
                  />
                </LineChart>
              )}

              {chartType === "bar" && (
                <BarChart data={dailySales}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="period"
                    tickFormatter={(value) => {
                      const d = new Date(value);
                      if (timeRange === "monthly") {
                        return d.toLocaleDateString("en-KE", { month: "short" });
                      }
                      return d.toLocaleDateString("en-KE", {
                        month: "short",
                        day: "numeric",
                      });
                    }}
                  />
                  <YAxis yAxisId="left" stroke={CHART_COLORS.primary} tickFormatter={formatCurrency} />
                  <YAxis yAxisId="right" orientation="right" stroke={CHART_COLORS.secondary} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar yAxisId="left" dataKey="revenue" fill={CHART_COLORS.primary} name="Revenue" />
                  <Bar yAxisId="right" dataKey="orders" fill={CHART_COLORS.secondary} name="Orders" />
                </BarChart>
              )}

              {chartType === "area" && (
                <AreaChart data={dailySales}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={CHART_COLORS.primary} stopOpacity={0.8} />
                      <stop offset="95%" stopColor={CHART_COLORS.primary} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={CHART_COLORS.secondary} stopOpacity={0.8} />
                      <stop offset="95%" stopColor={CHART_COLORS.secondary} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="period"
                    tickFormatter={(value) => {
                      const d = new Date(value);
                      return d.toLocaleDateString("en-KE", {
                        month: "short",
                        day: "numeric",
                      });
                    }}
                  />
                  <YAxis yAxisId="left" stroke={CHART_COLORS.primary} tickFormatter={formatCurrency} />
                  <YAxis yAxisId="right" orientation="right" stroke={CHART_COLORS.secondary} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="revenue"
                    stroke={CHART_COLORS.primary}
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                    name="Revenue"
                  />
                  <Area
                    yAxisId="right"
                    type="monotone"
                    dataKey="orders"
                    stroke={CHART_COLORS.secondary}
                    fillOpacity={1}
                    fill="url(#colorOrders)"
                    name="Orders"
                  />
                </AreaChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
        <div className="card border-0 shadow-sm mb-4 p-5 text-center">
          <p className="text-muted mb-0">
            No sales trend data available for this period
          </p>
        </div>
      )}

      {/* Top Products Table */}
      {topProducts.length > 0 ? (
        <div className="card border-0 shadow-sm">
          <div className="card-header bg-white border-0 pt-4 pb-0">
            <h6 className="mb-0">Top Selling Products</h6>
          </div>
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th style={{ width: "50px" }}>#</th>
                    <th>Product</th>
                    <th className="text-end">Quantity Sold</th>
                    <th className="text-end">Revenue</th>
                    <th className="text-end">% of Total</th>
                  </tr>
                </thead>

                <tbody>
                  {topProducts.map((item, index) => {
                    const revenueShare = summary?.total_revenue
                      ? ((item.revenue / summary.total_revenue) * 100).toFixed(1)
                      : 0;
                    
                    return (
                      <tr key={item.product_id || index}>
                        <td>
                          <span className="badge bg-dark">{index + 1}</span>
                        </td>

                        <td>
                          <div className="fw-medium">
                            {item.product || item.product_name || `Product ${item.product_id}`}
                          </div>
                          {item.product_id && (
                            <small className="text-muted">
                              ID: {item.product_id}
                            </small>
                          )}
                        </td>

                        <td className="text-end fw-medium">
                          {formatNumber(item.qty || item.quantity || 0)}
                        </td>

                        <td className="text-end fw-medium">
                          {formatCurrency(item.revenue || 0)}
                        </td>

                        <td className="text-end">
                          <div className="d-flex align-items-center justify-content-end gap-2">
                            <span>{revenueShare}%</span>
                            <div style={{ width: "50px" }}>
                              <div className="progress" style={{ height: "4px" }}>
                                <div
                                  className="progress-bar bg-dark"
                                  style={{ width: `${revenueShare}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="card border-0 shadow-sm p-5 text-center">
          <p className="text-muted mb-0">
            No top products data available for this period
          </p>
        </div>
      )}

      {/* Quick Insights */}
      {/* {summary && (
        <div className="row g-4 mt-2">
          <div className="col-12">
            <div className="card border-0 shadow-sm">
              <div className="card-body">
                <h5 className="card-title mb-3">Quick Insights</h5>
                <div className="row g-3">
                  <div className="col-md-3">
                    <div className="p-3 bg-light rounded-3">
                      <small className="text-muted d-block">Average Order Value</small>
                      <strong className="fs-5">
                        {formatCurrency(averageOrder)}
                      </strong>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="p-3 bg-light rounded-3">
                      <small className="text-muted d-block">Avg Items per Order</small>
                      <strong className="fs-5">
                        {(summary.total_qty / summary.orders_count || 0).toFixed(1)}
                      </strong>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="p-3 bg-light rounded-3">
                      <small className="text-muted d-block">Profit Margin</small>
                      <strong className="fs-5">
                        {((summary.total_profit / summary.total_revenue) * 100 || 0).toFixed(1)}%
                      </strong>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="p-3 bg-light rounded-3">
                      <small className="text-muted d-block">Top Payment Method</small>
                      <strong className="fs-5">
                        {paymentMethods[0]?.name || "N/A"}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div> */}
      {/* )} */}
    </AppLayout>
  );
}

/* ========================================
   STAT CARD COMPONENT
======================================== */
// function StatCard({ label, value, icon, color = "primary" }) {
//   const colorClasses = {
//     primary: { bg: "bg-primary", light: "bg-primary-light" },
//     success: { bg: "bg-success", light: "bg-success-light" },
//     info: { bg: "bg-info", light: "bg-info-light" },
//     warning: { bg: "bg-warning", light: "bg-warning-light" },
//   };

//   return (
//     <div className="card border-0 shadow-sm h-100">
//       <div className="card-body">
//         <div className="d-flex align-items-center mb-3">
//           <div
//             className={`rounded-3 p-3 me-3`}
//             style={{ backgroundColor: `var(--bs-${color}-bg-subtle)` }}
//           >
//             <span style={{ fontSize: "1.5rem" }}>{icon}</span>
//           </div>
//           <div>
//             <h6 className="text-muted mb-1">{label}</h6>
//             <h3 className="mb-0">{value}</h3>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }
function StatCard({ label, value }) {
  return (
    <div className="card">
      <div className="muted">{label}</div>
      <div style={{ fontSize: 22, fontWeight: 900 }}>{value}</div>
    </div>
  );
}
