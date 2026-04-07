import React, { useState, useEffect } from 'react';
import transferService from '../services/transferService';
import CreateTransfer from './CreateTransfer';
import DispatchTransfer from './DispatchTransfer';
import ReceiveTransfer from './ReceiveTransfer';

function TransferList() {
    const [transfers, setTransfers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [selectedTransfer, setSelectedTransfer] = useState(null);
    const [actionType, setActionType] = useState(null); // 'dispatch', 'receive'
    const [summary, setSummary] = useState(null);

    useEffect(() => {
        loadTransfers();
        loadSummary();
    }, []);

    const loadTransfers = async () => {
        setLoading(true);
        try {
            const data = await transferService.getTransfers();
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
        const colors = {
            'PENDING': 'badge-warning',
            'IN_TRANSIT': 'badge-info',
            'RECEIVED': 'badge-success',
            'PARTIAL': 'badge-warning',
            'CANCELLED': 'badge-danger'
        };
        return colors[status] || 'badge-secondary';
    };

    const handleAction = (transfer, action) => {
        setSelectedTransfer(transfer);
        setActionType(action);
    };

    const handleSuccess = () => {
        setShowCreate(false);
        setSelectedTransfer(null);
        setActionType(null);
        loadTransfers();
        loadSummary();
    };

    if (showCreate) {
        return <CreateTransfer onSuccess={handleSuccess} onCancel={() => setShowCreate(false)} />;
    }

    if (selectedTransfer && actionType === 'dispatch') {
        return <DispatchTransfer transfer={selectedTransfer} onSuccess={handleSuccess} onCancel={() => setSelectedTransfer(null)} />;
    }

    if (selectedTransfer && actionType === 'receive') {
        return <ReceiveTransfer transfer={selectedTransfer} onSuccess={handleSuccess} onCancel={() => setSelectedTransfer(null)} />;
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h2>Stock Transfers</h2>
                <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
                    + New Transfer
                </button>
            </div>
            
            {summary && (
                <div className="grid-5 mb-4">
                    <div className="card text-center"><div className="stat-value">{summary.total_transfers}</div><div>Total</div></div>
                    <div className="card text-center"><div className="stat-value">{summary.pending}</div><div>Pending</div></div>
                    <div className="card text-center"><div className="stat-value">{summary.in_transit}</div><div>In Transit</div></div>
                    <div className="card text-center"><div className="stat-value">{summary.received}</div><div>Received</div></div>
                    <div className="card text-center"><div className="stat-value">{summary.partial}</div><div>Partial</div></div>
                </div>
            )}
            
            <div className="card">
                {loading ? (
                    <div className="text-center p-4">Loading transfers...</div>
                ) : transfers.length === 0 ? (
                    <div className="text-center p-4">No transfers found</div>
                ) : (
                    <table className="table">
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
                            {transfers.map(t => (
                                <tr key={t.id}>
                                    <td><strong>{t.transfer_number}</strong></td>
                                    <td>{t.from_branch_name} → {t.to_branch_name}</td>
                                    <td>{t.total_items} items ({t.total_quantity} units)</td>
                                    <td>{t.driver_name || '-'} <small>{t.driver_phone || ''}</small></td>
                                    <td><span className={`badge ${getStatusBadge(t.status)}`}>{t.status}</span></td>
                                    <td>{new Date(t.created_at).toLocaleDateString()}</td>
                                    <td>
                                        {t.status === 'PENDING' && (
                                            <button className="btn-sm btn-primary" onClick={() => handleAction(t, 'dispatch')}>Dispatch</button>
                                        )}
                                        {t.status === 'IN_TRANSIT' && (
                                            <button className="btn-sm btn-success" onClick={() => handleAction(t, 'receive')}>Receive</button>
                                        )}
                                        {t.waybill_number && (
                                            <button className="btn-sm btn-outline" onClick={() => window.open(transferService.getWaybill(t.id), '_blank')}>Waybill</button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}

export default TransferList;