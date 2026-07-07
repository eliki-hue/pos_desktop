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
  const [formData, setFormData] = useState({
    name: "",
    branch_code: "",
    phone: "",
    phone_2: "",
    phone_3: "",
    paybill: "",
    account_number: "",
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

  const counties = [
    "MOMBASA", "KWALE", "KILIFI", "TANA_RIVER", "LAMU", "TAITA_TAVETA",
    "GARISSA", "WAJIR", "MANDERA", "MARSABIT", "ISIOLO", "MERU", "THARAKA_NITHI",
    "EMBU", "KITUI", "MACHAKOS", "MAKUENI", "NYANDARUA", "NYERI", "KIRINYAGA",
    "MURANGA", "KIAMBU", "TURKANA", "WEST_POKOT", "SAMBURU", "TRANS_NZOIA",
    "UASIN_GISHU", "ELGEYO_MARAKWET", "NANDI", "BARINGO", "LAIKIPIA", "NAKURU",
    "NAROK", "KAJIADO", "KERICHO", "BOMET", "KAKAMEGA", "VIHIGA", "BUNGOMA",
    "BUSIA", "SIAYA", "KISUMU", "HOMA_BAY", "MIGORI", "KISII", "NYAMIRA", "NAIROBI"
  ];

  const loadBranches = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/branches/");
      setBranches(res.data || []);
    } catch (err) {
      setMsg("Failed to load branches");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBranches();
  }, []);

  const resetForm = () => {
    setFormData({
      name: "", branch_code: "", phone: "", phone_2: "", phone_3: "", paybill: "", account_number: "", email: "", address: "",
      county: "", city: "", google_maps_url: "", manager_name: "",
      is_active: true, is_ecommerce_branch: false, is_main_branch: false,
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
      name: branch.name || "", branch_code: branch.branch_code || "",
      phone: branch.phone || "", phone_2: branch.phone_2 || "", phone_3: branch.phone_3 || "", paybill: branch.paybill || "", account_number: branch.account_number || "", email: branch.email || "",
      address: branch.address || "", county: branch.county || "",
      city: branch.city || "", google_maps_url: branch.google_maps_url || "",
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
    if (!formData.name.trim()) {
      setMsg("Branch name is required");
      return;
    }
    try {
      await api.post("/api/branches/", formData);
      closeForm();
      setMsg("Branch created");
      loadBranches();
    } catch (err) {
      setMsg("Failed to create branch");
    }
  };

  const updateBranch = async () => {
    if (!formData.name.trim()) {
      setMsg("Branch name is required");
      return;
    }
    try {
      await api.put(`/api/branches/${editingBranch.id}/`, formData);
      closeForm();
      setMsg("Branch updated");
      loadBranches();
    } catch (err) {
      setMsg("Failed to update branch");
    }
  };

  const setAsEcommerce = async (branchId) => {
    try {
      await api.patch(`/api/branches/${branchId}/`, { is_ecommerce_branch: true });
      setMsg("Ecommerce branch updated");
      loadBranches();
    } catch (err) {
      setMsg("Failed to update");
    }
  };

  const setAsMain = async (branchId) => {
    try {
      await api.patch(`/api/branches/${branchId}/`, { is_main_branch: true });
      setMsg("Main branch updated");
      loadBranches();
    } catch (err) {
      setMsg("Failed to update");
    }
  };

  const toggleStatus = async (branchId, currentStatus) => {
    try {
      await api.patch(`/api/branches/${branchId}/`, { is_active: !currentStatus });
      setMsg(`Branch ${!currentStatus ? "activated" : "deactivated"}`);
      loadBranches();
    } catch (err) {
      setMsg("Failed to update status");
    }
  };

  const deleteBranch = async (branchId) => {
    if (!window.confirm("Are you sure you want to delete this branch?")) return;
    try {
      await api.delete(`/api/branches/${branchId}/`);
      setMsg("Branch deleted");
      loadBranches();
    } catch (err) {
      setMsg("Failed to delete branch");
    }
  };

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
    <AppLayout title="Branches" subtitle="Manage store branches">
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <strong style={{ fontSize: 20 }}>Branches</strong>
          <div className="muted">Total: {branches.length}</div>
        </div>
        {!showForm && (
          <button className="btn btn-primary" onClick={openAddForm}>
            + Add Branch
          </button>
        )}
      </div>

      {/* Form */}
      {showForm && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <strong>{editingBranch ? "Edit Branch" : "New Branch"}</strong>
            <button className="btn outline" onClick={closeForm}>✕</button>
          </div>
          <div className="grid-2" style={{ gap: 12 }}>
            <input className="input" placeholder="Branch name *" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
            <input className="input" placeholder="Branch code" value={formData.branch_code} onChange={(e) => setFormData({ ...formData, branch_code: e.target.value.toUpperCase() })} />
            <input className="input" placeholder="Phone" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
            <input className="input" placeholder="Alternative Phone" value={formData.phone_2} onChange={(e) => setFormData({ ...formData, phone_2: e.target.value })} />
            <input className="input" placeholder="Additional Phone" value={formData.phone_3} onChange={(e) => setFormData({ ...formData, phone_3: e.target.value })} />
            <input className="input" placeholder="Paybill" value={formData.paybill} onChange={(e) => setFormData({ ...formData, paybill: e.target.value })} />
            <input className="input" placeholder="Account Number" value={formData.account_number} onChange={(e) => setFormData({ ...formData, account_number: e.target.value })} />
            <input className="input" placeholder="Email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
            <input className="input" placeholder="Address" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
            <input className="input" placeholder="City" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} />
            <select className="input" value={formData.county} onChange={(e) => setFormData({ ...formData, county: e.target.value })}>
              <option value="">Select County</option>
              {counties.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <input className="input" placeholder="Manager name" value={formData.manager_name} onChange={(e) => setFormData({ ...formData, manager_name: e.target.value })} />
          </div>
          <div style={{ display: "flex", gap: 16, marginTop: 12, flexWrap: "wrap" }}>
            <label><input type="checkbox" checked={formData.is_active} onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })} /> Active</label>
            <label><input type="checkbox" checked={formData.is_ecommerce_branch} onChange={(e) => setFormData({ ...formData, is_ecommerce_branch: e.target.checked })} /> Ecommerce Branch</label>
            <label><input type="checkbox" checked={formData.is_main_branch} onChange={(e) => setFormData({ ...formData, is_main_branch: e.target.checked })} /> Main Branch</label>
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
            <button className="btn btn-primary" onClick={editingBranch ? updateBranch : createBranch}>{editingBranch ? "Update" : "Create"}</button>
            <button className="btn outline" onClick={closeForm}>Cancel</button>
          </div>
          {msg && <div className="muted" style={{ marginTop: 12, color: msg.includes("created") || msg.includes("updated") ? "#10b981" : "#dc2626" }}>{msg}</div>}
        </div>
      )}

      {/* Table */}
      <div className="card" style={{ overflowX: "auto" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: 40 }}>Loading...</div>
        ) : branches.length === 0 ? (
          <div style={{ textAlign: "center", padding: 40 }}>
            <p className="muted">No branches found</p>
            {!showForm && <button className="btn btn-primary" onClick={openAddForm} style={{ marginTop: 12 }}>+ Add Branch</button>}
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Name</th>
                <th>Location</th>
                <th>Contact</th>
                <th>paybill</th>
                <th>Manager</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {branches.map(b => (
                <tr key={b.id} style={{ backgroundColor: b.is_ecommerce_branch ? "#fef3c793" : "transparent" }}>
                  <td style={{ fontFamily: "monospace" }}>{b.branch_code || "—"}</td>
                  <td>
                    <strong>{b.name}</strong>
                    <div style={{ fontSize: 11 }}>
                      {b.is_ecommerce_branch && <span style={{ color: "#f59e0b" }}>Ecommerce</span>}
                      {b.is_main_branch && <span style={{ marginLeft: 4, color: "#3b82f6" }}>Main</span>}
                    </div>
                  </td>
                  <td>{b.city || "—"}<br /><span style={{ fontSize: 11, color: "#666" }}>{b.county || ""}</span></td>
                  <td>{b.phone || "—"}<br /><span>{b.phone_2 || "—"}<br /> <span>{b.phone_3 || "—"}</span><br />
                    </span><span style={{ fontSize: 11, color: "#666" }}>{b.email || ""}</span></td>
                  <td>{b.paybill || "—"}</td>
                  <td>{b.manager_name || "—"}</td>
                  <td>
                    <span style={{
                      display: "inline-block", padding: "2px 8px", borderRadius: 12, fontSize: 11,
                      backgroundColor: b.is_active ? "#d1fae5" : "#fee2e2",
                      color: b.is_active ? "#065f46" : "#991b1b",
                    }}>{b.is_active ? "Active" : "Inactive"}</span>
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      <button className="btn outline" onClick={() => openEditForm(b)} style={{ fontSize: 11, padding: "4px 8px" }}>Edit</button>
                      {!b.is_ecommerce_branch && b.is_active && (
                        <button className="btn outline" onClick={() => setAsEcommerce(b.id)} style={{ fontSize: 11, padding: "4px 8px" }}>Set Ecommerce</button>
                      )}
                      {!b.is_main_branch && b.is_active && (
                        <button className="btn outline" onClick={() => setAsMain(b.id)} style={{ fontSize: 11, padding: "4px 8px" }}>Set Main</button>
                      )}
                      <button className="btn outline" onClick={() => toggleStatus(b.id, b.is_active)} style={{ fontSize: 11, padding: "4px 8px" }}>
                        {b.is_active ? "Deactivate" : "Activate"}
                      </button>
                      <button className="btn outline" onClick={() => deleteBranch(b.id)} style={{ fontSize: 11, padding: "4px 8px", color: "#dc2626" }}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <style>{`
        .grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
        @media (max-width: 768px) { .grid-2 { grid-template-columns: 1fr; } }
      `}</style>
    </AppLayout>
  );
}