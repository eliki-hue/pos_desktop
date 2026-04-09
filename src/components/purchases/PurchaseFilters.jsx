// src/components/purchases/PurchaseFilters.jsx
import React, { useState, useEffect } from 'react';
import { Filter, X, Download, Search, Calendar, ChevronDown } from 'lucide-react';
import { api } from '../../api/client';

const PurchaseFilters = ({ filters, onFilterChange, onExport }) => {
  const [localFilters, setLocalFilters] = useState(filters);
  const [showFilters, setShowFilters] = useState(false);
  const [branches, setBranches] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchFiltersData();
  }, []);

  const fetchFiltersData = async () => {
    setLoading(true);
    try {
      const [branchesRes, suppliersRes] = await Promise.all([
        api.get('/api/branches/'),
        api.get('/api/suppliers/')
      ]);
      setBranches(branchesRes.data || []);
      setSuppliers(suppliersRes.data || []);
    } catch (error) {
      console.error('Failed to fetch filter data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    const newFilters = { ...localFilters, [key]: value, page: 1 };
    setLocalFilters(newFilters);
  };

  const handleApplyFilters = () => {
    onFilterChange(localFilters);
  };

  const handleReset = () => {
    const resetFilters = {
      status: '',
      branch: '',
      supplier: '',
      date_from: '',
      date_to: '',
      search: ''
    };
    setLocalFilters(resetFilters);
    onFilterChange(resetFilters);
  };

  const hasActiveFilters = () => {
    return Object.entries(localFilters).some(([key, value]) => value && value !== '');
  };

  const activeFilterCount = () => {
    return Object.entries(localFilters).filter(([key, value]) => value && value !== '').length;
  };

  const statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'DRAFT', label: 'Draft' },
    { value: 'CONFIRMED', label: 'Confirmed' },
    { value: 'PARTIALLY_PAID', label: 'Partially Paid' },
    { value: 'PAID', label: 'Paid' },
    { value: 'CANCELLED', label: 'Cancelled' }
  ];

  // Get display value for filter chips
  const getStatusLabel = (value) => {
    return statusOptions.find(o => o.value === value)?.label || value;
  };

  const getBranchName = (id) => {
    return branches.find(b => b.id === parseInt(id))?.name || id;
  };

  const getSupplierName = (id) => {
    return suppliers.find(s => s.id === parseInt(id))?.name || id;
  };

  return (
    <div className="card" style={{ marginBottom: 24 }}>
      <div style={{ padding: 20 }}>
        {/* Main Search Bar */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
            <Search style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 18, height: 18, color: '#9ca3af' }} />
            <input
              type="text"
              placeholder="Search by purchase number or supplier..."
              value={localFilters.search || ''}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleApplyFilters()}
              style={{
                width: '100%',
                padding: '10px 12px 10px 40px',
                border: '1px solid #e5e7eb',
                borderRadius: 8,
                fontSize: 14,
                outline: 'none',
              }}
              onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
            />
          </div>
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`btn ${showFilters || hasActiveFilters() ? '' : 'outline'}`}
            style={{ display: 'flex', alignItems: 'center', gap: 8 }}
          >
            <Filter style={{ width: 16, height: 16 }} />
            Filters
            {hasActiveFilters() && (
              <span style={{ 
                marginLeft: 4, 
                padding: '2px 6px', 
                backgroundColor: '#3b82f6', 
                color: 'white', 
                borderRadius: 12, 
                fontSize: 10 
              }}>
                {activeFilterCount()}
              </span>
            )}
            <ChevronDown style={{ width: 14, height: 14, transform: showFilters ? 'rotate(180deg)' : 'none' }} />
          </button>
          
          <button
            onClick={onExport}
            className="btn outline"
            style={{ display: 'flex', alignItems: 'center', gap: 8 }}
          >
            <Download style={{ width: 16, height: 16 }} />
            Export
          </button>
          
          <button
            onClick={handleApplyFilters}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: 8 }}
          >
            <Search style={{ width: 16, height: 16 }} />
            Search
          </button>
        </div>

        {/* Advanced Filters Panel */}
        {showFilters && (
          <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid #e5e7eb' }}>
            <div className="grid-4" style={{ gap: 16 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500, color: '#374151' }}>
                  Status
                </label>
                <select
                  value={localFilters.status || ''}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="input"
                  style={{ width: '100%' }}
                  disabled={loading}
                >
                  {statusOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500, color: '#374151' }}>
                  Branch
                </label>
                <select
                  value={localFilters.branch || ''}
                  onChange={(e) => handleFilterChange('branch', e.target.value)}
                  className="input"
                  style={{ width: '100%' }}
                  disabled={loading}
                >
                  <option value="">All Branches</option>
                  {branches.map(branch => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500, color: '#374151' }}>
                  Supplier
                </label>
                <select
                  value={localFilters.supplier || ''}
                  onChange={(e) => handleFilterChange('supplier', e.target.value)}
                  className="input"
                  style={{ width: '100%' }}
                  disabled={loading}
                >
                  <option value="">All Suppliers</option>
                  {suppliers.map(supplier => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500, color: '#374151' }}>
                  Date From
                </label>
                <div style={{ position: 'relative' }}>
                  <Calendar style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, color: '#9ca3af' }} />
                  <input
                    type="date"
                    value={localFilters.date_from || ''}
                    onChange={(e) => handleFilterChange('date_from', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px 8px 36px',
                      border: '1px solid #e5e7eb',
                      borderRadius: 6,
                      fontSize: 14,
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500, color: '#374151' }}>
                  Date To
                </label>
                <div style={{ position: 'relative' }}>
                  <Calendar style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, color: '#9ca3af' }} />
                  <input
                    type="date"
                    value={localFilters.date_to || ''}
                    onChange={(e) => handleFilterChange('date_to', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px 8px 36px',
                      border: '1px solid #e5e7eb',
                      borderRadius: 6,
                      fontSize: 14,
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12 }}>
                <button
                  onClick={handleReset}
                  className="btn outline"
                  style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <X style={{ width: 14, height: 14 }} />
                  Reset
                </button>
                <button
                  onClick={handleApplyFilters}
                  className="btn btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <Search style={{ width: 14, height: 14 }} />
                  Apply
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Active Filters Display */}
        {hasActiveFilters() && (
          <div style={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: 8, 
            marginTop: 16,
            paddingTop: 12,
            borderTop: '1px solid #e5e7eb'
          }}>
            <span style={{ fontSize: 13, color: '#6b7280' }}>Active filters:</span>
            {localFilters.status && (
              <FilterChip 
                label={`Status: ${getStatusLabel(localFilters.status)}`}
                onRemove={() => handleFilterChange('status', '')}
              />
            )}
            {localFilters.branch && (
              <FilterChip 
                label={`Branch: ${getBranchName(localFilters.branch)}`}
                onRemove={() => handleFilterChange('branch', '')}
              />
            )}
            {localFilters.supplier && (
              <FilterChip 
                label={`Supplier: ${getSupplierName(localFilters.supplier)}`}
                onRemove={() => handleFilterChange('supplier', '')}
              />
            )}
            {localFilters.date_from && (
              <FilterChip 
                label={`From: ${localFilters.date_from}`}
                onRemove={() => handleFilterChange('date_from', '')}
              />
            )}
            {localFilters.date_to && (
              <FilterChip 
                label={`To: ${localFilters.date_to}`}
                onRemove={() => handleFilterChange('date_to', '')}
              />
            )}
            {localFilters.search && (
              <FilterChip 
                label={`Search: ${localFilters.search}`}
                onRemove={() => handleFilterChange('search', '')}
              />
            )}
            <button
              onClick={handleReset}
              style={{ fontSize: 12, color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      <style>
        {`
          .grid-4 {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 16px;
          }
          @media (max-width: 1024px) {
            .grid-4 {
              grid-template-columns: repeat(2, 1fr);
            }
          }
          @media (max-width: 640px) {
            .grid-4 {
              grid-template-columns: 1fr;
            }
          }
        `}
      </style>
    </div>
  );
};

// Helper component for filter chips
const FilterChip = ({ label, onRemove }) => {
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      padding: '4px 10px',
      fontSize: 12,
      backgroundColor: '#dbeafe',
      color: '#1e40af',
      borderRadius: 20,
    }}>
      {label}
      <button
        onClick={onRemove}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontSize: 14,
          color: '#1e40af',
          display: 'flex',
          alignItems: 'center',
          padding: 0
        }}
      >
        ✕
      </button>
    </span>
  );
};

export default PurchaseFilters;