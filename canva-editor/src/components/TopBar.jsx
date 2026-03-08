import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { RotateCcw, RotateCw, Share2, Download, Play, HelpCircle, Wand2, LogOut, MessageSquarePlus } from "lucide-react";
import useEditorStore from "../store/useEditorStore";
import ImportFromAIModal from "./ImportFromAIModal";
import FileMenu from "./FileMenu";
import { logout } from "../api/auth";
import { useToast } from "./Toast.jsx";
import { VeloxDecksLogo } from "./brand/VeloxDecksLogo";

const ToolBtn = ({ onClick, disabled, title, children }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    title={title}
    className="p-2 rounded-btn hover:bg-velox-card2 disabled:opacity-25 disabled:cursor-not-allowed transition-colors text-velox-text-mid hover:text-velox-text-hi"
  >
    {children}
  </button>
);

export default function TopBar({ onShare, onDownload, onPresent, showAIChat, onToggleAIChat }) {
  const toast = useToast();
  const navigate = useNavigate();
  const title = useEditorStore((s) => s.title);
  const setTitle = useEditorStore((s) => s.setTitle);
  const saveProject = useEditorStore((s) => s.saveProject);
  const undo = useEditorStore((s) => s.undo);
  const redo = useEditorStore((s) => s.redo);
  const history = useEditorStore((s) => s.history);
  const future = useEditorStore((s) => s.future);
  const setShowShortcuts = useEditorStore((s) => s.setShowShortcuts);

  const [editingTitle, setEditingTitle] = useState(false);
  const [localTitle, setLocalTitle] = useState(title);
  const [showImport, setShowImport] = useState(false);
  const autoSaveTimer = useRef(null);

  useEffect(() => { setLocalTitle(title); }, [title]);

  const triggerAutoSave = (name) => {
    clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(async () => {
      try { await saveProject(name); } catch (e) { console.warn("Auto-save failed:", e); }
    }, 1500);
  };

  const handleTitleBlur = () => {
    setEditingTitle(false);
    const val = localTitle.trim() || "Untitled Design";
    setTitle(val);
    setLocalTitle(val);
    triggerAutoSave(val);
  };

  const handleTitleKeyDown = (e) => {
    if (e.key === "Enter") e.target.blur();
    if (e.key === "Escape") { setLocalTitle(title); setEditingTitle(false); }
  };

  return (
    <header className="h-12 flex-shrink-0 flex items-center px-3 gap-2 border-b" style={{ background: "var(--card)", borderColor: "var(--border)" }}>

      {/* Left — logo + file menu + undo/redo */}
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => navigate("/home")}
          className="flex items-center hover:opacity-80 transition-opacity flex-shrink-0 mr-1"
          title="Home"
        >
          <VeloxDecksLogo size="sm" />
        </button>

        <div className="w-px h-5 mx-1" style={{ background: "var(--border)" }} />
        <FileMenu onDownload={onDownload} />
        <div className="w-px h-4 mx-0.5" style={{ background: "var(--border)" }} />

        <ToolBtn onClick={undo} disabled={!history.length} title="Undo (Ctrl+Z)">
          <RotateCcw size={16} strokeWidth={1.5} />
        </ToolBtn>
        <ToolBtn onClick={redo} disabled={!future.length} title="Redo (Ctrl+Shift+Z)">
          <RotateCw size={16} strokeWidth={1.5} />
        </ToolBtn>
      </div>

      {/* Center — editable project title */}
      <div className="flex-1 flex items-center justify-center">
        {editingTitle ? (
          <input
            type="text"
            value={localTitle}
            onChange={(e) => setLocalTitle(e.target.value)}
            onBlur={handleTitleBlur}
            onKeyDown={handleTitleKeyDown}
            autoFocus
            className="text-sm font-medium min-w-36 max-w-72 w-auto text-center rounded-btn px-3 py-1 focus:outline-none focus:ring-2"
            style={{
              background: "var(--card2)",
              border: "1px solid var(--cyan)",
              color: "var(--text-hi)",
              boxShadow: "0 0 0 3px var(--cyan-glow)",
            }}
          />
        ) : (
          <button
            type="button"
            onClick={() => setEditingTitle(true)}
            className="text-sm font-medium min-w-36 max-w-72 px-3 py-1 rounded-btn border border-transparent transition-all truncate"
            style={{ color: "var(--text-mid)" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.background = "var(--card2)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "transparent"; e.currentTarget.style.background = "transparent"; }}
          >
            {title || "Untitled Design"}
          </button>
        )}
      </div>

      {/* Right — actions */}
      <div className="flex items-center gap-1.5">
        {/* AI Chat toggle */}
        <button
          type="button"
          onClick={onToggleAIChat}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-btn transition-all"
          style={showAIChat
            ? { background: "var(--cyan-dim)", color: "var(--cyan)", border: "1px solid rgba(45,212,240,0.4)" }
            : { background: "var(--card2)", color: "var(--text-mid)", border: "1px solid var(--border)" }
          }
        >
          <MessageSquarePlus size={13} strokeWidth={1.5} />
          Velox AI
        </button>

        {/* Import from AI */}
        <button
          type="button"
          onClick={() => setShowImport(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-btn transition-opacity hover:opacity-80"
          style={{ background: "var(--cyan-dim)", color: "var(--cyan)", border: "1px solid rgba(45,212,240,0.25)" }}
        >
          <Wand2 size={13} strokeWidth={1.5} />
          Import
        </button>

        <button
          type="button"
          onClick={() => setShowShortcuts(true)}
          title="Keyboard shortcuts (?)"
          className="p-2 rounded-btn transition-colors"
          style={{ color: "var(--text-lo)" }}
          onMouseEnter={e => e.currentTarget.style.color = "var(--text-mid)"}
          onMouseLeave={e => e.currentTarget.style.color = "var(--text-lo)"}
        >
          <HelpCircle size={16} strokeWidth={1.5} />
        </button>

        {/* Share */}
        <button
          type="button"
          onClick={onShare}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-btn transition-colors"
          style={{ color: "var(--text-mid)", border: "1px solid var(--border)", background: "transparent" }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)"; e.currentTarget.style.color = "var(--text-hi)"; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text-mid)"; }}
        >
          <Share2 size={13} strokeWidth={1.5} />
          Share
        </button>

        {/* Download */}
        <button
          type="button"
          onClick={onDownload}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-btn transition-opacity hover:opacity-85"
          style={{ background: "var(--cyan)", color: "var(--text-inv)" }}
        >
          <Download size={13} strokeWidth={2} />
          Download
        </button>

        {/* Present */}
        <button
          type="button"
          onClick={onPresent}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-btn transition-opacity hover:opacity-85"
          style={{ background: "var(--card2)", color: "var(--text-hi)", border: "1px solid var(--border)" }}
        >
          <Play size={13} fill="currentColor" strokeWidth={0} />
          Present
        </button>

        <button
          type="button"
          onClick={logout}
          title="Log out"
          className="p-2 rounded-btn transition-colors"
          style={{ color: "var(--text-lo)" }}
          onMouseEnter={e => e.currentTarget.style.color = "#ef4444"}
          onMouseLeave={e => e.currentTarget.style.color = "var(--text-lo)"}
        >
          <LogOut size={15} strokeWidth={1.5} />
        </button>
      </div>

      {showImport && <ImportFromAIModal onClose={() => setShowImport(false)} />}
    </header>
  );
}
