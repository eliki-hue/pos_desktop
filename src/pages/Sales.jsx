import React, { useEffect, useState } from "react";
import AppLayout from "../components/AppLayout";
import { api } from "../api/client";

/* =====================================================
   STATUS BADGE
===================================================== */
function StatusBadge({ status }) {
  const colors = {
    PAID: "#16a34a",
    PARTIAL: "#f59e0b",
    CREDIT: "#dc2626",
  };

  return (
    <span
      style={{
        padding: "4px 8px",
        borderRadius: 6,
        fontWeight: 700,
        fontSize: 12,
        color: "white",
        background: colors[status] || "#6b7280",
      }}
    >
      {status}
    </span>
  );
}

/* =====================================================
   SALE DETAIL MODAL (FULL DETAILS)
===================================================== */
function SaleDetailModal({ sale, onClose }) {
  if (!sale) return null;

  const payments = sale.payments || [];

  const cashPaid = payments
    .filter((p) => p.method === "CASH")
    .reduce((s, p) => s + Number(p.amount), 0);

  const mpesaPaid = payments
    .filter((p) => p.method === "MPESA")
    .reduce((s, p) => s + Number(p.amount), 0);

  const totalPaid = cashPaid + mpesaPaid;
  const isSplit = cashPaid > 0 && mpesaPaid > 0;
  

  const showCustomer =
    sale.status === "PARTIAL" || sale.status === "CREDIT";

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.55)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: 16,
        zIndex: 9999,
      }}
    >
      <div
        className="card"
        style={{
          width: "100%",
          maxWidth: 600,
          maxHeight: "90vh",
          overflow: "auto",
        }}
      >
        {/* HEADER */}
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontWeight: 900 }}>Sale #{sale.id}</div>
            <div className="muted">
              {sale.date} at {sale.time}
            </div>
          </div>

          <button className="btn btn-danger" onClick={onClose}>
            Close
          </button>
        </div>

        {/* STATUS */}
        <div style={{ marginTop: 10 }}>
          <StatusBadge status={sale.status} />
        </div>

        {/* CUSTOMER DETAILS */}
        {showCustomer && (
          <div style={{ marginTop: 16 }}>
            <div style={{ fontWeight: 900 }}>Customer</div>
            <div className="muted">
              {sale.customer_name} <br />
              {sale.customer_phone}
              {sale.customer_id_number && (
                <>
                  <br />
                  ID: {sale.customer_id_number}
                </>
              )}
            </div>
          </div>
        )}

        {/* ITEMS */}
        <div style={{ marginTop: 16 }}>
          <div style={{ fontWeight: 900, marginBottom: 8 }}>Items</div>
          <table className="table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Qty</th>
                <th>Price</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {(sale.items || []).map((i) => (
                <tr key={i.id}>
                  <td>{i.product_name}</td>
                  <td>{i.quantity}</td>
                  <td>KES {i.unit_price}</td>
                  <td>KES {i.subtotal}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* PAYMENT BREAKDOWN */}
        <div style={{ marginTop: 16 }}>
          <div style={{ fontWeight: 900 }}>Payment</div>

          {cashPaid > 0 && (
            <div className="muted">Cash: KES {cashPaid}</div>
          )}
          {mpesaPaid > 0 && (
            <div className="muted">MPESA: KES {mpesaPaid}</div>
          )}

          {isSplit && (
            <div className="muted" style={{ fontWeight: 700 }}>
              Split Payment
            </div>
          )}

          <div className="muted" style={{ marginTop: 6 }}>
            Total Paid: KES {totalPaid}
          </div>

          {sale.status !== "PAID" && (
            <div className="muted">
              Balance Due: KES {sale.total - totalPaid}
            </div>
          )}
        </div>

        {/* TOTALS */}
        <div style={{ marginTop: 16, fontWeight: 900 }}>
          Subtotal: KES {sale.subtotal} <br />
          Discount: KES {sale.discount} <br />
          Tax: KES {sale.tax} <br />
          <div style={{ fontSize: 18, marginTop: 6 }}>
            TOTAL: KES {sale.total}
          </div>
        </div>
      </div>
    </div>
  );
}

/* =====================================================
   SALES PAGE
===================================================== */
export default function Sales() {
  const [sales, setSales] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [selectedSale, setSelectedSale] = useState(null);
  const [count, setCount] = useState(0);
  const [next, setNext] = useState(null);
  const [previous, setPrevious] = useState(null);

  const loadSales = async (url = "/api/sales/") => {
    setLoading(true);
    setMsg("");
    try {
      const res = await api.get(url);

      setSales(res.data.results || []);
      setCount(res.data.count || 0);
      setNext(res.data.next);
      setPrevious(res.data.previous);

    } catch (err) {
      setMsg(err?.response?.data?.detail || "❌ Failed to load sales");
    } finally {
      setLoading(false);
    }
  };
  const loadSummary = async () => {
    try {
      const res = await api.get("/api/sales/daily-summary/");
      setSummary(res.data);
    } catch {
      setSummary(null);
    }
  };

  useEffect(() => {
    loadSales();
    loadSummary();
  }, []);

  return (
    <AppLayout title="Sales" subtitle="Today's sales activity">
      <SaleDetailModal
        sale={selectedSale}
        onClose={() => setSelectedSale(null)}
      />

      {/* DAILY SUMMARY */}
      {summary && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div style={{ fontWeight: 900 }}>Today Summary</div>

          <div style={{ display: "flex", gap: 24, marginTop: 10 }}>
            <div>
              <div className="muted">Total Sales</div>
              <div style={{ fontWeight: 900 }}>
                KES {summary.total_sales}
              </div>
            </div>

            <div>
              <div className="muted">Cash</div>
              <div style={{ fontWeight: 900 }}>
                KES {summary.cash_total}
              </div>
            </div>

            <div>
              <div className="muted">MPESA</div>
              <div style={{ fontWeight: 900 }}>
                KES {summary.mpesa_total}
              </div>
            </div>

            <div>
            <div className="muted">Credit Sales</div>
            <div
              style={{
                fontWeight: 900,
                fontSize: 18,
                color: "#dc2626",
              }}
            >
              KES {summary.credit_total}
            </div>
          </div>
          </div>
        </div>
      )}

      {/* SALES TABLE */}
      <div className="card">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 10,
          }}
        >
          <div>
            <div style={{ fontWeight: 900 }}>Sales List</div>
            <div className="muted">
              Showing {count} sale(s) for today
            </div>
          </div>

          <button className="btn btn-primary" onClick={loadSales}>
            Refresh
          </button>
        </div>

        {msg && <div style={{ marginBottom: 10 }}>{msg}</div>}

        {loading ? (
          <div className="muted">Loading sales...</div>
        ) : sales.length === 0 ? (
          <div className="muted">No sales recorded today.</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Time</th>
                <th>Status</th>
                <th>Items</th>
                <th>Total</th>
                <th>Payment</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {sales.map((s) => {
                const methods = new Set(
                  (s.payments || []).map((p) => p.method)
                );

                let paymentLabel = "—";
                if (methods.size === 1) {
                  paymentLabel = [...methods][0];
                } else if (methods.size > 1) {
                  paymentLabel = "SPLIT";
                }

                return (
                  <tr key={s.id}>
                    <td>{s.id}</td>
                    <td>{s.time}</td>
                    <td>
                      <StatusBadge status={s.status} />
                    </td>
                    <td>{s.item_count}</td>
                    <td style={{ fontWeight: 900 }}>
                      KES {s.total}
                    </td>
                    <td>{paymentLabel}</td>
                    <td>
                      <button
                        className="btn"
                        onClick={() => setSelectedSale(s)}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          
        )}
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12 }}>
  
        <button
          className="btn"
          disabled={!previous}
          onClick={() => loadSales(previous)}
        >
          ← Previous
        </button>

        <button
          className="btn"
          disabled={!next}
          onClick={() => loadSales(next)}
        >
          Next →
        </button>

      </div>
      </div>
    </AppLayout>
  );
}
