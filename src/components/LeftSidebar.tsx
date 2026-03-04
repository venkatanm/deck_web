/**
 * LeftSidebar - Canva-style vertical tool panel.
 * Templates, Elements, Text, Brand, Uploads, Tools, Projects.
 * Integrates slide thumbnails and layout picker.
 */

import { useState } from "react";
import {
  LayoutGrid,
  Shapes,
  Type,
  ShoppingBag,
  Upload,
  Wrench,
  FolderOpen,
} from "lucide-react";
import type { CanvasElement, LayoutId, Slide } from "@deck-web/schema";
import { colorRefToCssValue } from "@deck-web/schema";
import { usePresentationStore } from "../store/usePresentationStore";
import { svgToResponsive } from "../utils/iconUtils";
import { SLIDE_REGISTRY } from "../../shared/registry/SlideTemplates";
import * as LucideIcons from "lucide-react";

type PanelId = "templates" | "elements" | "text" | "brand" | "uploads" | "tools" | "projects" | null;

const TOOL_ITEMS: { id: PanelId; label: string; icon: React.ElementType }[] = [
  { id: "templates", label: "Templates", icon: LayoutGrid },
  { id: "elements", label: "Elements", icon: Shapes },
  { id: "text", label: "Text", icon: Type },
  { id: "brand", label: "Brand", icon: ShoppingBag },
  { id: "uploads", label: "Uploads", icon: Upload },
  { id: "tools", label: "Tools", icon: Wrench },
  { id: "projects", label: "Projects", icon: FolderOpen },
];

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
          element.type === "shape"
            ? colorRefToCssValue(element.fillColor ?? "accent1")
            : "transparent",
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
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
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

function SlideThumbnail({
  slide,
  isSelected,
  onSelect,
}: {
  slide: Slide;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      style={{
        width: "100%",
        aspectRatio: "16/9",
        padding: 0,
        marginBottom: 8,
        border: isSelected ? "2px solid #8b5cf6" : "1px solid #e2e8f0",
        borderRadius: 8,
        background: "#fff",
        cursor: "pointer",
        overflow: "hidden",
        position: "relative",
      }}
    >
      <div style={{ position: "absolute", inset: 0 }}>
        {slide.elements.map((el) => (
          <ElementPreview key={el.id} element={el} />
        ))}
      </div>
    </button>
  );
}

import type { ShapeElement, ImageElement, ChartElement } from "@deck-web/schema";
import { PLACEHOLDER_IMAGE_URL } from "../store/usePresentationStore";

export function LeftSidebar({
  onOpenIconPicker,
}: {
  onOpenIconPicker: () => void;
}) {
  const [activePanel, setActivePanel] = useState<PanelId>("elements");
  const {
    presentation,
    currentSlideId,
    selectSlide,
    addSlide,
    deleteSlide,
    setSlideLayout,
    addElement,
  } = usePresentationStore();

  const addRectangle = () => {
    if (!currentSlideId) return;
    const el: ShapeElement = {
      id: "",
      type: "shape",
      shapeType: "rectangle",
      transform: { x: 0.2, y: 0.2, w: 0.2, h: 0.15, z: 0 },
      fillColor: "accent1",
    };
    addElement(currentSlideId, el);
  };
  const addCircle = () => {
    if (!currentSlideId) return;
    const el: ShapeElement = {
      id: "",
      type: "shape",
      shapeType: "circle",
      transform: { x: 0.2, y: 0.2, w: 0.15, h: 0.15, z: 0 },
      fillColor: "accent1",
    };
    addElement(currentSlideId, el);
  };
  const addImage = () => {
    if (!currentSlideId) return;
    const el: ImageElement = {
      id: "",
      type: "image",
      src: PLACEHOLDER_IMAGE_URL,
      transform: { x: 0.2, y: 0.2, w: 0.3, h: 0.2, z: 0 },
    };
    addElement(currentSlideId, el);
  };
  const addChart = () => {
    if (!currentSlideId) return;
    const el: ChartElement = {
      id: "",
      type: "chart",
      transform: { x: 0.15, y: 0.25, w: 0.5, h: 0.45, z: 0 },
      chartConfig: {
        chartType: "CLUSTERED_COLUMN",
        showLegend: true,
        showTotalLabels: false,
      },
      data: {
        categories: ["Q1", "Q2", "Q3"],
        series: [
          { name: "Revenue", colorToken: "accent1", values: [100, 150, 120] },
          { name: "Costs", colorToken: "accent2", values: [60, 80, 70] },
        ],
      },
    };
    addElement(currentSlideId, el);
  };
  const addText = () => {
    if (!currentSlideId) return;
    addElement(currentSlideId, {
      id: "",
      type: "text",
      content: "New text",
      transform: { x: 0.1, y: 0.1, w: 0.4, h: 0.12, z: 0 },
      fontSize: 24,
      color: "dk1",
    });
  };

  const currentSlide = presentation.slides.find((s) => s.id === currentSlideId);

  return (
    <aside
      style={{
        width: 240,
        flexShrink: 0,
        background: "#f1f5f9",
        borderRight: "1px solid #e2e8f0",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "12px 8px",
          borderBottom: "1px solid #e2e8f0",
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}
      >
        {TOOL_ITEMS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setActivePanel(activePanel === id ? null : id)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "10px 12px",
              fontSize: 14,
              fontWeight: 500,
              color: activePanel === id ? "#7c3aed" : "#475569",
              background: activePanel === id ? "#ede9fe" : "transparent",
              border: "none",
              borderRadius: 8,
              cursor: "pointer",
              textAlign: "left",
              width: "100%",
            }}
          >
            <Icon size={20} />
            {label}
          </button>
        ))}
      </div>

      <div
        style={{
          flex: 1,
          overflow: "auto",
          padding: 12,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {activePanel === "templates" && currentSlideId && (
          <div style={{ marginBottom: 12 }}>
            <div
              style={{
                fontSize: 11,
                color: "#64748b",
                marginBottom: 8,
                fontWeight: 600,
              }}
            >
              Change Layout
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, 1fr)",
                gap: 8,
              }}
            >
              {Object.values(SLIDE_REGISTRY).map((template) => {
                const IconComponent = (LucideIcons as unknown as Record<
                  string,
                  React.ComponentType<{ size?: number }>
                >)[template.thumbnailIcon];
                const Icon = IconComponent ?? LucideIcons.Square;
                const isSelected = currentSlide?.layoutId === template.id;
                return (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() =>
                      setSlideLayout(currentSlideId, template.id as LayoutId)
                    }
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      padding: "10px 8px",
                      fontSize: 11,
                      background: isSelected ? "#ede9fe" : "#fff",
                      color: isSelected ? "#7c3aed" : "#334155",
                      border: isSelected
                        ? "1px solid #8b5cf6"
                        : "1px solid #e2e8f0",
                      borderRadius: 8,
                      cursor: "pointer",
                      transition: "all 0.15s",
                    }}
                    title={template.displayName}
                  >
                    <span style={{ marginBottom: 4 }}>
                      <Icon size={18} />
                    </span>
                    <span
                      style={{
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        maxWidth: "100%",
                      }}
                    >
                      {template.displayName}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {activePanel === "elements" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#475569" }}>
              Add to slide
            </div>
            <button
              type="button"
              onClick={addRectangle}
              className="toolbar-btn"
              style={{ width: "100%" }}
            >
              Rectangle
            </button>
            <button
              type="button"
              onClick={addCircle}
              className="toolbar-btn"
              style={{ width: "100%" }}
            >
              Circle
            </button>
            <button
              type="button"
              onClick={addImage}
              className="toolbar-btn"
              style={{ width: "100%" }}
            >
              Image
            </button>
            <button
              type="button"
              onClick={onOpenIconPicker}
              className="toolbar-btn"
              style={{ width: "100%" }}
            >
              Icon
            </button>
            <button
              type="button"
              onClick={addChart}
              className="toolbar-btn"
              style={{ width: "100%" }}
            >
              Chart
            </button>
          </div>
        )}

        {activePanel === "text" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <button
              type="button"
              onClick={addText}
              className="toolbar-btn"
              style={{ width: "100%" }}
            >
              Add Text
            </button>
          </div>
        )}

        {(activePanel === "brand" ||
          activePanel === "uploads" ||
          activePanel === "tools" ||
          activePanel === "projects") && (
          <div
            style={{
              fontSize: 13,
              color: "#64748b",
              padding: 16,
              textAlign: "center",
            }}
          >
            {activePanel === "brand" && "Brand kit — theme colors & fonts"}
            {activePanel === "uploads" && "Upload your own images"}
            {activePanel === "tools" && "Crop, filters, and more"}
            {activePanel === "projects" && "Switch between projects"}
          </div>
        )}

        <div style={{ marginTop: 16, flex: 1, minHeight: 0 }}>
          <div
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: "#475569",
              marginBottom: 8,
            }}
          >
            Slides
          </div>
          {presentation.slides.map((slide) => (
            <SlideThumbnail
              key={slide.id}
              slide={slide}
              isSelected={slide.id === currentSlideId}
              onSelect={() => selectSlide(slide.id)}
            />
          ))}
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <button
              type="button"
              onClick={() => addSlide()}
              style={{
                flex: 1,
                padding: "8px 12px",
                fontSize: 12,
                fontWeight: 500,
                background: "#8b5cf6",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                cursor: "pointer",
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
                }}
              >
                Delete
              </button>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
