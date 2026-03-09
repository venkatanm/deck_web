import { useEffect, useRef, useState } from "react";
import useEditorStore from "../store/useEditorStore";
import { pageToDataURL } from "../utils/exportCanvas";

const MINIMAP_WIDTH = 160;
const MINIMAP_HEIGHT = 110;

export default function MiniMap() {
  const [thumbnail, setThumbnail] = useState(null);
  const [visible, setVisible] = useState(true);
  const timerRef = useRef(null);

  const pages = useEditorStore((s) => s.pages);
  const currentPageId = useEditorStore((s) => s.currentPageId);
  const canvasSize = useEditorStore((s) => s.canvasSize);
  const zoom = useEditorStore((s) => s.zoom);

  const page = pages.find((p) => p.id === currentPageId);
  const elements = page?.elements || [];

  useEffect(() => {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      if (!page) return;
      try {
        const url = await pageToDataURL(page, canvasSize, 0.15, "image/jpeg");
        setThumbnail(url);
      } catch (e) {
        console.error("minimap error", e);
      }
    }, 800);
    return () => clearTimeout(timerRef.current);
  }, [JSON.stringify(elements), canvasSize, page]);

  const scaleX = MINIMAP_WIDTH / canvasSize.width;
  const scaleY = MINIMAP_HEIGHT / canvasSize.height;
  const vpW = Math.min(MINIMAP_WIDTH, (window.innerWidth / zoom) * scaleX);
  const vpH = Math.min(MINIMAP_HEIGHT, (window.innerHeight / zoom) * scaleY);

  if (!visible) {
    return (
      <button
        type="button"
        onClick={() => setVisible(true)}
        className="absolute bottom-4 right-4 z-20 rounded-lg px-2 py-1 text-xs text-velox-text-mid border"
      style={{ background: "var(--card2)", borderColor: "var(--border)" }}
      >
        Show map
      </button>
    );
  }

  return (
    <div
      className="absolute bottom-4 right-4 z-20 shadow-2xl rounded-xl overflow-hidden border"
      style={{ background: "var(--card2)", borderColor: "var(--border)", width: MINIMAP_WIDTH + 2, userSelect: "none" }}
    >
      <div className="flex items-center justify-between px-2 py-1 border-b" style={{ borderColor: "var(--border)" }}>
        <span className="text-[10px] text-velox-text-mid font-medium">Navigator</span>
        <button
          type="button"
          onClick={() => setVisible(false)}
          className="text-velox-text-lo hover:text-velox-text-hi text-xs leading-none"
        >
          ✕
        </button>
      </div>
      <div
        className="relative"
        style={{
          width: MINIMAP_WIDTH,
          height: MINIMAP_HEIGHT,
          background: "var(--bg)",
        }}
      >
        {thumbnail ? (
          <img
            src={thumbnail}
            alt="minimap"
            style={{
              width: MINIMAP_WIDTH,
              height: MINIMAP_HEIGHT,
              objectFit: "contain",
              display: "block",
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-[10px] text-velox-text-lo">Loading...</span>
          </div>
        )}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: Math.min(vpW, MINIMAP_WIDTH),
            height: Math.min(vpH, MINIMAP_HEIGHT),
            border: "1.5px solid #7c3aed",
            background: "rgba(124,58,237,0.08)",
            pointerEvents: "none",
            borderRadius: 2,
          }}
        />
      </div>
      <div className="px-2 py-1 flex items-center justify-between border-t" style={{ borderColor: "var(--border)" }}>
        <span className="text-[10px] text-velox-text-mid">{Math.round(zoom * 100)}%</span>
        <span className="text-[10px] text-velox-text-mid">
          {canvasSize.width} × {canvasSize.height}
        </span>
      </div>
    </div>
  );
}
