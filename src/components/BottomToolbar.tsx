/**
 * BottomToolbar - Page navigation, zoom, and view controls.
 * Notes, Timer, page thumbnails, Add slide, zoom slider, full screen.
 */

import { useState } from "react";
import { FileText, Clock, Plus, Grid3X3, Maximize2 } from "lucide-react";
import type { Slide } from "@deck-web/schema";
import { colorRefToCssValue } from "@deck-web/schema";
import { usePresentationStore } from "../store/usePresentationStore";
import { svgToResponsive } from "../utils/iconUtils";
import type { CanvasElement } from "@deck-web/schema";

interface BottomToolbarProps {
  zoom: number;
  onZoomChange: (zoom: number) => void;
}

function MiniThumbnail({ slide }: { slide: Slide }) {
  return (
    <div
      style={{
        width: 80,
        aspectRatio: "16/9",
        borderRadius: 4,
        overflow: "hidden",
        background: "#fff",
        border: "1px solid #e2e8f0",
        position: "relative",
      }}
    >
      {slide.elements.slice(0, 5).map((el) => (
        <MiniElementPreview key={el.id} element={el} />
      ))}
    </div>
  );
}

function MiniElementPreview({ element }: { element: CanvasElement }) {
  const { transform } = element;
  return (
    <div
      style={{
        position: "absolute",
        left: `${transform.x * 100}%`,
        top: `${transform.y * 100}%`,
        width: `${transform.w * 100}%`,
        height: `${transform.h * 100}%`,
        background:
          element.type === "shape"
            ? colorRefToCssValue(element.fillColor ?? "accent1")
            : "transparent",
        overflow: "hidden",
        pointerEvents: "none",
      }}
    >
      {element.type === "text" && (
        <span
          style={{
            fontSize: 6,
            color: colorRefToCssValue(element.color ?? "dk1"),
            overflow: "hidden",
            textOverflow: "ellipsis",
            display: "block",
          }}
        >
          {element.content?.slice(0, 10) || ""}
        </span>
      )}
      {element.type === "icon" && (
        <div
          style={{ width: "100%", height: "100%" }}
          dangerouslySetInnerHTML={{ __html: svgToResponsive(element.svgData) }}
        />
      )}
    </div>
  );
}

export function BottomToolbar({ zoom, onZoomChange }: BottomToolbarProps) {
  const [showNotes, setShowNotes] = useState(false);
  const {
    presentation,
    currentSlideId,
    selectSlide,
    addSlide,
  } = usePresentationStore();

  const currentIndex = presentation.slides.findIndex(
    (s) => s.id === currentSlideId
  );
  const currentPage = currentIndex >= 0 ? currentIndex + 1 : 1;
  const totalPages = presentation.slides.length;

  return (
    <div
      style={{
        height: 56,
        flexShrink: 0,
        background: "#fff",
        borderTop: "1px solid #e2e8f0",
        display: "flex",
        alignItems: "center",
        padding: "0 16px",
        gap: 24,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <button
          type="button"
          onClick={() => setShowNotes(!showNotes)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "6px 10px",
            fontSize: 13,
            color: "#475569",
            background: "transparent",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
          }}
          title="Notes"
        >
          <FileText size={18} />
          Notes
        </button>
        <button
          type="button"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "6px 10px",
            fontSize: 13,
            color: "#475569",
            background: "transparent",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
          }}
          title="Timer"
        >
          <Clock size={18} />
          Timer
        </button>
      </div>

      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
        }}
      >
        {currentIndex > 0 && (
          <button
            type="button"
            onClick={() =>
              selectSlide(presentation.slides[currentIndex - 1]!.id)
            }
            style={{ padding: 4, background: "transparent", border: "none", cursor: "pointer" }}
          >
            <MiniThumbnail slide={presentation.slides[currentIndex - 1]!} />
          </button>
        )}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "4px 12px",
            background: "#f8fafc",
            borderRadius: 8,
            border: "1px solid #e2e8f0",
          }}
        >
          <input
            type="number"
            value={currentPage}
            readOnly
            style={{
              width: 36,
              padding: "4px 0",
              fontSize: 13,
              fontWeight: 500,
              textAlign: "center",
              border: "none",
              background: "transparent",
              color: "#334155",
            }}
          />
          <button
            type="button"
            onClick={() => addSlide()}
            style={{
              padding: 4,
              background: "transparent",
              border: "none",
              borderRadius: 4,
              cursor: "pointer",
              color: "#64748b",
            }}
            title="Add slide"
          >
            <Plus size={18} />
          </button>
        </div>
        {currentIndex < totalPages - 1 && currentIndex >= 0 && (
          <button
            type="button"
            onClick={() =>
              selectSlide(presentation.slides[currentIndex + 1]!.id)
            }
            style={{ padding: 4, background: "transparent", border: "none", cursor: "pointer" }}
          >
            <MiniThumbnail slide={presentation.slides[currentIndex + 1]!} />
          </button>
        )}
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <input
          type="range"
          min={25}
          max={150}
          value={zoom}
          onChange={(e) => onZoomChange(Number(e.target.value))}
          style={{ width: 80, accentColor: "#8b5cf6" }}
        />
        <span style={{ fontSize: 13, color: "#64748b", minWidth: 40 }}>
          {zoom}%
        </span>
        <span style={{ fontSize: 13, color: "#64748b" }}>
          Pages {currentPage}/{totalPages}
        </span>
        <button
          type="button"
          style={{
            padding: 6,
            background: "transparent",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
            color: "#64748b",
          }}
          title="Grid view"
        >
          <Grid3X3 size={18} />
        </button>
        <button
          type="button"
          style={{
            padding: 6,
            background: "transparent",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
            color: "#64748b",
          }}
          title="Full screen"
        >
          <Maximize2 size={18} />
        </button>
      </div>
    </div>
  );
}
