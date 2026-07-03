import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/';


export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true, //  important for cookies
});

// Add token to requests
// src/services/api.js - Add payment methods


export const purchaseAPI = {
  getList: (params) => api.get('/api/purchases/', { params }),
  getDetail: (id) => api.get(`/api/purchases/${id}/`),
  create: (data) => api.post('/api/purchases/', data),
  update: (id, data) => api.put(`/api/purchases/${id}/`, data),
  confirm: (id) => api.post(`/api/purchases/${id}/confirm/`),
  cancel: (id) => api.post(`/api/purchases/${id}/cancel/`),
  delete: (id) => api.delete(`/api/purchases/${id}/`),
  addPayment: (id, data) => api.post(`/api/purchases/${id}/add_payment/`, data),
  getPaymentHistory: (id) => api.get(`/api/purchases/${id}/payment_history/`),
  getSummary: (params) => api.get('/api/purchases/summary/', { params }),
  export: (params) => api.get('/api/purchases/export/', { params, responseType: 'blob' })
};

// export const supplierAPI = {
//   getList: (params) => api.get('/api/suppliers/', { params }),
//   getDetail: (id) => api.get(`/api/suppliers/${id}/`),
// };

export const productAPI = {
  getList: (params) => api.get('/api/products/'),
};
export const purchaseProductAPI = {
  getList: (params) => api.get('/api/products/purchases/'),
};
export const branchAPI = {
  getList: () => api.get('/api/branches/'),
};

export const supplierAPI = {
  getList: (params = {}) => api.get('/api/suppliers/', { params }),
  getDetail: (id) => api.get(`/api/suppliers/${id}/`),
  create: (data) => api.post('/api/suppliers/', data),  
  update: (id, data) => api.put(`/api/suppliers/${id}/`, data),  
  delete: (id) => api.delete(`/api/suppliers/${id}/`),  
};


// Review API
export const reviewAPI = {
  // Get all reviews with filters
  getList: (params = {}) => {
    return api.get('/reviews/', { params });
  },

  // Get single review
  getDetail: (id) => {
    return api.get(`/reviews/${id}/`);
  },

  // Approve/Disapprove review
  toggleApprove: (id) => {
    return api.post(`/reviews/${id}/approve/`);
  },

  // Feature/Unfeature review
  toggleFeature: (id) => {
    return api.post(`/reviews/${id}/feature/`);
  },

  // Get review statistics
  getStats: () => {
    return api.get('/reviews/stats/');
  },

  // Delete review
  delete: (id) => {
    return api.delete(`/reviews/${id}/`);
  },

  // Bulk actions
  bulkApprove: (ids) => {
    return api.post('/reviews/bulk-approve/', { ids });
  },

  bulkDelete: (ids) => {
    return api.post('/reviews/bulk-delete/', { ids });
  },

  // Export reviews
  export: (params) => {
    return api.get('/reviews/export/', { params, responseType: 'blob' });
  }
};

export default api;