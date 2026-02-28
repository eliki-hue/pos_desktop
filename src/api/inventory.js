import { api } from "./client";

/* ===============================
   STOCK OPERATIONS
================================= */

export const stockIn = (data) => {
  return api.post("/api/inventory/stock-in/", data);
};

export const stockOut = (data) => {
  return api.post("/api/inventory/stock-out/", data);
};

export const adjustStock = (data) => {
  return api.post("/api/inventory/adjust-stock/", data);
};

/* ===============================
   INVENTORY FETCHING
================================= */

export const fetchBranchInventory = (branchId) => {
  return api.get("/api/inventory/", {
    params: { branch: branchId },
  });
};

/* ===============================
   REPORTS
================================= */

export const fetchStockMovements = (params) =>
  api.get("/api/reports/movements/", { params });

/* ===============================
   MASTER DATA
================================= */

export const fetchProducts = () => {
  return api.get("/api/products/");
};

export const fetchBranches = () => {
  return api.get("/api/branches/");
};