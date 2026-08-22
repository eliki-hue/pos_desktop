import { useEffect, useState } from "react";
import { api } from "../../api/client";

const ROLES = ["admin", "manager", "cashier", "accountant"];

export default function UserFormModal({ user, branches, onClose, onSaved }) {
  const [form, setForm] = useState({
    username: user?.username || "",
    email: user?.email || "",
    role: user?.role || "cashier",
    branch: user?.branch_id || "",
    password: "",
    is_active: user?.is_active ?? true,
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const save = async () => {
    setError("");
    setLoading(true);

    if (!["admin", "accountant"].includes(form.role) && !form.branch) {
      setError("Branch is required for this role");
      setLoading(false);
      return;
    }

    try {
      if (user) {
        // Update existing user
        await api.patch(`/api/auth/admin/users/${user.id}/`, {
          email: form.email,
          role: form.role,
          branch: form.branch,
          is_active: form.is_active,
        });
      } else {
        // Create new user
        if (!form.password) {
          setError("Password is required for new user");
          setLoading(false);
          return;
        }
        await api.post("/api/auth/admin/users/create/", {
          username: form.username,
          email: form.email,
          role: form.role,
          branch: form.branch,
          password: form.password,
          is_active: true,
        });
      }

      onSaved();
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || err.response?.data?.error || "Failed to save user");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="user-modal-backdrop" onClick={onClose} />

      <div className="user-modal">
        <h3>{user ? "Edit User" : "Add User"}</h3>

        {error && <div style={{ color: "red", marginBottom: 12, padding: 8, background: "#fdecea", borderRadius: 6 }}>{error}</div>}

        <input
          className="input"
          placeholder="Username"
          value={form.username}
          disabled={!!user}
          onChange={(e) =>
            setForm({ ...form, username: e.target.value })
          }
        />

        <input
          className="input"
          placeholder="Email"
          value={form.email}
          onChange={(e) =>
            setForm({ ...form, email: e.target.value })
          }
        />

        {!user && (
          <input
            type="password"
            className="input"
            placeholder="Password"
            value={form.password}
            onChange={(e) =>
              setForm({ ...form, password: e.target.value })
            }
          />
        )}

        <select
          className="input"
          value={form.role}
          onChange={(e) =>
            setForm({ ...form, role: e.target.value })
          }
        >
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {r.charAt(0).toUpperCase() + r.slice(1)}
            </option>
          ))}
        </select>

        <select
          className="input"
          disabled={["admin", "accountant"].includes(form.role)}
          value={form.branch || ""}
          onChange={(e) =>
            setForm({ ...form, branch: e.target.value })
          }
        >
          <option value="">— Select Branch —</option>
          {branches.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>

        {/* ACTIVE TOGGLE - Only show for editing existing users */}
        {user && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "12px",
              background: form.is_active ? "#e6f4ea" : "#fdecea",
              borderRadius: "8px",
              marginTop: "12px",
              marginBottom: "12px",
              border: `1px solid ${form.is_active ? "#b7eb8f" : "#ffccc7"}`,
            }}
          >
            <div>
              <div style={{ fontWeight: 600, marginBottom: 2 }}>
                {form.is_active ? "✅ Active" : "❌ Inactive"}
              </div>
              <div style={{ fontSize: 12, color: "#666" }}>
                {form.is_active 
                  ? "User can log in and access the system" 
                  : "User cannot log in to the system"}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setForm({ ...form, is_active: !form.is_active })}
              style={{
                padding: "8px 16px",
                borderRadius: "6px",
                border: "none",
                background: form.is_active ? "#dc2626" : "#059669",
                color: "#fff",
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              {form.is_active ? "Deactivate" : "Activate"}
            </button>
          </div>
        )}

        <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
          <button className="btn" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={save} disabled={loading}>
            {loading ? "Saving..." : (user ? "Update User" : "Create User")}
          </button>
        </div>
      </div>

      <style>{`
        .user-modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,.45);
          z-index: 1000;
        }
        .user-modal {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: white;
          padding: 20px;
          width: 420px;
          max-height: 90vh;
          overflow-y: auto;
          border-radius: 12px;
          z-index: 1001;
        }
        .user-modal .input {
          width: 100%;
          margin-bottom: 10px;
        }
      `}</style>
    </>
  );
}