import { useState, useEffect } from "react";
import { X, Loader2 } from "lucide-react";
import useEditorStore from "../store/useEditorStore";
import { useToast } from "./Toast.jsx";
import { exportPNG, exportJPG, exportPDF, exportPPTX } from "../utils/exportCanvas";

const QUALITY_OPTIONS = [
  { value: "standard", label: "Standard (72dpi)", scale: 1 },
  { value: "high", label: "High (150dpi)", scale: 2 },
  { value: "print", label: "Print (300dpi)", scale: 4 },
];

export default function DownloadModal({ onClose }) {
  const pages = useEditorStore((s) => s.pages);
  const currentPageId = useEditorStore((s) => s.currentPageId);
  const canvasSize = useEditorStore((s) => s.canvasSize);
  const title = useEditorStore((s) => s.title) || "design";

  const [fileType, setFileType] = useState("png");
  const [quality, setQuality] = useState("standard");
  const [allPages, setAllPages] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const scale = QUALITY_OPTIONS.find((q) => q.value === quality)?.scale ?? 1;

  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleDownload = async () => {
    setLoading(true);
    setDone(false);
    try {
      if (fileType === "png") {
        await exportPNG(pages, currentPageId, canvasSize, scale, title);
      } else if (fileType === "jpg") {
        await exportJPG(pages, currentPageId, canvasSize, scale, title);
      } else if (fileType === "pdf") {
        await exportPDF(pages, currentPageId, canvasSize, allPages, title);
      } else if (fileType === "pptx") {
        const targetPages = allPages ? pages : [pages.find((p) => p.id === currentPageId)].filter(Boolean);
        await exportPPTX(targetPages, canvasSize, title);
      }
      setDone(true);
      toast("Download complete!", "success");
      setTimeout(() => {
        setDone(false);
        onClose();
      }, 1500);
    } catch (e) {
      console.error(e);
      toast("Download failed", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-white rounded-2xl shadow-2xl p-6 w-96"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Download</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded hover:bg-gray-100"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* File type */}
        <div className="mb-4">
          <p className="text-xs font-medium text-gray-500 mb-2">File type</p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: "png", label: "PNG", sub: "Best for images with transparency" },
              { id: "jpg", label: "JPG", sub: "Smaller file size" },
              { id: "pdf", label: "PDF", sub: "Best for printing (multi-page)" },
              { id: "pptx", label: "PowerPoint", sub: "Editable charts", badge: "Charts stay editable" },
              { id: "svg", label: "SVG", sub: "Coming soon", disabled: true },
            ].map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => !opt.disabled && setFileType(opt.id)}
                disabled={opt.disabled}
                className={`p-3 rounded-lg border-2 text-left transition-colors ${
                  fileType === opt.id && !opt.disabled
                    ? "border-purple-500 bg-purple-50"
                    : "border-gray-200 hover:border-gray-300"
                } ${opt.disabled ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <span className="font-medium text-sm">{opt.label}</span>
                <p className="text-xs text-gray-500 mt-0.5">{opt.sub}</p>
                {opt.badge && (
                  <span className="inline-block mt-1 text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">
                    ⭐ {opt.badge}
                  </span>
                )}
                {opt.disabled && (
                  <span className="inline-block mt-1 text-[10px] bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded">
                    Coming soon
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Quality (PNG/JPG only) */}
        {(fileType === "png" || fileType === "jpg") && (
          <div className="mb-4">
            <p className="text-xs font-medium text-gray-500 mb-2">Quality</p>
            <div className="flex gap-2">
              {QUALITY_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <input
                    type="radio"
                    name="quality"
                    value={opt.value}
                    checked={quality === opt.value}
                    onChange={() => setQuality(opt.value)}
                    className="accent-purple-600"
                  />
                  <span className="text-sm">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Pages (multi-page for PDF and PPTX) */}
        {pages.length > 1 && (fileType === "pdf" || fileType === "pptx") && (
          <div className="mb-4">
            <p className="text-xs font-medium text-gray-500 mb-2">Pages</p>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="pages"
                  checked={!allPages}
                  onChange={() => setAllPages(false)}
                  className="accent-purple-600"
                />
                <span className="text-sm">Current page only</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="pages"
                  checked={allPages}
                  onChange={() => setAllPages(true)}
                  className="accent-purple-600"
                />
                <span className="text-sm">All pages</span>
              </label>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={handleDownload}
          disabled={loading || fileType === "svg"}
          className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white rounded-lg py-2.5 font-medium flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Generating...
            </>
          ) : done ? (
            "Done! Downloading..."
          ) : (
            "Download"
          )}
        </button>
      </div>
    </div>
  );
}
