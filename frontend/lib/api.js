// API configuration and utilities
const API_BASE_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";
const AUTH_USERNAME = process.env.NEXT_PUBLIC_AUTH_USERNAME || "admin";
const AUTH_PASSWORD = process.env.NEXT_PUBLIC_AUTH_PASSWORD || "SETUP_REQUIRED";

// Note: This legacy API client is deprecated in favor of JWT-based authentication
// It should only be used for backward compatibility where necessary

// Create auth header
const createAuthHeader = () => {
  const credentials = btoa(`${AUTH_USERNAME}:${AUTH_PASSWORD}`);
  return `Basic ${credentials}`;
};

// Default fetch options with auth
const defaultFetchOptions = {
  headers: {
    Authorization: createAuthHeader(),
    "Content-Type": "application/json",
  },
};

// API client wrapper
export const api = {
  // Get all apps
  getApps: async () => {
    const response = await fetch(`${API_BASE_URL}/api/apps`, {
      ...defaultFetchOptions,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  },

  // Get specific app
  getApp: async (name) => {
    const response = await fetch(`${API_BASE_URL}/api/apps/${name}`, {
      ...defaultFetchOptions,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  },

  // Get frontend logs
  getFrontendLogs: async (appName, lines = 500, offset = 0) => {
    const params = new URLSearchParams({
      lines: lines.toString(),
      offset: offset.toString(),
    });

    const response = await fetch(
      `${API_BASE_URL}/api/frontend-logs/${appName}?${params}`,
      {
        ...defaultFetchOptions,
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  },

  // Get historical logs (for backend logs)
  getHistoricalLogs: async (appName, lines = 500, offset = 0) => {
    const params = new URLSearchParams({
      lines: lines.toString(),
      offset: offset.toString(),
    });

    const response = await fetch(
      `${API_BASE_URL}/api/logs/${appName}/historical?${params}`,
      {
        ...defaultFetchOptions,
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  },

  // Restart app
  restartApp: async (name) => {
    const response = await fetch(`${API_BASE_URL}/api/apps/${name}/restart`, {
      ...defaultFetchOptions,
      method: "POST",
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  },

  // Stop app
  stopApp: async (name) => {
    const response = await fetch(`${API_BASE_URL}/api/apps/${name}/stop`, {
      ...defaultFetchOptions,
      method: "POST",
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  },

  // Health check
  healthCheck: async () => {
    const response = await fetch(`${API_BASE_URL}/api/health`, {
      ...defaultFetchOptions,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  },
};

// SSE connection for live logs
export const createLogStream = (appName, onMessage, onError, onOpen) => {
  const eventSource = new EventSource(`${API_BASE_URL}/api/logs/${appName}`, {
    withCredentials: true,
  });

  // Note: EventSource doesn't support custom headers, so we'll need to handle auth differently
  // For SSE with auth, we might need to use a token-based approach or handle it server-side

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
};

// Format bytes to human readable
export const formatBytes = (bytes, decimals = 2) => {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
};

// Format uptime to human readable
export const formatUptime = (milliseconds) => {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days}d ${hours % 24}h ${minutes % 60}m`;
  } else if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
};

// Get status color class
export const getStatusColor = (status) => {
  switch (status) {
    case "online":
      return "status-online";
    case "stopped":
    case "offline":
      return "status-offline";
    case "stopping":
      return "status-stopping";
    case "launching":
      return "status-launching";
    default:
      return "status-unknown";
  }
};

// Get status text color
export const getStatusTextColor = (status) => {
  switch (status) {
    case "online":
      return "text-green-600";
    case "stopped":
    case "offline":
      return "text-red-600";
    case "stopping":
      return "text-yellow-600";
    case "launching":
      return "text-blue-600";
    default:
      return "text-gray-600";
  }
};

export { API_BASE_URL, AUTH_USERNAME, AUTH_PASSWORD };
