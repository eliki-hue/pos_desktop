// ============================================================
// FILE: customerModule.tsx
// ============================================================
// Customer Accounts Receivable module – plain CSS/classes

import React, { useState, CSSProperties, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

import AppLayout from "./components/AppLayout";


import { format, parseISO } from 'date-fns';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  LayoutDashboard, Package, ShoppingCart, Receipt, Printer,
  CreditCard, ClipboardList, BarChart3, ShoppingBag, PackageOpen,
  Truck, Activity, CheckCircle, Building2, GitBranch, Users,
  User, Clock, MessagesSquare, Eye, ArrowLeft, RefreshCw, Download,
   X, Check, AlertCircle, Phone, Badge, Calendar, Store,
  UserPlus, FileText, DollarSign, Search, Filter, Trash2, Edit,
} from 'lucide-react';
import { useAuth } from './auth/AuthContext'; 

// ============================================================
// TYPES – exact match to backend
// ============================================================
export interface Customer {
  id: number;
  name: string;
  phone: string;
  national_id: string;
  sales_count: number;
  total_purchases: string;
  total_paid: string;
  outstanding_balance: string;
  last_purchase: string | null;
}

export interface CustomerSale {
  id: number;
  created_at: string;
  branch: string;
  cashier: string;
  subtotal: string;
  discount: string;
  tax: string;
  total: string;
  amount_paid: string;
  balance_due: string;
  status: string;
}

export interface PaymentAllocation {
  id: number;
  sale_id: number;
  sale_total: string;
  sale_balance: string;
  sale_created_at: string;
  amount: string;
  status: string;
  created_at: string;
}

export interface CustomerPayment {
  id: number;
  uuid: string;
  receipt_number: string;
  customer: number;
  customer_name: string;
  branch: number;
  branch_name: string;
  received_by: string;
  method: string;
  amount: string;
  reference: string | null;
  notes: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  allocations: PaymentAllocation[];
}

export interface CustomerPaymentSummary {
  id: number;
  receipt_number: string;
  method: string;
  amount: string;
  reference: string | null;
  created_at: string;
}

export interface StatementEntry {
  date: string;
  type: string;
  reference: string;
  branch: string;
  cashier: string | null;
  payment_method: string | null;
  credit_sale: string;
  payment: string;
  running_balance: string;
}

// ============================================================
// API SERVICE
// ============================================================
const API_BASE = '/api';

export const customerApi = {
  getCustomers: (params: any) =>
    axios.get(`${API_BASE}/customers/`, { params }),
  getCustomer: (id: number) =>
    axios.get(`${API_BASE}/customers/${id}/`),
  getCustomerSales: (id: number, params: any) =>
    axios.get(`${API_BASE}/customers/${id}/sales/`, { params }),
  getCustomerPayments: (id: number, params: any) =>
    axios.get(`${API_BASE}/customers/${id}/payments/`, { params }),
  getPayment: (id: number) =>
    axios.get(`${API_BASE}/customer-payments/${id}/`),
  createPayment: (data: any) =>
    axios.post(`${API_BASE}/customer-payments/`, data),
  reversePayment: (id: number, data: any) =>
    axios.post(`${API_BASE}/customer-payments/${id}/reverse/`, data),
  getStatement: (id: number, params: any) =>
    axios.get(`${API_BASE}/customers/${id}/statement/`, { params }),
};



// ============================================================
// REACT QUERY HOOKS
// ============================================================
export const useCustomers = (params: any) =>
  useQuery({
    queryKey: ['customers', params],
    queryFn: () => customerApi.getCustomers(params).then(r => r.data),
    placeholderData: (prev: any) => prev,
  });

export const useCustomer = (id: number) =>
  useQuery({
    queryKey: ['customer', id],
    queryFn: () => customerApi.getCustomer(id).then(r => r.data),
    enabled: !!id,
  });

export const useCustomerSales = (id: number, params: any) =>
  useQuery({
    queryKey: ['customer-sales', id, params],
    queryFn: () => customerApi.getCustomerSales(id, params).then(r => r.data),
    enabled: !!id,
    placeholderData: (prev: any) => prev,
  });

export const useCustomerPayments = (id: number, params: any) =>
  useQuery({
    queryKey: ['customer-payments', id, params],
    queryFn: () => customerApi.getCustomerPayments(id, params).then(r => r.data),
    enabled: !!id,
    placeholderData: (prev: any) => prev,
  });

export const useCustomerPayment = (id: number) =>
  useQuery({
    queryKey: ['customer-payment', id],
    queryFn: () => customerApi.getPayment(id).then(r => r.data),
    enabled: !!id,
  });

export const useStatement = (id: number, params: any) =>
  useQuery({
    queryKey: ['customer-statement', id, params],
    queryFn: () => customerApi.getStatement(id, params).then(r => r.data),
    enabled: !!id,
  });

// ============================================================
// MUTATIONS
// ============================================================
export const useCreatePayment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => customerApi.createPayment(data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['customer', vars.customer] });
      qc.invalidateQueries({ queryKey: ['customer-payments', vars.customer] });
      qc.invalidateQueries({ queryKey: ['customer-statement', vars.customer] });
      qc.invalidateQueries({ queryKey: ['customers'] });
    },
  });
};

export const useReversePayment = (paymentId: number) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => customerApi.reversePayment(paymentId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['customer-payment', paymentId] });
      qc.invalidateQueries({ queryKey: ['customer-payments'] });
      qc.invalidateQueries({ queryKey: ['customer-statement'] });
      qc.invalidateQueries({ queryKey: ['customer'] });
      qc.invalidateQueries({ queryKey: ['customers'] });
    },
  });
};

// ============================================================
// REUSABLE STYLES
// ============================================================
const styles = {
  card: { background: 'white', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', padding: 20 },
  table: { width: '100%', borderCollapse: 'collapse' } as CSSProperties,
  th: { textAlign: 'left', padding: '8px 12px', borderBottom: '1px solid #e5e7eb', fontWeight: 600, fontSize: 12, color: '#6b7280', textTransform: 'uppercase' } as CSSProperties,
  td: { padding: '8px 12px', borderBottom: '1px solid #f3f4f6', fontSize: 13 },
  btn: { padding: '6px 12px', borderRadius: 6, fontSize: 12, fontWeight: 500, cursor: 'pointer', border: '1px solid transparent', transition: 'all 0.2s' },
  btnPrimary: { background: '#3b82f6', color: 'white', border: 'none' },
  btnOutline: { background: 'transparent', color: '#6b7280', border: '1px solid #e5e7eb' },
  btnSuccess: { background: '#10b981', color: 'white', border: 'none' },
  btnDanger: { background: '#ef4444', color: 'white', border: 'none' },
  input: { padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: 6, fontSize: 13, outline: 'none', width: '100%' },
  select: { padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: 6, fontSize: 13, outline: 'none', width: '100%', background: 'white' },
  label: { display: 'block', marginBottom: 4, fontSize: 12, fontWeight: 500, color: '#374151' },
  muted: { color: '#6b7280', fontSize: 12 },
  flexBetween: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  flexCenter: { display: 'flex', alignItems: 'center', gap: 6 },
  chip: (bg: string, color: string) => ({ display: 'inline-block', padding: '2px 10px', borderRadius: 12, fontSize: 11, fontWeight: 500, backgroundColor: bg, color }),
  grid: (cols: number) => ({ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 16 }),
};

// ============================================================
// REUSABLE COMPONENTS
// ============================================================

const OutstandingBalanceChip: React.FC<{ balance: string }> = ({ balance }) => {
  const num = parseFloat(balance);
  if (num === 0) return <span style={styles.chip('#d1fae5', '#065f46')}>Settled</span>;
  if (num > 0) return <span style={styles.chip('#fee2e2', '#991b1b')}>KES {num.toFixed(2)}</span>;
  return <span style={styles.chip('#dbeafe', '#1e40af')}>Credit</span>;
};

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const map: any = {
    PAID: { bg: '#d1fae5', color: '#065f46', label: 'PAID' },
    PARTIAL: { bg: '#fef3c7', color: '#92400e', label: 'PARTIAL' },
    CREDIT: { bg: '#fee2e2', color: '#991b1b', label: 'CREDIT' },
    CANCELLED: { bg: '#f3f4f6', color: '#374151', label: 'CANCELLED' },
    COMPLETED: { bg: '#d1fae5', color: '#065f46', label: 'COMPLETED' },
    REVERSED: { bg: '#fef3c7', color: '#92400e', label: 'REVERSED' },
  };
  const s = map[status] || { bg: '#f3f4f6', color: '#374151', label: status };
  return <span style={styles.chip(s.bg, s.color)}>{s.label}</span>;
};

// ============================================================
// CUSTOMER LIST
// ============================================================
export const CustomerList: React.FC = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [filters, setFilters] = useState<any>({});
  const [ordering, setOrdering] = useState('name');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [branchFilter, setBranchFilter] = useState('');
  const [hasBalance, setHasBalance] = useState(false);
  const [minBalance, setMinBalance] = useState('');
  const [maxBalance, setMaxBalance] = useState('');

  const params = {
    page: page + 1,
    page_size: pageSize,
    search: debouncedSearch.length >= 2 ? debouncedSearch : undefined,
    branch: branchFilter || undefined,
    has_balance: hasBalance || undefined,
    min_balance: minBalance ? Number(minBalance) : undefined,
    max_balance: maxBalance ? Number(maxBalance) : undefined,
    ordering,
  };
  const { data, isLoading, error } = useCustomers(params);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(0); // reset page on new search
    }, 300); //  300ms delay

    return () => clearTimeout(timer);
  }, [search]);

  const handleSort = (field: string) => {
    const allowed = ['name', 'sales_count', 'total_purchases', 'total_paid', 'outstanding_balance', 'last_purchase'];
    if (!allowed.includes(field)) return;
    if (ordering === field) setOrdering(`-${field}`);
    else if (ordering === `-${field}`) setOrdering('name');
    else setOrdering(field);
  };

  const applyFilters = () => { setPage(0); };
  const clearFilters = () => {
    setSearch('');
    setBranchFilter('');
    setHasBalance(false);
    setMinBalance('');
    setMaxBalance('');
    setPage(0);
  };

  if (isLoading && !data) return <div style={{ padding: 40, textAlign: 'center' }}>Loading...</div>;
  if (error) return <div className="card" style={{ color: '#dc2626' }}>Failed to load customers</div>;

  const customers = data?.results || [];
  const total = data?.count || 0;

  return (
    <AppLayout title="Customers">
    <div style={{ padding: 20 }}>
      <div style={styles.flexBetween}>
        <h2>Customers</h2>
        <div style={styles.flexCenter}>
          <button className="btn outline" onClick={() => window.location.reload()}>
            <RefreshCw size={16} style={{ marginRight: 4 }} /> Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: 20, padding: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px,1fr))', gap: 12 }}>
          <div>
            <label style={styles.label}>Search</label>
            <input
              type="text"
              placeholder="Name, phone, ID"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={styles.input}
            />
          </div>
          <div>
            <label style={styles.label}>Branch</label>
            <select value={branchFilter} onChange={e => setBranchFilter(e.target.value)} style={styles.select}>
              <option value="">All</option>
              {/* Branches will be fetched separately; for now empty */}
            </select>
          </div>
          <div>
            <label style={styles.label}>Min Balance</label>
            <input type="number" value={minBalance} onChange={e => setMinBalance(e.target.value)} style={styles.input} />
          </div>
          <div>
            <label style={styles.label}>Max Balance</label>
            <input type="number" value={maxBalance} onChange={e => setMaxBalance(e.target.value)} style={styles.input} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <label style={{ ...styles.label, marginRight: 8 }}>Has Balance</label>
            <input type="checkbox" checked={hasBalance} onChange={e => setHasBalance(e.target.checked)} />
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'end' }}>
            <button className="btn btn-primary" onClick={applyFilters}>Apply</button>
            <button className="btn outline" onClick={clearFilters}>Clear</button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ overflowX: 'auto' }}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th} onClick={() => handleSort('name')}>Name</th>
              <th style={styles.th}>Phone</th>
              <th style={styles.th}>National ID</th>
              <th style={styles.th} onClick={() => handleSort('sales_count')}>Sales</th>
              <th style={styles.th} onClick={() => handleSort('total_purchases')}>Total Purchases</th>
              <th style={styles.th} onClick={() => handleSort('total_paid')}>Total Paid</th>
              <th style={styles.th} onClick={() => handleSort('outstanding_balance')}>Outstanding</th>
              <th style={styles.th} onClick={() => handleSort('last_purchase')}>Last Purchase</th>
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((c: Customer) => (
              <tr key={c.id} onClick={() => navigate(`/customers/${c.id}`)} style={{ cursor: 'pointer' }}>
                <td style={styles.td}>{c.name}</td>
                <td style={styles.td}>{c.phone}</td>
                <td style={styles.td}>{c.national_id}</td>
                <td style={styles.td}>{c.sales_count}</td>
                <td style={styles.td}>{parseFloat(c.total_purchases).toFixed(2)}</td>
                <td style={styles.td}>{parseFloat(c.total_paid).toFixed(2)}</td>
                <td style={styles.td}><OutstandingBalanceChip balance={c.outstanding_balance} /></td>
                <td style={styles.td}>{c.last_purchase ? format(parseISO(c.last_purchase), 'dd/MM/yyyy') : '-'}</td>
                <td style={styles.td}>
                  <button className="btn outline" style={{ padding: '4px 8px' }} onClick={(e) => { e.stopPropagation(); navigate(`/customers/${c.id}`); }}>
                    <Eye size={14} />
                  </button>
                </td>
              </tr>
            ))}
            {customers.length === 0 && <tr><td colSpan={9} style={{ padding: 20, textAlign: 'center' }}>No customers found</td></tr>}
          </tbody>
        </table>
        <div style={styles.flexBetween}>
          <div style={styles.muted}>Showing {customers.length} of {total}</div>
          <div style={styles.flexCenter}>
            <button className="btn outline" disabled={page === 0} onClick={() => setPage(page - 1)}>Previous</button>
            <span style={{ margin: '0 8px' }}>Page {page + 1}</span>
            <button className="btn outline" disabled={customers.length < pageSize} onClick={() => setPage(page + 1)}>Next</button>
          </div>
        </div>
      </div>
    </div>
    </AppLayout>
  );
};

// ============================================================
// CUSTOMER DETAILS (similar structure, will be large – provide only skeleton)
// ============================================================
export const CustomerDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const customerId = parseInt(id || '0');
  const navigate = useNavigate();
  const [tab, setTab] = useState(0);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);

  const { data, isLoading, error } = useCustomer(customerId);
  // For branch, get from user context
  const { user } = useAuth() as any; 
  
  if (isLoading) return <div style={{ padding: 40, textAlign: 'center' }}>Loading...</div>;
  if (error || !data) return <div className="card" style={{ color: '#dc2626' }}>Customer not found</div>;

  const customer = data

  const tabs = ['Overview', 'Sales', 'Payments', 'Statement'];

  return (
    <AppLayout title="Customer Details">
    <div style={{ padding: 20 }}>
      <div style={styles.flexBetween}>
        <div style={styles.flexCenter}>
          <button className="btn outline" onClick={() => navigate('/customers')}><ArrowLeft size={16} /> Back</button>
          <h2 style={{ marginLeft: 12 }}>{customer.name}</h2>
          <OutstandingBalanceChip balance={customer.outstanding_balance} />
        </div>
        <button className="btn btn-primary" onClick={() => setPaymentDialogOpen(true)}>
          <Receipt size={16} /> Receive Payment
        </button>
      </div>

      {/* Customer Header */}
      <div className="card" style={{ marginBottom: 16, padding: 16 }}>
        <div style={styles.flexBetween}>
          <div>
            <div><Phone size={14} /> {customer.phone}</div>
            <div><Badge size={14} /> {customer.national_id}</div>
            <div><Calendar size={14} /> Last purchase: {customer.last_purchase ? format(parseISO(customer.last_purchase), 'dd/MM/yyyy') : 'Never'}</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 20 }}>
            <div><div style={styles.muted}>Sales Count</div><div>{customer.sales_count}</div></div>
            <div><div style={styles.muted}>Total Purchases</div><div>{parseFloat(customer.total_purchases).toFixed(2)}</div></div>
            <div><div style={styles.muted}>Total Paid</div><div>{parseFloat(customer.total_paid).toFixed(2)}</div></div>
            <div><div style={styles.muted}>Outstanding</div><div style={{ color: parseFloat(customer.outstanding_balance) > 0 ? '#dc2626' : '#10b981' }}>{parseFloat(customer.outstanding_balance).toFixed(2)}</div></div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ borderBottom: '1px solid #e5e7eb', marginBottom: 16 }}>
        {tabs.map((label, i) => (
          <button key={i} onClick={() => setTab(i)} style={{
            padding: '10px 16px',
            border: 'none',
            background: 'transparent',
            fontWeight: tab === i ? 600 : 400,
            color: tab === i ? '#3b82f6' : '#6b7280',
            borderBottom: tab === i ? '2px solid #3b82f6' : '2px solid transparent',
            cursor: 'pointer',
          }}>{label}</button>
        ))}
      </div>

      {/* Tab Content */}
      <div>
        {tab === 0 && <OverviewTab customer={customer} />}
        {tab === 1 && <CustomerSales customerId={customerId} />}
        {tab === 2 && <CustomerPayments customerId={customerId} />}
        {tab === 3 && <CustomerStatement customerId={customerId} />}
      </div>

      {/* Receive Payment Dialog */}
      <ReceivePaymentDialog
        open={paymentDialogOpen}
        onClose={() => setPaymentDialogOpen(false)}
        customerId={customerId}
        customerName={customer.name}
        // branchId={branchId}
      />
    </div>
    </AppLayout>
  );
};

// ============================================================
// OVERVIEW TAB
// ============================================================
const OverviewTab: React.FC<{ customer: any }> = ({ customer }) => (
  <div style={styles.grid(2)}>
    <div className="card">
      <h4>Customer Information</h4>
      <div><strong>Name:</strong> {customer.name}</div>
      <div><strong>Phone:</strong> {customer.phone}</div>
      <div><strong>National ID:</strong> {customer.national_id}</div>
      <div><strong>Last Purchase:</strong> {customer.last_purchase ? format(parseISO(customer.last_purchase), 'dd/MM/yyyy HH:mm') : 'Never'}</div>
    </div>
    <div className="card">
      <h4>Recent Sales</h4>
      {(customer.recent_sales || []).slice(0, 5).map((sale: any) => (
        <div key={sale.id} style={styles.flexBetween}><span>{format(parseISO(sale.created_at), 'dd/MM/yyyy')}</span><span>{sale.branch}</span><span>{parseFloat(sale.total).toFixed(2)}</span></div>
      ))}
      {(!customer.recent_sales || customer.recent_sales.length === 0) && <div style={styles.muted}>No recent sales</div>}
    </div>
    <div className="card" style={{ gridColumn: 'span 2' }}>
      <h4>Recent Payments</h4>
      {(customer.recent_payments || []).slice(0, 5).map((payment: any) => (
        <div key={payment.id} style={styles.flexBetween}><span>{format(parseISO(payment.created_at), 'dd/MM/yyyy')}</span><span>{payment.method}</span><span>{parseFloat(payment.amount).toFixed(2)}</span></div>
      ))}
      {(!customer.recent_payments || customer.recent_payments.length === 0) && <div style={styles.muted}>No recent payments</div>}
    </div>
  </div>
);

// ============================================================
// CUSTOMER SALES (sub-component)
// ============================================================
export const CustomerSales: React.FC<{ customerId: number }> = ({ customerId }) => {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [filters, setFilters] = useState<any>({});
  const { data, isLoading, error } = useCustomerSales(customerId, { page: page+1, page_size: pageSize, ...filters });
  if (isLoading) return <div>Loading sales...</div>;
  if (error) return <div style={{ color: '#dc2626' }}>Failed to load sales</div>;
  const sales = data?.results || [];
  const total = data?.count || 0;

  return (
    
    <div className="card">
      <table style={styles.table}>
        <thead><tr>
          <th style={styles.th}>Date</th><th style={styles.th}>Branch</th><th style={styles.th}>Cashier</th>
          <th style={styles.th}>Subtotal</th><th style={styles.th}>Discount</th><th style={styles.th}>Tax</th>
          <th style={styles.th}>Total</th><th style={styles.th}>Paid</th><th style={styles.th}>Balance</th><th style={styles.th}>Status</th>
        </tr></thead>
        <tbody>
          {sales.map((s: CustomerSale) => (
            <tr key={s.id}>
              <td style={styles.td}>{format(parseISO(s.created_at), 'dd/MM/yyyy')}</td>
              <td style={styles.td}>{s.branch}</td>
              <td style={styles.td}>{s.cashier}</td>
              <td style={styles.td}>{parseFloat(s.subtotal).toFixed(2)}</td>
              <td style={styles.td}>{parseFloat(s.discount).toFixed(2)}</td>
              <td style={styles.td}>{parseFloat(s.tax).toFixed(2)}</td>
              <td style={styles.td}>{parseFloat(s.total).toFixed(2)}</td>
              <td style={styles.td}>{parseFloat(s.amount_paid).toFixed(2)}</td>
              <td
                style={{
                  ...styles.td,
                  color: parseFloat(s.balance_due) > 0 ? '#dc2626' : '#10b981',
                }}
              >{parseFloat(s.balance_due).toFixed(2)}</td>
              <td style={styles.td}><StatusBadge status={s.status} /></td>
            </tr>
          ))}
          {sales.length === 0 && <tr><td colSpan={10} style={{ padding: 20, textAlign: 'center' }}>No sales</td></tr>}
        </tbody>
      </table>
      <div style={styles.flexBetween}>
        <div style={styles.muted}>Showing {sales.length} of {total}</div>
        <div>
          <button className="btn outline" disabled={page===0} onClick={() => setPage(page-1)}>Previous</button>
          <span style={{ margin: '0 8px' }}>Page {page+1}</span>
          <button className="btn outline" disabled={sales.length < pageSize} onClick={() => setPage(page+1)}>Next</button>
        </div>
      </div>
    </div>
    
  );
};

// ============================================================
// CUSTOMER PAYMENTS (sub-component)
// ============================================================
export const CustomerPayments: React.FC<{ customerId: number }> = ({ customerId }) => {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [filters, setFilters] = useState<any>({});
  const [selectedPaymentId, setSelectedPaymentId] = useState<number | null>(null);
  const [paymentDetailOpen, setPaymentDetailOpen] = useState(false);
  const [reverseDialogOpen, setReverseDialogOpen] = useState(false);
  const { data, isLoading, error, refetch } = useCustomerPayments(customerId, { page: page+1, page_size: pageSize, ...filters });
  const { data: paymentDetail, refetch: refetchPayment } = useCustomerPayment(selectedPaymentId || 0);
  const navigate = useNavigate();

  const handleViewPayment = async (id: number) => {
    setSelectedPaymentId(id);
    await refetchPayment();
    setPaymentDetailOpen(true);
  };

  if (isLoading) return <div>Loading payments...</div>;
  if (error) return <div style={{ color: '#dc2626' }}>Failed to load payments</div>;

  const payments = data?.results || [];
  const total = data?.count || 0;

  return (
    <div className="card">
      <table style={styles.table}>
        <thead><tr>
          <th style={styles.th}>Receipt</th><th style={styles.th}>Date</th><th style={styles.th}>Method</th>
          <th style={styles.th}>Amount</th><th style={styles.th}>Reference</th>
          <th style={styles.th}>Received By</th><th style={styles.th}>Branch</th><th style={styles.th}>Status</th><th style={styles.th}>Actions</th>
        </tr></thead>
        <tbody>
          {payments.map((p: CustomerPayment) => (
            <tr key={p.id}>
              <td style={styles.td}>{p.receipt_number}</td>
              <td style={styles.td}>{format(parseISO(p.created_at), 'dd/MM/yyyy')}</td>
              <td style={styles.td}>{p.method}</td>
              <td style={styles.td}>{parseFloat(p.amount).toFixed(2)}</td>
              <td style={styles.td}>{p.reference || '-'}</td>
              <td style={styles.td}>{p.received_by}</td>
              <td style={styles.td}>{p.branch_name}</td>
              <td style={styles.td}><StatusBadge status={p.status} /></td>
              <td style={styles.td}>
                <button className="btn outline" style={{ padding: '4px 8px' }} onClick={() => handleViewPayment(p.id)}>View</button>
              </td>
            </tr>
          ))}
          {payments.length === 0 && <tr><td colSpan={9} style={{ padding: 20, textAlign: 'center' }}>No payments</td></tr>}
        </tbody>
      </table>
      <div style={styles.flexBetween}>
        <div style={styles.muted}>Showing {payments.length} of {total}</div>
        <div>
          <button className="btn outline" disabled={page===0} onClick={() => setPage(page-1)}>Previous</button>
          <span style={{ margin: '0 8px' }}>Page {page+1}</span>
          <button className="btn outline" disabled={payments.length < pageSize} onClick={() => setPage(page+1)}>Next</button>
        </div>
      </div>

      {/* Payment Detail Dialog */}
      {paymentDetailOpen && paymentDetail && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: 20,
          }}
        >
          <div
            style={{
              background: "white",
              borderRadius: 12,
              maxWidth: 900,
              width: "100%",
              maxHeight: "90vh",
              overflow: "auto",
              padding: 24,
            }}
          >
            <div style={styles.flexBetween}>
              <h3>Payment Details</h3>

              <button
                className="btn outline"
                onClick={() => setPaymentDetailOpen(false)}
              >
                <X size={16} />
              </button>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12,
              }}
            >
              <div>
                <strong>Receipt Number</strong>
                <div>{paymentDetail.receipt_number}</div>
              </div>

              <div>
                <strong>Customer</strong>
                <div>{paymentDetail.customer_name}</div>
              </div>

              <div>
                <strong>Branch</strong>
                <div>{paymentDetail.branch_name}</div>
              </div>

              <div>
                <strong>Received By</strong>
                <div>{paymentDetail.received_by}</div>
              </div>

              <div>
                <strong>Payment Method</strong>
                <div>{paymentDetail.method}</div>
              </div>

              <div>
                <strong>Amount Received</strong>
                <div>
                  <strong>
                    {parseFloat(paymentDetail.amount).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                    })}
                  </strong>
                </div>
              </div>

              <div>
                <strong>Reference</strong>
                <div>{paymentDetail.reference || "-"}</div>
              </div>

              <div>
                <strong>Status</strong>
                <div>
                  <StatusBadge status={paymentDetail.status} />
                </div>
              </div>

              <div>
                <strong>Created At</strong>
                <div>
                  {format(
                    parseISO(paymentDetail.created_at),
                    "dd/MM/yyyy HH:mm"
                  )}
                </div>
              </div>

              <div style={{ gridColumn: "span 2" }}>
                <strong>Notes</strong>
                <div>{paymentDetail.notes || "-"}</div>
              </div>
            </div>

            <hr style={{ margin: "24px 0" }} />

            <h4>Payment Allocation</h4>

            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Sale</th>
                  <th style={styles.th}>Sale Date</th>
                  <th style={styles.th}>Sale Total</th>
                  <th style={styles.th}>Remaining Balance</th>
                  <th style={styles.th}>Allocated</th>
                  <th style={styles.th}>Status</th>
                </tr>
              </thead>

              <tbody>
                {(paymentDetail.allocations || []).map(
                  (a: PaymentAllocation) => (
                    <tr key={a.id}>
                      <td style={styles.td}>
                        <button
                          className="btn outline"
                          style={{ padding: "2px 10px" }}
                          onClick={() => navigate(`/sales/${a.sale_id}`)}
                        >
                          #{a.sale_id}
                        </button>
                      </td>

                      <td style={styles.td}>
                        {format(
                          parseISO(a.sale_created_at),
                          "dd/MM/yyyy"
                        )}
                      </td>

                      <td style={styles.td}>
                        {parseFloat(a.sale_total).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}
                      </td>

                      <td style={styles.td}>
                        <span
                          style={{
                            color:
                              parseFloat(a.sale_balance) > 0
                                ? "#dc2626"
                                : "#16a34a",
                            fontWeight: 600,
                          }}
                        >
                          {parseFloat(a.sale_balance).toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                          })}
                        </span>
                      </td>

                      <td style={styles.td}>
                        <strong>
                          {parseFloat(a.amount).toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                          })}
                        </strong>
                      </td>

                      <td style={styles.td}>
                        <StatusBadge status={a.status} />
                      </td>
                    </tr>
                  )
                )}

                {(!paymentDetail.allocations ||
                  paymentDetail.allocations.length === 0) && (
                  <tr>
                    <td
                      colSpan={6}
                      style={{
                        padding: 16,
                        textAlign: "center",
                      }}
                    >
                      No allocations found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            <div
              style={{
                marginTop: 24,
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <button
                className="btn outline"
                onClick={() => window.print()}
              >
                <Printer size={16} /> Print
              </button>

              <button
                className="btn btn-danger"
                onClick={() => {
                  setPaymentDetailOpen(false);
                  setReverseDialogOpen(true);
                }}
                disabled={
                  paymentDetail.status === "REVERSED"
                }
              >
                Reverse Payment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reverse Payment Dialog */}
      {reverseDialogOpen && (
        <ReversePaymentDialog
          open={reverseDialogOpen}
          onClose={() => setReverseDialogOpen(false)}
          paymentId={selectedPaymentId || 0}
          onSuccess={() => { refetch(); }}
        />
      )}
    </div>
  );
};

// ============================================================
// CUSTOMER STATEMENT (sub-component)
// ============================================================
export const CustomerStatement: React.FC<{ customerId: number }> = ({ customerId }) => {
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const { data, isLoading, error, refetch } = useStatement(customerId, { start, end });
  if (isLoading) return <div>Loading statement...</div>;
  if (error) return <div style={{ color: '#dc2626' }}>Failed to load statement</div>;
  const entries = data?.transactions ?? [];

  return (
    <div className="card">
      <div style={styles.flexBetween}>
        <div style={styles.flexCenter}>
          <input type="date" value={start} onChange={e => setStart(e.target.value)} style={styles.input} />
          <input type="date" value={end} onChange={e => setEnd(e.target.value)} style={styles.input} />
          <button className="btn btn-primary" onClick={() => refetch()}>Apply</button>
          <button className="btn outline" onClick={() => { setStart(''); setEnd(''); refetch(); }}>Clear</button>
        </div>
        <div>
          <button className="btn outline" disabled><Download size={14} /> PDF</button>
          <button className="btn outline" onClick={() => window.print()}><Printer size={14} /> Print</button>
        </div>
      </div>
      <table style={styles.table}>
        <thead><tr>
          <th style={styles.th}>Date</th><th style={styles.th}>Type</th><th style={styles.th}>Reference</th>
          <th style={styles.th}>Branch</th><th style={styles.th}>Cashier</th>
          <th style={styles.th}>Payment Method</th>
          <th style={styles.th}>Credit sale</th><th style={styles.th}>Payment</th><th style={styles.th}>Balance</th>
        </tr></thead>
        <tbody>
          {entries.map((e: StatementEntry, i: number) => (
            <tr key={i}>
              <td style={styles.td}>{format(parseISO(e.date), 'dd/MM/yyyy HH:mm')}</td>
              <td style={styles.td}><StatusBadge status={e.type} /></td>
              <td style={styles.td}>{e.reference}</td>
              <td style={styles.td}>{e.branch}</td>
              <td style={styles.td}>{e.cashier || '-'}</td>
              <td style={styles.td}>{e.payment_method || '-'}</td>
              <td style={styles.td}>{parseFloat(e.credit_sale).toFixed(2)}</td>
              <td style={styles.td}>{parseFloat(e.payment).toFixed(2)}</td>
              <td style={styles.td}>{parseFloat(e.balance).toFixed(2)}</td>
            </tr>
          ))}
          {entries.length === 0 && <tr><td colSpan={9} style={{ padding: 20, textAlign: 'center' }}>No entries</td></tr>}
        </tbody>
      </table>
    </div>
  );
};

// ============================================================
// RECEIVE PAYMENT DIALOG
// ============================================================
const paymentFormSchema = z.object({
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Invalid amount'),
  method: z.string().min(1, 'Method required'),
  reference: z.string().optional(),
  notes: z.string().optional(),
});

export const ReceivePaymentDialog: React.FC<{
  open: boolean;
  onClose: () => void;
  customerId: number;
  customerName: string;
  // branchId: number;
}> = ({ open, onClose, customerId, customerName }) => {
  const { control, handleSubmit, reset } = useForm({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: { amount: '', method: 'CASH', reference: '', notes: '' },
  });
  const mutation = useCreatePayment();
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const onSubmit = (data: any) => {
    mutation.mutate({
      customer: customerId,
      amount: data.amount,
      method: data.method,
      reference: data.reference,
      notes: data.notes,
    }, {
      onSuccess: () => {
        setSnackbar({ open: true, message: 'Payment recorded successfully', severity: 'success' });
        reset();
        onClose();
      },
      onError: () => setSnackbar({ open: true, message: 'Failed to record payment', severity: 'error' }),
    });
  };

  if (!open) return null;

  return (
    <>
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
        <div style={{ background: 'white', borderRadius: 12, maxWidth: 500, width: '100%', padding: 24 }}>
          <div style={styles.flexBetween}>
            <h3>Receive Payment – {customerName}</h3>
            <button className="btn outline" onClick={onClose}><X size={16} /></button>
          </div>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div style={{ marginBottom: 12 }}>
              <label style={styles.label}>Amount</label>
              <Controller name="amount" control={control} render={({ field, fieldState }) => (
                <input {...field} placeholder="0.00" style={{ ...styles.input, borderColor: fieldState.error ? '#dc2626' : '#e5e7eb' }} />
              )} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={styles.label}>Method</label>
              <Controller name="method" control={control} render={({ field }) => (
                <select {...field} style={styles.select}>
                  <option value="CASH">Cash</option>
                  <option value="BANK">Bank Transfer</option>
                  <option value="MPESA">M-Pesa</option>
                  <option value="CARD">Card</option>
                  <option value="CHEQUE">Cheque</option>
                </select>
              )} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={styles.label}>Reference</label>
              <Controller name="reference" control={control} render={({ field }) => (
                <input {...field} style={styles.input} />
              )} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={styles.label}>Notes</label>
              <Controller name="notes" control={control} render={({ field }) => (
                <textarea {...field} rows={2} style={styles.input} />
              )} />
            </div>
            <div style={styles.flexBetween}>
              <button type="button" className="btn outline" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={mutation.isPending}>
                {mutation.isPending ? 'Processing...' : 'Record Payment'}
              </button>
            </div>
          </form>
        </div>
      </div>
      {snackbar.open && (
        <div style={{ position: 'fixed', bottom: 20, right: 20, background: snackbar.severity === 'success' ? '#10b981' : '#ef4444', color: 'white', padding: '12px 20px', borderRadius: 8, zIndex: 2000 }}>
          {snackbar.message}
          <button onClick={() => setSnackbar({ ...snackbar, open: false })} style={{ background: 'none', border: 'none', color: 'white', marginLeft: 12 }}>✕</button>
        </div>
      )}
    </>
  );
};

// ============================================================
// REVERSE PAYMENT DIALOG
// ============================================================
export const ReversePaymentDialog: React.FC<{
  open: boolean;
  onClose: () => void;
  paymentId: number;
  onSuccess: () => void;
}> = ({ open, onClose, paymentId, onSuccess }) => {
  const [reason, setReason] = useState('');
  const mutation = useReversePayment(paymentId);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const handleSubmit = () => {
    if (!reason.trim()) {
      setSnackbar({ open: true, message: 'Reason is required', severity: 'error' });
      return;
    }
    mutation.mutate({ reason }, {
      onSuccess: () => {
        setSnackbar({ open: true, message: 'Payment reversed successfully', severity: 'success' });
        onSuccess();
        onClose();
      },
      onError: () => setSnackbar({ open: true, message: 'Failed to reverse payment', severity: 'error' }),
    });
  };

  if (!open) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
      <div style={{ background: 'white', borderRadius: 12, maxWidth: 450, width: '100%', padding: 24 }}>
        <h3>Reverse Payment</h3>
        <p style={styles.muted}>Are you sure you want to reverse this payment? This action cannot be undone.</p>
        <div style={{ marginBottom: 16 }}>
          <label style={styles.label}>Reason for reversal *</label>
          <textarea value={reason} onChange={e => setReason(e.target.value)} rows={3} style={styles.input} />
        </div>
        <div style={styles.flexBetween}>
          <button className="btn outline" onClick={onClose}>Cancel</button>
          <button className="btn btn-danger" onClick={handleSubmit} disabled={mutation.isPending}>
            {mutation.isPending ? 'Reversing...' : 'Reverse Payment'}
          </button>
        </div>
      </div>
      {snackbar.open && (
        <div style={{ position: 'fixed', bottom: 20, right: 20, background: snackbar.severity === 'success' ? '#10b981' : '#ef4444', color: 'white', padding: '12px 20px', borderRadius: 8, zIndex: 2000 }}>
          {snackbar.message}
          <button onClick={() => setSnackbar({ ...snackbar, open: false })} style={{ background: 'none', border: 'none', color: 'white', marginLeft: 12 }}>✕</button>
        </div>
      )}
    </div>
  );
};