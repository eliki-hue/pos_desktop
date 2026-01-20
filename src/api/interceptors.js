import { api } from "./axios";
import { getCookie } from "./csrf";

let isRefreshing = false;
let queue = [];

function processQueue(error) {
  queue.forEach((p) => (error ? p.reject(error) : p.resolve()));
  queue = [];
}

export function setupInterceptors() {
  // Attach CSRF token automatically
  api.interceptors.request.use((config) => {
    const csrfToken = getCookie("csrftoken");
    if (csrfToken) {
      config.headers["X-CSRFToken"] = csrfToken;
    }
    return config;
  });

  api.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;

      // if not 401, reject
      if (error.response?.status !== 401) {
        return Promise.reject(error);
      }

      // prevent infinite loops
      if (originalRequest._retry) {
        return Promise.reject(error);
      }

      // 🚫 DO NOT refresh if user has no refresh cookie (not logged in)
      const refreshCookie = getCookie("refresh_token");
      if (!refreshCookie) {
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          queue.push({ resolve, reject });
        }).then(() => api(originalRequest));
      }

      isRefreshing = true;

      try {
        // ✅ must match your backend route
        await api.post("/api/auth/pos/refresh/");
        processQueue(null);
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError);
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
  );
}
