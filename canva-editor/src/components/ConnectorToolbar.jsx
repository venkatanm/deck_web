import React from "react";
import { Trash2 } from "lucide-react";
import useEditorStore from "../store/useEditorStore";

const Divider = () => <div className="w-px h-6 bg-gray-200 mx-1 flex-shrink-0" />;

const ToolBtn = ({ onClick, active, title, children }) => (
  <button
    type="button"
    onClick={onClick}
    title={title}
    className={`p-1.5 rounded-md text-sm flex items-center justify-center transition-colors flex-shrink-0 ${active ? "bg-purple-100 text-purple-700" : "text-gray-600 hover:bg-gray-100"}`}
  >
    {children}
  </button>
);

const ColorPickerBtn = ({ color, onChange, title }) => {
  const [open, setOpen] = React.useState(false);
  React.useEffect(() => setOpen(false), [color]);
  return (
    <div className="relative flex-shrink-0">
      <button type="button" title={title} onClick={() => setOpen((o) => !o)} className="w-8 h-8 rounded-md hover:bg-gray-100 flex items-center justify-center">
        <div className="w-5 h-5 rounded-sm border border-gray-300" style={{ backgroundColor: color || "#7c3aed" }} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute top-10 left-0 z-50 bg-white rounded-xl shadow-2xl border p-3">
            <input type="color" value={color || "#7c3aed"} onChange={(e) => onChange(e.target.value)} className="w-full h-8 cursor-pointer" />
          </div>
        </>
      )}
    </div>
  );
};

const SelectInput = ({ value, onChange, options }) => (
  <select value={value} onChange={(e) => onChange(e.target.value)} className="w-28 text-xs border border-gray-200 rounded-md px-2 py-1">
    {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
  </select>
);

export default function ConnectorToolbar({ el }) {
  const update = (p) => useEditorStore.getState().updateElement(el.id, p);
  const elements = useEditorStore((s) => {
    const page = (s.pages || []).find((p) => p.id === s.currentPageId);
    return page?.elements || [];
  });
  const fromEl = elements.find((e) => e.id === el.fromId);
  const toEl = elements.find((e) => e.id === el.toId);

  return (
    <div className="h-12 bg-white border-b border-gray-200 flex items-center px-4 gap-2 overflow-x-auto">
      <span className="text-xs font-semibold text-purple-600 bg-purple-50 px-2 py-1 rounded-md flex-shrink-0">Connector</span>
      <Divider />
      <span className="text-xs text-gray-400">{fromEl?.text || "Shape"} → {toEl?.text || "Shape"}</span>
      <Divider />
      <SelectInput value={el.routing || "elbow"} onChange={(v) => update({ routing: v })} options={[{ value: "elbow", label: "Elbow" }, { value: "straight", label: "Straight" }, { value: "curved", label: "Curved" }]} />
      <SelectInput value={el.fromAnchor || "bottom"} onChange={(v) => update({ fromAnchor: v })} options={["top","bottom","left","right"].map((a) => ({ value: a, label: `From: ${a}` }))} />
      <SelectInput value={el.toAnchor || "top"} onChange={(v) => update({ toAnchor: v })} options={["top","bottom","left","right"].map((a) => ({ value: a, label: `To: ${a}` }))} />
      <Divider />
      <ToolBtn active={el.arrowEnd !== false} onClick={() => update({ arrowEnd: !el.arrowEnd })} title="Arrow end">→|</ToolBtn>
      <ToolBtn active={el.arrowStart === true} onClick={() => update({ arrowStart: !el.arrowStart })} title="Arrow start">|←</ToolBtn>
      <Divider />
      <ColorPickerBtn color={el.stroke || "#7c3aed"} onChange={(v) => update({ stroke: v })} title="Color" />
      <input type="number" min={1} max={8} value={el.strokeWidth ?? 2} onChange={(e) => update({ strokeWidth: Number(e.target.value) })} className="w-12 text-xs border rounded px-2 py-1" />
      <input className="text-xs border rounded px-2 py-1 w-28" placeholder="Label" value={el.label || ""} onChange={(e) => update({ label: e.target.value })} />
      <Divider />
      <ToolBtn onClick={() => useEditorStore.getState().deleteElement(el.id)}><Trash2 className="w-4 h-4 text-red-500" /></ToolBtn>
    </div>
  );
}
