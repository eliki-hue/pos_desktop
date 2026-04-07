// frontend/components/stock-transfer/ResolveDispute.js
import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import transferService from './transferService';

function ResolveDispute({ transfer, onSuccess, onCancel }) {
    const [items, setItems] = useState([]);
    const [resolution, setResolution] = useState('ACCEPT_ALL');
    const [resolutionNotes, setResolutionNotes] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [adjustedItems, setAdjustedItems] = useState({});

    useEffect(() => {
        loadTransferDetails();
    }, [transfer.id]);

    const loadTransferDetails = async () => {
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
                dispute_reason: item.dispute_reason
            }));
            setItems(itemsData);
            
            // Initialize adjusted quantities
            const initialAdjusted = {};
            itemsData.forEach(item => {
                initialAdjusted[item.id] = item.quantity_received;
            });
            setAdjustedItems(initialAdjusted);
        } catch (err) {
            console.error('Failed to load transfer details', err);
            setError('Failed to load transfer details');
        }
    };

    const updateAdjustedQuantity = (itemId, value) => {
        const qty = parseFloat(value) || 0;
        setAdjustedItems(prev => ({ ...prev, [itemId]: qty }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const resolveData = {
                resolution: resolution,
                notes: resolutionNotes
            };

            if (resolution === 'ADJUST_QUANTITIES') {
                const adjustedItemsList = items.map(item => ({
                    item_id: item.id,
                    quantity_received: adjustedItems[item.id] || 0,
                    notes: `Adjusted from ${item.quantity_received} to ${adjustedItems[item.id] || 0}`
                }));
                resolveData.adjusted_items = adjustedItemsList;
            }

            await transferService.resolveDispute(transfer.id, resolveData);
            onSuccess();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to resolve dispute');
        } finally {
            setLoading(false);
        }
    };

    const getResolutionDescription = () => {
        switch(resolution) {
            case 'ACCEPT_ALL':
                return 'Accept all items as sent. Stock will be added to destination branch.';
            case 'REJECT_ALL':
                return 'Reject all items. Stock will be returned to source branch.';
            case 'PARTIAL_ACCEPT':
                return 'Partially accept. Current received quantities will be kept.';
            case 'ADJUST_QUANTITIES':
                return 'Manually adjust quantities for each item.';
            default:
                return '';
        }
    };

    const totalSent = items.reduce((sum, item) => sum + item.quantity_sent, 0);
    const totalReceived = items.reduce((sum, item) => sum + item.quantity_received, 0);
    const totalAdjusted = Object.values(adjustedItems).reduce((sum, val) => sum + (val || 0), 0);

    return (
        <div className="card" style={{ maxWidth: 800, margin: '0 auto', padding: 24 }}>
            <h2 style={{ marginTop: 0, marginBottom: 8 }}>⚖️ Resolve Dispute</h2>
            <p style={{ color: '#6b7280', marginBottom: 24 }}>
                Transfer: <strong>{transfer.transfer_number}</strong>
            </p>

            {/* Dispute Summary */}
            <div style={{ 
                backgroundColor: '#fee2e2', 
                padding: 16, 
                borderRadius: 8, 
                marginBottom: 24,
                borderLeft: '4px solid #dc2626'
            }}>
                <div style={{ fontWeight: 500, marginBottom: 8, color: '#991b1b' }}>
                    Dispute Reason
                </div>
                <div style={{ marginBottom: 12 }}>{transfer.dispute_reason || 'No reason provided'}</div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, paddingTop: 12, borderTop: '1px solid #fecaca' }}>
                    <div>
                        <div style={{ fontSize: 11, color: '#991b1b' }}>Sent</div>
                        <div style={{ fontWeight: 500 }}>{totalSent.toFixed(2)} units</div>
                    </div>
                    <div>
                        <div style={{ fontSize: 11, color: '#991b1b' }}>Received</div>
                        <div style={{ fontWeight: 500 }}>{totalReceived.toFixed(2)} units</div>
                    </div>
                    <div>
                        <div style={{ fontSize: 11, color: '#991b1b' }}>Discrepancy</div>
                        <div style={{ fontWeight: 500 }}>{(totalSent - totalReceived).toFixed(2)} units</div>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                {/* Resolution Options */}
                <div style={{ marginBottom: 20 }}>
                    <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Resolution *</label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer', padding: 12, backgroundColor: resolution === 'ACCEPT_ALL' ? '#d1fae5' : 'transparent', borderRadius: 8 }}>
                            <input
                                type="radio"
                                value="ACCEPT_ALL"
                                checked={resolution === 'ACCEPT_ALL'}
                                onChange={() => setResolution('ACCEPT_ALL')}
                                style={{ marginTop: 2 }}
                            />
                            <div>
                                <div style={{ fontWeight: 500 }}>✅ Accept All Items</div>
                                <div style={{ fontSize: 12, color: '#6b7280' }}>Accept all items as sent. Stock will be added to destination branch.</div>
                            </div>
                        </label>

                        <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer', padding: 12, backgroundColor: resolution === 'REJECT_ALL' ? '#fee2e2' : 'transparent', borderRadius: 8 }}>
                            <input
                                type="radio"
                                value="REJECT_ALL"
                                checked={resolution === 'REJECT_ALL'}
                                onChange={() => setResolution('REJECT_ALL')}
                                style={{ marginTop: 2 }}
                            />
                            <div>
                                <div style={{ fontWeight: 500 }}>❌ Reject All Items</div>
                                <div style={{ fontSize: 12, color: '#6b7280' }}>Reject all items. Stock will be returned to source branch.</div>
                            </div>
                        </label>

                        <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer', padding: 12, backgroundColor: resolution === 'PARTIAL_ACCEPT' ? '#fef3c7' : 'transparent', borderRadius: 8 }}>
                            <input
                                type="radio"
                                value="PARTIAL_ACCEPT"
                                checked={resolution === 'PARTIAL_ACCEPT'}
                                onChange={() => setResolution('PARTIAL_ACCEPT')}
                                style={{ marginTop: 2 }}
                            />
                            <div>
                                <div style={{ fontWeight: 500 }}> ⚠️ Partially Accept </div>
                                <div style={{ fontSize: 12, color: '#6b7280' }}>Accept currently received quantities only.</div>
                            </div>
                        </label>

                        <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer', padding: 12, backgroundColor: resolution === 'ADJUST_QUANTITIES' ? '#dbeafe' : 'transparent', borderRadius: 8 }}>
                            <input
                                type="radio"
                                value="ADJUST_QUANTITIES"
                                checked={resolution === 'ADJUST_QUANTITIES'}
                                onChange={() => setResolution('ADJUST_QUANTITIES')}
                                style={{ marginTop: 2 }}
                            />
                            <div>
                                <div style={{ fontWeight: 500 }}>✏️ Adjust Quantities</div>
                                <div style={{ fontSize: 12, color: '#6b7280' }}>Manually adjust quantities for each item.</div>
                            </div>
                        </label>
                    </div>
                </div>

                {/* Items Table for Quantity Adjustment */}
                {resolution === 'ADJUST_QUANTITIES' && (
                    <div style={{ marginBottom: 20 }}>
                        <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Adjust Item Quantities</label>
                        <div style={{ overflowX: 'auto' }}>
                            <table className="table" style={{ width: '100%' }}>
                                <thead>
                                    <tr>
                                        <th>Product</th>
                                        <th>Unit</th>
                                        <th>Sent</th>
                                        <th>Received</th>
                                        <th>Adjusted Quantity</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.map(item => (
                                        <tr key={item.id}>
                                            <td>{item.product_name}</td>
                                            <td>{item.unit_display}</td>
                                            <td>{item.quantity_sent} {item.unit === 'KG' ? 'kg' : 'bags'}</td>
                                            <td>{item.quantity_received} {item.unit === 'KG' ? 'kg' : 'bags'}</td>
                                            <td>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    value={adjustedItems[item.id] || 0}
                                                    onChange={(e) => updateAdjustedQuantity(item.id, e.target.value)}
                                                    style={{
                                                        width: 100,
                                                        padding: '4px 8px',
                                                        border: '1px solid #d1d5db',
                                                        borderRadius: 4
                                                    }}
                                                />
                                                <div style={{ fontSize: 10, color: '#666', marginTop: 2 }}>
                                                    Max: {item.quantity_sent}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr style={{ backgroundColor: '#f9fafb' }}>
                                        <td colSpan="4" style={{ textAlign: 'right', fontWeight: 500 }}>Total Adjusted:</td>
                                        <td><strong>{totalAdjusted.toFixed(2)} units</strong></td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>
                )}

                {/* Resolution Notes */}
                <div style={{ marginBottom: 20 }}>
                    <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Resolution Notes</label>
                    <textarea
                        value={resolutionNotes}
                        onChange={(e) => setResolutionNotes(e.target.value)}
                        rows="3"
                        placeholder="Explain how this dispute is being resolved..."
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

                {/* Resolution Summary */}
                <div style={{ 
                    backgroundColor: '#f0fdf4', 
                    padding: 12, 
                    borderRadius: 8, 
                    marginBottom: 20,
                    border: '1px solid #bbf7d0'
                }}>
                    <div style={{ fontWeight: 500, marginBottom: 8, color: '#166534' }}>📋 Resolution Summary</div>
                    <div style={{ fontSize: 13, color: '#166534' }}>
                        {getResolutionDescription()}
                    </div>
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
                        className="btn btn-primary" 
                        disabled={loading}
                    >
                        {loading ? 'Processing Resolution...' : 'Resolve Dispute'}
                    </button>
                </div>
            </form>
        </div>
    );
}

export default ResolveDispute;