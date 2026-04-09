import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Trash2, Save, ArrowLeft } from 'lucide-react';
import { purchaseAPI, productAPI, supplierAPI } from '../../services/api';
import LoadingSpinner from '../Common/LoadingSpinner';
import ErrorAlert from '../Common/ErrorAlert';
import { formatCurrency } from '../../utils/formatters';

const PurchaseForm = ({ isEdit = false, onSuccess }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [formData, setFormData] = useState({
    supplier_id: '',
    branch_id: '',
    purchase_date: new Date().toISOString().split('T')[0],
    due_date: '',
    notes: '',
    items: []
  });

  useEffect(() => {
    fetchInitialData();
    if (isEdit && id) {
      fetchPurchaseData();
    }
  }, [id, isEdit]);

  const fetchInitialData = async () => {
    try {
      const [suppliersRes, productsRes] = await Promise.all([
        supplierAPI.getList(),
        productAPI.getList({ is_active: true })
      ]);
      setSuppliers(suppliersRes.data);
      setProducts(productsRes.data);
    } catch (err) {
      setError('Failed to load initial data');
    }
  };

  const fetchPurchaseData = async () => {
    setLoading(true);
    try {
      const response = await purchaseAPI.getDetail(id);
      const purchase = response.data;
      setFormData({
        supplier_id: purchase.supplier.id,
        branch_id: purchase.branch.id,
        purchase_date: purchase.purchase_date,
        due_date: purchase.due_date || '',
        notes: purchase.notes || '',
        items: purchase.items.map(item => ({
          id: item.id,
          product_id: item.product,
          unit: item.unit,
          quantity: item.quantity,
          unit_price: item.unit_price,
          bag_weight_kg: item.bag_weight_kg || ''
        }))
      });
    } catch (err) {
      setError('Failed to load purchase data');
    } finally {
      setLoading(false);
    }
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [
        ...formData.items,
        {
          product_id: '',
          unit: 'KG',
          quantity: '',
          unit_price: '',
          bag_weight_kg: '',
          temp_id: Date.now()
        }
      ]
    });
  };

  const removeItem = (index) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
  };

  const updateItem = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;
    
    // Auto-set bag weight when product selected
    if (field === 'product_id') {
      const product = products.find(p => p.id === parseInt(value));
      if (product && product.unit === 'BAG') {
        newItems[index].unit = 'BAG';
        newItems[index].bag_weight_kg = product.bag_weight_kg;
      }
    }
    
    setFormData({ ...formData, items: newItems });
  };

  const calculateItemTotal = (item) => {
    if (item.quantity && item.unit_price) {
      return parseFloat(item.quantity) * parseFloat(item.unit_price);
    }
    return 0;
  };

  const calculateTotal = () => {
    return formData.items.reduce((total, item) => total + calculateItemTotal(item), 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validation
    if (formData.items.length === 0) {
      setError('Please add at least one item');
      setLoading(false);
      return;
    }

    const submitData = {
      ...formData,
      total_amount: calculateTotal()
    };

    try {
      if (isEdit) {
        await purchaseAPI.update(id, submitData);
      } else {
        await purchaseAPI.create(submitData);
      }
      onSuccess();
      navigate('/purchases');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save purchase');
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEdit) return <LoadingSpinner />;

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="border-b px-6 py-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/purchases')}
            className="text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-2xl font-bold text-gray-800">
            {isEdit ? 'Edit Purchase' : 'Create New Purchase'}
          </h1>
        </div>
      </div>

      {error && <ErrorAlert message={error} onClose={() => setError(null)} className="m-6" />}

      <form onSubmit={handleSubmit} className="p-6">
        {/* Purchase Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Supplier *
            </label>
            <select
              required
              value={formData.supplier_id}
              onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select Supplier</option>
              {suppliers.map(supplier => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Branch *
            </label>
            <select
              required
              value={formData.branch_id}
              onChange={(e) => setFormData({ ...formData, branch_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select Branch</option>
              {/* Add branch options from your existing branch data */}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Purchase Date *
            </label>
            <input
              type="date"
              required
              value={formData.purchase_date}
              onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Due Date
            </label>
            <input
              type="date"
              value={formData.due_date}
              onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              rows="3"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              placeholder="Any additional notes..."
            />
          </div>
        </div>

        {/* Items Section */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Items</h2>
            <button
              type="button"
              onClick={addItem}
              className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-1"
            >
              <Plus size={16} />
              Add Item
            </button>
          </div>

          <div className="space-y-4">
            {formData.items.map((item, index) => (
              <div key={item.temp_id || item.id} className="border rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Product *
                    </label>
                    <select
                      required
                      value={item.product_id}
                      onChange={(e) => updateItem(index, 'product_id', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="">Select Product</option>
                      {products.map(product => (
                        <option key={product.id} value={product.id}>
                          {product.name} ({product.unit})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Unit
                    </label>
                    <select
                      value={item.unit}
                      onChange={(e) => updateItem(index, 'unit', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="KG">KG</option>
                      <option value="BAG">BAG</option>
                    </select>
                  </div>

                  {item.unit === 'BAG' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Bag Weight (KG)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={item.bag_weight_kg}
                        onChange={(e) => updateItem(index, 'bag_weight_kg', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Quantity *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Unit Price *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={item.unit_price}
                      onChange={(e) => updateItem(index, 'unit_price', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>

                  <div className="flex items-end">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Total
                      </label>
                      <div className="px-3 py-2 bg-gray-100 rounded-lg">
                        {formatCurrency(calculateItemTotal(item))}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="ml-2 p-2 text-red-600 hover:text-red-800"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {formData.items.length === 0 && (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <p className="text-gray-500">No items added. Click "Add Item" to start.</p>
              </div>
            )}
          </div>
        </div>

        {/* Summary */}
        <div className="border-t pt-6">
          <div className="flex justify-end">
            <div className="w-80">
              <div className="flex justify-between py-2">
                <span className="font-medium">Total Amount:</span>
                <span className="text-xl font-bold text-gray-900">
                  {formatCurrency(calculateTotal())}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="border-t mt-6 pt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/purchases')}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            <Save size={18} />
            {loading ? 'Saving...' : isEdit ? 'Update Purchase' : 'Save as Draft'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PurchaseForm;