import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';


export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true, //  important for cookies
});

// Add token to requests


export const purchaseAPI = {
  getList: (params) => api.get('/api/purchases/', { params }),
  getDetail: (id) => api.get(`/api/purchases/${id}/`),
  create: (data) => api.post('/api/purchases/', data),
  update: (id, data) => api.put(`/api/purchases/${id}/`, data),
  confirm: (id) => api.post(`/api/purchases/${id}/confirm/`),
  cancel: (id) => api.post(`/api/purchases/${id}/cancel/`),
  addPayment: (id, data) => api.post(`/api/purchases/${id}/add_payment/`, data),
  getSummary: (params) => api.get('/api/purchases/summary/', { params }),
  export: (params) => api.get('/api/purchases/export/', { params, responseType: 'blob' })
};

export const supplierAPI = {
  getList: (params) => api.get('/api/suppliers/', { params }),
  getDetail: (id) => api.get(`/api/suppliers/${id}/`),
};

export const productAPI = {
  getList: (params) => api.get('/products/', { params }),
};

export default api;