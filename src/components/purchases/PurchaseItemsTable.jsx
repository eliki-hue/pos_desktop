// src/components/purchases/PurchaseItemsTable.jsx
import React, { useState } from 'react';
import { Edit2, Save, X, Trash2, Package, AlertCircle, CheckCircle } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

const PurchaseItemsTable = ({ items, onUpdateItem, onRemoveItem, readOnly = false }) => {
  const [editingId, setEditingId] = useState(null);
  const [editValues, setEditValues] = useState({});
  const [hoveredRow, setHoveredRow] = useState(null);

  if (!items || items.length === 0) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
        <div style={{ 
          display: 'inline-flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          width: 80,
          height: 80,
          backgroundColor: '#f3f4f6',
          borderRadius: 16,
          marginBottom: 16
        }}>
          <Package className="w-10 h-10" style={{ color: '#9ca3af' }} />
        </div>
        <p style={{ color: '#6b7280', fontSize: 16, fontWeight: 500, marginBottom: 8 }}>No items in this purchase</p>
        {!readOnly && (
          <p style={{ color: '#9ca3af', fontSize: 14 }}>Click "Add Item" to add products to this purchase</p>
        )}
      </div>
    );
  }

  const startEdit = (item) => {
    setEditingId(item.id || item.temp_id);
    setEditValues({
      quantity: item.quantity,
      unit_price: item.unit_price,
      unit: item.unit,
      bag_weight_kg: item.bag_weight_kg || ''
    });
  };

  const saveEdit = (item) => {
    if (onUpdateItem) {
      onUpdateItem(item.id || item.temp_id, editValues);
    }
    setEditingId(null);
    setEditValues({});
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValues({});
  };

  const calculateTotal = (item) => {
    const quantity = editingId === (item.id || item.temp_id) ? editValues.quantity : item.quantity;
    const price = editingId === (item.id || item.temp_id) ? editValues.unit_price : item.unit_price;
    return (quantity || 0) * (price || 0);
  };

  const getStockKg = (item) => {
    if (item.unit === 'KG') {
      return item.quantity;
    } else {
      const bagWeight = item.bag_weight_kg || 0;
      return item.quantity * bagWeight;
    }
  };

  const getStatusStyle = (status) => {
    const statusLower = status?.toLowerCase();
    switch (statusLower) {
      case 'received':
        return { bg: '#d1fae5', color: '#065f46', icon: '✅' };
      case 'pending':
        return { bg: '#fef3c7', color: '#92400e', icon: '⏳' };
      case 'cancelled':
        return { bg: '#fee2e2', color: '#991b1b', icon: '❌' };
      default:
        return { bg: '#f3f4f6', color: '#374151', icon: '❓' };
    }
  };

  const totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
  const totalStockKg = items.reduce((sum, item) => {
    if (item.unit === 'KG') return sum + item.quantity;
    return sum + (item.quantity * (item.bag_weight_kg || 0));
  }, 0);

  return (
    <div className="card" style={{ marginTop: 12, overflowX: "auto", padding: 0 }}>
      <table className="table" style={{ minWidth: 1000, width: '100%' }}>
        <thead>
          <tr>
            <th style={{ padding: '12px 16px', textAlign: 'left' }}>#</th>
            <th style={{ padding: '12px 16px', textAlign: 'left' }}>Product</th>
            <th style={{ padding: '12px 16px', textAlign: 'center' }}>Unit</th>
            <th style={{ padding: '12px 16px', textAlign: 'right' }}>Quantity</th>
            <th style={{ padding: '12px 16px', textAlign: 'right' }}>Unit Price</th>
            <th style={{ padding: '12px 16px', textAlign: 'right' }}>Total</th>
            <th style={{ padding: '12px 16px', textAlign: 'right' }}>Stock (KG)</th>
            <th style={{ padding: '12px 16px', textAlign: 'center' }}>Status</th>
            {!readOnly && (
              <th style={{ padding: '12px 16px', textAlign: 'center' }}>Actions</th>
            )}
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => {
            const statusStyle = getStatusStyle(item.status);
            const isEditing = editingId === (item.id || item.temp_id);
            const isHovered = hoveredRow === (item.id || item.temp_id);
            
            return (
              <tr 
                key={item.id || item.temp_id} 
                style={{ 
                  backgroundColor: isHovered ? '#f9fafb' : 'transparent',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={() => setHoveredRow(item.id || item.temp_id)}
                onMouseLeave={() => setHoveredRow(null)}
              >
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ fontSize: 14, color: '#9ca3af' }}>{index + 1}</span>
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ 
                      width: 32, 
                      height: 32, 
                      backgroundColor: '#eff6ff', 
                      borderRadius: 8, 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center' 
                    }}>
                      <Package className="w-4 h-4" style={{ color: '#2563eb' }} />
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#1f2937' }}>
                        {item.product_name || item.product?.name}
                      </div>
                      {item.product_sku && (
                        <div style={{ fontSize: 11, color: '#6b7280', fontFamily: 'monospace' }}>
                          SKU: {item.product_sku}
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                  {isEditing ? (
                    <select
                      value={editValues.unit}
                      onChange={(e) => setEditValues({ ...editValues, unit: e.target.value })}
                      style={{
                        padding: '6px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: 6,
                        fontSize: 13,
                        backgroundColor: 'white'
                      }}
                    >
                      <option value="KG">KG</option>
                      <option value="BAG">BAG</option>
                    </select>
                  ) : (
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', backgroundColor: '#f3f4f6', borderRadius: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 500, color: '#374151' }}>{item.unit}</span>
                      {item.unit === 'BAG' && item.bag_weight_kg && (
                        <span style={{ fontSize: 11, color: '#6b7280' }}>({item.bag_weight_kg}kg)</span>
                      )}
                    </div>
                  )}
                </td>
                <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                  {isEditing ? (
                    <input
                      type="number"
                      step="0.01"
                      value={editValues.quantity}
                      onChange={(e) => setEditValues({ ...editValues, quantity: parseFloat(e.target.value) })}
                      style={{
                        width: 100,
                        textAlign: 'right',
                        padding: '6px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: 6,
                        fontSize: 13
                      }}
                    />
                  ) : (
                    <span style={{ fontSize: 14, fontWeight: 500, color: '#1f2937' }}>
                      {item.quantity?.toLocaleString()}
                    </span>
                  )}
                </td>
                <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                  {isEditing ? (
                    <input
                      type="number"
                      step="0.01"
                      value={editValues.unit_price}
                      onChange={(e) => setEditValues({ ...editValues, unit_price: parseFloat(e.target.value) })}
                      style={{
                        width: 120,
                        textAlign: 'right',
                        padding: '6px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: 6,
                        fontSize: 13
                      }}
                    />
                  ) : (
                    <span style={{ fontSize: 14, fontWeight: 500, color: '#1f2937' }}>
                      {formatCurrency(item.unit_price)}
                    </span>
                  )}
                </td>
                <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#1f2937' }}>
                    {formatCurrency(calculateTotal(item))}
                  </span>
                </td>
                <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                  <span style={{ fontSize: 13, fontFamily: 'monospace', color: '#6b7280' }}>
                    {getStockKg(item).toLocaleString()} kg
                  </span>
                </td>
                <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '4px 12px',
                    borderRadius: 20,
                    fontSize: 11,
                    fontWeight: 500,
                    backgroundColor: statusStyle.bg,
                    color: statusStyle.color
                  }}>
                    <span style={{ fontSize: 12 }}>{statusStyle.icon}</span>
                    {item.status || 'PENDING'}
                  </span>
                </td>
                {!readOnly && (
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                    {isEditing ? (
                      <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                        <button
                          onClick={() => saveEdit(item)}
                          style={{
                            padding: 6,
                            color: '#10b981',
                            backgroundColor: 'transparent',
                            border: 'none',
                            borderRadius: 6,
                            cursor: 'pointer'
                          }}
                          title="Save"
                        >
                          <Save className="w-4 h-4" />
                        </button>
                        <button
                          onClick={cancelEdit}
                          style={{
                            padding: 6,
                            color: '#ef4444',
                            backgroundColor: 'transparent',
                            border: 'none',
                            borderRadius: 6,
                            cursor: 'pointer'
                          }}
                          title="Cancel"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                        <button
                          onClick={() => startEdit(item)}
                          style={{
                            padding: 6,
                            color: '#3b82f6',
                            backgroundColor: 'transparent',
                            border: 'none',
                            borderRadius: 6,
                            cursor: 'pointer',
                            opacity: isHovered ? 1 : 0,
                            transition: 'opacity 0.2s'
                          }}
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onRemoveItem && onRemoveItem(item.id || item.temp_id)}
                          style={{
                            padding: 6,
                            color: '#ef4444',
                            backgroundColor: 'transparent',
                            border: 'none',
                            borderRadius: 6,
                            cursor: 'pointer',
                            opacity: isHovered ? 1 : 0,
                            transition: 'opacity 0.2s'
                          }}
                          title="Remove"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
        <tfoot style={{ backgroundColor: '#f9fafb', borderTop: '1px solid #e5e7eb' }}>
          <tr>
            <td colSpan="5" style={{ padding: '12px 16px' }}>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#6b7280' }}>Total:</span>
              </div>
            </td>
            <td style={{ padding: '12px 16px', textAlign: 'right' }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#1f2937' }}>
                {formatCurrency(totalAmount)}
              </div>
            </td>
            <td style={{ padding: '12px 16px', textAlign: 'right' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 12px', backgroundColor: 'white', borderRadius: 8, boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                <Package className="w-4 h-4" style={{ color: '#3b82f6' }} />
                <span style={{ fontSize: 14, fontWeight: 700, color: '#1f2937' }}>{totalStockKg.toLocaleString()}</span>
                <span style={{ fontSize: 11, color: '#6b7280' }}>kg total</span>
              </div>
            </td>
            <td colSpan="2" style={{ padding: '12px 16px' }}>
              {/* Empty cell for alignment */}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
};

export default PurchaseItemsTable;