// frontend/components/stock-transfer/RaiseDispute.js
import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';

function DisputeTransfer({ transfer, onSuccess, onCancel }) {
    const [items, setItems] = useState([]);
    const [disputeReason, setDisputeReason] = useState('');
    const [disputeType, setDisputeType] = useState('QUANTITY_MISMATCH');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [loadingTransfer, setLoadingTransfer] = useState(true);
    const [selectedItems, setSelectedItems] = useState({});

    useEffect(() => {
        loadTransferItems();
    }, []);

    const loadTransferItems = async () => {
        try {
            const response = await api.get(`/api/stock-transfers/transfers/${transfer.id}/detail/`);
            const transferData = response.data;
            
            // Safely extract items with proper null checks
            const transferItems = transferData?.items || [];
            
            const parsedItems = transferItems.map(item => ({
                id: item?.id,
                product_id: item?.product,
                product_name: item?.product_name || 'Unknown Product',
                // Convert string numbers to actual numbers
                quantity_sent: typeof item?.quantity_sent === 'string' ? parseFloat(item.quantity_sent) : (item?.quantity_sent || 0),
                quantity_received: typeof item?.quantity_received === 'string' ? parseFloat(item.quantity_received) : (item?.quantity_received || 0),
                unit: item?.unit || 'KG',
                bag_weight_kg: typeof item?.bag_weight_kg === 'string' ? parseFloat(item.bag_weight_kg) : (item?.bag_weight_kg || 1),
                status: item?.status || 'PENDING',
                status_display: item?.status_display || 'Pending'
            }));
            
            setItems(parsedItems);
            
            // Initialize selected items state
            const initialSelected = {};
            parsedItems.forEach(item => {
                initialSelected[item.id] = false;
            });
            setSelectedItems(initialSelected);
        } catch (err) {
            console.error('Failed to load transfer items', err);
            setError('Failed to load transfer details');
            
            // Fallback to transfer prop data
            const fallbackItems = transfer?.items || [];
            const parsedFallbackItems = fallbackItems.map(item => ({
                ...item,
                quantity_sent: typeof item?.quantity_sent === 'string' ? parseFloat(item.quantity_sent) : (item?.quantity_sent || 0),
                quantity_received: typeof item?.quantity_received === 'string' ? parseFloat(item.quantity_received) : (item?.quantity_received || 0)
            }));
            setItems(parsedFallbackItems);
        } finally {
            setLoadingTransfer(false);
        }
    };

    const toggleItemSelection = (itemId) => {
        setSelectedItems(prev => ({
            ...prev,
            [itemId]: !prev[itemId]
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Validate dispute reason
        if (!disputeReason.trim()) {
            setError('Please provide a reason for the dispute');
            return;
        }
        
        // Get selected items
        const disputedItems = items.filter(item => selectedItems[item.id]);
        
        if (disputedItems.length === 0) {
            setError('Please select at least one item to dispute');
            return;
        }
        
        setLoading(true);
        setError('');
        
        try {
            const payload = {
                transfer_id: transfer.id,
                dispute_type: disputeType,
                dispute_reason: disputeReason,
                items: disputedItems.map(item => ({
                    item_id: item.id,
                    product_id: item.product_id,
                    product_name: item.product_name,
                    quantity_sent: item.quantity_sent,
                    quantity_received: item.quantity_received || 0,
                    unit: item.unit
                }))
            };
            
            await api.post(`/api/stock-transfers/transfers/${transfer.id}/dispute/`, payload);
            onSuccess();
        } catch (err) {
            setError(err.response?.data?.error || err.response?.data?.detail || 'Failed to raise dispute');
        } finally {
            setLoading(false);
        }
    };

    // Helper function to safely format numbers (handles both string and number inputs)
    const formatNumber = (value, decimals = 2) => {
        if (value === undefined || value === null) return '0.00';
        let num;
        if (typeof value === 'string') {
            num = parseFloat(value);
        } else {
            num = value;
        }
        if (isNaN(num)) return '0.00';
        return num.toFixed(decimals);
    };

    // Calculate difference safely
    const calculateDifference = (sent, received) => {
        const sentNum = typeof sent === 'string' ? parseFloat(sent) : (sent || 0);
        const receivedNum = typeof received === 'string' ? parseFloat(received) : (received || 0);
        return sentNum - receivedNum;
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
            <h2>Raise Dispute for Transfer #{transfer.transfer_number}</h2>
            <p className="muted">Report issues with received items</p>
            
            <form onSubmit={handleSubmit}>
                {/* Transfer Info */}
                <div style={{ 
                    backgroundColor: '#fef3c7', 
                    padding: 16, 
                    borderRadius: 8, 
                    marginBottom: 20,
                    borderLeft: '3px solid #f59e0b'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span><strong>From:</strong> {transfer.from_branch_name || transfer.from_branch?.name || 'N/A'}</span>
                        <span><strong>To:</strong> {transfer.to_branch_name || transfer.to_branch?.name || 'N/A'}</span>
                    </div>
                    <div style={{ marginBottom: 8 }}>
                        <strong>Transfer Date:</strong> {transfer.created_at ? new Date(transfer.created_at).toLocaleDateString() : 'N/A'}
                    </div>
                    <div style={{ marginBottom: 8 }}>
                        <strong>Status:</strong> <span style={{ color: '#f59e0b' }}>{transfer.status_display || transfer.status}</span>
                    </div>
                    {transfer.notes && (
                        <div style={{ fontSize: 13, color: '#666' }}>
                            <strong>Notes:</strong> {transfer.notes}
                        </div>
                    )}
                </div>

                {/* Dispute Type */}
                <div style={{ marginBottom: 20 }}>
                    <label style={{ fontWeight: 500, display: 'block', marginBottom: 8 }}>Dispute Type *</label>
                    <select
                        value={disputeType}
                        onChange={(e) => setDisputeType(e.target.value)}
                        className="input"
                        style={{ width: '100%', padding: 8 }}
                        required
                    >
                        <option value="QUANTITY_MISMATCH">Quantity Mismatch</option>
                        <option value="DAMAGED_GOODS">Damaged Goods</option>
                        <option value="EXPIRED_GOODS">Expired Goods</option>
                        <option value="WRONG_PRODUCT">Wrong Product</option>
                        <option value="QUALITY_ISSUE">Quality Issue</option>
                        <option value="OTHER">Other</option>
                    </select>
                </div>

                {/* Items Selection */}
                <div style={{ marginBottom: 20 }}>
                    <label style={{ fontWeight: 500, display: 'block', marginBottom: 8 }}>Select Items to Dispute *</label>
                    <div className="card" style={{ padding: 16, backgroundColor: '#f9fafb' }}>
                        {items.length === 0 ? (
                            <p className="muted" style={{ textAlign: 'center', padding: 20 }}>No items found</p>
                        ) : (
                            <table className="table" style={{ width: '100%' }}>
                                <thead>
                                    <tr>
                                        <th style={{ width: 40 }}>Select</th>
                                        <th>Product</th>
                                        <th style={{ width: 100 }}>Sent</th>
                                        <th style={{ width: 100 }}>Received</th>
                                        <th style={{ width: 80 }}>Unit</th>
                                        <th style={{ width: 100 }}>Difference</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.map((item) => {
                                        const quantitySent = item.quantity_sent;
                                        const quantityReceived = item.quantity_received;
                                        const difference = calculateDifference(quantitySent, quantityReceived);
                                        const isDisputed = selectedItems[item.id];
                                        
                                        return (
                                            <tr key={item.id} style={{ backgroundColor: isDisputed ? '#fef3c7' : 'transparent' }}>
                                                <td style={{ textAlign: 'center' }}>
                                                    <input
                                                        type="checkbox"
                                                        checked={isDisputed}
                                                        onChange={() => toggleItemSelection(item.id)}
                                                    />
                                                </td>
                                                <td>{item.product_name}</td>
                                                <td style={{ textAlign: 'center' }}>{formatNumber(quantitySent)}</td>
                                                <td style={{ textAlign: 'center' }}>{formatNumber(quantityReceived)}</td>
                                                <td style={{ textAlign: 'center' }}>{item.unit}</td>
                                                <td style={{ textAlign: 'center', color: difference !== 0 ? '#dc2626' : '#10b981' }}>
                                                    {difference !== 0 ? `${formatNumber(Math.abs(difference))} short` : 'Match'}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>

                {/* Dispute Reason */}
                <div style={{ marginBottom: 20 }}>
                    <label style={{ fontWeight: 500, display: 'block', marginBottom: 8 }}>Dispute Reason *</label>
                    <textarea
                        value={disputeReason}
                        onChange={(e) => setDisputeReason(e.target.value)}
                        rows="4"
                        className="input"
                        style={{ width: '100%', padding: 8 }}
                        placeholder="Please provide detailed explanation of the issue..."
                        required
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
                        {loading ? 'Submitting...' : 'Raise Dispute'}
                    </button>
                </div>
            </form>
        </div>
    );
}

export default DisputeTransfer;