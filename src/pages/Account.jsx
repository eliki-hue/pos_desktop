import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "../components/AppLayout";
import { useAuth } from "../auth/AuthContext";
import { api } from "../api/client";

export default function Account() {
  const { user, mustChangePassword, refreshUser, logout } = useAuth();
  const navigate = useNavigate();

  const [editingPassword, setEditingPassword] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState(false);

  // Show password change form automatically if must_change_password is true
  useEffect(() => {
    if (mustChangePassword) {
      setEditingPassword(true);
      setMsg("⚠️ You are required to change your password before continuing.");
    }
  }, [mustChangePassword]);

  const initials = user?.username
    ? user.username
        .split(" ")
        .map((p) => p[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "?";

  const changePassword = async () => {
    setMsg("");
    setSaving(true);

    try {
      await api.post("/api/auth/password/change/", {
        old_password: oldPassword,
        new_password: newPassword,
      });

      // Refresh user data - backend already set must_change_password to false
      await refreshUser();

      setEditingPassword(false);
      setOldPassword("");
      setNewPassword("");
      setMsg("Password updated successfully! Redirecting...");

      // Redirect to home after short delay
      setTimeout(() => {
        navigate("/");
      }, 1500);
    } catch (err) {
      const error =
        err?.response?.data?.error ||
        err?.response?.data?.detail ||
        "Failed to change password";

      setMsg(Array.isArray(error) ? error.join(", ") : error);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    // If password change is required, don't allow cancel
    if (mustChangePassword) {
      setMsg("⚠️ You must change your password to continue using the system.");
      return;
    }
    
    setEditingPassword(false);
    setMsg("");
    setOldPassword("");
    setNewPassword("");
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <AppLayout title="Account" subtitle="Personal settings">
      <div className="account-container">
        {/* WARNING BANNER FOR FORCED PASSWORD CHANGE */}
        {mustChangePassword && (
          <div className="warning-banner">
            <span className="warning-icon">⚠️</span>
            <div className="warning-content">
              <strong>Password Change Required</strong>
              <p>For security reasons, you must change your password before continuing.</p>
            </div>
          </div>
        )}

        {/* PROFILE */}
        <section className="card">
          <div className="profile-header">
            <div className="avatar">
              {user?.profile_image ? (
                <img src={user.profile_image} alt="Profile" />
              ) : (
                <span>{initials}</span>
              )}
            </div>

            <div>
              <h3 className="section-title">{user?.username || "User"}</h3>
              <div className="muted">{user?.email || "—"}</div>
            </div>
          </div>

          <div className="profile-grid">
            <ProfileItem label="Role:" value={user?.role || "—"} />
            <ProfileItem label="Branch:" value={user?.branch?.name || "—"} />
          </div>
        </section>

        {/* SECURITY */}
        <section className="card">
          <div className="security-header">
            <h3 className="section-title">Security</h3>

            {!editingPassword && !mustChangePassword && (
              <button
                className="link-btn"
                onClick={() => setEditingPassword(true)}
              >
                Change password
              </button>
            )}
          </div>

          {editingPassword && (
            <div className="password-form">
              <input
                type="password"
                className="input"
                placeholder="Current password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                autoFocus={mustChangePassword}
                required
              />

              <input
                type="password"
                className="input"
                placeholder="New password (min. 8 characters)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />

              {/* Password strength indicator */}
              {newPassword && (
                <div className="password-strength">
                  <div className={`strength-bar ${
                    newPassword.length >= 8 ? 'strength-good' : 'strength-weak'
                  }`} />
                  <span className="strength-text">
                    {newPassword.length >= 8 
                      ? "✓ Password meets requirements" 
                      : "Password must be at least 8 characters"}
                  </span>
                </div>
              )}

              {msg && (
                <div className={`message ${msg.includes("successfully") ? "success-text" : "error-text"}`}>
                  {msg}
                </div>
              )}

              <div className="actions">
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={saving || !oldPassword || !newPassword || newPassword.length < 8}
                  onClick={changePassword}
                >
                  {saving ? "Saving..." : "Update password"}
                </button>

                <button
                  type="button"
                  className="btn"
                  onClick={handleCancel}
                  disabled={saving}
                >
                  Cancel
                </button>

                {/* Show logout option only when password change is required */}
                {mustChangePassword && (
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={handleLogout}
                    disabled={saving}
                  >
                    Logout
                  </button>
                )}
              </div>
            </div>
          )}
        </section>
      </div>

      {/* STYLES */}
      <style>{`
        .account-container {
          max-width: 860px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .profile-header {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 14px;
        }

        .avatar {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: var(--primary, #3b82f6);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 900;
          font-size: 18px;
          overflow: hidden;
        }

        .avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .section-title {
          font-size: 16px;
          font-weight: 900;
          margin: 0;
        }

        .profile-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 14px;
          margin-top: 12px;
        }

        .profile-item span {
          font-size: 12px;
          color: var(--muted, #64748b);
        }

        .profile-item strong {
          font-size: 15px;
        }

        .security-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .link-btn {
          background: none;
          border: none;
          color: var(--primary, #3b82f6);
          font-weight: 700;
          cursor: pointer;
          padding: 0;
        }

        .link-btn:hover {
          text-decoration: underline;
        }

        .password-form {
          margin-top: 14px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          max-width: 400px;
        }

        .actions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .error-text {
          color: #dc2626;
          font-weight: 500;
          font-size: 13px;
          padding: 8px;
          background: #fef2f2;
          border-radius: 6px;
        }

        .success-text {
          color: #059669;
          font-weight: 500;
          font-size: 13px;
          padding: 8px;
          background: #ecfdf5;
          border-radius: 6px;
        }

        .warning-banner {
          background: #fef3c7;
          border: 1px solid #fde68a;
          border-radius: 12px;
          padding: 16px;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .warning-icon {
          font-size: 24px;
        }

        .warning-content strong {
          display: block;
          margin-bottom: 4px;
          color: #92400e;
        }

        .warning-content p {
          margin: 0;
          font-size: 13px;
          color: #78350f;
        }

        .password-strength {
          margin-top: -5px;
        }

        .strength-bar {
          height: 4px;
          border-radius: 2px;
          margin-bottom: 6px;
          transition: all 0.3s;
        }

        .strength-weak {
          width: 50%;
          background: #dc2626;
        }

        .strength-good {
          width: 100%;
          background: #059669;
        }

        .strength-text {
          font-size: 12px;
          color: #64748b;
        }

        @media (max-width: 640px) {
          .actions {
            flex-direction: column;
          }
          
          .actions button {
            width: 100%;
          }
        }
      `}</style>
    </AppLayout>
  );
}

function ProfileItem({ label, value }) {
  return (
    <div className="profile-item">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}