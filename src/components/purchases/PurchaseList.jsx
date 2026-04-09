import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, CreditCard, FileText, AlertCircle } from 'lucide-react';
import { purchaseAPI } from '../../services/api';
import StatusBadge from '../Common/StatusBadge';
import LoadingSpinner from '../Common/LoadingSpinner';
import ErrorAlert from '../Common/ErrorAlert';
import PurchaseFilters from './PurchaseFilters';
import PurchaseSummary from './PurchaseSummary';
import { formatCurrency, formatDate } from '../../utils/formatters';

const PurchaseList = ({ refreshTrigger, onDataChange }) => {
  const navigate = useNavigate();
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
    branch: '',
    supplier: '',
    date_from: '',
    date_to: '',
    search: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    page_size: 20,
    total: 0
  });

  useEffect(() => {
    fetchPurchases();
  }, [refreshTrigger, filters, pagination.page]);

  const fetchPurchases = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { ...filters, ...pagination };
      const response = await purchaseAPI.getList(params);
      setPurchases(response.data.results || response.data);
      setPagination(prev => ({ ...prev, total: response.data.count || response.data.length }));
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load purchases');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (id) => {
    navigate(`/purchases/${id}`);
  };

  const handleAddPayment = (id) => {
    navigate(`/purchases/${id}?tab=payments`);
  };

  const handleExport = async () => {
    try {
      const response = await purchaseAPI.export(filters);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `purchases_${formatDate(new Date())}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setError('Failed to export data');
    }
  };

  if (loading && purchases.length === 0) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-4">
      {error && <ErrorAlert message={error} onClose={() => setError(null)} />}
      
      <PurchaseSummary refreshTrigger={refreshTrigger} />
      
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <PurchaseFilters filters={filters} onFilterChange={setFilters} onExport={handleExport} />
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Purchase #
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Supplier
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Branch
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Paid
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Balance
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {purchases.map((purchase) => (
                <tr key={purchase.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {purchase.purchase_number}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {purchase.supplier_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {purchase.branch_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium">
                    {formatCurrency(purchase.total_amount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-green-600">
                    {formatCurrency(purchase.amount_paid)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium">
                    {purchase.balance > 0 ? (
                      <span className="text-red-600">{formatCurrency(purchase.balance)}</span>
                    ) : (
                      <span className="text-green-600">{formatCurrency(purchase.balance)}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <StatusBadge status={purchase.status} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {formatDate(purchase.purchase_date)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => handleViewDetails(purchase.id)}
                        className="text-blue-600 hover:text-blue-900 transition-colors"
                        title="View Details"
                      >
                        <Eye size={18} />
                      </button>
                      {purchase.status !== 'PAID' && purchase.status !== 'CANCELLED' && purchase.balance > 0 && (
                        <button
                          onClick={() => handleAddPayment(purchase.id)}
                          className="text-green-600 hover:text-green-900 transition-colors"
                          title="Add Payment"
                        >
                          <CreditCard size={18} />
                        </button>
                      )}
                      {purchase.status === 'DRAFT' && (
                        <button
                          onClick={() => navigate(`/purchases/${purchase.id}/edit`)}
                          className="text-yellow-600 hover:text-yellow-900 transition-colors"
                          title="Edit"
                        >
                          <FileText size={18} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {purchases.length === 0 && !loading && (
          <div className="text-center py-12">
            <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No purchases found</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by creating a new purchase order.</p>
            <div className="mt-6">
              <button
                onClick={() => navigate('/purchases/new')}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Purchase
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PurchaseList;