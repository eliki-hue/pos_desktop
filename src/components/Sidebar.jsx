import { NavLink } from "react-router-dom";

const linkStyle = ({ isActive }) => ({
  display: "flex",
  alignItems: "center",
  gap: 10,
  padding: "10px 12px",
  borderRadius: 10,
  border: `1px solid ${isActive ? "var(--primary)" : "transparent"}`,
  background: isActive ? "rgba(37, 99, 235, 0.08)" : "transparent",
  fontWeight: 700,
  color: isActive ? "var(--primary)" : "var(--text)",
});

export default function Sidebar() {
  return (
    <div
      style={{
        width: 260,
        borderRight: "1px solid var(--border)",
        background: "white",
        padding: 14,
        height: "100vh",
        position: "sticky",
        top: 0,
      }}
    >
      <div style={{ padding: 10 }}>
        <div style={{ fontSize: 18, fontWeight: 900 }}>POS Dashboard</div>
        <div className="muted">Cashier Panel</div>
      </div>

      <div style={{ marginTop: 14, display: "grid", gap: 6 }}>
        <NavLink to="/dashboard" style={linkStyle}>
          Dashboard
        </NavLink>
        <NavLink to="/products" style={linkStyle}>
          Products
        </NavLink>
        <NavLink to="/cart" style={linkStyle}>
          Cart
        </NavLink>
        <NavLink to="/sales" style={linkStyle}>
          Sales
        </NavLink>
        <NavLink to="/stores" style={linkStyle}>
          Stores
        </NavLink>
        <NavLink to="/account" style={linkStyle}>
          Account
        </NavLink>
      </div>

      <div style={{ marginTop: 18 }} className="muted">
        Tip: Scan barcode into the search field.
      </div>
    </div>
  );
}
