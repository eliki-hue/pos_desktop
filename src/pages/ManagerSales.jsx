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
  }, [timeRange]);

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

  const chartData = dailySales;

  return (
    <AppLayout title="Branch Analytics">

      {/* Branch Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="mb-1">{branchName} Analytics</h4>
          <p className="text-muted mb-0">{start} to {end}</p>
        </div>

        <button className="btn btn-outline-dark" onClick={fetchReports} disabled={loading}>
          <i className="bi bi-arrow-repeat me-2"></i>
          Refresh
        </button>
      </div>

      {/* Summary Cards */} 
      {summary && (
         <div className="grid grid-3" style={{ marginTop: 20 }}> 
          <StatCard label="Company Revenue" value={`KES ${Number(summary.total_revenue).toFixed(2)}`} /> 
          <StatCard label="Orders" value={summary.orders_count} /> 
          <StatCard label="Items Sold" value={summary.total_items} />  
        </div>
      )}

      {/* Chart Controls */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="mb-0">Sales Trend</h5>

        <div className="d-flex gap-2">

          <div className="btn-group btn-group-sm me-2">
            {["daily", "weekly", "monthly", "yearly"].map((g) => (
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
      {chartData.length > 0 ? (
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-body" style={{ height: "350px" }}>
            <ResponsiveContainer width="100%" height="100%">

              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />

                <XAxis
                  dataKey="date"
                  tickFormatter={(value) => {
                    const d = new Date(value);

                    if (timeRange === "yearly") return d.getFullYear();

                    if (timeRange === "monthly")
                      return d.toLocaleDateString("en-KE", { month: "short" });

                    if (timeRange === "weekly")
                      return `W${Math.ceil(d.getDate() / 7)}`;

                    return d.toLocaleDateString("en-KE", {
                      month: "short",
                      day: "numeric",
                    });
                  }}
                />

                <YAxis yAxisId="left" stroke={CHART_COLORS.primary} />
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
                    <th>Category</th>
                    <th className="text-end">Quantity Sold</th>
                    <th className="text-end">Revenue</th>
                    <th className="text-end">% of Total</th>
                  </tr>
                </thead>

                <tbody>
                  {topProducts.map((item, index) => (
                    <tr key={item.product_id || index}>
                      <td>
                        <span className="badge bg-dark">{index + 1}</span>
                      </td>

                      <td>
                        <div className="fw-medium">
                          {item.product_name || item.product_id}
                        </div>

                        {item.product_id && (
                          <small className="text-muted">
                            ID: {item.product_id}
                          </small>
                        )}
                      </td>

                      <td>{item.category || "—"}</td>

                      <td className="text-end fw-medium">
                        {formatNumber(item.sold_qty)}
                      </td>

                      <td className="text-end fw-medium">
                        {formatCurrency(item.revenue)}
                      </td>

                      <td className="text-end">
                        <div className="d-flex align-items-center justify-content-end gap-2">
                          <span>
                            {summary?.total_revenue
                              ? (
                                  (item.revenue / summary.total_revenue) *
                                  100
                                ).toFixed(1)
                              : 0}
                            %
                          </span>

                          <div style={{ width: "50px" }}>
                            <div className="progress" style={{ height: "4px" }}>
                              <div
                                className="progress-bar bg-dark"
                                style={{
                                  width: `${
                                    summary?.total_revenue
                                      ? (item.revenue /
                                          summary.total_revenue) *
                                        100
                                      : 0
                                  }%`,
                                }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
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
    </AppLayout>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="card">
      <div className="muted">{label}</div>
      <div style={{ fontSize: 22, fontWeight: 900 }}>{value}</div>
    </div>
  );
}