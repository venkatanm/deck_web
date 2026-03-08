import React, { useState, useEffect, useRef } from "react";
import {
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  ChevronDown,
  Search,
  Check,
  Star,
} from "lucide-react";
import useEditorStore from "../store/useEditorStore";

const BASE_FONTS = [
  { name: "Inter", family: "Inter" },
  { name: "Roboto", family: "Roboto" },
  { name: "Open Sans", family: "Open Sans" },
  { name: "Lato", family: "Lato" },
  { name: "Montserrat", family: "Montserrat" },
  { name: "Playfair Display", family: "Playfair Display" },
  { name: "Raleway", family: "Raleway" },
  { name: "Oswald", family: "Oswald" },
  { name: "Poppins", family: "Poppins" },
  { name: "Dancing Script", family: "Dancing Script" },
  { name: "Bebas Neue", family: "Bebas Neue" },
  { name: "Merriweather", family: "Merriweather" },
  { name: "Georgia", family: "Georgia" },
  { name: "Times New Roman", family: "Times New Roman" },
  { name: "Courier New", family: "Courier New" },
  { name: "Arial", family: "Arial" },
];

const Divider = () => (
  <div className="w-px h-6 bg-gray-200 mx-1 flex-shrink-0" />
);

const ToolBtn = ({ onClick, active, disabled, title, children }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={`p-1.5 rounded-md text-sm flex items-center justify-center transition-colors flex-shrink-0 ${
      active ? "bg-blue-100 text-blue-700" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
    } ${disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
  >
    {children}
  </button>
);

const ColorPickerBtn = ({ value, onChange, label, brandColors = [] }) => {
  const [open, setOpen] = useState(false);
  const [localColor, setLocalColor] = useState(value || "#000000");
  const kit = useEditorStore((s) => s.brandKit);
  const allBrandColors = brandColors.length > 0 ? brandColors : kit?.colors || [];

  useEffect(() => {
    setLocalColor(value || "#000000");
  }, [value]);

  const handleChange = (c) => {
    setLocalColor(c);
    onChange(c);
  };

  return (
    <div className="relative flex-shrink-0 group/cp">
      <button
        type="button"
        title={label}
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 px-2 py-1 border border-gray-200 rounded-lg hover:border-purple-400 transition-colors"
      >
        <div
          className="w-4 h-4 rounded-sm border border-gray-300"
          style={{ backgroundColor: localColor }}
        />
        {label && (
          <span className="text-[10px] text-gray-500 max-w-[40px] truncate">
            {label}
          </span>
        )}
      </button>
      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-2xl p-3 z-[9999] min-w-[140px]">
            {allBrandColors.length > 0 && (
              <>
                <p className="text-[9px] text-blue-600 font-bold uppercase tracking-wide mb-1.5 px-1">
                  Brand Colors
                </p>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {allBrandColors.map((c) => (
                    <button
                      key={c.id}
                      title={c.name}
                      onClick={() => {
                        handleChange(c.hex);
                      }}
                      className="w-6 h-6 rounded-md border-2 border-transparent hover:border-gray-400 transition-all hover:scale-110"
                      style={{ background: c.hex }}
                    />
                  ))}
                </div>
              </>
            )}
            <input
              type="color"
              value={localColor}
              onChange={(e) => handleChange(e.target.value)}
              className="w-full h-6 cursor-pointer rounded"
            />
            <input
              type="text"
              value={localColor}
              onChange={(e) => {
                if (/^#[0-9A-Fa-f]{0,6}$/.test(e.target.value) || e.target.value === "") {
                  handleChange(e.target.value || "#000000");
                }
              }}
              className="mt-2 w-full text-center text-xs border border-gray-200 rounded px-2 py-1 font-mono"
              maxLength={7}
            />
          </div>
        </>
      )}
    </div>
  );
};

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
      className="w-20 accent-blue-600 cursor-pointer"
    />
  </div>
);

function FontOption({ font, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full px-3 py-2 flex items-center justify-between hover:bg-blue-50 text-left transition-colors ${
        active ? "bg-blue-50" : ""
      }`}
    >
      <span className="text-sm truncate" style={{ fontFamily: font.family }}>
        {font.name}
      </span>
      {active && <Check className="w-3 h-3 text-blue-600 flex-shrink-0" />}
    </button>
  );
}

function FontPicker({ value, fonts, brandFonts, onChange }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef();

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = fonts.filter(
    (f) => !search || f.name.toLowerCase().includes(search.toLowerCase())
  );
  const brandFiltered = filtered.filter((f) => f.isBrand);
  const sysFiltered = filtered.filter((f) => !f.isBrand);

  return (
    <div ref={ref} className="relative flex-shrink-0">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-lg text-xs text-gray-800 hover:border-blue-400 min-w-[130px] max-w-[160px] truncate bg-white"
        style={{ fontFamily: value }}
      >
        <span className="truncate flex-1 text-left">{value}</span>
        <ChevronDown className="w-3 h-3 flex-shrink-0 text-gray-400" />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-xl shadow-2xl z-[9999] overflow-hidden">
          <div className="p-2 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" />
              <input
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search fonts..."
                className="w-full pl-7 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-blue-400"
              />
            </div>
          </div>

          <div className="overflow-y-auto max-h-64">
            {brandFiltered.length > 0 && (
              <>
                <div className="px-3 py-1.5 text-[10px] font-semibold text-blue-600 uppercase tracking-wide bg-blue-50 flex items-center gap-1">
                  <Star className="w-3 h-3" />
                  Brand Fonts
                </div>
                {brandFiltered.map((f) => (
                  <FontOption
                    key={f.family}
                    font={f}
                    active={value === f.family}
                    onClick={() => {
                      onChange(f.family);
                      setOpen(false);
                    }}
                  />
                ))}
                {sysFiltered.length > 0 && (
                  <div className="px-3 py-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wide bg-gray-50">
                    System Fonts
                  </div>
                )}
              </>
            )}
            {sysFiltered.map((f) => (
              <FontOption
                key={f.family}
                font={f}
                active={value === f.family}
                onClick={() => {
                  onChange(f.family);
                  setOpen(false);
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function TextToolbar({ el }) {
  const update = (props) =>
    useEditorStore.getState().updateElement(el.id, props);
  const brandKit = useEditorStore((s) => s.brandKit);

  const allFonts = [
    ...BASE_FONTS,
    ...(brandKit?.fonts || []).map((f) => ({
      name: f.name,
      family: f.family,
      isBrand: true,
    })),
  ];

  return (
    <div className="bg-white border-b border-gray-200 flex flex-col">
      <div className="h-11 flex items-center px-3 gap-1.5 border-b border-gray-100 overflow-x-auto">
        <FontPicker
          value={el.fontFamily || "Inter"}
          fonts={allFonts}
          brandFonts={brandKit?.fonts || []}
          onChange={(v) => update({ fontFamily: v })}
        />

        <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden flex-shrink-0">
          <button
            className="px-2 py-1 hover:bg-gray-50 text-gray-500 text-sm border-r border-gray-200"
            onClick={() =>
              update({ fontSize: Math.max(8, (el.fontSize || 16) - 2) })
            }
          >
            −
          </button>
          <input
            type="number"
            value={el.fontSize || 16}
            onChange={(e) => update({ fontSize: Number(e.target.value) })}
            className="w-10 text-center text-xs py-1 text-gray-800 bg-white focus:outline-none focus:bg-blue-50"
            min={6}
            max={200}
          />
          <button
            className="px-2 py-1 hover:bg-gray-50 text-gray-500 text-sm border-l border-gray-200"
            onClick={() => update({ fontSize: (el.fontSize || 16) + 2 })}
          >
            +
          </button>
        </div>

        <Divider />

        <ToolBtn
          active={(el.fontStyle || "").includes("bold")}
          onClick={() =>
            update({
              fontStyle: (el.fontStyle || "").includes("bold")
                ? (el.fontStyle || "").replace("bold", "").trim()
                : ((el.fontStyle || "") + " bold").trim(),
            })
          }
          title="Bold (Ctrl+B)"
        >
          <Bold className="w-4 h-4" />
        </ToolBtn>
        <ToolBtn
          active={(el.fontStyle || "").includes("italic")}
          onClick={() =>
            update({
              fontStyle: (el.fontStyle || "").includes("italic")
                ? (el.fontStyle || "").replace("italic", "").trim()
                : ((el.fontStyle || "") + " italic").trim(),
            })
          }
          title="Italic (Ctrl+I)"
        >
          <Italic className="w-4 h-4" />
        </ToolBtn>
        <ToolBtn
          active={el.textDecoration === "underline"}
          onClick={() =>
            update({
              textDecoration: el.textDecoration === "underline" ? "" : "underline",
            })
          }
          title="Underline (Ctrl+U)"
        >
          <Underline className="w-4 h-4" />
        </ToolBtn>

        <Divider />

        <ColorPickerBtn
          value={el.fill || "#1e293b"}
          onChange={(v) => update({ fill: v })}
          label="Color"
          brandColors={brandKit?.colors || []}
        />

        <Divider />

        <ToolBtn
          active={el.align === "left"}
          onClick={() => update({ align: "left" })}
          title="Align left"
        >
          <AlignLeft className="w-4 h-4" />
        </ToolBtn>
        <ToolBtn
          active={el.align === "center"}
          onClick={() => update({ align: "center" })}
          title="Align center"
        >
          <AlignCenter className="w-4 h-4" />
        </ToolBtn>
        <ToolBtn
          active={el.align === "right"}
          onClick={() => update({ align: "right" })}
          title="Align right"
        >
          <AlignRight className="w-4 h-4" />
        </ToolBtn>

        <Divider />

        <ToolBtn
          active={el.textCase === "upper"}
          onClick={() =>
            update({ textCase: el.textCase === "upper" ? "none" : "upper" })
          }
          title="UPPERCASE"
        >
          <span className="text-[11px] font-bold">AA</span>
        </ToolBtn>
        <ToolBtn
          active={el.textCase === "title"}
          onClick={() =>
            update({ textCase: el.textCase === "title" ? "none" : "title" })
          }
          title="Title Case"
        >
          <span className="text-[11px] font-bold">Aa</span>
        </ToolBtn>
        <ToolBtn
          active={el.textCase === "lower"}
          onClick={() =>
            update({ textCase: el.textCase === "lower" ? "none" : "lower" })
          }
          title="lowercase"
        >
          <span className="text-[11px]">aa</span>
        </ToolBtn>

        <Divider />
        <OpacityControl value={el.opacity} onChange={(v) => update({ opacity: v })} />
      </div>

      <div className="h-10 flex items-center px-3 gap-2 overflow-x-auto">
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className="text-[10px] text-gray-400 uppercase tracking-wide">
            Spacing
          </span>
          <input
            type="range"
            min={-5}
            max={20}
            step={0.5}
            value={el.letterSpacing || 0}
            onChange={(e) =>
              update({ letterSpacing: Number(e.target.value) })
            }
            className="w-20 accent-blue-600"
          />
          <span className="text-[10px] text-gray-500 w-6">
            {el.letterSpacing || 0}
          </span>
        </div>

        <Divider />

        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className="text-[10px] text-gray-400 uppercase tracking-wide">
            Height
          </span>
          <input
            type="range"
            min={0.8}
            max={3}
            step={0.05}
            value={el.lineHeight || 1.4}
            onChange={(e) =>
              update({ lineHeight: Number(e.target.value) })
            }
            className="w-20 accent-blue-600"
          />
          <span className="text-[10px] text-gray-500 w-6">
            {(el.lineHeight || 1.4).toFixed(1)}
          </span>
        </div>

        <Divider />

        <span className="text-[10px] text-gray-400 uppercase tracking-wide flex-shrink-0">
          Effect
        </span>
        <div className="flex gap-1 flex-shrink-0">
          {[
            { id: "none", label: "None" },
            { id: "shadow", label: "Shadow" },
            { id: "glow", label: "Glow" },
            { id: "lifted", label: "Lifted" },
            { id: "hollow", label: "Hollow" },
            { id: "neon", label: "Neon" },
            { id: "background", label: "BG" },
          ].map((eff) => (
            <ToolBtn
              key={eff.id}
              active={(el.textEffect || "none") === eff.id}
              onClick={() => update({ textEffect: eff.id })}
              title={eff.label}
            >
              <span className="text-[10px]">{eff.label}</span>
            </ToolBtn>
          ))}
        </div>

        {el.textEffect &&
          el.textEffect !== "none" &&
          el.textEffect !== "hollow" &&
          el.textEffect !== "lifted" && (
            <>
              <Divider />
              <ColorPickerBtn
                value={el.effectColor || "#000000"}
                onChange={(v) => update({ effectColor: v })}
                label="Fx Color"
              />
            </>
          )}

        {el.textEffect === "background" && (
          <ColorPickerBtn
            value={el.bgColor || "#000000"}
            onChange={(v) => update({ bgColor: v })}
            label="BG Color"
          />
        )}
      </div>
    </div>
  );
}
