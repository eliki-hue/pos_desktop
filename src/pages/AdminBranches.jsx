import React, { useEffect, useState } from "react";
import AppLayout from "../components/AppLayout";
import { api } from "../api/client";
import { useAuth } from "../auth/AuthContext";

export default function AdminBranches() {
  const { user } = useAuth();

  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [editingBranch, setEditingBranch] = useState(null);
  const [showForm, setShowForm] = useState(false);

  // Form state for create/edit
  const [formData, setFormData] = useState({
    name: "",
    branch_code: "",
    phone: "",
    email: "",
    address: "",
    county: "",
    city: "",
    google_maps_url: "",
    manager_name: "",
    is_active: true,
    is_ecommerce_branch: false,
    is_main_branch: false,
  });

  const loadBranches = async () => {
    setLoading(true);
    setMsg("");
    try {
      const res = await api.get("/api/branches/");
      setBranches(res.data || []);
    } catch (err) {
      setMsg(err?.response?.data?.detail || "❌ Failed to load branches");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBranches();
  }, []);

  const resetForm = () => {
    setFormData({
      name: "",
      branch_code: "",
      phone: "",
      email: "",
      address: "",
      county: "",
      city: "",
      google_maps_url: "",
      manager_name: "",
      is_active: true,
      is_ecommerce_branch: false,
      is_main_branch: false,
    });
    setEditingBranch(null);
  };

  const openAddForm = () => {
    resetForm();
    setShowForm(true);
  };

  const openEditForm = (branch) => {
    setEditingBranch(branch);
    setFormData({
      name: branch.name || "",
      branch_code: branch.branch_code || "",
      phone: branch.phone || "",
      email: branch.email || "",
      address: branch.address || "",
      county: branch.county || "",
      city: branch.city || "",
      google_maps_url: branch.google_maps_url || "",
      manager_name: branch.manager_name || "",
      is_active: branch.is_active ?? true,
      is_ecommerce_branch: branch.is_ecommerce_branch ?? false,
      is_main_branch: branch.is_main_branch ?? false,
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    resetForm();
  };

  const createBranch = async () => {
    setMsg("");
    const trimmed = formData.name.trim();
    if (!trimmed) {
      setMsg("❌ Branch name is required");
      return;
    }

    try {
      await api.post("/api/branches/", formData);
      closeForm();
      setMsg("✅ Branch created successfully");
      await loadBranches();
    } catch (err) {
      setMsg(err?.response?.data?.detail || "❌ Failed to create branch");
    }
  };

  const updateBranch = async () => {
    setMsg("");
    const trimmed = formData.name.trim();
    if (!trimmed) {
      setMsg("❌ Branch name is required");
      return;
    }

    try {
      await api.put(`/api/branches/${editingBranch.id}/`, formData);
      closeForm();
      setMsg("✅ Branch updated successfully");
      await loadBranches();
    } catch (err) {
      setMsg(err?.response?.data?.detail || "❌ Failed to update branch");
    }
  };

  const toggleBranchStatus = async (branchId, currentStatus) => {
    try {
      await api.patch(`/api/branches/${branchId}/`, { is_active: !currentStatus });
      setMsg(`✅ Branch ${!currentStatus ? "activated" : "deactivated"}`);
      await loadBranches();
    } catch (err) {
      setMsg(err?.response?.data?.detail || "❌ Failed to update branch status");
    }
  };

  const setAsEcommerce = async (branchId) => {
    try {
      await api.patch(`/api/branches/${branchId}/`, { is_ecommerce_branch: true });
      setMsg("✅ Branch set as ecommerce branch");
      await loadBranches();
    } catch (err) {
      setMsg(err?.response?.data?.detail || "❌ Failed to set ecommerce branch");
    }
  };

  const setAsMain = async (branchId) => {
    try {
      await api.patch(`/api/branches/${branchId}/`, { is_main_branch: true });
      setMsg("✅ Branch set as main branch");
      await loadBranches();
    } catch (err) {
      setMsg(err?.response?.data?.detail || "❌ Failed to set main branch");
    }
  };

  const deleteBranch = async (branchId) => {
    if (!window.confirm("Are you sure you want to delete this branch?")) return;
    try {
      await api.delete(`/api/branches/${branchId}/`);
      setMsg("✅ Branch deleted successfully");
      await loadBranches();
    } catch (err) {
      setMsg(err?.response?.data?.detail || "❌ Failed to delete branch");
    }
  };

  // Kenyan counties list
  const counties = [
    "MOMBASA", "KWALE", "KILIFI", "TANA_RIVER", "LAMU", "TAITA_TAVETA",
    "GARISSA", "WAJIR", "MANDERA", "MARSABIT", "ISIOLO", "MERU", "THARAKA_NITHI",
    "EMBU", "KITUI", "MACHAKOS", "MAKUENI", "NYANDARUA", "NYERI", "KIRINYAGA",
    "MURANGA", "KIAMBU", "TURKANA", "WEST_POKOT", "SAMBURU", "TRANS_NZOIA",
    "UASIN_GISHU", "ELGEYO_MARAKWET", "NANDI", "BARINGO", "LAIKIPIA", "NAKURU",
    "NAROK", "KAJIADO", "KERICHO", "BOMET", "KAKAMEGA", "VIHIGA", "BUNGOMA",
    "BUSIA", "SIAYA", "KISUMU", "HOMA_BAY", "MIGORI", "KISII", "NYAMIRA", "NAIROBI"
  ];

  if (user?.role !== "admin") {
    return (
      <AppLayout title="Branches" subtitle="Admin only">
        <div className="card">
          <div style={{ fontWeight: 900 }}>Access denied</div>
          <div className="muted">Only ADMIN can manage branches.</div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Branches" subtitle="Create and manage store branches">
      {/* Header with Add Button */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <div style={{ fontWeight: 900, fontSize: 18 }}>🏪 Store Branches</div>
          <div className="muted">Manage all branch locations</div>
        </div>
        {!showForm && (
          <button className="btn btn-primary" onClick={openAddForm}>
            ➕ Add New Branch
          </button>
        )}
      </div>

      {/* Create/Edit Branch Form - Only shows when Add or Edit is clicked */}
      {showForm && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontWeight: 900 }}>
                {editingBranch ? "✏️ Edit Branch" : "➕ Create New Branch"}
              </div>
              <div className="muted" style={{ marginTop: 4 }}>
                {editingBranch ? "Update branch details" : "Add new store/branch location"}
              </div>
            </div>
            <button className="btn outline" onClick={closeForm} style={{ fontSize: 20, padding: "4px 12px" }}>
              ✕
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12, marginTop: 16 }}>
            <input
              className="input"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Branch name *"
            />
            <input
              className="input"
              value={formData.branch_code}
              onChange={(e) => setFormData({ ...formData, branch_code: e.target.value.toUpperCase() })}
              placeholder="Branch code (e.g., NRB, MBS)"
            />
            <input
              className="input"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="Phone number (e.g., 0712345678)"
            />
            <input
              className="input"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="Email"
            />
            <input
              className="input"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Street address"
            />
            <input
              className="input"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              placeholder="City/Town"
            />
            <select
              className="input"
              value={formData.county}
              onChange={(e) => setFormData({ ...formData, county: e.target.value })}
            >
              <option value="">Select County</option>
              {counties.map(county => (
                <option key={county} value={county}>{county}</option>
              ))}
            </select>
            <input
              className="input"
              value={formData.google_maps_url}
              onChange={(e) => setFormData({ ...formData, google_maps_url: e.target.value })}
              placeholder="Google Maps URL"
            />
            <input
              className="input"
              value={formData.manager_name}
              onChange={(e) => setFormData({ ...formData, manager_name: e.target.value })}
              placeholder="Manager name"
            />
          </div>

          <div style={{ display: "flex", gap: 20, marginTop: 12, flexWrap: "wrap" }}>
            <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              />
              ✅ Active
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <input
                type="checkbox"
                checked={formData.is_ecommerce_branch}
                onChange={(e) => setFormData({ ...formData, is_ecommerce_branch: e.target.checked })}
              />
              🛒 Ecommerce Branch (only one)
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <input
                type="checkbox"
                checked={formData.is_main_branch}
                onChange={(e) => setFormData({ ...formData, is_main_branch: e.target.checked })}
              />
              🏢 Main Branch
            </label>
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
            <button className="btn btn-primary" onClick={editingBranch ? updateBranch : createBranch}>
              {editingBranch ? "💾 Update Branch" : "➕ Create Branch"}
            </button>
            <button className="btn outline" onClick={closeForm}>
              Cancel
            </button>
          </div>

          {msg && <div style={{ marginTop: 12, fontWeight: 800, color: msg.includes("✅") ? "green" : "red" }}>{msg}</div>}
        </div>
      )}

      {/* Branches List */}
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
          <div>
            <div style={{ fontWeight: 900 }}>📋 All Branches</div>
            <div className="muted">Total: {branches.length}</div>
          </div>
          <button className="btn outline" onClick={loadBranches} disabled={loading}>
            🔄 Refresh
          </button>
        </div>

        <div style={{ marginTop: 16, overflowX: "auto" }}>
          {loading ? (
            <div className="muted" style={{ textAlign: "center", padding: 40 }}>Loading branches...</div>
          ) : branches.length === 0 ? (
            <div className="muted" style={{ textAlign: "center", padding: 40 }}>
              No branches found.
              {!showForm && (
                <div style={{ marginTop: 12 }}>
                  <button className="btn btn-primary" onClick={openAddForm}>
                    ➕ Create your first branch
                  </button>
                </div>
              )}
            </div>
          ) : (
            <table className="table" style={{ minWidth: 900 }}>
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Branch</th>
                  <th>Location</th>
                  <th>Contact</th>
                  <th>Manager</th>
                  <th>Status</th>
                  <th style={{ minWidth: 200 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {branches.map((b) => (
                  <tr key={b.id} style={{ backgroundColor: b.is_ecommerce_branch ? "#fef3c7" : "transparent" }}>
                    <td style={{ fontFamily: "monospace", fontWeight: 500 }}>{b.branch_code || "—"}</td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{b.name}</div>
                      <div style={{ fontSize: 11, marginTop: 2 }}>
                        {b.is_ecommerce_branch && <span style={{ color: "#f59e0b" }}>🛒 Ecommerce</span>}
                        {b.is_main_branch && <span style={{ marginLeft: 4, color: "#3b82f6" }}>🏢 Main</span>}
                      </div>
                    </td>
                    <td>
                      <div>{b.city || "—"}</div>
                      <div style={{ fontSize: 11, color: "#666" }}>{b.county || ""}</div>
                    </td>
                    <td>
                      <div>{b.phone || "—"}</div>
                      <div style={{ fontSize: 11, color: "#666" }}>{b.email || ""}</div>
                    </td>
                    <td>{b.manager_name || "—"}</td>
                    <td>
                      <span style={{
                        display: "inline-block",
                        padding: "2px 8px",
                        borderRadius: 12,
                        fontSize: 11,
                        backgroundColor: b.is_active ? "#d1fae5" : "#fee2e2",
                        color: b.is_active ? "#065f46" : "#991b1b",
                      }}>
                        {b.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        <button
                          className="btn outline"
                          onClick={() => openEditForm(b)}
                          style={{ fontSize: 11, padding: "4px 8px" }}
                          title="Edit branch"
                        >
                          ✏️ Edit
                        </button>
                        {!b.is_ecommerce_branch && b.is_active && (
                          <button
                            className="btn outline"
                            onClick={() => setAsEcommerce(b.id)}
                            style={{ fontSize: 11, padding: "4px 8px", backgroundColor: "#fef3c7" }}
                            title="Set as ecommerce branch"
                          >
                            🛒 Set Ecommerce
                          </button>
                        )}
                        {!b.is_main_branch && b.is_active && (
                          <button
                            className="btn outline"
                            onClick={() => setAsMain(b.id)}
                            style={{ fontSize: 11, padding: "4px 8px" }}
                            title="Set as main branch"
                          >
                            🏢 Set Main
                          </button>
                        )}
                        <button
                          className="btn outline"
                          onClick={() => toggleBranchStatus(b.id, b.is_active)}
                          style={{ fontSize: 11, padding: "4px 8px" }}
                        >
                          {b.is_active ? "🔴 Deactivate" : "🟢 Activate"}
                        </button>
                        <button
                          className="btn outline"
                          onClick={() => deleteBranch(b.id)}
                          style={{ fontSize: 11, padding: "4px 8px", color: "#dc2626" }}
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Info Box - Only show when there are branches */}
        {branches.length > 0 && (
          <div style={{ marginTop: 16, padding: 12, backgroundColor: "#fef3c7", borderRadius: 6 }}>
            <div style={{ fontWeight: 500, fontSize: 13, color: "#92400e" }}>
              ℹ️ Branch Information
            </div>
            <div style={{ fontSize: 12, color: "#b45309", marginTop: 4 }}>
              • <strong>🛒 Ecommerce Branch</strong>: Only ONE branch can be ecommerce. This branch handles all online orders.<br/>
              • <strong>🏢 Main Branch</strong>: Used as fallback if no ecommerce branch is set.<br/>
              • <strong>Active/Inactive</strong>: Inactive branches cannot be used for orders.
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}