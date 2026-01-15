import { useEffect, useState } from "react";
import AppLayout from "../components/AppLayout";
import { api } from "../api/client";

export default function Sales() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get("/sales/");
      setSales(res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <AppLayout title="Sales" subtitle="Completed sales transactions">
      <div className="card">
        {loading ? (
          <div className="muted">Loading sales...</div>
        ) : sales.length === 0 ? (
          <div className="muted">No sales yet.</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Total</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {sales.map((s) => (
                <tr key={s.id}>
                  <td>{s.id}</td>
                  <td>KES {s.total}</td>
                  <td>{s.created_at || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </AppLayout>
  );
}
