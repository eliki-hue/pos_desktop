// pages/OutstandingSales.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, RefreshCw, Search, Filter } from 'lucide-react';
import { api } from '../api/client';
import AppLayout from '../components/AppLayout';
import { formatCurrency, formatDate } from '../utils/formatters';
import { useAuth } from '../auth/AuthContext';

export default function OutstandingSales() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    customer: '',
    cashier: '',
    date_from: '',
    date_to: '',
    status: ''
  });
  const [cashiers, setCashiers] = useState([]);

  const userRole = user?.role?.toLowerCase();
  const isManager = userRole === 'manager';
  const isAdmin = userRole === 'admin';

  const loadSales = async () => {
    setLoading(true);
    try {
      let scope = 'me';
      if (isManager) scope = 'branch';
      if (isAdmin) scope = 'all';
      
      const params = { scope, ...filters };
      const res = await api.get('api/cart/sales/outstanding/', { params });
      setSales(res.data || []);
    } catch (err) {
      console.error('Failed to load sales', err);
    } finally {
      setLoading(false);
    }
  };

  const loadCashiers = async () => {
    if (isManager || isAdmin) {
      try {
        const res = await api.get('/api/auth/users/cashiers/');
        setCashiers(res.data || []);
      } catch (err) {
        console.error('Failed to load cashiers', err);
      }
    }
  };

  useEffect(() => {
    loadSales();
    loadCashiers();
  }, []);

  const applyFilters = () => {
    loadSales();
  };

  const clearFilters = () => {
    setFilters({
      customer: '',
      cashier: '',
      date_from: '',
      date_to: '',
      status: ''
    });
    setSearch('');
    setTimeout(() => loadSales(), 100);
  };

  const handleViewSale = (saleId) => {
    if (saleId) {
      navigate(`/balance/sales/${saleId}`);
    }
  };

  const filteredSales = sales.filter(sale => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      sale.customer_name?.toLowerCase().includes(s) ||
      sale.phone?.toLowerCase().includes(s) ||
      sale.id?.toString().includes(s)
    );
  });

  const totalOutstanding = filteredSales.reduce((sum, sale) => sum + (parseFloat(sale.balance) || 0), 0);

  return (
    <AppLayout title="Credit Sales" subtitle="Manage outstanding payments">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <strong style={{ fontSize: 20 }}>Credit Sales</strong>
          <div className="muted">Total Outstanding: {formatCurrency(totalOutstanding)}</div>
        </div>
        <button className="btn outline" onClick={loadSales} disabled={loading}>
          <RefreshCw size={16} style={{ marginRight: 8 }} />
          Refresh
        </button>
      </div>

      {/* Search and Filters */}
      <div className="card" style={{ marginBottom: 16, padding: 16 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
            <input
              type="text"
              className="input"
              placeholder="Search by customer, phone, or sale number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: 32 }}
            />
          </div>
          <button className="btn outline" onClick={() => setShowFilters(!showFilters)}>
            <Filter size={16} style={{ marginRight: 8 }} />
            Filters
          </button>
          <button className="btn btn-primary" onClick={applyFilters}>Apply</button>
        </div>

        {showFilters && (
          <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #e5e7eb' }}>
            <div className="grid-3" style={{ gap: 16 }}>
              <input
                type="text"
                className="input"
                placeholder="Customer name / phone"
                value={filters.customer}
                onChange={(e) => setFilters({ ...filters, customer: e.target.value })}
              />
              {(isManager || isAdmin) && (
                <select
                  className="input"
                  value={filters.cashier}
                  onChange={(e) => setFilters({ ...filters, cashier: e.target.value })}
                >
                  <option value="">All Cashiers</option>
                  {cashiers.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              )}
              <select
                className="input"
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              >
                <option value="">All Status</option>
                <option value="PARTIAL">Partial Payment</option>
                <option value="CREDIT">Credit</option>
              </select>
              <input
                type="date"
                className="input"
                placeholder="From Date"
                value={filters.date_from}
                onChange={(e) => setFilters({ ...filters, date_from: e.target.value })}
              />
              <input
                type="date"
                className="input"
                placeholder="To Date"
                value={filters.date_to}
                onChange={(e) => setFilters({ ...filters, date_to: e.target.value })}
              />
              <button className="btn outline" onClick={clearFilters}>Clear Filters</button>
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="card" style={{ overflowX: 'auto' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}>Loading...</div>
        ) : filteredSales.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <div style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              width: 80,
              height: 80,
              backgroundColor: '#f3f4f6',
              borderRadius: 16,
              marginBottom: 16
            }}>
              <span style={{ fontSize: 40 }}>💰</span>
            </div>
            <p style={{ color: '#6b7280', fontSize: 16, fontWeight: 500, marginBottom: 8 }}>No outstanding sales found</p>
            <p style={{ color: '#9ca3af', fontSize: 14 }}>All sales are fully paid</p>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Sale #</th>
                <th>Customer</th>
                <th>Id No.</th>
                <th>Phone</th>
                <th style={{ textAlign: 'right' }}>Total</th>
                <th style={{ textAlign: 'right' }}>Paid</th>
                <th style={{ textAlign: 'right' }}>Balance</th>
                <th>Status</th>
                {(isManager || isAdmin) && <th>Cashier</th>}
                <th>Date</th>
                <th style={{ textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredSales.map(sale => {
                const saleId = sale.id;
                const total = parseFloat(sale.total) || 0;
                const paid = parseFloat(sale.paid) || 0;
                const balance = parseFloat(sale.balance) || 0;
                const status = sale.status;
                
                return (
                  <tr key={saleId}>
                    <td style={{ fontWeight: 500 }}>{saleId}</td>
                    <td>{sale.customer_name || 'Walk-in'}</td>
                    <td>{sale.customer_id || '-'}</td>
                    <td>{sale.phone || '—'}</td>
                    <td style={{ textAlign: 'right' }}>{formatCurrency(total)}</td>
                    <td style={{ textAlign: 'right', color: '#10b981' }}>{formatCurrency(paid)}</td>
                    <td style={{ textAlign: 'right', fontWeight: 'bold', color: balance > 0 ? '#dc2626' : '#10b981' }}>
                      {formatCurrency(balance)}
                    </td>
                    <td>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '2px 8px',
                          borderRadius: 12,
                          fontSize: 11,
                          backgroundColor:
                            status === 'PAID'
                              ? '#d1fae5'
                              : status === 'PARTIAL'
                              ? '#fee2e2'
                              : '#fef3c7',
                          color:
                            status === 'PAID'
                              ? '#065f46'
                              : status === 'PARTIAL'
                              ? '#991b1b'
                              : '#92400e',
                        }}
                      >
                        {status}
                      </span>
                    </td>
                    {(isManager || isAdmin) && <td>{sale.cashier || '—'}</td>}
                    <td style={{ fontSize: 14, color: '#6b7280' }}>{formatDate(sale.date)}</td>
                    <td style={{ textAlign: 'center' }}>
                      <button 
                        className="btn outline" 
                        onClick={() => handleViewSale(saleId)} 
                        style={{ padding: '4px 12px', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                      >
                        <Eye size={14} />
                        {sale.status === 'PAID' ? 'View' : 'Pay'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot style={{ backgroundColor: '#f9fafb' }}>
              <tr>
                {/* Sale, Customer, ID */}
                <td colSpan={3}>
                  <strong>Total</strong>
                </td>

                {/* Phone */}
                <td></td>

                {/* Total */}
                <td style={{ textAlign: 'right' }}>
                  <strong>
                    {formatCurrency(
                      filteredSales.reduce(
                        (sum, s) => sum + (parseFloat(s.total) || 0),
                        0
                      )
                    )}
                  </strong>
                </td>

                {/* Paid */}
                <td style={{ textAlign: 'right' }}>
                  <strong>
                    {formatCurrency(
                      filteredSales.reduce(
                        (sum, s) => sum + (parseFloat(s.paid) || 0),
                        0
                      )
                    )}
                  </strong>
                </td>

                {/* Balance */}
                <td style={{ textAlign: 'right' }}>
                  <strong>{formatCurrency(totalOutstanding)}</strong>
                </td>

                {/* Remaining columns */}
                <td colSpan={(isManager || isAdmin) ? 4 : 3}></td>
              </tr>
            </tfoot>
          </table>
        )}
      </div>

      <style>
        {`
          .grid-3 {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 12px;
          }
          @media (max-width: 768px) {
            .grid-3 {
              grid-template-columns: 1fr;
            }
          }
        `}
      </style>
    </AppLayout>
  );
}