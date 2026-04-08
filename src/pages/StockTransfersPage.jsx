// frontend/pages/StockTransfersPage.js
import React, { useState, useEffect } from 'react';
import AppLayout from '../components/AppLayout';
import { api } from '../api/client';
import transferService from '../components/stock-transfer/transferService';
import TransferList from '../components/stock-transfer/TransferList';
import CreateTransfer from '../components/stock-transfer/CreateTransfer';
import DispatchTransfer from '../components/stock-transfer/DispatchTransfer';
import ReceiveTransfer from '../components/stock-transfer/ReceiveTransfer';
import TransferDetail from '../components/stock-transfer/TransferDetails';
import DisputeTransfer from '../components/stock-transfer/DisputeTransfer';
import ResolveDispute from '../components/stock-transfer/ResolveDispute';
import EditTransfer from '../components/stock-transfer/EditTransfer';

export default function StockTransfersPage() {
    const [view, setView] = useState('list'); // list, create, dispatch, receive, detail, dispute, resolve
    const [selectedTransfer, setSelectedTransfer] = useState(null);
    const [actionType, setActionType] = useState(null);
    const [userBranch, setUserBranch] = useState(null);
    const [transferType, setTransferType] = useState('all'); // all, sent, received

    useEffect(() => {
        loadUserBranch();
    }, []);

    const loadUserBranch = async () => {
        try {
            const res = await api.get('/api/auth/me/');
            if (res.data.branch) {
                setUserBranch(res.data.branch);
            }
        } catch (err) {
            console.error('Failed to load user branch', err);
        }
    };

    const handleTransferSelect = (transfer, action) => {
        setSelectedTransfer(transfer);
        setActionType(action);
        if (action === 'dispatch') setView('dispatch');
        else if (action === 'receive') setView('receive');
        else if (action === 'view') setView('detail');
        else if (action === 'dispute') setView('dispute');
        else if (action === 'resolve') setView('resolve');
        else if (action === 'edit') setView('edit');
    };

    const handleSuccess = () => {
        setView('list');
        setSelectedTransfer(null);
        setActionType(null);
    };

    const handleCancel = () => {
        setView('list');
        setSelectedTransfer(null);
        setActionType(null);
    };

    // Render different views
    if (view === 'create') {
        return (
            <AppLayout title="Stock Transfers" subtitle="Create New Transfer">
                <CreateTransfer onSuccess={handleSuccess} onCancel={handleCancel} userBranch={userBranch} />
            </AppLayout>
        );
    }

    if (view === 'dispatch' && selectedTransfer) {
        return (
            <AppLayout title="Stock Transfers" subtitle={`Dispatch: ${selectedTransfer.transfer_number}`}>
                <DispatchTransfer transfer={selectedTransfer} onSuccess={handleSuccess} onCancel={handleCancel} />
            </AppLayout>
        );
    }

    if (view === 'receive' && selectedTransfer) {
        return (
            <AppLayout title="Stock Transfers" subtitle={`Receive: ${selectedTransfer.transfer_number}`}>
                <ReceiveTransfer transfer={selectedTransfer} onSuccess={handleSuccess} onCancel={handleCancel} />
            </AppLayout>
        );
    }

    if (view === 'detail' && selectedTransfer) {
        return (
            <AppLayout title="Stock Transfers" subtitle={`Details: ${selectedTransfer.transfer_number}`}>
                <TransferDetail transfer={selectedTransfer} onBack={handleCancel} />
            </AppLayout>
        );
    }

    if (view === 'dispute' && selectedTransfer) {
        return (
            <AppLayout title="Stock Transfers" subtitle={`Dispute: ${selectedTransfer.transfer_number}`}>
                <DisputeTransfer transfer={selectedTransfer} onSuccess={handleSuccess} onCancel={handleCancel} />
            </AppLayout>
        );
    }

    if (view === 'resolve' && selectedTransfer) {
        return (
            <AppLayout title="Stock Transfers" subtitle={`Resolve Dispute: ${selectedTransfer.transfer_number}`}>
                <ResolveDispute transfer={selectedTransfer} onSuccess={handleSuccess} onCancel={handleCancel} />
            </AppLayout>
        );
    }

    if (view === 'edit' && selectedTransfer) {
        return (
            <AppLayout title="Stock Transfers" subtitle={`Resolve Dispute: ${selectedTransfer.transfer_number}`}>
                <EditTransfer transfer={selectedTransfer} onSuccess={handleSuccess} onCancel={handleCancel} />
            </AppLayout>
        );
    }

    // Main list view
    return (
        <AppLayout title="Stock Transfers" subtitle="Manage inter-branch stock transfers">
            {/* Tab Navigation for Sent/Received */}
            <div style={{ 
                display: 'flex', 
                gap: 4, 
                borderBottom: '1px solid #e5e7eb', 
                marginBottom: 20,
                paddingBottom: 0
            }}>
                <button
                    onClick={() => setTransferType('all')}
                    style={{
                        padding: '10px 20px',
                        background: transferType === 'all' ? '#3b82f6' : 'transparent',
                        color: transferType === 'all' ? 'white' : '#374151',
                        border: 'none',
                        borderRadius: '8px 8px 0 0',
                        cursor: 'pointer',
                        fontWeight: transferType === 'all' ? 600 : 400
                    }}
                >
                    📊 All Transfers
                </button>
                <button
                    onClick={() => setTransferType('sent')}
                    style={{
                        padding: '10px 20px',
                        background: transferType === 'sent' ? '#3b82f6' : 'transparent',
                        color: transferType === 'sent' ? 'white' : '#374151',
                        border: 'none',
                        borderRadius: '8px 8px 0 0',
                        cursor: 'pointer',
                        fontWeight: transferType === 'sent' ? 600 : 400
                    }}
                >
                    📤 Sent Transfers
                </button>
                <button
                    onClick={() => setTransferType('received')}
                    style={{
                        padding: '10px 20px',
                        background: transferType === 'received' ? '#3b82f6' : 'transparent',
                        color: transferType === 'received' ? 'white' : '#374151',
                        border: 'none',
                        borderRadius: '8px 8px 0 0',
                        cursor: 'pointer',
                        fontWeight: transferType === 'received' ? 600 : 400
                    }}
                >
                    📥 Received Transfers
                </button>
            </div>

            {/* Create Button */}
            <div style={{ marginBottom: 20, textAlign: 'right' }}>
                <button 
                    className="btn btn-primary" 
                    onClick={() => setView('create')}
                    style={{ padding: '10px 20px' }}
                >
                    + New Transfer
                </button>
            </div>

            {/* Transfer List Component */}
            <TransferList 
                userBranch={userBranch}
                transferType={transferType}
                onTransferSelect={handleTransferSelect}
            />
        </AppLayout>
    );
}