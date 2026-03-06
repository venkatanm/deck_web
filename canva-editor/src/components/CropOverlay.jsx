import { useState, useEffect } from "react";
import useEditorStore from "../store/useEditorStore";

export default function CropOverlay() {
  const croppingId = useEditorStore((s) => s.croppingId);
  const setCroppingId = useEditorStore((s) => s.setCroppingId);
  const applyCrop = useEditorStore((s) => s.applyCrop);
  const pages = useEditorStore((s) => s.pages);
  const currentPageId = useEditorStore((s) => s.currentPageId);
  const zoom = useEditorStore((s) => s.zoom);

  const page = (pages || []).find((p) => p.id === currentPageId);
  const el = (page?.elements || []).find((e) => e.id === croppingId);

  const [crop, setCrop] = useState(null);

  useEffect(() => {
    if (!el) return;
    const baseX = el.cropX ?? 0;
    const baseY = el.cropY ?? 0;
    const baseW = el.cropWidth ?? el.width;
    const baseH = el.cropHeight ?? el.height;
    setCrop({
      x: 0,
      y: 0,
      width: baseW,
      height: baseH,
      baseX,
      baseY,
    });
  }, [croppingId, el?.id]);

  if (!croppingId || !el || !crop) return null;

  const imgScreenX = el.x * zoom;
  const imgScreenY = el.y * zoom;
  const imgScreenW = el.width * zoom;
  const imgScreenH = el.height * zoom;

  const cropScreenX = imgScreenX + crop.x * zoom;
  const cropScreenY = imgScreenY + crop.y * zoom;
  const cropScreenW = crop.width * zoom;
  const cropScreenH = crop.height * zoom;

  const handleApply = () => {
    const baseX = crop.baseX ?? el.cropX ?? 0;
    const baseY = crop.baseY ?? el.cropY ?? 0;
    applyCrop(croppingId, {
      x: baseX + crop.x,
      y: baseY + crop.y,
      width: crop.width,
      height: crop.height,
    });
  };
  const handleCancel = () => setCroppingId(null);

  const imgW = el.width;
  const imgH = el.height;

  const handleResize = (pos, startX, startY, startCrop) => (me) => {
    const dx = (me.clientX - startX) / zoom;
    const dy = (me.clientY - startY) / zoom;
    setCrop((prev) => {
      let { x, y, width, height, baseX, baseY } = startCrop;
      if (pos.includes("e")) width = Math.max(20, startCrop.width + dx);
      if (pos.includes("s")) height = Math.max(20, startCrop.height + dy);
      if (pos.includes("w")) {
        x = Math.max(0, Math.min(startCrop.x + dx, startCrop.x + startCrop.width - 20));
        width = startCrop.width - (x - startCrop.x);
      }
      if (pos.includes("n")) {
        y = Math.max(0, Math.min(startCrop.y + dy, startCrop.y + startCrop.height - 20));
        height = startCrop.height - (y - startCrop.y);
      }
      width = Math.min(width, imgW - x);
      height = Math.min(height, imgH - y);
      return { ...prev, x, y, width, height, baseX, baseY };
    });
  };

  const handles = [
    { pos: "nw", style: { top: -5, left: -5, cursor: "nw-resize" } },
    { pos: "n", style: { top: -5, left: "50%", cursor: "n-resize", transform: "translateX(-50%)" } },
    { pos: "ne", style: { top: -5, right: -5, cursor: "ne-resize" } },
    { pos: "e", style: { top: "50%", right: -5, cursor: "e-resize", transform: "translateY(-50%)" } },
    { pos: "se", style: { bottom: -5, right: -5, cursor: "se-resize" } },
    { pos: "s", style: { bottom: -5, left: "50%", cursor: "s-resize", transform: "translateX(-50%)" } },
    { pos: "sw", style: { bottom: -5, left: -5, cursor: "sw-resize" } },
    { pos: "w", style: { top: "50%", left: -5, cursor: "w-resize", transform: "translateY(-50%)" } },
  ];

  return (
    <div className="absolute inset-0 z-30 pointer-events-none">
      <div className="absolute inset-0 pointer-events-auto" style={{ cursor: "crosshair" }}>
        {/* Dark overlay — 4 rects around the crop area */}
        <div
          className="absolute bg-black/50"
          style={{
            left: imgScreenX,
            top: imgScreenY,
            width: imgScreenW,
            height: Math.max(0, cropScreenY - imgScreenY),
          }}
        />
        <div
          className="absolute bg-black/50"
          style={{
            left: imgScreenX,
            top: cropScreenY + cropScreenH,
            width: imgScreenW,
            height: Math.max(0, imgScreenY + imgScreenH - cropScreenY - cropScreenH),
          }}
        />
        <div
          className="absolute bg-black/50"
          style={{
            left: imgScreenX,
            top: cropScreenY,
            width: Math.max(0, cropScreenX - imgScreenX),
            height: cropScreenH,
          }}
        />
        <div
          className="absolute bg-black/50"
          style={{
            left: cropScreenX + cropScreenW,
            top: cropScreenY,
            width: Math.max(0, imgScreenX + imgScreenW - cropScreenX - cropScreenW),
            height: cropScreenH,
          }}
        />

        {/* Crop rect border - draggable */}
        <div
          className="absolute border-2 border-white pointer-events-auto cursor-move"
          style={{
            left: cropScreenX,
            top: cropScreenY,
            width: cropScreenW,
            height: cropScreenH,
            boxShadow: "0 0 0 1px rgba(0,0,0,0.3)",
          }}
          onMouseDown={(e) => {
            if (e.target !== e.currentTarget) return;
            e.stopPropagation();
            const startX = e.clientX;
            const startY = e.clientY;
            const startCrop = { ...crop };
            const onMove = (me) => {
              const dx = (me.clientX - startX) / zoom;
              const dy = (me.clientY - startY) / zoom;
              setCrop((prev) => {
                let x = Math.max(0, Math.min(startCrop.x + dx, imgW - startCrop.width));
                let y = Math.max(0, Math.min(startCrop.y + dy, imgH - startCrop.height));
                return { ...prev, x, y };
              });
            };
            const onUp = () => {
              window.removeEventListener("mousemove", onMove);
              window.removeEventListener("mouseup", onUp);
            };
            window.addEventListener("mousemove", onMove);
            window.addEventListener("mouseup", onUp);
          }}
        >
          {/* Rule of thirds grid */}
          <div className="absolute inset-0 pointer-events-none">
            {[1, 2].map((i) => (
              <div
                key={`v${i}`}
                className="absolute top-0 bottom-0 border-r border-white/30"
                style={{ left: `${i * 33.33}%` }}
              />
            ))}
            {[1, 2].map((i) => (
              <div
                key={`h${i}`}
                className="absolute left-0 right-0 border-b border-white/30"
                style={{ top: `${i * 33.33}%` }}
              />
            ))}
          </div>

          {/* 8 resize handles */}
          {handles.map(({ pos, style }) => (
            <div
              key={pos}
              className="absolute w-3 h-3 bg-white border border-gray-400 rounded-sm shadow pointer-events-auto"
              style={{ ...style, position: "absolute" }}
              onMouseDown={(e) => {
                e.stopPropagation();
                const startX = e.clientX;
                const startY = e.clientY;
                const startCrop = { ...crop };
                const onMove = handleResize(pos, startX, startY, startCrop);
                const onUp = () => {
                  window.removeEventListener("mousemove", onMove);
                  window.removeEventListener("mouseup", onUp);
                };
                window.addEventListener("mousemove", onMove);
                window.addEventListener("mouseup", onUp);
              }}
            />
          ))}
        </div>

        {/* Action buttons */}
        <div
          className="absolute flex gap-2 pointer-events-auto"
          style={{
            left: cropScreenX,
            top: cropScreenY + cropScreenH + 10,
          }}
        >
          <button
            type="button"
            onClick={handleApply}
            className="bg-purple-600 text-white text-xs font-medium px-4 py-1.5 rounded-lg shadow-lg hover:bg-purple-700"
          >
            Apply Crop
          </button>
          <button
            type="button"
            onClick={handleCancel}
            className="bg-white text-gray-700 text-xs font-medium px-4 py-1.5 rounded-lg shadow-lg hover:bg-gray-50 border border-gray-200"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
