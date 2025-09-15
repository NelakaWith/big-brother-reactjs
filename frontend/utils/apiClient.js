/**
 * API Client
 * HTTP client with JWT authentication
 */
class ApiClient {
  constructor(
    baseURL = (() => {
      const env = process.env.NEXT_PUBLIC_BACKEND_URL;
      if (env) {
        // normalize trailing slash
        const trimmed = env.replace(/\/$/, "");
        // if env already points at /api, leave it
        if (trimmed.endsWith("/api")) return trimmed;
        // otherwise append /api
        return `${trimmed}/api`;
      }

      // No env provided — if running in browser use current origin
      if (typeof window !== "undefined") {
        return `${window.location.origin}/api`;
      }

      // fallback for server-side / dev
      return "http://localhost:3001/api";
    })()
  ) {
    this.baseURL = baseURL;
  }

  // Get stored JWT token
  getToken() {
    if (typeof window !== "undefined") {
      return localStorage.getItem("bb_access_token");
    }
    return null;
  }

  // Get auth headers
  getAuthHeaders() {
    const token = this.getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  // Generic request method
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;

    const defaultHeaders = {
      "Content-Type": "application/json",
      ...this.getAuthHeaders(),
    };

    const config = {
      headers: defaultHeaders,
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);

      // Handle 401 unauthorized - token might be expired
      if (response.status === 401) {
        // Create a custom 401 error that can be handled by Redux
        const error = new Error("Unauthorized");
        error.status = 401;
        error.name = "UnauthorizedError";
        throw error;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        );
      }

      return await response.json();
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  // HTTP Methods
  async get(endpoint, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;
    return this.request(url, { method: "GET" });
  }

  async post(endpoint, data = {}) {
    return this.request(endpoint, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async put(endpoint, data = {}) {
    return this.request(endpoint, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async delete(endpoint) {
    return this.request(endpoint, { method: "DELETE" });
  }

  // Authentication endpoints
  async login(username, password) {
    return this.request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
  }

  async refreshToken(refreshToken) {
    return this.request("/auth/refresh", {
      method: "POST",
      body: JSON.stringify({ refreshToken }),
    });
  }

  async logout() {
    const refreshToken = localStorage.getItem("bb_refresh_token");
    try {
      return await this.request("/auth/logout", {
        method: "POST",
        body: JSON.stringify({ refreshToken }),
      });
    } catch (error) {
      // Even if logout fails on server, clear local tokens
      console.warn("Server logout failed:", error);
      return { success: true };
    }
  }

  // Dashboard data endpoints
  async getDashboardData() {
    return this.get("/dashboard");
  }

  // Application endpoints
  async getApplications() {
    return this.get("/applications");
  }

  async getApplication(id) {
    return this.get(`/applications/${id}`);
  }

  async createApplication(data) {
    return this.post("/applications", data);
  }

  async updateApplication(id, data) {
    return this.put(`/applications/${id}`, data);
  }

  async deleteApplication(id) {
    return this.delete(`/applications/${id}`);
  }

  // Metrics endpoints
  async getMetrics(params = {}) {
    return this.get("/metrics", params);
  }

  async getApplicationMetrics(appId, params = {}) {
    return this.get(`/metrics/application/${appId}`, params);
  }

  async createMetric(data) {
    return this.post("/metrics", data);
  }

  // Logs endpoints
  async getLogs(params = {}) {
    return this.get("/logs", params);
  }

  async getApplicationLogs(appId, params = {}) {
    return this.get(`/logs/application/${appId}`, params);
  }

  // PM2 Historical logs
  async getHistoricalLogs(appName, lines = 500, offset = 0) {
    const params = { lines, offset };
    return this.get(`/logs/${appName}/historical`, params);
  }

  // Frontend logs
  async getFrontendLogs(appName, lines = 500, offset = 0) {
    const params = { lines, offset };
    return this.get(`/frontend-logs/${appName}`, params);
  }

  // Create SSE connection for live logs with JWT auth
  createLogStream(appName, onMessage, onError, onOpen) {
    const token = this.getToken();
    if (!token) {
      if (onError) onError(new Error("No authentication token available"));
      return null;
    }

    // Create SSE connection with JWT token in URL
    const url = `${this.baseURL}/logs/${appName}?token=${encodeURIComponent(
      token
    )}`;
    const eventSource = new EventSource(url);

    eventSource.onopen = (event) => {
      console.log("SSE connection opened for", appName);
      if (onOpen) onOpen(event);
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (onMessage) onMessage(data);
      } catch (error) {
        console.error("Error parsing SSE message:", error);
        if (onError) onError(error);
      }
    };

    eventSource.onerror = (event) => {
      console.error("SSE connection error for", appName, event);
      if (onError) onError(event);
    };

    return eventSource;
  }

  async createLog(data) {
    return this.post("/logs", data);
  }

  // Alerts endpoints
  async getAlerts(params = {}) {
    return this.get("/alerts", params);
  }

  async createAlert(data) {
    return this.post("/alerts", data);
  }

  async updateAlert(id, data) {
    return this.put(`/alerts/${id}`, data);
  }

  async deleteAlert(id) {
    return this.delete(`/alerts/${id}`);
  }

  // Database endpoints
  async getDatabaseStatus() {
    return this.get("/database/status");
  }

  async createDatabaseBackup() {
    return this.post("/database/backup");
  }

  async cleanupDatabase(options = {}) {
    return this.post("/database/cleanup", options);
  }

  // System endpoints
  async getSystemHealth() {
    return this.get("/health");
  }

  async getSystemInfo() {
    return this.get("/health");
  }
}

// Create and export a singleton instance
const apiClient = new ApiClient();
export default apiClient;
