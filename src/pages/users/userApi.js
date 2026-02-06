import { api } from "../../api/client";

export const userApi = {
  list: () => api.get("/api/users/"),
  create: (data) => api.post("/api/users/", data),
  update: (id, data) => api.patch(`/api/users/${id}/`, data),
  deactivate: (id) => api.post(`/api/users/${id}/deactivate/`),
};
