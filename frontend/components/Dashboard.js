import React, { useState, useEffect } from "react";
import useSWR from "swr";
import {
  Eye,
  EyeOff,
  RefreshCw,
  Server,
  Activity,
  AlertTriangle,
  CheckCircle,
  Loader,
  Wifi,
  WifiOff,
} from "lucide-react";
import AppCard from "./AppCard";
import LogViewer from "./LogViewer";
import ClientDate from "./ClientDate";
import apiClient from "../utils/apiClient";
import { formatBytes } from "../lib/api";
import { useAuth } from "../hooks/useAuth";

const Dashboard = () => {
  const { isAuthenticated, accessToken, loading, initialized, forceLogout } =
    useAuth();
  const [selectedApp, setSelectedApp] = useState(null);
  const [showLogs, setShowLogs] = useState(false);
  const [actionLoading, setActionLoading] = useState({});
  const [systemStats, setSystemStats] = useState({});
  const [connectionStatus, setConnectionStatus] = useState("connecting");

  // Handle 401 errors by triggering logout
  const handle401Error = (error) => {
    if (error?.status === 401 || error?.name === "UnauthorizedError") {
      console.log("401 Unauthorized detected, logging out...");
      forceLogout();
      return;
    }
    console.error("Dashboard fetch error:", error);
    setConnectionStatus("error");
  };

  // Debug logging
  useEffect(() => {
    console.log("Dashboard - Redux Auth State:", {
      isAuthenticated,
      hasAccessToken: !!accessToken,
      loading,
      initialized,
    });
  }, [isAuthenticated, accessToken, loading, initialized]);

  // Show loading while auth is initializing
  if (!initialized || loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader className="h-6 w-6 animate-spin text-blue-500" />
          <span className="text-lg text-gray-600">
            {!initialized ? "Initializing..." : "Loading..."}
          </span>
        </div>
      </div>
    );
  }

  // Only fetch data if authenticated
  const shouldFetch = isAuthenticated;

  // Fetch apps data with SWR - only when authenticated
  const {
    data: appsData,
    error: appsError,
    mutate: refreshApps,
  } = useSWR(shouldFetch ? "apps" : null, () => apiClient.getDashboardData(), {
    refreshInterval: shouldFetch ? 60000 : 0, // Reduced from 30s to 60s to prevent rapid calls
    onSuccess: () => setConnectionStatus("connected"),
    onError: handle401Error,
    errorRetryInterval: 15000, // Increased retry interval
    errorRetryCount: 2, // Reduced retry count
  });

  // Fetch health data - only when authenticated
  const { data: healthData } = useSWR(
    shouldFetch ? "health" : null,
    () => apiClient.getSystemHealth(),
    {
      refreshInterval: shouldFetch ? 120000 : 0, // Increased from 60s to 120s
      onError: handle401Error,
      errorRetryInterval: 20000, // Increased retry interval
      errorRetryCount: 2,
    }
  );

  // Handle app actions
  const handleAppAction = async (appName, action) => {
    setActionLoading((prev) => ({ ...prev, [appName]: true }));

    try {
      if (action === "restart") {
        await api.restartApp(appName);
      } else if (action === "stop") {
        await api.stopApp(appName);
      }

      // Refresh data after action
      setTimeout(() => refreshApps(), 1000);
    } catch (error) {
      console.error(`Failed to ${action} app:`, error);
      alert(`Failed to ${action} ${appName}: ${error.message}`);
    } finally {
      setActionLoading((prev) => ({ ...prev, [appName]: false }));
    }
  };

  // Calculate system statistics
  useEffect(() => {
    if (appsData?.data?.apps) {
      const apps = appsData.data.apps;
      const stats = {
        totalApps: apps.length,
        onlineApps: apps.filter((app) => app.status === "online").length,
        totalMemory: apps.reduce((sum, app) => sum + (app.memory || 0), 0),
        avgCpu:
          apps.reduce((sum, app) => sum + (app.cpu || 0), 0) / apps.length || 0,
        totalRestarts: apps.reduce(
          (sum, app) => sum + (app.restart_time || 0),
          0
        ),
      };
      setSystemStats(stats);
    }
  }, [appsData]);

  // Handle view logs
  const handleViewLogs = (appName) => {
    setSelectedApp(appName);
    setShowLogs(true);
  };

  // Connection status indicator
  const getConnectionStatusIcon = () => {
    switch (connectionStatus) {
      case "connected":
        return <Wifi className="h-4 w-4 text-green-500" />;
      case "error":
        return <WifiOff className="h-4 w-4 text-red-500" />;
      default:
        return <Loader className="h-4 w-4 animate-spin text-blue-500" />;
    }
  };

  const getConnectionStatusText = () => {
    switch (connectionStatus) {
      case "connected":
        return "Connected";
      case "error":
        return "Connection Error";
      default:
        return "Connecting...";
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Dashboard header info */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-sm text-gray-600">VPS Monitoring Overview</p>
          </div>

          <div className="flex items-center space-x-4">
            {/* Connection status */}
            <div className="flex items-center space-x-2">
              {getConnectionStatusIcon()}
              <span className="text-sm text-gray-600">
                {getConnectionStatusText()}
              </span>
            </div>

            {/* Refresh button */}
            <button
              onClick={() => refreshApps()}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors duration-200"
              title="Refresh data"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Apps</p>
                <p className="text-3xl font-bold text-blue-600">
                  {systemStats.totalApps || 0}
                </p>
              </div>
              <Server className="h-8 w-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Online Apps</p>
                <p className="text-3xl font-bold text-green-600">
                  {systemStats.onlineApps || 0}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Memory
                </p>
                <p className="text-3xl font-bold text-purple-600">
                  {formatBytes(systemStats.totalMemory || 0)}
                </p>
              </div>
              <Activity className="h-8 w-8 text-purple-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg CPU</p>
                <p className="text-3xl font-bold text-orange-600">
                  {(systemStats.avgCpu || 0).toFixed(1)}%
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-500" />
            </div>
          </div>
        </div>

        {/* Main content */}
        {!shouldFetch ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              <h3 className="text-lg font-medium text-yellow-800">
                Authentication Required
              </h3>
            </div>
            <p className="mt-2 text-yellow-700">
              Please log in to access the dashboard.
            </p>
            <p className="mt-1 text-sm text-gray-600">
              Debug: loading={loading ? "true" : "false"}, isAuthenticated=
              {isAuthenticated ? "true" : "false"}, hasAccessToken=
              {accessToken ? "true" : "false"}, shouldFetch=
              {shouldFetch ? "true" : "false"}
            </p>
          </div>
        ) : appsError ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <h3 className="text-lg font-medium text-red-800">
                Connection Error
              </h3>
            </div>
            <p className="mt-2 text-red-700">
              Failed to connect to the backend API. Please check your connection
              and ensure the backend server is running.
            </p>
            <p className="mt-1 text-sm text-red-600">
              Error: {appsError.message}
            </p>
            <button
              onClick={() => refreshApps()}
              className="mt-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md transition-colors duration-200"
            >
              Retry Connection
            </button>
          </div>
        ) : !appsData ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center space-x-2">
              <Loader className="h-6 w-6 animate-spin text-blue-500" />
              <span className="text-lg text-gray-600">
                Loading applications...
              </span>
            </div>
          </div>
        ) : !appsData?.data?.apps || appsData.data.apps.length === 0 ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              <h3 className="text-lg font-medium text-yellow-800">
                No Applications Found
              </h3>
            </div>
            <p className="mt-2 text-yellow-700">
              No PM2 applications are currently running on this server.
            </p>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Applications ({appsData?.data?.apps?.length || 0})
              </h2>
              <div className="text-sm text-gray-500">
                Last updated:{" "}
                <ClientDate date={appsData?.timestamp} format="time" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {appsData?.data?.apps?.map((app) => (
                <AppCard
                  key={app.pm_id}
                  app={app}
                  onViewLogs={handleViewLogs}
                  onRestart={(name) => handleAppAction(name, "restart")}
                  onStop={(name) => handleAppAction(name, "stop")}
                  isLoading={actionLoading[app.name]}
                />
              ))}
            </div>
          </div>
        )}

        {/* System Health */}
        {healthData && (
          <div className="mt-8 bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              System Health
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-600">Backend Uptime</p>
                <p className="text-lg font-medium">
                  {Math.floor(healthData.uptime / 3600)}h{" "}
                  {Math.floor((healthData.uptime % 3600) / 60)}m
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Backend Memory</p>
                <p className="text-lg font-medium">
                  {formatBytes(healthData.memory.heapUsed)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">API Status</p>
                <p className="text-lg font-medium text-green-600">Healthy</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Log Viewer Modal */}
      {showLogs && selectedApp && (
        <LogViewer
          appName={selectedApp}
          onClose={() => {
            setShowLogs(false);
            setSelectedApp(null);
          }}
        />
      )}
    </div>
  );
};

export default Dashboard;
