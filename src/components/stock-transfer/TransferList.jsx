// frontend/components/stock-transfer/TransferList.js
import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import transferService from './transferService';

function TransferList({ userBranch, transferType, onTransferSelect }) {
    const [transfers, setTransfers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [summary, setSummary] = useState(null);
    const [showCancelModal, setShowCancelModal] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(null);
    const [cancelling, setCancelling] = useState(false);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        loadTransfers();
        loadSummary();
    }, [transferType, filter]);

    const loadTransfers = async () => {
        setLoading(true);
        try {
            const params = {
                branch_id: userBranch?.id,
                type: transferType,
                status: filter !== 'all' ? filter.toUpperCase() : null
            };
            const data = await transferService.getTransfers(params);
            setTransfers(data);
        } catch (err) {
            console.error('Failed to load transfers', err);
        } finally {
            setLoading(false);
        }
    };

    const loadSummary = async () => {
        try {
            const data = await transferService.getSummary();
            setSummary(data);
        } catch (err) {
            console.error('Failed to load summary', err);
        }
    };

    const getStatusBadge = (status) => {
        const config = {
            'DRAFT': { class: 'badge-secondary', text: 'Draft', icon: '📝', color: '#6b7280', bg: '#f3f4f6' },
            'PENDING': { class: 'badge-warning', text: 'Pending', icon: '⏳', color: '#f59e0b', bg: '#fef3c7' },
            'APPROVED': { class: 'badge-info', text: 'Approved', icon: '✅', color: '#3b82f6', bg: '#dbeafe' },
            'IN_TRANSIT': { class: 'badge-info', text: 'In Transit', icon: '🚚', color: '#8b5cf6', bg: '#ede9fe' },
            'RECEIVED': { class: 'badge-success', text: 'Received', icon: '✓', color: '#10b981', bg: '#d1fae5' },
            'PARTIAL': { class: 'badge-warning', text: 'Partial', icon: '⚠️', color: '#f59e0b', bg: '#fef3c7' },
            'DISPUTED': { class: 'badge-danger', text: 'Disputed', icon: '❗', color: '#ef4444', bg: '#fee2e2' },
            'CANCELLED': { class: 'badge-danger', text: 'Cancelled', icon: '✗', color: '#6b7280', bg: '#f3f4f6' }
        };
        return config[status] || { class: 'badge-secondary', text: status, icon: '❓', color: '#6b7280', bg: '#f3f4f6' };
    };

    const handleEdit = (transfer) => {
        onTransferSelect(transfer, 'edit');
    };

    const handleCancelTransfer = async (transferId, reason) => {
        setCancelling(true);
        try {
            await transferService.cancelTransfer(transferId, reason);
            setShowCancelModal(null);
            loadTransfers();
            loadSummary();
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to cancel transfer');
        } finally {
            setCancelling(false);
        }
    };

    const handleDeleteTransfer = async (transferId) => {
        setDeleting(true);
        try {
            await transferService.deleteTransfer(transferId);
            setShowDeleteModal(null);
            loadTransfers();
            loadSummary();
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to delete transfer');
        } finally {
            setDeleting(false);
        }
    };

    const getActionButtons = (transfer) => {
        const isSender = userBranch?.id === transfer.from_branch?.id;
        const isReceiver = userBranch?.id === transfer.to_branch?.id;
        const buttons = [];

        // View Details button
        buttons.push(
            <button key="view" className="btn-sm btn-outline" onClick={() => onTransferSelect(transfer, 'view')}>
                👁️ View
            </button>
        );

        // Edit button - only for DRAFT status and sender branch
        if (isSender && transfer.status === 'DRAFT') {
            buttons.push(
                <button key="edit" className="btn-sm btn-primary" onClick={() => handleEdit(transfer)}>
                    ✏️ Edit
                </button>
            );
        }

        // Submit for Approval button - only for DRAFT status and sender branch
        if (isSender && transfer.status === 'DRAFT') {
            buttons.push(
                <button key="submit" className="btn-sm btn-success" onClick={() => handleApprove(transfer.id)}>
                    📤 Submit
                </button>
            );
        }

        // Approve button - only for PENDING status and sender branch
        if (isSender && transfer.status === 'PENDING') {
            buttons.push(
                <button key="approve" className="btn-sm btn-success" onClick={() => handleApprove(transfer.id)}>
                    ✅ Approve
                </button>
            );
        }

        // Dispatch button - only for APPROVED status and sender branch
        if (isSender && transfer.status === 'APPROVED') {
            buttons.push(
                <button key="dispatch" className="btn-sm btn-primary" onClick={() => onTransferSelect(transfer, 'dispatch')}>
                    🚚 Dispatch
                </button>
            );
        }

        // Receive button - only for IN_TRANSIT or PARTIAL status and receiver branch
        if (isReceiver && (transfer.status === 'IN_TRANSIT' || transfer.status === 'PARTIAL')) {
            buttons.push(
                <button key="receive" className="btn-sm btn-success" onClick={() => onTransferSelect(transfer, 'receive')}>
                    📦 Receive
                </button>
            );
        }

        // Dispute button - only for IN_TRANSIT or PARTIAL status and receiver branch
        if (isReceiver && (transfer.status === 'IN_TRANSIT' || transfer.status === 'PARTIAL')) {
            buttons.push(
                <button key="dispute" className="btn-sm btn-danger" onClick={() => onTransferSelect(transfer, 'dispute')}>
                    ❗ Dispute
                </button>
            );
        }

        // Resolve button - only for DISPUTED status
        if (transfer.status === 'DISPUTED' && (isSender || isReceiver)) {
            buttons.push(
                <button key="resolve" className="btn-sm btn-warning" onClick={() => onTransferSelect(transfer, 'resolve')}>
                    ⚖️ Resolve
                </button>
            );
        }

        // Cancel button - only for DRAFT or PENDING status and sender branch
        if (isSender && (transfer.status === 'DRAFT' || transfer.status === 'PENDING')) {
            buttons.push(
                <button key="cancel" className="btn-sm btn-danger" onClick={() => setShowCancelModal(transfer)}>
                    ❌ Cancel
                </button>
            );
        }

        // Delete button - only for DRAFT status and sender branch (no items transferred yet)
        if (isSender && transfer.status === 'DRAFT') {
            buttons.push(
                <button key="delete" className="btn-sm btn-danger" onClick={() => setShowDeleteModal(transfer)}>
                    🗑️ Delete
                </button>
            );
        }

        // Waybill button - if waybill exists
        if (transfer.waybill_number) {
            buttons.push(
                <button key="waybill" className="btn-sm btn-outline" onClick={() => window.open(transferService.getWaybill(transfer.id), '_blank')}>
                    📄 Waybill
                </button>
            );
        }

        return buttons;
    };

    const handleApprove = async (transferId) => {
        if (window.confirm('Submit this transfer for approval?')) {
            try {
                await transferService.approveTransfer(transferId);
                loadTransfers();
                loadSummary();
            } catch (err) {
                alert('Failed to approve transfer');
            }
        }
    };

    const CancelModal = ({ transfer, onClose }) => {
        const [reason, setReason] = useState('');

        return (
            <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0,0,0,0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 2000
            }} onClick={onClose}>
                <div style={{
                    backgroundColor: 'white',
                    borderRadius: 12,
                    width: '90%',
                    maxWidth: 450,
                    padding: 24
                }} onClick={(e) => e.stopPropagation()}>
                    <h3 style={{ marginTop: 0 }}>Cancel Transfer</h3>
                    <p>Are you sure you want to cancel transfer <strong>{transfer.transfer_number}</strong>?</p>
                    <div style={{ marginBottom: 16 }}>
                        <label>Reason (Optional)</label>
                        <textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            rows="3"
                            placeholder="Reason for cancellation..."
                            style={{
                                width: '100%',
                                padding: '8px 12px',
                                border: '1px solid #d1d5db',
                                borderRadius: 6,
                                marginTop: 4
                            }}
                        />
                    </div>
                    <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                        <button className="btn outline" onClick={onClose}>No, Keep</button>
                        <button 
                            className="btn btn-danger" 
                            onClick={() => handleCancelTransfer(transfer.id, reason)}
                            disabled={cancelling}
                        >
                            {cancelling ? 'Cancelling...' : 'Yes, Cancel'}
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    const DeleteModal = ({ transfer, onClose }) => {
        return (
            <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0,0,0,0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 2000
            }} onClick={onClose}>
                <div style={{
                    backgroundColor: 'white',
                    borderRadius: 12,
                    width: '90%',
                    maxWidth: 450,
                    padding: 24
                }} onClick={(e) => e.stopPropagation()}>
                    <h3 style={{ marginTop: 0, color: '#dc2626' }}>⚠️ Delete Transfer</h3>
                    <p>Are you sure you want to permanently delete transfer <strong>{transfer.transfer_number}</strong>?</p>
                    <p style={{ color: '#dc2626', fontSize: 13 }}>This action cannot be undone. All items will be removed.</p>
                    <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 20 }}>
                        <button className="btn outline" onClick={onClose}>No, Keep</button>
                        <button 
                            className="btn btn-danger" 
                            onClick={() => handleDeleteTransfer(transfer.id)}
                            disabled={deleting}
                        >
                            {deleting ? 'Deleting...' : 'Yes, Delete Permanently'}
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div>
            {/* Summary Cards */}
            {summary && (
                <div className="grid-5" style={{ marginBottom: 20, display:'flex', justifyContent:'space-around' }}>
                    <div className="card" style={{ textAlign: 'center', padding: 12 }}>
                        <div style={{ fontSize: 24, fontWeight: 'bold' }}>{summary.total_transfers}</div>
                        <div className="muted">Total</div>
                    </div>
                    <div className="card" style={{ textAlign: 'center', padding: 12, backgroundColor: '#fef3c7' }}>
                        <div style={{ fontSize: 24, fontWeight: 'bold', color: '#92400e' }}>{summary.by_status?.PENDING || 0}</div>
                        <div className="muted">Pending</div>
                    </div>
                    <div className="card" style={{ textAlign: 'center', padding: 12, backgroundColor: '#dbeafe' }}>
                        <div style={{ fontSize: 24, fontWeight: 'bold', color: '#1e40af' }}>{summary.by_status?.IN_TRANSIT || 0}</div>
                        <div className="muted">In Transit</div>
                    </div>
                    <div className="card" style={{ textAlign: 'center', padding: 12, backgroundColor: '#d1fae5' }}>
                        <div style={{ fontSize: 24, fontWeight: 'bold', color: '#065f46' }}>{summary.by_status?.RECEIVED || 0}</div>
                        <div className="muted">Received</div>
                    </div>
                    <div className="card" style={{ textAlign: 'center', padding: 12, backgroundColor: '#fee2e2' }}>
                        <div style={{ fontSize: 24, fontWeight: 'bold', color: '#991b1b' }}>{summary.by_status?.DISPUTED || 0}</div>
                        <div className="muted">Disputed</div>
                    </div>
                </div>
                
            )}

            {/* Status Filters */}
            <div className="card" style={{ marginBottom: 16, padding: 16 }}>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button className={`btn-sm ${filter === 'all' ? 'btn-primary' : 'outline'}`} onClick={() => setFilter('all')}>All</button>
                    <button className={`btn-sm ${filter === 'draft' ? 'btn-primary' : 'outline'}`} onClick={() => setFilter('draft')}>📝 Draft</button>
                    <button className={`btn-sm ${filter === 'pending' ? 'btn-primary' : 'outline'}`} onClick={() => setFilter('pending')}>⏳ Pending</button>
                    <button className={`btn-sm ${filter === 'in_transit' ? 'btn-primary' : 'outline'}`} onClick={() => setFilter('in_transit')}>🚚 In Transit</button>
                    <button className={`btn-sm ${filter === 'received' ? 'btn-primary' : 'outline'}`} onClick={() => setFilter('received')}>✓ Received</button>
                    <button className={`btn-sm ${filter === 'partial' ? 'btn-primary' : 'outline'}`} onClick={() => setFilter('partial')}>⚠️ Partial</button>
                    <button className={`btn-sm ${filter === 'disputed' ? 'btn-primary' : 'outline'}`} onClick={() => setFilter('disputed')}>❗ Disputed</button>
                    <button className={`btn-sm ${filter === 'cancelled' ? 'btn-primary' : 'outline'}`} onClick={() => setFilter('cancelled')}>✗ Cancelled</button>
                </div>
            </div>

            {/* Transfers Table */}
            <div className="card" style={{ overflowX: 'auto' }}>
                {loading ? (
                    <div style={{ textAlign: 'center', padding: 40 }}>Loading transfers...</div>
                ) : transfers.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 40 }}>
                        No transfers found
                        <div style={{ marginTop: 12 }}>
                            <button className="btn btn-primary" onClick={() => window.location.href = '/stock-transfers/create'}>
                                Create your first transfer
                            </button>
                        </div>
                    </div>
                ) : (
                    <table className="table" style={{ minWidth: 1000 }}>
                        <thead>
                            <tr>
                                <th>Transfer #</th>
                                <th>From → To</th>
                                <th>Items</th>
                                <th>Driver</th>
                                <th>Status</th>
                                <th>Date</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {transfers.map(t => {
                                const status = getStatusBadge(t.status);
                                return (
                                    <tr key={t.id}>
                                        <td>
                                            <strong>{t.transfer_number}</strong>
                                            {t.waybill_number && <div style={{ fontSize: 11, color: '#666' }}>WB: {t.waybill_number}</div>}
                                        </td>
                                        <td>
                                            <div>{t.from_branch_name}</div>
                                            <div style={{ fontSize: 12, color: '#666' }}>↓</div>
                                            <div>{t.to_branch_name}</div>
                                        </td>
                                        <td>
                                            {t.total_items} items
                                            <div style={{ fontSize: 11, color: '#666' }}>{t.total_quantity} units</div>
                                        </td>
                                        <td>
                                            {t.driver_name ? (
                                                <>
                                                    <div>{t.driver_name}</div>
                                                    <div style={{ fontSize: 11, color: '#666' }}>{t.driver_phone}</div>
                                                </>
                                            ) : (
                                                <span style={{ color: '#999' }}>—</span>
                                            )}
                                        </td>
                                        <td>
                                            <span className={`badge`} style={{ backgroundColor: status.bg, color: status.color }}>
                                                {status.icon} {status.text}
                                            </span>
                                        </td>
                                        <td>{new Date(t.created_at).toLocaleDateString()}</td>
                                        <td>
                                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                                {getActionButtons(t)}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )};
                
            </div>

            {/* Cancel Modal */}
            {showCancelModal && (
                <CancelModal transfer={showCancelModal} onClose={() => setShowCancelModal(null)} />
            )}

            {/* Delete Modal */}
            {showDeleteModal && (
                <DeleteModal transfer={showDeleteModal} onClose={() => setShowDeleteModal(null)} />
            )}
        </div>
    );
}

export default TransferList;