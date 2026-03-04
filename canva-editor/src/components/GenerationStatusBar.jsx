import { useEffect, useState, useRef } from "react";
import { Loader2, CheckCircle2, XCircle, X } from "lucide-react";

export default function GenerationStatusBar({
  status,
  slideCount,
  totalSlides,
  title,
  error,
  onDismiss,
}) {
  const [visible, setVisible] = useState(false);
  const autoHideTimerRef = useRef(null);

  useEffect(() => {
    if (status !== "idle") {
      setVisible(true);
      if (autoHideTimerRef.current) {
        clearTimeout(autoHideTimerRef.current);
        autoHideTimerRef.current = null;
      }
    }
    if (status === "complete") {
      autoHideTimerRef.current = setTimeout(() => {
        setVisible(false);
        onDismiss?.();
        autoHideTimerRef.current = null;
      }, 4000);
    }
    return () => {
      if (autoHideTimerRef.current) {
        clearTimeout(autoHideTimerRef.current);
      }
    };
  }, [status, onDismiss]);

  if (!visible || status === "idle") return null;

  const pct =
    totalSlides > 0 ? Math.round((slideCount / totalSlides) * 100) : null;

  const bgColor =
    status === "error"
      ? "bg-red-50 border-red-200"
      : status === "complete"
        ? "bg-green-50 border-green-200"
        : "bg-purple-50 border-purple-200";

  const textColor =
    status === "error"
      ? "text-red-700"
      : status === "complete"
        ? "text-green-700"
        : "text-purple-700";

  return (
    <div
      className={`flex items-center gap-3 px-4 py-2 border-b ${bgColor} ${textColor} transition-all`}
    >
      {/* Icon */}
      <div className="flex-shrink-0">
        {status === "complete" && (
          <CheckCircle2 className="w-4 h-4 text-green-500" />
        )}
        {status === "error" && (
          <XCircle className="w-4 h-4 text-red-500" />
        )}
        {(status === "connecting" || status === "streaming") && (
          <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
        )}
      </div>

      {/* Main message */}
      <div className="flex-1 min-w-0">
        {status === "connecting" && (
          <span className="text-xs font-medium">
            Connecting to AI pipeline...
          </span>
        )}
        {status === "streaming" && (
          <span className="text-xs font-medium">
            Generating
            {title ? ` "${title}"` : " presentation"}
            {" "}— {slideCount}
            {totalSlides > 0 ? ` of ${totalSlides}` : ""} slides
          </span>
        )}
        {status === "complete" && (
          <span className="text-xs font-medium">
            ✓ {slideCount} slides generated
            {title ? ` for "${title}"` : ""} — ready to edit
          </span>
        )}
        {status === "error" && (
          <span className="text-xs font-medium">
            {error || "Pipeline error — check bridge connection"}
          </span>
        )}
      </div>

      {/* Progress bar */}
      {status === "streaming" && pct !== null && (
        <div className="w-32 flex-shrink-0">
          <div className="h-1.5 bg-purple-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-purple-600 rounded-full transition-all duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="text-[9px] text-purple-500 mt-0.5 text-right">
            {pct}%
          </p>
        </div>
      )}

      {/* Slide count dots (streaming) */}
      {status === "streaming" && pct === null && (
        <div className="flex gap-1 flex-shrink-0">
          {Array.from({ length: Math.min(slideCount, 12) }, (_, i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-purple-400 animate-fadeIn"
            />
          ))}
          {slideCount > 12 && (
            <span className="text-[10px] text-purple-400">
              +{slideCount - 12}
            </span>
          )}
        </div>
      )}

      {/* Dismiss button */}
      <button
        onClick={() => {
          setVisible(false);
          onDismiss?.();
        }}
        className="flex-shrink-0 text-current opacity-40 hover:opacity-70 transition-opacity ml-1"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
