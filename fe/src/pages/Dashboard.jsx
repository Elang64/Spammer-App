import { useEffect, useState, useMemo } from "react";
import { Activity, Users, Target, CheckCircle, XCircle, Clock, RefreshCw, Search } from "lucide-react";
import { api } from "../api";

/* ─── Stat Card ─────────────────────────────────────────────── */
function StatCard({ icon, label, value, accent }) {
  return (
    <div className="stat-card">
      <div className="stat-icon" style={{ color: accent }}>{icon}</div>
      <div className="stat-value" style={{ color: accent }}>{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

/* ─── Status Badge ───────────────────────────────────────────── */
function StatusBadge({ status }) {
  return <span className={`badge badge-${status}`}>{status.replace("_", " ")}</span>;
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

/* ─── Filter Chips ───────────────────────────────────────────── */
const STATUS_FILTERS = [
  { key: "all",         label: "Semua" },
  { key: "success",     label: "Success" },
  { key: "failed",      label: "Failed" },
  { key: "in_progress", label: "In Progress" },
  { key: "pending",     label: "Pending" },
];

function FilterBar({ search, onSearch, filter, onFilter, counts }) {
  return (
    <div className="filter-bar">
      {/* Search */}
      <div className="search-wrap">
        <Search size={13} />
        <input
          type="search"
          className="search-input"
          placeholder="Cari URL…"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          aria-label="Cari task berdasarkan URL"
        />
      </div>
      {/* Status chips */}
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
export default function Dashboard() {
  const [targets,  setTargets]  = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading,  setLoading]  = useState(true);

  /* task table filters */
  const [taskSearch, setTaskSearch] = useState("");
  const [taskFilter, setTaskFilter] = useState("all");

  /* account table search */
  const [accSearch, setAccSearch] = useState("");

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

  /* stats */
  const stats = useMemo(() => ({
    total:          targets.length,
    success:        targets.filter((t) => t.status === "success").length,
    failed:         targets.filter((t) => t.status === "failed").length,
    in_progress:    targets.filter((t) => t.status === "in_progress").length,
    pending:        targets.filter((t) => t.status === "pending").length,
    activeAccounts: accounts.filter((a) => a.is_active).length,
  }), [targets, accounts]);

  const taskCounts = {
    all:         targets.length,
    success:     stats.success,
    failed:      stats.failed,
    in_progress: stats.in_progress,
    pending:     stats.pending,
  };

  /* filtered task list */
  const filteredTargets = useMemo(() => {
    return targets.filter((t) => {
      const matchStatus = taskFilter === "all" || t.status === taskFilter;
      const matchSearch = t.url_post.toLowerCase().includes(taskSearch.toLowerCase());
      return matchStatus && matchSearch;
    });
  }, [targets, taskFilter, taskSearch]);

  /* filtered accounts */
  const filteredAccounts = useMemo(() => {
    if (!accSearch) return accounts;
    return accounts.filter((a) =>
      a.username.toLowerCase().includes(accSearch.toLowerCase()) ||
      (a.proxy || "").toLowerCase().includes(accSearch.toLowerCase())
    );
  }, [accounts, accSearch]);

  return (
    <div className="page">
      <div className="page-header">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h1>Dashboard</h1>
            <p>Overview aktivitas bot dan akun terdaftar</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <LiveIndicator />
            <button
              className="btn-icon"
              onClick={load}
              disabled={loading}
              title="Refresh manual"
              aria-label="Refresh data"
            >
              <RefreshCw
                size={15}
                style={loading ? { animation: "spin 0.7s linear infinite" } : {}}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid-stats">
        <StatCard icon={<Target size={20} />}      label="Total Task"        value={stats.total}          accent="var(--text-primary)" />
        <StatCard icon={<CheckCircle size={20} />}  label="Berhasil"          value={stats.success}        accent="var(--green)" />
        <StatCard icon={<XCircle size={20} />}      label="Gagal"             value={stats.failed}         accent="var(--red)" />
        <StatCard icon={<Clock size={20} />}        label="Antrean / Aktif"   value={stats.in_progress + stats.pending} accent="var(--yellow)" />
        <StatCard icon={<Users size={20} />}        label="Akun Aktif"        value={stats.activeAccounts} accent="var(--cyan)" />
      </div>

      <div className="section-gap">
        {/* ── Recent Tasks ──────────────────────────────────── */}
        <div className="card">
          <div className="card-header">
            <Activity size={15} style={{ color: "var(--cyan)" }} />
            <h2>Task Terbaru</h2>
            <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Refresh setiap 6 detik</span>
              <LiveIndicator />
            </div>
          </div>

          {/* Filter bar */}
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
                <p>{taskSearch || taskFilter !== "all" ? "Tidak ada task yang cocok dengan filter." : "Belum ada task. Kirim task auto-like untuk memulai."}</p>
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>URL</th>
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
                      <td className="td-mono" style={{ fontSize: 11 }}>{new Date(t.created_at).toLocaleString("id-ID")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Result count */}
          {(taskSearch || taskFilter !== "all") && (
            <div style={{ padding: "8px 20px", fontSize: 11, color: "var(--text-muted)", borderTop: "1px solid var(--border)" }}>
              Menampilkan {filteredTargets.length} dari {targets.length} task
            </div>
          )}
        </div>

        {/* ── Accounts ─────────────────────────────────────── */}
        <div className="card">
          <div className="card-header">
            <Users size={15} style={{ color: "var(--purple)" }} />
            <h2>Akun Terdaftar</h2>
          </div>

          {/* Account search */}
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
                      <td className="td-mono" style={{ fontSize: 11 }}>{new Date(a.created_at).toLocaleString("id-ID")}</td>
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
