import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import useEditorStore from "../store/useEditorStore";
import { pageToDataURL } from "../utils/exportCanvas";

export default function PresentMode() {
  const pages = useEditorStore((s) => s.pages);
  const canvasSize = useEditorStore((s) => s.canvasSize);
  const setPresentMode = useEditorStore((s) => s.setPresentMode);
  const presentPageIndex = useEditorStore((s) => s.presentPageIndex);
  const setPresentPageIndex = useEditorStore((s) => s.setPresentPageIndex);

  const [previewSrc, setPreviewSrc] = useState(null);
  const [loading, setLoading] = useState(true);

  const totalPages = pages.length;

  useEffect(() => {
    const page = pages[presentPageIndex] || pages[0];
    if (!page) return;
    setLoading(true);
    pageToDataURL(page, canvasSize, 2, "image/png").then((dataURL) => {
      setPreviewSrc(dataURL);
      setLoading(false);
    });
  }, [presentPageIndex, pages, canvasSize]);

  const handlePrev = () => {
    if (presentPageIndex > 0) setPresentPageIndex(presentPageIndex - 1);
  };

  const handleNext = () => {
    if (presentPageIndex < totalPages - 1) setPresentPageIndex(presentPageIndex + 1);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setPresentMode(false);
      else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        if (presentPageIndex > 0) setPresentPageIndex(presentPageIndex - 1);
      } else if (e.key === "ArrowRight" || e.key === "ArrowDown" || e.key === " ") {
        e.preventDefault();
        if (presentPageIndex < totalPages - 1) setPresentPageIndex(presentPageIndex + 1);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [presentPageIndex, totalPages, setPresentMode, setPresentPageIndex]);

  return (
    <div className="fixed inset-0 bg-black z-[9999] flex flex-col">
      {/* Canvas area — leaves 52px for the nav bar */}
      <div className="flex items-center justify-center" style={{ height: 'calc(100vh - 52px)' }}>
        {loading ? (
          <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin" />
        ) : previewSrc ? (
          <img
            src={previewSrc}
            alt="Presentation"
            className="object-contain"
            style={{
              maxWidth: '100vw',
              maxHeight: 'calc(100vh - 52px)',
              boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
            }}
          />
        ) : null}
      </div>

      {/* Navigation bar */}
      <div className="h-[52px] bg-black/80 backdrop-blur flex items-center justify-center gap-6">
        <button
          type="button"
          onClick={handlePrev}
          disabled={presentPageIndex <= 0}
          className="flex items-center gap-2 text-white hover:bg-white/10 rounded-lg px-4 py-2 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft size={24} />
          Prev
        </button>
        <span className="text-white font-medium">
          {presentPageIndex + 1} / {totalPages}
        </span>
        <button
          type="button"
          onClick={handleNext}
          disabled={presentPageIndex >= totalPages - 1}
          className="flex items-center gap-2 text-white hover:bg-white/10 rounded-lg px-4 py-2 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          Next
          <ChevronRight size={24} />
        </button>
        <div className="w-px h-8 bg-white/30" />
        <button
          type="button"
          onClick={() => setPresentMode(false)}
          className="flex items-center gap-2 text-red-400 hover:bg-red-500/20 rounded-lg px-4 py-2 transition-colors"
        >
          <X size={24} />
          Exit
        </button>
      </div>
    </div>
  );
}
