import React from "react";
import AppLayout from "../components/AppLayout";

export default function Account() {
  return (
    <AppLayout title="Account" subtitle="Your profile and settings">
      <div className="card">
        <div style={{ fontWeight: 900 }}>Account</div>
        <p className="muted">
          Add profile details here (name, role, branch, password reset).
        </p>
      </div>
    </AppLayout>
  );
}
