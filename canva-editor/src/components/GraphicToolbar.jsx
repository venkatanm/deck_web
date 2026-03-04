import { Trash2 } from "lucide-react";
import useEditorStore from "../store/useEditorStore";

export default function GraphicToolbar({ el }) {
  const updateElement = useEditorStore((s) => s.updateElement);
  const deleteElement = useEditorStore((s) => s.deleteElement);

  return (
    <div className="flex items-center gap-1 flex-wrap">
      <span className="text-sm text-gray-600">{el.iconName || "Icon"}</span>
      <div className="w-px h-6 bg-gray-200 mx-1" />
      <div className="flex items-center gap-1">
        <span className="text-xs text-gray-500">Color:</span>
        <input
          type="color"
          value={el.fill || "#7c3aed"}
          onChange={(e) => updateElement(el.id, { fill: e.target.value })}
          className="w-6 h-6 rounded cursor-pointer border border-gray-200"
        />
      </div>
      <div className="flex items-center gap-1">
        <span className="text-xs text-gray-500">Stroke:</span>
        <select
          value={el.strokeWidth ?? 1.5}
          onChange={(e) => updateElement(el.id, { strokeWidth: parseFloat(e.target.value) })}
          className="text-xs border border-gray-200 rounded px-2 py-1 w-16"
        >
          <option value={1}>1</option>
          <option value={1.5}>1.5</option>
          <option value={2}>2</option>
          <option value={2.5}>2.5</option>
          <option value={3}>3</option>
          <option value={4}>4</option>
        </select>
      </div>
      <div className="flex items-center gap-1">
        <span className="text-xs text-gray-500">W:</span>
        <input
          type="number"
          value={Math.round(el.width)}
          onChange={(e) => updateElement(el.id, { width: Math.max(20, Number(e.target.value)) })}
          className="w-14 text-xs border border-gray-200 rounded px-2 py-1"
        />
      </div>
      <div className="flex items-center gap-1">
        <span className="text-xs text-gray-500">H:</span>
        <input
          type="number"
          value={Math.round(el.height)}
          onChange={(e) => updateElement(el.id, { height: Math.max(20, Number(e.target.value)) })}
          className="w-14 text-xs border border-gray-200 rounded px-2 py-1"
        />
      </div>
      <div className="flex items-center gap-1">
        <span className="text-xs text-gray-500">Opacity:</span>
        <input
          type="range"
          min="0.1"
          max="1"
          step="0.1"
          value={el.opacity ?? 1}
          onChange={(e) => updateElement(el.id, { opacity: parseFloat(e.target.value) })}
          className="w-16"
        />
      </div>
      <button
        type="button"
        onClick={() => deleteElement(el.id)}
        className="p-1.5 rounded-md text-red-600 hover:bg-red-50"
        title="Delete"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}
