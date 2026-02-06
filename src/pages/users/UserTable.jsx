export default function UserTable({ users, onEdit, onDeactivate }) {
  return (
    <div className="card" style={{ marginTop: 20 }}>
      <table className="table">
        <thead>
          <tr>
            <th>Username</th>
            <th>Role</th>
            <th>Branch</th>
            <th>Status</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id}>
              <td>{u.username}</td>
              <td>{u.role}</td>
              <td>{u.branch_name || "—"}</td>
              <td>{u.is_active ? "Active" : "Inactive"}</td>
              <td style={{ display: "flex", gap: 8 }}>
                <button className="btn" onClick={() => onEdit(u)}>
                  Edit
                </button>
                {u.is_active && (
                  <button
                    className="btn btn-danger"
                    onClick={() => onDeactivate(u.id)}
                  >
                    Deactivate
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
