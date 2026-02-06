import { useEffect, useState } from "react";
import AppLayout from "../../components/AppLayout";
import { api } from "../../api/client";
import UserTable from "./UserTable";
import UserFormModal from "./UserFormModal";

export default function Users() {
  const [users, setUsers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [branchFilter, setBranchFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const loadUsers = async () => {
    setLoading(true);
    const res = await api.get("/api/auth/admin/users/");
    setUsers(res.data || []);
    setLoading(false);
  };

  useEffect(() => {
    loadUsers();
    api.get("/api/branches/").then((res) => {
      setBranches(res.data || []);
    });
  }, []);

  const filteredUsers = users.filter((u) => {
    if (!branchFilter) return true;
    return String(u.branch_id) === String(branchFilter);
  });

  return (
    <AppLayout title="User Management" subtitle="Manage system users">
      <div className="card">
        <div style={{ display: "flex", gap: 10 }}>
          <select
            className="input"
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
          >
            <option value="">All Branches</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>

          <button
            className="btn btn-primary"
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
          >
            + Add User
          </button>
        </div>
      </div>

      {loading ? (
        <div className="muted">Loading users…</div>
      ) : (
        <UserTable
          users={filteredUsers}
          onEdit={(u) => {
            setEditing(u);
            setOpen(true);
          }}
          onDeactivate={async (id) => {
            await api.post(`/api/auth/admin/users/${id}/`, {
              is_active: false,
            });
            loadUsers();
          }}
        />
      )}

      {open && (
        <UserFormModal
          user={editing}
          branches={branches}
          onClose={() => setOpen(false)}
          onSaved={loadUsers}
        />
      )}
    </AppLayout>
  );
}
