import { useState } from "react";
import { X, Download, Check } from "lucide-react";
import useEditorStore from "../store/useEditorStore";
import { useToast } from "./Toast.jsx";
import { exportPNG, exportJPG, exportPDF } from "../utils/exportCanvas";

export default function ShareModal({ onClose }) {
  const shareId = useEditorStore((s) => s.shareId);
  const pages = useEditorStore((s) => s.pages);
  const currentPageId = useEditorStore((s) => s.currentPageId);
  const canvasSize = useEditorStore((s) => s.canvasSize);
  const title = useEditorStore((s) => s.title) || "design";
  const toast = useToast();

  const [copied, setCopied] = useState(false);
  const [embedExpanded, setEmbedExpanded] = useState(false);
  const [embedCopied, setEmbedCopied] = useState(false);
  const [exporting, setExporting] = useState(null);

  const url = `https://canvaclone.app/view/${shareId}`;
  const embedCode = `<iframe src="https://canvaclone.app/embed/${shareId}" width="${canvasSize.width}" height="${canvasSize.height}" frameborder="0"></iframe>`;

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    toast("Link copied!", "success");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyEmbed = async () => {
    await navigator.clipboard.writeText(embedCode);
    setEmbedCopied(true);
    toast("Embed code copied!", "success");
    setTimeout(() => setEmbedCopied(false), 2000);
  };

  const handleExport = async (type) => {
    setExporting(type);
    try {
      if (type === "png") await exportPNG(pages, currentPageId, canvasSize, 1, title);
      else if (type === "jpg") await exportJPG(pages, currentPageId, canvasSize, 1, title);
      else if (type === "pdf") await exportPDF(pages, currentPageId, canvasSize, false, title);
      toast("Export complete!", "success");
    } catch (e) {
      console.error(e);
      toast("Export failed", "error");
    } finally {
      setExporting(null);
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
        className="bg-white rounded-2xl shadow-2xl p-6 w-[480px] max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Share your design</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded hover:bg-gray-100"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Copy Link */}
        <div className="mb-6">
          <p className="text-xs font-medium text-gray-500 mb-2">Copy Link</p>
          <div className="flex gap-2">
            <input
              type="text"
              readOnly
              value={url}
              className="flex-1 bg-gray-100 border border-gray-200 rounded-lg px-3 py-2 text-sm"
            />
            <button
              type="button"
              onClick={handleCopyLink}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium flex items-center gap-2 whitespace-nowrap"
            >
              {copied ? (
                <>
                  <Check size={16} />
                  Copied!
                </>
              ) : (
                "Copy Link"
              )}
            </button>
          </div>
        </div>

        {/* Export quick actions */}
        <div className="mb-6">
          <p className="text-xs font-medium text-gray-500 mb-2">Export</p>
          <div className="grid grid-cols-3 gap-3">
            {[
              { id: "png", label: "PNG Image", sub: "Best for web" },
              { id: "jpg", label: "JPG Image", sub: "Smaller size" },
              { id: "pdf", label: "PDF", sub: "Best for print" },
            ].map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => handleExport(opt.id)}
                disabled={exporting !== null}
                className="p-4 rounded-xl border-2 border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-colors flex flex-col items-center gap-2 disabled:opacity-50"
              >
                {exporting === opt.id ? (
                  <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Download size={24} className="text-gray-600" />
                )}
                <span className="font-medium text-sm">{opt.label}</span>
                <span className="text-xs text-gray-500">{opt.sub}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Embed */}
        <div>
          <button
            type="button"
            onClick={() => setEmbedExpanded(!embedExpanded)}
            className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-purple-600"
          >
            <span>{embedExpanded ? "▼" : "▶"}</span>
            Embed
          </button>
          {embedExpanded && (
            <div className="mt-3 p-3 bg-gray-50 rounded-lg">
              <textarea
                readOnly
                value={embedCode}
                rows={3}
                className="w-full text-xs font-mono bg-white border border-gray-200 rounded p-2 resize-none"
              />
              <button
                type="button"
                onClick={handleCopyEmbed}
                className="mt-2 px-3 py-1.5 bg-gray-200 hover:bg-gray-300 rounded text-sm flex items-center gap-2"
              >
                {embedCopied ? (
                  <>
                    <Check size={14} />
                    Copied!
                  </>
                ) : (
                  "Copy Code"
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
