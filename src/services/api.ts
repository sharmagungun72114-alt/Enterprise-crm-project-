const BASE_URL = ""; // Relative URL, since client is proxying via server middleware or same host

export interface FetchOptions extends RequestInit {
  body?: any;
}

async function request<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const token = localStorage.getItem("crm_token");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const config: RequestInit = {
    ...options,
    headers,
  };

  if (options.body) {
    config.body = JSON.stringify(options.body);
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, config);

  if (!response.ok) {
    let errorMessage = "An unexpected error occurred.";
    try {
      const errorData = await response.json();
      errorMessage = errorData.error || errorData.message || errorMessage;
    } catch (_) {}
    throw new Error(errorMessage);
  }

  // Handle empty responses
  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

export const api = {
  // Auth
  login: (credentials: any) => request<any>("/api/auth/login", { method: "POST", body: credentials }),
  register: (data: any) => request<any>("/api/auth/register", { method: "POST", body: data }),
  getProfile: () => request<any>("/api/auth/me", { method: "GET" }),
  getGoogleAuthUrl: () => request<{ configured: boolean; url?: string; instructions?: any }>("/api/auth/google/url", { method: "GET" }),

  // Customers
  getCustomers: (params?: { search?: string; status?: string; page?: number; limit?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.append("search", params.search);
    if (params?.status) searchParams.append("status", params.status);
    if (params?.page) searchParams.append("page", String(params.page));
    if (params?.limit) searchParams.append("limit", String(params.limit));
    const query = searchParams.toString();
    return request<any>(`/api/customers${query ? "?" + query : ""}`, { method: "GET" });
  },
  createCustomer: (data: any) => request<any>("/api/customers", { method: "POST", body: data }),
  updateCustomer: (id: string, data: any) => request<any>(`/api/customers/${id}`, { method: "PUT", body: data }),
  deleteCustomer: (id: string) => request<any>(`/api/customers/${id}`, { method: "DELETE" }),

  // Leads
  getLeads: (params?: { search?: string; status?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.append("search", params.search);
    if (params?.status) searchParams.append("status", params.status);
    const query = searchParams.toString();
    return request<any>(`/api/leads${query ? "?" + query : ""}`, { method: "GET" });
  },
  createLead: (data: any) => request<any>("/api/leads", { method: "POST", body: data }),
  updateLead: (id: string, data: any) => request<any>(`/api/leads/${id}`, { method: "PUT", body: data }),
  deleteLead: (id: string) => request<any>(`/api/leads/${id}`, { method: "DELETE" }),

  // Sales
  getSales: (params?: { search?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.append("search", params.search);
    const query = searchParams.toString();
    return request<any>(`/api/sales${query ? "?" + query : ""}`, { method: "GET" });
  },
  createSale: (data: any) => request<any>("/api/sales", { method: "POST", body: data }),
  updateSale: (id: string, data: any) => request<any>(`/api/sales/${id}`, { method: "PUT", body: data }),
  deleteSale: (id: string) => request<any>(`/api/sales/${id}`, { method: "DELETE" }),

  // Tasks
  getTasks: () => request<any>("/api/tasks", { method: "GET" }),
  createTask: (data: any) => request<any>("/api/tasks", { method: "POST", body: data }),
  updateTask: (id: string, data: any) => request<any>(`/api/tasks/${id}`, { method: "PUT", body: data }),
  deleteTask: (id: string) => request<any>(`/api/tasks/${id}`, { method: "DELETE" }),

  // Reports
  getReports: () => request<any>("/api/reports", { method: "GET" }),

  // Settings
  getSettings: () => request<any>("/api/settings", { method: "GET" }),
  updateCompanyProfile: (data: any) => request<any>("/api/settings", { method: "PUT", body: data }),
  updateUserProfile: (data: any) => request<any>("/api/settings/profile", { method: "PUT", body: data }),
};
