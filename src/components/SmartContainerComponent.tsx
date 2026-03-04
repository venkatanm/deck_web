/**
 * SmartContainerComponent - Renders SmartContainer with CSS Flexbox and bakes
 * computed child positions into the schema for OpenXML export.
 * ADR-001: Frontend computes layout; backend receives baked percentages.
 */

import { useCallback, useLayoutEffect, useRef } from "react";
import { Lock } from "lucide-react";
import { Rnd } from "react-rnd";
import { Droppable, Draggable } from "@hello-pangea/dnd";
import type {
  CanvasElement,
  SmartContainerElement,
  Transform,
} from "@deck-web/schema";
import { colorRefToCssValue } from "@deck-web/schema";
import { usePresentationStore } from "../store/usePresentationStore";
import { svgToResponsive } from "../utils/iconUtils";

/** Coordinate Abstraction: percentage → pixels */
function toPixels(
  transform: Transform,
  canvasWidth: number,
  canvasHeight: number
) {
  return {
    x: transform.x * canvasWidth,
    y: transform.y * canvasHeight,
    width: transform.w * canvasWidth,
    height: transform.h * canvasHeight,
  };
}

/** Coordinate Abstraction: pixels → percentage (preserves z) */
function toPercentages(
  x: number,
  y: number,
  width: number,
  height: number,
  canvasWidth: number,
  canvasHeight: number,
  currentZ: number = 0
): Transform {
  return {
    x: Math.max(0, Math.min(1, x / canvasWidth)),
    y: Math.max(0, Math.min(1, y / canvasHeight)),
    w: Math.max(0, Math.min(1, width / canvasWidth)),
    h: Math.max(0, Math.min(1, height / canvasHeight)),
    z: currentZ,
  };
}

/** Renders element content only (no Rnd - for flex children) */
function SmartContainerChildContent({
  element,
  onContentChange,
}: {
  element: CanvasElement;
  onContentChange?: (elementId: string, content: string) => void;
}) {
  if (element.type === "text") {
    return (
      <div
        contentEditable
        suppressContentEditableWarning
        onBlur={(e) =>
          onContentChange?.(element.id, e.currentTarget.textContent ?? "")
        }
        style={{
          width: "100%",
          height: "100%",
          fontSize: `${element.fontSize ?? 12}pt`,
          color: colorRefToCssValue(element.color ?? "dk1"),
          outline: "none",
          overflow: "hidden",
          padding: 4,
          minWidth: 0,
          minHeight: 0,
        }}
      >
        {element.content}
      </div>
    );
  }
  if (element.type === "image") {
    return (
      <img
        src={element.src}
        alt=""
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          display: "block",
          minWidth: 0,
          minHeight: 0,
        }}
      />
    );
  }
  if (element.type === "icon") {
    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minWidth: 0,
          minHeight: 0,
        }}
        dangerouslySetInnerHTML={{
          __html: svgToResponsive(element.svgData),
        }}
      />
    );
  }
  if (element.type === "chart") {
    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "rgba(30,41,59,0.5)",
          color: "#94a3b8",
          fontSize: 12,
          minWidth: 0,
          minHeight: 0,
        }}
      >
        Chart
      </div>
    );
  }
  if (element.type === "shape") {
    const isCircle =
      element.shapeType === "circle" || element.shapeType === "ellipse";
    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: colorRefToCssValue(element.fillColor ?? "accent1"),
          borderRadius: isCircle ? "50%" : 0,
          clipPath:
            element.shapeType === "triangle"
              ? "polygon(50% 0%, 0% 100%, 100% 100%)"
              : undefined,
          minWidth: 0,
          minHeight: 0,
        }}
      />
    );
  }
  if (element.type === "group") {
    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          position: "relative",
          minWidth: 0,
          minHeight: 0,
        }}
      >
        {element.elements.map((child) => (
          <div
            key={child.id}
            style={{
              position: "absolute",
              left: `${child.transform.x * 100}%`,
              top: `${child.transform.y * 100}%`,
              width: `${child.transform.w * 100}%`,
              height: `${child.transform.h * 100}%`,
              overflow: "hidden",
            }}
          >
            <SmartContainerChildContent
              element={child}
              onContentChange={onContentChange}
            />
          </div>
        ))}
      </div>
    );
  }
  if (element.type === "smartContainer") {
    return (
      <div style={{ width: "100%", height: "100%", minWidth: 0, minHeight: 0 }}>
        SmartContainer nested (preview)
      </div>
    );
  }
  return null;
}

interface SmartContainerComponentProps {
  element: SmartContainerElement;
  isSelected: boolean;
  canvasWidth: number;
  canvasHeight: number;
  slideId: string;
  onSelect: (e: React.MouseEvent) => void;
  onTransformChange: (elementId: string, transform: Transform) => void;
  onContentChange: (elementId: string, content: string) => void;
}

export function SmartContainerComponent({
  element,
  isSelected,
  canvasWidth,
  canvasHeight,
  slideId,
  onSelect,
  onTransformChange,
  onContentChange,
}: SmartContainerComponentProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const bakeSmartContainerChildTransforms =
    usePresentationStore((s) => s.bakeSmartContainerChildTransforms);

  const px = toPixels(element.transform, canvasWidth, canvasHeight);
  const currentZ = element.transform.z ?? 0;
  const isLocked = element.isLocked === true;

  /** Baker: measure child DOM rects and bake relative percentages into store */
  const bakeLayout = useCallback(() => {
    const container = containerRef.current;
    if (!container || element.elements.length === 0) return;

    const containerRect = container.getBoundingClientRect();
    const containerW = containerRect.width;
    const containerH = containerRect.height;
    if (containerW <= 0 || containerH <= 0) return;

    const updates: Record<string, Transform> = {};
    const EPS = 0.001;
    for (const child of element.elements) {
      const childEl = container.querySelector(
        `[data-smart-child="${child.id}"]`
      ) as HTMLElement | null;
      if (!childEl) continue;

      const childRect = childEl.getBoundingClientRect();
      const relX = Math.max(0, Math.min(1, (childRect.left - containerRect.left) / containerW));
      const relY = Math.max(0, Math.min(1, (childRect.top - containerRect.top) / containerH));
      const relW = Math.max(0, Math.min(1, childRect.width / containerW));
      const relH = Math.max(0, Math.min(1, childRect.height / containerH));

      const t = child.transform;
      const changed =
        Math.abs(relX - t.x) > EPS ||
        Math.abs(relY - t.y) > EPS ||
        Math.abs(relW - t.w) > EPS ||
        Math.abs(relH - t.h) > EPS;
      if (changed) {
        updates[child.id] = {
          x: relX,
          y: relY,
          w: relW,
          h: relH,
          z: child.transform.z ?? 0,
        };
      }
    }
    if (Object.keys(updates).length > 0) {
      bakeSmartContainerChildTransforms(slideId, element.id, updates);
    }
  }, [
    element.id,
    element.elements,
    slideId,
    bakeSmartContainerChildTransforms,
  ]);

  useLayoutEffect(() => {
    bakeLayout();
  }, [bakeLayout, element.layoutConfig, element.elements.length]);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const ro = new ResizeObserver(() => {
      bakeLayout();
    });
    ro.observe(container);
    return () => ro.disconnect();
  }, [bakeLayout]);

  const handleDragStop = useCallback(
    (_e: unknown, d: { x: number; y: number }) => {
      const newTransform = toPercentages(
        d.x,
        d.y,
        px.width,
        px.height,
        canvasWidth,
        canvasHeight,
        currentZ
      );
      onTransformChange(element.id, newTransform);
    },
    [
      element.id,
      px.width,
      px.height,
      canvasWidth,
      canvasHeight,
      currentZ,
      onTransformChange,
    ]
  );

  const handleResizeStop = useCallback(
    (
      _e: unknown,
      _direction: unknown,
      ref: HTMLElement,
      _delta: unknown,
      position: { x: number; y: number }
    ) => {
      const newTransform = toPercentages(
        position.x,
        position.y,
        ref.offsetWidth,
        ref.offsetHeight,
        canvasWidth,
        canvasHeight,
        currentZ
      );
      onTransformChange(element.id, newTransform);
    },
    [element.id, canvasWidth, canvasHeight, currentZ, onTransformChange]
  );

  return (
    <Rnd
      position={{ x: px.x, y: px.y }}
      size={{ width: px.width, height: px.height }}
      onDragStop={isLocked ? undefined : handleDragStop}
      onResizeStop={isLocked ? undefined : handleResizeStop}
      disableDragging={isLocked}
      enableResizing={!isLocked}
      onMouseDown={(e) => onSelect(e as unknown as React.MouseEvent)}
      bounds="parent"
      style={{
        zIndex: currentZ,
        border: isSelected
          ? "2px solid #3b82f6"
          : "1px solid rgba(148,163,184,0.4)",
        background: "transparent",
      }}
    >
      <div
        ref={containerRef}
        style={{
          position: "absolute",
          inset: 0,
        }}
      >
        <Droppable droppableId={element.id} direction={element.layoutConfig.direction === "row" ? "horizontal" : "vertical"}>
          {(droppableProvided) => (
            <div
              ref={droppableProvided.innerRef}
              {...droppableProvided.droppableProps}
              style={{
                display: "flex",
                flexDirection: element.layoutConfig.direction,
                justifyContent: element.layoutConfig.justifyContent,
                alignItems: element.layoutConfig.alignItems,
                gap: `${element.layoutConfig.gap * 100}%`,
                padding: `${element.layoutConfig.padding * 100}%`,
                width: "100%",
                height: "100%",
                boxSizing: "border-box",
              }}
            >
              {element.elements.map((child, index) => {
                const isRow = element.layoutConfig.direction === "row";
                return (
                  <Draggable
                    key={child.id}
                    draggableId={child.id}
                    index={index}
                  >
                    {(draggableProvided) => (
                      <div
                        ref={draggableProvided.innerRef}
                        {...draggableProvided.draggableProps}
                        {...draggableProvided.dragHandleProps}
                        data-smart-child={child.id}
                        style={{
                          ...draggableProvided.draggableProps.style,
                          flex: `0 0 auto`,
                          width: isRow ? `${child.transform.w * 100}%` : undefined,
                          height: isRow ? undefined : `${child.transform.h * 100}%`,
                          minWidth: 0,
                          minHeight: 0,
                          overflow: "hidden",
                          border: "1px solid rgba(0,0,0,0.1)",
                          boxSizing: "border-box",
                        }}
                      >
                        <SmartContainerChildContent
                          element={child}
                          onContentChange={onContentChange}
                        />
                      </div>
                    )}
                  </Draggable>
                );
              })}
              {droppableProvided.placeholder}
            </div>
          )}
        </Droppable>
      </div>
      {isSelected && isLocked && (
        <div
          style={{
            position: "absolute",
            top: 4,
            right: 4,
            width: 16,
            height: 16,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0.5)",
            borderRadius: 4,
            color: "#fff",
          }}
        >
          <Lock size={10} strokeWidth={2.5} />
        </div>
      )}
    </Rnd>
  );
}
