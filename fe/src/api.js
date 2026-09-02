const BASE_URL = import.meta.env.VITE_API_URL || "";

async function request(method, path, body) {
  const options = {
    method,
    headers: { "Content-Type": "application/json" },
  };
  if (body !== undefined) options.body = JSON.stringify(body);

  const res = await fetch(`${BASE_URL}${path}`, options);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }
  return res.json();
}

export const api = {
  // Health
  health: () => request("GET", "/health"),

  // Auth
  login: (password) => request("POST", "/api/auth/login", { password }),

  // Stats (single endpoint for dashboard summary)
  getStats: () => request("GET", "/api/stats"),

  // Accounts
  listAccounts:  ()     => request("GET",    "/api/accounts"),
  createAccount: (data) => request("POST",   "/api/accounts", data),
  toggleAccount: (id)   => request("PATCH",  `/api/accounts/${id}/toggle`),
  deleteAccount: (id)   => request("DELETE", `/api/accounts/${id}`),

  // Proxy tester
  testProxy: (proxy) => request("POST", "/api/proxy/test", { proxy }),

  // Auto-like & targets
  autoLike:    (account_id, target_url) => request("POST", "/api/auto-like", { account_id, target_url }),
  stopTarget:   (id) => request("POST", `/api/targets/${id}/stop`),
  deleteTarget: (id) => request("DELETE", `/api/targets/${id}`),
  listTargets:  ()   => request("GET",  "/api/targets"),

  // Logs
  listLogs: () => request("GET", "/api/logs"),
};
