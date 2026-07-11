import React, { useEffect, useState, useMemo, useCallback } from "react";
import AppLayout from "../components/AppLayout";
import { api } from "../api/client";


const formatLocalDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

export default function AdminDashboard() {
  const today = formatLocalDate(new Date());
  const lastWeekDate = new Date();
  lastWeekDate.setDate(lastWeekDate.getDate() - 7);

  const lastWeek = formatLocalDate(lastWeekDate);

  // Filter states
  const [filters, setFilters] = useState({
    start: today,
    end: today,
    branchId: "",
    dateRange: "today",
    view: "overview",
  });

  // Data states
  const [company, setCompany] = useState(null);
  const [topProducts, setTopProducts] = useState([]);
  const [overview, setOverview] = useState(null);
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [branchSummary, setBranchSummary] = useState(null);
  const [cashiers, setCashiers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedSection, setExpandedSection] = useState("overview");
  
  // Chart states
  const [chartData, setChartData] = useState(null);
  const [chartType, setChartType] = useState("daily"); // daily, weekly, monthly, yearly
  const [chartMetric, setChartMetric] = useState("revenue"); // revenue, orders, items
  const [trendData, setTrendData] = useState(null);

  const dateRanges = [
    { value: "today", label: "Today" },
    { value: "7d", label: "Last 7 Days" },
    { value: "30d", label: "Last 30 Days" },
    { value: "90d", label: "Last 90 Days" },
    { value: "custom", label: "Custom" },
  ];

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

  const handleFilterChange = (key, value) => {
      setFilters((prev) => ({ ...prev, [key]: value }));
    };

    const handleDateRangeChange = (range) => {
      const now = new Date();

      let start;
      let end = new Date(now);

      switch (range) {
        case "today":
          start = new Date(now);
          break;

        case "7d":
          start = new Date(now);
          start.setDate(start.getDate() - 7);
          break;

        case "30d":
          start = new Date(now);
          start.setDate(start.getDate() - 30);
          break;

        case "90d":
          start = new Date(now);
          start.setDate(start.getDate() - 90);
          break;

        default:
          return;
      }

      setFilters((prev) => ({
        ...prev,
        start: formatLocalDate(start),
        end: formatLocalDate(end),
        dateRange: range,
      }));
    };

  // Fetch chart data
  const fetchChartData = useCallback(async () => {
    try {
      const res = await api.get("/api/reports/chart-data/", {
        params: {
          start: filters.start,
          end: filters.end,
          branch: filters.branchId,
          chart_type: chartType,
          metric: chartMetric,
        },
      });
      setChartData(res.data);
      calculateTrends(res.data);
    } catch (err) {
      console.error("Failed to fetch chart data:", err);
    }
  }, [filters.start, filters.end, filters.branchId, chartType, chartMetric]);

  // Calculate trends from actual data
  const calculateTrends = (data) => {
    if (!data || !data.values || data.values.length < 2) {
      setTrendData(null);
      return;
    }

    const values = data.values;
    const firstValue = values[0];
    const lastValue = values[values.length - 1];
    
    // Calculate percentage change
    const change = firstValue !== 0 
      ? ((lastValue - firstValue) / Math.abs(firstValue)) * 100
      : 0;

    // Calculate average daily/weekly/monthly growth
    const periods = values.length;
    const totalGrowth = lastValue - firstValue;
    const averageGrowth = periods > 1 ? totalGrowth / (periods - 1) : 0;

    // Find best and worst periods
    const maxValue = Math.max(...values);
    const minValue = Math.min(...values);
    const maxIndex = values.indexOf(maxValue);
    const minIndex = values.indexOf(minValue);

    setTrendData({
      change: change,
      averageGrowth: averageGrowth,
      maxValue: maxValue,
      minValue: minValue,
      maxPeriod: data.labels[maxIndex],
      minPeriod: data.labels[minIndex],
      total: values.reduce((a, b) => a + b, 0),
      average: values.reduce((a, b) => a + b, 0) / values.length,
      trend: change > 5 ? "up" : change < -5 ? "down" : "stable",
    });
  };

  const loadBranchSummary = async (branchId) => {
    try {
      const res = await api.get("/api/reports/branch-sales-summary/", {
        params: {
          branch: branchId,
          start: filters.start,
          end: filters.end,
        },
      });
      setBranchSummary(res.data);
      setSelectedBranch(branchId);
    } catch {
      setBranchSummary(null);
    }
  };

  const loadReports = async () => {
    setLoading(true);
    setError("");

    try {
      const [topProductsRes, overviewRes, branchesRes, cashiersRes] =
        await Promise.all([
          api.get("/api/reports/product-performance/", {
            params: {
              start: filters.start,
              end: filters.end,
              branch: filters.branchId || undefined,
            },
          }),

          api.get("/api/reports/admin-overview/", {
            params: {
              start: filters.start,
              end: filters.end,
              branch: filters.branchId || undefined,
            },
          }),

          api.get("/api/reports/branches-performance/", {
            params: {
              start: filters.start,
              end: filters.end,
              branch: filters.branchId || undefined,
            },
          }),

          api.get("/api/reports/cashiers-performance/", {
            params: {
              branch: filters.branchId || undefined,
              start: filters.start,
              end: filters.end,
            },
          }),
        ]);

      setTopProducts(Array.isArray(topProductsRes.data) ? topProductsRes.data : []);
      setOverview(overviewRes.data || null);
      setBranches(Array.isArray(branchesRes.data) ? branchesRes.data : []);
      setCashiers(Array.isArray(cashiersRes.data) ? cashiersRes.data : []);

      if (selectedBranch) {
        await loadBranchSummary(selectedBranch);
      }
      console.log("Current filters:", filters);
      // Fetch chart data
      await fetchChartData();
    } catch (err) {
      console.error("Admin dashboard error:", err);
      setError("❌ Failed to load admin dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, [filters.start, filters.end, filters.branchId]);

  useEffect(() => {
    fetchChartData();
  }, [chartType, chartMetric]);

  // Memoized statistics for better performance
  const stats = useMemo(() => {
    if (!overview) return null;
    return {
      total: {
        revenue: overview.total_revenue,
        orders: overview.total_orders,
        items: overview.total_items_sold,
        profit: overview.company_profit,
      },
      pos: {
        revenue: overview.pos_revenue,
        orders: overview.pos_orders,
        items: overview.pos_items_sold,
        profit: overview.pos_profit,
      },
      ecommerce: {
        revenue: overview.ecommerce_revenue,
        orders: overview.ecommerce_orders,
        items: overview.ecommerce_items_sold,
        profit: overview.ecommerce_profit,
      },
      meta: {
        branches: overview.branches,
        products: overview.active_products,
      },
    };
  }, [overview]);

  // Calculate trend for total revenue
  const revenueTrend = useMemo(() => {
    if (!trendData) return null;
    return {
      change: trendData.change,
      direction: trendData.trend,
      averageGrowth: trendData.averageGrowth,
    };
  }, [trendData]);

  return (
    <AppLayout title="Admin Dashboard" subtitle="Company performance overview">
      {/* Enhanced Filters Section */}
      <div className="filters-container">
        <div className="filters-header">
          <h3 className="filters-title">📊 Data Filters</h3>
          <div className="filter-actions">
            <button
              className="btn-secondary"
              onClick={() => {
                setFilters({
                  start: lastWeek,
                  end: today,
                  branchId: "",
                  dateRange: "7d",
                  view: "overview",
                });
                setSelectedBranch(null);
                setBranchSummary(null);
              }}
            >
              Reset Filters
            </button>
          </div>
        </div>

        <div className="filters-grid">
          {/* Date Range Quick Select */}
          <div className="filter-group">
            <label className="filter-label">Date Range</label>
            <div className="date-range-buttons">
              {dateRanges.map((range) => (
                <button
                  key={range.value}
                  className={`range-btn ${
                    filters.dateRange === range.value ? "active" : ""
                  }`}
                  onClick={() => handleDateRangeChange(range.value)}
                >
                  {range.label}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Date Range */}
          <div className="filter-group">
            <label className="filter-label">Custom Range</label>
            <div className="date-inputs">
              <input
                type="date"
                className="input"
                value={filters.start}
                onChange={(e) =>
                  handleFilterChange("start", e.target.value)
                }
              />
              <span className="date-separator">to</span>
              <input
                type="date"
                className="input"
                value={filters.end}
                onChange={(e) => handleFilterChange("end", e.target.value)}
              />
            </div>
          </div>

          {/* Branch Filter */}
          <div className="filter-group">
            <label className="filter-label">Branch</label>
            <select
              className="input"
              value={filters.branchId}
              onChange={(e) => handleFilterChange("branchId", e.target.value)}
            >
              <option value="">All Branches</option>
              {branches.map((branch) => (
                <option key={branch.branch_id} value={branch.branch_id}>
                  {branch.branch_name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading dashboard data...</p>
        </div>
      ) : error ? (
        <div className="error-state">{error}</div>
      ) : (
        <>
          {/* Chart Section with Controls */}
          <div className="chart-section">
            <div className="chart-header">
              <h4>📈 Performance Trends</h4>
              <div className="chart-controls">
                <div className="control-group">
                  <label>View:</label>
                  <div className="button-group">
                    {chartTypes.map((type) => (
                      <button
                        key={type.value}
                        className={`control-btn ${chartType === type.value ? "active" : ""}`}
                        onClick={() => setChartType(type.value)}
                      >
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="control-group">
                  <label>Metric:</label>
                  <div className="button-group">
                    {chartMetrics.map((metric) => (
                      <button
                        key={metric.value}
                        className={`control-btn ${chartMetric === metric.value ? "active" : ""}`}
                        onClick={() => setChartMetric(metric.value)}
                      >
                        {metric.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Trend Summary Cards */}
            {trendData && (
              <div className="trend-summary">
                <div className="trend-card">
                  <span className="trend-label">Total {chartMetric}</span>
                  <span className="trend-value">
                    {chartMetric === "revenue" 
                      ? `KES ${trendData.total.toLocaleString()}`
                      : trendData.total.toLocaleString()}
                  </span>
                </div>
                <div className="trend-card">
                  <span className="trend-label">Average per Period</span>
                  <span className="trend-value">
                    {chartMetric === "revenue"
                      ? `KES ${trendData.average.toLocaleString()}`
                      : trendData.average.toLocaleString()}
                  </span>
                </div>
                <div className={`trend-card ${trendData.trend}`}>
                  <span className="trend-label">Trend</span>
                  <span className="trend-value">
                    {trendData.change > 0 ? "↑" : trendData.change < 0 ? "↓" : "→"}
                    {" "}{Math.abs(trendData.change).toFixed(1)}%
                  </span>
                  <span className="trend-sub">
                    {trendData.trend === "up" ? "Improving" : 
                     trendData.trend === "down" ? "Declining" : "Stable"}
                  </span>
                </div>
                <div className="trend-card">
                  <span className="trend-label">Best Period</span>
                  <span className="trend-value">
                    {trendData.maxPeriod}: {chartMetric === "revenue"
                      ? `KES ${trendData.maxValue.toLocaleString()}`
                      : trendData.maxValue.toLocaleString()}
                  </span>
                </div>
                <div className="trend-card">
                  <span className="trend-label">Worst Period</span>
                  <span className="trend-value">
                    {trendData.minPeriod}: {chartMetric === "revenue"
                      ? `KES ${trendData.minValue.toLocaleString()}`
                      : trendData.minValue.toLocaleString()}
                  </span>
                </div>
              </div>
            )}

            {/* Bar Chart */}
            {chartData && chartData.labels && chartData.values && (
              <div className="chart-container">
                <div className="bar-chart">
                  {chartData.values.map((value, index) => {
                    const maxValue = Math.max(...chartData.values);
                    const height = maxValue > 0 ? (value / maxValue) * 100 : 0;
                    const isBest = value === Math.max(...chartData.values);
                    const isWorst = value === Math.min(...chartData.values);
                    
                    return (
                      <div key={index} className="bar-group">
                        <div className="bar-wrapper">
                          <div
                            className={`bar ${isBest ? "best" : ""} ${isWorst ? "worst" : ""}`}
                            style={{ height: `${height}%` }}
                          >
                            <span className="bar-value">
                              {chartMetric === "revenue"
                                ? `KES ${value.toLocaleString()}`
                                : value.toLocaleString()}
                            </span>
                          </div>
                        </div>
                        <div className="bar-label">{chartData.labels[index]}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Section Tabs */}
          <div className="section-tabs">
            <button
              className={`tab-btn ${expandedSection === "overview" ? "active" : ""}`}
              onClick={() =>
                setExpandedSection(
                  expandedSection === "overview" ? "" : "overview"
                )
              }
            >
              📈 Overview
            </button>
            <button
              className={`tab-btn ${expandedSection === "products" ? "active" : ""}`}
              onClick={() =>
                setExpandedSection(
                  expandedSection === "products" ? "" : "products"
                )
              }
            >
              🏷️ Products
            </button>
            <button
              className={`tab-btn ${expandedSection === "branches" ? "active" : ""}`}
              onClick={() =>
                setExpandedSection(
                  expandedSection === "branches" ? "" : "branches"
                )
              }
            >
              🏢 Branches
            </button>
            <button
              className={`tab-btn ${expandedSection === "cashiers" ? "active" : ""}`}
              onClick={() =>
                setExpandedSection(
                  expandedSection === "cashiers" ? "" : "cashiers"
                )
              }
            >
              👤 Cashiers
            </button>
          </div>

          {/* Overview Section */}
          {expandedSection === "overview" && stats && (
            <div className="overview-section">
              {/* Company Summary Cards with Real Trends */}
              <div className="stats-grid">
                <StatCard
                  icon="💰"
                  label="Total Revenue"
                  value={`KES ${Number(stats.total.revenue).toLocaleString()}`}
                  trend={revenueTrend}
                  metric="revenue"
                />
                <StatCard
                  icon="📦"
                  label="Total Orders"
                  value={stats.total.orders}
                  trend={trendData ? {
                    change: trendData.change,
                    direction: trendData.trend,
                  } : null}
                  metric="orders"
                />
                <StatCard
                  icon="🛍️"
                  label="Items Sold"
                  value={stats.total.items}
                />
                <StatCard
                  icon="📊"
                  label="Profit"
                  value={`KES ${Number(stats.total.profit).toLocaleString()}`}
                />
              </div>

              {/* POS vs Ecommerce Comparison */}
              <div className="comparison-section">
                <h4 className="section-subtitle">Channel Performance</h4>
                <div className="comparison-grid">
                  <div className="channel-card pos">
                    <div className="channel-header">
                      <span className="channel-icon">🏪</span>
                      <h5>POS</h5>
                    </div>
                    <div className="channel-stats">
                      <div>
                        <span className="stat-label">Revenue</span>
                        <span className="stat-value">
                          KES {Number(stats.pos.revenue).toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <span className="stat-label">Orders</span>
                        <span className="stat-value">{stats.pos.orders}</span>
                      </div>
                      <div>
                        <span className="stat-label">Items</span>
                        <span className="stat-value">{stats.pos.items}</span>
                      </div>
                      <div>
                        <span className="stat-label">Profit</span>
                        <span className="stat-value">
                          KES {Number(stats.pos.profit).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="channel-card ecommerce">
                    <div className="channel-header">
                      <span className="channel-icon">🛒</span>
                      <h5>E-commerce</h5>
                    </div>
                    <div className="channel-stats">
                      <div>
                        <span className="stat-label">Revenue</span>
                        <span className="stat-value">
                          KES {Number(stats.ecommerce.revenue).toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <span className="stat-label">Orders</span>
                        <span className="stat-value">{stats.ecommerce.orders}</span>
                      </div>
                      <div>
                        <span className="stat-label">Items</span>
                        <span className="stat-value">{stats.ecommerce.items}</span>
                      </div>
                      <div>
                        <span className="stat-label">Profit</span>
                        <span className="stat-value">
                          KES {Number(stats.ecommerce.profit).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Meta Stats */}
              <div className="meta-stats">
                <div className="meta-card">
                  <span className="meta-icon">🏢</span>
                  <div>
                    <div className="meta-label">Branches</div>
                    <div className="meta-value">{stats.meta.branches}</div>
                  </div>
                </div>
                <div className="meta-card">
                  <span className="meta-icon">📦</span>
                  <div>
                    <div className="meta-label">Active Products</div>
                    <div className="meta-value">{stats.meta.products}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Products Section */}
          {expandedSection === "products" && (
            <div className="products-section">
              <div className="section-header">
                <h4>🏷️ Top Products</h4>
                <div className="section-actions">
                  <button className="btn-secondary">Export</button>
                  <button className="btn-secondary">View All</button>
                </div>
              </div>

              {topProducts.length === 0 ? (
                <div className="empty-state">No sales data available.</div>
              ) : (
                <div className="table-container">
                  <table className="enhanced-table">
                    <thead>
                      <tr>
                        <th>Product ID</th>
                        <th>Product Name</th>
                        <th>Quantity Sold</th>
                        <th>Revenue</th>
                        <th>Performance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topProducts.slice(0, 10).map((p, index) => (
                        <tr key={p.product_id}>
                          <td>
                            <span className="product-id">#{p.product_id}</span>
                          </td>
                          <td className="product-name">{p.product}</td>
                          <td>
                            <span className="quantity-badge">{p.sold_qty}</span>
                          </td>
                          <td className="revenue-cell">
                            KES {Number(p.revenue).toLocaleString()}
                          </td>
                          <td>
                            <div className="performance-bar">
                              <div
                                className="performance-fill"
                                style={{
                                  width: `${Math.min(
                                    (p.revenue / topProducts[0]?.revenue) * 100,
                                    100
                                  )}%`,
                                  backgroundColor:
                                    index === 0
                                      ? "#10b981"
                                      : index === 1
                                      ? "#3b82f6"
                                      : index === 2
                                      ? "#f59e0b"
                                      : "#6b7280",
                                }}
                              />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Branches Section */}
          {expandedSection === "branches" && (
            <div className="branches-section">
              <div className="section-header">
                <h4>🏢 Branch Performance</h4>
                <div className="section-actions">
                  <button className="btn-secondary">Export</button>
                </div>
              </div>

              {branches.length === 0 ? (
                <div className="empty-state">No branch data available</div>
              ) : (
                <div className="branches-grid">
                  {branches.map((branch) => (
                    <div
                      key={branch.branch_id}
                      className={`branch-card ${
                        selectedBranch === branch.branch_id ? "selected" : ""
                      }`}
                      onClick={() => loadBranchSummary(branch.branch_id)}
                    >
                      <div className="branch-header">
                        <h5 className="branch-name">{branch.branch_name}</h5>
                        <span className="branch-status">Active</span>
                      </div>
                      <div className="branch-stats">
                        <div>
                          <span className="stat-label">Orders</span>
                          <span className="stat-value">{branch.orders}</span>
                        </div>
                        <div>
                          <span className="stat-label">Items Sold</span>
                          <span className="stat-value">{branch.items_sold}</span>
                        </div>
                        <div>
                          <span className="stat-label">Revenue</span>
                          <span className="stat-value highlight">
                            KES {branch.revenue}
                          </span>
                        </div>
                      </div>
                      {selectedBranch === branch.branch_id && branchSummary && (
                        <div className="branch-details">
                          <hr />
                          <div className="branch-summary">
                            <div>
                              <span className="stat-label">Orders</span>
                              <span className="stat-value">
                                {branchSummary.orders || 0}
                              </span>
                            </div>
                            <div>
                              <span className="stat-label">Revenue</span>
                              <span className="stat-value highlight">
                                KES {branchSummary.revenue || 0}
                              </span>
                            </div>
                            <div>
                              <span className="stat-label">Items Sold</span>
                              <span className="stat-value">
                                {branchSummary.items_sold || 0}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Cashiers Section */}
          {expandedSection === "cashiers" && (
            <div className="cashiers-section">
              <div className="section-header">
                <h4>👤 Cashier Performance</h4>
                <div className="section-actions">
                  <button className="btn-secondary">Export</button>
                </div>
              </div>

              {cashiers.length === 0 ? (
                <div className="empty-state">No cashier data available</div>
              ) : (
                <div className="table-container">
                  <table className="enhanced-table">
                    <thead>
                      <tr>
                        <th>Cashier</th>
                        <th>Orders</th>
                        <th>Revenue</th>
                        <th>Avg. Order Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cashiers.map((c) => (
                        <tr key={c.cashier_id}>
                          <td className="cashier-name">
                            <span className="avatar">
                              {c.cashier?.charAt(0) || "U"}
                            </span>
                            {c.cashier}
                          </td>
                          <td>
                            <span className="quantity-badge">{c.orders}</span>
                          </td>
                          <td className="revenue-cell">
                            KES {Number(c.revenue).toLocaleString()}
                          </td>
                          <td>
                            KES{" "}
                            {c.orders > 0
                              ? Number(c.revenue / c.orders).toLocaleString()
                              : "0.00"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      )}

      <style jsx>{`
        /* Filters Styles */
        .filters-container {
          background: white;
          border-radius: 12px;
          padding: 24px;
          margin-bottom: 24px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
        }

        .filters-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .filters-title {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
          color: #1f2937;
        }

        .filter-actions {
          display: flex;
          gap: 8px;
        }

        .filters-grid {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 20px;
        }

        @media (max-width: 1024px) {
          .filters-grid {
            grid-template-columns: 1fr;
          }
        }

        .filter-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .filter-label {
          font-size: 13px;
          font-weight: 500;
          color: #4b5563;
        }

        .date-range-buttons {
          display: flex;
          gap: 4px;
          flex-wrap: wrap;
        }

        .range-btn {
          padding: 4px 12px;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          background: white;
          font-size: 12px;
          color: #4b5563;
          cursor: pointer;
          transition: all 0.2s;
        }

        .range-btn:hover {
          background: #f3f4f6;
        }

        .range-btn.active {
          background: #3b82f6;
          color: white;
          border-color: #3b82f6;
        }

        .date-inputs {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .date-inputs .input {
          flex: 1;
        }

        .date-separator {
          color: #9ca3af;
          font-weight: 500;
        }

        .input {
          padding: 8px 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 14px;
          outline: none;
          transition: border-color 0.2s;
        }

        .input:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .btn-secondary {
          padding: 6px 12px;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          background: white;
          font-size: 12px;
          color: #4b5563;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-secondary:hover {
          background: #f3f4f6;
        }

        /* Loading State */
        .loading-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 20px;
          color: #6b7280;
        }

        .spinner {
          width: 40px;
          height: 40px;
          border: 3px solid #e5e7eb;
          border-top-color: #3b82f6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .error-state {
          padding: 20px;
          background: #fef2f2;
          color: #dc2626;
          border-radius: 8px;
          border: 1px solid #fecaca;
          font-weight: 500;
        }

        /* Chart Section */
        .chart-section {
          background: white;
          border-radius: 12px;
          padding: 24px;
          margin-bottom: 24px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
        }

        .chart-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 16px;
          margin-bottom: 20px;
        }

        .chart-header h4 {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
          color: #1f2937;
        }

        .chart-controls {
          display: flex;
          gap: 20px;
          flex-wrap: wrap;
        }

        .control-group {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .control-group label {
          font-size: 12px;
          font-weight: 500;
          color: #6b7280;
        }

        .button-group {
          display: flex;
          gap: 4px;
        }

        .control-btn {
          padding: 4px 10px;
          border: 1px solid #e5e7eb;
          border-radius: 4px;
          background: white;
          font-size: 11px;
          color: #4b5563;
          cursor: pointer;
          transition: all 0.2s;
        }

        .control-btn:hover {
          background: #f3f4f6;
        }

        .control-btn.active {
          background: #3b82f6;
          color: white;
          border-color: #3b82f6;
        }

        /* Trend Summary */
        .trend-summary {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 12px;
          margin-bottom: 24px;
        }

        .trend-card {
          background: #f9fafb;
          padding: 12px 16px;
          border-radius: 8px;
          border-left: 3px solid #9ca3af;
        }

        .trend-card.up {
          border-left-color: #10b981;
        }

        .trend-card.down {
          border-left-color: #ef4444;
        }

        .trend-card.stable {
          border-left-color: #f59e0b;
        }

        .trend-label {
          display: block;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #6b7280;
          font-weight: 500;
        }

        .trend-value {
          display: block;
          font-size: 18px;
          font-weight: 700;
          color: #1f2937;
          margin-top: 2px;
        }

        .trend-sub {
          display: block;
          font-size: 12px;
          color: #6b7280;
          margin-top: 2px;
        }

        .trend-card.up .trend-value {
          color: #10b981;
        }

        .trend-card.down .trend-value {
          color: #ef4444;
        }

        .trend-card.stable .trend-value {
          color: #f59e0b;
        }

        /* Bar Chart */
        .chart-container {
          padding: 16px 0;
          overflow-x: auto;
        }

        .bar-chart {
          display: flex;
          align-items: flex-end;
          gap: 12px;
          min-height: 300px;
          padding: 0 4px;
        }

        .bar-group {
          display: flex;
          flex-direction: column;
          align-items: center;
          flex: 1;
          min-width: 40px;
        }

        .bar-wrapper {
          width: 100%;
          height: 250px;
          display: flex;
          align-items: flex-end;
          justify-content: center;
          position: relative;
        }

        .bar {
          width: 100%;
          max-width: 60px;
          min-height: 4px;
          background: #3b82f6;
          border-radius: 4px 4px 0 0;
          position: relative;
          transition: height 0.3s ease;
          cursor: pointer;
        }

        .bar:hover {
          opacity: 0.8;
          transform: scaleY(1.02);
          transform-origin: bottom;
        }

        .bar.best {
          background: #10b981;
        }

        .bar.worst {
          background: #ef4444;
        }

        .bar-value {
          position: absolute;
          top: -24px;
          left: 50%;
          transform: translateX(-50%);
          font-size: 10px;
          font-weight: 600;
          color: #1f2937;
          white-space: nowrap;
          opacity: 0;
          transition: opacity 0.3s;
        }

        .bar:hover .bar-value {
          opacity: 1;
        }

        .bar-label {
          font-size: 11px;
          color: #6b7280;
          margin-top: 8px;
          text-align: center;
          font-weight: 500;
        }

        /* Section Tabs */
        .section-tabs {
          display: flex;
          gap: 4px;
          background: white;
          padding: 4px;
          border-radius: 12px;
          margin-bottom: 24px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
        }

        .tab-btn {
          flex: 1;
          padding: 12px 20px;
          border: none;
          background: transparent;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          color: #6b7280;
          cursor: pointer;
          transition: all 0.2s;
        }

        .tab-btn:hover {
          background: #f3f4f6;
          color: #1f2937;
        }

        .tab-btn.active {
          background: #3b82f6;
          color: white;
        }

        /* Overview Section */
        .overview-section {
          animation: fadeIn 0.3s ease-in-out;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-bottom: 24px;
        }

        @media (max-width: 1024px) {
          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 640px) {
          .stats-grid {
            grid-template-columns: 1fr;
          }
        }

        .stat-card {
          background: white;
          padding: 20px;
          border-radius: 12px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
          transition: transform 0.2s;
        }

        .stat-card:hover {
          transform: translateY(-2px);
        }

        .stat-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .stat-icon {
          font-size: 24px;
        }

        .stat-trend {
          font-size: 12px;
          font-weight: 600;
          padding: 2px 8px;
          border-radius: 12px;
        }

        .stat-trend.up {
          color: #10b981;
          background: #d1fae5;
        }

        .stat-trend.down {
          color: #ef4444;
          background: #fee2e2;
        }

        .stat-trend.stable {
          color: #f59e0b;
          background: #fef3c7;
        }

        .stat-label {
          font-size: 13px;
          color: #6b7280;
          font-weight: 500;
        }

        .stat-value {
          font-size: 24px;
          font-weight: 700;
          color: #1f2937;
        }

        /* Comparison Section */
        .comparison-section {
          margin-bottom: 24px;
        }

        .section-subtitle {
          font-size: 14px;
          font-weight: 600;
          color: #4b5563;
          margin-bottom: 16px;
        }

        .comparison-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        @media (max-width: 640px) {
          .comparison-grid {
            grid-template-columns: 1fr;
          }
        }

        .channel-card {
          background: white;
          padding: 20px;
          border-radius: 12px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
        }

        .channel-card.pos {
          border-left: 4px solid #3b82f6;
        }

        .channel-card.ecommerce {
          border-left: 4px solid #8b5cf6;
        }

        .channel-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;
        }

        .channel-icon {
          font-size: 20px;
        }

        .channel-header h5 {
          margin: 0;
          font-size: 14px;
          font-weight: 600;
          color: #1f2937;
        }

        .channel-stats {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }

        .channel-stats > div {
          display: flex;
          flex-direction: column;
        }

        .channel-stats .stat-label {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #9ca3af;
        }

        .channel-stats .stat-value {
          font-size: 16px;
        }

        /* Meta Stats */
        .meta-stats {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        @media (max-width: 640px) {
          .meta-stats {
            grid-template-columns: 1fr;
          }
        }

        .meta-card {
          background: white;
          padding: 16px 20px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          gap: 12px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
        }

        .meta-icon {
          font-size: 28px;
        }

        .meta-label {
          font-size: 12px;
          color: #6b7280;
          font-weight: 500;
        }

        .meta-value {
          font-size: 20px;
          font-weight: 700;
          color: #1f2937;
        }

        /* Products Section */
        .products-section,
        .branches-section,
        .cashiers-section {
          animation: fadeIn 0.3s ease-in-out;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .section-header h4 {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
          color: #1f2937;
        }

        .section-actions {
          display: flex;
          gap: 8px;
        }

        .table-container {
          overflow-x: auto;
          background: white;
          border-radius: 12px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
        }

        .enhanced-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 14px;
        }

        .enhanced-table th {
          padding: 12px 16px;
          text-align: left;
          font-weight: 600;
          color: #4b5563;
          border-bottom: 2px solid #f3f4f6;
          background: #f9fafb;
        }

        .enhanced-table td {
          padding: 12px 16px;
          border-bottom: 1px solid #f3f4f6;
          color: #1f2937;
        }

        .enhanced-table tbody tr:hover {
          background: #f9fafb;
        }

        .product-id {
          font-family: monospace;
          font-size: 12px;
          color: #6b7280;
        }

        .product-name {
          font-weight: 500;
        }

        .quantity-badge {
          display: inline-block;
          padding: 2px 10px;
          background: #eff6ff;
          color: #3b82f6;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
        }

        .revenue-cell {
          font-weight: 600;
          color: #1f2937;
        }

        .performance-bar {
          width: 100%;
          height: 6px;
          background: #f3f4f6;
          border-radius: 3px;
          overflow: hidden;
        }

        .performance-fill {
          height: 100%;
          border-radius: 3px;
          transition: width 0.3s;
        }

        /* Branches Grid */
        .branches-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 16px;
        }

        .branch-card {
          background: white;
          padding: 20px;
          border-radius: 12px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
          cursor: pointer;
          transition: all 0.2s;
          border: 2px solid transparent;
        }

        .branch-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        }

        .branch-card.selected {
          border-color: #3b82f6;
          background: #eff6ff;
        }

        .branch-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .branch-name {
          margin: 0;
          font-size: 15px;
          font-weight: 600;
          color: #1f2937;
        }

        .branch-status {
          font-size: 11px;
          padding: 2px 10px;
          background: #d1fae5;
          color: #065f46;
          border-radius: 12px;
          font-weight: 600;
        }

        .branch-stats {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 8px;
        }

        .branch-stats > div {
          display: flex;
          flex-direction: column;
        }

        .branch-stats .stat-label {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #9ca3af;
        }

        .branch-stats .stat-value {
          font-size: 16px;
        }

        .branch-stats .stat-value.highlight {
          color: #3b82f6;
        }

        .branch-details {
          margin-top: 12px;
        }

        .branch-details hr {
          border: none;
          border-top: 1px solid #e5e7eb;
          margin: 12px 0;
        }

        .branch-summary {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 8px;
        }

        .branch-summary > div {
          display: flex;
          flex-direction: column;
        }

        .branch-summary .stat-value.highlight {
          color: #3b82f6;
        }

        /* Cashiers Table */
        .cashier-name {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 500;
        }

        .avatar {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          background: #e0e7ff;
          color: #4338ca;
          border-radius: 50%;
          font-weight: 600;
          font-size: 14px;
        }

        .empty-state {
          padding: 40px 20px;
          text-align: center;
          color: #6b7280;
          background: white;
          border-radius: 12px;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </AppLayout>
  );
}

/* ================= Reusable Stat Card Component ================= */
function StatCard({ icon, label, value, trend, metric }) {
  return (
    <div className="stat-card">
      <div className="stat-header">
        <span className="stat-icon">{icon}</span>
        {trend && (
          <span className={`stat-trend ${trend.direction || 'stable'}`}>
            {trend.change > 0 ? "↑" : trend.change < 0 ? "↓" : "→"}
            {" "}{Math.abs(trend.change).toFixed(1)}%
          </span>
        )}
      </div>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
    </div>
  );
}