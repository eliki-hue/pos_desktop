import React, { useState } from 'react';
import transferService from '../services/transferService';

function DispatchTransfer({ transfer, onSuccess, onCancel }) {
    const [driverData, setDriverData] = useState({
        driver_name: '',
        driver_phone: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!driverData.driver_name || !driverData.driver_phone) {
            setError('Please fill all driver details');
            return;
        }
        
        setLoading(true);
        setError('');
        
        try {
            const response = await transferService.dispatchTransfer(transfer.id, driverData);
            
            if (response.waybill_url) {
                window.open(response.waybill_url, '_blank');
            }
            
            onSuccess();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to dispatch transfer');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="card">
            <h3>Dispatch Transfer: {transfer.transfer_number}</h3>
            
            <div className="info-box">
                <p><strong>From:</strong> {transfer.from_branch_name}</p>
                <p><strong>To:</strong> {transfer.to_branch_name}</p>
                <p><strong>Items:</strong> {transfer.total_items} products ({transfer.total_quantity} units)</p>
            </div>
            
            <form onSubmit={handleSubmit}>
                <div>
                    <label>Driver Name *</label>
                    <input
                        type="text"
                        value={driverData.driver_name}
                        onChange={(e) => setDriverData({...driverData, driver_name: e.target.value})}
                        required
                    />
                </div>
                
                <div>
                    <label>Driver Phone *</label>
                    <input
                        type="tel"
                        value={driverData.driver_phone}
                        onChange={(e) => setDriverData({...driverData, driver_phone: e.target.value})}
                        required
                    />
                </div>
                
                {error && <div className="error">{error}</div>}
                
                <div className="flex gap-2">
                    <button type="button" className="btn outline" onClick={onCancel}>Cancel</button>
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                        {loading ? 'Dispatching...' : 'Dispatch & Print Waybill'}
                    </button>
                </div>
            </form>
        </div>
    );
}

export default DispatchTransfer;