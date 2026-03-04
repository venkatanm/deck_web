import { useState, useEffect, useRef } from "react";
import {
  Minus,
  Plus,
  Maximize2,
  Grid3X3,
  Ruler,
  Magnet,
  Crosshair,
  Pencil,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignStartHorizontal,
  AlignCenterHorizontal,
  AlignEndHorizontal,
  AlignStartVertical,
  AlignCenterVertical,
  AlignEndVertical,
  AlignHorizontalDistributeCenter,
  AlignVerticalDistributeCenter,
  FlipHorizontal2,
  FlipVertical2,
  BringToFront,
  SendToBack,
  Crop,
  RefreshCw,
  Bold,
  Italic,
  Underline,
  Group,
  Ungroup,
  Copy,
  Trash2,
} from "lucide-react";
import { HexColorPicker } from "react-colorful";
import useEditorStore from "../store/useEditorStore";
import { compressImage } from "../utils/compressImage";
import {
  alignLeft,
  alignRight,
  alignTop,
  alignBottom,
  alignCenterH,
  alignCenterV,
  alignMiddle,
} from "../utils/alignment";
import { ChartToolbar } from "./charts/ChartToolbar";

const FONT_OPTIONS = [
  { value: "Inter", label: "Inter" },
  { value: "Roboto", label: "Roboto" },
  { value: "Open Sans", label: "Open Sans" },
  { value: "Lato", label: "Lato" },
  { value: "Montserrat", label: "Montserrat" },
  { value: "Playfair Display", label: "Playfair Display" },
  { value: "Raleway", label: "Raleway" },
  { value: "Oswald", label: "Oswald" },
  { value: "Dancing Script", label: "Dancing Script" },
  { value: "Bebas Neue", label: "Bebas Neue" },
  { value: "Merriweather", label: "Merriweather" },
  { value: "Georgia", label: "Georgia" },
  { value: "Times New Roman", label: "Times New Roman" },
  { value: "Courier New", label: "Courier New" },
  { value: "Arial", label: "Arial" },
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
  const [open, setOpen] = useState(false);
  const [localColor, setLocalColor] = useState(color || "#000000");

  useEffect(() => {
    setLocalColor(color || "#000000");
  }, [color]);

  const handleChange = (c) => {
    setLocalColor(c);
    onChange(c);
  };

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
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden="true" />
          <div className="absolute top-10 left-0 z-50 bg-white rounded-xl shadow-2xl border border-gray-200 p-3">
            <HexColorPicker color={localColor} onChange={handleChange} />
            <input
              type="text"
              value={localColor}
              onChange={(e) => {
                if (/^#[0-9A-Fa-f]{0,6}$/.test(e.target.value) || e.target.value === "") {
                  handleChange(e.target.value || "#000000");
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

const NumberInput = ({ label, value, onChange, min, max, step = 1, width = "w-14" }) => (
  <div className="flex items-center gap-1 flex-shrink-0">
    {label && <span className="text-xs text-gray-500">{label}</span>}
    <input
      type="number"
      value={value}
      min={min}
      max={max}
      step={step}
      onChange={(e) => {
        const v = Number(e.target.value);
        if (!Number.isNaN(v)) onChange(v);
      }}
      className={`${width} text-xs border border-gray-200 rounded-md px-2 py-1 text-center focus:outline-none focus:border-purple-400`}
    />
  </div>
);

const SelectInput = ({ value, onChange, options, width = "w-32" }) => (
  <select
    value={value}
    onChange={(e) => onChange(e.target.value)}
    className={`${width} text-xs border border-gray-200 rounded-md px-2 py-1 focus:outline-none focus:border-purple-400 bg-white cursor-pointer`}
  >
    {options.map((o) => (
      <option key={o.value} value={o.value}>
        {o.label}
      </option>
    ))}
  </select>
);

const AlignmentGroup = ({ el }) => {
  const canvasSize = useEditorStore((s) => s.canvasSize);
  const update = (props) => useEditorStore.getState().updateElement(el.id, props);

  return (
    <div className="flex items-center gap-0.5 flex-shrink-0">
      <ToolBtn title="Align left" onClick={() => update(alignLeft(el))}>
        <AlignStartHorizontal className="w-4 h-4" />
      </ToolBtn>
      <ToolBtn title="Center horizontal" onClick={() => update(alignCenterH(el, canvasSize))}>
        <AlignCenterHorizontal className="w-4 h-4" />
      </ToolBtn>
      <ToolBtn title="Align right" onClick={() => update(alignRight(el, canvasSize))}>
        <AlignEndHorizontal className="w-4 h-4" />
      </ToolBtn>
      <ToolBtn title="Align top" onClick={() => update(alignTop(el))}>
        <AlignStartVertical className="w-4 h-4" />
      </ToolBtn>
      <ToolBtn title="Center vertical" onClick={() => update(alignCenterV(el, canvasSize))}>
        <AlignCenterVertical className="w-4 h-4" />
      </ToolBtn>
      <ToolBtn title="Align bottom" onClick={() => update(alignBottom(el, canvasSize))}>
        <AlignEndVertical className="w-4 h-4" />
      </ToolBtn>
      <ToolBtn title="Center on canvas" onClick={() => update(alignMiddle(el, canvasSize))}>
        <Maximize2 className="w-4 h-4" />
      </ToolBtn>
    </div>
  );
};

const PositionPopover = ({ el }) => {
  const [open, setOpen] = useState(false);
  const update = useEditorStore((s) => s.updateElement);

  return (
    <div className="relative">
      <ToolBtn onClick={() => setOpen((o) => !o)} title="Position & size" active={open}>
        <Crosshair className="w-4 h-4" />
      </ToolBtn>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden="true" />
          <div className="absolute right-0 top-10 z-50 bg-white rounded-xl shadow-2xl border border-gray-200 p-4 w-52">
            <p className="text-xs font-semibold text-gray-700 mb-3">Position & Size</p>
            <div className="grid grid-cols-2 gap-2">
              <NumberInput
                label="X"
                value={Math.round(el.x)}
                onChange={(v) => update(el.id, { x: v })}
                width="w-16"
              />
              <NumberInput
                label="Y"
                value={Math.round(el.y)}
                onChange={(v) => update(el.id, { y: v })}
                width="w-16"
              />
              <NumberInput
                label="W"
                value={Math.round(el.width)}
                onChange={(v) => update(el.id, { width: Math.max(10, v) })}
                min={10}
                width="w-16"
              />
              <NumberInput
                label="H"
                value={Math.round(el.height)}
                onChange={(v) => update(el.id, { height: Math.max(10, v) })}
                min={10}
                width="w-16"
              />
              <NumberInput
                label="°"
                value={Math.round(el.rotation || 0)}
                onChange={(v) => update(el.id, { rotation: v })}
                min={-360}
                max={360}
                width="w-16"
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

function DefaultToolbar() {
  const canvasSize = useEditorStore((s) => s.canvasSize);
  const zoom = useEditorStore((s) => s.zoom);
  const setZoom = useEditorStore((s) => s.setZoom);
  const zoomIn = useEditorStore((s) => s.zoomIn);
  const zoomOut = useEditorStore((s) => s.zoomOut);
  const fitToScreen = useEditorStore((s) => s.fitToScreen);
  const showGrid = useEditorStore((s) => s.showGrid);
  const toggleGrid = useEditorStore((s) => s.toggleGrid);
  const showRulers = useEditorStore((s) => s.showRulers);
  const toggleRulers = useEditorStore((s) => s.toggleRulers);
  const snapEnabled = useEditorStore((s) => s.snapEnabled);
  const toggleSnap = useEditorStore((s) => s.toggleSnap);
  const pages = useEditorStore((s) => s.pages);
  const currentPageId = useEditorStore((s) => s.currentPageId);
  const drawMode = useEditorStore((s) => s.drawMode);
  const setDrawMode = useEditorStore((s) => s.setDrawMode);
  const drawColor = useEditorStore((s) => s.drawColor);
  const setDrawColor = useEditorStore((s) => s.setDrawColor);
  const drawSize = useEditorStore((s) => s.drawSize);
  const setDrawSize = useEditorStore((s) => s.setDrawSize);

  const currentPageIndex = pages.findIndex((p) => p.id === currentPageId) + 1;

  if (drawMode) {
    return (
      <div className="h-12 px-4 flex items-center gap-2 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-2">
          <Pencil className="w-4 h-4 text-purple-600" />
          <span className="text-sm font-medium text-purple-600">Drawing Mode</span>
        </div>
        <Divider />
        <div className="flex flex-col items-center">
          <ColorPickerBtn
            color={drawColor}
            onChange={setDrawColor}
            title="Draw color"
          />
          <span className="text-[10px] text-gray-500">Color</span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xs text-gray-500">Size</span>
          <input
            type="range"
            min={1}
            max={40}
            value={drawSize}
            onChange={(e) => setDrawSize(Number(e.target.value))}
            className="w-24 accent-purple-600 cursor-pointer"
          />
          <span className="text-xs text-gray-600 w-6">{drawSize}px</span>
        </div>
        <Divider />
        <button
          type="button"
          onClick={() => setDrawMode(false)}
          className="px-3 py-1.5 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
        >
          Done Drawing
        </button>
        <div className="ml-auto text-xs text-gray-500">
          Page {currentPageIndex} of {pages.length}
        </div>
      </div>
    );
  }

  return (
    <div className="h-12 px-4 flex items-center gap-2 border-b border-gray-200 bg-white">
      <span className="text-xs text-gray-600 flex-shrink-0">
        {canvasSize.width} × {canvasSize.height}
      </span>
      <Divider />
      <ToolBtn onClick={zoomOut} title="Zoom out">
        <Minus className="w-4 h-4" />
      </ToolBtn>
      <button
        type="button"
        onClick={() => setZoom(1)}
        className="text-xs text-gray-600 hover:text-purple-600 min-w-[3rem] px-1"
        title="Reset to 100%"
      >
        {Math.round(zoom * 100)}%
      </button>
      <ToolBtn onClick={zoomIn} title="Zoom in">
        <Plus className="w-4 h-4" />
      </ToolBtn>
      <ToolBtn onClick={fitToScreen} title="Fit to screen">
        <Maximize2 className="w-4 h-4" />
      </ToolBtn>
      <Divider />
      <ToolBtn onClick={toggleGrid} title="Toggle grid" active={showGrid}>
        <Grid3X3 className="w-4 h-4" />
      </ToolBtn>
      <ToolBtn onClick={toggleRulers} title="Toggle rulers" active={showRulers}>
        <Ruler className="w-4 h-4" />
      </ToolBtn>
      <ToolBtn onClick={toggleSnap} title="Toggle snap to guides" active={snapEnabled}>
        <Magnet className="w-4 h-4" />
      </ToolBtn>
      <div className="ml-auto text-xs text-gray-500">
        Page {currentPageIndex} of {pages.length}
      </div>
    </div>
  );
}

function TextToolbar({ el, update }) {
  const toggleBold = () => {
    const fs = el.fontStyle || "normal";
    const hasBold = fs.includes("bold");
    const hasItalic = fs.includes("italic");
    if (hasBold) update({ fontStyle: hasItalic ? "italic" : "normal" });
    else update({ fontStyle: hasItalic ? "bold italic" : "bold" });
  };
  const toggleItalic = () => {
    const fs = el.fontStyle || "normal";
    const hasBold = fs.includes("bold");
    const hasItalic = fs.includes("italic");
    if (hasItalic) update({ fontStyle: hasBold ? "bold" : "normal" });
    else update({ fontStyle: hasBold ? "bold italic" : "italic" });
  };
  const toggleUnderline = () => {
    update({ textDecoration: el.textDecoration === "underline" ? "" : "underline" });
  };

  return (
    <div className="h-12 px-4 flex items-center gap-2 border-b border-gray-200 bg-white">
      <SelectInput
        value={el.fontFamily || "Inter"}
        onChange={(v) => update({ fontFamily: v })}
        width="w-36"
        options={FONT_OPTIONS}
      />
      <NumberInput
        value={el.fontSize || 24}
        onChange={(v) => update({ fontSize: v })}
        min={6}
        max={400}
        step={1}
        width="w-14"
      />
      <Divider />
      <ToolBtn onClick={toggleBold} active={(el.fontStyle || "").includes("bold")} title="Bold">
        <Bold className="w-4 h-4" />
      </ToolBtn>
      <ToolBtn onClick={toggleItalic} active={(el.fontStyle || "").includes("italic")} title="Italic">
        <Italic className="w-4 h-4" />
      </ToolBtn>
      <ToolBtn onClick={toggleUnderline} active={el.textDecoration === "underline"} title="Underline">
        <Underline className="w-4 h-4" />
      </ToolBtn>
      <Divider />
      <ToolBtn onClick={() => update({ align: "left" })} active={el.align === "left"} title="Align left">
        <AlignLeft className="w-4 h-4" />
      </ToolBtn>
      <ToolBtn onClick={() => update({ align: "center" })} active={el.align === "center"} title="Align center">
        <AlignCenter className="w-4 h-4" />
      </ToolBtn>
      <ToolBtn onClick={() => update({ align: "right" })} active={el.align === "right"} title="Align right">
        <AlignRight className="w-4 h-4" />
      </ToolBtn>
      <Divider />
      <div className="flex flex-col items-center">
        <ColorPickerBtn
          color={el.fill || "#1e293b"}
          onChange={(c) => update({ fill: c })}
          title="Text color"
        />
        <span className="text-[10px] text-gray-500">Color</span>
      </div>
      <Divider />
      <NumberInput
        label="Line"
        value={el.lineHeight ?? 1.2}
        onChange={(v) => update({ lineHeight: v })}
        min={0.5}
        max={5}
        step={0.1}
        width="w-14"
      />
      <NumberInput
        label="Letter"
        value={el.letterSpacing ?? 0}
        onChange={(v) => update({ letterSpacing: v })}
        min={-20}
        max={100}
        step={1}
        width="w-14"
      />
      <Divider />
      <AlignmentGroup el={el} />
      <Divider />
      <OpacityControl value={el.opacity} onChange={(v) => update({ opacity: v })} />
      <div className="ml-auto">
        <PositionPopover el={el} />
      </div>
    </div>
  );
}

function ShapeToolbar({ el, update }) {
  const moveElementUp = useEditorStore((s) => s.moveElementUp);
  const moveElementDown = useEditorStore((s) => s.moveElementDown);

  return (
    <div className="h-12 px-4 flex items-center gap-2 border-b border-gray-200 bg-white">
      <div className="flex flex-col items-center">
        <ColorPickerBtn
          color={el.fill || "#c084fc"}
          onChange={(c) => update({ fill: c })}
          title="Fill color"
        />
        <span className="text-[10px] text-gray-500">Fill</span>
      </div>
      <div className="flex flex-col items-center">
        <ColorPickerBtn
          color={el.stroke || "#000000"}
          onChange={(c) => update({ stroke: c })}
          title="Stroke color"
        />
        <span className="text-[10px] text-gray-500">Stroke</span>
      </div>
      <NumberInput
        label="Stroke"
        value={el.strokeWidth ?? 0}
        onChange={(v) => update({ strokeWidth: v })}
        min={0}
        max={50}
        step={1}
        width="w-14"
      />
      <Divider />
      {el.type === "rect" && (
        <>
          <NumberInput
            label="Radius"
            value={el.cornerRadius ?? 0}
            onChange={(v) => update({ cornerRadius: v })}
            min={0}
            max={200}
            step={1}
            width="w-14"
          />
          <Divider />
        </>
      )}
      <OpacityControl value={el.opacity} onChange={(v) => update({ opacity: v })} />
      <Divider />
      <AlignmentGroup el={el} />
      <Divider />
      <ToolBtn
        onClick={() => update({ scaleX: (el.scaleX || 1) * -1 })}
        title="Flip horizontal"
      >
        <FlipHorizontal2 className="w-4 h-4" />
      </ToolBtn>
      <ToolBtn
        onClick={() => update({ scaleY: (el.scaleY || 1) * -1 })}
        title="Flip vertical"
      >
        <FlipVertical2 className="w-4 h-4" />
      </ToolBtn>
      <Divider />
      <ToolBtn onClick={() => moveElementUp(el.id)} title="Bring forward">
        <BringToFront className="w-4 h-4" />
      </ToolBtn>
      <ToolBtn onClick={() => moveElementDown(el.id)} title="Send backward">
        <SendToBack className="w-4 h-4" />
      </ToolBtn>
      <div className="ml-auto">
        <PositionPopover el={el} />
      </div>
    </div>
  );
}

function DrawingToolbar({ el, update }) {
  const deleteElement = useEditorStore((s) => s.deleteElement);

  return (
    <div className="h-12 px-4 flex items-center gap-2 border-b border-gray-200 bg-white">
      <div className="flex items-center gap-2">
        <Pencil className="w-4 h-4 text-purple-600" />
        <span className="text-sm font-medium text-gray-700">Drawing</span>
      </div>
      <Divider />
      <div className="flex flex-col items-center">
        <ColorPickerBtn
          color={el.fill || "#1e293b"}
          onChange={(c) => update({ fill: c })}
          title="Drawing color"
        />
        <span className="text-[10px] text-gray-500">Color</span>
      </div>
      <OpacityControl value={el.opacity} onChange={(v) => update({ opacity: v })} />
      <Divider />
      <ToolBtn onClick={() => deleteElement(el.id)} title="Delete">
        <Trash2 className="w-4 h-4 text-red-500" />
      </ToolBtn>
    </div>
  );
}

function ImageToolbar({ el, update }) {
  const fileInputRef = useRef(null);
  const bringToFront = useEditorStore((s) => s.bringToFront);
  const sendToBack = useEditorStore((s) => s.sendToBack);
  const croppingId = useEditorStore((s) => s.croppingId);
  const setCroppingId = useEditorStore((s) => s.setCroppingId);
  const setSelectedIds = useEditorStore((s) => s.setSelectedIds);

  const handleReplace = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    try {
      const { src } = await compressImage(file);
      update({ src });
    } catch (err) {
      console.error(err);
    }
    e.target.value = "";
  };

  const toggleGrayscale = () => {
    const filters = el.filters || [];
    const has = filters.includes("grayscale");
    update({ filters: has ? filters.filter((f) => f !== "grayscale") : [...filters, "grayscale"] });
  };

  return (
    <div className="h-12 px-4 flex items-center gap-2 border-b border-gray-200 bg-white">
      <OpacityControl value={el.opacity} onChange={(v) => update({ opacity: v })} />
      <Divider />
      <AlignmentGroup el={el} />
      <Divider />
      <ToolBtn
        onClick={() => update({ scaleX: (el.scaleX || 1) * -1 })}
        title="Flip horizontal"
      >
        <FlipHorizontal2 className="w-4 h-4" />
      </ToolBtn>
      <ToolBtn
        onClick={() => update({ scaleY: (el.scaleY || 1) * -1 })}
        title="Flip vertical"
      >
        <FlipVertical2 className="w-4 h-4" />
      </ToolBtn>
      <Divider />
      <ToolBtn onClick={toggleGrayscale} active={el.filters?.includes("grayscale")} title="Grayscale">
        <span className="text-xs font-medium">Grayscale</span>
      </ToolBtn>
      <ToolBtn
        onClick={() => update({ brightness: Math.min(1, (el.brightness || 0) + 0.1) })}
        title="Brightness +"
      >
        <span className="text-xs">Bright+</span>
      </ToolBtn>
      <ToolBtn
        onClick={() => update({ brightness: Math.max(-1, (el.brightness || 0) - 0.1) })}
        title="Brightness -"
      >
        <span className="text-xs">Bright-</span>
      </ToolBtn>
      <ToolBtn
        onClick={() => update({ contrast: Math.min(100, (el.contrast || 0) + 10) })}
        title="Contrast +"
      >
        <span className="text-xs">Contrast+</span>
      </ToolBtn>
      <ToolBtn
        onClick={() => update({ contrast: Math.max(-100, (el.contrast || 0) - 10) })}
        title="Contrast -"
      >
        <span className="text-xs">Contrast-</span>
      </ToolBtn>
      <Divider />
      <ToolBtn
        title="Crop image"
        active={croppingId === el.id}
        onClick={() => {
          if (croppingId === el.id) {
            setCroppingId(null);
          } else {
            setCroppingId(el.id);
            setSelectedIds([el.id]);
          }
        }}
      >
        <Crop className="w-4 h-4" />
        <span className="text-xs ml-1">Crop</span>
      </ToolBtn>
      <Divider />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleReplace}
      />
      <ToolBtn
        onClick={() => fileInputRef.current?.click()}
        title="Replace image"
      >
        <RefreshCw className="w-4 h-4" />
        <span className="text-xs ml-1">Replace</span>
      </ToolBtn>
      <Divider />
      <ToolBtn onClick={() => bringToFront(el.id)} title="Bring to front">
        <BringToFront className="w-4 h-4" />
      </ToolBtn>
      <ToolBtn onClick={() => sendToBack(el.id)} title="Send to back">
        <SendToBack className="w-4 h-4" />
      </ToolBtn>
      <div className="ml-auto">
        <PositionPopover el={el} />
      </div>
    </div>
  );
}

function MultiAlignmentGroup() {
  const selectedIds = useEditorStore((s) => s.selectedIds);
  const pages = useEditorStore((s) => s.pages);
  const currentPageId = useEditorStore((s) => s.currentPageId);
  const updateElement = useEditorStore((s) => s.updateElement);

  const getElements = () => {
    const page = pages.find((p) => p.id === currentPageId);
    return page?.elements.filter((e) => selectedIds.includes(e.id)) || [];
  };

  const alignAll = (fn) => {
    const els = getElements();
    els.forEach((el) => {
      const newProps = fn(el, els);
      if (newProps) updateElement(el.id, newProps);
    });
  };

  const leftMost = () => {
    const els = getElements();
    const minX = Math.min(...els.map((e) => e.x));
    alignAll(() => ({ x: minX }));
  };

  const rightMost = () => {
    const els = getElements();
    const maxX = Math.max(...els.map((e) => e.x + (e.width || 0)));
    alignAll((el) => ({ x: maxX - (el.width || 0) }));
  };

  const topMost = () => {
    const els = getElements();
    const minY = Math.min(...els.map((e) => e.y));
    alignAll(() => ({ y: minY }));
  };

  const bottomMost = () => {
    const els = getElements();
    const maxY = Math.max(...els.map((e) => e.y + (e.height || 0)));
    alignAll((el) => ({ y: maxY - (el.height || 0) }));
  };

  const distributeH = () => {
    const els = [...getElements()].sort((a, b) => a.x - b.x);
    if (els.length < 2) return;
    const totalWidth = els.reduce((sum, e) => sum + (e.width || 0), 0);
    const span = els[els.length - 1].x + (els[els.length - 1].width || 0) - els[0].x;
    const gap = (span - totalWidth) / (els.length - 1);
    let cursor = els[0].x;
    els.forEach((el) => {
      updateElement(el.id, { x: cursor });
      cursor += (el.width || 0) + gap;
    });
  };

  const distributeV = () => {
    const els = [...getElements()].sort((a, b) => a.y - b.y);
    if (els.length < 2) return;
    const totalHeight = els.reduce((sum, e) => sum + (e.height || 0), 0);
    const span = els[els.length - 1].y + (els[els.length - 1].height || 0) - els[0].y;
    const gap = (span - totalHeight) / (els.length - 1);
    let cursor = els[0].y;
    els.forEach((el) => {
      updateElement(el.id, { y: cursor });
      cursor += (el.height || 0) + gap;
    });
  };

  return (
    <div className="flex items-center gap-0.5">
      <ToolBtn title="Align left edges" onClick={leftMost}>
        <AlignStartHorizontal className="w-4 h-4" />
      </ToolBtn>
      <ToolBtn title="Align right edges" onClick={rightMost}>
        <AlignEndHorizontal className="w-4 h-4" />
      </ToolBtn>
      <ToolBtn title="Align top edges" onClick={topMost}>
        <AlignStartVertical className="w-4 h-4" />
      </ToolBtn>
      <ToolBtn title="Align bottom edges" onClick={bottomMost}>
        <AlignEndVertical className="w-4 h-4" />
      </ToolBtn>
      <ToolBtn title="Distribute horizontally" onClick={distributeH}>
        <AlignHorizontalDistributeCenter className="w-4 h-4" />
      </ToolBtn>
      <ToolBtn title="Distribute vertically" onClick={distributeV}>
        <AlignVerticalDistributeCenter className="w-4 h-4" />
      </ToolBtn>
    </div>
  );
}

function MultiSelectToolbar() {
  const selectedIds = useEditorStore((s) => s.selectedIds);
  const groupSelected = useEditorStore((s) => s.groupSelected);
  const duplicateSelected = useEditorStore((s) => s.duplicateSelected);
  const deleteSelected = useEditorStore((s) => s.deleteSelected);
  const count = selectedIds.length;

  return (
    <div className="h-12 bg-white border-b border-gray-200 flex items-center px-4 gap-2">
      <span className="text-xs text-gray-500 font-medium flex-shrink-0">
        {count} elements selected
      </span>
      <Divider />
      <ToolBtn onClick={groupSelected} title="Group elements (Ctrl+G)">
        <Group className="w-4 h-4" />
        <span className="text-xs ml-1">Group</span>
      </ToolBtn>
      <Divider />
      <MultiAlignmentGroup />
      <Divider />
      <ToolBtn onClick={duplicateSelected} title="Duplicate all (Ctrl+D)">
        <Copy className="w-4 h-4" />
      </ToolBtn>
      <ToolBtn onClick={deleteSelected} title="Delete all (Delete)">
        <Trash2 className="w-4 h-4 text-red-500" />
      </ToolBtn>
    </div>
  );
}

function GroupToolbar({ el, update }) {
  const ungroupSelected = useEditorStore((s) => s.ungroupSelected);
  const duplicateElement = useEditorStore((s) => s.duplicateElement);
  const deleteElement = useEditorStore((s) => s.deleteElement);

  return (
    <div className="h-12 bg-white border-b border-gray-200 flex items-center px-4 gap-2">
      <span className="text-xs text-gray-500 font-medium">Group</span>
      <Divider />
      <ToolBtn onClick={ungroupSelected} title="Ungroup (Ctrl+Shift+G)">
        <Ungroup className="w-4 h-4" />
        <span className="text-xs ml-1">Ungroup</span>
      </ToolBtn>
      <Divider />
      <OpacityControl value={el.opacity} onChange={(v) => update({ opacity: v })} />
      <Divider />
      <AlignmentGroup el={el} />
      <Divider />
      <ToolBtn onClick={() => duplicateElement(el.id)} title="Duplicate">
        <Copy className="w-4 h-4" />
      </ToolBtn>
      <ToolBtn onClick={() => deleteElement(el.id)} title="Delete">
        <Trash2 className="w-4 h-4 text-red-500" />
      </ToolBtn>
    </div>
  );
}

export default function Toolbar() {
  const selectedId = useEditorStore((s) => s.selectedId);
  const selectedIds = useEditorStore((s) => s.selectedIds);
  const selectedElement = useEditorStore((s) => s.getSelectedElement());
  const update = (props) => useEditorStore.getState().updateElement(selectedElement?.id, props);

  if (selectedIds.length > 1) return <MultiSelectToolbar />;
  if (!selectedElement) return <DefaultToolbar />;
  if (selectedElement.type === "chart") return <ChartToolbar el={selectedElement} />;
  if (selectedElement.type === "drawing") return <DrawingToolbar el={selectedElement} update={update} />;
  if (selectedElement.type === "text") return <TextToolbar el={selectedElement} update={update} />;
  if (selectedElement.type === "image") return <ImageToolbar el={selectedElement} update={update} />;
  if (selectedElement.type === "group") return <GroupToolbar el={selectedElement} update={update} />;
  return <ShapeToolbar el={selectedElement} update={update} />;
}
