import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Edit, Trash2, CreditCard, Printer } from 'lucide-react';
import { purchaseAPI } from '../../services/api';
import StatusBadge from '../Common/StatusBadge';
import LoadingSpinner from '../Common/LoadingSpinner';
import ErrorAlert from '../Common/ErrorAlert';
import ConfirmDialog from '../Common/ConfirmDialog';
import PaymentModal from './PaymentModal';
import PurchaseItemsTable from './PurchaseItemsTable';
import PaymentHistory from './PaymentHistory';
import PurchaseActions from './PurchaseActions';
import { formatCurrency, formatDate, formatDateTime } from '../../utils/formatters';

const PurchaseDetail = ({ onDataChange }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [purchase, setPurchase] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [activeTab, setActiveTab] = useState(() => {
    const params = new URLSearchParams(location.search);
    return params.get('tab') || 'items';
  });

  useEffect(() => {
    fetchPurchaseDetail();
  }, [id]);

  const fetchPurchaseDetail = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await purchaseAPI.getDetail(id);
      setPurchase(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load purchase details');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    try {
      await purchaseAPI.confirm(id);
      await fetchPurchaseDetail();
      onDataChange();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to confirm purchase');
    }
  };

  const handleCancel = async () => {
    try {
      await purchaseAPI.cancel(id);
      await fetchPurchaseDetail();
      onDataChange();
      setShowCancelDialog(false);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to cancel purchase');
    }
  };

  const handlePaymentSuccess = async () => {
    setShowPaymentModal(false);
    await fetchPurchaseDetail();
    onDataChange();
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Purchase Order ${purchase.purchase_number}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .details { margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .total { text-align: right; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Purchase Order</h1>
            <p>${purchase.purchase_number}</p>
          </div>
          <div class="details">
            <p><strong>Supplier:</strong> ${purchase.supplier.name}</p>
            <p><strong>Date:</strong> ${formatDate(purchase.purchase_date)}</p>
            <p><strong>Status:</strong> ${purchase.status}</p>
          </div>
          <table>
            <thead>
              <tr><th>Product</th><th>Unit</th><th>Quantity</th><th>Unit Price</th><th>Total</th></tr>
            </thead>
            <tbody>
              ${purchase.items.map(item => `
                <tr>
                  <td>${item.product_name}</td>
                  <td>${item.unit}</td>
                  <td>${item.quantity}</td>
                  <td>${formatCurrency(item.unit_price)}</td>
                  <td>${formatCurrency(item.total_price)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="total">
            <h3>Total: ${formatCurrency(purchase.total_amount)}</h3>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorAlert message={error} onRetry={fetchPurchaseDetail} />;
  if (!purchase) return null;

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="border-b px-6 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/purchases')}
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft size={24} />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                Purchase {purchase.purchase_number}
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Created {formatDateTime(purchase.created_at)} by {purchase.created_by_name}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {purchase.status === 'DRAFT' && (
              <>
                <button
                  onClick={() => navigate(`/purchases/${id}/edit`)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
                >
                  <Edit size={16} />
                  Edit
                </button>
                <button
                  onClick={handleConfirm}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Confirm Purchase
                </button>
              </>
            )}
            {purchase.can_add_payment && (
              <button
                onClick={() => setShowPaymentModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <CreditCard size={16} />
                Add Payment
              </button>
            )}
            {purchase.can_cancel && (
              <button
                onClick={() => setShowCancelDialog(true)}
                className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 flex items-center gap-2"
              >
                <Trash2 size={16} />
                Cancel
              </button>
            )}
            <button
              onClick={handlePrint}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
            >
              <Printer size={16} />
              Print
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-6 border-b">
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-600">Total Amount</p>
          <p className="text-2xl font-bold text-gray-800">{formatCurrency(purchase.total_amount)}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-600">Amount Paid</p>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(purchase.amount_paid)}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-600">Balance</p>
          <p className={`text-2xl font-bold ${purchase.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
            {formatCurrency(purchase.balance)}
          </p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-600">Status</p>
          <div className="mt-1">
            <StatusBadge status={purchase.status} size="lg" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b">
        <div className="flex px-6">
          <button
            onClick={() => setActiveTab('items')}
            className={`px-4 py-3 font-medium transition-colors ${
              activeTab === 'items'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Items
          </button>
          <button
            onClick={() => setActiveTab('payments')}
            className={`px-4 py-3 font-medium transition-colors ${
              activeTab === 'payments'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Payment History
          </button>
          <button
            onClick={() => setActiveTab('info')}
            className={`px-4 py-3 font-medium transition-colors ${
              activeTab === 'info'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Additional Info
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'items' && (
          <PurchaseItemsTable items={purchase.items} />
        )}
        
        {activeTab === 'payments' && (
          <PaymentHistory payments={purchase.payments} />
        )}
        
        {activeTab === 'info' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Supplier</p>
                <p className="font-medium">{purchase.supplier.name}</p>
                <p className="text-sm">{purchase.supplier.phone}</p>
                <p className="text-sm">{purchase.supplier.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Branch</p>
                <p className="font-medium">{purchase.branch_name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Purchase Date</p>
                <p className="font-medium">{formatDate(purchase.purchase_date)}</p>
              </div>
              {purchase.due_date && (
                <div>
                  <p className="text-sm text-gray-600">Due Date</p>
                  <p className="font-medium">{formatDate(purchase.due_date)}</p>
                </div>
              )}
              {purchase.approved_by_name && (
                <div>
                  <p className="text-sm text-gray-600">Approved By</p>
                  <p className="font-medium">{purchase.approved_by_name}</p>
                </div>
              )}
            </div>
            {purchase.notes && (
              <div>
                <p className="text-sm text-gray-600">Notes</p>
                <p className="mt-1 text-gray-800">{purchase.notes}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      {showPaymentModal && (
        <PaymentModal
          purchase={purchase}
          onClose={() => setShowPaymentModal(false)}
          onSuccess={handlePaymentSuccess}
        />
      )}
      
      {showCancelDialog && (
        <ConfirmDialog
          title="Cancel Purchase"
          message={`Are you sure you want to cancel purchase ${purchase.purchase_number}? This will reverse inventory updates if already confirmed.`}
          onConfirm={handleCancel}
          onCancel={() => setShowCancelDialog(false)}
          confirmText="Yes, Cancel"
          cancelText="No, Keep"
          type="danger"
        />
      )}
    </div>
  );
};

export default PurchaseDetail;