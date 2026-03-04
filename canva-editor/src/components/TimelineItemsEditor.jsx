import React, { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import useEditorStore from "../store/useEditorStore";

function EditorShell({ title, onClose, onSave, children }) {
  return (
    <div
      className="fixed inset-0 z-[9990] flex items-end justify-center"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-t-2xl shadow-2xl w-full max-w-2xl max-h-[70vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800 text-sm">{title}</h3>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="text-xs text-gray-400 px-3 py-1.5 rounded-lg hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              onClick={onSave}
              className="text-xs bg-purple-600 text-white px-4 py-1.5 rounded-lg hover:bg-purple-700 font-medium"
            >
              Apply
            </button>
          </div>
        </div>
        <div className="overflow-y-auto p-4 flex-1">{children}</div>
      </div>
    </div>
  );
}

export default function TimelineItemsEditor({ el, onClose }) {
  const updateElement = useEditorStore((s) => s.updateElement);
  const [items, setItems] = useState(
    JSON.parse(JSON.stringify(el.items || []))
  );

  const save = () => {
    updateElement(el.id, { items });
    onClose();
  };

  const updateItem = (i, field, value) => {
    const next = [...items];
    next[i] = { ...next[i], [field]: value };
    setItems(next);
  };

  const removeItem = (i) => {
    setItems(items.filter((_, j) => j !== i));
  };

  const addItem = () => {
    const base =
      el.subtype === "horizontal"
        ? { label: "New", sublabel: "", description: "", done: false }
        : el.subtype === "vertical"
          ? { label: "Phase", sublabel: "", description: "" }
          : { label: "Step", description: "" };
    setItems([...items, base]);
  };

  const hasDone = el.subtype === "horizontal";

  return (
    <EditorShell title="Edit Timeline Items" onClose={onClose} onSave={save}>
      <div className="flex flex-col gap-3">
        {items.map((item, i) => (
          <div
            key={i}
            className="border border-gray-200 rounded-xl p-3 bg-gray-50/50"
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <input
                className="flex-1 text-xs border border-gray-200 rounded px-2 py-1.5 font-medium"
                placeholder="Label"
                value={item.label || ""}
                onChange={(e) => updateItem(i, "label", e.target.value)}
              />
              <button
                onClick={() => removeItem(i)}
                className="text-red-400 hover:text-red-600 p-1 flex-shrink-0"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            {(el.subtype === "horizontal" || el.subtype === "vertical") && (
              <input
                className="w-full text-xs border border-gray-200 rounded px-2 py-1.5 mb-2"
                placeholder="Sublabel"
                value={item.sublabel || ""}
                onChange={(e) => updateItem(i, "sublabel", e.target.value)}
              />
            )}
            <input
              className="w-full text-xs border border-gray-200 rounded px-2 py-1.5 mb-2"
              placeholder="Description"
              value={item.description || ""}
              onChange={(e) => updateItem(i, "description", e.target.value)}
            />
            {hasDone && (
              <label className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={!!item.done}
                  onChange={(e) => updateItem(i, "done", e.target.checked)}
                />
                Done
              </label>
            )}
          </div>
        ))}
        <button
          onClick={addItem}
          className="text-xs text-purple-600 flex items-center gap-1 hover:text-purple-800 py-2"
        >
          <Plus className="w-4 h-4" /> Add Item
        </button>
      </div>
    </EditorShell>
  );
}
