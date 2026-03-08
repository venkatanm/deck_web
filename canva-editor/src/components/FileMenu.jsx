import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FilePlus,
  FolderOpen,
  Save,
  SaveAll,
  Download,
  Settings,
  Trash2,
  ChevronRight,
  Monitor,
  Smartphone,
  Square,
} from "lucide-react";
import useEditorStore from "../store/useEditorStore";
import { useToast } from "./Toast";
import { track } from "../api/analytics";

const CANVAS_PRESETS = [
  { label: "Presentation (16:9)", width: 1280, height: 720 },
  { label: "Presentation (4:3)", width: 1024, height: 768 },
  { label: "Square (1:1)", width: 1080, height: 1080 },
  { label: "Portrait (9:16)", width: 1080, height: 1920 },
  { label: "A4 Landscape", width: 1123, height: 794 },
  { label: "A4 Portrait", width: 794, height: 1123 },
];

function CanvasSizeModal({ onClose }) {
  const canvasSize = useEditorStore((s) => s.canvasSize);
  const setCanvasSize = useEditorStore((s) => s.setCanvasSize);
  const [w, setW] = useState(String(canvasSize.width));
  const [h, setH] = useState(String(canvasSize.height));

  const applyPreset = (preset) => {
    setW(String(preset.width));
    setH(String(preset.height));
  };

  const handleApply = () => {
    const width = parseInt(w, 10);
    const height = parseInt(h, 10);
    if (width > 0 && height > 0) {
      setCanvasSize({ width, height });
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="rounded-2xl shadow-2xl w-96 p-6 border" style={{ background: "var(--card2)", borderColor: "var(--border)" }} onClick={(e) => e.stopPropagation()}>
        <h2 className="text-base font-semibold text-velox-text-hi mb-4">Canvas Size</h2>

        <div className="flex flex-col gap-1 mb-4">
          <p className="text-xs font-medium text-velox-text-lo mb-1">Presets</p>
          {CANVAS_PRESETS.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => applyPreset(p)}
              className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors text-left ${
                parseInt(w) === p.width && parseInt(h) === p.height
                  ? "bg-velox-cyan-dim text-velox-cyan font-medium"
                  : "text-velox-text-mid hover:bg-velox-card hover:text-velox-text-hi"
              }`}
            >
              <span>{p.label}</span>
              <span className="text-xs text-velox-text-lo">{p.width} × {p.height}</span>
            </button>
          ))}
        </div>

        <div className="border-t pt-4 mb-4" style={{ borderColor: "var(--border)" }}>
          <p className="text-xs font-medium text-velox-text-lo mb-2">Custom size (px)</p>
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <label className="text-xs text-velox-text-lo mb-0.5 block">Width</label>
              <input
                type="number"
                value={w}
                onChange={(e) => setW(e.target.value)}
                className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none panel-input"
                min="100"
                max="8000"
              />
            </div>
            <span className="text-velox-text-lo mt-4">×</span>
            <div className="flex-1">
              <label className="text-xs text-velox-text-lo mb-0.5 block">Height</label>
              <input
                type="number"
                value={h}
                onChange={(e) => setH(e.target.value)}
                className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none panel-input"
                min="100"
                max="8000"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-2 justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-velox-text-mid hover:text-velox-text-hi hover:bg-velox-card rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="px-4 py-2 text-sm rounded-lg transition-colors font-medium"
            style={{ background: "var(--cyan)", color: "var(--text-inv)" }}
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}

function SaveAsModal({ currentTitle, onSave, onClose }) {
  const [name, setName] = useState(currentTitle ? `${currentTitle} (copy)` : "Untitled Design");

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (trimmed) onSave(trimmed);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="rounded-2xl shadow-2xl w-80 p-6 border" style={{ background: "var(--card2)", borderColor: "var(--border)" }} onClick={(e) => e.stopPropagation()}>
        <h2 className="text-base font-semibold text-velox-text-hi mb-1">Save as new project</h2>
        <p className="text-xs text-velox-text-lo mb-4">Creates a copy with a new name. Your current project is unchanged.</p>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none panel-input mb-4"
            placeholder="Project name"
          />
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-velox-text-mid hover:text-velox-text-hi hover:bg-velox-card rounded-lg transition-colors">
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="px-4 py-2 text-sm rounded-lg transition-colors font-medium disabled:opacity-40"
              style={{ background: "var(--cyan)", color: "var(--text-inv)" }}
            >
              Save copy
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ConfirmModal({ title, message, confirmLabel, confirmClass, onConfirm, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="rounded-2xl shadow-2xl w-80 p-6 border" style={{ background: "var(--card2)", borderColor: "var(--border)" }} onClick={(e) => e.stopPropagation()}>
        <h2 className="text-base font-semibold text-velox-text-hi mb-2">{title}</h2>
        <p className="text-sm text-velox-text-mid mb-5">{message}</p>
        <div className="flex gap-2 justify-end">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-velox-text-mid hover:text-velox-text-hi hover:bg-velox-card rounded-lg transition-colors">
            Cancel
          </button>
          <button type="button" onClick={onConfirm} className={`px-4 py-2 text-sm text-white rounded-lg transition-colors font-medium ${confirmClass}`}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function FileMenu({ onDownload }) {
  const [open, setOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showNewConfirm, setShowNewConfirm] = useState(false);
  const [showSaveAs, setShowSaveAs] = useState(false);
  const menuRef = useRef(null);
  const toast = useToast();
  const navigate = useNavigate();

  const newDesign = useEditorStore((s) => s.newDesign);
  const saveProject = useEditorStore((s) => s.saveProject);
  const saveProjectAs = useEditorStore((s) => s.saveProjectAs);
  const title = useEditorStore((s) => s.title);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleNew = () => {
    setOpen(false);
    setShowNewConfirm(true);
  };

  const confirmNew = () => {
    newDesign();
    setShowNewConfirm(false);
    track('project.new');
    toast("New design created", "success");
  };

  const handleOpen = () => {
    setOpen(false);
    navigate("/home");
  };

  const handleSave = async () => {
    setOpen(false);
    try {
      await saveProject(title || "Untitled Design");
      toast("Project saved!", "success");
    } catch (err) {
      console.error("Save failed:", err);
      toast(`Failed to save: ${err?.message || "unknown error"}`, "error");
    }
  };

  const handleSaveAs = () => {
    setOpen(false);
    setShowSaveAs(true);
  };

  const confirmSaveAs = async (name) => {
    setShowSaveAs(false);
    try {
      await saveProjectAs(name);
      toast(`Saved as "${name}"`, "success");
    } catch (err) {
      console.error("Save As failed:", err);
      toast(`Failed to save: ${err?.message || "unknown error"}`, "error");
    }
  };

  const handleSettings = () => {
    setOpen(false);
    setShowSettings(true);
  };

  const handleDownload = () => {
    setOpen(false);
    onDownload?.();
  };

  const items = [
    {
      icon: FilePlus,
      label: "Create new design",
      sublabel: "Start with a blank slide",
      onClick: handleNew,
      dividerAfter: false,
    },
    {
      icon: FolderOpen,
      label: "Open",
      sublabel: "Go to your projects",
      onClick: handleOpen,
      dividerAfter: true,
    },
    {
      icon: Save,
      label: "Save",
      sublabel: "Save to your account",
      onClick: handleSave,
      dividerAfter: false,
    },
    {
      icon: SaveAll,
      label: "Save As",
      sublabel: "Save a copy with a new name",
      onClick: handleSaveAs,
      dividerAfter: false,
    },
    {
      icon: Download,
      label: "Download",
      sublabel: "Export as PDF, PNG, PPTX",
      onClick: handleDownload,
      dividerAfter: true,
    },
    {
      icon: Settings,
      label: "Settings",
      sublabel: "Canvas size & dimensions",
      onClick: handleSettings,
      dividerAfter: false,
    },
  ];

  return (
    <>
      <div className="relative" ref={menuRef}>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-sm font-medium transition-colors ${
            open
              ? "bg-velox-card2 text-velox-text-hi"
              : "text-velox-text-mid hover:bg-velox-card2 hover:text-velox-text-hi"
          }`}
        >
          File
          <svg className="w-3 h-3 opacity-50" viewBox="0 0 12 12" fill="none">
            <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {open && (
          <div className="absolute left-0 top-full mt-1 w-64 rounded-xl shadow-2xl z-50 py-1.5 overflow-hidden border" style={{ background: "var(--card2)", borderColor: "var(--border)" }}>
            {items.map((item, i) => (
              <div key={i}>
                <button
                  type="button"
                  onClick={item.onClick}
                  className="w-full flex items-center gap-3 px-4 py-2.5 transition-colors text-left hover:bg-velox-card"
                >
                  <item.icon size={16} className="text-velox-text-lo flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-velox-text-hi">{item.label}</p>
                    {item.sublabel && <p className="text-xs text-velox-text-lo">{item.sublabel}</p>}
                  </div>
                </button>
                {item.dividerAfter && <div className="mx-3 my-1 border-t" style={{ borderColor: "var(--border)" }} />}
              </div>
            ))}
          </div>
        )}
      </div>

      {showSettings && <CanvasSizeModal onClose={() => setShowSettings(false)} />}
      {showSaveAs && (
        <SaveAsModal
          currentTitle={title}
          onSave={confirmSaveAs}
          onClose={() => setShowSaveAs(false)}
        />
      )}
      {showNewConfirm && (
        <ConfirmModal
          title="Create new design?"
          message="This will clear your current slide deck. Any unsaved changes will be lost."
          confirmLabel="Create new"
          confirmClass="bg-purple-600 hover:bg-purple-700"
          onConfirm={confirmNew}
          onClose={() => setShowNewConfirm(false)}
        />
      )}
    </>
  );
}
