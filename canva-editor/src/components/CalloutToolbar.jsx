import React from "react";
import useEditorStore from "../store/useEditorStore";

const Divider = () => (
  <div className="w-px h-6 bg-gray-200 mx-1 flex-shrink-0" />
);

const ColorPickerBtn = ({ color, onChange, title }) => {
  const [open, setOpen] = React.useState(false);
  const [localColor, setLocalColor] = React.useState(color || "#000000");

  React.useEffect(() => {
    setLocalColor(color || "#000000");
  }, [color]);

  return (
    <div className="relative flex-shrink-0">
      <button
        type="button"
        title={title}
        onClick={() => setOpen((o) => !o)}
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
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute top-10 left-0 z-50 bg-white rounded-xl shadow-2xl border border-gray-200 p-3">
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
              className="mt-2 w-full text-center text-xs border border-gray-200 rounded-md px-2 py-1 font-mono"
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

const NumberInput = ({ label, value, onChange, min, max, width = 48 }) => (
  <div className="flex items-center gap-1 flex-shrink-0">
    {label && <span className="text-xs text-gray-500">{label}</span>}
    <input
      type="number"
      value={value}
      min={min}
      max={max}
      onChange={(e) => {
        const v = Number(e.target.value);
        if (!Number.isNaN(v)) onChange(v);
      }}
      className={`w-${width} text-xs border border-gray-200 rounded-md px-2 py-1 text-center focus:outline-none focus:border-purple-400`}
    />
  </div>
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

export default function CalloutToolbar({ el }) {
  const update = (props) =>
    useEditorStore.getState().updateElement(el.id, props);

  return (
    <div className="h-12 bg-white border-b border-gray-200 flex items-center px-4 gap-2 overflow-x-auto">
      <span className="text-xs font-semibold text-purple-600 bg-purple-50 px-2 py-1 rounded-md flex-shrink-0">
        Callout
      </span>
      <Divider />

      <input
        className="text-xs border border-gray-200 rounded px-2 py-1 w-36"
        placeholder="Callout text..."
        value={el.text || ""}
        onChange={(e) => update({ text: e.target.value })}
      />

      <SelectInput
        value={el.tailDir || "bottom-left"}
        onChange={(v) => update({ tailDir: v })}
        options={[
          { value: "bottom-left", label: "↙ Bot Left" },
          { value: "bottom-right", label: "↘ Bot Right" },
          { value: "top-left", label: "↖ Top Left" },
          { value: "top-right", label: "↗ Top Right" },
          { value: "left", label: "← Left" },
          { value: "right", label: "→ Right" },
        ]}
      />

      <ColorPickerBtn
        color={el.fill || "#7c3aed"}
        onChange={(v) => update({ fill: v })}
        title="Fill"
      />
      <ColorPickerBtn
        color={el.textColor || "#ffffff"}
        onChange={(v) => update({ textColor: v })}
        title="Text"
      />
      <NumberInput
        label="Size"
        value={el.fontSize || 14}
        onChange={(v) => update({ fontSize: v })}
        min={8}
        max={48}
      />
      <OpacityControl value={el.opacity} onChange={(v) => update({ opacity: v })} />
    </div>
  );
}
