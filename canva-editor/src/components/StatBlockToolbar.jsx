import React from "react";
import { Trash2 } from "lucide-react";
import useEditorStore from "../store/useEditorStore";

const Divider = () => (
  <div className="w-px h-6 bg-gray-200 mx-1 flex-shrink-0" />
);

const ToolBtn = ({ onClick, active, disabled, title, children }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={`
      p-1.5 rounded-md text-sm flex items-center justify-center
      transition-colors duration-100 flex-shrink-0
      ${active ? "bg-purple-100 text-purple-700" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"}
      ${disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}
    `}
  >
    {children}
  </button>
);

const ColorPickerBtn = ({ color, onChange, title }) => {
  const [open, setOpen] = React.useState(false);
  const [localColor, setLocalColor] = React.useState(color || "#000000");
  const [dropPos, setDropPos] = React.useState({ top: 0, left: 0 });
  const btnRef = React.useRef(null);

  React.useEffect(() => {
    setLocalColor(color || "#000000");
  }, [color]);

  const handleOpen = () => {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setDropPos({ top: rect.bottom + 4, left: rect.left });
    }
    setOpen((o) => !o);
  };

  return (
    <div className="relative flex-shrink-0">
      <button
        ref={btnRef}
        type="button"
        title={title}
        onClick={handleOpen}
        className="flex flex-col items-center justify-center w-8 h-8 rounded-md hover:bg-gray-100 transition-colors"
      >
        <div
          className="w-5 h-5 rounded-sm border border-gray-300 shadow-sm"
          style={{ backgroundColor: localColor }}
        />
      </button>
      {open && (
        <>
          <div
            className="fixed inset-0 z-[9998]"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div className="fixed z-[9999] bg-white rounded-xl shadow-2xl border border-gray-200 p-3 min-w-[140px]"
            style={{ top: dropPos.top, left: dropPos.left }}>
            <input
              type="color"
              value={localColor}
              onChange={(e) => {
                const c = e.target.value;
                setLocalColor(c);
                onChange(c);
              }}
              className="w-full h-8 cursor-pointer"
            />
            <input
              type="text"
              value={localColor}
              onChange={(e) => {
                const v = e.target.value;
                if (/^#[0-9A-Fa-f]{0,6}$/.test(v) || v === "") {
                  const c = v || "#000000";
                  setLocalColor(c);
                  onChange(c);
                }
              }}
              className="mt-2 w-full text-center text-xs border border-gray-200 rounded-md px-2 py-1 font-mono text-gray-900"
              maxLength={7}
            />
          </div>
        </>
      )}
    </div>
  );
};

const SelectInput = ({ value, onChange, options }) => (
  <select
    value={value}
    onChange={(e) => onChange(e.target.value)}
    className="w-32 text-xs border border-gray-200 rounded-md px-2 py-1 focus:outline-none focus:border-purple-400 bg-white cursor-pointer"
  >
    {options.map((o) => (
      <option key={o.value} value={o.value}>
        {o.label}
      </option>
    ))}
  </select>
);

const OpacityControl = ({ value, onChange }) => (
  <div className="flex items-center gap-2 flex-shrink-0">
    <span className="text-xs text-gray-500 w-14 text-right flex-shrink-0">
      {Math.round((value ?? 1) * 100)}%
    </span>
    <input
      type="range"
      min={0}
      max={100}
      value={Math.round((value ?? 1) * 100)}
      onChange={(e) => onChange(Number(e.target.value) / 100)}
      className="w-20 accent-purple-600 cursor-pointer"
    />
  </div>
);

export default function StatBlockToolbar({ el }) {
  const update = (props) =>
    useEditorStore.getState().updateElement(el.id, props);

  return (
    <div className="h-12 bg-white border-b border-gray-200 flex items-center px-4 gap-2 overflow-x-auto">
      <span className="text-xs font-semibold text-purple-600 bg-purple-50 px-2 py-1 rounded-md capitalize flex-shrink-0">
        {el.subtype}
      </span>

      <Divider />

      <SelectInput
        value={el.style}
        onChange={(v) => update({ style: v })}
        options={[
          { value: "card", label: "Card" },
          { value: "flat", label: "Flat" },
          { value: "bordered", label: "Bordered" },
          { value: "dark", label: "Dark" },
        ]}
      />

      <Divider />

      <ColorPickerBtn
        color={el.accentColor || "#7c3aed"}
        onChange={(v) => update({ accentColor: v })}
        title="Accent"
      />
      <ColorPickerBtn
        color={el.bgColor || "#ffffff"}
        onChange={(v) => update({ bgColor: v })}
        title="BG"
      />
      <ColorPickerBtn
        color={el.textColor || "#1e293b"}
        onChange={(v) => update({ textColor: v })}
        title="Text"
      />

      <Divider />

      {el.subtype === "kpi" && (
        <>
          <input
            className="text-xs text-gray-900 border border-gray-200 rounded px-2 py-1 w-20"
            placeholder="Value"
            value={el.value || ""}
            onChange={(e) => update({ value: e.target.value })}
          />
          <input
            className="text-xs text-gray-900 border border-gray-200 rounded px-2 py-1 w-24"
            placeholder="Label"
            value={el.label || ""}
            onChange={(e) => update({ label: e.target.value })}
          />
          <input
            className="text-xs text-gray-900 border border-gray-200 rounded px-2 py-1 w-16"
            placeholder="Trend"
            value={el.trend || ""}
            onChange={(e) => update({ trend: e.target.value })}
          />
          <SelectInput
            value={el.trendDir || "up"}
            onChange={(v) => update({ trendDir: v })}
            options={[
              { value: "up", label: "↑ Up" },
              { value: "down", label: "↓ Down" },
              { value: "neutral", label: "→ Neutral" },
            ]}
          />
        </>
      )}

      {el.subtype === "progressStat" && (
        <>
          <input
            type="number"
            min={0}
            max={100}
            className="text-xs text-gray-900 border border-gray-200 rounded px-2 py-1 w-16"
            placeholder="Value %"
            value={el.value ?? 0}
            onChange={(e) => update({ value: Number(e.target.value) })}
          />
          <input
            className="text-xs text-gray-900 border border-gray-200 rounded px-2 py-1 w-32"
            placeholder="Label"
            value={el.label || ""}
            onChange={(e) => update({ label: e.target.value })}
          />
        </>
      )}

      {el.subtype === "comparison" && (
        <>
          <input
            className="text-xs text-gray-900 border border-gray-200 rounded px-2 py-1 w-16"
            placeholder="Left val"
            value={el.leftValue || ""}
            onChange={(e) => update({ leftValue: e.target.value })}
          />
          <input
            className="text-xs text-gray-900 border border-gray-200 rounded px-2 py-1 w-24"
            placeholder="Left label"
            value={el.leftLabel || ""}
            onChange={(e) => update({ leftLabel: e.target.value })}
          />
          <input
            className="text-xs text-gray-900 border border-gray-200 rounded px-2 py-1 w-16"
            placeholder="Right val"
            value={el.rightValue || ""}
            onChange={(e) => update({ rightValue: e.target.value })}
          />
          <input
            className="text-xs text-gray-900 border border-gray-200 rounded px-2 py-1 w-24"
            placeholder="Right label"
            value={el.rightLabel || ""}
            onChange={(e) => update({ rightLabel: e.target.value })}
          />
        </>
      )}

      {el.subtype === "iconStat" && (
        <>
          <input
            className="text-xs text-gray-900 border border-gray-200 rounded px-2 py-1 w-24"
            placeholder="Icon name"
            value={el.iconName || ""}
            onChange={(e) => update({ iconName: e.target.value })}
          />
          <input
            className="text-xs text-gray-900 border border-gray-200 rounded px-2 py-1 w-20"
            placeholder="Value"
            value={el.value || ""}
            onChange={(e) => update({ value: e.target.value })}
          />
        </>
      )}

      {el.subtype === "rankedList" && (
        <>
          <input
            className="text-xs text-gray-900 border border-gray-200 rounded px-2 py-1 w-24"
            placeholder="Title"
            value={el.title || ""}
            onChange={(e) => update({ title: e.target.value })}
          />
          <Divider />
          {(el.items || []).map((item, i) => (
            <div key={i} className="flex items-center gap-1 flex-shrink-0">
              <input
                className="text-xs text-gray-900 border border-gray-200 rounded px-1.5 py-1 w-20"
                placeholder="Label"
                value={item.label || ""}
                onChange={(e) => {
                  const items = [...(el.items || [])];
                  items[i] = { ...items[i], label: e.target.value };
                  update({ items });
                }}
              />
              <input
                type="number"
                className="text-xs text-gray-900 border border-gray-200 rounded px-1 py-1 w-12"
                placeholder="%"
                value={item.value ?? 0}
                onChange={(e) => {
                  const items = [...(el.items || [])];
                  items[i] = { ...items[i], value: Number(e.target.value) };
                  update({ items });
                }}
              />
            </div>
          ))}
          <ToolBtn
            title="Add item"
            onClick={() => {
              const items = [...(el.items || [])];
              const colors = ["#7c3aed", "#8b5cf6", "#a78bfa", "#c4b5fd", "#6d28d9"];
              items.push({ label: "New", value: 10, color: colors[items.length % colors.length] });
              update({ items });
            }}
          >
            <span className="text-xs font-bold">+</span>
          </ToolBtn>
        </>
      )}

      <Divider />
      <OpacityControl value={el.opacity} onChange={(v) => update({ opacity: v })} />
      <ToolBtn onClick={() => useEditorStore.getState().deleteElement(el.id)}>
        <Trash2 className="w-4 h-4 text-red-500" />
      </ToolBtn>
    </div>
  );
}
