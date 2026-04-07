// frontend/services/transferService.js
import { api } from '../../api/client';

const transferService = {
    // Get transfers with filters
    getTransfers: async (params = {}) => {
        const response = await api.get('/api/stock-transfers/transfers/', { params });
        return response.data;
    },
    
    // Get transfer details
    getTransferDetail: async (transferId) => {
        const response = await api.get(`/api/stock-transfers/transfers/${transferId}/detail/`);
        return response.data;
    },
    
    // Get summary statistics
    getSummary: async () => {
        const response = await api.get('/api/stock-transfers/transfers/summary/');
        return response.data;
    },
    
    // Create transfer
    createTransfer: async (data) => {
        const response = await api.post('/api/stock-transfers/transfers/create/', data);
        return response.data;
    },
    
    // Approve transfer
    approveTransfer: async (transferId, notes = '') => {
        const response = await api.post(`/api/stock-transfers/transfers/${transferId}/approve/`, { notes });
        return response.data;
    },
    
    // Dispatch transfer
    dispatchTransfer: async (transferId, driverData) => {
        const response = await api.post(`/api/stock-transfers/transfers/${transferId}/dispatch/`, driverData);
        return response.data;
    },
    
    // Receive transfer
    receiveTransfer: async (transferId, itemsData) => {
        const response = await api.post(`/api/stock-transfers/transfers/${transferId}/receive/`, { items: itemsData });
        return response.data;
    },
    
    // Dispute transfer
    disputeTransfer: async (transferId, disputeData) => {
        const response = await api.post(`/api/stock-transfers/transfers/${transferId}/dispute/`, disputeData);
        return response.data;
    },
    
    // Resolve dispute
    resolveDispute: async (transferId, resolutionData) => {
        const response = await api.post(`/api/stock-transfers/transfers/${transferId}/resolve/`, resolutionData);
        return response.data;
    },
    
    // Cancel transfer
    cancelTransfer: async (transferId, reason) => {
        const response = await api.post(`/api/stock-transfers/transfers/${transferId}/cancel/`, { reason });
        return response.data;
    },
    
    // Get waybill URL
    getWaybill: (transferId) => {
        return `/api/stock-transfers/transfers/${transferId}/waybill/`;
    },

     // Delete transfer (only for DRAFT status)
    deleteTransfer: async (transferId) => {
        const response = await api.delete(`/api/stock-transfers/transfers/${transferId}/delete/`);
        return response.data;
    },
    
    // Update transfer (edit)
    updateTransfer: async (transferId, data) => {
        const response = await api.put(`/api/stock-transfers/transfers/${transferId}/update/`, data);
        return response.data;
    }
};

export default transferService;