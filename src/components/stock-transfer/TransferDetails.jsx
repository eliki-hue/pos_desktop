// frontend/components/stock-transfer/TransferDetail.js
import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';

function TransferDetail({ transfer, onBack }) {
    const [details, setDetails] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadTransferDetails();
    }, [transfer.id]);

    const loadTransferDetails = async () => {
        setLoading(true);
        try {
            const response = await api.get(`/api/stock-transfers/transfers/${transfer.id}/detail/`);
            setDetails(response.data);
        } catch (err) {
            console.error('Failed to load transfer details', err);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '—';
        return new Date(dateString).toLocaleString();
    };

    const formatCurrency = (value) => {
        return `KES ${parseFloat(value || 0).toLocaleString()}`;
    };

    if (loading) {
        return <div className="card" style={{ textAlign: 'center', padding: 40 }}>Loading transfer details...</div>;
    }

    if (!details) {
        return <div className="card" style={{ textAlign: 'center', padding: 40 }}>Failed to load transfer details</div>;
    }

    return (
        <div>
            {/* Header with Back Button */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div>
                    <h2 style={{ margin: 0 }}>Transfer #{details.transfer_number}</h2>
                    <p style={{ margin: '4px 0 0', color: '#6b7280' }}>Waybill: {details.waybill_number || 'Not generated'}</p>
                </div>
                <button className="btn outline" onClick={onBack}>← Back</button>
            </div>

            {/* Summary Cards */}
            <div className="grid-4" style={{ marginBottom: 24 }}>
                <div className="card" style={{ textAlign: 'center', padding: 16 }}>
                    <div style={{ fontSize: 28, fontWeight: 'bold' }}>{details.summary?.total_items || 0}</div>
                    <div className="muted">Total Items</div>
                </div>
                <div className="card" style={{ textAlign: 'center', padding: 16 }}>
                    <div style={{ fontSize: 28, fontWeight: 'bold' }}>{details.summary?.total_quantity_sent?.toFixed(2) || 0}</div>
                    <div className="muted">Units Sent</div>
                </div>
                <div className="card" style={{ textAlign: 'center', padding: 16 }}>
                    <div style={{ fontSize: 28, fontWeight: 'bold' }}>{details.summary?.total_quantity_received?.toFixed(2) || 0}</div>
                    <div className="muted">Units Received</div>
                </div>
                <div className="card" style={{ textAlign: 'center', padding: 16 }}>
                    <div style={{ fontSize: 28, fontWeight: 'bold' }}>{details.summary?.total_kg_sent?.toFixed(2) || 0}</div>
                    <div className="muted">KG Sent</div>
                </div>
            </div>

            {/* Transfer Information */}
            <div className="card" style={{ padding: 24, marginBottom: 24 }}>
                <h3 style={{ marginTop: 0, marginBottom: 20 }}>Transfer Information</h3>
                <div className="grid-2">
                    <div>
                        <label>From Branch</label>
                        <div><strong>{details.from_branch_name}</strong></div>
                    </div>
                    <div>
                        <label>To Branch</label>
                        <div><strong>{details.to_branch_name}</strong></div>
                    </div>
                    <div>
                        <label>Status</label>
                        <div><strong>{details.status_display}</strong></div>
                    </div>
                    <div>
                        <label>Created</label>
                        <div>{formatDate(details.created_at)} by {details.created_by_name}</div>
                    </div>
                    {details.approved_at && (
                        <div>
                            <label>Approved</label>
                            <div>{formatDate(details.approved_at)} by {details.approved_by_name}</div>
                        </div>
                    )}
                    {details.dispatched_at && (
                        <div>
                            <label>Dispatched</label>
                            <div>{formatDate(details.dispatched_at)}</div>
                        </div>
                    )}
                    {details.driver_name && (
                        <>
                            <div>
                                <label>Driver Name</label>
                                <div>{details.driver_name}</div>
                            </div>
                            <div>
                                <label>Driver Phone</label>
                                <div>{details.driver_phone}</div>
                            </div>
                        </>
                    )}
                    {details.received_at && (
                        <div>
                            <label>Received</label>
                            <div>{formatDate(details.received_at)}</div>
                        </div>
                    )}
                </div>
                {details.notes && (
                    <div style={{ marginTop: 16 }}>
                        <label>Notes</label>
                        <div style={{ backgroundColor: '#f9fafb', padding: 12, borderRadius: 6 }}>{details.notes}</div>
                    </div>
                )}
                {details.dispute_reason && (
                    <div style={{ marginTop: 16, backgroundColor: '#fee2e2', padding: 12, borderRadius: 6 }}>
                        <label style={{ color: '#dc2626' }}>Dispute Reason</label>
                        <div>{details.dispute_reason}</div>
                    </div>
                )}
            </div>

            {/* Items Table */}
            <div className="card" style={{ padding: 24 }}>
                <h3 style={{ marginTop: 0, marginBottom: 20 }}>Transfer Items</h3>
                <div style={{ overflowX: 'auto' }}>
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Product</th>
                                <th>Unit</th>
                                <th>Quantity Sent</th>
                                <th>Quantity Received</th>
                                <th>Status</th>
                                <th>Notes</th>
                            </tr>
                        </thead>
                        <tbody>
                            {details.items?.map(item => (
                                <tr key={item.id}>
                                    <td>{item.product_name} <div style={{ fontSize: 11, color: '#666' }}>SKU: {item.product_sku}</div></td>
                                    <td>{item.unit_display}</td>
                                    <td>{item.quantity_sent} {item.unit === 'KG' ? 'kg' : 'bags'}</td>
                                    <td>
                                        {item.quantity_received > 0 ? (
                                            <strong>{item.quantity_received} {item.unit === 'KG' ? 'kg' : 'bags'}</strong>
                                        ) : '—'}
                                    </td>
                                    <td>
                                        <span className="badge" style={{
                                            backgroundColor: item.status === 'RECEIVED' ? '#d1fae5' : 
                                                           item.status === 'PARTIAL' ? '#fef3c7' :
                                                           item.status === 'DISPUTED' ? '#fee2e2' : '#f3f4f6',
                                            color: item.status === 'RECEIVED' ? '#065f46' : 
                                                   item.status === 'PARTIAL' ? '#92400e' :
                                                   item.status === 'DISPUTED' ? '#991b1b' : '#374151'
                                        }}>
                                            {item.status_display}
                                        </span>
                                    </td>
                                    <td>{item.notes || '—'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Timeline */}
            <div className="card" style={{ padding: 24, marginTop: 24 }}>
                <h3 style={{ marginTop: 0, marginBottom: 20 }}>Timeline</h3>
                <div style={{ position: 'relative', paddingLeft: 30 }}>
                    {details.timeline?.created && (
                        <div style={{ marginBottom: 20, position: 'relative' }}>
                            <div style={{ position: 'absolute', left: -20, top: 0, width: 10, height: 10, borderRadius: '50%', backgroundColor: '#3b82f6' }}></div>
                            <div><strong>Created</strong> - {formatDate(details.timeline.created.at)} by {details.timeline.created.by}</div>
                        </div>
                    )}
                    {details.timeline?.approved && (
                        <div style={{ marginBottom: 20, position: 'relative' }}>
                            <div style={{ position: 'absolute', left: -20, top: 0, width: 10, height: 10, borderRadius: '50%', backgroundColor: '#10b981' }}></div>
                            <div><strong>Approved</strong> - {formatDate(details.timeline.approved.at)} by {details.timeline.approved.by}</div>
                        </div>
                    )}
                    {details.timeline?.dispatched && (
                        <div style={{ marginBottom: 20, position: 'relative' }}>
                            <div style={{ position: 'absolute', left: -20, top: 0, width: 10, height: 10, borderRadius: '50%', backgroundColor: '#8b5cf6' }}></div>
                            <div><strong>Dispatched</strong> - {formatDate(details.timeline.dispatched.at)} by {details.timeline.dispatched.by}</div>
                        </div>
                    )}
                    {details.timeline?.received && (
                        <div style={{ marginBottom: 20, position: 'relative' }}>
                            <div style={{ position: 'absolute', left: -20, top: 0, width: 10, height: 10, borderRadius: '50%', backgroundColor: '#10b981' }}></div>
                            <div><strong>Received</strong> - {formatDate(details.timeline.received.at)}</div>
                        </div>
                    )}
                    {details.timeline?.resolved && (
                        <div style={{ marginBottom: 20, position: 'relative' }}>
                            <div style={{ position: 'absolute', left: -20, top: 0, width: 10, height: 10, borderRadius: '50%', backgroundColor: '#f59e0b' }}></div>
                            <div><strong>Resolved</strong> - {formatDate(details.timeline.resolved.at)} by {details.timeline.resolved.by}</div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default TransferDetail;