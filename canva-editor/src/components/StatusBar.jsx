import useEditorStore from "../store/useEditorStore";

function formatRelativeTime(ts) {
  if (!ts) return "";
  const sec = Math.floor((Date.now() - ts) / 1000);
  if (sec < 60) return "just now";
  if (sec < 3600) return `${Math.floor(sec / 60)} min ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)} hr ago`;
  return `${Math.floor(sec / 86400)} days ago`;
}

export default function StatusBar() {
  const pages = useEditorStore((s) => s.pages);
  const currentPageId = useEditorStore((s) => s.currentPageId);
  const selectedIds = useEditorStore((s) => s.selectedIds);
  const canvasSize = useEditorStore((s) => s.canvasSize);
  const zoom = useEditorStore((s) => s.zoom);
  const lastSaved = useEditorStore((s) => s.lastSaved);
  const zoomIn = useEditorStore((s) => s.zoomIn);
  const zoomOut = useEditorStore((s) => s.zoomOut);

  const page = pages.find((p) => p.id === currentPageId);
  const elementCount = page?.elements?.length ?? 0;

  return (
    <div className="h-6 flex-shrink-0 bg-gray-100 border-t border-gray-200 flex items-center px-4 gap-4 text-[11px] text-gray-400">
      <div className="flex items-center gap-4">
        <span>{elementCount} objects</span>
        {selectedIds.length > 0 && <span>{selectedIds.length} selected</span>}
      </div>
      <div className="flex-1 text-center">
        Canvas: {canvasSize.width} × {canvasSize.height}px
      </div>
      <div className="flex items-center gap-2">
        <span>Zoom: {Math.round(zoom * 100)}%</span>
        <button
          type="button"
          onClick={zoomOut}
          className="w-5 h-5 flex items-center justify-center rounded hover:bg-gray-200 text-gray-600"
        >
          −
        </button>
        <button
          type="button"
          onClick={zoomIn}
          className="w-5 h-5 flex items-center justify-center rounded hover:bg-gray-200 text-gray-600"
        >
          +
        </button>
      </div>
      {lastSaved && (
        <span className="text-gray-400">Saved {formatRelativeTime(lastSaved)}</span>
      )}
    </div>
  );
}
