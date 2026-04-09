const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

function getToken(): string | null {
  return localStorage.getItem("token");
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> || {}),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Request failed: ${response.status}`);
  }

  return response.json();
}

export const api = {
  // Auth
  register(username: string, email: string, password: string) {
    return request<{ token: string; user: import("@/types").User }>(
      "/api/auth/register",
      { method: "POST", body: JSON.stringify({ username, email, password }) }
    );
  },

  login(username: string, password: string) {
    return request<{ token: string; user: import("@/types").User }>(
      "/api/auth/login",
      { method: "POST", body: JSON.stringify({ username, password }) }
    );
  },

  logout() {
    return request("/api/auth/logout", { method: "POST" });
  },

  getMe() {
    return request<import("@/types").User>("/api/auth/me");
  },

  // Papers
  getPapers(params: {
    page?: number;
    page_size?: number;
    domain?: string;
    sort_by?: string;
    bookmarked_only?: boolean;
  }) {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set("page", String(params.page));
    if (params.page_size) searchParams.set("page_size", String(params.page_size));
    if (params.domain) searchParams.set("domain", params.domain);
    if (params.sort_by) searchParams.set("sort_by", params.sort_by);
    if (params.bookmarked_only) searchParams.set("bookmarked_only", "true");
    return request<import("@/types").PaperListResponse>(
      `/api/papers?${searchParams.toString()}`
    );
  },

  toggleBookmark(paperId: number) {
    return request<{ bookmarked: boolean }>(`/api/papers/${paperId}/bookmark`);
  },

  toggleRead(paperId: number) {
    return request<{ is_read: boolean }>(`/api/papers/${paperId}/read`, {
      method: "POST",
    });
  },

  // Domains
  getDomains() {
    return request<{ domains: string[]; source: string }>("/api/domains");
  },

  getSettings() {
    return request<{
      domains: { name: string; is_custom: boolean }[];
      domains_selected: boolean;
    }>("/api/settings");
  },

  updateSettings(domains: { name: string; is_custom: boolean }[]) {
    return request<{
      domains: { name: string; is_custom: boolean }[];
      domains_selected: boolean;
    }>("/api/settings", {
      method: "POST",
      body: JSON.stringify({ domains }),
    });
  },

  // Refresh
  refresh() {
    return request<import("@/types").RefreshResponse>("/api/refresh", {
      method: "POST",
    });
  },
};
