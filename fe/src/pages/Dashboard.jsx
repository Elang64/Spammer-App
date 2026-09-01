import { useEffect, useState, useMemo } from "react";
import {
  Activity, Users, Target, CheckCircle, XCircle,
  Clock, RefreshCw, Search, Square,
} from "lucide-react";
import { api } from "../api";

/* ─── Stat Card ──────────────────────────────────────────────── */
function StatCard({ icon, label, value, accent, loading }) {
  return (
    <div className="stat-card">
      <div className="stat-icon" style={{ color: accent }}>{icon}</div>
      <div className="stat-value" style={{ color: accent }}>
        {loading ? <span className="spinner spinner-sm" style={{ display: "inline-block" }} /> : value}
      </div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

/* ─── Status Badge ───────────────────────────────────────────── */
function StatusBadge({ status }) {
  return <span className={`badge badge-${status}`}>{status.replace(/_/g, " ")}</span>;
}

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
const STATUS_FILTERS = [
  { key: "all",         label: "Semua" },
  { key: "success",     label: "Success" },
  { key: "failed",      label: "Failed" },
  { key: "in_progress", label: "In Progress" },
  { key: "pending",     label: "Pending" },
  { key: "stopped",     label: "Stopped" },
];

function FilterBar({ search, onSearch, filter, onFilter, counts }) {
  return (
    <div className="filter-bar">
      <div className="search-wrap">
        <Search size={13} />
        <input
          type="search"
          className="search-input"
          placeholder="Cari URL task…"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          aria-label="Cari task"
        />
      </div>
      <div className="filter-chips">
        {STATUS_FILTERS.map(({ key, label }) => (
          <button
            key={key}
            className={`filter-chip${filter === key ? ` active-${key}` : ""}`}
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

/* ─── Dashboard Page ─────────────────────────────────────────── */
export default function Dashboard({ toast }) {
  /* stats from dedicated endpoint */
  const [stats,       setStats]       = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  /* tables */
  const [targets,  setTargets]  = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading,  setLoading]  = useState(true);

  /* filters */
  const [taskSearch, setTaskSearch] = useState("");
  const [taskFilter, setTaskFilter] = useState("all");
  const [accSearch,  setAccSearch]  = useState("");

  /* load stats */
  const loadStats = async () => {
    setStatsLoading(true);
    try {
      setStats(await api.getStats());
    } catch (_) {
      /* silently fall back to computed values */
    }
    setStatsLoading(false);
  };

  /* load tables */
  const loadTables = async () => {
    setLoading(true);
    try {
      const [t, a] = await Promise.all([api.listTargets(), api.listAccounts()]);
      setTargets(t);
      setAccounts(a);
    } catch (_) {}
    setLoading(false);
  };

  const loadAll = () => { loadStats(); loadTables(); };

  useEffect(() => {
    loadAll();
    const iv = setInterval(loadAll, 6000);
    return () => clearInterval(iv);
  }, []);

  /* resolved stat values — sinkron dengan format /api/stats remote */
  const s = {
    total_accounts:    stats?.total_accounts    ?? accounts.length,
    active_accounts:   stats?.active_accounts   ?? accounts.filter((a) => a.is_active).length,
    total_tasks:       stats?.total_tasks        ?? targets.length,
    // remote returns status_breakdown nested object
    success_tasks:     stats?.status_breakdown?.success      ?? stats?.success_tasks      ?? targets.filter((t) => t.status === "success").length,
    failed_tasks:      stats?.status_breakdown?.failed       ?? stats?.failed_tasks       ?? targets.filter((t) => t.status === "failed").length,
    pending_tasks:     stats?.status_breakdown?.pending      ?? stats?.pending_tasks      ?? targets.filter((t) => t.status === "pending").length,
    in_progress_tasks: stats?.status_breakdown?.in_progress  ?? stats?.in_progress_tasks  ?? targets.filter((t) => t.status === "in_progress").length,
  };

  /* task filter counts */
  const taskCounts = useMemo(() => ({
    all:         targets.length,
    success:     targets.filter((t) => t.status === "success").length,
    failed:      targets.filter((t) => t.status === "failed").length,
    in_progress: targets.filter((t) => t.status === "in_progress").length,
    pending:     targets.filter((t) => t.status === "pending").length,
    stopped:     targets.filter((t) => t.status === "stopped").length,
  }), [targets]);

  /* filtered tasks */
  const filteredTargets = useMemo(() => targets.filter((t) => {
    const matchStatus = taskFilter === "all" || t.status === taskFilter;
    const matchSearch = t.url_post.toLowerCase().includes(taskSearch.toLowerCase());
    return matchStatus && matchSearch;
  }), [targets, taskFilter, taskSearch]);

  /* filtered accounts */
  const filteredAccounts = useMemo(() => {
    if (!accSearch) return accounts;
    const q = accSearch.toLowerCase();
    return accounts.filter((a) =>
      a.username.toLowerCase().includes(q) || (a.proxy || "").toLowerCase().includes(q)
    );
  }, [accounts, accSearch]);

  return (
    <div className="page">
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="page-header">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h1>Dashboard</h1>
            <p>Ringkasan aktivitas bot dan status akun secara real-time</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <LiveIndicator />
            <button
              className="btn-icon"
              onClick={loadAll}
              disabled={loading}
              title="Refresh manual"
              aria-label="Refresh semua data"
            >
              <RefreshCw size={15} style={loading ? { animation: "spin 0.7s linear infinite" } : {}} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Stat cards — from /api/stats ───────────────────── */}
      <div className="grid-stats">
        <StatCard
          icon={<Users size={20} />}
          label="Total Akun"
          value={s.total_accounts}
          accent="var(--text-primary)"
          loading={statsLoading}
        />
        <StatCard
          icon={<Users size={20} />}
          label="Akun Aktif"
          value={s.active_accounts}
          accent="var(--cyan)"
          loading={statsLoading}
        />
        <StatCard
          icon={<Target size={20} />}
          label="Total Task"
          value={s.total_tasks}
          accent="var(--text-primary)"
          loading={statsLoading}
        />
        <StatCard
          icon={<CheckCircle size={20} />}
          label="Task Sukses"
          value={s.success_tasks}
          accent="var(--green)"
          loading={statsLoading}
        />
        <StatCard
          icon={<XCircle size={20} />}
          label="Gagal"
          value={s.failed_tasks}
          accent="var(--red)"
          loading={statsLoading}
        />
        <StatCard
          icon={<Clock size={20} />}
          label="Berjalan / Antrean"
          value={s.in_progress_tasks + s.pending_tasks}
          accent="var(--yellow)"
          loading={statsLoading}
        />
      </div>

      <div className="section-gap">
        {/* ── Task Table ─────────────────────────────────────── */}
        <div className="card">
          <div className="card-header">
            <Activity size={15} style={{ color: "var(--cyan)" }} />
            <h2>Riwayat Task</h2>
            <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Auto-refresh 6 dtk</span>
              <LiveIndicator />
            </div>
          </div>

          <FilterBar
            search={taskSearch}
            onSearch={setTaskSearch}
            filter={taskFilter}
            onFilter={setTaskFilter}
            counts={taskCounts}
          />

          <div className="table-wrap">
            {filteredTargets.length === 0 ? (
              <div className="empty-state">
                <Target size={32} />
                <p>
                  {taskSearch || taskFilter !== "all"
                    ? "Tidak ada task yang cocok dengan filter."
                    : "Belum ada task. Kirim task auto-like untuk memulai."}
                </p>
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>URL Target</th>
                    <th>Status</th>
                    <th>Dibuat</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTargets.map((t) => (
                    <tr key={t.id}>
                      <td className="td-mono" style={{ color: "var(--text-muted)" }}>{t.id}</td>
                      <td className="td-url" title={t.url_post}>{t.url_post}</td>
                      <td><StatusBadge status={t.status} /></td>
                      <td className="td-mono" style={{ fontSize: 11 }}>
                        {new Date(t.created_at).toLocaleString("id-ID")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {(taskSearch || taskFilter !== "all") && (
            <div style={{ padding: "8px 20px", fontSize: 11, color: "var(--text-muted)", borderTop: "1px solid var(--border)" }}>
              Menampilkan {filteredTargets.length} dari {targets.length} task
            </div>
          )}
        </div>

        {/* ── Accounts Table ─────────────────────────────────── */}
        <div className="card">
          <div className="card-header">
            <Users size={15} style={{ color: "var(--purple)" }} />
            <h2>Akun Terdaftar</h2>
          </div>

          <div className="filter-bar" style={{ borderBottom: "1px solid var(--border)" }}>
            <div className="search-wrap">
              <Search size={13} />
              <input
                type="search"
                className="search-input"
                placeholder="Cari username atau proxy…"
                value={accSearch}
                onChange={(e) => setAccSearch(e.target.value)}
                aria-label="Cari akun"
              />
            </div>
          </div>

          <div className="table-wrap">
            {filteredAccounts.length === 0 ? (
              <div className="empty-state">
                <Users size={32} />
                <p>{accSearch ? "Tidak ada akun yang cocok." : "Belum ada akun terdaftar."}</p>
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Username</th>
                    <th>Proxy</th>
                    <th>Status</th>
                    <th>Terdaftar</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAccounts.map((a) => (
                    <tr key={a.id}>
                      <td className="td-mono" style={{ color: "var(--text-muted)" }}>{a.id}</td>
                      <td style={{ fontWeight: 600, color: "var(--text-primary)" }}>{a.username}</td>
                      <td className="td-mono" style={{ fontSize: 11 }}>
                        {a.proxy || <span style={{ color: "var(--text-muted)" }}>—</span>}
                      </td>
                      <td>
                        <span className={`badge badge-${a.is_active ? "active" : "inactive"}`}>
                          {a.is_active ? "Aktif" : "Nonaktif"}
                        </span>
                      </td>
                      <td className="td-mono" style={{ fontSize: 11 }}>
                        {new Date(a.created_at).toLocaleString("id-ID")}
                      </td>
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
