// frontend/components/stock-transfer/ReceiveTransfer.js
import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';

function ReceiveTransfer({ transfer, onSuccess, onCancel }) {
    const [receivedItems, setReceivedItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [loadingTransfer, setLoadingTransfer] = useState(true);

    useEffect(() => {
        loadTransferItems();
    }, []);

    const loadTransferItems = async () => {
        try {
            const response = await api.get(`/api/stock-transfers/transfers/${transfer.id}/detail/`);
            const transferData = response.data;
            
            // Safely extract items with proper null checks
            const items = transferData?.items || [];
            
            // Initialize received items with transfer quantities
            const initialItems = items.map(item => ({
                id: item?.id,
                product_id: item?.product,
                product_name: item?.product_name || 'Unknown Product',
                quantity_sent: parseFloat(item?.quantity_sent) || 0,
                quantity_received: parseFloat(item?.quantity_sent) || 0, // Default to full quantity
                unit: item?.unit || 'KG',
                bag_weight_kg: parseFloat(item?.bag_weight_kg) || 1,
                condition: 'GOOD', // GOOD, DAMAGED, EXPIRED
                notes: ''
            }));
            
            setReceivedItems(initialItems);
        } catch (err) {
            console.error('Failed to load transfer items', err);
            setError('Failed to load transfer details');
            
            // Fallback to transfer prop data
            const fallbackItems = transfer?.items || [];
            setReceivedItems(fallbackItems.map(item => ({
                ...item,
                quantity_received: item.quantity_sent,
                condition: 'GOOD',
                notes: ''
            })));
        } finally {
            setLoadingTransfer(false);
        }
    };

    const updateQuantityReceived = (index, newQuantity) => {
        const updated = [...receivedItems];
        const quantity = parseFloat(newQuantity) || 0;
        const maxQuantity = updated[index].quantity_sent;
        
        if (quantity > maxQuantity) {
            setError(`Received quantity cannot exceed sent quantity (${maxQuantity})`);
            return;
        }
        
        updated[index].quantity_received = quantity;
        setReceivedItems(updated);
        setError('');
    };

    const updateCondition = (index, condition) => {
        const updated = [...receivedItems];
        updated[index].condition = condition;
        setReceivedItems(updated);
    };

    const updateItemNotes = (index, notes) => {
        const updated = [...receivedItems];
        updated[index].notes = notes;
        setReceivedItems(updated);
    };

    const calculateTotalSent = () => {
        return receivedItems.reduce((sum, item) => sum + (item.quantity_sent || 0), 0);
    };

    const calculateTotalReceived = () => {
        return receivedItems.reduce((sum, item) => sum + (item.quantity_received || 0), 0);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Validate all items have received quantity
        const invalidItems = receivedItems.filter(item => 
            item.quantity_received === undefined || 
            item.quantity_received === null || 
            isNaN(item.quantity_received)
        );
        
        if (invalidItems.length > 0) {
            setError('Please enter received quantity for all items');
            return;
        }
        
        setLoading(true);
        setError('');
        
        try {
            const payload = {
                items: receivedItems.map(item => ({
                    item_id: item.id,
                    product_id: item.product_id,
                    quantity_received: item.quantity_received,
                    condition: item.condition,
                    notes: item.notes
                }))
            };
            
            await api.post(`/api/stock-transfers/transfers/${transfer.id}/receive/`, payload);
            onSuccess();
        } catch (err) {
            setError(err.response?.data?.error || err.response?.data?.detail || 'Failed to receive transfer');
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
            <h2>Receive Transfer #{transfer.transfer_number}</h2>
            <p className="muted">Confirm received quantities and condition</p>
            
            <form onSubmit={handleSubmit}>
                {/* Transfer Info */}
                <div style={{ 
                    backgroundColor: '#f0fdf4', 
                    padding: 16, 
                    borderRadius: 8, 
                    marginBottom: 20,
                    borderLeft: '3px solid #10b981'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span><strong>From:</strong> {transfer.from_branch_name || 'N/A'}</span>
                        <span><strong>To:</strong> {transfer.to_branch_name || 'N/A'}</span>
                    </div>
                    <div>
                        <strong>Transfer Date:</strong> {new Date(transfer.created_at).toLocaleDateString()}
                    </div>
                    {transfer.notes && (
                        <div style={{ marginTop: 8, fontSize: 13, color: '#666' }}>
                            <strong>Notes:</strong> {transfer.notes}
                        </div>
                    )}
                </div>

                {/* Items List */}
                <div style={{ marginBottom: 20 }}>
                    <label style={{ fontWeight: 500, display: 'block', marginBottom: 8 }}>Items Received</label>
                    <div className="card" style={{ padding: 16, backgroundColor: '#f9fafb' }}>
                        {receivedItems.length === 0 ? (
                            <p className="muted" style={{ textAlign: 'center', padding: 20 }}>No items to receive</p>
                        ) : (
                            <table className="table" style={{ width: '100%' }}>
                                <thead>
                                    <tr>
                                        <th>Product</th>
                                        <th style={{ width: 100 }}>Sent Qty</th>
                                        <th style={{ width: 120 }}>Received Qty</th>
                                        <th style={{ width: 120 }}>Condition</th>
                                        <th>Notes</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {receivedItems.map((item, idx) => (
                                        <tr key={idx}>
                                            <td>
                                                {item.product_name}
                                                <div style={{ fontSize: 11, color: '#666' }}>{item.unit}</div>
                                            </td>
                                            <td style={{ textAlign: 'center' }}>
                                                {item.quantity_sent} {item.unit}
                                                {item.unit === 'BAG' && ` (${item.bag_weight_kg}kg/bag)`}
                                             </td>
                                            <td>
                                                <input
                                                    type="number"
                                                    value={item.quantity_received}
                                                    onChange={(e) => updateQuantityReceived(idx, e.target.value)}
                                                    step="0.01"
                                                    min="0"
                                                    max={item.quantity_sent}
                                                    style={{ width: 100, padding: 4 }}
                                                    required
                                                />
                                                <span style={{ fontSize: 11, marginLeft: 4 }}>{item.unit}</span>
                                            </td>
                                            <td>
                                                <select
                                                    value={item.condition}
                                                    onChange={(e) => updateCondition(idx, e.target.value)}
                                                    style={{ width: 100, padding: 4 }}
                                                >
                                                    <option value="GOOD">Good</option>
                                                    <option value="DAMAGED">Damaged</option>
                                                    <option value="EXPIRED">Expired</option>
                                                </select>
                                            </td>
                                            <td>
                                                <input
                                                    type="text"
                                                    value={item.notes || ''}
                                                    onChange={(e) => updateItemNotes(idx, e.target.value)}
                                                    placeholder="Optional notes"
                                                    style={{ width: '100%', padding: 4 }}
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot style={{ backgroundColor: '#f3f4f6' }}>
                                    <tr>
                                        <td style={{ textAlign: 'right', fontWeight: 500 }}>Totals:</td>
                                        <td style={{ textAlign: 'center' }}>{calculateTotalSent().toFixed(2)}</td>
                                        <td>{calculateTotalReceived().toFixed(2)}</td>
                                        <td colSpan="2"></td>
                                    </tr>
                                </tfoot>
                            </table>
                        )}
                    </div>
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
                        {loading ? 'Processing...' : 'Confirm Receipt'}
                    </button>
                </div>
            </form>
        </div>
    );
}

export default ReceiveTransfer;