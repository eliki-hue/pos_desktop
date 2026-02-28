import { useEffect, useState } from "react";
import AppLayout from "../../components/AppLayout";
import { fetchStockMovements } from "../../api/inventory";
import { useAuth } from "../../auth/AuthContext";

export default function StockMovementReport() {
  const { user } = useAuth();
  const branchId = user?.branch?.id;

  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [count, setCount] = useState(0);
  const [pageSize, setPageSize] = useState(20);

  const [filters, setFilters] = useState({
    source: "",
    date_from: "",
    date_to: "",
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!branchId) return;

    setLoading(true);

    fetchStockMovements({
      branch: branchId,
      page,
      page_size: pageSize,
      ...filters,
    })
      .then((res) => {
        const data = res.data;
        setRows(data.results || []);
        setTotalPages(data.total_pages || 1);
        setCount(data.count || 0);
      })
      .finally(() => setLoading(false));
  }, [branchId, page, pageSize, filters]);

  const handlePageSizeChange = (size) => {
    setPageSize(size);
    setPage(1);
  };

  const generatePages = () => {
    const pages = [];
    const maxVisible = 5;

    let start = Math.max(1, page - 2);
    let end = Math.min(totalPages, start + maxVisible - 1);

    if (end - start < maxVisible - 1) {
      start = Math.max(1, end - maxVisible + 1);
    }

    if (start > 1) {
      pages.push(1);
      if (start > 2) pages.push("...");
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (end < totalPages) {
      if (end < totalPages - 1) pages.push("...");
      pages.push(totalPages);
    }

    return pages;
  };

  return (
    <AppLayout title="Stock Movement Report">
      <div className="card mb-3">
        <div className="card-body">
          <div className="row g-3 align-items-end">
            <div className="col-md-3">
              <label className="form-label">From</label>
              <input
                type="date"
                className="form-control"
                value={filters.date_from}
                onChange={(e) =>
                  setFilters({ ...filters, date_from: e.target.value })
                }
              />
            </div>

            <div className="col-md-3">
              <label className="form-label">To</label>
              <input
                type="date"
                className="form-control"
                value={filters.date_to}
                onChange={(e) =>
                  setFilters({ ...filters, date_to: e.target.value })
                }
              />
            </div>

            <div className="col-md-3">
              <label className="form-label">Type</label>
              <select
                className="form-select"
                value={filters.source}
                onChange={(e) =>
                  setFilters({ ...filters, source: e.target.value })
                }
              >
                <option value="">All</option>
                <option value="purchase">Stock In</option>
                <option value="sale">Sale</option>
                <option value="adjustment">Adjustment</option>
                <option value="transfer">Transfer</option>
                <option value="internal_use">Internal Use</option>
              </select>
            </div>

            <div className="col-md-3">
              <label className="form-label">Rows per page</label>
              <select
                className="form-select"
                value={pageSize}
                onChange={(e) =>
                  handlePageSizeChange(Number(e.target.value))
                }
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-body p-0">
          {loading ? (
            <div className="p-4 text-center">Loading…</div>
          ) : (
            <>
              <table className="table table-hover mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Date</th>
                    <th>Product</th>
                    <th>Direction</th>
                    <th>Change (KG)</th>
                    <th>Source</th>
                    <th>Transfer Info</th>
                    <th>Note</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => {
                    const direction = r.change > 0 ? "IN" : "OUT";
                    return (
                      <tr key={r.id}>
                        <td>{new Date(r.created_at).toLocaleString()}</td>
                        <td>{r.product_name}</td>
                        <td>
                          <span
                            className={`badge ${
                              direction === "IN"
                                ? "bg-success"
                                : "bg-danger"
                            }`}
                          >
                            {direction}
                          </span>
                        </td>
                        <td
                          className={
                            r.change < 0 ? "text-danger" : "text-success"
                          }
                        >
                          {r.change}
                        </td>
                        <td>{r.source}</td>
                        <td>
                          {r.source === "transfer"
                            ? direction === "OUT"
                              ? `Transfer to ${r.to_branch_name}`
                              : `Received from ${r.from_branch_name}`
                            : "—"}
                        </td>
                        <td>{r.note || "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Numbered Pagination */}
              <div className="d-flex justify-content-between align-items-center p-3">
                <span className="text-muted">
                  Page {page} of {totalPages} — {count} total records
                </span>

                <div className="btn-group">
                  {generatePages().map((p, idx) =>
                    p === "..." ? (
                      <span key={idx} className="btn btn-light disabled">
                        ...
                      </span>
                    ) : (
                      <button
                        key={idx}
                        className={`btn ${
                          p === page
                            ? "btn-primary"
                            : "btn-outline-secondary"
                        }`}
                        onClick={() => setPage(p)}
                      >
                        {p}
                      </button>
                    )
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </AppLayout>
  );
}