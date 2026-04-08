// frontend/components/stock-transfer/EditTransfer.js
import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import transferService from './transferService';

function EditTransfer({ transfer, onSuccess, onCancel }) {
    const [branches, setBranches] = useState([]);
    const [products, setProducts] = useState([]);
    const [availableProducts, setAvailableProducts] = useState([]);
    const [formData, setFormData] = useState({
        from_branch: '',
        to_branch: '',
        notes: '',
        items: []
    });
    const [newItem, setNewItem] = useState({
        product_id: '',
        product_name: '',
        quantity: '',
        unit: 'KG',
        bag_weight_kg: 1
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [loadingTransfer, setLoadingTransfer] = useState(true);
    const [showAddItem, setShowAddItem] = useState(false);

    useEffect(() => {
        loadBranches();
        loadProducts();
        loadTransferItems();
    }, []);

    const loadBranches = async () => {
        try {
            const res = await api.get('/api/branches/');
            setBranches(res.data);
        } catch (err) {
            console.error('Failed to load branches', err);
        }
    };

    const loadProducts = async () => {
        try {
            const res = await api.get('/api/products/');
            setProducts(res.data);
        } catch (err) {
            console.error('Failed to load products', err);
        }
    };

    const loadTransferItems = async () => {
        try {
            const response = await api.get(`/api/stock-transfers/transfers/${transfer.id}/detail/`);
            const transferData = response.data;
            
            // Pre-fill form with existing data
            setFormData({
                from_branch: transferData.from_branch?.id || transfer.from_branch?.id || '',
                to_branch: transferData.to_branch?.id || transfer.to_branch?.id || '',
                notes: transferData.notes || transfer.notes || '',
                items: (transferData.items || []).map(item => ({
                    id: item.id,
                    product_id: item.product,
                    product_name: item.product_name,
                    quantity: parseFloat(item.quantity_sent) || 0,
                    unit: item.unit || 'KG',
                    kg_equivalent: item.unit === 'KG' 
                        ? parseFloat(item.quantity_sent) || 0
                        : (parseFloat(item.quantity_sent) || 0) * (parseFloat(item.bag_weight_kg) || 1),
                    bag_weight_kg: parseFloat(item.bag_weight_kg) || 1
                }))
            });
        } catch (err) {
            console.error('Failed to load transfer items', err);
            // Fallback to transfer prop data
            if (transfer.items) {
                setFormData(prev => ({
                    ...prev,
                    items: transfer.items.map(item => ({
                        ...item,
                        quantity: parseFloat(item.quantity) || 0,
                        kg_equivalent: item.unit === 'KG' 
                            ? parseFloat(item.quantity) || 0
                            : (parseFloat(item.quantity) || 0) * (parseFloat(item.bag_weight_kg) || 1)
                    }))
                }));
            }
        } finally {
            setLoadingTransfer(false);
        }
    };

    // Filter products that are not already in the transfer
    useEffect(() => {
        const existingProductIds = formData.items.map(item => item.product_id);
        const filtered = products.filter(product => !existingProductIds.includes(product.id));
        setAvailableProducts(filtered);
    }, [products, formData.items]);

    const addItem = () => {
        if (!newItem.product_id) {
            setError('Please select a product');
            return;
        }
        
        if (!newItem.quantity || parseFloat(newItem.quantity) <= 0) {
            setError('Please enter a valid quantity');
            return;
        }
        
        const selectedProduct = products.find(p => p.id === parseInt(newItem.product_id));
        const quantity = parseFloat(newItem.quantity);
        const bagWeight = parseFloat(newItem.bag_weight_kg) || 1;
        
        const itemToAdd = {
            product_id: selectedProduct.id,
            product_name: selectedProduct.name,
            quantity: quantity,
            unit: newItem.unit,
            bag_weight_kg: bagWeight,
            kg_equivalent: newItem.unit === 'KG' 
                ? quantity 
                : quantity * bagWeight
        };
        
        setFormData(prev => ({
            ...prev,
            items: [...prev.items, itemToAdd]
        }));
        
        // Reset new item form
        setNewItem({
            product_id: '',
            product_name: '',
            quantity: '',
            unit: 'KG',
            bag_weight_kg: 1
        });
        setShowAddItem(false);
        setError('');
    };

    const removeItem = (index) => {
        setFormData(prev => ({
            ...prev,
            items: prev.items.filter((_, i) => i !== index)
        }));
    };

    const updateItemQuantity = (index, newQuantity) => {
        const updatedItems = [...formData.items];
        const item = updatedItems[index];
        const quantity = parseFloat(newQuantity) || 0;
        item.quantity = quantity;
        item.kg_equivalent = item.unit === 'KG' 
            ? quantity 
            : quantity * (item.bag_weight_kg || 1);
        setFormData(prev => ({ ...prev, items: updatedItems }));
    };

    const updateItemUnit = (index, newUnit) => {
        const updatedItems = [...formData.items];
        const item = updatedItems[index];
        item.unit = newUnit;
        item.kg_equivalent = newUnit === 'KG' 
            ? item.quantity 
            : item.quantity * (item.bag_weight_kg || 1);
        setFormData(prev => ({ ...prev, items: updatedItems }));
    };

    const calculateTotalKg = () => {
        return formData.items.reduce((sum, item) => {
            const kgValue = typeof item.kg_equivalent === 'number' ? item.kg_equivalent : 0;
            return sum + kgValue;
        }, 0);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.from_branch) {
            setError('Please select source branch');
            return;
        }
        
        if (!formData.to_branch) {
            setError('Please select destination branch');
            return;
        }
        
        if (formData.from_branch === formData.to_branch) {
            setError('Source and destination branches cannot be the same');
            return;
        }
        
        if (formData.items.length === 0) {
            setError('Please add at least one item');
            return;
        }
        
        setLoading(true);
        setError('');
        
        try {
            const payload = {
                from_branch: parseInt(formData.from_branch),
                to_branch: parseInt(formData.to_branch),
                items: formData.items.map(item => ({
                    product_id: item.product_id,
                    quantity: item.quantity,
                    unit: item.unit
                })),
                notes: formData.notes || ''
            };
            
            await transferService.updateTransfer(transfer.id, payload);
            onSuccess();
        } catch (err) {
            setError(err.response?.data?.error || err.response?.data?.detail || 'Failed to update transfer');
        } finally {
            setLoading(false);
        }
    };

    if (loadingTransfer) {
        return (
            <div className="card" style={{ textAlign: 'center', padding: 40 }}>
                <div className="spinner"></div>
                <p>Loading transfer details...</p>
            </div>
        );
    }

    return (
        <div className="card" style={{ maxWidth: 900, margin: '0 auto', padding: 24 }}>
            <h2>Edit Transfer #{transfer.transfer_number}</h2>
            <p className="muted">Update transfer details below</p>
            
            <form onSubmit={handleSubmit}>
                {/* Branch Selection */}
                <div className="grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                    <div>
                        <label>Source Branch *</label>
                        <select
                            value={formData.from_branch}
                            onChange={(e) => setFormData({...formData, from_branch: e.target.value})}
                            required
                            className="input"
                            style={{ width: '100%', padding: 8 }}
                        >
                            <option value="">Select Source Branch</option>
                            {branches.map(b => (
                                <option key={b.id} value={b.id}>
                                    {b.name} {b.is_main_branch ? '(Main)' : ''}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label>Destination Branch *</label>
                        <select
                            value={formData.to_branch}
                            onChange={(e) => setFormData({...formData, to_branch: e.target.value})}
                            required
                            className="input"
                            style={{ width: '100%', padding: 8 }}
                        >
                            <option value="">Select Destination Branch</option>
                            {branches.filter(b => b.id !== parseInt(formData.from_branch)).map(b => (
                                <option key={b.id} value={b.id}>
                                    {b.name} {b.is_main_branch ? '(Main)' : ''}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Items List */}
                <div style={{ marginBottom: 20 }}>
                    <label style={{ fontWeight: 500, display: 'block', marginBottom: 8 }}>Items to Transfer</label>
                    <div className="card" style={{ padding: 16, backgroundColor: '#f9fafb' }}>
                        {formData.items.length === 0 ? (
                            <p className="muted" style={{ textAlign: 'center', padding: 20 }}>No items added yet</p>
                        ) : (
                            <table className="table" style={{ width: '100%' }}>
                                <thead>
                                    <tr>
                                        <th>Product</th>
                                        <th style={{ width: 100 }}>Quantity</th>
                                        <th style={{ width: 100 }}>Unit</th>
                                        <th style={{ width: 120 }}>KG Equivalent</th>
                                        <th style={{ width: 80 }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {formData.items.map((item, idx) => (
                                        <tr key={idx}>
                                            <td>{item.product_name}</td>
                                            <td>
                                                <input
                                                    type="number"
                                                    value={item.quantity}
                                                    onChange={(e) => updateItemQuantity(idx, e.target.value)}
                                                    step="0.01"
                                                    min="0.01"
                                                    style={{ width: 80, padding: 4 }}
                                                />
                                            </td>
                                            <td>
                                                <select
                                                    value={item.unit}
                                                    onChange={(e) => updateItemUnit(idx, e.target.value)}
                                                    style={{ width: 70, padding: 4 }}
                                                >
                                                    <option value="KG">KG</option>
                                                    <option value="BAG">BAG</option>
                                                </select>
                                            </td>
                                            <td style={{ fontSize: 12, color: '#666' }}>
                                                {typeof item.kg_equivalent === 'number' 
                                                    ? item.kg_equivalent.toFixed(2) 
                                                    : parseFloat(item.kg_equivalent || 0).toFixed(2)} kg
                                            </td>
                                            <td>
                                                <button
                                                    type="button"
                                                    className="btn-danger"
                                                    onClick={() => removeItem(idx)}
                                                    style={{ padding: '4px 8px', fontSize: 12 }}
                                                >
                                                    Remove
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr style={{ backgroundColor: '#f3f4f6' }}>
                                        <td colSpan="3" style={{ textAlign: 'right', fontWeight: 500 }}>
                                            Total KG:
                                        </td>
                                        <td colSpan="2">
                                            {calculateTotalKg().toFixed(2)} kg
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        )}
                        
                        {!showAddItem ? (
                            <button
                                type="button"
                                className="btn outline"
                                onClick={() => setShowAddItem(true)}
                                style={{ marginTop: 12, width: '100%' }}
                            >
                                + Add Item
                            </button>
                        ) : (
                            <div style={{ marginTop: 12, padding: 12, backgroundColor: 'white', borderRadius: 6 }}>
                                <h4 style={{ marginBottom: 12 }}>Add New Item</h4>
                                <div className="grid-3" style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 12 }}>
                                    <div>
                                        <label>Product</label>
                                        <select
                                            value={newItem.product_id}
                                            onChange={(e) => setNewItem({...newItem, product_id: e.target.value})}
                                            className="input"
                                            style={{ width: '100%' }}
                                        >
                                            <option value="">Select Product</option>
                                            {availableProducts.map(p => (
                                                <option key={p.id} value={p.id}>{p.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label>Quantity</label>
                                        <input
                                            type="number"
                                            value={newItem.quantity}
                                            onChange={(e) => setNewItem({...newItem, quantity: e.target.value})}
                                            step="0.01"
                                            min="0.01"
                                            className="input"
                                            style={{ width: 100 }}
                                        />
                                    </div>
                                    <div>
                                        <label>Unit</label>
                                        <select
                                            value={newItem.unit}
                                            onChange={(e) => setNewItem({...newItem, unit: e.target.value})}
                                            className="input"
                                            style={{ width: 80 }}
                                        >
                                            <option value="KG">KG</option>
                                            <option value="BAG">BAG</option>
                                        </select>
                                    </div>
                                </div>
                                {newItem.unit === 'BAG' && (
                                    <div style={{ marginTop: 12 }}>
                                        <label>Bag Weight (KG)</label>
                                        <input
                                            type="number"
                                            value={newItem.bag_weight_kg}
                                            onChange={(e) => setNewItem({...newItem, bag_weight_kg: parseFloat(e.target.value)})}
                                            step="0.5"
                                            min="0.5"
                                            className="input"
                                            style={{ width: 150 }}
                                        />
                                    </div>
                                )}
                                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                                    <button type="button" className="btn" onClick={addItem}>Add</button>
                                    <button type="button" className="btn outline" onClick={() => setShowAddItem(false)}>Cancel</button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Notes */}
                <div style={{ marginBottom: 20 }}>
                    <label>Notes (Optional)</label>
                    <textarea
                        value={formData.notes}
                        onChange={(e) => setFormData({...formData, notes: e.target.value})}
                        rows="3"
                        className="input"
                        style={{ width: '100%', padding: 8 }}
                        placeholder="Additional notes about this transfer..."
                    />
                </div>

                {error && (
                    <div className="error" style={{ color: '#dc2626', padding: 10, backgroundColor: '#fee2e2', borderRadius: 6, marginBottom: 16 }}>
                        ❌ {error}
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2" style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 20 }}>
                    <button type="button" className="btn outline" onClick={onCancel} disabled={loading}>
                        Cancel
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                        {loading ? 'Updating...' : 'Update Transfer'}
                    </button>
                </div>
            </form>
        </div>
    );
}

export default EditTransfer;