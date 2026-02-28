import { api } from "./client";

export const fetchOutgoingTransfers = () =>
  api.get("/api/transfers/outgoing/");

export const fetchIncomingTransfers = () =>
  api.get("/api/transfers/incoming/");

export const initiateTransfer = (payload) =>
  api.post("/api/transfers/initiate/", payload);

export const receiveTransfer = (transferId) =>
  api.post(`/api/transfers/${transferId}/receive/`);