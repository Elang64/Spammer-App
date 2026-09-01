import { useState } from "react";
import { Lock, Zap, AlertCircle } from "lucide-react";
import { api } from "../api";

export default function Login({ onLogin }) {
  const [password, setPassword] = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.login(password);
      localStorage.setItem("fb_bot_auth", "true");
      onLogin();
    } catch (err) {
      setError("Password salah. Coba lagi.");
      setPassword("");
    }
    setLoading(false);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      {/* Glow orb behind form */}
      <div style={{
        position: "fixed",
        top: "30%", left: "50%",
        transform: "translate(-50%, -50%)",
        width: 600, height: 400,
        background: "radial-gradient(ellipse, rgba(0,120,210,0.18) 0%, transparent 70%)",
        pointerEvents: "none",
        zIndex: 0,
      }} />

      <div
        className="card"
        style={{ width: "100%", maxWidth: 380, position: "relative", zIndex: 1 }}
      >
        {/* Header */}
        <div
          style={{
            padding: "28px 28px 20px",
            textAlign: "center",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <div
            style={{
              width: 56, height: 56,
              background: "linear-gradient(135deg, #0077bb, #00d2ff)",
              borderRadius: 16,
              margin: "0 auto 16px",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 26,
              boxShadow: "0 0 28px rgba(0,210,255,0.55), 0 4px 12px rgba(0,0,0,0.4)",
              border: "1px solid rgba(0,210,255,0.40)",
            }}
          >
            ⚡
          </div>
          <div
            style={{
              fontSize: 22, fontWeight: 800, letterSpacing: -0.5,
              background: "linear-gradient(90deg, #e0f4ff, #40e8ff)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              marginBottom: 4,
            }}
          >
            FBBot Control
          </div>
          <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
            Masukkan password admin untuk melanjutkan
          </div>
        </div>

        {/* Form */}
        <div style={{ padding: "24px 28px" }}>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div className="field">
              <label htmlFor="login-pw">Password Admin</label>
              <div style={{ position: "relative" }}>
                <input
                  id="login-pw"
                  type="password"
                  className="input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoFocus
                  style={{ paddingLeft: 38 }}
                />
                <Lock
                  size={14}
                  style={{
                    position: "absolute", left: 12, top: "50%",
                    transform: "translateY(-50%)",
                    color: "var(--text-muted)",
                    pointerEvents: "none",
                  }}
                />
              </div>
            </div>

            {error && (
              <div
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  fontSize: 12, color: "var(--red)",
                  background: "var(--red-dim)",
                  border: "1px solid rgba(255,77,106,0.25)",
                  borderRadius: "var(--radius-sm)",
                  padding: "8px 12px",
                }}
              >
                <AlertCircle size={13} />
                {error}
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ width: "100%", justifyContent: "center", padding: "13px 20px", fontSize: 15 }}
            >
              {loading ? (
                <><div className="spinner spinner-sm" /> Memverifikasi…</>
              ) : (
                <><Zap size={15} /> Masuk ke Dashboard</>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
