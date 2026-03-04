import { useState } from "react";
import { Home, RotateCcw, RotateCw, Save, Share2, Download, Play, HelpCircle } from "lucide-react";
import useEditorStore from "../store/useEditorStore";

const ToolBtn = ({ onClick, disabled, title, children }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    title={title}
    className="p-2 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
  >
    {children}
  </button>
);

import { useToast } from "./Toast.jsx";

export default function TopBar({ onShare, onDownload, onPresent }) {
  const toast = useToast();
  const title = useEditorStore((s) => s.title);
  const setTitle = useEditorStore((s) => s.setTitle);
  const undo = useEditorStore((s) => s.undo);
  const redo = useEditorStore((s) => s.redo);
  const history = useEditorStore((s) => s.history);
  const future = useEditorStore((s) => s.future);
  const saveProject = useEditorStore((s) => s.saveProject);
  const setShowShortcuts = useEditorStore((s) => s.setShowShortcuts);

  const [editingTitle, setEditingTitle] = useState(false);
  const [localTitle, setLocalTitle] = useState(title);

  const handleTitleBlur = () => {
    setEditingTitle(false);
    const val = localTitle.trim() || "Untitled Design";
    setTitle(val);
    setLocalTitle(val);
  };

  const handleTitleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.target.blur();
    }
  };

  const handleSave = () => {
    saveProject(title || "Untitled Design");
    toast("Project saved!", "success");
  };

  return (
    <header className="h-14 flex-shrink-0 bg-white border-b border-gray-200 flex items-center px-4 gap-2">
      {/* Left */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-purple-600 rounded flex items-center justify-center">
          <span className="text-white font-bold text-sm">C</span>
        </div>
        <span className="font-semibold text-gray-800">CanvaClone</span>
        <div className="w-px h-6 bg-gray-200" />
        <ToolBtn onClick={() => {}} title="Home">
          <Home size={18} />
        </ToolBtn>
        <ToolBtn onClick={undo} disabled={!history.length} title="Undo">
          <RotateCcw size={18} />
        </ToolBtn>
        <ToolBtn onClick={redo} disabled={!future.length} title="Redo">
          <RotateCw size={18} />
        </ToolBtn>
        <ToolBtn onClick={handleSave} title="Save">
          <Save size={18} />
        </ToolBtn>
      </div>

      {/* Center */}
      <div className="flex-1 flex items-center justify-center">
        {editingTitle ? (
          <input
            type="text"
            value={localTitle}
            onChange={(e) => setLocalTitle(e.target.value)}
            onBlur={handleTitleBlur}
            onKeyDown={handleTitleKeyDown}
            autoFocus
            className="text-sm font-medium text-gray-700 min-w-32 max-w-64 w-auto text-center border border-purple-400 bg-white rounded px-2 py-1 focus:outline-none"
          />
        ) : (
          <button
            type="button"
            onClick={() => setEditingTitle(true)}
            className="text-sm font-medium text-gray-700 min-w-32 max-w-64 px-2 py-1 rounded border border-transparent hover:border-gray-200 transition-colors"
          >
            {title || "Untitled Design"}
          </button>
        )}
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setShowShortcuts(true)}
          title="Keyboard shortcuts (?)"
          className="p-2 rounded-md hover:bg-gray-100 transition-colors"
        >
          <HelpCircle size={18} />
        </button>
        <button
          type="button"
          onClick={onShare}
          className="flex items-center gap-2 border border-gray-300 rounded-lg px-3 py-1.5 text-sm hover:bg-gray-50 transition-colors"
        >
          <Share2 size={16} />
          Share
        </button>
        <button
          type="button"
          onClick={onDownload}
          className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg px-3 py-1.5 text-sm transition-colors"
        >
          <Download size={16} />
          Download
        </button>
        <button
          type="button"
          onClick={onPresent}
          className="flex items-center gap-2 bg-gray-900 hover:bg-gray-700 text-white rounded-lg px-3 py-1.5 text-sm transition-colors"
        >
          <Play size={16} />
          Present
        </button>
      </div>

    </header>
  );
}
