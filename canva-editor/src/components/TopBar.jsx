import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { RotateCcw, RotateCw, Share2, Download, Play, HelpCircle, Wand2, LogOut, MessageSquarePlus } from "lucide-react";
import useEditorStore from "../store/useEditorStore";
import ImportFromAIModal from "./ImportFromAIModal";
import FileMenu from "./FileMenu";
import { logout } from "../api/auth";

const ToolBtn = ({ onClick, disabled, title, children }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    title={title}
    className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-gray-500 hover:text-gray-900"
  >
    {children}
  </button>
);

import { useToast } from "./Toast.jsx";

export default function TopBar({ onShare, onDownload, onPresent, showAIChat, onToggleAIChat }) {
  const toast = useToast();
  const navigate = useNavigate();
  const title = useEditorStore((s) => s.title);
  const setTitle = useEditorStore((s) => s.setTitle);
  const undo = useEditorStore((s) => s.undo);
  const redo = useEditorStore((s) => s.redo);
  const history = useEditorStore((s) => s.history);
  const future = useEditorStore((s) => s.future);
  const setShowShortcuts = useEditorStore((s) => s.setShowShortcuts);

  const [editingTitle, setEditingTitle] = useState(false);
  const [localTitle, setLocalTitle] = useState(title);
  const [showImport, setShowImport] = useState(false);

  const handleTitleBlur = () => {
    setEditingTitle(false);
    const val = localTitle.trim() || "Untitled Design";
    setTitle(val);
    setLocalTitle(val);
  };

  const handleTitleKeyDown = (e) => {
    if (e.key === "Enter") e.target.blur();
  };

  return (
    <header className="h-14 flex-shrink-0 bg-white border-b border-gray-200 flex items-center px-3 gap-2 shadow-sm">
      {/* Left */}
      <div className="flex items-center gap-1.5">
        {/* Logo — purple-to-indigo gradient badge */}
        <button
          type="button"
          onClick={() => navigate("/home")}
          className="w-9 h-9 rounded-xl flex items-center justify-center hover:opacity-90 transition-opacity flex-shrink-0 shadow-sm"
          style={{ background: "linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)" }}
          title="Home"
        >
          <span className="text-white font-black text-base tracking-tight select-none">D</span>
        </button>

        <div className="w-px h-6 bg-gray-200 mx-1" />
        <FileMenu onDownload={onDownload} />
        <div className="w-px h-5 bg-gray-200 mx-0.5" />

        <ToolBtn onClick={undo} disabled={!history.length} title="Undo (Ctrl+Z)">
          <RotateCcw size={20} />
        </ToolBtn>
        <ToolBtn onClick={redo} disabled={!future.length} title="Redo (Ctrl+Shift+Z)">
          <RotateCw size={20} />
        </ToolBtn>
      </div>

      {/* Center — editable title */}
      <div className="flex-1 flex items-center justify-center">
        {editingTitle ? (
          <input
            type="text"
            value={localTitle}
            onChange={(e) => setLocalTitle(e.target.value)}
            onBlur={handleTitleBlur}
            onKeyDown={handleTitleKeyDown}
            autoFocus
            className="text-sm font-semibold text-gray-800 min-w-36 max-w-72 w-auto text-center border border-violet-400 bg-white rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-violet-200"
          />
        ) : (
          <button
            type="button"
            onClick={() => setEditingTitle(true)}
            className="text-sm font-semibold text-gray-700 min-w-36 max-w-72 px-3 py-1.5 rounded-lg border border-transparent hover:border-gray-200 hover:bg-gray-50 transition-all truncate"
          >
            {title || "Untitled Design"}
          </button>
        )}
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-2">
        {/* AI Chat — purple gradient, toggleable */}
        <button
          type="button"
          onClick={onToggleAIChat}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all shadow-sm ${
            showAIChat
              ? "bg-purple-700 text-white ring-2 ring-purple-400"
              : "text-white hover:opacity-90"
          }`}
          style={showAIChat ? {} : { background: "linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)" }}
        >
          <MessageSquarePlus size={14} />
          AI Assistant
        </button>

        {/* AI Import — teal gradient */}
        <button
          type="button"
          onClick={() => setShowImport(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-white text-xs font-semibold rounded-lg transition-opacity hover:opacity-90 shadow-sm"
          style={{ background: "linear-gradient(135deg, #0d9488 0%, #0891b2 100%)" }}
        >
          <Wand2 size={14} />
          Import from AI
        </button>

        <button
          type="button"
          onClick={() => setShowShortcuts(true)}
          title="Keyboard shortcuts (?)"
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-700"
        >
          <HelpCircle size={20} />
        </button>

        {/* Share — indigo outline */}
        <button
          type="button"
          onClick={onShare}
          className="flex items-center gap-1.5 border border-indigo-200 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors"
        >
          <Share2 size={16} />
          Share
        </button>

        {/* Download — purple */}
        <button
          type="button"
          onClick={onDownload}
          className="flex items-center gap-1.5 text-white rounded-lg px-3 py-1.5 text-sm font-semibold transition-opacity hover:opacity-90 shadow-sm"
          style={{ background: "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)" }}
        >
          <Download size={16} />
          Download
        </button>

        {/* Present — deep indigo */}
        <button
          type="button"
          onClick={onPresent}
          className="flex items-center gap-1.5 text-white rounded-lg px-3 py-1.5 text-sm font-semibold transition-opacity hover:opacity-90 shadow-sm"
          style={{ background: "linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)" }}
        >
          <Play size={16} fill="currentColor" />
          Present
        </button>

        <button
          type="button"
          onClick={logout}
          title="Log out"
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-red-500"
        >
          <LogOut size={18} />
        </button>
      </div>

      {showImport && (
        <ImportFromAIModal onClose={() => setShowImport(false)} />
      )}
    </header>
  );
}
