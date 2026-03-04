import { useEffect } from "react";

export default function ShortcutsModal({ onClose }) {
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const sections = [
    {
      title: "Selection",
      shortcuts: [
        { keys: ["Click"], desc: "Select element" },
        { keys: ["Shift", "Click"], desc: "Add to selection" },
        { keys: ["Drag"], desc: "Marquee select" },
        { keys: ["Ctrl", "A"], desc: "Select all" },
        { keys: ["Esc"], desc: "Deselect all" },
      ],
    },
    {
      title: "Editing",
      shortcuts: [
        { keys: ["Ctrl", "Z"], desc: "Undo" },
        { keys: ["Ctrl", "Shift", "Z"], desc: "Redo" },
        { keys: ["Ctrl", "D"], desc: "Duplicate" },
        { keys: ["Ctrl", "C"], desc: "Copy" },
        { keys: ["Ctrl", "V"], desc: "Paste" },
        { keys: ["Delete"], desc: "Delete selected" },
        { keys: ["Dbl Click"], desc: "Edit text" },
      ],
    },
    {
      title: "Layers & Groups",
      shortcuts: [
        { keys: ["Ctrl", "G"], desc: "Group selected" },
        { keys: ["Ctrl", "Shift", "G"], desc: "Ungroup" },
        { keys: ["Ctrl", "]"], desc: "Bring forward" },
        { keys: ["Ctrl", "["], desc: "Send backward" },
      ],
    },
    {
      title: "View",
      shortcuts: [
        { keys: ["Ctrl", "+"], desc: "Zoom in" },
        { keys: ["Ctrl", "-"], desc: "Zoom out" },
        { keys: ["Ctrl", "0"], desc: "Fit to screen" },
        { keys: ["Ctrl", "'"], desc: "Toggle grid" },
        { keys: ["Ctrl", "R"], desc: "Toggle rulers" },
      ],
    },
    {
      title: "Nudge",
      shortcuts: [
        { keys: ["↑ ↓ ← →"], desc: "Move 1px" },
        { keys: ["Shift", "↑↓←→"], desc: "Move 10px" },
      ],
    },
    {
      title: "Tools",
      shortcuts: [
        { keys: ["P"], desc: "Draw / pen tool" },
        { keys: ["V"], desc: "Select tool" },
        { keys: ["T"], desc: "Text tool" },
        { keys: ["?"], desc: "Show shortcuts" },
      ],
    },
  ];

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Keyboard Shortcuts</h2>
            <p className="text-xs text-gray-400 mt-0.5">Press ? to toggle this panel</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl font-light"
          >
            ✕
          </button>
        </div>

        <div className="overflow-y-auto p-6 grid grid-cols-2 gap-6">
          {sections.map((section) => (
            <div key={section.title}>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
                {section.title}
              </h3>
              <div className="flex flex-col gap-2">
                {section.shortcuts.map((s, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{s.desc}</span>
                    <div className="flex items-center gap-1 flex-shrink-0 ml-4">
                      {s.keys.map((key, j) => (
                        <span key={j} className="flex items-center gap-1">
                          {j > 0 && <span className="text-gray-300 text-xs">+</span>}
                          <kbd className="bg-gray-100 border border-gray-300 rounded-md px-2 py-0.5 text-xs font-mono text-gray-700 shadow-sm whitespace-nowrap">
                            {key}
                          </kbd>
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
          <span className="text-xs text-gray-400">Mac users: use ⌘ instead of Ctrl</span>
          <button
            type="button"
            onClick={onClose}
            className="text-xs bg-purple-600 text-white px-4 py-1.5 rounded-lg hover:bg-purple-700"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
