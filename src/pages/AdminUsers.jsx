import React, { useEffect, useState } from 'react';
import AppLayout from '../components/AppLayout';
import UserTable from './users/UserTable';
import UserFormModal from './users/UserFormModal';
import { userApi } from './users/userApi';
import './users/admin.css';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await userAPI.getUsers();
      setUsers(res.data);
    } catch (err) {
      showMessage('error', 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const loadBranches = async () => {
    try {
      const res = await api.get('/api/branches/');
      setBranches(res.data || []);
    } catch (err) {
      console.error('Failed to load branches', err);
    }
  };

  useEffect(() => {
    loadUsers();
    loadBranches();
  }, []);

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const handleEdit = (user) => {
    setSelectedUser(user);
  };

  const handleDeactivate = async (userId) => {
    if (!window.confirm('Are you sure you want to deactivate this user?')) return;
    
    try {
      await userAPI.deactivateUser(userId);
      showMessage('success', 'User deactivated successfully');
      loadUsers();
    } catch (err) {
      showMessage('error', 'Failed to deactivate user');
    }
  };

  const handleActivate = async (userId) => {
    try {
      await userAPI.activateUser(userId);
      showMessage('success', 'User activated successfully');
      loadUsers();
    } catch (err) {
      showMessage('error', 'Failed to activate user');
    }
  };

  const handlePasswordReset = () => {
    showMessage('success', 'Password reset successfully');
  };

  return (
    <AppLayout title="Users" subtitle="Manage system users">
      {message.text && (
        <div className={`alert alert-${message.type}`} role="alert">
          <span className="alert-icon">{message.type === 'success' ? '✓' : '⚠️'}</span>
          {message.text}
        </div>
      )}
      
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end' }}>
        <button className="btn btn-neutral" onClick={() => setShowAddModal(true)}>
          <span className="btn-icon">➕</span>
          Add User
        </button>
      </div>
      
      {(showAddModal || selectedUser) && (
        <UserFormModal
          user={selectedUser}
          branches={branches}
          onClose={() => {
            setSelectedUser(null);
            setShowAddModal(false);
          }}
          onSaved={() => {
            loadUsers();
            setSelectedUser(null);
            setShowAddModal(false);
            showMessage('success', selectedUser ? 'User updated successfully' : 'User created successfully');
          }}
        />
      )}
      
      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: '48px' }}>
          <div className="spinner" style={{ width: '32px', height: '32px' }}></div>
          <p style={{ marginTop: '12px', color: '#64748b' }}>Loading users...</p>
        </div>
      ) : (
        <UserTable
          users={users}
          onEdit={handleEdit}
          onDeactivate={handleDeactivate}
          onActivate={handleActivate}
          onPasswordReset={handlePasswordReset}
        />
      )}
    </AppLayout>
  );
}