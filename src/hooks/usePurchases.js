// src/hooks/usePurchases.js
import { useState, useEffect, useCallback } from 'react';
import { purchaseAPI } from '../services/api';
import { useAuth } from './useAuth'; // Assuming you have an auth hook

export const usePurchases = (initialFilters = {}) => {
  const [purchases, setPurchases] = useState([]);
  const [currentPurchase, setCurrentPurchase] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
    branch: '',
    supplier: '',
    date_from: '',
    date_to: '',
    search: '',
    page: 1,
    page_size: 20,
    ...initialFilters
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    pageSize: 20
  });
  const [summary, setSummary] = useState(null);

  // Fetch all purchases with current filters
  const fetchPurchases = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await purchaseAPI.getList(filters);
      setPurchases(response.data.results || response.data);
      
      // Update pagination info
      if (response.data.count) {
        setPagination({
          currentPage: filters.page,
          totalPages: Math.ceil(response.data.count / filters.page_size),
          totalItems: response.data.count,
          pageSize: filters.page_size
        });
      }
      return response.data;
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch purchases');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Fetch single purchase by ID
  const fetchPurchaseById = useCallback(async (id, includeDetails = true) => {
    setLoading(true);
    setError(null);
    try {
      const response = await purchaseAPI.getDetail(id);
      setCurrentPurchase(response.data);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch purchase details');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Create new purchase
  const createPurchase = useCallback(async (purchaseData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await purchaseAPI.create(purchaseData);
      // Refresh the list after creation
      await fetchPurchases();
      return response.data;
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create purchase');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchPurchases]);

  // Update existing purchase
  const updatePurchase = useCallback(async (id, purchaseData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await purchaseAPI.update(id, purchaseData);
      // Update current purchase if it's the same one
      if (currentPurchase?.id === id) {
        setCurrentPurchase(response.data);
      }
      await fetchPurchases();
      return response.data;
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update purchase');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [currentPurchase, fetchPurchases]);

  // Confirm purchase (move from DRAFT to CONFIRMED)
  const confirmPurchase = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      const response = await purchaseAPI.confirm(id);
      // Update current purchase
      if (currentPurchase?.id === id) {
        setCurrentPurchase(response.data);
      }
      await fetchPurchases();
      return response.data;
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to confirm purchase');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [currentPurchase, fetchPurchases]);

  // Cancel purchase
  const cancelPurchase = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      const response = await purchaseAPI.cancel(id);
      // Update current purchase
      if (currentPurchase?.id === id) {
        setCurrentPurchase(response.data);
      }
      await fetchPurchases();
      return response.data;
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to cancel purchase');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [currentPurchase, fetchPurchases]);

  // Add payment to purchase
  const addPayment = useCallback(async (id, paymentData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await purchaseAPI.addPayment(id, paymentData);
      // Update current purchase with new payment info
      if (currentPurchase?.id === id) {
        const updatedPurchase = await purchaseAPI.getDetail(id);
        setCurrentPurchase(updatedPurchase.data);
      }
      await fetchPurchases();
      await fetchSummary(); // Refresh summary after payment
      return response.data;
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add payment');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [currentPurchase, fetchPurchases, fetchSummary]);

  // Fetch summary statistics
  const fetchSummary = useCallback(async (summaryFilters = {}) => {
    try {
      const response = await purchaseAPI.getSummary(summaryFilters);
      setSummary(response.data);
      return response.data;
    } catch (err) {
      console.error('Failed to fetch summary:', err);
      setError(err.response?.data?.error || 'Failed to fetch summary');
      throw err;
    }
  }, []);

  // Export purchases to CSV
  const exportPurchases = useCallback(async (exportFilters = {}) => {
    setLoading(true);
    setError(null);
    try {
      const response = await purchaseAPI.export({ ...filters, ...exportFilters });
      return response.data;
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to export purchases');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Update filters
  const updateFilters = useCallback((newFilters) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters,
      page: newFilters.page || 1 // Reset to page 1 when filters change
    }));
  }, []);

  // Reset all filters
  const resetFilters = useCallback(() => {
    setFilters({
      status: '',
      branch: '',
      supplier: '',
      date_from: '',
      date_to: '',
      search: '',
      page: 1,
      page_size: 20
    });
  }, []);

  // Change page
  const changePage = useCallback((page) => {
    setFilters(prev => ({ ...prev, page }));
  }, []);

  // Change page size
  const changePageSize = useCallback((pageSize) => {
    setFilters(prev => ({ ...prev, page_size: pageSize, page: 1 }));
  }, []);

  // Clear current purchase
  const clearCurrentPurchase = useCallback(() => {
    setCurrentPurchase(null);
  }, []);

  // Auto-fetch purchases when filters change
  useEffect(() => {
    fetchPurchases();
  }, [fetchPurchases]);

  // Auto-fetch summary on mount
  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  return {
    // State
    purchases,
    currentPurchase,
    loading,
    error,
    filters,
    pagination,
    summary,
    
    // CRUD Operations
    fetchPurchases,
    fetchPurchaseById,
    createPurchase,
    updatePurchase,
    confirmPurchase,
    cancelPurchase,
    addPayment,
    
    // Utility Operations
    fetchSummary,
    exportPurchases,
    clearCurrentPurchase,
    
    // Filter Management
    updateFilters,
    resetFilters,
    changePage,
    changePageSize,
    
    // Helper methods
    setError
  };
};

// Optional: Hook for real-time updates
export const usePurchaseRealtime = (purchaseId) => {
  const [lastUpdate, setLastUpdate] = useState(null);
  const [isPolling, setIsPolling] = useState(false);

  const startPolling = useCallback((interval = 30000) => {
    setIsPolling(true);
    const intervalId = setInterval(async () => {
      try {
        const response = await purchaseAPI.getDetail(purchaseId);
        setLastUpdate(new Date());
        return response.data;
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, interval);
    
    return () => {
      clearInterval(intervalId);
      setIsPolling(false);
    };
  }, [purchaseId]);

  return {
    lastUpdate,
    isPolling,
    startPolling
  };
};