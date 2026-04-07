import { api } from '../api/client';

const transferService = {
    // Create transfer
    createTransfer: async (data) => {
        const response = await api.post('/api/stock-transfers/transfers/create/', data);
        return response.data;
    },
    
    // Get all transfers
    getTransfers: async (params = {}) => {
        const response = await api.get('/api/stock-transfers/transfers/', { params });
        return response.data;
    },
    
    // Get transfer details
    getTransferDetail: async (transferId) => {
        const response = await api.get(`/api/stock-transfers/transfers/${transferId}/`);
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
    
    // Get waybill
    getWaybill: (transferId) => {
        return `/api/stock-transfers/transfers/${transferId}/waybill/`;
    },
    
    // Get summary
    getSummary: async () => {
        const response = await api.get('/api/stock-transfers/transfers/summary/');
        return response.data;
    }
};

export default transferService;