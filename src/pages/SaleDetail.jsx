// pages/SaleDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CreditCard, Printer } from 'lucide-react';
import { api } from '../api/client';
import AppLayout from '../components/AppLayout';
import { formatCurrency, formatDateTime } from '../utils/formatters';
import { useAuth } from '../auth/AuthContext';

export default function SaleDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [sale, setSale] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('CASH');
  const [reference, setReference] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const userRole = user?.role?.toLowerCase();
  const isAdmin = userRole === 'admin';

  const loadSale = async () => {
    setLoading(true);
    try {
      const res = await api.get(`api/cart/sales/${id}/`);
      console.log('Sale details:', res.data);
      setSale(res.data);
    } catch (err) {
      console.error('Failed to load sale', err);
      setError('Failed to load sale details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      loadSale();
    }
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) {
      setError('Amount must be greater than 0');
      return;
    }
    if (amt > parseFloat(sale.balance)) {
      setError(`Amount cannot exceed balance of ${formatCurrency(parseFloat(sale.balance))}`);
      return;
    }
    
    setSubmitting(true);
    try {
      await api.post(`api/cart/sales/${id}/pay/`, {
        amount: amt,
        method: method,
        reference: reference || null
      });
      setSuccess('Payment added successfully!');
      setAmount('');
      setReference('');
      loadSale();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add payment');
    } finally {
      setSubmitting(false);
    }
  };

  const printReceipt = async () => {
    try {
      const response = await api.get(`api/cart/sales/${id}/receipt/`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const printWindow = window.open(url, '_blank');
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
        };
      }
    } catch (err) {
      console.error('Failed to print receipt', err);
      setError('Failed to generate receipt');
    }
  };

  if (loading) {
    return (
      <AppLayout title="Sale Details" subtitle="">
        <div className="card" style={{ textAlign: 'center', padding: 40 }}>Loading...</div>
      </AppLayout>
    );
  }

  if (!sale) {
    return (
      <AppLayout title="Sale Details" subtitle="">
        <div className="card" style={{ textAlign: 'center', padding: 40 }}>Sale not found</div>
      </AppLayout>
    );
  }

  const total = parseFloat(sale.total) || 0;
  const paid = parseFloat(sale.paid) || 0;
  const balance = parseFloat(sale.balance) || 0;

  return (
    <AppLayout title={`Sale #${sale.sale_id || sale.id}`} subtitle="Manage payments">
      {/* Back button */}
      <button 
        className="btn outline" 
        onClick={() => navigate('/balance/sales/outstanding')} 
        style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}
      >
        <ArrowLeft size={16} />
        Back
      </button>

      {/* Success/Error messages */}
      {success && (
        <div className="card" style={{ marginBottom: 16, backgroundColor: '#d1fae5', color: '#065f46', padding: 12 }}>
          ✅ {success}
        </div>
      )}
      {error && (
        <div className="card" style={{ marginBottom: 16, backgroundColor: '#fee2e2', color: '#dc2626', padding: 12 }}>
          ❌ {error}
        </div>
      )}

      {/* Sale Summary */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ padding: 16, borderBottom: '1px solid #e5e7eb', backgroundColor: '#f9fafb' }}>
          <strong style={{ fontSize: 16 }}>Sale Information</strong>
        </div>
        <div style={{ padding: 16 }}>
          <div className="grid-2" style={{ gap: 16 }}>
            <div><strong>Sale ID:</strong> {sale.sale_id || sale.id}</div>
            <div><strong>Customer:</strong> {sale.customer_name || 'Walk-in Customer'}</div>
            <div><strong>Customer ID:</strong> {sale.customer_id || '—'}</div>
            <div><strong>Phone:</strong> {sale.customer_phone || '—'}</div>
            <div><strong>Cashier:</strong> {sale.cashier || '—'}</div>
            {isAdmin && <div><strong>Branch:</strong> {sale.branch || '—'}</div>}
            <div><strong>Date:</strong> {formatDateTime(sale.created_at)}</div>
            <div><strong>Total Items:</strong> {sale.total_items || 0} items</div>
            <div><strong>Total Quantity:</strong> {parseFloat(sale.total_quantity || 0).toFixed(2)} units</div>
          </div>
        </div>
      </div>

      {/* Order Items Section - This shows the items sold */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ padding: 16, borderBottom: '1px solid #e5e7eb', backgroundColor: '#f9fafb' }}>
          <strong style={{ fontSize: 16 }}>🛒 Items Sold</strong>
          <span className="muted" style={{ marginLeft: 8, fontSize: 12 }}>({sale.total_items || 0} items)</span>
        </div>
        <div style={{ padding: 16, overflowX: 'auto' }}>
          {sale.items && sale.items.length > 0 ? (
            <table className="table">
              <thead>
                <tr>
                  <th>Product Name</th>
                  <th style={{ textAlign: 'right' }}>Quantity</th>
                  <th style={{ textAlign: 'right' }}>Unit Price</th>
                  <th style={{ textAlign: 'right' }}>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {sale.items.map((item, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: 500 }}>{item.product_name}</td>
                    <td style={{ textAlign: 'right' }}>{parseFloat(item.quantity).toFixed(2)} {item.unit || 'units'}</td>
                    <td style={{ textAlign: 'right' }}>{formatCurrency(parseFloat(item.unit_price))}</td>
                    <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{formatCurrency(parseFloat(item.subtotal))}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot style={{ backgroundColor: '#f9fafb' }}>
                <tr>
                  <td colSpan="3" style={{ textAlign: 'right', fontWeight: 600 }}>Total:</td>
                  <td style={{ textAlign: 'right', fontWeight: 'bold', fontSize: 16 }}>{formatCurrency(total)}</td>
                </tr>
              </tfoot>
            </table>
          ) : (
            <div style={{ textAlign: 'center', padding: 40, color: '#6b7280' }}>
              No items found for this sale
            </div>
          )}
        </div>
      </div>

      {/* Financial Summary */}
      <div className="grid-3" style={{ marginBottom: 16, gap: 16 }}>
        <div className="card" style={{ padding: 16, textAlign: 'center' }}>
          <div className="muted" style={{ marginBottom: 4 }}>Total Amount</div>
          <div style={{ fontSize: 20, fontWeight: 700 }}>{formatCurrency(total)}</div>
        </div>
        <div className="card" style={{ padding: 16, textAlign: 'center' }}>
          <div className="muted" style={{ marginBottom: 4 }}>Amount Paid</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#10b981' }}>{formatCurrency(paid)}</div>
          <div style={{ fontSize: 12, marginTop: 4 }}>{sale.payments?.length || 0} payment(s)</div>
        </div>
        <div className="card" style={{ padding: 16, textAlign: 'center' }}>
          <div className="muted" style={{ marginBottom: 4 }}>Remaining Balance</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: balance > 0 ? '#dc2626' : '#10b981' }}>
            {formatCurrency(balance)}
          </div>
          <div style={{ fontSize: 12, marginTop: 4 }}>
            {balance <= 0 ? 'Fully Paid' : balance >= total ? 'Credit Sale' : 'Partial Payment'}
          </div>
        </div>
      </div>

      {/* Payment History */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ padding: 16, borderBottom: '1px solid #e5e7eb', backgroundColor: '#f9fafb' }}>
          <strong style={{ fontSize: 16 }}>💰 Payment History</strong>
        </div>
        <div style={{ padding: 16, overflowX: 'auto' }}>
          {sale.payments && sale.payments.length > 0 ? (
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th style={{ textAlign: 'right' }}>Amount</th>
                  <th>Method</th>
                  <th>Reference</th>
                </tr>
              </thead>
              <tbody>
                {sale.payments.map((p, idx) => (
                  <tr key={idx}>
                    <td>{formatDateTime(p.date || p.created_at)}</td>
                    <td style={{ textAlign: 'right', color: '#10b981', fontWeight: 500 }}>
                      {formatCurrency(parseFloat(p.amount))}
                    </td>
                    <td>{p.method}</td>
                    <td>{p.reference || '—'}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot style={{ backgroundColor: '#f9fafb' }}>
                <tr>
                  <td colSpan="1" style={{ textAlign: 'right', fontWeight: 600 }}>Total Paid:</td>
                  <td style={{ textAlign: 'right', fontWeight: 'bold', fontSize: 16, color: '#10b981' }}>
                    {formatCurrency(paid)}
                  </td>
                  <td colSpan="2"></td>
                </tr>
              </tfoot>
            </table>
          ) : (
            <div style={{ textAlign: 'center', padding: 40, color: '#6b7280' }}>
              No payments recorded yet
            </div>
          )}
        </div>
      </div>

      {/* Add Payment Form */}
      {balance > 0 && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div style={{ padding: 16, borderBottom: '1px solid #e5e7eb', backgroundColor: '#f9fafb' }}>
            <strong style={{ fontSize: 16 }}>➕ Add Payment</strong>
          </div>
          <div style={{ padding: 16 }}>
            <form onSubmit={handleSubmit}>
              <div className="grid-2" style={{ gap: 16 }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontSize: 13 }}>Amount *</label>
                  <input
                    type="number"
                    step="0.01"
                    className="input"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Enter amount"
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontSize: 13 }}>Payment Method *</label>
                  <select className="input" value={method} onChange={(e) => setMethod(e.target.value)}>
                    <option value="CASH">Cash</option>
                    <option value="MPESA">M-Pesa</option>
                    <option value="BANK">Bank Transfer</option>
                    <option value="CHEQUE">Cheque</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div className="full-width">
                  <label style={{ display: 'block', marginBottom: 6, fontSize: 13 }}>Reference (Optional)</label>
                  <input
                    type="text"
                    className="input"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    placeholder="Transaction reference number"
                  />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
                <button type="submit" className="btn btn-primary" disabled={submitting} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CreditCard size={16} />
                  {submitting ? 'Processing...' : 'Add Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Print Receipt Button */}
      {sale.payments && sale.payments.length > 0 && (
        <div className="card">
          <div style={{ padding: 16, display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn outline" onClick={printReceipt} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Printer size={16} />
              Print Updated Receipt
            </button>
          </div>
        </div>
      )}

      <style>
        {`
          .grid-2 {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 16px;
          }
          .grid-3 {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 16px;
          }
          .full-width {
            grid-column: span 2;
          }
          @media (max-width: 768px) {
            .grid-2, .grid-3 {
              grid-template-columns: 1fr;
            }
            .full-width {
              grid-column: span 1;
            }
          }
        `}
      </style>
    </AppLayout>
  );
}