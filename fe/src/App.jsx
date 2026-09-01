import { useState, useEffect } from "react";
import { LayoutDashboard, Zap, ScrollText, Users, Wifi, WifiOff, LogOut } from "lucide-react";
import { useToast } from "./useToast";
import { ToastContainer } from "./components/Toast";
import { api } from "./api";
import Login from "./components/Login";
import Dashboard from "./pages/Dashboard";
import AutoLike from "./pages/AutoLike";
import Accounts from "./pages/Accounts";
import Logs from "./pages/Logs";
import "./index.css";

const PAGES = [
  { id: "dashboard", label: "Dashboard", Icon: LayoutDashboard },
  { id: "accounts",  label: "Akun",      Icon: Users },
  { id: "autolike",  label: "Auto-Like", Icon: Zap },
  { id: "logs",      label: "Logs",      Icon: ScrollText },
];

export default function App() {
  const [page,         setPage]         = useState("dashboard");
  const [serverStatus, setServerStatus] = useState("checking");
  const [authed,       setAuthed]       = useState(() => localStorage.getItem("fb_bot_auth") === "true");
  const toast = useToast();

  /* health check */
  useEffect(() => {
    const check = async () => {
      try { await api.health(); setServerStatus("healthy"); }
      catch { setServerStatus("offline"); }
    };
    check();
    const iv = setInterval(check, 12000);
    return () => clearInterval(iv);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("fb_bot_auth");
    setAuthed(false);
    setPage("dashboard");
  };

  /* show login screen if not authenticated */
  if (!authed) {
    return (
      <>
        <Login onLogin={() => setAuthed(true)} />
        <ToastContainer toasts={toast.toasts} dismiss={toast.dismiss} />
      </>
    );
  }

  const renderPage = () => {
    if (page === "dashboard") return <Dashboard toast={toast} />;
    if (page === "accounts")  return <Accounts  toast={toast} />;
    if (page === "autolike")  return <AutoLike  toast={toast} />;
    if (page === "logs")      return <Logs      toast={toast} />;
  };

  return (
    <>
      <div className="app-layout">
        {/* ── Sidebar ───────────────────────────────────────── */}
        <aside className="sidebar" role="navigation" aria-label="Main navigation">
          <div className="sidebar-logo">
            <div className="logo-mark" aria-label="FBBot home">
              <div className="logo-icon" aria-hidden="true">⚡</div>
              <div className="logo-text">FB<span>Bot</span></div>
            </div>
          </div>

          <nav className="nav-group">
            <div className="nav-label">Menu</div>
            {PAGES.map(({ id, label, Icon }) => (
              <button
                key={id}
                className={`nav-item${page === id ? " active" : ""}`}
                onClick={() => setPage(id)}
                aria-current={page === id ? "page" : undefined}
              >
                <Icon size={15} aria-hidden="true" />
                {label}
              </button>
            ))}
          </nav>

          <div className="sidebar-footer">
            {/* API status */}
            <div className="server-status" role="status" aria-live="polite" style={{ marginBottom: 12 }}>
              {serverStatus === "healthy" ? (
                <>
                  <Wifi size={13} color="var(--green)" aria-hidden="true" />
                  <span className="badge badge-healthy" style={{ fontSize: 11 }}>API Online</span>
                </>
              ) : serverStatus === "offline" ? (
                <>
                  <WifiOff size={13} color="var(--red)" aria-hidden="true" />
                  <span className="badge badge-offline" style={{ fontSize: 11 }}>API Offline</span>
                </>
              ) : (
                <>
                  <div className="spinner spinner-sm" aria-hidden="true" />
                  <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Checking…</span>
                </>
              )}
            </div>

            {/* Logout */}
            <button
              className="btn-icon"
              onClick={handleLogout}
              title="Logout"
              aria-label="Logout"
              style={{ width: "100%", justifyContent: "flex-start", gap: 8, padding: "8px 4px", color: "var(--text-muted)", fontSize: 12 }}
            >
              <LogOut size={13} aria-hidden="true" />
              Logout
            </button>
          </div>
        </aside>

        {/* ── Main content ──────────────────────────────────── */}
        <main className="main-content" id="main-content">
          {renderPage()}
        </main>
      </div>

      <ToastContainer toasts={toast.toasts} dismiss={toast.dismiss} />
    </>
  );
}
