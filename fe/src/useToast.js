import { useState, useCallback } from "react";

let _id = 0;

export function useToast() {
  const [toasts, setToasts] = useState([]);

  const push = useCallback((title, message, type = "info") => {
    const id = ++_id;
    setToasts((prev) => [...prev, { id, title, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4500);
  }, []);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { toasts, push, dismiss };
}
