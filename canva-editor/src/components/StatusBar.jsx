import { useState } from "react";
import { MessageSquare, Send, X, CheckCircle } from "lucide-react";
import useEditorStore from "../store/useEditorStore";
import useFeedback from "../store/useFeedback";

function formatRelativeTime(ts) {
  if (!ts) return "";
  const sec = Math.floor((Date.now() - ts) / 1000);
  if (sec < 60) return "just now";
  if (sec < 3600) return `${Math.floor(sec / 60)} min ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)} hr ago`;
  return `${Math.floor(sec / 86400)} days ago`;
}

function InlineFeedback() {
  const [state, setState] = useState("idle"); // idle | open | submitted
  const [text, setText] = useState("");
  const [category, setCategory] = useState(null);
  const activeSurvey = useFeedback((s) => s.activeSurvey);
  const submitButtonFeedback = useFeedback((s) => s.submitButtonFeedback);
  const currentPageId = useEditorStore((s) => s.currentPageId);

  if (activeSurvey) return null;

  const handleSubmit = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    submitButtonFeedback(
      category ? `[${category}] ${trimmed}` : trimmed,
      { pageContext: "editor", deckId: currentPageId ?? null }
    );
    setState("submitted");
    setTimeout(() => { setState("idle"); setText(""); setCategory(null); }, 2000);
  };

  if (state === "submitted") {
    return (
      <div className="flex items-center gap-1 text-green-600">
        <CheckCircle size={12} />
        <span>Thanks!</span>
      </div>
    );
  }

  if (state === "open") {
    return (
      <div className="fixed bottom-8 right-4 z-[9970] w-72 bg-white border border-gray-200 rounded-xl shadow-2xl p-3"
           style={{ animation: "slideUpFade 0.15s ease-out" }}>
        <style>{`@keyframes slideUpFade { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }`}</style>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-gray-800">Share feedback</span>
          <button type="button" onClick={() => { setState("idle"); setText(""); setCategory(null); }}
            className="text-gray-400 hover:text-gray-600"><X size={14} /></button>
        </div>
        <div className="flex gap-1.5 mb-2">
          {["Bug", "Idea", "Other"].map((cat) => (
            <button key={cat} type="button" onClick={() => setCategory(category === cat ? null : cat)}
              className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full border transition-all ${
                category === cat
                  ? "bg-blue-600 border-blue-600 text-white"
                  : "bg-white border-gray-200 text-gray-600 hover:border-blue-400"
              }`}>{cat}</button>
          ))}
        </div>
        <textarea autoFocus rows={3} placeholder="What's on your mind?"
          value={text} onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSubmit(); }}
          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:border-blue-400 text-gray-800 placeholder-gray-400" />
        <div className="flex items-center justify-between mt-2">
          <span className="text-[10px] text-gray-400">⌘↵ to send</span>
          <button type="button" onClick={handleSubmit} disabled={!text.trim()}
            className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 transition-opacity">
            <Send size={11} />Send
          </button>
        </div>
      </div>
    );
  }

  return (
    <button type="button" onClick={() => setState("open")}
      className="flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-md border border-gray-300 bg-white text-gray-600 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all">
      <MessageSquare size={11} />
      Feedback
    </button>
  );
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
        <button type="button" onClick={zoomOut}
          className="w-5 h-5 flex items-center justify-center rounded hover:bg-gray-200 text-gray-600">−</button>
        <button type="button" onClick={zoomIn}
          className="w-5 h-5 flex items-center justify-center rounded hover:bg-gray-200 text-gray-600">+</button>
      </div>
      {lastSaved && <span className="text-gray-400">Saved {formatRelativeTime(lastSaved)}</span>}
      <div className="w-px h-3 bg-gray-300" />
      <InlineFeedback />
    </div>
  );
}
