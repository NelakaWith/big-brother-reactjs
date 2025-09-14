/**
 * Dashboard Component - Updated for JWT Authentication
 * Main monitoring dashboard with authentication
 */
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
  Database,
  BarChart3,
  FileText,
  Bell,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import apiClient from "../utils/apiClient";
import AppCard from "./AppCard";
import LogViewer from "./LogViewer";
import ClientDate from "./ClientDate";

const Dashboard = () => {
  const [selectedApp, setSelectedApp] = useState(null);
  const [showLogs, setShowLogs] = useState(false);
  const [systemStats, setSystemStats] = useState({});
  const [connectionStatus, setConnectionStatus] = useState("connecting");
  const { user } = useAuth();

  // Fetch dashboard data with SWR
  const {
    data: dashboardData,
    error: dashboardError,
    mutate: refreshDashboard,
    isLoading: dashboardLoading,
  } = useSWR("dashboard", () => apiClient.getDashboardData(), {
    refreshInterval: 5000, // Poll every 5 seconds
    onSuccess: () => setConnectionStatus("connected"),
    onError: () => setConnectionStatus("error"),
  });

  // Fetch system health
  const { data: healthData } = useSWR(
    "health",
    () => apiClient.getSystemHealth(),
    {
      refreshInterval: 10000, // Poll every 10 seconds
    }
  );

  // Update system stats when dashboard data changes
  useEffect(() => {
    if (dashboardData?.data?.systemStats) {
      setSystemStats(dashboardData.data.systemStats);
    }
  }, [dashboardData]);

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

  const formatBytes = (bytes) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  if (dashboardError) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center text-white">
          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Connection Error</h2>
          <p className="text-gray-400 mb-4">
            Unable to connect to the backend server
          </p>
          <button
            onClick={() => refreshDashboard()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center mx-auto"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center">
              <Activity className="h-8 w-8 mr-3 text-blue-500" />
              Big Brother Dashboard
            </h1>
            <p className="text-gray-400 mt-1">
              Welcome back, {user?.username || "User"}
            </p>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center text-sm text-gray-400">
              {getConnectionStatusIcon()}
              <span className="ml-1">
                {connectionStatus === "connected"
                  ? "Connected"
                  : connectionStatus === "error"
                  ? "Disconnected"
                  : "Connecting..."}
              </span>
            </div>

            <button
              onClick={() => refreshDashboard()}
              className="bg-gray-800 hover:bg-gray-700 text-white px-3 py-2 rounded-lg flex items-center text-sm"
              disabled={dashboardLoading}
            >
              <RefreshCw
                className={`h-4 w-4 mr-1 ${
                  dashboardLoading ? "animate-spin" : ""
                }`}
              />
              Refresh
            </button>
          </div>
        </div>

        {/* System Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Total Apps</p>
                <p className="text-2xl font-bold text-white">
                  {systemStats.totalApps || 0}
                </p>
              </div>
              <Server className="h-8 w-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Online Apps</p>
                <p className="text-2xl font-bold text-green-400">
                  {systemStats.onlineApps || 0}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">
                  Total Memory
                </p>
                <p className="text-2xl font-bold text-purple-400">
                  {formatBytes(systemStats.totalMemory || 0)}
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-purple-500" />
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Avg CPU</p>
                <p className="text-2xl font-bold text-yellow-400">
                  {(systemStats.avgCpu || 0).toFixed(1)}%
                </p>
              </div>
              <Activity className="h-8 w-8 text-yellow-500" />
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">DB Apps</p>
                <p className="text-2xl font-bold text-indigo-400">
                  {systemStats.dbApplicationsCount || 0}
                </p>
              </div>
              <Database className="h-8 w-8 text-indigo-500" />
            </div>
          </div>
        </div>

        {/* Applications Grid */}
        {dashboardLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader className="h-12 w-12 animate-spin text-blue-500 mx-auto mb-4" />
              <p className="text-gray-400">Loading applications...</p>
            </div>
          </div>
        ) : dashboardData?.data?.apps?.length > 0 ? (
          <div>
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
              <Server className="h-6 w-6 mr-2" />
              PM2 Applications
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {dashboardData.data.apps.map((app) => (
                <AppCard
                  key={app.name}
                  app={app}
                  onViewLogs={handleViewLogs}
                  onRefresh={refreshDashboard}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <Server className="h-16 w-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-400 mb-2">
              No Applications Found
            </h3>
            <p className="text-gray-500">
              No PM2 applications are currently running
            </p>
          </div>
        )}

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Logs */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Recent Logs ({systemStats.recentLogsCount || 0})
            </h3>
            {dashboardData?.data?.logs?.length > 0 ? (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {dashboardData.data.logs.slice(0, 5).map((log, index) => (
                  <div
                    key={index}
                    className="text-sm border-l-2 border-blue-500 pl-3 py-1"
                  >
                    <div className="text-gray-300">{log.message}</div>
                    <div className="text-xs text-gray-500">
                      {new Date(log.timestamp).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No recent logs available</p>
            )}
          </div>

          {/* Recent Metrics */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              Recent Metrics ({systemStats.recentMetricsCount || 0})
            </h3>
            {dashboardData?.data?.metrics?.length > 0 ? (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {dashboardData.data.metrics.slice(0, 5).map((metric, index) => (
                  <div
                    key={index}
                    className="text-sm border-l-2 border-green-500 pl-3 py-1"
                  >
                    <div className="text-gray-300">
                      {metric.metric_name}: {metric.value} {metric.unit}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(metric.timestamp).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">
                No recent metrics available
              </p>
            )}
          </div>
        </div>

        {/* Last updated */}
        <div className="mt-8 text-center text-sm text-gray-500">
          Last updated: <ClientDate />
        </div>
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
