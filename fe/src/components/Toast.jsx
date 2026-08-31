import { CheckCircle, XCircle, Info, X } from "lucide-react";

const icons = {
  success: <CheckCircle size={16} color="var(--green)" />,
  error:   <XCircle    size={16} color="var(--red)"   />,
  info:    <Info       size={16} color="var(--accent)" />,
};

export function ToastContainer({ toasts, dismiss }) {
  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          {icons[t.type] ?? icons.info}
          <div className="toast-body">
            <div className="toast-title">{t.title}</div>
            {t.message && <div className="toast-msg">{t.message}</div>}
          </div>
          <button className="btn-icon" style={{ padding: 4 }} onClick={() => dismiss(t.id)} aria-label="Dismiss">
            <X size={13} />
          </button>
        </div>
      ))}
    </div>
  );
}
