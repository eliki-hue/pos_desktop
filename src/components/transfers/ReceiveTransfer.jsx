import React, { useState } from 'react';
import transferService from '../services/transferService';

function ReceiveTransfer({ transfer, onSuccess, onCancel }) {
    const [items, setItems] = useState(
        transfer.items.map(item => ({
            item_id: item.id,
            product_name: item.product_name,
            quantity_sent: parseFloat(item.quantity_sent),
            quantity_received: parseFloat(item.quantity_received) || 0,
            notes: item.notes || ''
        }))
    );
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const updateQuantity = (index, value) => {
        const newItems = [...items];
        const received = parseFloat(value) || 0;
        newItems[index].quantity_received = Math.min(received, newItems[index].quantity_sent);
        setItems(newItems);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const receiveData = items.map(item => ({
            item_id: item.item_id,
            quantity_received: item.quantity_received,
            notes: item.notes
        }));
        
        setLoading(true);
        setError('');
        
        try {
            await transferService.receiveTransfer(transfer.id, receiveData);
            onSuccess();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to receive transfer');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="card">
            <h3>Receive Transfer: {transfer.transfer_number}</h3>
            
            <div className="info-box">
                <p><strong>From:</strong> {transfer.from_branch_name}</p>
                <p><strong>To:</strong> {transfer.to_branch_name}</p>
            </div>
            
            <form onSubmit={handleSubmit}>
                <table className="table">
                    <thead>
                        <tr>
                            <th>Product</th>
                            <th>Quantity Sent</th>
                            <th>Quantity Received</th>
                            <th>Notes</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((item, idx) => (
                            <tr key={idx}>
                                <td>{item.product_name}</td>
                                <td>{item.quantity_sent} {item.unit}</td>
                                <td>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        max={item.quantity_sent}
                                        value={item.quantity_received}
                                        onChange={(e) => updateQuantity(idx, e.target.value)}
                                        style={{ width: 100 }}
                                    />
                                </td>
                                <td>
                                    <input
                                        type="text"
                                        value={item.notes}
                                        onChange={(e) => {
                                            const newItems = [...items];
                                            newItems[idx].notes = e.target.value;
                                            setItems(newItems);
                                        }}
                                        placeholder="Damaged, missing, etc."
                                    />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                
                {error && <div className="error">{error}</div>}
                
                <div className="flex gap-2">
                    <button type="button" className="btn outline" onClick={onCancel}>Cancel</button>
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                        {loading ? 'Processing...' : 'Confirm Receipt'}
                    </button>
                </div>
            </form>
        </div>
    );
}

export default ReceiveTransfer;