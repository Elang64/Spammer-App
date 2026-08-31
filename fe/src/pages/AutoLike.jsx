import { useEffect, useState } from "react";
import { Send, Zap, AlertCircle, CheckCircle2, Clock, RefreshCw, ExternalLink } from "lucide-react";
import { api } from "../api";

function StatusBadge({ status }) {
  return <span className={`badge badge-${status}`}>{status.replace("_", " ")}</span>;
}

function TaskProgressCard({ task, onRefresh }) {
  return (
    <div className="card" style={{ marginTop: 0 }}>
      <div className="card-header">
        <Zap size={15} style={{ color: "var(--yellow)" }} />
        <h2>Task Queued</h2>
        <button className="btn-icon btn-sm" style={{ marginLeft: "auto" }} onClick={onRefresh} aria-label="Refresh status">
          <RefreshCw size={13} />
        </button>
      </div>
      <div className="card-inner">
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", gap: 16 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>Task ID</div>
              <div style={{ fontFamily: "monospace", fontWeight: 700, fontSize: 18, color: "var(--accent)" }}>#{task.target_id}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>Status</div>
              <StatusBadge status={task.status} />
            </div>
          </div>

          <div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>Target URL</div>
            <a
              href={task.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: "var(--accent)",
                fontSize: 12,
                fontFamily: "monospace",
                display: "flex",
                alignItems: "center",
                gap: 4,
                wordBreak: "break-all",
              }}
            >
              {task.url} <ExternalLink size={11} />
            </a>
          </div>

          {/* Timeline */}
          <div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 10 }}>Progress</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                { key: "pending",     label: "Task received",         icon: <Clock size={13} /> },
                { key: "in_progress", label: "Browser automation running", icon: <div className="spinner spinner-sm" /> },
                { key: "success",     label: "Like button clicked",   icon: <CheckCircle2 size={13} /> },
                { key: "failed",      label: "Task failed",           icon: <AlertCircle size={13} /> },
              ].map(({ key, label, icon }) => {
                const order = ["pending", "in_progress", "success", "failed"];
                const curIdx = order.indexOf(task.status);
                const itemIdx = order.indexOf(key);
                const isDone    = curIdx > itemIdx || (curIdx === itemIdx && task.status !== "failed");
                const isCurrent = curIdx === itemIdx;
                const isFailed  = task.status === "failed" && key === "failed";

                if (task.status === "success" && key === "failed") return null;

                let color = "var(--text-muted)";
                if (isCurrent && !isFailed) color = "var(--accent)";
                if (isDone && key !== "failed") color = "var(--green)";
                if (isFailed) color = "var(--red)";

                return (
                  <div key={key} style={{ display: "flex", alignItems: "center", gap: 10, color }}>
                    <div style={{ width: 20, display: "flex", justifyContent: "center" }}>{icon}</div>
                    <span style={{ fontSize: 13 }}>{label}</span>
                    {isCurrent && task.status === "in_progress" && (
                      <span style={{ fontSize: 11, color: "var(--text-muted)", marginLeft: 4 }}>
                        — can take 20–60s
                      </span>
                    )}
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

export default function AutoLike({ toast }) {
  const [accounts, setAccounts] = useState([]);
  const [accountId, setAccountId] = useState("");
  const [targetUrl, setTargetUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [task, setTask] = useState(null);
  const [polling, setPolling] = useState(false);

  useEffect(() => {
    api
      .listAccounts()
      .then((data) => {
        const active = data.filter((a) => a.is_active);
        setAccounts(active);
        if (active.length > 0) setAccountId(String(active[0].id));
      })
      .catch(() => toast.push("Error", "Failed to load accounts", "error"));
  }, []);

  // Poll target status until terminal state
  useEffect(() => {
    if (!task || task.status === "success" || task.status === "failed") {
      setPolling(false);
      return;
    }
    setPolling(true);
    const iv = setInterval(async () => {
      try {
        const targets = await api.listTargets();
        const match = targets.find((t) => t.id === task.target_id);
        if (match) {
          setTask((prev) => ({ ...prev, status: match.status }));
          if (match.status === "success") {
            toast.push("Success", `Task #${task.target_id} completed — post liked!`, "success");
            clearInterval(iv);
            setPolling(false);
          } else if (match.status === "failed") {
            toast.push("Failed", `Task #${task.target_id} failed. Check logs.`, "error");
            clearInterval(iv);
            setPolling(false);
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
      toast.push("Error", "Failed to refresh status", "error");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!accountId || !targetUrl.trim()) return;

    if (!targetUrl.includes("facebook.com")) {
      toast.push("Invalid URL", "Please enter a valid Facebook post URL", "error");
      return;
    }

    setSubmitting(true);
    setTask(null);
    try {
      const res = await api.autoLike(Number(accountId), targetUrl.trim());
      setTask({ target_id: res.target_id, status: res.status, url: targetUrl.trim() });
      toast.push("Task Queued", `Auto-like task #${res.target_id} is now processing`, "success");
      setTargetUrl("");
    } catch (err) {
      toast.push("Request Failed", err.message, "error");
    }
    setSubmitting(false);
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>Auto-Like Task</h1>
        <p>Submit a Facebook post URL and choose an account to like it automatically</p>
      </div>

      <div className="grid-2" style={{ alignItems: "start" }}>
        {/* Form */}
        <div className="card">
          <div className="card-header">
            <Send size={15} style={{ color: "var(--accent)" }} />
            <h2>Submit Task</h2>
          </div>
          <div className="card-inner">
            <form onSubmit={handleSubmit} className="submit-form">
              <div className="field">
                <label htmlFor="account">Facebook Account</label>
                {accounts.length === 0 ? (
                  <div style={{ fontSize: 13, color: "var(--red)", display: "flex", alignItems: "center", gap: 6 }}>
                    <AlertCircle size={14} /> No active accounts found. Add one via the database.
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
                        {a.username} {a.proxy ? `— proxy: ${a.proxy}` : ""}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="field">
                <label htmlFor="url">Facebook Post URL</label>
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
                  Paste a direct link to the Facebook post you want to like
                </span>
              </div>

              <div style={{ paddingTop: 4 }}>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting || accounts.length === 0}
                  style={{ width: "100%", justifyContent: "center" }}
                >
                  {submitting ? (
                    <>
                      <div className="spinner spinner-sm" />
                      Queuing task…
                    </>
                  ) : (
                    <>
                      <Zap size={15} />
                      Send Auto-Like
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Task progress */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {task ? (
            <TaskProgressCard task={task} onRefresh={handleRefresh} />
          ) : (
            <div className="card">
              <div className="card-inner">
                <div className="empty-state" style={{ padding: "32px 0" }}>
                  <Zap size={30} />
                  <p style={{ marginTop: 8 }}>No active task yet.</p>
                  <p>Fill in the form and submit to see live progress here.</p>
                </div>
              </div>
            </div>
          )}

          {/* Info box */}
          <div className="info-box">
            <div className="info-box-title">
              <AlertCircle size={13} /> How it works
            </div>
            <ul>
              <li>Task is queued immediately and returns <code>pending</code></li>
              <li>Bot launches a headless Chromium browser with your account cookies</li>
              <li>Human-like scrolling and random delays are applied (20–60s total)</li>
              <li>Like button is located and clicked — status changes to <code>success</code></li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
