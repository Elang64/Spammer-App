import { useEffect, useState } from "react";
import { Activity, Users, Target, CheckCircle, XCircle, Clock, RefreshCw } from "lucide-react";
import { api } from "../api";

function StatCard({ icon, label, value, accent }) {
  return (
    <div className="stat-card">
      <div className="stat-icon" style={{ color: accent }}>{icon}</div>
      <div className="stat-value" style={{ color: accent }}>{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

function StatusBadge({ status }) {
  return <span className={`badge badge-${status}`}>{status.replace("_", " ")}</span>;
}

export default function Dashboard() {
  const [targets, setTargets] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [t, a] = await Promise.all([api.listTargets(), api.listAccounts()]);
      setTargets(t);
      setAccounts(a);
    } catch (_) {}
    setLoading(false);
  };

  useEffect(() => {
    load();
    const iv = setInterval(load, 6000);
    return () => clearInterval(iv);
  }, []);

  const stats = {
    total:       targets.length,
    success:     targets.filter((t) => t.status === "success").length,
    failed:      targets.filter((t) => t.status === "failed").length,
    inProgress:  targets.filter((t) => t.status === "in_progress" || t.status === "pending").length,
    activeAccounts: accounts.filter((a) => a.is_active).length,
  };

  return (
    <div className="page">
      <div className="page-header">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h1>Dashboard</h1>
            <p>Overview of auto-like bot activity and accounts</p>
          </div>
          <button className="btn-icon" onClick={load} disabled={loading} title="Refresh" aria-label="Refresh data">
            <RefreshCw size={15} className={loading ? "spinner-inline" : ""} style={loading ? { animation: "spin 0.7s linear infinite" } : {}} />
          </button>
        </div>
      </div>

      <div className="grid-stats">
        <StatCard icon={<Target size={20} />}      label="Total Tasks"       value={stats.total}          accent="var(--text-primary)" />
        <StatCard icon={<CheckCircle size={20} />}  label="Succeeded"         value={stats.success}        accent="var(--green)" />
        <StatCard icon={<XCircle size={20} />}      label="Failed"            value={stats.failed}         accent="var(--red)" />
        <StatCard icon={<Clock size={20} />}        label="In Queue / Active" value={stats.inProgress}     accent="var(--yellow)" />
        <StatCard icon={<Users size={20} />}        label="Active Accounts"   value={stats.activeAccounts} accent="var(--cyan, #00d2ff)" />
      </div>

      <div className="section-gap">
        {/* Recent targets */}
        <div className="card">
          <div className="card-header">
            <Activity size={15} style={{ color: "var(--accent)" }} />
            <h2>Recent Tasks</h2>
            <span style={{ marginLeft: "auto", fontSize: 12, color: "var(--text-muted)" }}>
              Auto-refreshes every 6s
            </span>
          </div>
          <div className="table-wrap">
            {targets.length === 0 ? (
              <div className="empty-state">
                <Target size={32} />
                <p>No tasks yet. Submit an auto-like task to get started.</p>
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>URL</th>
                    <th>Status</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {targets.map((t) => (
                    <tr key={t.id}>
                      <td className="td-mono" style={{ color: "var(--text-muted)" }}>{t.id}</td>
                      <td className="td-url" title={t.url_post}>{t.url_post}</td>
                      <td><StatusBadge status={t.status} /></td>
                      <td className="td-mono" style={{ fontSize: 11 }}>{new Date(t.created_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Accounts */}
        <div className="card">
          <div className="card-header">
            <Users size={15} style={{ color: "var(--purple)" }} />
            <h2>Registered Accounts</h2>
          </div>
          <div className="table-wrap">
            {accounts.length === 0 ? (
              <div className="empty-state">
                <Users size={32} />
                <p>No accounts registered.</p>
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Username</th>
                    <th>Proxy</th>
                    <th>Status</th>
                    <th>Registered</th>
                  </tr>
                </thead>
                <tbody>
                  {accounts.map((a) => (
                    <tr key={a.id}>
                      <td className="td-mono" style={{ color: "var(--text-muted)" }}>{a.id}</td>
                      <td style={{ fontWeight: 600, color: "var(--text-primary)" }}>{a.username}</td>
                      <td className="td-mono" style={{ fontSize: 11 }}>{a.proxy || <span style={{ color: "var(--text-muted)" }}>—</span>}</td>
                      <td><span className={`badge badge-${a.is_active ? "active" : "inactive"}`}>{a.is_active ? "Active" : "Inactive"}</span></td>
                      <td className="td-mono" style={{ fontSize: 11 }}>{new Date(a.created_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
