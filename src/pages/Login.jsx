import React from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(username, password);
      navigate("/dashboard");
    } catch (err) {
      setError(err?.response?.data?.detail || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "grid", placeItems: "center", height: "100vh" }}>
      <form
        onSubmit={submit}
        className="card"
        style={{ width: 420, padding: 22 }}
      >
        <h2 style={{ margin: 0 }}>POS Login</h2>
        <p className="muted" style={{ marginTop: 6 }}>
          Sign in to access cashier dashboard
        </p>

        {error && (
          <div
            style={{
              marginTop: 10,
              background: "#fee2e2",
              border: "1px solid #fecaca",
              padding: 10,
              borderRadius: 10,
              color: "#991b1b",
              fontWeight: 700,
            }}
          >
            {error}
          </div>
        )}

        <div style={{ marginTop: 14 }}>
          <label className="muted">Username</label>
          <input
            className="input"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="cashier"
          />
        </div>

        <div style={{ marginTop: 12 }}>
          <label className="muted">Password</label>
          <input
            className="input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="********"
          />
        </div>

        <button
          className="btn btn-primary"
          style={{ width: "100%", marginTop: 16 }}
          disabled={loading}
        >
          {loading ? "Signing in..." : "Login"}
        </button>
      </form>
    </div>
  );
}
