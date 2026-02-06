import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import React from "react";

import RequireAuth from "./auth/RequireAuth";
import RequireRole from "./auth/RequireRole";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/products/Products";
import Cart from "./pages/Cart";
import Sales from "./pages/Sales";
import Stores from "./pages/Stores";
import Account from "./pages/Account";
import Receipts from "./pages/Receipts";
import AdminBranchDetail from "./pages/branchesReports/AdminBranchDetail"


// ✅ Manager/Admin pages (already created)
import ManagerInventory from "./pages/ManagerInventory";
import ManagerSales from "./pages/ManagerSales";

// ✅ Admin pages (already created)
import AdminBranches from "./pages/AdminBranches";
import AdminProducts from "./pages/products/AdminProducts";
import AdminUsers from "./pages/AdminUsers";
import AdminDashboard from "./pages/AdminDashboard";

import AdminAddProduct from "./pages/products/AdminProducts";
import Users from "./pages/users/Users";



export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        <Route path="/login" element={<Login />} />

        {/* ================= POS (Cashier) ================= */}
        <Route
          path="/dashboard"
          element={
            <RequireAuth>
              <Dashboard />
            </RequireAuth>
          }
        />

        <Route
          path="/products"
          element={
            <RequireAuth>
              <Products />
            </RequireAuth>
          }
        />

        <Route
          path="/cart"
          element={
            <RequireAuth>
              <Cart />
            </RequireAuth>
          }
        />

        <Route
          path="/sales"
          element={
            <RequireAuth>
              <Sales />
            </RequireAuth>
          }
        />

        <Route
          path="/receipts"
          element={
            <RequireAuth>
              <Receipts />
            </RequireAuth>
          }
        />

        <Route
          path="/stores"
          element={
            <RequireAuth>
              <Stores />
            </RequireAuth>
          }
        />

        <Route
          path="/account"
          element={
            <RequireAuth>
              <Account />
            </RequireAuth>
          }
        />

        {/* ================= Manager Routes ================= */}
        <Route
          path="/manager/inventory"
          element={
            <RequireRole allowedRoles={["MANAGER", "ADMIN"]}>
              <ManagerInventory />
            </RequireRole>
          }
        />

        <Route
          path="/manager/sales"
          element={
            <RequireRole allowedRoles={["MANAGER", "ADMIN"]}>
              <ManagerSales />
            </RequireRole>
          }
        />

        {/* ================= Admin Routes ================= */}
        <Route
          path="/admin/branches"
          element={
            <RequireRole allowedRoles={["ADMIN"]}>
              <AdminBranches />
            </RequireRole>
          }
        />

        <Route
          path="/admin/products"
          element={
            <RequireRole allowedRoles={["ADMIN"]}>
              <AdminProducts />
            </RequireRole>
          }
        />
        <Route
          path="/admin/dashboard"
          element={
            <RequireAuth>
              <RequireRole allowedRoles={["ADMIN"]}>
                <AdminDashboard />
              </RequireRole>
            </RequireAuth>
          }
        />

        <Route
          path="/admin/users"
          element={
            <RequireAuth>
              <RequireRole allowedRoles={["ADMIN"]}>
                <Users />
              </RequireRole>
            </RequireAuth>
          }
        />
        {/* import AdminBranchDetail from "./pages/AdminBranchDetail"; */}

        <Route
          path="/admin/branches/:branchId"
          element={
            <RequireRole allowedRoles={["ADMIN"]}>
              <AdminBranchDetail />
            </RequireRole>
          }
        />

        <Route
          path="/admin/products/add"
          element={<AdminAddProduct />}
        />

        <Route path="/admin/users" element={<Users />} />

        {/* fallback */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
