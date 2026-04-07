import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import transferService from '../services/transferService';

function CreateTransfer({ onSuccess, onCancel }) {
    const [branches, setBranches] = useState([]);
    const [products, setProducts] = useState([]);
    const [formData, setFormData] = useState({
        from_branch: '',
        to_branch: '',
        notes: '',
        items: []
    });
    const [selectedProduct, setSelectedProduct] = useState({ product_id: '', quantity: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        loadBranches();
        loadProducts();
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

    const addItem = () => {
        if (!selectedProduct.product_id || !selectedProduct.quantity) {
            setError('Please select product and enter quantity');
            return;
        }
        
        const product = products.find(p => p.id === parseInt(selectedProduct.product_id));
        
        setFormData(prev => ({
            ...prev,
            items: [...prev.items, {
                product_id: parseInt(selectedProduct.product_id),
                product_name: product.name,
                quantity: parseFloat(selectedProduct.quantity)
            }]
        }));
        
        setSelectedProduct({ product_id: '', quantity: '' });
        setError('');
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
                    quantity: item.quantity
                })),
                notes: formData.notes
            };
            
            await transferService.createTransfer(payload);
            onSuccess();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to create transfer');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="card">
            <h3>Create Stock Transfer</h3>
            
            <form onSubmit={handleSubmit}>
                <div className="grid-2">
                    <div>
                        <label>From Branch *</label>
                        <select
                            value={formData.from_branch}
                            onChange={(e) => setFormData({...formData, from_branch: e.target.value})}
                            required
                        >
                            <option value="">Select Branch</option>
                            {branches.map(b => (
                                <option key={b.id} value={b.id}>{b.name}</option>
                            ))}
                        </select>
                    </div>
                    
                    <div>
                        <label>To Branch *</label>
                        <select
                            value={formData.to_branch}
                            onChange={(e) => setFormData({...formData, to_branch: e.target.value})}
                            required
                        >
                            <option value="">Select Branch</option>
                            {branches.map(b => (
                                <option key={b.id} value={b.id}>{b.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
                
                <div>
                    <label>Add Items</label>
                    <div className="flex gap-2">
                        <select
                            value={selectedProduct.product_id}
                            onChange={(e) => setSelectedProduct({...selectedProduct, product_id: e.target.value})}
                            style={{ flex: 2 }}
                        >
                            <option value="">Select Product</option>
                            {products.map(p => (
                                <option key={p.id} value={p.id}>{p.name} (Stock: {p.stock} {p.unit})</option>
                            ))}
                        </select>
                        <input
                            type="number"
                            step="0.01"
                            placeholder="Quantity"
                            value={selectedProduct.quantity}
                            onChange={(e) => setSelectedProduct({...selectedProduct, quantity: e.target.value})}
                            style={{ flex: 1 }}
                        />
                        <button type="button" className="btn" onClick={addItem}>Add</button>
                    </div>
                </div>
                
                {formData.items.length > 0 && (
                    <div className="card">
                        <h4>Items to Transfer</h4>
                        <table className="table">
                            <thead>
                                <tr><th>Product</th><th>Quantity</th><th></th></tr>
                            </thead>
                            <tbody>
                                {formData.items.map((item, idx) => (
                                    <tr key={idx}>
                                        <td>{item.product_name}</td>
                                        <td>{item.quantity}</td>
                                        <td><button type="button" className="btn-danger" onClick={() => removeItem(idx)}>Remove</button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
                
                <div>
                    <label>Notes (Optional)</label>
                    <textarea
                        value={formData.notes}
                        onChange={(e) => setFormData({...formData, notes: e.target.value})}
                        rows="2"
                    />
                </div>
                
                {error && <div className="error">{error}</div>}
                
                <div className="flex gap-2">
                    <button type="button" className="btn outline" onClick={onCancel}>Cancel</button>
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                        {loading ? 'Creating...' : 'Create Transfer'}
                    </button>
                </div>
            </form>
        </div>
    );
}

export default CreateTransfer;