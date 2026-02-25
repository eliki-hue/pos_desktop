import axios from "axios";

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
axios.defaults.xsrfCookieName = "csrftoken";
axios.defaults.xsrfHeaderName = "X-CSRFToken";

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, 
  headers: {
    "Content-Type": "application/json",
    "X-Requested-With": "XMLHttpRequest",
  },
});
