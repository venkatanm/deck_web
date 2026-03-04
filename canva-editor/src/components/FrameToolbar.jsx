import React from "react";
import { Image as ImageIcon, X } from "lucide-react";
import useEditorStore from "../store/useEditorStore";
import { compressImage } from "../utils/compressImage";
import { saveImage } from "../utils/imageStorage";
import { v4 as uuidv4 } from "uuid";

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

const NumberInput = ({ label, value, onChange, min, max, width = 48 }) => (
  <div className="flex items-center gap-1 flex-shrink-0">
    {label && <span className="text-xs text-gray-500">{label}</span>}
    <input
      type="number"
      value={value ?? 0}
      min={min}
      max={max}
      onChange={(e) => {
        const v = Number(e.target.value);
        if (!Number.isNaN(v)) onChange(v);
      }}
      className="text-xs border border-gray-200 rounded-md px-2 py-1 text-center focus:outline-none focus:border-purple-400 w-14"
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

const FRAME_SHAPES = ["circle", "roundedRect", "hexagon", "diamond", "triangle"];

function FrameShapeIcon({ shape }) {
  const s = shape;
  if (s === "circle") return <div className="w-5 h-5 rounded-full border-2 border-current" />;
  if (s === "roundedRect") return <div className="w-5 h-5 rounded border-2 border-current" />;
  if (s === "hexagon") return <div className="w-5 h-5 border-2 border-current transform rotate-45" />;
  if (s === "diamond") return <div className="w-4 h-4 border-2 border-current transform rotate-45" />;
  if (s === "triangle") return <div className="w-0 h-0 border-l-[10px] border-r-[10px] border-t-[16px] border-l-transparent border-r-transparent border-t-current" />;
  return null;
}

export default function FrameToolbar({ el }) {
  const update = (props) =>
    useEditorStore.getState().updateElement(el.id, props);

  const pickImage = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        const { src } = await compressImage(file);
        const imageId = uuidv4();
        await saveImage(imageId, src, file.name, file.type);
        update({ src, imageId });
      } catch (err) {
        console.error("Frame image error", err);
      }
    };
    input.click();
  };

  return (
    <div className="h-12 bg-white border-b border-gray-200 flex items-center px-4 gap-2 overflow-x-auto">
      <span className="text-xs font-semibold text-purple-600 bg-purple-50 px-2 py-1 rounded-md flex-shrink-0">
        Frame
      </span>
      <Divider />

      <div className="flex gap-1 flex-shrink-0">
        {FRAME_SHAPES.map((shape) => (
          <ToolBtn
            key={shape}
            active={el.frameShape === shape}
            onClick={() => update({ frameShape: shape })}
            title={shape}
          >
            <FrameShapeIcon shape={shape} />
          </ToolBtn>
        ))}
      </div>

      <Divider />

      <ToolBtn onClick={pickImage} title="Set image">
        <ImageIcon className="w-4 h-4" />
        <span className="text-xs ml-1">Set Image</span>
      </ToolBtn>

      {el.src && (
        <>
          <NumberInput
            label="Pan X"
            value={el.imageOffsetX ?? 0}
            onChange={(v) => update({ imageOffsetX: v })}
            min={-500}
            max={500}
          />
          <NumberInput
            label="Pan Y"
            value={el.imageOffsetY ?? 0}
            onChange={(v) => update({ imageOffsetY: v })}
            min={-500}
            max={500}
          />
          <div className="flex items-center gap-1 flex-shrink-0">
            <span className="text-xs text-gray-500">Zoom</span>
            <input
              type="range"
              min={0.5}
              max={3}
              step={0.05}
              value={el.imageScale ?? 1}
              onChange={(e) =>
                update({ imageScale: Number(e.target.value) })
              }
              className="w-20 accent-purple-600"
              title={`Zoom: ${Math.round((el.imageScale ?? 1) * 100)}%`}
            />
          </div>
          <ToolBtn
            onClick={() => update({ src: null, imageId: null })}
            title="Remove image"
          >
            <X className="w-4 h-4 text-red-400" />
          </ToolBtn>
        </>
      )}

      <Divider />

      <ColorPickerBtn
        color={el.strokeColor || "#7c3aed"}
        onChange={(v) => update({ strokeColor: v })}
        title="Border"
      />
      <NumberInput
        label="Width"
        value={el.strokeWidth ?? 0}
        onChange={(v) => update({ strokeWidth: v })}
        min={0}
        max={20}
      />

      <Divider />
      <OpacityControl value={el.opacity} onChange={(v) => update({ opacity: v })} />
    </div>
  );
}
