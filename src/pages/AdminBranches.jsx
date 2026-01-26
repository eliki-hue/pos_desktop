import React, { useEffect, useState } from "react";
import AppLayout from "../components/AppLayout";
import { api } from "../api/client";
import { useAuth } from "../auth/AuthContext";

export default function AdminBranches() {
  const { user } = useAuth();

  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const [name, setName] = useState("");

  const loadBranches = async () => {
    setLoading(true);
    setMsg("");
    try {
      const res = await api.get("/api/branches/");
      setBranches(res.data || []);
    } catch (err) {
      setMsg(err?.response?.data?.detail || "❌ Failed to load branches");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBranches();
  }, []);

  const createBranch = async () => {
    setMsg("");
    const trimmed = name.trim();
    if (!trimmed) {
      setMsg("❌ Branch name is required");
      return;
    }

    try {
      await api.post("/api/branches/", { name: trimmed });
      setName("");
      setMsg("✅ Branch created");
      await loadBranches();
    } catch (err) {
      setMsg(err?.response?.data?.detail || "❌ Failed to create branch");
    }
  };

  if (user?.role !==  "admin") {
    return (
      <AppLayout title="Branches" subtitle="Admin only">
        <div className="card">
          <div style={{ fontWeight: 900 }}>Access denied</div>
          <div className="muted">Only ADMIN can manage branches.</div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Branches" subtitle="Create and manage branches">
      <div className="card">
        <div style={{ fontWeight: 900 }}>Create Branch</div>
        <div className="muted" style={{ marginTop: 4 }}>
          Add new store/branch for POS operations.
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
          <input
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Branch name e.g. Main branch"
          />
          <button className="btn btn-primary" onClick={createBranch}>
            Add
          </button>
        </div>

        {msg && <div style={{ marginTop: 10, fontWeight: 800 }}>{msg}</div>}
      </div>

      <div style={{ marginTop: 16 }} className="card">
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
          <div>
            <div style={{ fontWeight: 900 }}>All Branches</div>
            <div className="muted">Total: {branches.length}</div>
          </div>
          <button className="btn btn-primary" onClick={loadBranches}>
            Refresh
          </button>
        </div>

        <div style={{ marginTop: 12 }}>
          {loading ? (
            <div className="muted">Loading branches...</div>
          ) : branches.length === 0 ? (
            <div className="muted">No branches found.</div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Branch Name</th>
                </tr>
              </thead>
              <tbody>
                {branches.map((b) => (
                  <tr key={b.id}>
                    <td>{b.id}</td>
                    <td style={{ fontWeight: 900 }}>{b.name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
