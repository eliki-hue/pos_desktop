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

  // Auto refresh if access expired
  api.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;

      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;

        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            queue.push({ resolve, reject });
          }).then(() => api(originalRequest));
        }

        isRefreshing = true;

        try {
          await api.post("/api/auth/refresh/");
          processQueue(null);
          return api(originalRequest);
        } catch (refreshError) {
          processQueue(refreshError);
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      }

      return Promise.reject(error);
    }
  );
}
