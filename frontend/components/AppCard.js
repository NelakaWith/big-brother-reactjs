import React from "react";
import {
  Server,
  Activity,
  Clock,
  MemoryStick,
  Cpu,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  XCircle,
  Loader,
} from "lucide-react";
import {
  formatBytes,
  formatUptime,
  getStatusColor,
  getStatusTextColor,
} from "../lib/api";

const AppCard = ({ app, onViewLogs, onRestart, onStop, isLoading }) => {
  const statusColor = getStatusColor(app.status);
  const statusTextColor = getStatusTextColor(app.status);

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 card-hover">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <Server className="h-5 w-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">{app.name}</h3>
          </div>
          <div className="flex items-center space-x-2">
            <div
              className={`w-3 h-3 rounded-full ${statusColor} animate-pulse-slow`}
            ></div>
            <span
              className={`text-sm font-medium ${statusTextColor} capitalize`}
            >
              {app.status}
            </span>
          </div>
        </div>
        <div className="text-sm text-gray-500">ID: {app.pm_id}</div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="flex items-center space-x-2">
          <Cpu className="h-4 w-4 text-blue-500" />
          <div>
            <p className="text-xs text-gray-500">CPU</p>
            <p className="text-sm font-medium">{app.cpu.toFixed(1)}%</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <MemoryStick className="h-4 w-4 text-green-500" />
          <div>
            <p className="text-xs text-gray-500">Memory</p>
            <p className="text-sm font-medium">{formatBytes(app.memory)}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Clock className="h-4 w-4 text-purple-500" />
          <div>
            <p className="text-xs text-gray-500">Uptime</p>
            <p className="text-sm font-medium">{formatUptime(app.uptime)}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-4 w-4 text-orange-500" />
          <div>
            <p className="text-xs text-gray-500">Restarts</p>
            <p className="text-sm font-medium">{app.restart_time}</p>
          </div>
        </div>
      </div>

      {app.port && (
        <div className="mb-4 p-2 bg-gray-50 rounded">
          <p className="text-xs text-gray-500">Port</p>
          <p className="text-sm font-medium text-blue-600">{app.port}</p>
        </div>
      )}

      <div className="flex space-x-2">
        <button
          onClick={() => onViewLogs(app.name)}
          className="flex-1 bg-blue-500 hover:bg-blue-600 text-white text-sm py-2 px-3 rounded transition-colors duration-200"
        >
          View Logs
        </button>

        {app.status === "online" ? (
          <button
            onClick={() => onRestart(app.name)}
            disabled={isLoading}
            className="bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-300 text-white text-sm py-2 px-3 rounded transition-colors duration-200 flex items-center justify-center"
          >
            {isLoading ? (
              <Loader className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </button>
        ) : (
          <button
            onClick={() => onStop(app.name)}
            disabled={isLoading}
            className="bg-red-500 hover:bg-red-600 disabled:bg-gray-300 text-white text-sm py-2 px-3 rounded transition-colors duration-200 flex items-center justify-center"
          >
            {isLoading ? (
              <Loader className="h-4 w-4 animate-spin" />
            ) : (
              <XCircle className="h-4 w-4" />
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default AppCard;
