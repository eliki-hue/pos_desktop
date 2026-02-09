import React, { useEffect, useState } from "react";
import AppLayout from "../components/AppLayout";
import { api } from "../api/client";

const BASE_URL = "/api/auth/sessions/";

export default function AdminSessions() {
  const [sessions, setSessions] = useState([]);
  const [selected, setSelected] = useState([]);
  const [nextUrl, setNextUrl] = useState(null);
  const [prevUrl, setPrevUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadSessions = async (url = BASE_URL) => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get(url);
      setSessions(res.data.results || []);
      setNextUrl(res.data.next);
      setPrevUrl(res.data.previous);
      setSelected([]);
    } catch (err) {
      console.error(err);
      setError("Failed to load sessions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  const toggleSelect = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    setSelected(sessions.map((s) => s.id));
  };

  const clearSelection = () => setSelected([]);

  const terminateSelected = async () => {
    try {
      await Promise.all(
        selected.map((id) =>
          api.post(`${BASE_URL}${id}/terminate/`)
        )
      );
      loadSessions();
    } catch {
      setError("Failed to terminate selected sessions");
    }
  };

  const deleteSelected = async () => {
    try {
      await api.post(`${BASE_URL}delete/`, {
        session_ids: selected,
      });
      loadSessions();
    } catch {
      setError("Failed to delete session history");
    }
  };

  return (
    <AppLayout title="Sessions" subtitle="Admin session management">
      <div className="card">
        {/* ACTION BAR */}
        <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
          <button className="btn" onClick={selectAll}>
            Select all
          </button>

          <button className="btn" onClick={clearSelection}>
            Clear
          </button>

          <button
            className="btn btn-warning"
            disabled={!selected.length}
            onClick={terminateSelected}
          >
            Terminate selected
          </button>

          <button
            className="btn btn-danger"
            disabled={!selected.length}
            onClick={deleteSelected}
          >
            Delete history
          </button>
        </div>

        {error && (
          <div style={{ color: "red", marginBottom: 10 }}>{error}</div>
        )}

        {/* TABLE */}
        {loading ? (
          <div className="muted">Loading sessions…</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th />
                <th>User</th>
                <th>IP</th>
                <th>Device</th>
                <th>Started</th>
                <th>Ended</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((s) => (
                <tr key={s.id}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selected.includes(s.id)}
                      onChange={() => toggleSelect(s.id)}
                    />
                  </td>
                  <td>{s.username}</td>
                  <td>{s.ip_address || "—"}</td>
                  <td style={{ maxWidth: 260 }}>
                    {s.user_agent ? s.user_agent.slice(0, 80) : "—"}
                  </td>
                  <td>{new Date(s.created_at).toLocaleString()}</td>
                  <td>
                    {s.ended_at
                      ? new Date(s.ended_at).toLocaleString()
                      : "—"}
                  </td>
                  <td>
                    {s.is_active ? (
                      <span style={{ color: "green", fontWeight: 700 }}>
                        Active
                      </span>
                    ) : (
                      <span style={{ color: "red", fontWeight: 700 }}>
                        Ended
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* PAGINATION */}
        <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
          <button
            className="btn"
            disabled={!prevUrl}
            onClick={() => loadSessions(prevUrl)}
          >
            Previous
          </button>

          <button
            className="btn"
            disabled={!nextUrl}
            onClick={() => loadSessions(nextUrl)}
          >
            Next
          </button>
        </div>
      </div>
    </AppLayout>
  );
}
