
// frontend/components/stock-transfer/ResolveDispute.js
import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';

function ResolveDispute({ transfer, onSuccess, onCancel }) {
    const [resolutionNotes, setResolutionNotes] = useState('');
    const [resolutionType, setResolutionType] = useState('PARTIAL_APPROVAL'); // ✅ FIXED
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [loadingTransfer, setLoadingTransfer] = useState(true);
    const [transferData, setTransferData] = useState(null);

    const getResolutionValue = (type) => {
        switch(type) {
            case 'FULL_APPROVAL':
                return 'ACCEPT_ALL';
            case 'PARTIAL_APPROVAL':
                return 'ADJUST_QUANTITIES';
            case 'REJECTION':
                return 'REJECT_ALL';
            default:
                return 'ADJUST_QUANTITIES';
        }
    };

    useEffect(() => {
        loadTransferDetails();
    }, []);

    const loadTransferDetails = async () => {
        if (!transfer || !transfer.id) {
            setError('Invalid transfer data. Please try again.');
            setLoadingTransfer(false);
            return;
        }

        try {
            const response = await api.get(`/api/stock-transfers/transfers/${transfer.id}/detail/`);
            const data = response.data;
            setTransferData(data);
            
            const transferItems = data?.items || [];
            const parsedItems = transferItems.map(item => ({
                id: item?.id,
                product_id: item?.product,
                product_name: item?.product_name || 'Unknown Product',
                quantity_sent: parseFloat(item?.quantity_sent) || 0,
                quantity_received: parseFloat(item?.quantity_received) || 0,
                unit: item?.unit || 'KG',
                adjusted_quantity: parseFloat(item?.quantity_sent) || 0,
                resolution_notes: ''
            }));
            
            setItems(parsedItems);
            
            if (data.dispute_reason) {
                setResolutionNotes(`Regarding: ${data.dispute_reason}\n\n`);
            } else if (transfer.dispute_reason) {
                setResolutionNotes(`Regarding: ${transfer.dispute_reason}\n\n`);
            }
        } catch (err) {
            setError('Failed to load transfer details');
        } finally {
            setLoadingTransfer(false);
        }
    };

    const updateAdjustedQuantity = (index, newQuantity) => {
        const updated = [...items];
        const quantity = parseFloat(newQuantity) || 0;
        const maxQuantity = updated[index].quantity_sent;

        if (quantity > maxQuantity) {
            setError(`Adjusted quantity cannot exceed sent quantity (${maxQuantity})`);
            return;
        }

        updated[index].adjusted_quantity = quantity;
        setItems(updated);
        setError('');
    };

    const updateItemNotes = (index, notes) => {
        const updated = [...items];
        updated[index].resolution_notes = notes;
        setItems(updated);
    };

    const formatNumber = (value, decimals = 2) => {
        if (value === undefined || value === null) return '0.00';
        const num = parseFloat(value);
        if (isNaN(num)) return '0.00';
        return num.toFixed(decimals);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!resolutionNotes.trim()) {
            setError('Please provide resolution notes');
            return;
        }

        if (!transfer || !transfer.id) {
            setError('Invalid transfer data');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const resolutionValue = getResolutionValue(resolutionType);

            const payload = {
                resolution: resolutionValue,
                resolution_notes: resolutionNotes,
            };

            if (resolutionValue === 'ADJUST_QUANTITIES') {
                const adjustedItems = items
                    .filter(item => item.adjusted_quantity !== item.quantity_sent) // ✅ only changed
                    .map(item => ({
                        item_id: item.id,
                        quantity_received: item.adjusted_quantity,
                        notes: item.resolution_notes || ''
                    }));

                if (adjustedItems.length === 0) {
                    setError('No adjustments made');
                    setLoading(false);
                    return;
                }

                payload.adjusted_items = adjustedItems;
            }

            await api.post(
                `/api/stock-transfers/transfers/${transfer.id}/resolve-dispute/`,
                payload
            );

            onSuccess();

        } catch (err) {
            setError(
                err.response?.data?.error ||
                err.response?.data?.detail ||
                'Failed to resolve dispute'
            );
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

    const transferNumber = transfer?.transfer_number || transferData?.transfer_number || 'N/A';
    const fromBranch = transfer?.from_branch_name || transferData?.from_branch_name || 'N/A';
    const toBranch = transfer?.to_branch_name || transferData?.to_branch_name || 'N/A';
    const disputeReason = transfer?.dispute_reason || transferData?.dispute_reason || 'No reason provided';
    const driverName = transfer?.driver_name || transferData?.driver_name || 'N/A';
    const driverPhone = transfer?.driver_phone || transferData?.driver_phone || 'N/A';

    return (
        <div className="card" style={{ maxWidth: 900, margin: '0 auto', padding: 24 }}>
            <h2>Resolve Dispute for Transfer #{transferNumber}</h2>
            <p className="muted">Review and resolve the disputed items</p>
            
            <form onSubmit={handleSubmit}>
                <div style={{ 
                    backgroundColor: '#fee2e2', 
                    padding: 16, 
                    borderRadius: 8, 
                    marginBottom: 20,
                    borderLeft: '3px solid #dc2626'
                }}>
                    <div style={{ marginBottom: 8 }}>
                        <strong>Transfer:</strong> {transferNumber}
                    </div>
                    <div style={{ marginBottom: 8 }}>
                        <strong>From:</strong> {fromBranch} → <strong>To:</strong> {toBranch}
                    </div>
                    <div style={{ marginBottom: 8 }}>
                        <strong>Driver:</strong> {driverName} ({driverPhone})
                    </div>
                    <div style={{ marginBottom: 8 }}>
                        <strong>Dispute Reason:</strong> <span style={{ color: '#dc2626' }}>{disputeReason}</span>
                    </div>
                    <div>
                        <strong>Status:</strong> <span style={{ color: '#f59e0b' }}>Disputed - Needs Resolution</span>
                    </div>
                </div>

                <div style={{ marginBottom: 20 }}>
                    <label style={{ fontWeight: 500, display: 'block', marginBottom: 8 }}>Resolution Type *</label>
                    <select
                        value={resolutionType}
                        onChange={(e) => setResolutionType(e.target.value)}
                        className="input"
                        style={{ width: '100%', padding: 8 }}
                        required
                    >
                        <option value="FULL_APPROVAL">Full Approval - Accept all items as is</option>
                        <option value="PARTIAL_APPROVAL">Partial Approval - Adjust quantities</option>
                        <option value="REJECTION">Rejection - Reject the disputed items</option>
                    </select>
                </div>

                {resolutionType === 'PARTIAL_APPROVAL' && (
                    <div style={{ marginBottom: 20 }}>
                        <label style={{ fontWeight: 500, display: 'block', marginBottom: 8 }}>Adjust Item Quantities</label>
                        <div className="card" style={{ padding: 16, backgroundColor: '#f9fafb' }}>
                            {items.length === 0 ? (
                                <p className="muted" style={{ textAlign: 'center', padding: 20 }}>No items found</p>
                            ) : (
                                <table className="table" style={{ width: '100%' }}>
                                    <thead>
                                        <tr>
                                            <th>Product</th>
                                            <th style={{ width: 100 }}>Sent</th>
                                            <th style={{ width: 100 }}>Received</th>
                                            <th style={{ width: 120 }}>Accepted Qty</th>
                                            <th>Notes</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {items.map((item, idx) => {
                                            const received = item.quantity_received;
                                            const sent = item.quantity_sent;
                                            const isShort = received < sent;
                                            
                                            return (
                                                <tr key={item.id} style={{ backgroundColor: isShort ? '#fef3c7' : 'transparent' }}>
                                                    <td>{item.product_name}</td>
                                                    <td style={{ textAlign: 'center' }}>{formatNumber(sent)} {item.unit}</td>
                                                    <td style={{ textAlign: 'center', color: isShort ? '#dc2626' : '#10b981' }}>
                                                        {formatNumber(received)} {item.unit}
                                                        {isShort && ` (${formatNumber(sent - received)} short)`}
                                                    </td>
                                                    <td>
                                                        <input
                                                            type="number"
                                                            value={item.adjusted_quantity}
                                                            onChange={(e) => updateAdjustedQuantity(idx, e.target.value)}
                                                            step="0.01"
                                                            min="0"
                                                            max={sent}
                                                            style={{ width: 100, padding: 4 }}
                                                        />
                                                        <span style={{ fontSize: 11, marginLeft: 4 }}>{item.unit}</span>
                                                    </td>
                                                    <td>
                                                        <input
                                                            type="text"
                                                            value={item.resolution_notes || ''}
                                                            onChange={(e) => updateItemNotes(idx, e.target.value)}
                                                            placeholder="Optional notes"
                                                            style={{ width: '100%', padding: 4 }}
                                                        />
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                    <tfoot>
                                        <tr style={{ backgroundColor: '#f3f4f6' }}>
                                            <td colSpan="4" style={{ textAlign: 'right', fontWeight: 500 }}>
                                                Total Accepted:
                                            </td>
                                            <td>
                                                {items.reduce((sum, item) => sum + (item.adjusted_quantity || 0), 0).toFixed(2)} units
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            )}
                        </div>
                    </div>
                )}

                <div style={{ marginBottom: 20 }}>
                    <label style={{ fontWeight: 500, display: 'block', marginBottom: 8 }}>Resolution Notes *</label>
                    <textarea
                        value={resolutionNotes}
                        onChange={(e) => setResolutionNotes(e.target.value)}
                        rows="4"
                        className="input"
                        style={{ width: '100%', padding: 8 }}
                        placeholder="Explain how this dispute was resolved..."
                        required
                    />
                </div>

                {error && (
                    <div className="error" style={{ color: '#dc2626', padding: 10, backgroundColor: '#fee2e2', borderRadius: 6, marginBottom: 16 }}>
                        ❌ {error}
                    </div>
                )}

                <div className="flex gap-2" style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 20 }}>
                    <button type="button" className="btn outline" onClick={onCancel} disabled={loading}>
                        Cancel
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                        {loading ? 'Resolving...' : 'Resolve Dispute'}
                    </button>
                </div>
            </form>
        </div>
    );
}

export default ResolveDispute;

