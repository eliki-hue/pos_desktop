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
            'DRAFT': { icon: '📝', text: 'Draft', color: '#6b7280', bg: '#f3f4f6' },
            'APPROVED': { icon: '✅', text: 'Approved', color: '#3b82f6', bg: '#dbeafe' },
            'IN_TRANSIT': { icon: '🚚', text: 'In Transit', color: '#8b5cf6', bg: '#ede9fe' },
            'DISPUTED': { icon: '❗', text: 'Disputed', color: '#ef4444', bg: '#fee2e2' },
            'RESOLVED': { icon: '✓', text: 'Resolved', color: '#10b981', bg: '#d1fae5' },
            'RECEIVED': { icon: '📦', text: 'Received', color: '#065f46', bg: '#d1fae5' },
            'CANCELLED': { icon: '✗', text: 'Cancelled', color: '#6b7280', bg: '#f3f4f6' }
        };
        return config[status] || { icon: '❓', text: status, color: '#6b7280', bg: '#f3f4f6' };
    };

    const handleEdit = (transfer) => onTransferSelect(transfer, 'edit');
    const handleApprove = async (transferId) => {
        if (window.confirm('Approve this transfer?')) {
            try {
                await transferService.approveTransfer(transferId);
                loadTransfers();
                loadSummary();
            } catch (err) {
                alert('Failed to approve transfer');
            }
        }
    };
    const handleDispatch = (transfer) => onTransferSelect(transfer, 'dispatch');
    const handleReceive = (transfer) => onTransferSelect(transfer, 'receive');
    const handleDispute = (transfer) => onTransferSelect(transfer, 'dispute');
    const handleResolve = (transfer) => onTransferSelect(transfer, 'resolve');

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

    // ============================================================
    // SENDER ACTIONS - Only for the branch that initiated the transfer
    // ============================================================
    const getSenderActions = (transfer) => {
        const actions = [];

        switch (transfer.status) {
            case 'DRAFT':
                actions.push(
                    <button key="edit" className="btn-sm btn-primary" onClick={() => handleEdit(transfer)}>
                        ✏️ Edit
                    </button>,
                    <button key="approve" className="btn-sm btn-success" onClick={() => handleApprove(transfer.id)}>
                        ✅ Approve
                    </button>,
                    <button key="delete" className="btn-sm btn-danger" onClick={() => setShowDeleteModal(transfer)}>
                        🗑️ Delete
                    </button>
                );
                break;

            case 'APPROVED':
                actions.push(
                    <button key="dispatch" className="btn-sm btn-primary" onClick={() => onTransferSelect(transfer, 'dispatch')}>
                        🚚 Dispatch
                    </button>
                );
                break;

            case 'DISPUTED':
                actions.push(
                    <button key="resolve" className="btn-sm btn-warning" onClick={() => onTransferSelect(transfer, 'resolve')}>
                        ⚖️ Resolve Dispute
                    </button>
                );
                break;

            default:
                // No actions for IN_TRANSIT, RESOLVED, RECEIVED, CANCELLED
                break;
        }

        return actions;
    };

    // ============================================================
    // RECEIVER ACTIONS - Only for the branch receiving the transfer
    // ============================================================
    const getReceiverActions = (transfer) => {
        const actions = [];

        switch (transfer.status) {
            case 'IN_TRANSIT':
                actions.push(
                    <button key="receive" className="btn-sm btn-success" onClick={() => onTransferSelect(transfer, 'receive')}>
                        📦 Receive
                    </button>,
                    <button key="dispute" className="btn-sm btn-danger" onClick={() => onTransferSelect(transfer, 'dispute')}>
                        ❗ Raise Dispute
                    </button>
                );
                break;

            case 'DISPUTED':
                actions.push(
                    <button key="resolve" className="btn-sm btn-warning" onClick={() => onTransferSelect(transfer, 'resolve')}>
                        ⚖️ Respond to Dispute
                    </button>
                );
                break;

            case 'RESOLVED':
                actions.push(
                    <button key="confirm" className="btn-sm btn-success" onClick={() => onTransferSelect(transfer, 'receive')}>
                        ✅ Confirm Receipt
                    </button>
                );
                break;

            default:
                // No actions for DRAFT, APPROVED, RECEIVED, CANCELLED
                break;
        }

        return actions;
    };

    // ============================================================
    // COMMON ACTIONS - Visible to both sender and receiver
    // ============================================================
    const getCommonActions = (transfer) => {
        const actions = [
            <button key="view" className="btn-sm btn-outline" onClick={() => onTransferSelect(transfer, 'view')}>
                👁️ View
            </button>
        ];

        if (transfer.waybill_number) {
            actions.push(
                <button key="waybill" className="btn-sm btn-outline" onClick={() => window.open(transferService.getWaybill(transfer.id), '_blank')}>
                    📄 Waybill
                </button>
            );
        }

        return actions;
    };

    // ============================================================
    // MAIN ACTION DISPATCHER - Role-based rendering
    // ============================================================
    const getActionButtons = (transfer) => {
        const userBranchId = userBranch?.id ? parseInt(userBranch.id) : null;
        const isSender = userBranchId && transfer.from_branch && userBranchId === transfer.from_branch;
        const isReceiver = userBranchId && transfer.to_branch && userBranchId === transfer.to_branch;

        const buttons = [...getCommonActions(transfer)];

        if (isSender && !isReceiver) {
            buttons.push(...getSenderActions(transfer));
        } else if (isReceiver && !isSender) {
            buttons.push(...getReceiverActions(transfer));
        }

        return buttons;
    };

    const CancelModal = ({ transfer, onClose }) => {
        const [reason, setReason] = useState('');
        return (
            <div style={{
                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
                alignItems: 'center', justifyContent: 'center', zIndex: 2000
            }} onClick={onClose}>
                <div style={{ backgroundColor: 'white', borderRadius: 12, width: '90%', maxWidth: 450, padding: 24 }} onClick={(e) => e.stopPropagation()}>
                    <h3 style={{ marginTop: 0 }}>Cancel Transfer</h3>
                    <p>Cancel transfer <strong>{transfer.transfer_number}</strong>?</p>
                    <div style={{ marginBottom: 16 }}>
                        <label>Reason (Optional)</label>
                        <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows="3"
                            placeholder="Reason for cancellation..." style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, marginTop: 4 }} />
                    </div>
                    <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                        <button className="btn outline" onClick={onClose}>No</button>
                        <button className="btn btn-danger" onClick={() => handleCancelTransfer(transfer.id, reason)} disabled={cancelling}>
                            {cancelling ? 'Cancelling...' : 'Yes, Cancel'}
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    const DeleteModal = ({ transfer, onClose }) => (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', zIndex: 2000
        }} onClick={onClose}>
            <div style={{ backgroundColor: 'white', borderRadius: 12, width: '90%', maxWidth: 450, padding: 24 }} onClick={(e) => e.stopPropagation()}>
                <h3 style={{ marginTop: 0, color: '#dc2626' }}>⚠️ Delete Transfer</h3>
                <p>Permanently delete <strong>{transfer.transfer_number}</strong>?</p>
                <p style={{ color: '#dc2626', fontSize: 13 }}>This cannot be undone.</p>
                <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 20 }}>
                    <button className="btn outline" onClick={onClose}>No</button>
                    <button className="btn btn-danger" onClick={() => handleDeleteTransfer(transfer.id)} disabled={deleting}>
                        {deleting ? 'Deleting...' : 'Yes, Delete'}
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <div>
            {/* Summary Cards */}
            {summary && (
                <div style={{ display: 'flex', gap: 16, marginBottom: 20, overflowX: 'auto', paddingBottom: 4 }}>
                    <div className="card" style={{ flex: 1, minWidth: 100, textAlign: 'center', padding: 16 }}>
                        <div style={{ fontSize: 28, fontWeight: 'bold', color: '#3b82f6' }}>{summary.total_transfers}</div>
                        <div className="muted" style={{ fontSize: 12 }}>Total</div>
                    </div>
                    <div className="card" style={{ flex: 1, minWidth: 100, textAlign: 'center', padding: 16, backgroundColor: '#f3f4f6' }}>
                        <div style={{ fontSize: 28, fontWeight: 'bold', color: '#6b7280' }}>{summary.by_status?.DRAFT || 0}</div>
                        <div className="muted" style={{ fontSize: 12 }}>Draft</div>
                    </div>
                    <div className="card" style={{ flex: 1, minWidth: 100, textAlign: 'center', padding: 16, backgroundColor: '#dbeafe' }}>
                        <div style={{ fontSize: 28, fontWeight: 'bold', color: '#1e40af' }}>{summary.by_status?.APPROVED || 0}</div>
                        <div className="muted" style={{ fontSize: 12 }}>Approved</div>
                    </div>
                    <div className="card" style={{ flex: 1, minWidth: 100, textAlign: 'center', padding: 16, backgroundColor: '#ede9fe' }}>
                        <div style={{ fontSize: 28, fontWeight: 'bold', color: '#6d28d9' }}>{summary.by_status?.IN_TRANSIT || 0}</div>
                        <div className="muted" style={{ fontSize: 12 }}>In Transit</div>
                    </div>
                    <div className="card" style={{ flex: 1, minWidth: 100, textAlign: 'center', padding: 16, backgroundColor: '#d1fae5' }}>
                        <div style={{ fontSize: 28, fontWeight: 'bold', color: '#065f46' }}>{summary.by_status?.RECEIVED || 0}</div>
                        <div className="muted" style={{ fontSize: 12 }}>Received</div>
                    </div>
                    <div className="card" style={{ flex: 1, minWidth: 100, textAlign: 'center', padding: 16, backgroundColor: '#fee2e2' }}>
                        <div style={{ fontSize: 28, fontWeight: 'bold', color: '#991b1b' }}>{summary.by_status?.DISPUTED || 0}</div>
                        <div className="muted" style={{ fontSize: 12 }}>Disputed</div>
                    </div>
                </div>
            )}

            {/* Status Filters */}
            <div className="card" style={{ marginBottom: 16, padding: 16 }}>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button className={`btn-sm ${filter === 'all' ? 'btn-primary' : 'outline'}`} onClick={() => setFilter('all')}>All</button>
                    <button className={`btn-sm ${filter === 'draft' ? 'btn-primary' : 'outline'}`} onClick={() => setFilter('draft')}>📝 Draft</button>
                    <button className={`btn-sm ${filter === 'approved' ? 'btn-primary' : 'outline'}`} onClick={() => setFilter('approved')}>✅ Approved</button>
                    <button className={`btn-sm ${filter === 'in_transit' ? 'btn-primary' : 'outline'}`} onClick={() => setFilter('in_transit')}>🚚 In Transit</button>
                    <button className={`btn-sm ${filter === 'received' ? 'btn-primary' : 'outline'}`} onClick={() => setFilter('received')}>📦 Received</button>
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
                                Create Transfer
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
                                const userBranchId = userBranch?.id ? parseInt(userBranch.id) : null;
                                const isSender = userBranchId && t.from_branch && userBranchId === t.from_branch;
                                const isReceiver = userBranchId && t.to_branch && userBranchId === t.to_branch;

                                let roleIndicator = null;
                                if (isSender && !isReceiver) {
                                    roleIndicator = <div style={{ fontSize: 10, color: '#3b82f6', marginTop: 4 }}>📤 Sender</div>;
                                } else if (isReceiver && !isSender) {
                                    roleIndicator = <div style={{ fontSize: 10, color: '#10b981', marginTop: 4 }}>📥 Receiver</div>;
                                }

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
                                            {roleIndicator}
                                        </td>
                                        <td>
                                            {t.total_items} items
                                            <div style={{ fontSize: 11, color: '#666' }}>{t.total_quantity} units</div>
                                        </td>
                                        <td>
                                            {t.driver_name ? (
                                                <><div>{t.driver_name}</div><div style={{ fontSize: 11, color: '#666' }}>{t.driver_phone}</div></>
                                            ) : <span style={{ color: '#999' }}>—</span>}
                                        </td>
                                        <td>
                                            <span className="badge" style={{ backgroundColor: status.bg, color: status.color, padding: '4px 10px', borderRadius: 20, fontSize: 11 }}>
                                                {status.icon} {status.text}
                                            </span>
                                        </td>
                                        <td>{new Date(t.created_at).toLocaleDateString()}</td>
                                        <td><div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>{getActionButtons(t)}</div></td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            {showCancelModal && <CancelModal transfer={showCancelModal} onClose={() => setShowCancelModal(null)} />}
            {showDeleteModal && <DeleteModal transfer={showDeleteModal} onClose={() => setShowDeleteModal(null)} />}
        </div>
    );
}

export default TransferList;