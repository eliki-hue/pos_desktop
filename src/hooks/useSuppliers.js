// src/hooks/useSuppliers.js
import { useState, useEffect, useCallback } from 'react';
import { supplierAPI } from '../services/api';

export const useSuppliers = (initialFilters = {}) => {
  const [suppliers, setSuppliers] = useState([]);
  const [currentSupplier, setCurrentSupplier] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    is_active: true,
    page: 1,
    page_size: 50,
    ...initialFilters
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    pageSize: 50
  });
  const [supplierStats, setSupplierStats] = useState(null);

  // Fetch all suppliers
  const fetchSuppliers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await supplierAPI.getList(filters);
      setSuppliers(response.data.results || response.data);
      
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
      setError(err.response?.data?.error || 'Failed to fetch suppliers');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Fetch single supplier by ID
  const fetchSupplierById = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      const response = await supplierAPI.getDetail(id);
      setCurrentSupplier(response.data);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch supplier details');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Create new supplier
  const createSupplier = useCallback(async (supplierData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await supplierAPI.create(supplierData);
      await fetchSuppliers();
      return response.data;
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create supplier');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchSuppliers]);

  // Update supplier
  const updateSupplier = useCallback(async (id, supplierData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await supplierAPI.update(id, supplierData);
      if (currentSupplier?.id === id) {
        setCurrentSupplier(response.data);
      }
      await fetchSuppliers();
      return response.data;
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update supplier');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [currentSupplier, fetchSuppliers]);

  // Get supplier purchase history
  const getSupplierPurchaseHistory = useCallback(async (supplierId, dateRange = {}) => {
    setLoading(true);
    setError(null);
    try {
      const response = await supplierAPI.getPurchaseHistory(supplierId, dateRange);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch purchase history');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get supplier payment summary
  const getSupplierPaymentSummary = useCallback(async (supplierId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await supplierAPI.getPaymentSummary(supplierId);
      setSupplierStats(response.data);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch payment summary');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get all suppliers with outstanding balances
  const getSuppliersWithOutstanding = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await supplierAPI.getOutstanding();
      return response.data;
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch outstanding suppliers');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Search suppliers by name, phone, or email
  const searchSuppliers = useCallback(async (searchTerm) => {
    if (!searchTerm || searchTerm.length < 2) {
      return [];
    }
    
    setLoading(true);
    try {
      const response = await supplierAPI.search(searchTerm);
      return response.data;
    } catch (err) {
      setError('Search failed');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Update filters
  const updateFilters = useCallback((newFilters) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters,
      page: newFilters.page || 1
    }));
  }, []);

  // Reset filters
  const resetFilters = useCallback(() => {
    setFilters({
      search: '',
      is_active: true,
      page: 1,
      page_size: 50
    });
  }, []);

  // Change page
  const changePage = useCallback((page) => {
    setFilters(prev => ({ ...prev, page }));
  }, []);

  // Toggle supplier active status
  const toggleSupplierStatus = useCallback(async (id, isActive) => {
    setLoading(true);
    try {
      const response = await supplierAPI.update(id, { is_active: isActive });
      await fetchSuppliers();
      return response.data;
    } catch (err) {
      setError('Failed to update supplier status');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchSuppliers]);

  // Get supplier balance
  const getSupplierBalance = useCallback((supplier) => {
    if (!supplier) return 0;
    return supplier.total_outstanding || 0;
  }, []);

  // Format supplier for dropdowns
  const formatSupplierForDropdown = useCallback((supplier) => ({
    value: supplier.id,
    label: supplier.name,
    phone: supplier.phone,
    email: supplier.email,
    outstanding: supplier.total_outstanding || 0
  }), []);

  // Auto-fetch suppliers on mount and when filters change
  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  return {
    // State
    suppliers,
    currentSupplier,
    loading,
    error,
    filters,
    pagination,
    supplierStats,
    
    // CRUD Operations
    fetchSuppliers,
    fetchSupplierById,
    createSupplier,
    updateSupplier,
    
    // Analytics
    getSupplierPurchaseHistory,
    getSupplierPaymentSummary,
    getSuppliersWithOutstanding,
    
    // Search & Filters
    searchSuppliers,
    updateFilters,
    resetFilters,
    changePage,
    
    // Utilities
    toggleSupplierStatus,
    getSupplierBalance,
    formatSupplierForDropdown,
    
    // Helper
    setError
  };
};

// Optional: Hook for supplier autocomplete
export const useSupplierAutocomplete = () => {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  
  const searchSuppliers = useCallback(async (query) => {
    if (!query || query.length < 2) {
      setSuggestions([]);
      return;
    }
    
    setLoading(true);
    try {
      const response = await supplierAPI.search(query);
      setSuggestions(response.data);
    } catch (error) {
      console.error('Search error:', error);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, []);
  
  const selectSupplier = useCallback((supplier) => {
    setSelectedSupplier(supplier);
    setSuggestions([]);
  }, []);
  
  const clearSelection = useCallback(() => {
    setSelectedSupplier(null);
    setSuggestions([]);
  }, []);
  
  return {
    suggestions,
    loading,
    selectedSupplier,
    searchSuppliers,
    selectSupplier,
    clearSelection
  };
};

// Hook for supplier payment reminders
export const useSupplierReminders = () => {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const fetchDueReminders = useCallback(async (daysThreshold = 7) => {
    setLoading(true);
    try {
      const response = await supplierAPI.getDueReminders(daysThreshold);
      setReminders(response.data);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch reminders:', error);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);
  
  const sendReminder = useCallback(async (supplierId, purchaseId) => {
    setLoading(true);
    try {
      const response = await supplierAPI.sendPaymentReminder(supplierId, purchaseId);
      return response.data;
    } catch (error) {
      console.error('Failed to send reminder:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);
  
  return {
    reminders,
    loading,
    fetchDueReminders,
    sendReminder
  };
};