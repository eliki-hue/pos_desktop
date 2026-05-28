import React, { useState } from 'react';
import ResetPasswordModal from './ResetPasswordModal';

const UserTable = ({ users, onEdit, onDeactivate, onActivate, onPasswordReset }) => {
  const [resetPasswordUser, setResetPasswordUser] = useState(null);

  const getRoleBadgeClass = (role) => {
    switch(role) {
      case 'admin': return 'badge badge-admin';
      case 'manager': return 'badge badge-manager';
      case 'cashier': return 'badge badge-cashier';
      default: return 'badge';
    }
  };

  return (
    <>
      <ResetPasswordModal
        isOpen={!!resetPasswordUser}
        onClose={() => setResetPasswordUser(null)}
        userName={resetPasswordUser?.username}
        userId={resetPasswordUser?.id}
        onSuccess={() => {
          onPasswordReset?.();
          setResetPasswordUser(null);
        }}
      />
      
      <div className="user-table-container">
        <div className="card">
          <div className="table-responsive">
            <table className="table user-table">
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Role</th>
                  <th>Email</th>
                  <th>Branch</th>
                  <th>Status</th>
                  <th className="actions-column">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="empty-state">
                      <div className="empty-message">No users found</div>
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr key={u.id}>
                      <td data-label="Username">
                        <div className="user-info">
                          <span className="username">{u.username}</span>
                          {u.full_name && <span className="user-fullname">{u.full_name}</span>}
                        </div>
                      </td>
                      <td data-label="Role">
                        <span className={getRoleBadgeClass(u.role)}>
                          {u.role?.toUpperCase()}
                        </span>
                      </td>
                      <td data-label="Email" className="email-cell">
                        {u.email || '—'}
                      </td>
                      <td data-label="Branch">
                        {u.branch_name || '—'}
                      </td>
                      <td data-label="Status">
                        <span className={`status-badge ${u.is_active ? 'status-active' : 'status-inactive'}`}>
                          {u.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td data-label="Actions" className="actions-cell">
                        <div className="action-buttons">
                          <button
                            className="btn btn-sm btn-neutral"
                            onClick={() => onEdit(u)}
                            aria-label={`Edit ${u.username}`}
                            title="Edit user"
                          >
                            <span className="btn-icon">✏️</span>
                            <span className="btn-text">Edit</span>
                          </button>
                          
                          {u.is_active && (
                            <button
                              className="btn btn-sm btn-warning"
                              onClick={() => setResetPasswordUser(u)}
                              aria-label={`Reset password for ${u.username}`}
                              title="Reset password"
                            >
                              <span className="btn-icon">🔑</span>
                              <span className="btn-text">Reset PW</span>
                            </button>
                          )}
                          
                          {u.is_active ? (
                            <button
                              className="btn btn-sm btn-danger"
                              onClick={() => onDeactivate(u.id)}
                              aria-label={`Deactivate ${u.username}`}
                              title="Deactivate user"
                            >
                              <span className="btn-icon">🔒</span>
                              <span className="btn-text">Deactivate</span>
                            </button>
                          ) : (
                            <button
                              className="btn btn-sm btn-success"
                              onClick={() => onActivate?.(u.id)}
                              aria-label={`Activate ${u.username}`}
                              title="Activate user"
                            >
                              <span className="btn-icon">✓</span>
                              <span className="btn-text">Activate</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
};

export default UserTable;