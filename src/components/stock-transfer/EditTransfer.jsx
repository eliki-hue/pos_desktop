// frontend/components/stock-transfer/EditTransfer.js
import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import transferService from './transferService';

function EditTransfer({ transfer, onSuccess, onCancel }) {
    const [branches, setBranches] = useState([]);
    const [products, setProducts] = useState([]);
    const [formData, setFormData] = useState({
        from_branch: transfer.from_branch?.id || '',
        to_branch: transfer.to_branch?.id || '',
        notes: transfer.notes || '',
        items: []
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [loadingTransfer, setLoadingTransfer] = useState(true);

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
            const items = response.data.items.map(item => ({
                product_id: item.product,
                product_name: item.product_name,
                quantity: item.quantity_sent,
                unit: item.unit,
                kg_equivalent: item.unit === 'KG' ? item.quantity_sent : item.quantity_sent * (item.bag_weight_kg || 1)
            }));
            setFormData(prev => ({ ...prev, items }));
        } catch (err) {
            console.error('Failed to load transfer items', err);
        } finally {
            setLoadingTransfer(false);
        }
    };

    const addItem = (item) => {
        setFormData(prev => ({
            ...prev,
            items: [...prev.items, item]
        }));
    };

    const removeItem = (index) => {
        setFormData(prev => ({
            ...prev,
            items: prev.items.filter((_, i) => i !== index)
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
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
                notes: formData.notes
            };
            
            await transferService.updateTransfer(transfer.id, payload);
            onSuccess();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to update transfer');
        } finally {
            setLoading(false);
        }
    };

    if (loadingTransfer) {
        return <div className="card" style={{ textAlign: 'center', padding: 40 }}>Loading transfer details...</div>;
    }

    return (
        <div className="card" style={{ maxWidth: 800, margin: '0 auto', padding: 24 }}>
            <h2>Edit Transfer #{transfer.transfer_number}</h2>
            
            <form onSubmit={handleSubmit}>
                <div className="grid-2">
                    <div>
                        <label>Source Branch *</label>
                        <select
                            value={formData.from_branch}
                            onChange={(e) => setFormData({...formData, from_branch: e.target.value})}
                            required
                            className="input"
                        >
                            <option value="">Select Branch</option>
                            {branches.map(b => (
                                <option key={b.id} value={b.id}>{b.name}</option>
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
                        >
                            <option value="">Select Branch</option>
                            {branches.map(b => (
                                <option key={b.id} value={b.id}>{b.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Items List - Simplified for edit */}
                <div>
                    <label>Items to Transfer</label>
                    <div className="card" style={{ marginTop: 8, padding: 16 }}>
                        {formData.items.map((item, idx) => (
                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                <span>{item.product_name} - {item.quantity} {item.unit === 'KG' ? 'kg' : 'bags'}</span>
                                <button type="button" className="btn-danger" onClick={() => removeItem(idx)}>Remove</button>
                            </div>
                        ))}
                        <button type="button" className="btn btn-primary" onClick={() => alert('Add item functionality - implement similar to CreateTransfer')}>
                            + Add Item
                        </button>
                    </div>
                </div>

                <div>
                    <label>Notes</label>
                    <textarea
                        value={formData.notes}
                        onChange={(e) => setFormData({...formData, notes: e.target.value})}
                        rows="3"
                        className="input"
                    />
                </div>

                {error && <div className="error">{error}</div>}

                <div className="flex gap-2" style={{ marginTop: 20 }}>
                    <button type="button" className="btn outline" onClick={onCancel}>Cancel</button>
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                        {loading ? 'Updating...' : 'Update Transfer'}
                    </button>
                </div>
            </form>
        </div>
    );
}

export default EditTransfer;