// frontend/components/stock-transfer/CreateTransfer.js
import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import transferService from './transferService';

function CreateTransfer({ onSuccess, onCancel }) {
    const [branches, setBranches] = useState([]);
    const [products, setProducts] = useState([]);
    const [formData, setFormData] = useState({
        from_branch: '',
        to_branch: '',
        notes: '',
        items: []
    });
    const [selectedProduct, setSelectedProduct] = useState({ 
        product_id: '', 
        quantity: '',
        unit: 'KG',
        stock_kg: 0,
        bags: 0,
        remaining_kg: 0,
        bag_weight_kg: null,
        allows_bag: false,
        product_name: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [fetchingStock, setFetchingStock] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [checkingItemStock, setCheckingItemStock] = useState({});

    useEffect(() => {
        loadBranches();
        loadProducts();
    }, []);

    const loadBranches = async () => {
        try {
            const res = await api.get('/api/branches/');
            setBranches(res.data);
        } catch (err) {
            console.error('Failed to load branches', err);
        }
    };

    const loadProducts = async () => {
        try {
            const res = await api.get('/api/products/');
            setProducts(res.data);
        } catch (err) {
            console.error('Failed to load products', err);
        }
    };

    const fetchProductStock = async (productId, branchId) => {
        if (!productId || !branchId) return;
        
        setFetchingStock(true);
        try {
            const response = await api.get(`/api/inventory/branch-stock/?branch_id=${branchId}&product_id=${productId}`);
            const stockData = response.data;
            const product = products.find(p => p.id === parseInt(productId));
            
            setSelectedProduct(prev => ({
                ...prev,
                stock_kg: stockData.stock_kg || 0,
                bags: stockData.bags || 0,
                remaining_kg: stockData.remaining_kg || 0,
                bag_weight_kg: stockData.bag_weight_kg || product?.bag_weight_kg,
                allows_bag: stockData.allows_bag || product?.allows_bag || false,
                product_name: product?.name,
                unit: prev.unit || 'KG'
            }));
        } catch (err) {
            console.error('Failed to fetch stock', err);
            setSelectedProduct(prev => ({
                ...prev,
                stock_kg: 0,
                bags: 0,
                remaining_kg: 0
            }));
        } finally {
            setFetchingStock(false);
        }
    };

    const fetchItemCurrentStock = async (productId, itemIndex) => {
        if (!formData.from_branch) return;
        
        setCheckingItemStock(prev => ({ ...prev, [itemIndex]: true }));
        try {
            const response = await api.get(`/api/inventory/branch-stock/?branch_id=${formData.from_branch}&product_id=${productId}`);
            const stockData = response.data;
            const product = products.find(p => p.id === parseInt(productId));
            
            const updatedItems = [...formData.items];
            updatedItems[itemIndex] = {
                ...updatedItems[itemIndex],
                current_stock_kg: stockData.stock_kg || 0,
                current_bags: stockData.bags || 0,
                current_remaining_kg: stockData.remaining_kg || 0,
                bag_weight_kg: stockData.bag_weight_kg || product?.bag_weight_kg,
                allows_bag: stockData.allows_bag || product?.allows_bag || false
            };
            setFormData(prev => ({ ...prev, items: updatedItems }));
            
            return { 
                stock_kg: stockData.stock_kg || 0, 
                bags: stockData.bags || 0 
            };
        } catch (err) {
            console.error('Failed to fetch item stock', err);
            return { stock_kg: 0, bags: 0 };
        } finally {
            setCheckingItemStock(prev => ({ ...prev, [itemIndex]: false }));
        }
    };

    const handleProductSelect = async (productId) => {
        const product = products.find(p => p.id === parseInt(productId));
        setSelectedProduct({
            product_id: productId,
            quantity: '',
            unit: 'KG',
            stock_kg: 0,
            bags: 0,
            remaining_kg: 0,
            bag_weight_kg: product?.bag_weight_kg,
            allows_bag: product?.allows_bag || false,
            product_name: product?.name
        });
        
        if (formData.from_branch && productId) {
            await fetchProductStock(productId, formData.from_branch);
        }
    };

    const handleUnitChange = (unit) => {
        setSelectedProduct(prev => ({ ...prev, unit, quantity: '' }));
    };

    const validateQuantity = (quantity, unit, stockKg, bags) => {
        const qty = parseFloat(quantity);
        if (isNaN(qty) || qty <= 0) return false;
        
        if (unit === 'KG') {
            return qty <= stockKg;
        } else if (unit === 'BAG') {
            return qty <= bags;
        }
        return false;
    };

    const getMaxQuantity = () => {
        if (selectedProduct.unit === 'KG') {
            return selectedProduct.stock_kg;
        } else if (selectedProduct.unit === 'BAG') {
            return selectedProduct.bags;
        }
        return 0;
    };

    // In CreateTransfer.js, update the addItem function:

const addItem = () => {
    if (!selectedProduct.product_id) {
        setError('Please select a product');
        setTimeout(() => setError(''), 3000);
        return;
    }
    
    if (!selectedProduct.quantity || parseFloat(selectedProduct.quantity) <= 0) {
        setError('Please enter a valid quantity');
        setTimeout(() => setError(''), 3000);
        return;
    }
    
    const quantity = parseFloat(selectedProduct.quantity);
    
    if (!formData.from_branch) {
        setError('Please select source branch first');
        setTimeout(() => setError(''), 3000);
        return;
    }
    
    // Check if product already exists with the same unit
    const existingItemIndex = formData.items.findIndex(
        i => i.product_id === parseInt(selectedProduct.product_id) && i.unit === selectedProduct.unit
    );
    
    if (existingItemIndex !== -1) {
        // Product exists - ask user if they want to merge
        const existingItem = formData.items[existingItemIndex];
        const confirmMerge = window.confirm(
            `${selectedProduct.product_name} already added in ${selectedProduct.unit}.\n\n` +
            `Current quantity: ${existingItem.quantity} ${selectedProduct.unit === 'KG' ? 'kg' : 'bags'}\n` +
            `New quantity: ${quantity} ${selectedProduct.unit === 'KG' ? 'kg' : 'bags'}\n\n` +
            `Do you want to add to existing quantity?`
        );
        
        if (confirmMerge) {
            // Merge quantities
            const newQuantity = existingItem.quantity + quantity;
            
            // Validate against available stock after merge
            let isValid = false;
            if (selectedProduct.unit === 'KG') {
                isValid = newQuantity <= selectedProduct.stock_kg;
            } else {
                isValid = newQuantity <= selectedProduct.bags;
            }
            
            if (!isValid) {
                if (selectedProduct.unit === 'KG') {
                    setError(`Insufficient stock! Total would be ${newQuantity} kg, Available: ${selectedProduct.stock_kg} kg`);
                } else {
                    setError(`Insufficient stock! Total would be ${newQuantity} bags, Available: ${selectedProduct.bags} bags`);
                }
                setTimeout(() => setError(''), 3000);
                return;
            }
            
            const kgEquivalent = selectedProduct.unit === 'KG' 
                ? newQuantity 
                : newQuantity * selectedProduct.bag_weight_kg;
            
            const updatedItems = [...formData.items];
            updatedItems[existingItemIndex] = {
                ...updatedItems[existingItemIndex],
                quantity: newQuantity,
                kg_equivalent: kgEquivalent
            };
            setFormData(prev => ({ ...prev, items: updatedItems }));
            setError('');
        }
        return;
    }
    
    // Validate against available stock
    if (!validateQuantity(selectedProduct.quantity, selectedProduct.unit, selectedProduct.stock_kg, selectedProduct.bags)) {
        if (selectedProduct.unit === 'KG') {
            setError(`Insufficient stock! Available: ${selectedProduct.stock_kg} kg`);
        } else {
            setError(`Insufficient stock! Available: ${selectedProduct.bags} bags (${selectedProduct.stock_kg} kg)`);
        }
        setTimeout(() => setError(''), 3000);
        return;
    }
    
    let kgEquivalent = quantity;
    if (selectedProduct.unit === 'BAG' && selectedProduct.bag_weight_kg) {
        kgEquivalent = quantity * selectedProduct.bag_weight_kg;
    }
    
    // Add new item
    setFormData(prev => ({
        ...prev,
        items: [...prev.items, {
            id: Date.now(),
            product_id: parseInt(selectedProduct.product_id),
            product_name: selectedProduct.product_name,
            quantity: quantity,
            unit: selectedProduct.unit,
            kg_equivalent: kgEquivalent,
            bag_weight_kg: selectedProduct.bag_weight_kg,
            original_stock_kg: selectedProduct.stock_kg,
            original_bags: selectedProduct.bags,
            current_stock_kg: selectedProduct.stock_kg,
            current_bags: selectedProduct.bags,
            allows_bag: selectedProduct.allows_bag
        }]
    }));
    
    setSelectedProduct({
        product_id: '',
        quantity: '',
        unit: 'KG',
        stock_kg: 0,
        bags: 0,
        remaining_kg: 0,
        bag_weight_kg: null,
        allows_bag: false,
        product_name: ''
    });
    
    setError('');
};

    const removeItem = (index) => {
        setFormData(prev => ({
            ...prev,
            items: prev.items.filter((_, i) => i !== index)
        }));
    };

    const updateItemQuantity = async (index, newQuantity) => {
        const item = formData.items[index];
        const qty = parseFloat(newQuantity);
        
        if (isNaN(qty) || qty <= 0) return;
        
        const currentStock = await fetchItemCurrentStock(item.product_id, index);
        
        let isValid = false;
        let errorMsg = '';
        
        if (item.unit === 'KG') {
            if (qty <= currentStock.stock_kg) {
                isValid = true;
            } else {
                errorMsg = `Insufficient stock! Available: ${currentStock.stock_kg} kg`;
            }
        } else if (item.unit === 'BAG') {
            if (qty <= currentStock.bags) {
                isValid = true;
            } else {
                errorMsg = `Insufficient stock! Available: ${currentStock.bags} bags (${currentStock.stock_kg} kg)`;
            }
        }
        
        if (!isValid) {
            setError(errorMsg);
            setTimeout(() => setError(''), 3000);
            return;
        }
        
        const kgEquivalent = item.unit === 'KG' ? qty : qty * item.bag_weight_kg;
        
        const updatedItems = [...formData.items];
        updatedItems[index] = {
            ...updatedItems[index],
            quantity: qty,
            kg_equivalent: kgEquivalent,
            current_stock_kg: currentStock.stock_kg,
            current_bags: currentStock.bags
        };
        setFormData(prev => ({ ...prev, items: updatedItems }));
        setError('');
    };

    const refreshAllItemsStock = async () => {
        if (!formData.from_branch || formData.items.length === 0) return;
        
        const updatedItems = [...formData.items];
        for (let i = 0; i < updatedItems.length; i++) {
            const item = updatedItems[i];
            try {
                const response = await api.get(`/api/inventory/branch-stock/?branch_id=${formData.from_branch}&product_id=${item.product_id}`);
                const stockData = response.data;
                
                updatedItems[i] = {
                    ...updatedItems[i],
                    current_stock_kg: stockData.stock_kg || 0,
                    current_bags: stockData.bags || 0,
                    current_remaining_kg: stockData.remaining_kg || 0
                };
                
                if (item.unit === 'KG' && item.quantity > stockData.stock_kg) {
                    setError(`Warning: ${item.product_name} quantity (${item.quantity} kg) exceeds current stock (${stockData.stock_kg} kg)`);
                } else if (item.unit === 'BAG' && item.quantity > stockData.bags) {
                    setError(`Warning: ${item.product_name} quantity (${item.quantity} bags) exceeds current stock (${stockData.bags} bags)`);
                }
            } catch (err) {
                console.error('Failed to refresh stock', err);
            }
        }
        setFormData(prev => ({ ...prev, items: updatedItems }));
    };

    const handleBranchChange = async (branchId) => {
        setFormData(prev => ({ ...prev, from_branch: branchId }));
        setSelectedProduct(prev => ({ ...prev, product_id: '', quantity: '' }));
        
        if (branchId && formData.items.length > 0) {
            await refreshAllItemsStock();
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (formData.items.length === 0) {
            setError('Please add at least one item');
            setTimeout(() => setError(''), 3000);
            return;
        }
        
        for (const item of formData.items) {
            try {
                const response = await api.get(`/api/inventory/branch-stock/?branch_id=${formData.from_branch}&product_id=${item.product_id}`);
                const currentStock = response.data.stock_kg || 0;
                const product = products.find(p => p.id === item.product_id);
                
                let requiredKg = item.unit === 'KG' ? item.quantity : item.quantity * (product?.bag_weight_kg || 1);
                
                if (currentStock < requiredKg) {
                    setError(`Insufficient stock for ${item.product_name}. Available: ${currentStock} kg, Required: ${requiredKg} kg`);
                    return;
                }
            } catch (err) {
                console.error('Stock check failed', err);
            }
        }
        
        setLoading(true);
        setError('');
        
        try {
            const payload = {
                from_branch: parseInt(formData.from_branch),
                to_branch: parseInt(formData.to_branch),
                items: formData.items.map(item => ({
                    product_id: item.product_id,
                    quantity: item.quantity,
                    unit: item.unit
                })),
                notes: formData.notes
            };
            
            const response = await transferService.createTransfer(payload);
            setSuccessMessage(response.message || 'Transfer created successfully!');
            setTimeout(() => {
                onSuccess();
            }, 1500);
        } catch (err) {
            const errorMsg = err.response?.data?.error || 'Failed to create transfer';
            setError(errorMsg);
            setTimeout(() => setError(''), 4000);
        } finally {
            setLoading(false);
        }
    };

    const totalItems = formData.items.length;
    const totalQuantity = formData.items.reduce((sum, item) => sum + item.quantity, 0);
    const totalKg = formData.items.reduce((sum, item) => sum + item.kg_equivalent, 0);

    return (
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            {/* Header */}
            <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: 24
            }}>
                <div>
                    <h2 style={{ margin: 0, fontSize: 24, fontWeight: 600 }}>Create Stock Transfer</h2>
                    <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: 14 }}>
                        Transfer stock between branches with multiple items
                    </p>
                </div>
                <button 
                    className="btn outline" 
                    onClick={onCancel}
                    style={{ padding: '8px 20px' }}
                >
                    Cancel
                </button>
            </div>

            {/* Success Message */}
            {successMessage && (
                <div style={{
                    backgroundColor: '#d1fae5',
                    color: '#065f46',
                    padding: '12px 16px',
                    borderRadius: 8,
                    marginBottom: 20,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8
                }}>
                    <span style={{ fontSize: 18 }}>✅</span>
                    {successMessage}
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                {/* Left Column - Transfer Details */}
                <div className="card" style={{ padding: 24 }}>
                    <h3 style={{ margin: '0 0 20px 0', fontSize: 18, fontWeight: 600 }}>
                        Transfer Details
                    </h3>
                    
                    <div style={{ marginBottom: 20 }}>
                        <label style={{ display: 'block', marginBottom: 8, fontWeight: 500, fontSize: 14 }}>
                            Source Branch *
                        </label>
                        <select
                            value={formData.from_branch}
                            onChange={(e) => handleBranchChange(e.target.value)}
                            required
                            style={{
                                width: '100%',
                                padding: '10px 12px',
                                border: '1px solid #d1d5db',
                                borderRadius: 8,
                                fontSize: 14,
                                backgroundColor: 'white'
                            }}
                        >
                            <option value="">Select source branch</option>
                            {branches.map(b => (
                                <option key={b.id} value={b.id}>{b.name}</option>
                            ))}
                        </select>
                    </div>
                    
                    <div style={{ marginBottom: 20 }}>
                        <label style={{ display: 'block', marginBottom: 8, fontWeight: 500, fontSize: 14 }}>
                            Destination Branch *
                        </label>
                        <select
                            value={formData.to_branch}
                            onChange={(e) => setFormData(prev => ({ ...prev, to_branch: e.target.value }))}
                            required
                            style={{
                                width: '100%',
                                padding: '10px 12px',
                                border: '1px solid #d1d5db',
                                borderRadius: 8,
                                fontSize: 14,
                                backgroundColor: 'white'
                            }}
                        >
                            <option value="">Select destination branch</option>
                            {branches.map(b => (
                                <option key={b.id} value={b.id}>{b.name}</option>
                            ))}
                        </select>
                    </div>
                    
                    <div>
                        <label style={{ display: 'block', marginBottom: 8, fontWeight: 500, fontSize: 14 }}>
                            Notes (Optional)
                        </label>
                        <textarea
                            value={formData.notes}
                            onChange={(e) => setFormData({...formData, notes: e.target.value})}
                            rows="3"
                            placeholder="Add any special instructions or notes..."
                            style={{
                                width: '100%',
                                padding: '10px 12px',
                                border: '1px solid #d1d5db',
                                borderRadius: 8,
                                fontSize: 14,
                                resize: 'vertical',
                                fontFamily: 'inherit'
                            }}
                        />
                    </div>
                </div>

                {/* Right Column - Add Items */}
                <div className="card" style={{ padding: 24 }}>
                    <h3 style={{ margin: '0 0 20px 0', fontSize: 18, fontWeight: 600 }}>
                        Add Items
                    </h3>
                    
                    <div style={{ marginBottom: 16 }}>
                        <label style={{ display: 'block', marginBottom: 8, fontWeight: 500, fontSize: 14 }}>
                            Select Product *
                        </label>
                        <select
                            value={selectedProduct.product_id}
                            onChange={(e) => handleProductSelect(e.target.value)}
                            disabled={!formData.from_branch}
                            style={{
                                width: '100%',
                                padding: '10px 12px',
                                border: '1px solid #d1d5db',
                                borderRadius: 8,
                                fontSize: 14,
                                backgroundColor: !formData.from_branch ? '#f3f4f6' : 'white',
                                cursor: !formData.from_branch ? 'not-allowed' : 'pointer'
                            }}
                        >
                            <option value="">
                                {formData.from_branch ? 'Select a product' : 'Select source branch first'}
                            </option>
                            {products.map(p => (
                                <option key={p.id} value={p.id}>
                                    {p.name} - {p.sku}
                                </option>
                            ))}
                        </select>
                    </div>
                    
                    {selectedProduct.product_id && (
                        <>
                            {/* Stock Display Card - Shows both KG and Bags */}
                            <div style={{
                                backgroundColor: '#f0fdf4',
                                borderRadius: 8,
                                padding: 16,
                                marginBottom: 20,
                                border: '1px solid #bbf7d0'
                            }}>
                                <div style={{ fontSize: 13, fontWeight: 500, color: '#166534', marginBottom: 12 }}>
                                    📦 Available Stock at Source Branch
                                </div>
                                <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
                                    <div>
                                        <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 4 }}>In Kilograms</div>
                                        <div style={{ fontSize: 24, fontWeight: 700, color: '#065f46' }}>
                                            {fetchingStock ? '...' : `${selectedProduct.stock_kg.toFixed(2)} kg`}
                                        </div>
                                    </div>
                                    {selectedProduct.allows_bag && (
                                        <>
                                            <div>
                                                <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 4 }}>Full Bags</div>
                                                <div style={{ fontSize: 24, fontWeight: 700, color: '#065f46' }}>
                                                    {fetchingStock ? '...' : `${selectedProduct.bags} bags`}
                                                </div>
                                                {selectedProduct.bag_weight_kg && (
                                                    <div style={{ fontSize: 10, color: '#6b7280' }}>
                                                        {selectedProduct.bag_weight_kg} kg/bag
                                                    </div>
                                                )}
                                            </div>
                                            {selectedProduct.remaining_kg > 0 && (
                                                <div>
                                                    <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 4 }}>Loose Stock</div>
                                                    <div style={{ fontSize: 20, fontWeight: 600, color: '#f59e0b' }}>
                                                        {selectedProduct.remaining_kg.toFixed(2)} kg
                                                    </div>
                                                    <div style={{ fontSize: 10, color: '#6b7280' }}>
                                                        (cannot form a full bag)
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Unit Selection - Only show if product allows bags */}
                            {selectedProduct.allows_bag && (
                                <div style={{ marginBottom: 16 }}>
                                    <label style={{ display: 'block', marginBottom: 8, fontWeight: 500, fontSize: 14 }}>
                                        Transfer Unit *
                                    </label>
                                    <div style={{ display: 'flex', gap: 16 }}>
                                        <label style={{ 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            gap: 8, 
                                            cursor: 'pointer',
                                            padding: '8px 16px',
                                            borderRadius: 8,
                                            backgroundColor: selectedProduct.unit === 'KG' ? '#3b82f6' : '#f3f4f6',
                                            color: selectedProduct.unit === 'KG' ? 'white' : '#374151',
                                            transition: 'all 0.2s'
                                        }}>
                                            <input
                                                type="radio"
                                                value="KG"
                                                checked={selectedProduct.unit === 'KG'}
                                                onChange={() => handleUnitChange('KG')}
                                                style={{ display: 'none' }}
                                            />
                                            <span>📦 Kilograms (kg)</span>
                                        </label>
                                        <label style={{ 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            gap: 8, 
                                            cursor: 'pointer',
                                            padding: '8px 16px',
                                            borderRadius: 8,
                                            backgroundColor: selectedProduct.unit === 'BAG' ? '#3b82f6' : '#f3f4f6',
                                            color: selectedProduct.unit === 'BAG' ? 'white' : '#374151',
                                            transition: 'all 0.2s'
                                        }}>
                                            <input
                                                type="radio"
                                                value="BAG"
                                                checked={selectedProduct.unit === 'BAG'}
                                                onChange={() => handleUnitChange('BAG')}
                                                style={{ display: 'none' }}
                                            />
                                            <span>🛍️ Bags ({selectedProduct.bag_weight_kg} kg/bag)</span>
                                        </label>
                                    </div>
                                </div>
                            )}
                            
                            <div style={{ marginBottom: 16 }}>
                                <label style={{ display: 'block', marginBottom: 8, fontWeight: 500, fontSize: 14 }}>
                                    Quantity to Transfer *
                                </label>
                                <input
                                    type="number"
                                    step={selectedProduct.unit === 'BAG' ? "1" : "0.01"}
                                    min="0.01"
                                    max={getMaxQuantity()}
                                    placeholder={
                                        selectedProduct.unit === 'KG' 
                                            ? `Enter quantity in kg (max ${selectedProduct.stock_kg} kg)` 
                                            : `Enter number of bags (max ${selectedProduct.bags} bags)`
                                    }
                                    value={selectedProduct.quantity}
                                    onChange={(e) => setSelectedProduct({...selectedProduct, quantity: e.target.value})}
                                    disabled={fetchingStock}
                                    style={{
                                        width: '100%',
                                        padding: '10px 12px',
                                        border: `1px solid ${selectedProduct.quantity && !validateQuantity(selectedProduct.quantity, selectedProduct.unit, selectedProduct.stock_kg, selectedProduct.bags) ? '#dc2626' : '#d1d5db'}`,
                                        borderRadius: 8,
                                        fontSize: 14,
                                        backgroundColor: fetchingStock ? '#f3f4f6' : 'white'
                                    }}
                                />
                                {selectedProduct.quantity && selectedProduct.unit === 'BAG' && selectedProduct.bag_weight_kg && (
                                    <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>
                                        ≈ {parseFloat(selectedProduct.quantity) * selectedProduct.bag_weight_kg} kg total
                                    </div>
                                )}
                            </div>
                            
                            <button
                                type="button"
                                className="btn btn-primary"
                                onClick={addItem}
                                disabled={!selectedProduct.quantity || !validateQuantity(selectedProduct.quantity, selectedProduct.unit, selectedProduct.stock_kg, selectedProduct.bags) || fetchingStock}
                                style={{
                                    width: '100%',
                                    padding: '10px',
                                    backgroundColor: '#3b82f6',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: 8,
                                    fontSize: 14,
                                    fontWeight: 500,
                                    cursor: 'pointer',
                                    opacity: (!selectedProduct.quantity || !validateQuantity(selectedProduct.quantity, selectedProduct.unit, selectedProduct.stock_kg, selectedProduct.bags) || fetchingStock) ? 0.6 : 1
                                }}
                            >
                                + Add Item
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Items List */}
            {formData.items.length > 0 && (
                <div className="card" style={{ marginTop: 24, padding: 24 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                        <div>
                            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>Transfer Items</h3>
                            <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: 13 }}>
                                {totalItems} item(s) · {totalQuantity} units · {totalKg.toFixed(2)} kg total
                            </p>
                        </div>
                    </div>
                    
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                                    <th style={{ textAlign: 'left', padding: '12px 8px', fontWeight: 600, fontSize: 13, color: '#6b7280' }}>Product</th>
                                    <th style={{ textAlign: 'left', padding: '12px 8px', fontWeight: 600, fontSize: 13, color: '#6b7280' }}>Unit</th>
                                    <th style={{ textAlign: 'right', padding: '12px 8px', fontWeight: 600, fontSize: 13, color: '#6b7280' }}>Quantity</th>
                                    <th style={{ textAlign: 'right', padding: '12px 8px', fontWeight: 600, fontSize: 13, color: '#6b7280' }}>KG Equivalent</th>
                                    <th style={{ textAlign: 'right', padding: '12px 8px', fontWeight: 600, fontSize: 13, color: '#6b7280' }}>Current Stock</th>
                                    <th style={{ textAlign: 'center', padding: '12px 8px', fontWeight: 600, fontSize: 13, color: '#6b7280' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {formData.items.map((item, idx) => (
                                    <tr key={item.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                        <td style={{ padding: '12px 8px' }}>
                                            <div style={{ fontWeight: 500 }}>{item.product_name}</div>
                                            <div style={{ fontSize: 11, color: '#6b7280' }}>ID: {item.product_id}</div>
                                        </td>
                                        <td style={{ padding: '12px 8px' }}>{item.unit === 'KG' ? 'kg' : 'Bags'}</td>
                                        <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                                            <input
                                                type="number"
                                                step={item.unit === 'BAG' ? "1" : "0.01"}
                                                value={item.quantity}
                                                onChange={(e) => updateItemQuantity(idx, e.target.value)}
                                                style={{
                                                    width: 100,
                                                    padding: '6px 8px',
                                                    border: '1px solid #d1d5db',
                                                    borderRadius: 6,
                                                    textAlign: 'right'
                                                }}
                                            />
                                            {checkingItemStock[idx] && (
                                                <div style={{ fontSize: 10, color: '#6b7280', marginTop: 2 }}>Checking stock...</div>
                                            )}
                                        </td>
                                        <td style={{ padding: '12px 8px', textAlign: 'right', color: '#6b7280' }}>
                                            {item.kg_equivalent.toFixed(2)} kg
                                        </td>
                                        <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                                            <div>
                                                <div>{item.current_stock_kg?.toFixed(2)} kg</div>
                                                {item.allows_bag && (
                                                    <div style={{ fontSize: 11, color: '#6b7280' }}>
                                                        {item.current_bags} bags
                                                        {item.current_remaining_kg > 0 && (
                                                            <span> + {item.current_remaining_kg.toFixed(2)} kg</span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                            {item.quantity > item.current_stock_kg && item.unit === 'KG' && (
                                                <div style={{ color: '#dc2626', fontSize: 11, marginTop: 4 }}>⚠️ Exceeds stock</div>
                                            )}
                                            {item.quantity > item.current_bags && item.unit === 'BAG' && (
                                                <div style={{ color: '#dc2626', fontSize: 11, marginTop: 4 }}>⚠️ Exceeds stock</div>
                                            )}
                                        </td>
                                        <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                                            <button
                                                type="button"
                                                onClick={() => removeItem(idx)}
                                                style={{
                                                    background: 'none',
                                                    border: 'none',
                                                    color: '#dc2626',
                                                    cursor: 'pointer',
                                                    fontSize: 18
                                                }}
                                                title="Remove item"
                                            >
                                                ×
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Error Message */}
            {error && (
                <div style={{
                    backgroundColor: '#fee2e2',
                    color: '#dc2626',
                    padding: '12px 16px',
                    borderRadius: 8,
                    marginTop: 20,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8
                }}>
                    <span style={{ fontSize: 18 }}>⚠️</span>
                    {error}
                </div>
            )}

            {/* Action Buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
                <button
                    type="button"
                    className="btn outline"
                    onClick={onCancel}
                    style={{ padding: '10px 24px', fontSize: 14 }}
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    className="btn btn-primary"
                    onClick={handleSubmit}
                    disabled={loading || formData.items.length === 0 || !formData.from_branch || !formData.to_branch}
                    style={{
                        padding: '10px 32px',
                        fontSize: 14,
                        backgroundColor: '#3b82f6',
                        color: 'white',
                        border: 'none',
                        borderRadius: 8,
                        cursor: 'pointer',
                        opacity: (loading || formData.items.length === 0 || !formData.from_branch || !formData.to_branch) ? 0.6 : 1
                    }}
                >
                    {loading ? 'Creating Transfer...' : 'Create Transfer'}
                </button>
            </div>
        </div>
    );
}

export default CreateTransfer;