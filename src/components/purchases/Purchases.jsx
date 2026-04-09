import React, { useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import PurchaseList from './PurchaseList';
import PurchaseDetail from './PurchaseDetail';
import PurchaseForm from './PurchaseForm';
import { Plus } from 'lucide-react';

const Purchases = () => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const navigate = useNavigate();

  const refreshData = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <Routes>
        <Route path="/" element={
          <>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Purchase Management</h1>
                <p className="text-gray-600 mt-1">Manage supplier purchases, track payments, and monitor inventory</p>
              </div>
              <button
                onClick={() => navigate('/purchases/new')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
              >
                <Plus size={20} />
                New Purchase
              </button>
            </div>
            <PurchaseList refreshTrigger={refreshTrigger} onDataChange={refreshData} />
          </>
        } />
        <Route path="/new" element={<PurchaseForm onSuccess={refreshData} />} />
        <Route path="/:id" element={<PurchaseDetail onDataChange={refreshData} />} />
        <Route path="/:id/edit" element={<PurchaseForm isEdit onSuccess={refreshData} />} />
      </Routes>
    </div>
  );
};

export default Purchases;