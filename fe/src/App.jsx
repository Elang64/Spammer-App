import { useState, useEffect } from "react";
import { LayoutDashboard, Zap, ScrollText, Wifi, WifiOff } from "lucide-react";
import { useToast } from "./useToast";
import { ToastContainer } from "./components/Toast";
import { api } from "./api";
import Dashboard from "./pages/Dashboard";
import AutoLike from "./pages/AutoLike";
import Logs from "./pages/Logs";
import "./index.css";

const PAGES = [
  { id: "dashboard", label: "Dashboard",  Icon: LayoutDashboard },
  { id: "autolike",  label: "Auto-Like",  Icon: Zap },
  { id: "logs",      label: "Logs",        Icon: ScrollText },
];

export default function App() {
  const [page, setPage] = useState("dashboard");
  const [serverStatus, setServerStatus] = useState("checking");
  const toast = useToast();

  useEffect(() => {
    const check = async () => {
      try {
        await api.health();
        setServerStatus("healthy");
      } catch {
        setServerStatus("offline");
      }
    };
    check();
    const iv = setInterval(check, 12000);
    return () => clearInterval(iv);
  }, []);

  const renderPage = () => {
    if (page === "dashboard") return <Dashboard />;
    if (page === "autolike") return <AutoLike toast={toast} />;
    if (page === "logs")     return <Logs toast={toast} />;
  };

  return (
    <>
      <div className="app-layout">
        {/* Sidebar */}
        <aside className="sidebar" role="navigation" aria-label="Main navigation">
          <div className="sidebar-logo">
            <div className="logo-mark" aria-label="FBBot home">
              <div className="logo-icon" aria-hidden="true">⚡</div>
              <div className="logo-text">FB<span>Bot</span></div>
            </div>
          </div>

          <nav className="nav-group">
            <div className="nav-label">Navigation</div>
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
            <div className="server-status" role="status" aria-live="polite">
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
          </div>
        </aside>

        {/* Main */}
        <main className="main-content" id="main-content">
          {renderPage()}
        </main>
      </div>

      <ToastContainer toasts={toast.toasts} dismiss={toast.dismiss} />
    </>
  );
}
