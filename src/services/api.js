import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const purchaseAPI = {
  getList: (params) => api.get('/purchases/', { params }),
  getDetail: (id) => api.get(`/purchases/${id}/`),
  create: (data) => api.post('/purchases/', data),
  update: (id, data) => api.put(`/purchases/${id}/`, data),
  confirm: (id) => api.post(`/purchases/${id}/confirm/`),
  cancel: (id) => api.post(`/purchases/${id}/cancel/`),
  addPayment: (id, data) => api.post(`/purchases/${id}/add_payment/`, data),
  getSummary: (params) => api.get('/purchases/summary/', { params }),
  export: (params) => api.get('/purchases/export/', { params, responseType: 'blob' })
};

export const supplierAPI = {
  getList: (params) => api.get('/suppliers/', { params }),
  getDetail: (id) => api.get(`/suppliers/${id}/`),
};

export const productAPI = {
  getList: (params) => api.get('/products/', { params }),
};

export default api;