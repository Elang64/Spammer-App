import { useEffect, useState } from "react";
import {
  Send, Zap, AlertCircle, CheckCircle2, Clock,
  RefreshCw, ExternalLink, HelpCircle, ChevronDown, ChevronUp,
  BookOpen,
} from "lucide-react";
import { api } from "../api";

/* ─── Status Badge ─────────────────────────────────────────── */
function StatusBadge({ status }) {
  return <span className={`badge badge-${status}`}>{status.replace("_", " ")}</span>;
}

/* ─── Live Indicator ───────────────────────────────────────── */
function LiveIndicator({ active }) {
  if (!active) return null;
  return (
    <span className="live-indicator">
      <span className="live-dot" />
      Live updating…
    </span>
  );
}

/* ─── Cookie Format Guide (collapsible) ────────────────────── */
const COOKIE_JSON_EXAMPLE = `[
  {
    "name": "c_user",
    "value": "100012345678901",
    "domain": ".facebook.com",
    "path": "/",
    "secure": true,
    "httpOnly": false
  },
  {
    "name": "xs",
    "value": "24%3AaBcDeFgH...",
    "domain": ".facebook.com",
    "path": "/",
    "secure": true,
    "httpOnly": true
  }
]`;

function CookieGuide() {
  const [open, setOpen] = useState(false);
  return (
    <div className="cookie-guide">
      <div
        className="cookie-guide-header"
        onClick={() => setOpen((o) => !o)}
        role="button"
        aria-expanded={open}
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && setOpen((o) => !o)}
      >
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <BookOpen size={12} />
          Cara mengambil cookies Facebook
        </span>
        {open ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
      </div>

      {open && (
        <div className="cookie-guide-body">
          <div>
            <div className="guide-step-label">Langkah-langkah</div>
            <ol>
              <li>Install ekstensi <strong style={{ color: "var(--cyan)" }}>EditThisCookie</strong> atau <strong style={{ color: "var(--cyan)" }}>Cookie-Editor</strong> di Chrome/Firefox.</li>
              <li>Buka <strong>facebook.com</strong> dan login dengan akun yang ingin didaftarkan.</li>
              <li>Klik ikon ekstensi → pilih <em>Export</em> atau <em>Export as JSON</em>.</li>
              <li>Salin seluruh isi JSON yang dihasilkan — itulah nilai <code>session_cookies</code>.</li>
              <li>Masukkan JSON tersebut langsung ke kolom <code>session_cookies</code> di database.</li>
            </ol>
          </div>

          <div>
            <div className="guide-step-label">Contoh format JSON yang valid</div>
            <pre>{COOKIE_JSON_EXAMPLE}</pre>
          </div>

          <div style={{ display: "flex", alignItems: "flex-start", gap: 6, color: "var(--yellow)", fontSize: 11 }}>
            <AlertCircle size={12} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>Pastikan cookies belum expired. Jika akun logout otomatis, ambil cookies ulang.</span>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Task Progress Card ────────────────────────────────────── */
function TaskProgressCard({ task, onRefresh, isPolling }) {
  const steps = [
    { key: "pending",     label: "Task diterima server",       icon: <Clock size={13} /> },
    { key: "in_progress", label: "Browser automation berjalan", icon: <div className="spinner spinner-sm" /> },
    { key: "success",     label: "Tombol Like berhasil diklik", icon: <CheckCircle2 size={13} /> },
    { key: "failed",      label: "Task gagal",                  icon: <AlertCircle size={13} /> },
  ];

  const order = ["pending", "in_progress", "success", "failed"];
  const curIdx = order.indexOf(task.status);

  return (
    <div className="card" style={{ marginTop: 0 }}>
      <div className="card-header">
        <Zap size={15} style={{ color: "var(--yellow)" }} />
        <h2>Status Task</h2>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
          <LiveIndicator active={isPolling} />
          <button
            className="btn-icon btn-sm"
            onClick={onRefresh}
            aria-label="Refresh status"
            title="Refresh status"
          >
            <RefreshCw size={13} />
          </button>
        </div>
      </div>

      <div className="card-inner">
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* ID + Status */}
          <div style={{ display: "flex", gap: 20, alignItems: "flex-end" }}>
            <div>
              <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 4 }}>Task ID</div>
              <div style={{ fontFamily: "monospace", fontWeight: 800, fontSize: 22, color: "var(--cyan)", lineHeight: 1 }}>
                #{task.target_id}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 4 }}>Status</div>
              <StatusBadge status={task.status} />
            </div>
          </div>

          {/* URL */}
          <div>
            <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 6 }}>Target URL</div>
            <a
              href={task.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "var(--cyan)", fontSize: 11, fontFamily: "monospace", display: "flex", alignItems: "center", gap: 4, wordBreak: "break-all" }}
            >
              {task.url} <ExternalLink size={10} />
            </a>
          </div>

          {/* Timeline steps */}
          <div>
            <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 10 }}>Progress</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {steps.map(({ key, label, icon }, idx) => {
                const itemIdx = order.indexOf(key);
                const isDone    = curIdx > itemIdx || (curIdx === itemIdx && task.status === "success");
                const isCurrent = curIdx === itemIdx;
                const isFailed  = task.status === "failed" && key === "failed";
                const isSkipped = task.status === "success" && key === "failed";

                if (isSkipped) return null;

                let color = "var(--text-muted)";
                if (isDone)  color = "var(--green)";
                if (isCurrent && !isDone) color = "var(--cyan)";
                if (isFailed) color = "var(--red)";

                const isLast = idx === steps.length - 1 || task.status === "success";

                return (
                  <div key={key} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                    {/* connector line + icon */}
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 20, flexShrink: 0 }}>
                      <div style={{ color, display: "flex", alignItems: "center", justifyContent: "center", width: 20, height: 20 }}>
                        {isCurrent && !isDone && !isFailed ? <div className="spinner spinner-sm" style={{ borderTopColor: color }} /> : icon}
                      </div>
                      {!isLast && <div style={{ width: 1, flex: 1, minHeight: 10, background: color === "var(--green)" ? "rgba(0,255,163,0.25)" : "rgba(0,210,255,0.10)", margin: "2px 0" }} />}
                    </div>
                    {/* label */}
                    <div style={{ paddingBottom: 12, color, fontSize: 13 }}>
                      {label}
                      {isCurrent && key === "in_progress" && (
                        <span style={{ fontSize: 11, color: "var(--text-muted)", marginLeft: 6 }}>— estimasi 20–60 detik</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Page ─────────────────────────────────────────────── */
export default function AutoLike({ toast }) {
  const [accounts, setAccounts]   = useState([]);
  const [accountId, setAccountId] = useState("");
  const [targetUrl, setTargetUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [task, setTask]             = useState(null);
  const [isPolling, setIsPolling]   = useState(false);

  /* load active accounts */
  useEffect(() => {
    api.listAccounts()
      .then((data) => {
        const active = data.filter((a) => a.is_active);
        setAccounts(active);
        if (active.length > 0) setAccountId(String(active[0].id));
      })
      .catch(() => toast.push("Error", "Gagal memuat daftar akun", "error"));
  }, []);

  /* poll task status until terminal */
  useEffect(() => {
    if (!task || task.status === "success" || task.status === "failed") {
      setIsPolling(false);
      return;
    }
    setIsPolling(true);
    const iv = setInterval(async () => {
      try {
        const targets = await api.listTargets();
        const match = targets.find((t) => t.id === task.target_id);
        if (match) {
          setTask((prev) => ({ ...prev, status: match.status }));
          if (match.status === "success") {
            toast.push("Berhasil! 👍", `Task #${task.target_id} selesai — postingan berhasil di-like!`, "success");
            clearInterval(iv); setIsPolling(false);
          } else if (match.status === "failed") {
            toast.push("Task Gagal", `Task #${task.target_id} gagal. Periksa log untuk detail.`, "error");
            clearInterval(iv); setIsPolling(false);
          }
        }
      } catch (_) {}
    }, 4000);
    return () => clearInterval(iv);
  }, [task?.target_id, task?.status]);

  const handleRefresh = async () => {
    if (!task) return;
    try {
      const targets = await api.listTargets();
      const match = targets.find((t) => t.id === task.target_id);
      if (match) setTask((prev) => ({ ...prev, status: match.status }));
    } catch (_) {
      toast.push("Error", "Gagal refresh status", "error");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!accountId || !targetUrl.trim()) return;

    if (!targetUrl.includes("facebook.com")) {
      toast.push("URL Tidak Valid", "Masukkan link postingan Facebook yang valid", "error");
      return;
    }

    setSubmitting(true);
    setTask(null);
    try {
      const res = await api.autoLike(Number(accountId), targetUrl.trim());
      setTask({ target_id: res.target_id, status: res.status, url: targetUrl.trim() });
      toast.push("Task Dikirim! ⚡", `Auto-like task #${res.target_id} sedang diproses`, "success");
      setTargetUrl("");
    } catch (err) {
      toast.push("Request Gagal", err.message, "error");
    }
    setSubmitting(false);
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>Auto-Like Task</h1>
        <p>Pilih akun, masukkan URL postingan Facebook, lalu klik Execute</p>
      </div>

      <div className="grid-2" style={{ alignItems: "start" }}>
        {/* ── Left: Form ─────────────────────────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div className="card">
            <div className="card-header">
              <Send size={15} style={{ color: "var(--cyan)" }} />
              <h2>Submit Task</h2>
            </div>
            <div className="card-inner">
              <form onSubmit={handleSubmit} className="submit-form">
                {/* Account selector */}
                <div className="field">
                  <label htmlFor="account">Akun Facebook</label>
                  {accounts.length === 0 ? (
                    <div style={{ fontSize: 13, color: "var(--red)", display: "flex", alignItems: "center", gap: 6 }}>
                      <AlertCircle size={14} />
                      Tidak ada akun aktif. Tambahkan akun melalui database terlebih dahulu.
                    </div>
                  ) : (
                    <select
                      id="account"
                      className="input"
                      value={accountId}
                      onChange={(e) => setAccountId(e.target.value)}
                      required
                    >
                      {accounts.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.username}{a.proxy ? ` — proxy: ${a.proxy}` : ""}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* URL input with tooltip */}
                <div className="field">
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <label htmlFor="url" style={{ marginBottom: 0 }}>URL Postingan Facebook</label>
                    <div className="tooltip-wrap" style={{ marginBottom: 0 }}>
                      <span className="tooltip-icon" tabIndex={0} aria-label="Bantuan format URL">
                        <HelpCircle size={13} />
                      </span>
                      <div className="tooltip-box">
                        <strong style={{ color: "var(--cyan)", display: "block", marginBottom: 4 }}>Format URL yang diterima</strong>
                        URL postingan Facebook. Bisa berupa:
                        <pre>{`https://www.facebook.com/share/p/Xxx...
https://www.facebook.com/photo?fbid=...
https://www.facebook.com/permalink/...
https://www.facebook.com/username/posts/...`}</pre>
                        Pastikan URL dapat diakses publik atau oleh akun yang dipilih.
                      </div>
                    </div>
                  </div>
                  <input
                    id="url"
                    type="url"
                    className="input"
                    placeholder="https://www.facebook.com/share/p/..."
                    value={targetUrl}
                    onChange={(e) => setTargetUrl(e.target.value)}
                    required
                    autoComplete="off"
                  />
                  <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                    Salin link langsung dari postingan Facebook yang ingin di-like
                  </span>
                </div>

                {/* Submit button */}
                <div style={{ paddingTop: 4 }}>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={submitting || accounts.length === 0}
                    style={{ width: "100%", justifyContent: "center", fontSize: 15, padding: "13px 22px" }}
                  >
                    {submitting ? (
                      <>
                        <div className="spinner spinner-sm" />
                        Mengirim task…
                      </>
                    ) : (
                      <>
                        <Zap size={16} />
                        Execute Auto-Like
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Cookie guide */}
          <CookieGuide />

          {/* How it works */}
          <div className="info-box">
            <div className="info-box-title">
              <AlertCircle size={12} /> Cara kerja bot
            </div>
            <ul>
              <li>Task masuk antrean langsung dan mengembalikan status <code>pending</code></li>
              <li>Bot membuka browser Chromium headless dengan cookies akun yang dipilih</li>
              <li>Simulasi perilaku manusia: scroll acak + delay 20–60 detik</li>
              <li>Tombol Like ditemukan dan diklik → status berubah ke <code>success</code></li>
            </ul>
          </div>
        </div>

        {/* ── Right: Progress ────────────────────────────────── */}
        <div>
          {task ? (
            <TaskProgressCard task={task} onRefresh={handleRefresh} isPolling={isPolling} />
          ) : (
            <div className="card">
              <div className="card-inner">
                <div className="empty-state" style={{ padding: "40px 0" }}>
                  <Zap size={32} style={{ marginBottom: 12 }} />
                  <p style={{ marginBottom: 4 }}>Belum ada task aktif.</p>
                  <p>Isi form dan klik <strong>Execute</strong> untuk melihat progress di sini.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
