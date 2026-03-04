/**
 * CanvasToolbar - Contextual editing controls above the canvas.
 * Position, Rotate, Crop, Transparency, Lock, Duplicate, Delete.
 * Shown when elements are selected.
 */

import {
  AlignCenter,
  RotateCw,
  Crop,
  Lock,
  Copy,
  Trash2,
  Palette,
} from "lucide-react";

interface CanvasToolbarProps {
  hasSelection: boolean;
  onRotate: () => void;
  onCrop: () => void;
  onTransparency: () => void;
  onLock: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

export function CanvasToolbar({
  hasSelection,
  onRotate,
  onCrop,
  onTransparency,
  onLock,
  onDuplicate,
  onDelete,
}: CanvasToolbarProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 4,
        padding: "8px 12px",
        background: "#fff",
        border: "1px solid #e2e8f0",
        borderRadius: 8,
        marginBottom: 12,
        boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
      }}
    >
      <button
        type="button"
        title="Position"
        style={toolbarBtnStyle}
        disabled={!hasSelection}
      >
        <AlignCenter size={18} />
        <span style={{ fontSize: 12, marginLeft: 4 }}>Position</span>
      </button>
      <span style={{ width: 1, height: 20, background: "#e2e8f0" }} />
      <button
        type="button"
        onClick={onRotate}
        title="Rotate"
        style={toolbarBtnStyle}
        disabled={!hasSelection}
      >
        <RotateCw size={18} />
      </button>
      <button
        type="button"
        onClick={onCrop}
        title="Crop"
        style={toolbarBtnStyle}
        disabled={!hasSelection}
      >
        <Crop size={18} />
      </button>
      <button
        type="button"
        onClick={onTransparency}
        title="Transparency"
        style={toolbarBtnStyle}
        disabled={!hasSelection}
      >
        <span
          style={{
            width: 18,
            height: 18,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background:
              "repeating-conic-gradient(#e2e8f0 0% 25%, #fff 0% 50%) 50% / 12px 12px",
            borderRadius: 2,
          }}
        />
      </button>
      <button
        type="button"
        title="Color"
        style={toolbarBtnStyle}
        disabled={!hasSelection}
      >
        <Palette size={18} />
      </button>
      <span style={{ width: 1, height: 20, background: "#e2e8f0" }} />
      <button
        type="button"
        onClick={onLock}
        title="Lock"
        style={toolbarBtnStyle}
        disabled={!hasSelection}
      >
        <Lock size={18} />
      </button>
      <button
        type="button"
        onClick={onDuplicate}
        title="Duplicate"
        style={toolbarBtnStyle}
        disabled={!hasSelection}
      >
        <Copy size={18} />
      </button>
      <button
        type="button"
        onClick={onDelete}
        title="Delete"
        style={{ ...toolbarBtnStyle, color: "#dc2626" }}
        disabled={!hasSelection}
      >
        <Trash2 size={18} />
      </button>
    </div>
  );
}

const toolbarBtnStyle: React.CSSProperties = {
  padding: "6px 10px",
  background: "transparent",
  border: "none",
  borderRadius: 6,
  color: "#475569",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  transition: "all 0.15s",
};
toolbarBtnStyle.opacity = 1;
