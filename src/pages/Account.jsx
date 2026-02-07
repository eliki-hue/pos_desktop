import { useState } from "react";
import AppLayout from "../components/AppLayout";
import { useAuth } from "../auth/AuthContext";
import { api } from "../api/client";

export default function Account() {
  const { user } = useAuth();

  const [editingPassword, setEditingPassword] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState(false);

  const initials =
    user?.username
      ?.split(" ")
      .map((p) => p[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "?";

  const changePassword = async () => {
    setMsg("");
    setSaving(true);

    try {
      await api.post("/api/auth/password/change/", {
        old_password: oldPassword,
        new_password: newPassword,
      });

      setEditingPassword(false);
      setOldPassword("");
      setNewPassword("");
    } catch (err) {
      const error =
        err?.response?.data?.error ||
        "Failed to change password";
      setMsg(Array.isArray(error) ? error.join(", ") : error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppLayout title="Account" subtitle="Personal settings">
      <div className="account-container">
        {/* ================= PROFILE ================= */}
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
              <h3 className="section-title">{user?.username}</h3>
              <div className="muted">{user?.email || "—"}</div>
            </div>
          </div>

          <div className="profile-grid">
            <ProfileItem label="Role" value={user?.role} />
            <ProfileItem
              label="Branch"
              value={user?.branch_name || "—"}
            />
          </div>
        </section>

        {/* ================= SECURITY ================= */}
        <section className="card">
          <div className="security-header">
            <h3 className="section-title">Security</h3>

            {!editingPassword && (
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
              />

              <input
                type="password"
                className="input"
                placeholder="New password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />

              {msg && <div className="error-text">{msg}</div>}

              <div className="actions">
                <button
                  className="btn btn-primary"
                  disabled={saving}
                  onClick={changePassword}
                >
                  {saving ? "Saving..." : "Update password"}
                </button>

                <button
                  className="btn"
                  onClick={() => {
                    setEditingPassword(false);
                    setMsg("");
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </section>
      </div>

      {/* ================= STYLES ================= */}
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
          background: var(--primary);
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
        }

        .profile-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 14px;
          margin-top: 12px;
        }

        .profile-item span {
          font-size: 12px;
          color: var(--muted);
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
          color: var(--primary);
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
          max-width: 360px;
        }

        .actions {
          display: flex;
          gap: 10px;
        }

        .error-text {
          color: #c0392b;
          font-weight: 700;
          font-size: 13px;
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
