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
import { api, formatBytes } from "../lib/api";

const Dashboard = () => {
  const [selectedApp, setSelectedApp] = useState(null);
  const [showLogs, setShowLogs] = useState(false);
  const [actionLoading, setActionLoading] = useState({});
  const [systemStats, setSystemStats] = useState({});
  const [connectionStatus, setConnectionStatus] = useState("connecting");

  // Fetch apps data with SWR
  const {
    data: appsData,
    error: appsError,
    mutate: refreshApps,
  } = useSWR("apps", api.getApps, {
    refreshInterval: 5000, // Poll every 5 seconds
    onSuccess: () => setConnectionStatus("connected"),
    onError: () => setConnectionStatus("error"),
  });

  // Fetch health data
  const { data: healthData } = useSWR("health", api.healthCheck, {
    refreshInterval: 10000, // Poll every 10 seconds
  });

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
    if (appsData?.apps) {
      const apps = appsData.apps;
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
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <Eye className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Big Brother
                </h1>
                <p className="text-sm text-gray-500">
                  VPS Monitoring Dashboard
                </p>
              </div>
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

              {/* System time */}
              <div className="text-sm text-gray-500">
                {new Date().toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      </header>

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
        {appsError ? (
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
        ) : appsData.apps.length === 0 ? (
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
                Applications ({appsData.apps.length})
              </h2>
              <div className="text-sm text-gray-500">
                Last updated:{" "}
                {new Date(appsData.timestamp).toLocaleTimeString()}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {appsData.apps.map((app) => (
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
