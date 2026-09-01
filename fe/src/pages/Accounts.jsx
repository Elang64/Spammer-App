import { useEffect, useState, useMemo } from "react";
import {
  Users, UserPlus, Trash2, Power, BookOpen,
  ChevronDown, ChevronUp, AlertCircle, Search,
  HelpCircle, Copy, Check, Wifi, WifiOff, Loader,
} from "lucide-react";
import { api } from "../api";

/* ─── Cookie example ─────────────────────────────────────────── */
const COOKIE_EXAMPLE = `[
  {
    "name": "c_user",
    "value": "100012345678901",
    "domain": ".facebook.com",
    "path": "/",
    "secure": true,
    "httpOnly": false,
    "expirationDate": 1800000000
  },
  {
    "name": "xs",
    "value": "24%3AaBcDeFgHiJkL...",
    "domain": ".facebook.com",
    "path": "/",
    "secure": true,
    "httpOnly": true,
    "expirationDate": 1800000000
  },
  {
    "name": "datr",
    "value": "xxxxxxxxxxxxxxxx",
    "domain": ".facebook.com",
    "path": "/",
    "secure": true,
    "httpOnly": true
  }
]`;

/* ─── Cookie Guide ───────────────────────────────────────────── */
function CookieGuide() {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyExample = () => {
    navigator.clipboard.writeText(COOKIE_EXAMPLE);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

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
          <BookOpen size={12} /> Panduan format cookies Facebook
        </span>
        {open ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
      </div>

      {open && (
        <div className="cookie-guide-body">
          <div>
            <div className="guide-step-label">Cara mengambil cookies</div>
            <ol>
              <li>Install ekstensi <strong style={{ color: "var(--cyan)" }}>EditThisCookie</strong> atau <strong style={{ color: "var(--cyan)" }}>Cookie-Editor</strong> di Chrome / Firefox.</li>
              <li>Buka <strong>facebook.com</strong> di browser dan pastikan sudah login.</li>
              <li>Klik ikon ekstensi tersebut, lalu pilih <em>Export</em> → <em>Export as JSON</em>.</li>
              <li>Salin seluruh teks JSON yang muncul — itulah nilai yang harus dimasukkan ke kolom <em>Session Cookies</em>.</li>
              <li>Tempel JSON tersebut ke kolom di bawah dan simpan.</li>
            </ol>
          </div>

          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
              <div className="guide-step-label" style={{ marginBottom: 0 }}>Contoh JSON yang valid</div>
              <button
                onClick={copyExample}
                className="btn-icon"
                style={{ padding: "3px 8px", fontSize: 10, gap: 4, display: "flex", alignItems: "center" }}
                title="Salin contoh"
              >
                {copied ? <Check size={11} /> : <Copy size={11} />}
                {copied ? "Tersalin!" : "Salin"}
              </button>
            </div>
            <pre>{COOKIE_EXAMPLE}</pre>
          </div>

          <div style={{ display: "flex", alignItems: "flex-start", gap: 6, color: "var(--yellow)", fontSize: 11 }}>
            <AlertCircle size={11} style={{ flexShrink: 0, marginTop: 2 }} />
            <span>
              Cookies harus dalam format array <code>[{"{}"}]</code>, bukan objek tunggal <code>{"{}"}</code>.
              Jika akun tiba-tiba logout otomatis, ambil cookies ulang karena sudah expired.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Tooltip helper ─────────────────────────────────────────── */
function FieldTip({ children }) {
  return (
    <div className="tooltip-wrap">
      <span className="tooltip-icon" tabIndex={0}><HelpCircle size={12} /></span>
      <div className="tooltip-box">{children}</div>
    </div>
  );
}

/* ─── Add Account Form ───────────────────────────────────────── */
function AddAccountForm({ onAdded, toast }) {
  const [username,   setUsername]   = useState("");
  const [cookies,    setCookies]    = useState("");
  const [proxy,      setProxy]      = useState("");
  const [userAgent,  setUserAgent]  = useState("");
  const [saving,     setSaving]     = useState(false);
  const [cookieErr,  setCookieErr]  = useState("");
  const [proxyTest,  setProxyTest]  = useState(null); // null | "testing" | { ok, ip, err }

  const testProxy = async () => {
    if (!proxy.trim()) return;
    setProxyTest("testing");
    try {
      const res = await api.testProxy(proxy.trim());
      if (res.success) {
        // remote returns { success, message, details: { origin: "ip" } }
        const ip = res.details?.origin ?? res.ip ?? "—";
        setProxyTest({ ok: true, ip });
      } else {
        setProxyTest({ ok: false, err: res.message || "Proxy tidak bisa terhubung" });
      }
    } catch (err) {
      setProxyTest({ ok: false, err: err.message });
    }
  };

  const validateCookies = (val) => {
    if (!val.trim()) { setCookieErr(""); return true; }
    try {
      const parsed = JSON.parse(val);
      if (!Array.isArray(parsed)) { setCookieErr("Harus berupa array JSON [ ... ]"); return false; }
      setCookieErr("");
      return true;
    } catch {
      setCookieErr("Format JSON tidak valid");
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateCookies(cookies)) return;

    setSaving(true);
    try {
      await api.createAccount({
        username: username.trim(),
        session_cookies: JSON.parse(cookies),
        proxy:      proxy.trim()     || null,
        user_agent: userAgent.trim() || null,
      });
      toast.push("Akun Ditambahkan ✓", `${username} berhasil disimpan`, "success");
      setUsername(""); setCookies(""); setProxy(""); setUserAgent("");
      onAdded();
    } catch (err) {
      toast.push("Gagal Menyimpan", err.message, "error");
    }
    setSaving(false);
  };

  return (
    <div className="card">
      <div className="card-header">
        <UserPlus size={15} style={{ color: "var(--green)" }} />
        <h2>Tambah Akun Baru</h2>
      </div>
      <div className="card-inner">
        <form onSubmit={handleSubmit} className="submit-form">

          {/* Username */}
          <div className="field">
            <label htmlFor="acc-username">Nama / Username Akun</label>
            <input
              id="acc-username"
              className="input"
              placeholder="cth: Budi Santoso"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoComplete="off"
            />
          </div>

          {/* Cookies */}
          <div className="field">
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <label style={{ marginBottom: 0 }}>Session Cookies (JSON)</label>
              <FieldTip>
                <strong style={{ color: "var(--cyan)", display: "block", marginBottom: 4 }}>Format cookies yang diterima</strong>
                Harus berupa array JSON yang diekspor dari ekstensi seperti <strong>EditThisCookie</strong> atau <strong>Cookie-Editor</strong>.
                Minimal wajib ada cookie <code>c_user</code> dan <code>xs</code>.
              </FieldTip>
            </div>
            <textarea
              className="input"
              style={{ minHeight: 110, fontFamily: "monospace", fontSize: 11, resize: "vertical" }}
              placeholder={'[{"name": "c_user", "value": "...", "domain": ".facebook.com", ...}]'}
              value={cookies}
              onChange={(e) => { setCookies(e.target.value); validateCookies(e.target.value); }}
              required
            />
            {cookieErr && (
              <span style={{ fontSize: 11, color: "var(--red)", display: "flex", alignItems: "center", gap: 4 }}>
                <AlertCircle size={11} /> {cookieErr}
              </span>
            )}
          </div>

          {/* Cookie guide */}
          <CookieGuide />

          {/* Proxy */}
          <div className="field">
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <label style={{ marginBottom: 0 }}>Proxy <span style={{ opacity: 0.5, fontWeight: 400, textTransform: "none" }}>(opsional)</span></label>
              <FieldTip>
                Format: <code>http://ip:port</code> atau <code>http://user:pass@ip:port</code>.
                Kosongkan jika tidak pakai proxy.
              </FieldTip>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                className="input"
                placeholder="http://192.168.1.1:8080"
                value={proxy}
                onChange={(e) => { setProxy(e.target.value); setProxyTest(null); }}
                autoComplete="off"
                style={{ flex: 1 }}
              />
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={testProxy}
                disabled={!proxy.trim() || proxyTest === "testing"}
                title="Test koneksi proxy"
                style={{ flexShrink: 0, whiteSpace: "nowrap" }}
              >
                {proxyTest === "testing" ? (
                  <><div className="spinner spinner-sm" /> Testing…</>
                ) : (
                  <><Wifi size={12} /> Test Proxy</>
                )}
              </button>
            </div>

            {/* Proxy test result */}
            {proxyTest && proxyTest !== "testing" && (
              <div style={{
                display: "flex", alignItems: "center", gap: 7,
                fontSize: 12, padding: "7px 11px",
                borderRadius: "var(--radius-sm)",
                background: proxyTest.ok ? "var(--green-dim)" : "var(--red-dim)",
                border: `1px solid ${proxyTest.ok ? "rgba(0,255,163,0.25)" : "rgba(255,77,106,0.25)"}`,
                color: proxyTest.ok ? "var(--green)" : "var(--red)",
              }}>
                {proxyTest.ok
                  ? <><Wifi size={12} /> Proxy OK — IP terdeteksi: <strong style={{ fontFamily: "monospace" }}>{proxyTest.ip}</strong></>
                  : <><WifiOff size={12} /> Gagal: {proxyTest.err}</>
                }
              </div>
            )}
          </div>

          {/* User Agent */}
          <div className="field">
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <label style={{ marginBottom: 0 }}>User Agent <span style={{ opacity: 0.5, fontWeight: 400, textTransform: "none" }}>(opsional)</span></label>
              <FieldTip>
                Kosongkan untuk pakai user agent bawaan Chromium.
                Contoh: <code>Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36...</code>
              </FieldTip>
            </div>
            <input
              className="input"
              placeholder="Mozilla/5.0 ..."
              value={userAgent}
              onChange={(e) => setUserAgent(e.target.value)}
              autoComplete="off"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="btn btn-primary"
            disabled={saving || !!cookieErr}
            style={{ width: "100%", justifyContent: "center", fontSize: 14, padding: "12px 20px" }}
          >
            {saving ? (
              <><div className="spinner spinner-sm" /> Menyimpan akun…</>
            ) : (
              <><UserPlus size={15} /> Simpan Akun</>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

/* ─── Account Card ───────────────────────────────────────────── */
function AccountCard({ account, onToggle, onDelete, toggling, deleting }) {
  return (
    <div
      className="acc-card"
      style={{
        background: "var(--bg-card)",
        border: `1px solid ${account.is_active ? "rgba(0,210,255,0.18)" : "rgba(255,255,255,0.06)"}`,
        borderRadius: "var(--radius)",
        padding: "14px 18px",
        display: "flex",
        alignItems: "center",
        gap: 14,
        transition: "border-color 0.2s",
        opacity: account.is_active ? 1 : 0.55,
      }}
    >
      {/* Avatar */}
      <div style={{
        width: 38, height: 38, borderRadius: 10, flexShrink: 0,
        background: account.is_active
          ? "linear-gradient(135deg, #0077bb, #00d2ff)"
          : "rgba(255,255,255,0.08)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 16, fontWeight: 700,
        color: account.is_active ? "#001a33" : "var(--text-muted)",
        boxShadow: account.is_active ? "0 0 12px rgba(0,210,255,0.35)" : "none",
      }}>
        {account.username.charAt(0).toUpperCase()}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)", marginBottom: 2 }}>
          {account.username}
        </div>
        <div style={{ display: "flex", gap: 10, fontSize: 11, color: "var(--text-muted)", flexWrap: "wrap" }}>
          <span>ID #{account.id}</span>
          {account.proxy && <span title={account.proxy}>Proxy ✓</span>}
          {account.user_agent && <span>UA ✓</span>}
          <span>{new Date(account.created_at).toLocaleDateString("id-ID")}</span>
        </div>
      </div>

      {/* Status badge */}
      <span className={`badge badge-${account.is_active ? "active" : "inactive"}`} style={{ flexShrink: 0 }}>
        {account.is_active ? "Aktif" : "Nonaktif"}
      </span>

      {/* Actions */}
      <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
        <button
          className="btn-icon"
          onClick={() => onToggle(account.id)}
          disabled={toggling === account.id}
          title={account.is_active ? "Nonaktifkan akun" : "Aktifkan akun"}
          aria-label="Toggle status akun"
          style={{ color: account.is_active ? "var(--yellow)" : "var(--green)" }}
        >
          {toggling === account.id
            ? <div className="spinner spinner-sm" />
            : <Power size={13} />}
        </button>
        <button
          className="btn-icon"
          onClick={() => onDelete(account.id, account.username)}
          disabled={deleting === account.id}
          title="Hapus akun"
          aria-label="Hapus akun"
          style={{ color: "var(--red)" }}
        >
          {deleting === account.id
            ? <div className="spinner spinner-sm" />
            : <Trash2 size={13} />}
        </button>
      </div>
    </div>
  );
}

/* ─── Confirm Delete Modal ───────────────────────────────────── */
function ConfirmModal({ name, onConfirm, onCancel }) {
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 200,
      background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <div className="card" style={{ width: 360, padding: 0 }}>
        <div className="card-header" style={{ gap: 8 }}>
          <Trash2 size={15} style={{ color: "var(--red)" }} />
          <h2>Hapus Akun</h2>
        </div>
        <div className="card-inner" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>
            Yakin ingin menghapus akun <strong style={{ color: "var(--text-primary)" }}>{name}</strong>?
            Tindakan ini tidak bisa dibatalkan.
          </p>
          <div style={{ display: "flex", gap: 10 }}>
            <button className="btn btn-ghost" onClick={onCancel} style={{ flex: 1, justifyContent: "center" }}>
              Batal
            </button>
            <button
              className="btn"
              onClick={onConfirm}
              style={{
                flex: 1, justifyContent: "center",
                background: "var(--red-dim)", color: "var(--red)",
                border: "1px solid rgba(255,77,106,0.35)",
              }}
            >
              <Trash2 size={14} /> Hapus
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Accounts Page ──────────────────────────────────────────── */
export default function Accounts({ toast }) {
  const [accounts,  setAccounts]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [toggling,  setToggling]  = useState(null);
  const [deleting,  setDeleting]  = useState(null);
  const [confirm,   setConfirm]   = useState(null); // { id, name }
  const [search,    setSearch]    = useState("");

  const load = async () => {
    setLoading(true);
    try {
      setAccounts(await api.listAccounts());
    } catch (err) {
      toast.push("Error", "Gagal memuat akun", "error");
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleToggle = async (id) => {
    setToggling(id);
    try {
      const res = await api.toggleAccount(id);
      // remote returns { message, account: { is_active, ... } } or { message, is_active }
      const newActive = res.account?.is_active ?? res.is_active;
      setAccounts((prev) => prev.map((a) => a.id === id ? { ...a, is_active: newActive } : a));
      toast.push(
        newActive ? "Akun Diaktifkan" : "Akun Dinonaktifkan",
        `Status akun #${id} diperbarui`,
        "info"
      );
    } catch (err) {
      toast.push("Gagal", err.message, "error");
    }
    setToggling(null);
  };

  const handleDelete = (id, name) => setConfirm({ id, name });

  const confirmDelete = async () => {
    const { id, name } = confirm;
    setConfirm(null);
    setDeleting(id);
    try {
      await api.deleteAccount(id);
      setAccounts((prev) => prev.filter((a) => a.id !== id));
      toast.push("Akun Dihapus", `${name} berhasil dihapus`, "success");
    } catch (err) {
      toast.push("Gagal", err.message, "error");
    }
    setDeleting(null);
  };

  const filtered = useMemo(() => {
    if (!search) return accounts;
    const q = search.toLowerCase();
    return accounts.filter((a) =>
      a.username.toLowerCase().includes(q) || String(a.id).includes(q)
    );
  }, [accounts, search]);

  const activeCount   = accounts.filter((a) => a.is_active).length;
  const inactiveCount = accounts.length - activeCount;

  return (
    <div className="page">
      {confirm && (
        <ConfirmModal
          name={confirm.name}
          onConfirm={confirmDelete}
          onCancel={() => setConfirm(null)}
        />
      )}

      <div className="page-header">
        <h1>Manajemen Akun</h1>
        <p>Tambah, kelola, dan monitor status akun Facebook yang digunakan bot</p>
      </div>

      {/* Stats row */}
      <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
        {[
          { label: "Total Akun",   value: accounts.length, color: "var(--text-primary)" },
          { label: "Aktif",        value: activeCount,     color: "var(--green)" },
          { label: "Nonaktif",     value: inactiveCount,   color: "var(--text-muted)" },
        ].map(({ label, value, color }) => (
          <div key={label} className="stat-card" style={{ flex: "1 1 120px", minWidth: 100 }}>
            <div className="stat-value" style={{ color, fontSize: 26 }}>{value}</div>
            <div className="stat-label">{label}</div>
          </div>
        ))}
      </div>

      <div className="grid-2" style={{ alignItems: "start" }}>
        {/* ── Left: Add form ─────────────────────────────── */}
        <AddAccountForm onAdded={load} toast={toast} />

        {/* ── Right: Account list ─────────────────────────── */}
        <div className="card">
          <div className="card-header">
            <Users size={15} style={{ color: "var(--cyan)" }} />
            <h2>Daftar Akun ({accounts.length})</h2>
          </div>

          {/* Search */}
          <div className="filter-bar" style={{ borderBottom: "1px solid var(--border)" }}>
            <div className="search-wrap" style={{ flex: 1 }}>
              <Search size={13} />
              <input
                type="search"
                className="search-input"
                placeholder="Cari nama atau ID akun…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Cari akun"
              />
            </div>
          </div>

          <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: 8, maxHeight: 520, overflowY: "auto" }}>
            {loading ? (
              <div style={{ textAlign: "center", padding: "32px 0" }}>
                <div className="spinner" style={{ margin: "0 auto" }} />
              </div>
            ) : filtered.length === 0 ? (
              <div className="empty-state" style={{ padding: "32px 0" }}>
                <Users size={32} />
                <p>{search ? "Tidak ada akun yang cocok." : "Belum ada akun. Tambahkan akun di sebelah kiri."}</p>
              </div>
            ) : (
              filtered.map((acc) => (
                <AccountCard
                  key={acc.id}
                  account={acc}
                  onToggle={handleToggle}
                  onDelete={handleDelete}
                  toggling={toggling}
                  deleting={deleting}
                />
              ))
            )}
          </div>

          {search && (
            <div style={{ padding: "8px 18px", fontSize: 11, color: "var(--text-muted)", borderTop: "1px solid var(--border)" }}>
              {filtered.length} dari {accounts.length} akun
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
