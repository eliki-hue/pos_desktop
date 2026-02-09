import React from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

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
  const { user } = useAuth();

  // normalize role to avoid mismatch issues
  const role = (user?.role || "").toUpperCase();

  const isCashier = role === "CASHIER";
  const isManager = role === "MANAGER";
  const isAdmin = role === "ADMIN";

  // manager can see cashier pages too (common real POS flow)
  const canUsePOS = isCashier || isManager || isAdmin;

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
        <div className="muted">
          {role ? `${role} Panel` : "Loading..."}
        </div>
      </div>

      <div style={{ marginTop: 14, display: "grid", gap: 6 }}>
        {/* Cashier / POS links */}
        {isCashier && (
          <>
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
            <NavLink to="/receipts" style={linkStyle}>
              Receipts
            </NavLink>
          </>
        )}

        {/* Manager links */}
        {(isManager ) && (
          <>
            <div style={{ marginTop: 10 }} className="muted">
              Management
            </div>

            <NavLink to="/manager/inventory" style={linkStyle}>
              Inventory
            </NavLink>

            <NavLink to="/manager/sales" style={linkStyle}>
              Sales Reports
            </NavLink>
          </>
        )}

        {/* Admin links */}
        {isAdmin && (
          <>
            <div style={{ marginTop: 10 }} className="muted">
              Admin
            </div>
          
            <NavLink to="/admin/dashboard" style={linkStyle}>
              Admin Dashboard
            </NavLink>
            
            <NavLink to="/admin/products" style={linkStyle}>
              Products
            </NavLink>

            

            <NavLink to="/admin/branches/1" style={linkStyle}>
              Branch Detail
            </NavLink>

             <NavLink to="/admin/branches" style={linkStyle}>
              Manage Branches 
            </NavLink>

            <NavLink to="/admin/users" style={linkStyle}>
              manage users
            </NavLink>

            <NavLink to="/admin/sessions" style={linkStyle}>
              user sessions
            </NavLink>
            

          </>
        )}

        {/* Everyone can see account */}
          
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
