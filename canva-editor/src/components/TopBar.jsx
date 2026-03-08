import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { RotateCcw, RotateCw, Share2, Download, Play, HelpCircle, Wand2, LogOut, MessageSquarePlus, Sparkles } from "lucide-react";
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
    className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-25 disabled:cursor-not-allowed transition-colors text-gray-500 hover:text-gray-800"
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
    <header className="h-12 flex-shrink-0 flex items-center px-3 gap-2 border-b border-gray-200 bg-white">

      {/* Left — logo + file menu + undo/redo */}
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => navigate("/home")}
          className="flex items-center hover:opacity-80 transition-opacity flex-shrink-0 mr-1"
          title="Home"
        >
          <VeloxDecksLogo size="sm" theme="light" />
        </button>

        <div className="w-px h-5 mx-1 bg-gray-200" />
        <FileMenu onDownload={onDownload} />
        <div className="w-px h-4 mx-0.5 bg-gray-200" />

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
            className="text-sm font-medium min-w-36 max-w-72 w-auto text-center rounded-lg px-3 py-1 focus:outline-none border border-blue-400 ring-2 ring-blue-100 text-gray-900 bg-white"
          />
        ) : (
          <button
            type="button"
            onClick={() => setEditingTitle(true)}
            className="text-sm font-medium min-w-36 max-w-72 px-3 py-1 rounded-lg border border-transparent text-gray-700 hover:border-gray-200 hover:bg-gray-50 transition-all truncate"
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
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
            showAIChat
              ? "bg-blue-50 text-blue-600 border-blue-300"
              : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:text-gray-800"
          }`}
        >
          <Sparkles size={13} strokeWidth={1.5} />
          AI Assistant
        </button>

        {/* Import from AI */}
        <button
          type="button"
          onClick={() => setShowImport(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
        >
          <Wand2 size={13} strokeWidth={1.5} />
          Import
        </button>

        <button
          type="button"
          onClick={() => setShowShortcuts(true)}
          title="Keyboard shortcuts (?)"
          className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
        >
          <HelpCircle size={16} strokeWidth={1.5} />
        </button>

        {/* Share */}
        <button
          type="button"
          onClick={onShare}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-800 hover:border-gray-300 transition-colors"
        >
          <Share2 size={13} strokeWidth={1.5} />
          Share
        </button>

        {/* Download */}
        <button
          type="button"
          onClick={onDownload}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
        >
          <Download size={13} strokeWidth={2} />
          Download
        </button>

        {/* Present */}
        <button
          type="button"
          onClick={onPresent}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <Play size={13} fill="currentColor" strokeWidth={0} />
          Present
        </button>

        <button
          type="button"
          onClick={logout}
          title="Log out"
          className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
        >
          <LogOut size={15} strokeWidth={1.5} />
        </button>
      </div>

      {showImport && <ImportFromAIModal onClose={() => setShowImport(false)} />}
    </header>
  );
}
