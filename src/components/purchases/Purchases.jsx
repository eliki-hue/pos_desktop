// src/components/purchases/Purchases.jsx
import React from 'react';
import { Outlet } from 'react-router-dom';
import AppLayout from '../AppLayout';

const Purchases = () => {
  return (
    <AppLayout title="Purchase Management" subtitle="Manage supplier purchases and track payments">
      <Outlet />
    </AppLayout>
  );
};

export default Purchases;