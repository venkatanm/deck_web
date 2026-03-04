/**
 * SlideThumbnailSidebar - Read-only miniaturized preview of each slide.
 * Clicking a thumbnail selects that slide in the store.
 * Change Layout: dynamic grid from Slide Template Registry.
 */

import type { CanvasElement, LayoutId, Slide } from "@deck-web/schema";
import { colorRefToCssValue } from "@deck-web/schema";
import { usePresentationStore } from "../store/usePresentationStore";
import { svgToResponsive } from "../utils/iconUtils";
import { SLIDE_REGISTRY } from "../../shared/registry/SlideTemplates";
import * as LucideIcons from "lucide-react";

interface SlideThumbnailProps {
  slide: Slide;
  isSelected: boolean;
  onSelect: () => void;
}

function ElementPreview({ element }: { element: CanvasElement }) {
  const { transform } = element;
  const isCircle =
    element.type === "shape" &&
    (element.shapeType === "circle" || element.shapeType === "ellipse");
  return (
    <div
      style={{
        position: "absolute",
        left: `${transform.x * 100}%`,
        top: `${transform.y * 100}%`,
        width: `${transform.w * 100}%`,
        height: `${transform.h * 100}%`,
        background:
          element.type === "shape" ? colorRefToCssValue(element.fillColor ?? "accent1") : "transparent",
        border:
          element.type === "text" ||
          element.type === "image" ||
          element.type === "icon" ||
          element.type === "chart"
            ? "1px solid rgba(0,0,0,0.2)"
            : "1px solid rgba(0,0,0,0.15)",
        borderRadius: isCircle ? "50%" : 0,
        clipPath:
          element.type === "shape" && element.shapeType === "triangle"
            ? "polygon(50% 0%, 0% 100%, 100% 100%)"
            : undefined,
        overflow: "hidden",
        pointerEvents: "none",
      }}
    >
      {element.type === "text" && (
        <span
          style={{
            fontSize: "min(8px, 0.5em)",
            color: colorRefToCssValue(element.color ?? "dk1"),
            display: "block",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            padding: 1,
          }}
        >
          {element.content || " "}
        </span>
      )}
      {element.type === "image" && (
        <img
          src={element.src}
          alt=""
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
      )}
      {element.type === "icon" && (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          dangerouslySetInnerHTML={{ __html: svgToResponsive(element.svgData) }}
        />
      )}
      {element.type === "chart" && (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(30,41,59,0.5)",
            color: "#94a3b8",
            fontSize: "min(8px, 0.5em)",
          }}
        >
          Chart
        </div>
      )}
      {element.type === "group" && (
        <>
          {element.elements.map((el: CanvasElement) => (
            <ElementPreview key={el.id} element={el} />
          ))}
        </>
      )}
      {element.type === "smartContainer" && (
        <div
          style={{
            fontSize: "min(8px, 0.5em)",
            color: "#888",
            padding: 2,
          }}
        >
          {"placeholderRole" in element && element.placeholderRole === "body2"
            ? "[Body 2]"
            : "placeholderRole" in element && element.placeholderRole === "body3"
              ? "[Body 3]"
              : "placeholderRole" in element && element.placeholderRole
                ? "[Body]"
                : "[Cols]"}
        </div>
      )}
    </div>
  );
}

function SlideThumbnail({ slide, isSelected, onSelect }: SlideThumbnailProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      style={{
        width: "100%",
        aspectRatio: "16/9",
        padding: 0,
        marginBottom: 8,
        border: isSelected ? "2px solid #3b82f6" : "1px solid #e2e8f0",
        borderRadius: 8,
        background: "#fff",
        cursor: "pointer",
        overflow: "hidden",
        position: "relative",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
        }}
      >
        {slide.elements.map((el) => (
          <ElementPreview key={el.id} element={el} />
        ))}
      </div>
    </button>
  );
}

export function SlideThumbnailSidebar() {
  const {
    presentation,
    currentSlideId,
    selectSlide,
    addSlide,
    deleteSlide,
    setSlideLayout,
  } = usePresentationStore();

  const currentSlide = presentation.slides.find((s) => s.id === currentSlideId);

  return (
    <aside
      style={{
        width: 160,
        flexShrink: 0,
        padding: 16,
        background: "#f8fafc",
        borderRight: "1px solid #e2e8f0",
        display: "flex",
        flexDirection: "column",
        alignItems: "stretch",
      }}
    >
      <div style={{ marginBottom: 12, fontSize: 13, fontWeight: 600, color: "#475569" }}>
        Slides
      </div>
      {currentSlideId && (
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 11, color: "#64748b", marginBottom: 6, fontWeight: 500 }}>
            Change Layout
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: 6,
            }}
          >
            {Object.values(SLIDE_REGISTRY).map((template) => {
              const IconComponent = (LucideIcons as unknown as Record<string, React.ComponentType<{ size?: number }>>)[template.thumbnailIcon];
              const Icon = IconComponent ?? LucideIcons.Square;
              const isSelected = currentSlide?.layoutId === template.id;
              return (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => setSlideLayout(currentSlideId, template.id as LayoutId)}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "8px 6px",
                    fontSize: 10,
                    background: isSelected ? "#eff6ff" : "#fff",
                    color: isSelected ? "#1d4ed8" : "#334155",
                    border: isSelected ? "1px solid #3b82f6" : "1px solid #e2e8f0",
                    borderRadius: 8,
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                  title={template.displayName}
                >
                  <span style={{ marginBottom: 4, display: "flex" }}>
                    <Icon size={16} />
                  </span>
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "100%" }}>
                    {template.displayName}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
      {presentation.slides.map((slide) => (
        <SlideThumbnail
          key={slide.id}
          slide={slide}
          isSelected={slide.id === currentSlideId}
          onSelect={() => selectSlide(slide.id)}
        />
      ))}
      <div style={{ display: "flex", gap: 4, marginTop: 8 }}>
        <button
          type="button"
          onClick={() => addSlide()}
          style={{
            flex: 1,
            padding: "8px 12px",
            fontSize: 12,
            fontWeight: 500,
            background: "#3b82f6",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            cursor: "pointer",
            transition: "background 0.15s ease",
          }}
        >
          + Add
        </button>
        {presentation.slides.length > 1 && currentSlideId && (
          <button
            type="button"
            onClick={() => deleteSlide(currentSlideId)}
            style={{
              flex: 1,
              padding: "8px 12px",
              fontSize: 12,
              fontWeight: 500,
              background: "transparent",
              color: "#dc2626",
              border: "1px solid #fecaca",
              borderRadius: 8,
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            Delete
          </button>
        )}
      </div>
    </aside>
  );
}
