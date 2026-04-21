import React from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Receipt,
  Printer,
  CreditCard,
  ClipboardList,
  BarChart3,
  ShoppingBag,
  PackageOpen,
  Truck,
  Activity,
  CheckCircle,
  Building2,
  GitBranch,
  Users,
  User,
  Clock
} from 'lucide-react';
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

        {/* <div style={{ marginTop: 14, display: "grid", gap: 6 }}> */}
          {/* Cashier / POS links */}
          {isCashier && (
            <>
              <NavLink to="/dashboard" style={linkStyle}>
                <LayoutDashboard size={20} />
                <span>Dashboard</span>
              </NavLink>
              <NavLink to="/products" style={linkStyle}>
                <Package size={20} />
                <span>Products</span>
              </NavLink>
              <NavLink to="/cart" style={linkStyle}>
                <ShoppingCart size={20} />
                <span>Cart</span>
              </NavLink>
              <NavLink to="/sales" style={linkStyle}>
                <Receipt size={20} />
                <span>Sales</span>
              </NavLink>
              <NavLink to="/receipts" style={linkStyle}>
                <Printer size={20} />
                <span>Receipts</span>
              </NavLink>
              <NavLink to="/balance/sales/outstanding" style={linkStyle}>
                <CreditCard size={20} />
                <span>Credit Sales</span>
              </NavLink>
              <NavLink to="/adjustments/my" style={linkStyle}>
                <ClipboardList size={20} />
                <span>My Requests</span>
              </NavLink>
            </>
          )}

          {/* Manager links */}
          {(isManager) && (
            <>
              <div style={{ marginTop: 10 }} className="muted">
                Management
              </div>
              <NavLink to="/manager/sales" style={linkStyle}>
                <BarChart3 size={20} />
                <span>Sales Reports</span>
              </NavLink>

              <NavLink to="/admin/ecommerce-orders" style={linkStyle}>
                <ShoppingBag size={20} />
                <span>Ecommerce Orders</span>
              </NavLink>

              <NavLink to="/manager/inventory" style={linkStyle}>
                <PackageOpen size={20} />
                <span>Adjust Stocks</span>
              </NavLink>

              <NavLink to="/stock-transfers" style={linkStyle}>
                <Truck size={20} />
                <span>Stock Transfers</span>
              </NavLink>

              <NavLink to="/api/reports/movements" style={linkStyle}>
                <Activity size={20} />
                <span>Stock Changes Reports</span>
              </NavLink>

              <NavLink to="/purchases" style={linkStyle}>
                <ShoppingBag size={20} />
                <span>Purchases</span>
              </NavLink>

              <NavLink to="/suppliers" style={linkStyle}>
                <Truck size={20} />
                <span>Suppliers</span>
              </NavLink>

              <NavLink to="/balance/sales/outstanding" style={linkStyle}>
                <CreditCard size={20} />
                <span>Credit Sales</span>
              </NavLink>

              <NavLink to="/adjustments/pending" style={linkStyle}>
                <CheckCircle size={20} />
                <span>Pending Approvals</span>
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
                <LayoutDashboard size={20} />
                <span>Admin Dashboard</span>
              </NavLink>

              <NavLink to="/admin/products" style={linkStyle}>
                <Package size={20} />
                <span>Products</span>
              </NavLink>

              <NavLink to="/admin/branches/1" style={linkStyle}>
                <Building2 size={20} />
                <span>Branch Detail</span>
              </NavLink>

                            
              <NavLink to="/purchases" style={linkStyle}>
                <ShoppingBag size={20} />
                <span>Purchases</span>
              </NavLink>

              <NavLink to="/suppliers" style={linkStyle}>
                <Truck size={20} />
                <span>Suppliers</span>
              </NavLink>

              <NavLink to="/balance/sales/outstanding" style={linkStyle}>
                <CreditCard size={20} />
                <span>Credit Sales</span>
              </NavLink>

              <NavLink to="/adjustments/pending" style={linkStyle}>
                <CheckCircle size={20} />
                <span>Pending Approvals</span>
              </NavLink>


              <NavLink to="/admin/branches" style={linkStyle}>
                <GitBranch size={20} />
                <span>Manage Branches</span>
              </NavLink>

              <NavLink to="/admin/users" style={linkStyle}>
                <Users size={20} />
                <span>Manage Users</span>
              </NavLink>
              
              <NavLink to="/admin/sessions" style={linkStyle}>
                <Clock size={20} />
                <span>User Sessions</span>
              </NavLink>
            </>
          )}
      

        {/* Everyone can see account */}
          
          
           <NavLink to="/account" style={linkStyle}>
            <User size={20} />
            <span>Account</span>
          </NavLink>
        
      

      <div style={{ marginTop: 18 }} className="muted">
        Tip: Scan barcode into the search field.
      </div>
    </div>
  );
}
