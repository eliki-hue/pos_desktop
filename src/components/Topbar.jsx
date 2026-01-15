import { useAuth } from "../auth/AuthContext";

export default function Topbar({ title, subtitle }) {
  const { logout } = useAuth();

  return (
    <div
      style={{
        background: "white",
        borderBottom: "1px solid var(--border)",
        padding: "14px 18px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
      }}
    >
      <div>
        <div style={{ fontSize: 18, fontWeight: 900 }}>{title}</div>
        {subtitle ? <div className="muted">{subtitle}</div> : null}
      </div>

      <button className="btn" onClick={logout}>
        Logout
      </button>
    </div>
  );
}
