import { useEffect, useState, useMemo } from "react";
import { ScrollText, RefreshCw, Search } from "lucide-react";
import { api } from "../api";

/* ─── Live Indicator ─────────────────────────────────────────── */
function LiveIndicator() {
  return (
    <span className="live-indicator">
      <span className="live-dot" />
      Live
    </span>
  );
}

/* ─── Filter Bar ─────────────────────────────────────────────── */
const MSG_FILTERS = [
  { key: "all",     label: "Semua" },
  { key: "success", label: "Success" },
  { key: "error",   label: "Error / Gagal" },
];

function LogFilterBar({ search, onSearch, filter, onFilter, counts }) {
  return (
    <div className="filter-bar">
      <div className="search-wrap">
        <Search size={13} />
        <input
          type="search"
          className="search-input"
          placeholder="Cari pesan log…"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          aria-label="Cari log"
        />
      </div>
      <div className="filter-chips">
        {MSG_FILTERS.map(({ key, label }) => (
          <button
            key={key}
            className={`filter-chip${
              filter === key
                ? key === "error"
                  ? " active-failed"
                  : key === "success"
                  ? " active-success"
                  : " active-all"
                : ""
            }`}
            onClick={() => onFilter(key)}
            aria-pressed={filter === key}
          >
            {label}
            <span className="filter-count">{counts[key] ?? 0}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ─── Logs Page ──────────────────────────────────────────────── */
export default function Logs({ toast }) {
  const [logs,    setLogs]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState("");
  const [filter,  setFilter]  = useState("all");

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.listLogs();
      setLogs(data);
    } catch (_) {
      toast.push("Error", "Gagal memuat log", "error");
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    const iv = setInterval(load, 8000);
    return () => clearInterval(iv);
  }, []);

  /* classify message */
  const classify = (msg) => {
    const lower = msg.toLowerCase();
    if (lower.includes("successfully") || lower.includes("success") || lower.includes("berhasil")) return "success";
    if (lower.includes("error") || lower.includes("fail") || lower.includes("gagal") || lower.includes("inactive") || lower.includes("not found")) return "error";
    return "info";
  };

  /* counts */
  const counts = useMemo(() => ({
    all:     logs.length,
    success: logs.filter((l) => classify(l.message) === "success").length,
    error:   logs.filter((l) => classify(l.message) === "error").length,
  }), [logs]);

  /* filtered list */
  const filtered = useMemo(() => {
    return logs.filter((l) => {
      const matchFilter =
        filter === "all" ||
        (filter === "success" && classify(l.message) === "success") ||
        (filter === "error"   && classify(l.message) === "error");
      const matchSearch = !search || l.message.toLowerCase().includes(search.toLowerCase());
      return matchFilter && matchSearch;
    });
  }, [logs, filter, search]);

  const msgColor = (msg) => {
    const t = classify(msg);
    if (t === "success") return "var(--green)";
    if (t === "error")   return "var(--red)";
    return "var(--text-secondary)";
  };

  return (
    <div className="page">
      <div className="page-header">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h1>Activity Logs</h1>
            <p>Log eksekusi bot — 200 entri terbaru</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <LiveIndicator />
            <button
              className="btn-icon"
              onClick={load}
              disabled={loading}
              aria-label="Refresh log"
              title="Refresh manual"
            >
              <RefreshCw
                size={15}
                style={loading ? { animation: "spin 0.7s linear infinite" } : {}}
              />
            </button>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <ScrollText size={15} style={{ color: "var(--purple)" }} />
          <h2>Logs</h2>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Refresh setiap 8 detik</span>
            <LiveIndicator />
          </div>
        </div>

        {/* Filter bar */}
        <LogFilterBar
          search={search}
          onSearch={setSearch}
          filter={filter}
          onFilter={setFilter}
          counts={counts}
        />

        <div className="table-wrap" style={{ maxHeight: 520 }}>
          {filtered.length === 0 ? (
            <div className="empty-state">
              <ScrollText size={32} />
              <p>{search || filter !== "all" ? "Tidak ada log yang cocok dengan filter." : "Belum ada log."}</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Waktu</th>
                  <th>Akun</th>
                  <th>Target</th>
                  <th>Pesan</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((l) => (
                  <tr key={l.id}>
                    <td className="td-mono" style={{ color: "var(--text-muted)" }}>{l.id}</td>
                    <td className="td-mono" style={{ fontSize: 11, whiteSpace: "nowrap" }}>
                      {new Date(l.action_time).toLocaleString("id-ID")}
                    </td>
                    <td className="td-mono" style={{ color: "var(--cyan)" }}>
                      {l.account_id ? `#${l.account_id}` : <span style={{ color: "var(--text-muted)" }}>—</span>}
                    </td>
                    <td className="td-mono" style={{ color: "var(--purple)" }}>
                      {l.target_id ? `#${l.target_id}` : <span style={{ color: "var(--text-muted)" }}>—</span>}
                    </td>
                    <td style={{ fontSize: 12, maxWidth: 480, color: msgColor(l.message) }}>
                      {l.message}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Result count footer */}
        {(search || filter !== "all") && (
          <div style={{ padding: "8px 20px", fontSize: 11, color: "var(--text-muted)", borderTop: "1px solid var(--border)" }}>
            Menampilkan {filtered.length} dari {logs.length} log
          </div>
        )}
      </div>
    </div>
  );
}
