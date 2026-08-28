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
import AdminBranchDetail from "./pages/branchesReports/AdminBranchDetail";

import ManagerInventory from "./pages/inventory/ManagerInventory";
import ManagerSales from "./pages/ManagerSales";

import AdminBranches from "./pages/AdminBranches";
import AdminProducts from "./pages/products/AdminProducts";
import AdminUsers from "./pages/AdminUsers";
import AdminDashboard from "./pages/AdminDashboard";
import AdminSessions from "./pages/AdminSessions";
import AdminAddProduct from "./pages/products/AdminProducts";
import Users from "./pages/users/Users";
import StockIn from "./pages/inventory/stock_in";
import StockMovementReport from "./pages/inventory/StockMovementReport";
import Transfers from "./pages/inventory/Transfers";
import EcommerceOrdersPage from "./pages/EcommerceOrdersPage";
import StockTransfersPage from "./pages/StockTransfersPage";

// Purchase imports - using the correct components
import PurchaseList from './components/purchases/PurchaseList';
import PurchaseDetail from './components/purchases/PurchaseDetail';
import PurchaseForm from "./components/Purchases/PurchaseForm";
import Purchases from './components/purchases/Purchases'; // This should be the wrapper component
import SupplierList from "./components/Purchases/suppliers/SupplierList";

import OutstandingSales from './pages/OutstandingSales';
import SaleDetail from './pages/SaleDetail';

import MyAdjustmentRequests from './pages/MyAdjustmentRequests';
import PendingAdjustments from './pages/PendingAdjustments';
import { Toaster } from 'react-hot-toast';
import Reviews from "./pages/AdminReviews";


import DiscountRequests from "./pages/DiscountRequests";

import { CustomerList, CustomerDetails } from './customerModule';

import AccountantDashboard from "./pages/AccountantDashboard";
import AccountantSales from "./pages/AccountantSales";

export default function App() {
  return (
    <BrowserRouter basename="/">

      <Toaster 
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#363636',
              color: '#fff',
              borderRadius: '12px',
              padding: '16px',
            },
          }}
        />


      <Routes>
        {/* Root */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        <Route path="login" element={<Login />} />

        {/* ================= POS (Cashier) ================= */}
        <Route
          path="dashboard"
          element={
            <RequireAuth>
              <Dashboard />
            </RequireAuth>
          }
        />

        <Route
          path="products"
          element={
            <RequireAuth>
              <Products />
            </RequireAuth>
          }
        />

        <Route
          path="cart"
          element={
            <RequireAuth>
              <Cart />
            </RequireAuth>
          }
        />

        <Route
          path="sales"
          element={
            <RequireAuth>
              <Sales />
            </RequireAuth>
          }
        />

        <Route
          path="receipts"
          element={
            <RequireAuth>
              <Receipts />
            </RequireAuth>
          }
        />

        <Route
          path="stores"
          element={
            <RequireAuth>
              <Stores />
            </RequireAuth>
          }
        />

        <Route
          path="account"
          element={
            <RequireAuth>
              <Account />
            </RequireAuth>
          }
        />

        {/* ================= Manager ================= */}
        <Route
          path="manager/inventory"
          element={
            <RequireRole allowedRoles={["MANAGER", "ADMIN"]}>
              <ManagerInventory />
            </RequireRole>
          }
        />

        <Route path="/stock-transfers" element={<StockTransfersPage />} />
        <Route path="/pos-admin/ecommerce-orders" element={<EcommerceOrdersPage />} />
        <Route path="/suppliers" element={<SupplierList />} />
        <Route
          path="manager/sales"
          element={
            <RequireRole allowedRoles={["MANAGER", "ADMIN"]}>
              <ManagerSales />
            </RequireRole>
          }
        />

        <Route
          path="/api/reports/movements" 
          element={<StockMovementReport />}
        />

        <Route
              path="/discount-requests"
              element={<DiscountRequests />}
        />


        {/* ================= Purchases Module ================= */}
        {/* Single purchase route with nested routes */}
        <Route
          path="purchases/*"
          element={
            <RequireRole allowedRoles={["MANAGER", "ADMIN","ACCOUNTANT"]}>
              <Purchases />
            </RequireRole>
          }
        >
          <Route index element={<PurchaseList />} />
          <Route path="new" element={<PurchaseForm />} />
          <Route path=":id" element={<PurchaseDetail />} />
          <Route path=":id/edit" element={<PurchaseForm isEdit={true} />} />

          
        </Route>
          {/* customer routes  */}
        <Route path="/customers" element={<CustomerList />} />
        <Route path="/customers/:id" element={<CustomerDetails />} />
        <Route path="/customers/:id/sales" element={<CustomerDetails />} />
        <Route path="/customers/:id/payments" element={<CustomerDetails />} />
        <Route path="/customers/:id/statement" element={<CustomerDetails />} />

        {/* ================= Admin ================= */}
        <Route
          path="pos-admin/branches"
          element={
            <RequireRole allowedRoles={["ADMIN"]}>
              <AdminBranches />
            </RequireRole>
          }
        />

        <Route
          path="pos-admin/products"
          element={
            <RequireRole allowedRoles={["ADMIN"]}>
              <AdminProducts />
            </RequireRole>
          }
        />

        <Route
          path="pos-admin/dashboard"
          element={
            <RequireAuth>
              <RequireRole allowedRoles={["ADMIN"]}>
                <AdminDashboard />
              </RequireRole>
            </RequireAuth>
          }
        />

        <Route
          path="pos-admin/sessions"
          element={
            <RequireAuth>
              <RequireRole allowedRoles={["ADMIN"]}>
                <AdminSessions />
              </RequireRole>
            </RequireAuth>
          }
        />

        <Route
          path="pos-admin/users"
          element={
            <RequireAuth>
              <RequireRole allowedRoles={["ADMIN"]}>
                <Users />
              </RequireRole>
            </RequireAuth>
          }
        />

        <Route
          path="pos-admin/branch/:branchId"
          element={
            <RequireRole allowedRoles={["ADMIN"]}>
              <AdminBranchDetail />
            </RequireRole>
          }
        />

        <Route
          path="pos-admin/products/add"
          element={<AdminAddProduct />}
        />
        <Route path="/adjustments/my" element={<MyAdjustmentRequests />} />
        <Route path="/adjustments/pending" element={<PendingAdjustments />} />

        <Route path="/suppliers" element={<SupplierList />} />

        <Route path="balance/sales/outstanding" element={<OutstandingSales />} />
        
        <Route path="balance/sales/:id" element={<SaleDetail />} />
        

        <Route
          path="pos-admin/reviews"
          element={
            <RequireAuth>
              <RequireRole allowedRoles={["ADMIN"]}>
                <Reviews />
              </RequireRole>
            </RequireAuth>
          }
          
        />


        {/* ================= Accountant ================= */}
        <Route
          path="accountant/dashboard"
          element={
            <RequireAuth>
              <RequireRole allowedRoles={["ACCOUNTANT"]}>
                <AccountantDashboard />
              </RequireRole>
            </RequireAuth>
          }
        />
        
        <Route
          path="accountant/sales"
          element={
            <RequireAuth>
              <RequireRole
                allowedRoles={["ACCOUNTANT", "ADMIN"]}
              >
                <AccountantSales />
              </RequireRole>
            </RequireAuth>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}