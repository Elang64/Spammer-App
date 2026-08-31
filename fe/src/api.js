const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

async function request(method, path, body) {
  const options = {
    method,
    headers: { "Content-Type": "application/json" },
  };
  if (body) options.body = JSON.stringify(body);

  const res = await fetch(`${BASE_URL}${path}`, options);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }
  return res.json();
}

export const api = {
  health: () => request("GET", "/health"),
  listAccounts: () => request("GET", "/api/accounts"),
  listTargets: () => request("GET", "/api/targets"),
  listLogs: () => request("GET", "/api/logs"),
  autoLike: (account_id, target_url) =>
    request("POST", "/api/auto-like", { account_id, target_url }),
};
