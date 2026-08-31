import { useEffect, useState } from "react";
import { ScrollText, RefreshCw } from "lucide-react";
import { api } from "../api";

export default function Logs({ toast }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.listLogs();
      setLogs(data);
    } catch (err) {
      toast.push("Error", "Failed to load logs", "error");
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    const iv = setInterval(load, 8000);
    return () => clearInterval(iv);
  }, []);

  return (
    <div className="page">
      <div className="page-header">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h1>Activity Logs</h1>
            <p>Detailed bot execution logs — last 200 entries</p>
          </div>
          <button className="btn-icon" onClick={load} disabled={loading} aria-label="Refresh logs">
            <RefreshCw size={15} style={loading ? { animation: "spin 0.7s linear infinite" } : {}} />
          </button>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <ScrollText size={15} style={{ color: "var(--purple)" }} />
          <h2>Logs</h2>
          <span style={{ marginLeft: "auto", fontSize: 12, color: "var(--text-muted)" }}>Auto-refreshes every 8s</span>
        </div>
        <div className="table-wrap" style={{ maxHeight: 520 }}>
          {logs.length === 0 ? (
            <div className="empty-state">
              <ScrollText size={32} />
              <p>No logs yet.</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Time</th>
                  <th>Account</th>
                  <th>Target</th>
                  <th>Message</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((l) => (
                  <tr key={l.id}>
                    <td className="td-mono" style={{ color: "var(--text-muted)" }}>{l.id}</td>
                    <td className="td-mono" style={{ fontSize: 11, whiteSpace: "nowrap" }}>{new Date(l.action_time).toLocaleString()}</td>
                    <td className="td-mono" style={{ color: "var(--accent)" }}>
                      {l.account_id ? `#${l.account_id}` : <span style={{ color: "var(--text-muted)" }}>—</span>}
                    </td>
                    <td className="td-mono" style={{ color: "var(--purple)" }}>
                      {l.target_id ? `#${l.target_id}` : <span style={{ color: "var(--text-muted)" }}>—</span>}
                    </td>
                    <td style={{ fontSize: 12, color: "var(--text-secondary)", maxWidth: 480 }}>{l.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
