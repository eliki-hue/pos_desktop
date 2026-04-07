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

    const getStatusConfig = (status) => {
        const config = {
            'DRAFT': { color: '#6b7280', bg: '#f3f4f6', icon: '📝', text: 'Draft' },
            'PENDING': { color: '#f59e0b', bg: '#fef3c7', icon: '⏳', text: 'Pending Approval' },
            'APPROVED': { color: '#3b82f6', bg: '#dbeafe', icon: '✅', text: 'Approved' },
            'IN_TRANSIT': { color: '#8b5cf6', bg: '#ede9fe', icon: '🚚', text: 'In Transit' },
            'RECEIVED': { color: '#10b981', bg: '#d1fae5', icon: '✓', text: 'Received' },
            'PARTIAL': { color: '#f59e0b', bg: '#fef3c7', icon: '⚠️', text: 'Partially Received' },
            'DISPUTED': { color: '#ef4444', bg: '#fee2e2', icon: '❗', text: 'Disputed' },
            'CANCELLED': { color: '#6b7280', bg: '#f3f4f6', icon: '✗', text: 'Cancelled' }
        };
        return config[status] || config['DRAFT'];
    };

    if (loading) {
        return (
            <div className="card" style={{ textAlign: 'center', padding: 60 }}>
                <div style={{ fontSize: 20, color: '#6b7280' }}>Loading transfer details...</div>
            </div>
        );
    }

    if (!details) {
        return (
            <div className="card" style={{ textAlign: 'center', padding: 60 }}>
                <div style={{ fontSize: 20, color: '#dc2626' }}>Failed to load transfer details</div>
                <button className="btn btn-primary" onClick={onBack} style={{ marginTop: 20 }}>← Back</button>
            </div>
        );
    }

    const statusConfig = getStatusConfig(details.status);

    return (
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            {/* Header with Back Button */}
            <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                marginBottom: 24,
                flexWrap: 'wrap',
                gap: 16
            }}>
                <div>
                    <h1 style={{ margin: 0, fontSize: 28, fontWeight: 600 }}>Transfer #{details.transfer_number}</h1>
                    <div style={{ marginTop: 8, display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
                        <span className="badge" style={{ backgroundColor: statusConfig.bg, color: statusConfig.color, padding: '4px 12px', borderRadius: 20 }}>
                            {statusConfig.icon} {statusConfig.text}
                        </span>
                        {details.waybill_number && (
                            <span style={{ fontFamily: 'monospace', fontSize: 13, color: '#6b7280' }}>
                                Waybill: {details.waybill_number}
                            </span>
                        )}
                    </div>
                </div>
                <button className="btn outline" onClick={onBack} style={{ padding: '8px 20px' }}>← Back to List</button>
            </div>

            {/* Summary Cards Row */}
            <div style={{ 
                display: 'flex', 
                gap: 16, 
                marginBottom: 24,
                flexWrap: 'wrap'
            }}>
                <div className="card" style={{ flex: 1, minWidth: 150, padding: 20, textAlign: 'center' }}>
                    <div style={{ fontSize: 32, fontWeight: 'bold', color: '#3b82f6' }}>{details.summary?.total_items || 0}</div>
                    <div className="muted" style={{ fontSize: 13 }}>Total Items</div>
                </div>
                <div className="card" style={{ flex: 1, minWidth: 150, padding: 20, textAlign: 'center' }}>
                    <div style={{ fontSize: 32, fontWeight: 'bold', color: '#f59e0b' }}>{details.summary?.total_quantity_sent?.toFixed(2) || 0}</div>
                    <div className="muted" style={{ fontSize: 13 }}>Units Sent</div>
                </div>
                <div className="card" style={{ flex: 1, minWidth: 150, padding: 20, textAlign: 'center', backgroundColor: '#d1fae5' }}>
                    <div style={{ fontSize: 32, fontWeight: 'bold', color: '#065f46' }}>{details.summary?.total_quantity_received?.toFixed(2) || 0}</div>
                    <div className="muted" style={{ fontSize: 13 }}>Units Received</div>
                </div>
                <div className="card" style={{ flex: 1, minWidth: 150, padding: 20, textAlign: 'center' }}>
                    <div style={{ fontSize: 32, fontWeight: 'bold', color: '#8b5cf6' }}>{details.summary?.total_kg_sent?.toFixed(2) || 0}</div>
                    <div className="muted" style={{ fontSize: 13 }}>Total KG Sent</div>
                </div>
                <div className="card" style={{ flex: 1, minWidth: 150, padding: 20, textAlign: 'center', backgroundColor: details.status === 'PARTIAL' ? '#fef3c7' : '#f3f4f6' }}>
                    <div style={{ fontSize: 32, fontWeight: 'bold', color: '#92400e' }}>{details.summary?.total_kg_received?.toFixed(2) || 0}</div>
                    <div className="muted" style={{ fontSize: 13 }}>Total KG Received</div>
                </div>
            </div>

            {/* Two Column Layout */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                {/* Left Column - Transfer Information */}
                <div className="card" style={{ padding: 24 }}>
                    <h3 style={{ margin: '0 0 20px 0', fontSize: 18, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                        📋 Transfer Information
                    </h3>
                    <div style={{ display: 'grid', gap: 16 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 8, borderBottom: '1px solid #f3f4f6' }}>
                            <span style={{ color: '#6b7280' }}>From Branch</span>
                            <span style={{ fontWeight: 500 }}>{details.from_branch_name}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 8, borderBottom: '1px solid #f3f4f6' }}>
                            <span style={{ color: '#6b7280' }}>To Branch</span>
                            <span style={{ fontWeight: 500 }}>{details.to_branch_name}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 8, borderBottom: '1px solid #f3f4f6' }}>
                            <span style={{ color: '#6b7280' }}>Created By</span>
                            <span style={{ fontWeight: 500 }}>{details.created_by_name}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 8, borderBottom: '1px solid #f3f4f6' }}>
                            <span style={{ color: '#6b7280' }}>Created At</span>
                            <span style={{ fontWeight: 500 }}>{formatDate(details.created_at)}</span>
                        </div>
                        {details.approved_at && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 8, borderBottom: '1px solid #f3f4f6' }}>
                                <span style={{ color: '#6b7280' }}>Approved By</span>
                                <span style={{ fontWeight: 500 }}>{details.approved_by_name} on {formatDate(details.approved_at)}</span>
                            </div>
                        )}
                        {details.dispatched_at && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 8, borderBottom: '1px solid #f3f4f6' }}>
                                <span style={{ color: '#6b7280' }}>Dispatched At</span>
                                <span style={{ fontWeight: 500 }}>{formatDate(details.dispatched_at)}</span>
                            </div>
                        )}
                        {details.received_at && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 8, borderBottom: '1px solid #f3f4f6' }}>
                                <span style={{ color: '#6b7280' }}>Received At</span>
                                <span style={{ fontWeight: 500 }}>{formatDate(details.received_at)}</span>
                            </div>
                        )}
                    </div>
                    {details.notes && (
                        <div style={{ marginTop: 20, padding: 12, backgroundColor: '#f9fafb', borderRadius: 8 }}>
                            <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Notes</div>
                            <div style={{ fontSize: 14 }}>{details.notes}</div>
                        </div>
                    )}
                    {details.dispute_reason && (
                        <div style={{ marginTop: 20, padding: 12, backgroundColor: '#fee2e2', borderRadius: 8, borderLeft: '3px solid #dc2626' }}>
                            <div style={{ fontSize: 12, color: '#991b1b', marginBottom: 4 }}>⚠️ Dispute Reason</div>
                            <div style={{ fontSize: 14 }}>{details.dispute_reason}</div>
                        </div>
                    )}
                </div>

                {/* Right Column - Driver Information */}
                <div className="card" style={{ padding: 24 }}>
                    <h3 style={{ margin: '0 0 20px 0', fontSize: 18, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                        👨‍✈️ Driver Information
                    </h3>
                    {details.driver_name ? (
                        <div style={{ display: 'grid', gap: 16 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 8, borderBottom: '1px solid #f3f4f6' }}>
                                <span style={{ color: '#6b7280' }}>Driver Name</span>
                                <span style={{ fontWeight: 500 }}>{details.driver_name}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 8, borderBottom: '1px solid #f3f4f6' }}>
                                <span style={{ color: '#6b7280' }}>Driver Phone</span>
                                <span style={{ fontWeight: 500 }}>{details.driver_phone}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 8, borderBottom: '1px solid #f3f4f6' }}>
                                <span style={{ color: '#6b7280' }}>Waybill Number</span>
                                <span style={{ fontWeight: 500, fontFamily: 'monospace' }}>{details.waybill_number || 'Not generated'}</span>
                            </div>
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', padding: 40, color: '#6b7280' }}>
                            No driver assigned yet
                        </div>
                    )}
                </div>
            </div>

            {/* Items Table */}
            <div className="card" style={{ marginTop: 24, padding: 24 }}>
                <h3 style={{ margin: '0 0 20px 0', fontSize: 18, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                    📦 Transfer Items
                </h3>
                <div style={{ overflowX: 'auto' }}>
                    <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ backgroundColor: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                                <th style={{ padding: '12px', textAlign: 'left' }}>Product</th>
                                <th style={{ padding: '12px', textAlign: 'center' }}>Unit</th>
                                <th style={{ padding: '12px', textAlign: 'right' }}>Quantity Sent</th>
                                <th style={{ padding: '12px', textAlign: 'right' }}>Quantity Received</th>
                                <th style={{ padding: '12px', textAlign: 'center' }}>Status</th>
                                <th style={{ padding: '12px', textAlign: 'left' }}>Notes</th>
                            </tr>
                        </thead>
                        <tbody>
                            {details.items?.map(item => {
                                const itemStatusConfig = getStatusConfig(item.status);
                                return (
                                    <tr key={item.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                        <td style={{ padding: '12px' }}>
                                            <div style={{ fontWeight: 500 }}>{item.product_name}</div>
                                            <div style={{ fontSize: 11, color: '#6b7280' }}>SKU: {item.product_sku}</div>
                                        </td>
                                        <td style={{ padding: '12px', textAlign: 'center' }}>{item.unit_display}</td>
                                        <td style={{ padding: '12px', textAlign: 'right' }}>
                                            <strong>{item.quantity_sent}</strong> {item.unit === 'KG' ? 'kg' : 'bags'}
                                        </td>
                                        <td style={{ padding: '12px', textAlign: 'right' }}>
                                            {item.quantity_received > 0 ? (
                                                <span style={{ color: '#10b981', fontWeight: 500 }}>
                                                    {item.quantity_received} {item.unit === 'KG' ? 'kg' : 'bags'}
                                                </span>
                                            ) : '—'}
                                        </td>
                                        <td style={{ padding: '12px', textAlign: 'center' }}>
                                            <span className="badge" style={{
                                                backgroundColor: itemStatusConfig.bg,
                                                color: itemStatusConfig.color,
                                                padding: '4px 10px',
                                                borderRadius: 20,
                                                fontSize: 11
                                            }}>
                                                {itemStatusConfig.icon} {itemStatusConfig.text}
                                            </span>
                                        </td>
                                        <td style={{ padding: '12px', color: '#6b7280' }}>{item.notes || '—'}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                        <tfoot style={{ backgroundColor: '#f9fafb', borderTop: '2px solid #e5e7eb' }}>
                            <tr>
                                <td colSpan="2" style={{ padding: '12px', fontWeight: 600 }}>Totals</td>
                                <td style={{ padding: '12px', textAlign: 'right', fontWeight: 600 }}>
                                    {details.summary?.total_quantity_sent?.toFixed(2)} units
                                </td>
                                <td style={{ padding: '12px', textAlign: 'right', fontWeight: 600, color: '#10b981' }}>
                                    {details.summary?.total_quantity_received?.toFixed(2)} units
                                </td>
                                <td colSpan="2"></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>

            {/* Timeline Section */}
            <div className="card" style={{ marginTop: 24, padding: 24 }}>
                <h3 style={{ margin: '0 0 20px 0', fontSize: 18, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                    📅 Timeline
                </h3>
                <div style={{ position: 'relative', paddingLeft: 30 }}>
                    {details.timeline?.created && (
                        <div style={{ marginBottom: 20, position: 'relative' }}>
                            <div style={{ position: 'absolute', left: -20, top: 0, width: 12, height: 12, borderRadius: '50%', backgroundColor: '#3b82f6', border: '2px solid white', boxShadow: '0 0 0 2px #3b82f6' }}></div>
                            <div><strong style={{ color: '#3b82f6' }}>Created</strong></div>
                            <div>{formatDate(details.timeline.created.at)} by {details.timeline.created.by}</div>
                        </div>
                    )}
                    {details.timeline?.approved && (
                        <div style={{ marginBottom: 20, position: 'relative' }}>
                            <div style={{ position: 'absolute', left: -20, top: 0, width: 12, height: 12, borderRadius: '50%', backgroundColor: '#10b981', border: '2px solid white', boxShadow: '0 0 0 2px #10b981' }}></div>
                            <div><strong style={{ color: '#10b981' }}>Approved</strong></div>
                            <div>{formatDate(details.timeline.approved.at)} by {details.timeline.approved.by}</div>
                        </div>
                    )}
                    {details.timeline?.dispatched && (
                        <div style={{ marginBottom: 20, position: 'relative' }}>
                            <div style={{ position: 'absolute', left: -20, top: 0, width: 12, height: 12, borderRadius: '50%', backgroundColor: '#8b5cf6', border: '2px solid white', boxShadow: '0 0 0 2px #8b5cf6' }}></div>
                            <div><strong style={{ color: '#8b5cf6' }}>Dispatched</strong></div>
                            <div>{formatDate(details.timeline.dispatched.at)} by {details.timeline.dispatched.by}</div>
                        </div>
                    )}
                    {details.timeline?.received && (
                        <div style={{ marginBottom: 20, position: 'relative' }}>
                            <div style={{ position: 'absolute', left: -20, top: 0, width: 12, height: 12, borderRadius: '50%', backgroundColor: '#10b981', border: '2px solid white', boxShadow: '0 0 0 2px #10b981' }}></div>
                            <div><strong style={{ color: '#10b981' }}>Received</strong></div>
                            <div>{formatDate(details.timeline.received.at)}</div>
                        </div>
                    )}
                    {details.timeline?.resolved && (
                        <div style={{ marginBottom: 20, position: 'relative' }}>
                            <div style={{ position: 'absolute', left: -20, top: 0, width: 12, height: 12, borderRadius: '50%', backgroundColor: '#f59e0b', border: '2px solid white', boxShadow: '0 0 0 2px #f59e0b' }}></div>
                            <div><strong style={{ color: '#f59e0b' }}>Dispute Resolved</strong></div>
                            <div>{formatDate(details.timeline.resolved.at)} by {details.timeline.resolved.by}</div>
                            {details.resolution_notes && <div style={{ marginTop: 4, fontSize: 13, color: '#6b7280' }}>Note: {details.resolution_notes}</div>}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default TransferDetail;