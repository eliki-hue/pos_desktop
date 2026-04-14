// src/components/Purchases/PurchaseForm.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Trash2, Save, ArrowLeft, Package, AlertCircle } from 'lucide-react';
import { purchaseAPI, productAPI, supplierAPI, branchAPI } from '../../services/api';
import { formatCurrency } from '../../utils/formatters';
import CreateSupplierModal from './CreateSupplierModal';
import api from '../../services/api';

const PurchaseForm = ({ isEdit = false, onSuccess }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(true);
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [formData, setFormData] = useState({
    supplier_id: '',
    branch_id: '',
    purchase_date: new Date().toISOString().split('T')[0],
    due_date: '',
    notes: '',
    items: []
  });

  useEffect(() => {
    fetchSuppliers();
    fetchProducts();
    fetchBranches();
    if (isEdit && id) {
      fetchPurchaseData();
    }
  }, [id, isEdit]);

  const fetchSuppliers = async () => {
    setLoadingSuppliers(true);
    try {
      const response = await supplierAPI.getList({ is_active: true });
      setSuppliers(response.data || []);
    } catch (err) {
      console.error('Failed to fetch suppliers:', err);
      setError('Failed to load suppliers');
    } finally {
      setLoadingSuppliers(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await productAPI.getList({ is_active: true });
      setProducts(response.data || []);
    } catch (err) {
      console.error('Failed to fetch products:', err);
    }
  };

  const fetchBranches = async () => {
    try {
      const branchesRes = await branchAPI.getList();
      setBranches(branchesRes.data || []);
    } catch (err) {
      console.error('Failed to fetch branches:', err);
      setBranches([
        { id: 1, name: 'Main Branch' },
        { id: 2, name: 'Gitugi Branch' },
      ]);
    }
  };

  const fetchPurchaseData = async () => {
    setLoading(true);
    try {
      const response = await purchaseAPI.getDetail(id);
      const purchase = response.data;
      setFormData({
        supplier_id: purchase.supplier?.id || '',
        branch_id: purchase.branch?.id || '',
        purchase_date: purchase.purchase_date || new Date().toISOString().split('T')[0],
        due_date: purchase.due_date || '',
        notes: purchase.notes || '',
        items: purchase.items?.map(item => ({
          id: item.id,
          product_id: item.product,
          unit: item.unit,
          quantity: item.quantity,
          unit_price: item.unit_price,
          bag_weight_kg: item.bag_weight_kg || ''
        })) || []
      });
    } catch (err) {
      console.error('Failed to load purchase data:', err);
      setError('Failed to load purchase data');
    } finally {
      setLoading(false);
    }
  };

  const handleSupplierCreated = (newSupplier) => {
    setSuppliers(prev => [...prev, newSupplier]);
    setFormData(prev => ({ ...prev, supplier_id: newSupplier.id }));
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
    
    if (field === 'product_id') {
      const product = products.find(p => p.id === parseInt(value));
      if (product) {
        newItems[index].unit = product.unit || 'KG';
        if (product.unit === 'BAG' && product.bag_weight_kg) {
          newItems[index].bag_weight_kg = product.bag_weight_kg;
        }
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

    if (formData.items.length === 0) {
      setError('Please add at least one item');
      setLoading(false);
      return;
    }

    if (!formData.supplier_id) {
      setError('Please select a supplier');
      setLoading(false);
      return;
    }

    if (!formData.branch_id) {
      setError('Please select a branch');
      setLoading(false);
      return;
    }

    // Validate each item
    for (const item of formData.items) {
      if (!item.product_id) {
        setError('Please select a product for all items');
        setLoading(false);
        return;
      }
      if (!item.quantity || item.quantity <= 0) {
        setError('Please enter valid quantity for all items');
        setLoading(false);
        return;
      }
      if (!item.unit_price || item.unit_price <= 0) {
        setError('Please enter valid unit price for all items');
        setLoading(false);
        return;
      }
    }

    // Prepare items payload - MATCHING BACKEND SERIALIZER
    const itemsPayload = formData.items.map(item => ({
      product: parseInt(item.product_id),
      unit: item.unit,
      quantity: parseFloat(item.quantity),
      unit_price: parseFloat(item.unit_price),
      bag_weight_kg: item.unit === 'BAG' ? parseFloat(item.bag_weight_kg) : null
    }));

    // Prepare submit data - MATCHING BACKEND SERIALIZER
    const submitData = {
      
        supplier_id: parseInt(formData.supplier_id),
        branch_id: parseInt(formData.branch_id),
        purchase_date: formData.purchase_date,
        due_date: formData.due_date || null,
        notes: formData.notes || '',
        items: itemsPayload,
        total_amount: calculateTotal()
      
    };

    try {
      if (isEdit) {
        await purchaseAPI.update(id, submitData);
      } else {
        await purchaseAPI.create(submitData);
      }
      if (onSuccess) onSuccess();
      navigate('/purchases');
    } catch (err) {
      console.error('Failed to save purchase:', err);
      if (err.response?.data?.items) {
        setError('Please check item details: ' + JSON.stringify(err.response.data.items));
      } else if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else {
        setError('Failed to save purchase. Please check all fields.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEdit) {
    return <div className="card" style={{ textAlign: 'center', padding: 60, color: '#6b7280' }}>Loading purchase data...</div>;
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
        <button
          onClick={() => navigate('/purchases')}
          className="btn outline"
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px' }}
        >
          <ArrowLeft style={{ width: 18, height: 18 }} />
          Back
        </button>
        <div>
          <div style={{ fontWeight: 900, fontSize: 24 }}>{isEdit ? 'Edit Purchase' : 'Create New Purchase'}</div>
          <div className="muted" style={{ marginTop: 4 }}>
            {isEdit ? 'Update purchase order details' : 'Fill in the details to create a new purchase order'}
          </div>
        </div>
      </div>

      {error && (
        <div className="card" style={{ marginBottom: 20, backgroundColor: '#fee2e2', color: '#dc2626', padding: 12, borderRadius: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertCircle style={{ width: 18, height: 18 }} />
            {error}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Purchase Details */}
        <div className="card" style={{ marginBottom: 24 }}>
          <div style={{ fontWeight: 600, marginBottom: 16, fontSize: 16 }}>Purchase Details</div>
          <div className="grid-2" style={{ gap: 20 }}>
            {/* Supplier Field with Create Button */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <label style={{ fontSize: 13, fontWeight: 500 }}>Supplier *</label>
                <button
                  type="button"
                  onClick={() => setShowSupplierModal(true)}
                  style={{
                    fontSize: 12,
                    color: '#3b82f6',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <Plus style={{ width: 12, height: 12 }} />
                  Create New Supplier
                </button>
              </div>
              <select
                required
                value={formData.supplier_id}
                onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value })}
                className="input"
                style={{ width: '100%' }}
                disabled={loadingSuppliers}
              >
                <option value="">{loadingSuppliers ? 'Loading suppliers...' : 'Select Supplier'}</option>
                {suppliers.map(supplier => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name} {!supplier.is_active && '(Inactive)'}
                  </option>
                ))}
              </select>
              {suppliers.length === 0 && !loadingSuppliers && (
                <p style={{ fontSize: 12, color: '#f59e0b', marginTop: 4 }}>
                  No suppliers found. Click "Create New Supplier" to add one.
                </p>
              )}
            </div>

            {/* Branch Field */}
            <div>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>Branch *</label>
              <select
                required
                value={formData.branch_id}
                onChange={(e) => setFormData({ ...formData, branch_id: e.target.value })}
                className="input"
                style={{ width: '100%' }}
              >
                <option value="">Select Branch</option>
                {branches.map(branch => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Purchase Date */}
            <div>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>Purchase Date *</label>
              <input
                type="date"
                required
                value={formData.purchase_date}
                onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                className="input"
                style={{ width: '100%' }}
              />
            </div>

            {/* Due Date */}
            <div>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>Due Date</label>
              <input
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                className="input"
                style={{ width: '100%' }}
              />
            </div>

            {/* Notes */}
            <div className="full-width">
              <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>Notes</label>
              <textarea
                rows="3"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="input"
                style={{ width: '100%' }}
                placeholder="Any additional notes..."
              />
            </div>
          </div>
        </div>

        {/* Items Section */}
        <div className="card" style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontWeight: 600, fontSize: 16 }}>Items</div>
            <button
              type="button"
              className="btn btn-primary"
              onClick={addItem}
              style={{ display: 'flex', alignItems: 'center', gap: 8 }}
            >
              <Plus style={{ width: 16, height: 16 }} />
              Add Item
            </button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            {formData.items.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 60, backgroundColor: '#f9fafb', borderRadius: 8 }}>
                <div style={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  width: 60,
                  height: 60,
                  backgroundColor: '#f3f4f6',
                  borderRadius: 12,
                  marginBottom: 12
                }}>
                  <Package style={{ width: 30, height: 30, color: '#9ca3af' }} />
                </div>
                <p style={{ color: '#6b7280' }}>No items added. Click "Add Item" to start.</p>
              </div>
            ) : (
              <table className="table" style={{ minWidth: 800, width: '100%' }}>
                <thead>
                  <tr>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Product</th>
                    <th style={{ padding: '12px', textAlign: 'center', width: 80 }}>Unit</th>
                    <th style={{ padding: '12px', textAlign: 'right', width: 100 }}>Bag Wt</th>
                    <th style={{ padding: '12px', textAlign: 'right', width: 100 }}>Quantity</th>
                    <th style={{ padding: '12px', textAlign: 'right', width: 120 }}>Unit Price</th>
                    <th style={{ padding: '12px', textAlign: 'right', width: 120 }}>Total</th>
                    <th style={{ padding: '12px', textAlign: 'center', width: 60 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {formData.items.map((item, index) => (
                    <tr key={item.temp_id || item.id}>
                      <td style={{ padding: '12px' }}>
                        <select
                          required
                          value={item.product_id}
                          onChange={(e) => updateItem(index, 'product_id', e.target.value)}
                          className="input"
                          style={{ width: '100%', minWidth: 150 }}
                        >
                          <option value="">Select Product</option>
                          {products.map(product => (
                            <option key={product.id} value={product.id}>
                              {product.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <select
                          value={item.unit}
                          onChange={(e) => updateItem(index, 'unit', e.target.value)}
                          className="input"
                          style={{ width: 70 }}
                        >
                          <option value="KG">KG</option>
                          <option value="BAG">BAG</option>
                        </select>
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right' }}>
                        {item.unit === 'BAG' ? (
                          <input
                            type="number"
                            step="0.01"
                            value={item.bag_weight_kg}
                            onChange={(e) => updateItem(index, 'bag_weight_kg', e.target.value)}
                            className="input"
                            style={{ width: 80, textAlign: 'right' }}
                            placeholder="kg"
                          />
                        ) : (
                          <span style={{ color: '#9ca3af' }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right' }}>
                        <input
                          type="number"
                          step="0.01"
                          required
                          value={item.quantity}
                          onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                          className="input"
                          style={{ width: 100, textAlign: 'right' }}
                        />
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right' }}>
                        <input
                          type="number"
                          step="0.01"
                          required
                          value={item.unit_price}
                          onChange={(e) => updateItem(index, 'unit_price', e.target.value)}
                          className="input"
                          style={{ width: 120, textAlign: 'right' }}
                        />
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right', fontWeight: 600 }}>
                        {formatCurrency(calculateItemTotal(item))}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
                        >
                          <Trash2 style={{ width: 16, height: 16 }} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot style={{ backgroundColor: '#f9fafb' }}>
                  <tr>
                    <td colSpan="5" style={{ padding: '12px', textAlign: 'right', fontWeight: 600 }}>
                      Total Amount:
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right', fontWeight: 700, fontSize: 16 }}>
                      {formatCurrency(calculateTotal())}
                    </td>
                    
                  </tr>
                </tfoot>
              </table>
            )}
          </div>
        </div>

        {/* Form Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
          <button
            type="button"
            className="btn outline"
            onClick={() => navigate('/purchases')}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: 8 }}
          >
            <Save style={{ width: 16, height: 16 }} />
            {loading ? 'Saving...' : (isEdit ? 'Update Purchase' : 'Save Purchase')}
          </button>
        </div>
      </form>

      {/* Create Supplier Modal */}
      {showSupplierModal && (
        <CreateSupplierModal
          isOpen={showSupplierModal}
          onClose={() => setShowSupplierModal(false)}
          onSupplierCreated={handleSupplierCreated}
        />
      )}

      <style>
        {`
          .grid-2 {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 16px;
          }
          .full-width {
            grid-column: span 2;
          }
          @media (max-width: 768px) {
            .grid-2 {
              grid-template-columns: 1fr;
            }
            .full-width {
              grid-column: span 1;
            }
          }
        `}
      </style>
    </div>
  );
};

export default PurchaseForm;