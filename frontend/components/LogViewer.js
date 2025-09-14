import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Download,
  Search,
  Terminal,
  FileText,
  AlertCircle,
  Activity,
  Loader,
  RefreshCw,
  ChevronUp,
  ChevronDown,
  Settings,
} from "lucide-react";
import { createLogStream, api } from "../lib/api";
import ClientDate from "./ClientDate";

const LogViewer = ({ appName, onClose, logType = "live" }) => {
  const [logs, setLogs] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentLogType, setCurrentLogType] = useState(logType);
  const [totalLines, setTotalLines] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [logLimit, setLogLimit] = useState(500);
  const [showSettings, setShowSettings] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const logContainerRef = useRef(null);
  const eventSourceRef = useRef(null);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    if (logContainerRef.current && autoScroll) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  };

  // Load more historical logs
  const loadMoreLogs = async () => {
    if (loadingMore || !hasMore) return;

    setLoadingMore(true);
    try {
      const response = await api.getHistoricalLogs(
        appName,
        logLimit,
        logs.length
      );
      if (response.success) {
        const newLogs = response.logs.map((log, index) => ({
          ...log,
          id: log.id || Date.now() + index,
        }));

        // Prepend new logs to the beginning
        setLogs((prev) => [...newLogs, ...prev]);
        setHasMore(response.hasMore);
        setTotalLines(response.totalLines);
      }
    } catch (err) {
      setError("Failed to load more logs: " + err.message);
    } finally {
      setLoadingMore(false);
    }
  };

  // Load frontend logs
  const loadFrontendLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.getFrontendLogs(appName, logLimit, 0);

      if (response.success) {
        const formattedLogs = response.logs.map((line, index) => ({
          id: index,
          type: "log",
          level: "info",
          message: line,
          timestamp: new Date().toISOString(),
        }));
        setLogs(formattedLogs);
        setTotalLines(response.totalLines);
        setHasMore(response.hasMore);
      } else {
        setError("Failed to load frontend logs");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Load historical PM2 logs
  const loadHistoricalLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.getHistoricalLogs(appName, logLimit, 0);

      if (response.success) {
        setLogs(response.logs);
        setTotalLines(response.totalLines);
        setHasMore(response.hasMore);
      } else {
        setError("Failed to load historical logs");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Connect to live logs
  const connectToLiveLog = () => {
    try {
      setLoading(true);
      setError(null);
      setLogs([]);

      // Clean up existing connection
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      const eventSource = createLogStream(
        appName,
        (data) => {
          setLogs((prev) => [
            ...prev,
            { ...data, id: Date.now() + Math.random() },
          ]);
          setTimeout(scrollToBottom, 100);
        },
        (error) => {
          setError("Connection error: " + (error.message || "Unknown error"));
          setIsConnected(false);
        },
        () => {
          setIsConnected(true);
          setLoading(false);
        }
      );

      eventSourceRef.current = eventSource;
    } catch (err) {
      setError("Failed to connect to live logs: " + err.message);
      setLoading(false);
    }
  };

  // Switch log type
  const switchLogType = (type) => {
    setCurrentLogType(type);
    setLogs([]);
    setHasMore(false);
    setTotalLines(0);

    if (type === "live") {
      connectToLiveLog();
    } else if (type === "historical") {
      // Close live connection
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      setIsConnected(false);
      loadHistoricalLogs();
    } else {
      // Close live connection
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      setIsConnected(false);
      loadFrontendLogs();
    }
  };

  // Initialize
  useEffect(() => {
    if (currentLogType === "live") {
      connectToLiveLog();
    } else if (currentLogType === "historical") {
      loadHistoricalLogs();
    } else {
      loadFrontendLogs();
    }

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [appName, logLimit]);

  // Filter logs based on search term
  const filteredLogs = logs.filter(
    (log) =>
      log.message &&
      log.message.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get log level color
  const getLogLevelColor = (level) => {
    switch (level) {
      case "error":
        return "text-red-600";
      case "warn":
        return "text-yellow-600";
      case "info":
        return "text-blue-600";
      case "debug":
        return "text-gray-600";
      default:
        return "text-gray-800";
    }
  };

  // Helper function to format date consistently
  const formatDateForDownload = (timestamp) => {
    const date = new Date(timestamp);
    return date.toISOString().replace("T", " ").substring(0, 19);
  };

  // Download logs
  const downloadLogs = () => {
    const logText = filteredLogs
      .map(
        (log) =>
          `[${formatDateForDownload(log.timestamp)}] ${
            log.level?.toUpperCase() || "INFO"
          }: ${log.message}`
      )
      .join("\n");

    const blob = new Blob([logText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${appName}-${currentLogType}-logs-${
      new Date().toISOString().split("T")[0]
    }.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-5/6 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center space-x-3">
            <Terminal className="h-5 w-5 text-gray-600" />
            <h2 className="text-xl font-semibold text-gray-900">
              {appName} -{" "}
              {currentLogType === "live"
                ? "Live"
                : currentLogType === "historical"
                ? "Historical"
                : "Frontend"}{" "}
              Logs
            </h2>
            {currentLogType === "live" && (
              <div className="flex items-center space-x-2">
                <div
                  className={`w-2 h-2 rounded-full ${
                    isConnected ? "bg-green-500 animate-pulse" : "bg-red-500"
                  }`}
                ></div>
                <span className="text-sm text-gray-500">
                  {isConnected ? "Connected" : "Disconnected"}
                </span>
              </div>
            )}
            {(currentLogType === "historical" ||
              currentLogType === "frontend") && (
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <span>
                  {logs.length} of {totalLines} lines
                </span>
                {hasMore && (
                  <span className="text-blue-500">• More available</span>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {/* Log type switcher */}
            <div className="flex bg-gray-100 rounded-md p-1">
              <button
                onClick={() => switchLogType("live")}
                className={`px-3 py-1 text-sm rounded ${
                  currentLogType === "live"
                    ? "bg-blue-500 text-white"
                    : "text-gray-700 hover:bg-gray-200"
                } transition-colors duration-200`}
              >
                <Activity className="h-4 w-4 inline mr-1" />
                Live
              </button>
              <button
                onClick={() => switchLogType("historical")}
                className={`px-3 py-1 text-sm rounded ${
                  currentLogType === "historical"
                    ? "bg-blue-500 text-white"
                    : "text-gray-700 hover:bg-gray-200"
                } transition-colors duration-200`}
              >
                <Terminal className="h-4 w-4 inline mr-1" />
                Historical
              </button>
              <button
                onClick={() => switchLogType("frontend")}
                className={`px-3 py-1 text-sm rounded ${
                  currentLogType === "frontend"
                    ? "bg-blue-500 text-white"
                    : "text-gray-700 hover:bg-gray-200"
                } transition-colors duration-200`}
              >
                <FileText className="h-4 w-4 inline mr-1" />
                Frontend
              </button>
            </div>

            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded"
              title="Settings"
            >
              <Settings className="h-4 w-4" />
            </button>
            <button
              onClick={downloadLogs}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded"
              title="Download logs"
            >
              <Download className="h-4 w-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Settings panel */}
        {showSettings && (
          <div className="p-4 border-b bg-gray-50">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Lines to load
                </label>
                <select
                  value={logLimit}
                  onChange={(e) => setLogLimit(parseInt(e.target.value))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                >
                  <option value={100}>100 lines</option>
                  <option value={250}>250 lines</option>
                  <option value={500}>500 lines</option>
                  <option value={1000}>1000 lines</option>
                  <option value={2000}>2000 lines</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Auto-scroll
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={autoScroll}
                    onChange={(e) => setAutoScroll(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Auto-scroll to bottom
                  </span>
                </label>
              </div>
              <div className="flex items-end">
                <button
                  onClick={() => {
                    if (currentLogType === "historical") {
                      loadHistoricalLogs();
                    } else if (currentLogType === "frontend") {
                      loadFrontendLogs();
                    }
                  }}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors duration-200 text-sm"
                >
                  <RefreshCw className="h-4 w-4 inline mr-1" />
                  Apply & Refresh
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Search bar */}
        <div className="p-4 border-b">
          <div className="flex items-center space-x-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            {(currentLogType === "historical" ||
              currentLogType === "frontend") &&
              hasMore && (
                <button
                  onClick={loadMoreLogs}
                  disabled={loadingMore}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors duration-200 disabled:opacity-50 text-sm"
                >
                  {loadingMore ? (
                    <>
                      <Loader className="h-4 w-4 inline mr-1 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <ChevronUp className="h-4 w-4 inline mr-1" />
                      Load More
                    </>
                  )}
                </button>
              )}
          </div>
          <div className="mt-2 text-sm text-gray-500">
            Showing {filteredLogs.length} of {logs.length} log entries
            {totalLines > logs.length && (
              <span className="text-blue-500">
                {" "}
                • {totalLines - logs.length} more in file
              </span>
            )}
          </div>
        </div>

        {/* Log content */}
        <div className="flex-1 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="flex items-center space-x-2">
                <Loader className="h-5 w-5 animate-spin text-blue-500" />
                <span className="text-gray-600">Loading logs...</span>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full">
              <div className="flex items-center space-x-2 text-red-600">
                <AlertCircle className="h-5 w-5" />
                <span>{error}</span>
              </div>
            </div>
          ) : (
            <div
              ref={logContainerRef}
              className="h-full overflow-y-auto p-4 bg-gray-50 log-viewer relative"
            >
              {filteredLogs.length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-500">
                  No logs available
                </div>
              ) : (
                <>
                  <div className="space-y-1">
                    {filteredLogs.map((log) => (
                      <div
                        key={log.id}
                        className="flex items-start space-x-2 text-sm hover:bg-white p-2 rounded border-l-2 border-transparent hover:border-blue-300 transition-colors duration-150"
                      >
                        <span className="text-gray-500 font-mono text-xs whitespace-nowrap min-w-[80px]">
                          <ClientDate date={log.timestamp} format="time" />
                        </span>
                        <span
                          className={`font-semibold uppercase text-xs min-w-[50px] ${getLogLevelColor(
                            log.level
                          )} whitespace-nowrap`}
                        >
                          {log.level || "info"}
                        </span>
                        <span className="flex-1 font-mono text-xs break-all">
                          {log.message}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Scroll controls */}
                  <div className="fixed bottom-6 right-6 flex flex-col space-y-2">
                    <button
                      onClick={() => {
                        if (logContainerRef.current) {
                          logContainerRef.current.scrollTop = 0;
                        }
                      }}
                      className="p-2 bg-white border border-gray-300 rounded-full shadow-lg hover:bg-gray-50 transition-colors duration-200"
                      title="Scroll to top"
                    >
                      <ChevronUp className="h-4 w-4 text-gray-600" />
                    </button>
                    <button
                      onClick={scrollToBottom}
                      className="p-2 bg-white border border-gray-300 rounded-full shadow-lg hover:bg-gray-50 transition-colors duration-200"
                      title="Scroll to bottom"
                    >
                      <ChevronDown className="h-4 w-4 text-gray-600" />
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LogViewer;
