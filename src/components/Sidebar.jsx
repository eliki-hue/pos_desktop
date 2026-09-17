import React, { useCallback, useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Calculator,
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
  User2,
  Clock,
  MessagesSquare
} from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import { api } from "../api/client";

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
  textDecoration: "none",
});

/*
|--------------------------------------------------------------------------
| Notification Badge
|--------------------------------------------------------------------------
*/
const NotificationBadge = ({ count }) => {
  if (!count || count <= 0) return null;

  return (
    <span
      style={{
        marginLeft: "auto",
        minWidth: 18,
        height: 18,
        padding: "0 5px",
        borderRadius: 999,
        backgroundColor: "#dc2626",
        color: "#ffffff",
        fontSize: 10,
        fontWeight: 800,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        lineHeight: 1,
        boxSizing: "border-box",
      }}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
};

export default function Sidebar() {
  const { user } = useAuth();

  // normalize role to avoid mismatch issues
  const role = (user?.role || "").toUpperCase();

  const isCashier = role === "CASHIER";
  const isManager = role === "MANAGER";
  const isAccountant = role === "ACCOUNTANT";
  const isAdmin = role === "ADMIN";

  // manager can see cashier pages too
  const canUsePOS = isCashier || isManager || isAdmin;

  /*
  |--------------------------------------------------------------------------
  | Adjustment notifications
  |--------------------------------------------------------------------------
  */
  const [adjustmentNotifications, setAdjustmentNotifications] = useState({
    pending: 0,
    cashierAction: 0,
  });

  const [discountPendingCount, setDiscountPendingCount] = useState(0);

  const loadAdjustmentNotifications = useCallback(async () => {
    if (!user) return;

    try {
      /*
      |--------------------------------------------------------------------------
      | MANAGER / ADMIN
      | Count requests waiting for approval
      |--------------------------------------------------------------------------
      */
      if (isManager || isAdmin) {
        const [adjustmentsResponse, discountsResponse] =
          await Promise.all([
            api.get("/api/adjustments/pending/"),
            api.get("/api/cart/pos/discount-requests/"),
          ]);

        const adjustmentRequests = Array.isArray(
          adjustmentsResponse.data
        )
          ? adjustmentsResponse.data
          : [];

        const discountRequests = Array.isArray(
          discountsResponse.data
        )
          ? discountsResponse.data
          : [];

        const pendingDiscounts = discountRequests.filter(
          (request) =>
            String(request.status || "").toUpperCase() === "PENDING"
        );

        setAdjustmentNotifications({
          pending: adjustmentRequests.length,
          cashierAction: 0,
        });

        setDiscountPendingCount(
          pendingDiscounts.length
        );

        return;
      }

      /*
      |--------------------------------------------------------------------------
      | CASHIER
      | Count approved requests that still require cashier action
      |
      | We specifically count:
      |   status = APPROVED
      |   refund_required = true
      |   refund_status = PENDING
      |--------------------------------------------------------------------------
      */
      if (isCashier) {
        const response = await api.get(
          "/api/adjustments/my-requests/"
        );

        const requests = Array.isArray(response.data)
          ? response.data
          : [];

        const actionRequired = requests.filter((request) => {
          return (
            String(request.status || "").toUpperCase() === "APPROVED" &&
            request.refund_required === true &&
            String(request.refund_status || "").toUpperCase() ===
              "PENDING"
          );
        });

        setAdjustmentNotifications({
          pending: 0,
          cashierAction: actionRequired.length,
        });

        setDiscountPendingCount(0);


        return;
      }

      setAdjustmentNotifications({
        pending: 0,
        cashierAction: 0,
      });

      setDiscountPendingCount(0);

    } catch (error) {
      console.error(
        "Failed to load adjustment notifications:",
        error
      );
    }
  }, [user, isManager, isAdmin, isCashier]);

  /*
  |--------------------------------------------------------------------------
  | Initial load + automatic refresh
  |--------------------------------------------------------------------------
  */
  useEffect(() => {
    if (!user) return;

    loadAdjustmentNotifications();

    // Refresh every 30 seconds
    const interval = setInterval(() => {
      loadAdjustmentNotifications();
    }, 30000);

    return () => clearInterval(interval);
  }, [user, loadAdjustmentNotifications]);

  /*
  |--------------------------------------------------------------------------
  | Refresh when user returns to browser/tab
  |--------------------------------------------------------------------------
  */
  useEffect(() => {
    const handleFocus = () => {
      loadAdjustmentNotifications();
    };

    window.addEventListener("focus", handleFocus);

    return () => {
      window.removeEventListener("focus", handleFocus);
    };
  }, [loadAdjustmentNotifications]);

  /*
  |--------------------------------------------------------------------------
  | Badge values
  |--------------------------------------------------------------------------
  */
  const managerPendingCount =
    adjustmentNotifications.pending;

  const cashierActionCount =
    adjustmentNotifications.cashierAction;

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
        <div style={{ fontSize: 18, fontWeight: 900 }}>
          POS Dashboard
        </div>

        <div className="muted">
          {role ? `${role} Panel` : "Loading..."}
        </div>
      </div>

      {/* ============================================================
          CASHIER / POS LINKS
         ============================================================ */}
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

          <NavLink
            to="/balance/sales/outstanding"
            style={linkStyle}
          >
            <CreditCard size={20} />
            <span>Credit Sales</span>
          </NavLink>

          {/* CASHIER NOTIFICATION BADGE */}
          <NavLink to="/adjustments/my" style={linkStyle}>
            <ClipboardList size={20} />

            <span>My Requests</span>

            <NotificationBadge
              count={cashierActionCount}
            />
          </NavLink>
        </>
      )}

      {/* ============================================================
          MANAGER LINKS
         ============================================================ */}
      {isManager && (
        <>
          <div
            style={{ marginTop: 10 }}
            className="muted"
          >
            Management
          </div>

          <NavLink
            to="/manager/sales"
            style={linkStyle}
          >
            <BarChart3 size={20} />
            <span>Sales Reports</span>
          </NavLink>

          <NavLink
            to="/pos-admin/ecommerce-orders"
            style={linkStyle}
          >
            <ShoppingBag size={20} />
            <span>Ecommerce Orders</span>
          </NavLink>

          <NavLink
            to="/manager/inventory"
            style={linkStyle}
          >
            <PackageOpen size={20} />
            <span>Adjust Stocks</span>
          </NavLink>

          <NavLink
            to="/stock-transfers"
            style={linkStyle}
          >
            <Truck size={20} />
            <span>Stock Transfers</span>
          </NavLink>

          <NavLink
            to="/api/reports/movements"
            style={linkStyle}
          >
            <Activity size={20} />
            <span>Stock Changes Reports</span>
          </NavLink>

          <NavLink
            to="/purchases"
            style={linkStyle}
          >
            <ShoppingBag size={20} />
            <span>Purchases</span>
          </NavLink>

          <NavLink
            to="/suppliers"
            style={linkStyle}
          >
            <Truck size={20} />
            <span>Suppliers</span>
          </NavLink>

          <NavLink
            to="/customers"
            style={linkStyle}
          >
            <User2 size={20} />
            <span>Customers</span>
          </NavLink>

          <NavLink
            to="/balance/sales/outstanding"
            style={linkStyle}
          >
            <CreditCard size={20} />
            <span>Credit Sales</span>
          </NavLink>

          {/* MANAGER NOTIFICATION BADGE */}
          <NavLink
            to="/adjustments/pending"
            style={linkStyle}
          >
            <CheckCircle size={20} />

            <span>Pending Approvals</span>

            <NotificationBadge
              count={managerPendingCount}
            />
          </NavLink>

          <NavLink
            to="/discount-requests"
            style={linkStyle}
          >
            <CheckCircle size={20} />
            <span>Discount Requests</span>
            <NotificationBadge
               count={discountPendingCount}
            />      
          </NavLink>
        </>
      )}

      {/* ============================================================
          ACCOUNTANT LINKS
         ============================================================ */}
      {isAccountant && (
        <>
          <div
            style={{ marginTop: 10 }}
            className="muted"
          >
            Accounting
          </div>

          <NavLink
            to="/accountant/dashboard"
            style={linkStyle}
          >
            <Calculator size={20} />
            <span>Accountant Dashboard</span>
          </NavLink>

          <NavLink
            to="/suppliers"
            style={linkStyle}
          >
            <Truck size={20} />
            <span>Suppliers</span>
          </NavLink>

          <NavLink
            to="/purchases"
            style={linkStyle}
          >
            <ShoppingBag size={20} />
            <span>Purchases</span>
          </NavLink>

          <NavLink
            to="/customers"
            style={linkStyle}
          >
            <User2 size={20} />
            <span>Customers</span>
          </NavLink>

          <NavLink
            to="/accountant/sales"
            style={linkStyle}
          >
            <Receipt size={20} />
            <span>Sales Records</span>
          </NavLink>

          <NavLink
            to="/balance/sales/outstanding"
            style={linkStyle}
          >
            <CreditCard size={20} />
            <span>Credit Sales</span>
          </NavLink>
        </>
      )}

      {/* ============================================================
          ADMIN LINKS
         ============================================================ */}
      {isAdmin && (
        <>
          <div
            style={{ marginTop: 10 }}
            className="muted"
          >
            Admin
          </div>

          <NavLink
            to="/pos-admin/dashboard"
            style={linkStyle}
          >
            <LayoutDashboard size={20} />
            <span>Admin Dashboard</span>
          </NavLink>

          <NavLink
            to="/pos-admin/products"
            style={linkStyle}
          >
            <Package size={20} />
            <span>Products</span>
          </NavLink>

          <NavLink
            to="/pos-admin/branch/1"
            style={linkStyle}
          >
            <Building2 size={20} />
            <span>Branch Detail</span>
          </NavLink>

          <NavLink
            to="/purchases"
            style={linkStyle}
          >
            <ShoppingBag size={20} />
            <span>Purchases</span>
          </NavLink>

          <NavLink
            to="/suppliers"
            style={linkStyle}
          >
            <Truck size={20} />
            <span>Suppliers</span>
          </NavLink>

          <NavLink
            to="/customers"
            style={linkStyle}
          >
            <User2 size={20} />
            <span>Customers</span>
          </NavLink>

          <NavLink
            to="/balance/sales/outstanding"
            style={linkStyle}
          >
            <CreditCard size={20} />
            <span>Credit Sales</span>
          </NavLink>

          {/* ADMIN NOTIFICATION BADGE */}
          <NavLink
            to="/adjustments/pending"
            style={linkStyle}
          >
            <CheckCircle size={20} />

            <span>Pending Approvals</span>

            <NotificationBadge
              count={managerPendingCount}
            />
          </NavLink>

          <NavLink
            to="/discount-requests"
            style={linkStyle}
          >
            <CheckCircle size={20} />
            <span>Discount Requests</span>
            <NotificationBadge
              count={discountPendingCount}
            />  
          </NavLink>

          <NavLink
            to="/pos-admin/branches"
            style={linkStyle}
          >
            <GitBranch size={20} />
            <span>Manage Branches</span>
          </NavLink>

          <NavLink
            to="/pos-admin/users"
            style={linkStyle}
          >
            <Users size={20} />
            <span>Manage Users</span>
          </NavLink>

          <NavLink
            to="/pos-admin/reviews"
            style={linkStyle}
          >
            <MessagesSquare size={20} />
            <span>Ecommerce Reviews</span>
          </NavLink>

          <NavLink
            to="/pos-admin/sessions"
            style={linkStyle}
          >
            <Clock size={20} />
            <span>User Sessions</span>
          </NavLink>
        </>
      )}

      {/* ============================================================
          ACCOUNT
         ============================================================ */}
      <NavLink
        to="/account"
        style={linkStyle}
      >
        <User size={20} />
        <span>Account</span>
      </NavLink>

      <div
        style={{ marginTop: 18 }}
        className="muted"
      >
        Tip: Scan barcode into the search field.
      </div>
    </div>
  );
}