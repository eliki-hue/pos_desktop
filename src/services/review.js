// src/services/reviewService.js
import api from './api';

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
  }
};

export default reviewAPI;