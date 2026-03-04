import { useState, useEffect } from "react";
import {
  Wifi,
  WifiOff,
  Loader2,
  CheckCircle2,
  XCircle,
  Radio,
} from "lucide-react";
import { usePipelineStream } from "../hooks/usePipelineStream";

export default function StreamingImportPanel() {
  const [autoConnect, setAutoConnect] = useState(false);
  const {
    status,
    slideCount,
    error,
    connect,
    disconnect,
  } = usePipelineStream();

  useEffect(() => {
    if (autoConnect && status === "idle") {
      connect();
    }
  }, [autoConnect, status, connect]);

  const statusConfig = {
    idle: {
      icon: <Radio className="w-5 h-5 text-gray-400" />,
      label: "Not connected",
      color: "text-gray-500",
    },
    connecting: {
      icon: (
        <Loader2 className="w-5 h-5 text-purple-500 animate-spin" />
      ),
      label: "Connecting to pipeline...",
      color: "text-purple-600",
    },
    streaming: {
      icon: (
        <Loader2 className="w-5 h-5 text-green-500 animate-spin" />
      ),
      label: `Receiving slides... (${slideCount} so far)`,
      color: "text-green-600",
    },
    complete: {
      icon: <CheckCircle2 className="w-5 h-5 text-green-500" />,
      label: `Done — ${slideCount} slides imported`,
      color: "text-green-600",
    },
    error: {
      icon: <XCircle className="w-5 h-5 text-red-500" />,
      label: "Connection failed",
      color: "text-red-600",
    },
  };

  const cfg = statusConfig[status];

  return (
    <div className="flex flex-col gap-3 p-1">
      <div>
        <p className="text-xs font-semibold text-gray-700 mb-1">
          Live Pipeline Stream
        </p>
        <p className="text-[11px] text-gray-400 leading-relaxed">
          Start your doc-to-deck pipeline and slides will appear here in real
          time as they generate. Requires the pipeline WebSocket bridge on port
          3002.
        </p>
      </div>

      <label className="flex items-center gap-2 text-xs text-gray-500 cursor-pointer">
        <input
          type="checkbox"
          checked={autoConnect}
          onChange={(e) => setAutoConnect(e.target.checked)}
          className="accent-purple-600"
        />
        Auto-connect when panel opens
      </label>

      {/* Status indicator */}
      <div
        className={`flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-50 ${cfg.color}`}
      >
        {cfg.icon}
        <span className="text-xs font-medium">{cfg.label}</span>
      </div>

      {/* Slide count progress */}
      {status === "streaming" && (
        <div className="flex gap-1.5 flex-wrap">
          {Array.from({ length: slideCount }, (_, i) => (
            <div
              key={i}
              className="w-6 h-6 rounded-md bg-purple-100 flex items-center justify-center text-[9px] font-bold text-purple-600 animate-fadeIn"
            >
              {i + 1}
            </div>
          ))}
        </div>
      )}

      {/* Error detail */}
      {status === "error" && error && (
        <pre className="text-[10px] text-red-500 bg-red-50 rounded-xl p-3 whitespace-pre-wrap">
          {error}
        </pre>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        {(status === "idle" || status === "error" || status === "complete") && (
          <button
            onClick={connect}
            className="flex-1 py-2 bg-purple-600 text-white text-xs rounded-xl font-medium hover:bg-purple-700 flex items-center justify-center gap-1.5"
          >
            <Wifi className="w-3.5 h-3.5" />
            {status === "complete" ? "Connect Again" : "Connect"}
          </button>
        )}
        {status === "streaming" && (
          <button
            onClick={disconnect}
            className="flex-1 py-2 border border-gray-200 text-gray-600 text-xs rounded-xl hover:bg-gray-50 flex items-center justify-center gap-1.5"
          >
            <WifiOff className="w-3.5 h-3.5" />
            Disconnect
          </button>
        )}
      </div>

      <p className="text-[10px] text-gray-400 leading-relaxed">
        Pipeline bridge setup: run
        <code className="bg-gray-100 px-1 rounded mx-1">
          node pipeline-bridge.js
        </code>
        in your pipeline project before connecting.
      </p>
    </div>
  );
}
