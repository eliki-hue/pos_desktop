// frontend/components/stock-transfer/DisputeTransfer.js
import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import transferService from './transferService';

function DisputeTransfer({ transfer, onSuccess, onCancel }) {
    const [items, setItems] = useState([]);
    const [disputeReason, setDisputeReason] = useState('');
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [disputeType, setDisputeType] = useState('full'); // full or partial

    useEffect(() => {
        loadTransferItems();
    }, [transfer.id]);

    const loadTransferItems = async () => {
        try {
            const response = await api.get(`/api/stock-transfers/transfers/${transfer.id}/detail/`);
            const itemsData = response.data.items.map(item => ({
                id: item.id,
                product_name: item.product_name,
                unit: item.unit,
                unit_display: item.unit_display,
                quantity_sent: item.quantity_sent,
                quantity_received: item.quantity_received || 0,
                status: item.status,
                dispute_reason: '',
                expected_quantity: item.quantity_sent
            }));
            setItems(itemsData);
        } catch (err) {
            console.error('Failed to load transfer items', err);
            setError('Failed to load transfer items');
        }
    };

    const updateItemDispute = (itemId, field, value) => {
        setItems(prev => prev.map(item => 
            item.id === itemId ? { ...item, [field]: value } : item
        ));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!disputeReason.trim()) {
            setError('Please provide a reason for the dispute');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const disputeData = {
                dispute_reason: disputeReason,
                notes: notes
            };

            if (disputeType === 'partial') {
                // Only dispute specific items
                const disputedItems = items
                    .filter(item => item.dispute_reason)
                    .map(item => ({
                        item_id: item.id,
                        reason: item.dispute_reason,
                        expected_quantity: item.expected_quantity,
                        notes: item.notes || ''
                    }));
                
                if (disputedItems.length === 0) {
                    setError('Please specify which items are disputed');
                    setLoading(false);
                    return;
                }
                
                disputeData.items = disputedItems;
            }

            await transferService.disputeTransfer(transfer.id, disputeData);
            onSuccess();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to dispute transfer');
        } finally {
            setLoading(false);
        }
    };

    const totalSent = items.reduce((sum, item) => sum + item.quantity_sent, 0);
    const totalReceived = items.reduce((sum, item) => sum + item.quantity_received, 0);
    const discrepancy = totalSent - totalReceived;

    return (
        <div className="card" style={{ maxWidth: 800, margin: '0 auto', padding: 24 }}>
            <h2 style={{ marginTop: 0, marginBottom: 8 }}>❗ Dispute Transfer</h2>
            <p style={{ color: '#6b7280', marginBottom: 24 }}>
                Transfer: <strong>{transfer.transfer_number}</strong>
            </p>

            {/* Discrepancy Summary */}
            <div style={{ 
                backgroundColor: '#fef3c7', 
                padding: 16, 
                borderRadius: 8, 
                marginBottom: 24,
                borderLeft: `4px solid ${discrepancy > 0 ? '#f59e0b' : '#10b981'}`
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span>Total Quantity Sent:</span>
                    <strong>{totalSent.toFixed(2)} units</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span>Total Quantity Received:</span>
                    <strong>{totalReceived.toFixed(2)} units</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 8, borderTop: '1px solid #fde68a' }}>
                    <span>Discrepancy:</span>
                    <strong style={{ color: discrepancy > 0 ? '#dc2626' : '#10b981' }}>
                        {discrepancy > 0 ? `${discrepancy.toFixed(2)} units missing` : 'All items received'}
                    </strong>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                {/* Dispute Type Selection */}
                <div style={{ marginBottom: 20 }}>
                    <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Dispute Type *</label>
                    <div style={{ display: 'flex', gap: 16 }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                            <input
                                type="radio"
                                value="full"
                                checked={disputeType === 'full'}
                                onChange={() => setDisputeType('full')}
                            />
                            <span>Full Transfer Dispute</span>
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                            <input
                                type="radio"
                                value="partial"
                                checked={disputeType === 'partial'}
                                onChange={() => setDisputeType('partial')}
                            />
                            <span>Partial Item Dispute</span>
                        </label>
                    </div>
                </div>

                {/* Main Dispute Reason */}
                <div style={{ marginBottom: 20 }}>
                    <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
                        Dispute Reason *
                    </label>
                    <textarea
                        value={disputeReason}
                        onChange={(e) => setDisputeReason(e.target.value)}
                        rows="3"
                        placeholder="Explain why you are disputing this transfer..."
                        style={{
                            width: '100%',
                            padding: '10px 12px',
                            border: '1px solid #d1d5db',
                            borderRadius: 8,
                            fontSize: 14,
                            resize: 'vertical'
                        }}
                        required
                    />
                </div>

                {/* Items Table (for partial disputes) */}
                {disputeType === 'partial' && (
                    <div style={{ marginBottom: 20 }}>
                        <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Disputed Items</label>
                        <div style={{ overflowX: 'auto' }}>
                            <table className="table" style={{ width: '100%' }}>
                                <thead>
                                    <tr>
                                        <th>Product</th>
                                        <th>Sent</th>
                                        <th>Received</th>
                                        <th>Dispute Reason</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.map(item => (
                                        <tr key={item.id}>
                                            <td>
                                                {item.product_name}
                                                <div style={{ fontSize: 11, color: '#666' }}>{item.unit_display}</div>
                                            </td>
                                            <td>{item.quantity_sent} {item.unit === 'KG' ? 'kg' : 'bags'}</td>
                                            <td>
                                                {item.quantity_received > 0 
                                                    ? `${item.quantity_received} ${item.unit === 'KG' ? 'kg' : 'bags'}`
                                                    : '—'}
                                            </td>
                                            <td>
                                                <input
                                                    type="text"
                                                    placeholder="Reason for disputing this item"
                                                    value={item.dispute_reason || ''}
                                                    onChange={(e) => updateItemDispute(item.id, 'dispute_reason', e.target.value)}
                                                    style={{
                                                        width: '100%',
                                                        padding: '6px 8px',
                                                        border: '1px solid #d1d5db',
                                                        borderRadius: 4,
                                                        fontSize: 12
                                                    }}
                                                />
                                                {item.quantity_received < item.quantity_sent && (
                                                    <div style={{ marginTop: 4 }}>
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            placeholder="Expected quantity"
                                                            value={item.expected_quantity || item.quantity_sent}
                                                            onChange={(e) => updateItemDispute(item.id, 'expected_quantity', parseFloat(e.target.value))}
                                                            style={{
                                                                width: '100%',
                                                                padding: '4px 8px',
                                                                border: '1px solid #d1d5db',
                                                                borderRadius: 4,
                                                                fontSize: 11
                                                            }}
                                                        />
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Additional Notes */}
                <div style={{ marginBottom: 20 }}>
                    <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Additional Notes (Optional)</label>
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows="2"
                        placeholder="Any additional information about this dispute..."
                        style={{
                            width: '100%',
                            padding: '10px 12px',
                            border: '1px solid #d1d5db',
                            borderRadius: 8,
                            fontSize: 14,
                            resize: 'vertical'
                        }}
                    />
                </div>

                {/* Error Message */}
                {error && (
                    <div style={{
                        backgroundColor: '#fee2e2',
                        color: '#dc2626',
                        padding: '12px 16px',
                        borderRadius: 8,
                        marginBottom: 20
                    }}>
                        ❌ {error}
                    </div>
                )}

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                    <button type="button" className="btn outline" onClick={onCancel} disabled={loading}>
                        Cancel
                    </button>
                    <button 
                        type="submit" 
                        className="btn btn-danger" 
                        disabled={loading || !disputeReason.trim()}
                        style={{ backgroundColor: '#dc2626' }}
                    >
                        {loading ? 'Submitting Dispute...' : 'Submit Dispute'}
                    </button>
                </div>
            </form>
        </div>
    );
}

export default DisputeTransfer;