import React, { useState, useEffect } from 'react';
import { api } from '../../api/axios';

const ResetPasswordModal = ({ isOpen, onClose, userName, userId, onSuccess }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setPassword('');
      setConfirmPassword('');
      setShowPassword(false);
      setError('');
      setSuccess('');
      setLoading(false);
    }
  }, [isOpen]);

  // Validation checks
  const isPasswordValid = password.length >= 8;
  const doPasswordsMatch = password === confirmPassword;
  const isFormValid = isPasswordValid && doPasswordsMatch && password !== '';

  const handleSubmit = async () => {
    if (!isFormValid) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
        await api.post(
        `/api/auth/admin/users/${userId}/reset-password/`,
        { password }
        );

        setSuccess('Password reset successfully!');

        setTimeout(() => {
        onSuccess?.();
        onClose();
        }, 1500);

    } catch (err) {
        setError(
        err.response?.data?.detail ||
        err.response?.data?.error ||
        'Failed to reset password'
        );

    } finally {
        setLoading(false);
    }
    };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape' && !loading) {
      onClose();
    }
    if (e.key === 'Enter' && isFormValid && !loading) {
      handleSubmit();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div 
        className="modal-backdrop" 
        onClick={() => !loading && onClose()}
        aria-hidden="true"
      />
      
      <div 
        className="reset-password-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        onKeyDown={handleKeyDown}
      >
        <div className="modal-header">
          <h3 id="modal-title">Reset Password</h3>
          <button 
            className="modal-close-btn"
            onClick={() => !loading && onClose()}
            disabled={loading}
            aria-label="Close modal"
          >
            ×
          </button>
        </div>
        
        <div className="modal-body">
          <p className="modal-subtitle">
            Reset password for: <strong>{userName}</strong>
          </p>
          
          {error && (
            <div className="alert alert-error" role="alert">
              <span className="alert-icon">⚠️</span>
              {error}
            </div>
          )}
          
          {success && (
            <div className="alert alert-success" role="alert">
              <span className="alert-icon">✓</span>
              {success}
            </div>
          )}
          
          <div className="form-group">
            <label htmlFor="new-password" className="form-label">
              New Password <span className="required">*</span>
            </label>
            <div className="password-input-wrapper">
              <input
                id="new-password"
                type={showPassword ? 'text' : 'password'}
                className={`form-input ${!isPasswordValid && password ? 'form-input-error' : ''}`}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                placeholder="Enter new password"
                autoComplete="new-password"
                aria-describedby="password-hint"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
            <div id="password-hint" className="form-hint">
              {!isPasswordValid && password && (
                <span className="hint-error">Password must be at least 8 characters</span>
              )}
              {isPasswordValid && <span className="hint-success">✓ Password meets requirements</span>}
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="confirm-password" className="form-label">
              Confirm Password <span className="required">*</span>
            </label>
            <input
              id="confirm-password"
              type={showPassword ? 'text' : 'password'}
              className={`form-input ${!doPasswordsMatch && confirmPassword ? 'form-input-error' : ''}`}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading}
              placeholder="Confirm new password"
              autoComplete="new-password"
              aria-describedby="confirm-hint"
            />
            <div id="confirm-hint" className="form-hint">
              {!doPasswordsMatch && confirmPassword && (
                <span className="hint-error">Passwords do not match</span>
              )}
              {doPasswordsMatch && confirmPassword && (
                <span className="hint-success">✓ Passwords match</span>
              )}
            </div>
          </div>
          
          <div className="password-requirements">
            <p className="requirements-title">Password requirements:</p>
            <ul className="requirements-list">
              <li className={password.length >= 8 ? 'requirement-met' : ''}>
                {password.length >= 8 ? '✓' : '○'} Minimum 8 characters
              </li>
              <li className={doPasswordsMatch && password ? 'requirement-met' : ''}>
                {doPasswordsMatch && password ? '✓' : '○'} Passwords must match
              </li>
            </ul>
          </div>
        </div>
        
        <div className="modal-footer">
          <button 
            className="btn btn-secondary"
            onClick={() => !loading && onClose()}
            disabled={loading}
            type="button"
          >
            Cancel
          </button>
          <button 
            className="btn btn-warning"
            onClick={handleSubmit}
            disabled={!isFormValid || loading}
            type="button"
            aria-label="Reset password"
          >
            {loading ? (
              <>
                <span className="spinner" aria-hidden="true"></span>
                Resetting...
              </>
            ) : (
              'Reset Password'
            )}
          </button>
        </div>
      </div>
    </>
  );
};

export default ResetPasswordModal;