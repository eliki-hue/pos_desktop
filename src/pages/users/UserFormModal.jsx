import { useEffect, useState } from "react";
import { api } from "../../api/client";

const ROLES = ["admin", "manager", "cashier"];

export default function UserFormModal({ user, branches, onClose, onSaved }) {
  const [form, setForm] = useState({
    username: user?.username || "",
    email: user?.email || "",
    role: user?.role || "cashier",
    branch: user?.branch_id || "",
    password: "",
  });

  const [error, setError] = useState("");

  const save = async () => {
    setError("");

    if (form.role !== "admin" && !form.branch) {
      setError("Branch is required for this role");
      return;
    }

    if (user) {
      await api.patch(`/api/auth/admin/users/${user.id}/`, form);
    } else {
      await api.post("/api/auth/admin/users/create/", form);
    }

    onClose();
    onSaved();
  };

  return (
    <>
      <div className="user-modal-backdrop" onClick={onClose} />

      <div className="user-modal">
        <h3>{user ? "Edit User" : "Add User"}</h3>

        {error && <div style={{ color: "red" }}>{error}</div>}

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
              {r}
            </option>
          ))}
        </select>

        <select
          className="input"
          disabled={form.role === "admin"}
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

        <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
          <button className="btn" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={save}>
            Save
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
