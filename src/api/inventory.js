import { api } from "./client";

export const stockIn = (data) => {
  return api.post("/api/inventory/stock-in/", data);
};
export const stockOut = (data) => {
  return api.post("/api/inventory/stock-out/", data);
};
export const adjustStock = (data) => {
  return api.post("/api/inventory/adjust-stock/", data);
};