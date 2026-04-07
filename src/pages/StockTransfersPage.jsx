// frontend/pages/StockTransfersPage.js
import React, { useState, useEffect } from 'react';
import AppLayout from '../components/AppLayout';
import { api } from '../api/client';
import transferService from '../services/transferService';

// Import your existing components
import CreateTransfer from '../components/stock-transfer/CreateTransfer';
import DispatchTransfer from '../components/stock-transfer/DispatchTransfer';
import ReceiveTransfer from '../components/stock-transfer/ReceiveTransfer';

export default function StockTransfersPage() {
    const [transfers, setTransfers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [search, setSearch] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedTransfer, setSelectedTransfer] = useState(null);
    const [actionType, setActionType] = useState(null); // 'dispatch' or 'receive'
    const [summary, setSummary] = useState(null);

    useEffect(() => {
        loadTransfers();
        loadSummary();
    }, [filter]);

    const loadTransfers = async () => {
        setLoading(true);
        try {
            const params = filter !== 'all' ? { status: filter.toUpperCase() } : {};
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
            'PENDING': { class: 'badge-warning', text: 'Pending', icon: '⏳' },
            'IN_TRANSIT': { class: 'badge-info', text: 'In Transit', icon: '🚚' },
            'RECEIVED': { class: 'badge-success', text: 'Received', icon: '✅' },
            'PARTIAL': { class: 'badge-warning', text: 'Partial', icon: '⚠️' },
            'CANCELLED': { class: 'badge-danger', text: 'Cancelled', icon: '❌' }
        };
        return config[status] || { class: 'badge-secondary', text: status, icon: '❓' };
    };

    const handleTransferSuccess = () => {
        setShowCreateModal(false);
        setSelectedTransfer(null);
        setActionType(null);
        loadTransfers();
        loadSummary();
    };

    const handleCancel = () => {
        setShowCreateModal(false);
        setSelectedTransfer(null);
        setActionType(null);
    };

    const filteredTransfers = transfers.filter(t => {
        if (!search) return true;
        const searchLower = search.toLowerCase();
        return (
            t.transfer_number?.toLowerCase().includes(searchLower) ||
            t.from_branch_name?.toLowerCase().includes(searchLower) ||
            t.to_branch_name?.toLowerCase().includes(searchLower) ||
            t.driver_name?.toLowerCase().includes(searchLower)
        );
    });

    // Show modal based on action
    if (showCreateModal) {
        return (
            <AppLayout title="Stock Transfers" subtitle="Create New Transfer">
                <CreateTransfer onSuccess={handleTransferSuccess} onCancel={handleCancel} />
            </AppLayout>
        );
    }

    if (selectedTransfer && actionType === 'dispatch') {
        return (
            <AppLayout title="Stock Transfers" subtitle={`Dispatch: ${selectedTransfer.transfer_number}`}>
                <DispatchTransfer transfer={selectedTransfer} onSuccess={handleTransferSuccess} onCancel={handleCancel} />
            </AppLayout>
        );
    }

    if (selectedTransfer && actionType === 'receive') {
        return (
            <AppLayout title="Stock Transfers" subtitle={`Receive: ${selectedTransfer.transfer_number}`}>
                <ReceiveTransfer transfer={selectedTransfer} onSuccess={handleTransferSuccess} onCancel={handleCancel} />
            </AppLayout>
        );
    }

    // Main list view
    return (
        <AppLayout title="Stock Transfers" subtitle="Manage inter-branch stock transfers">
            {/* Header with Create Button */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div>
                    <strong style={{ fontSize: 18 }}>📦 Stock Transfers</strong>
                    <p className="muted" style={{ marginTop: 4 }}>Transfer stock between branches</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
                    + New Transfer
                </button>
            </div>

            {/* Summary Cards */}
            {summary && (
                <div className="grid-5" style={{ marginBottom: 20 }}>
                    <div className="card" style={{ textAlign: 'center', padding: 12 }}>
                        <div style={{ fontSize: 24, fontWeight: 'bold' }}>{summary.total_transfers}</div>
                        <div className="muted">Total</div>
                    </div>
                    <div className="card" style={{ textAlign: 'center', padding: 12, backgroundColor: '#fef3c7' }}>
                        <div style={{ fontSize: 24, fontWeight: 'bold', color: '#92400e' }}>{summary.pending}</div>
                        <div className="muted">Pending</div>
                    </div>
                    <div className="card" style={{ textAlign: 'center', padding: 12, backgroundColor: '#dbeafe' }}>
                        <div style={{ fontSize: 24, fontWeight: 'bold', color: '#1e40af' }}>{summary.in_transit}</div>
                        <div className="muted">In Transit</div>
                    </div>
                    <div className="card" style={{ textAlign: 'center', padding: 12, backgroundColor: '#d1fae5' }}>
                        <div style={{ fontSize: 24, fontWeight: 'bold', color: '#065f46' }}>{summary.received}</div>
                        <div className="muted">Received</div>
                    </div>
                    <div className="card" style={{ textAlign: 'center', padding: 12, backgroundColor: '#fed7aa' }}>
                        <div style={{ fontSize: 24, fontWeight: 'bold', color: '#9a3412' }}>{summary.partial}</div>
                        <div className="muted">Partial</div>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="card" style={{ marginBottom: 16, padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <button 
                            className={`btn ${filter === 'all' ? 'btn-primary' : 'outline'}`}
                            onClick={() => setFilter('all')}
                            style={{ fontSize: 12, padding: '6px 12px' }}
                        >
                            All
                        </button>
                        <button 
                            className={`btn ${filter === 'pending' ? 'btn-primary' : 'outline'}`}
                            onClick={() => setFilter('pending')}
                            style={{ fontSize: 12, padding: '6px 12px' }}
                        >
                            ⏳ Pending
                        </button>
                        <button 
                            className={`btn ${filter === 'in_transit' ? 'btn-primary' : 'outline'}`}
                            onClick={() => setFilter('in_transit')}
                            style={{ fontSize: 12, padding: '6px 12px' }}
                        >
                            🚚 In Transit
                        </button>
                        <button 
                            className={`btn ${filter === 'received' ? 'btn-primary' : 'outline'}`}
                            onClick={() => setFilter('received')}
                            style={{ fontSize: 12, padding: '6px 12px' }}
                        >
                            ✅ Received
                        </button>
                        <button 
                            className={`btn ${filter === 'partial' ? 'btn-primary' : 'outline'}`}
                            onClick={() => setFilter('partial')}
                            style={{ fontSize: 12, padding: '6px 12px' }}
                        >
                            ⚠️ Partial
                        </button>
                    </div>
                    <input
                        type="text"
                        placeholder="Search by number, branch, driver..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{ padding: '6px 12px', border: '1px solid #ddd', borderRadius: 4, width: 250 }}
                    />
                </div>
            </div>

            {/* Transfers Table */}
            <div className="card" style={{ overflowX: 'auto' }}>
                {loading ? (
                    <div style={{ textAlign: 'center', padding: 40 }}>Loading transfers...</div>
                ) : filteredTransfers.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 40 }}>
                        No transfers found
                        <div style={{ marginTop: 12 }}>
                            <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
                                Create your first transfer
                            </button>
                        </div>
                    </div>
                ) : (
                    <table className="table" style={{ minWidth: 900 }}>
                        <thead>
                            <tr>
                                <th>Transfer #</th>
                                <th>From → To</th>
                                <th>Items</th>
                                <th>Driver</th>
                                <th>Status</th>
                                <th>Created</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredTransfers.map(t => {
                                const status = getStatusBadge(t.status);
                                return (
                                    <tr key={t.id}>
                                        <td>
                                            <strong>{t.transfer_number}</strong>
                                            {t.waybill_number && (
                                                <div style={{ fontSize: 11, color: '#666' }}>WB: {t.waybill_number}</div>
                                            )}
                                        </td>
                                        <td>
                                            <div>{t.from_branch_name}</div>
                                            <div style={{ fontSize: 12, color: '#666' }}>↓</div>
                                            <div>{t.to_branch_name}</div>
                                        </td>
                                        <td>
                                            {t.total_items} products
                                            <div style={{ fontSize: 11, color: '#666' }}>{t.total_quantity} units</div>
                                        </td>
                                        <td>
                                            {t.driver_name ? (
                                                <>
                                                    <div>{t.driver_name}</div>
                                                    <div style={{ fontSize: 11, color: '#666' }}>{t.driver_phone}</div>
                                                </>
                                            ) : (
                                                <span style={{ color: '#999' }}>Not assigned</span>
                                            )}
                                        </td>
                                        <td>
                                            <span className={`badge ${status.class}`}>
                                                {status.icon} {status.text}
                                            </span>
                                        </td>
                                        <td>{new Date(t.created_at).toLocaleDateString()}</td>
                                        <td>
                                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                                {t.waybill_number && (
                                                    <button 
                                                        className="btn-sm btn-outline"
                                                        onClick={() => window.open(transferService.getWaybill(t.id), '_blank')}
                                                        title="View Waybill"
                                                    >
                                                        📄 Waybill
                                                    </button>
                                                )}
                                                
                                                {t.status === 'PENDING' && (
                                                    <button 
                                                        className="btn-sm btn-primary"
                                                        onClick={() => {
                                                            setSelectedTransfer(t);
                                                            setActionType('dispatch');
                                                        }}
                                                    >
                                                        Dispatch
                                                    </button>
                                                )}
                                                
                                                {t.status === 'IN_TRANSIT' && (
                                                    <button 
                                                        className="btn-sm btn-success"
                                                        onClick={() => {
                                                            setSelectedTransfer(t);
                                                            setActionType('receive');
                                                        }}
                                                    >
                                                        Receive
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Styles */}
            <style>
                {`
                    .grid-5 {
                        display: grid;
                        grid-template-columns: repeat(5, 1fr);
                        gap: 16px;
                    }
                    .btn-sm {
                        padding: 4px 10px;
                        font-size: 12px;
                        border-radius: 4px;
                        cursor: pointer;
                    }
                    .btn-primary {
                        background: #3b82f6;
                        color: white;
                        border: none;
                    }
                    .btn-success {
                        background: #10b981;
                        color: white;
                        border: none;
                    }
                    .btn-outline {
                        background: white;
                        border: 1px solid #ddd;
                    }
                    .badge {
                        display: inline-block;
                        padding: 4px 10px;
                        border-radius: 20px;
                        font-size: 11px;
                        font-weight: 500;
                    }
                    .badge-warning {
                        background: #fef3c7;
                        color: #92400e;
                    }
                    .badge-info {
                        background: #dbeafe;
                        color: #1e40af;
                    }
                    .badge-success {
                        background: #d1fae5;
                        color: #065f46;
                    }
                    .badge-danger {
                        background: #fee2e2;
                        color: #991b1b;
                    }
                    .badge-secondary {
                        background: #f3f4f6;
                        color: #374151;
                    }
                    @media (max-width: 768px) {
                        .grid-5 {
                            grid-template-columns: repeat(2, 1fr);
                        }
                    }
                `}
            </style>
        </AppLayout>
    );
}