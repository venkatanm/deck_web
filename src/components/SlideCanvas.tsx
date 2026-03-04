/**
 * SlideCanvas - React web canvas for visualizing and mutating the Universal Schema.
 * ADR-001: Frontend owns Schema Percentages ↔ DOM Pixels translation.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { Rnd } from "react-rnd";
import { DragDropContext } from "@hello-pangea/dnd";
import type {
  CanvasElement,
  GroupElement,
  Transform,
} from "@deck-web/schema";
import { colorRefToCssValue } from "@deck-web/schema";
import { svgToResponsive } from "../utils/iconUtils";
import { SmartContainerComponent } from "./SmartContainerComponent";
import { usePresentationStore } from "../store/usePresentationStore";
import { IconPickerModal } from "./IconPickerModal";
import { Lock } from "lucide-react";
import { ParametricChart } from "./ParametricChart";
import { useThemeVariables } from "../hooks/useThemeVariables";
import { LiveCursors } from "../sync/LiveCursors";
import { useLocalAwareness } from "../sync/useAwareness";
import { useYjsOptional } from "../sync/YjsProvider";



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

interface EditableTextProps {
  content: string;
  fontSize: number;
  color: string;
  onBlur: (content: string) => void;
}

function EditableText({ content, fontSize, color, onBlur }: EditableTextProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) ref.current.textContent = content;
  }, [content]);

  return (
    <div
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      onBlur={(e) => onBlur(e.currentTarget.textContent ?? "")}
      style={{
        width: "100%",
        height: "100%",
        fontSize: `${fontSize}pt`,
        color,
        outline: "none",
        overflow: "hidden",
        padding: 4,
      }}
    />
  );
}

interface CanvasElementRndProps {
  element: CanvasElement;
  isSelected: boolean;
  canvasWidth: number;
  canvasHeight: number;
  onSelect: (e: React.MouseEvent) => void;
  onTransformChange: (elementId: string, transform: Transform) => void;
  onContentChange: (elementId: string, content: string) => void;
}

function CanvasElementRnd({
  element,
  isSelected,
  canvasWidth,
  canvasHeight,
  onSelect,
  onTransformChange,
  onContentChange,
}: CanvasElementRndProps) {
  const px = toPixels(element.transform, canvasWidth, canvasHeight);
  const zIndex = element.transform.z ?? 0;
  const isLocked = "isLocked" in element && element.isLocked === true;

  const currentZ = element.transform.z ?? 0;

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

  const isCircle =
    element.type === "shape" &&
    (element.shapeType === "circle" || element.shapeType === "ellipse");

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
        zIndex,
        border: isSelected
          ? "2px solid #3b82f6"
          : "1px solid rgba(148,163,184,0.4)",
        background:
          element.type === "shape"
            ? colorRefToCssValue(element.fillColor ?? "accent1")
            : element.type === "icon"
              ? "transparent"
              : element.type === "chart"
                ? "rgba(30,41,59,0.5)"
                : "var(--theme-lt1)",
        borderRadius: isCircle ? "50%" : 0,
        clipPath:
          element.type === "shape" && element.shapeType === "triangle"
            ? "polygon(50% 0%, 0% 100%, 100% 100%)"
            : undefined,
      }}
    >
      {element.type === "text" ? (
        <EditableText
          content={element.content}
          fontSize={element.fontSize ?? 12}
          color={colorRefToCssValue(element.color ?? "dk1")}
          onBlur={(content) => onContentChange(element.id, content)}
        />
      ) : element.type === "image" ? (
        <img
          src={element.src}
          alt=""
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
          }}
        />
      ) : element.type === "icon" ? (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          dangerouslySetInnerHTML={{
            __html: svgToResponsive(element.svgData),
          }}
        />
      ) : element.type === "chart" ? (
        <ParametricChart
          element={element}
          width={px.width}
          height={px.height}
        />
      ) : (
        <div style={{ width: "100%", height: "100%" }} />
      )}
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

/** Renders group children with relative coords (0-1) inside group bounds */
function GroupChildrenPreview({ elements }: { elements: CanvasElement[] }) {
  return (
    <>
      {elements.map((el) => (
        <div
          key={el.id}
          style={{
            position: "absolute",
            left: `${el.transform.x * 100}%`,
            top: `${el.transform.y * 100}%`,
            width: `${el.transform.w * 100}%`,
            height: `${el.transform.h * 100}%`,
            background:
              el.type === "shape" ? colorRefToCssValue(el.fillColor ?? "accent1") : "transparent",
            borderRadius:
              el.type === "shape" &&
              (el.shapeType === "circle" || el.shapeType === "ellipse")
                ? "50%"
                : 0,
            overflow: "hidden",
            border: "1px solid rgba(0,0,0,0.1)",
          }}
        >
          {el.type === "text" && (
            <span
              style={{
                fontSize: "min(10px, 0.6em)",
                color: colorRefToCssValue(el.color ?? "dk1"),
                overflow: "hidden",
                textOverflow: "ellipsis",
                display: "block",
              }}
            >
              {el.content || " "}
            </span>
          )}
          {el.type === "image" && (
            <img
              src={el.src}
              alt=""
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          )}
          {el.type === "icon" && (
            <div
              style={{
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              dangerouslySetInnerHTML={{
                __html: svgToResponsive(el.svgData),
              }}
            />
          )}
          {el.type === "chart" && (
            <div
              style={{
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(30,41,59,0.5)",
                color: "#94a3b8",
                fontSize: "min(10px, 0.6em)",
              }}
            >
              Chart
            </div>
          )}
          {el.type === "group" && (
            <GroupChildrenPreview elements={el.elements} />
          )}
        </div>
      ))}
    </>
  );
}

function GroupElementRnd({
  element,
  isSelected,
  canvasWidth,
  canvasHeight,
  onSelect,
  onTransformChange,
}: {
  element: GroupElement;
  isSelected: boolean;
  canvasWidth: number;
  canvasHeight: number;
  onSelect: (e: React.MouseEvent) => void;
  onTransformChange: (elementId: string, transform: Transform) => void;
}) {
  const px = toPixels(element.transform, canvasWidth, canvasHeight);
  const currentZ = element.transform.z ?? 0;
  const isLocked = "isLocked" in element && element.isLocked === true;

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
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          pointerEvents: "none",
        }}
      >
        <GroupChildrenPreview elements={element.elements} />
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
          background: "rgba(30,41,59,0.8)",
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

interface SlideCanvasProps {
  iconPickerOpen: boolean;
  onCloseIconPicker: () => void;
}

export function SlideCanvas({ iconPickerOpen, onCloseIconPicker }: SlideCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const themeVars = useThemeVariables();

  const {
    presentation,
    currentSlideId,
    selectedElementIds,
    updateElement,
    updateElementContent,
    updateNestedElementContent,
    toggleSelectElement,
    clearSelection,
    reorderSmartContainerElements,
    commitHistory,
  } = usePresentationStore();

  const yjsContext = useYjsOptional();
  const localAwareness = useLocalAwareness(yjsContext?.provider?.awareness);
  const userSetRef = useRef(false);
  useEffect(() => {
    if (!userSetRef.current && yjsContext?.provider) {
      userSetRef.current = true;
      localAwareness.setUser(`User ${Math.random().toString(36).slice(2, 8)}`);
    }
  }, [yjsContext?.provider, localAwareness]);

  useEffect(() => {
    const sel = selectedElementIds[0];
    if (currentSlideId && sel?.slideId === currentSlideId) {
      localAwareness.setSelection(currentSlideId, sel.elementId);
    } else {
      localAwareness.setSelection(null, null);
    }
  }, [currentSlideId, selectedElementIds, localAwareness]);

  const currentSlide = presentation.slides.find((s) => s.id === currentSlideId);
  const elements = [...(currentSlide?.elements ?? [])].sort(
    (a, b) => (a.transform.z ?? 0) - (b.transform.z ?? 0)
  );
  const currentSlideSelection = selectedElementIds.filter(
    (s) => s.slideId === currentSlideId
  );
  const selectedIds = new Set(currentSlideSelection.map((s) => s.elementId));
  const isMultiSelected = selectedIds.size > 1;

  const selectedElements = elements.filter((e) => selectedIds.has(e.id));
  const boundingBox =
    selectedElements.length > 0
      ? {
          minX: Math.min(...selectedElements.map((e) => e.transform.x)),
          minY: Math.min(...selectedElements.map((e) => e.transform.y)),
          maxRight: Math.max(
            ...selectedElements.map((e) => e.transform.x + e.transform.w)
          ),
          maxBottom: Math.max(
            ...selectedElements.map((e) => e.transform.y + e.transform.h)
          ),
        }
      : null;

  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setDimensions({ width, height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const updateElementTransform = useCallback(
    (elementId: string, transform: Transform) => {
      if (currentSlideId) {
        commitHistory();
        updateElement(currentSlideId, elementId, transform);
      }
    },
    [currentSlideId, updateElement, commitHistory]
  );

  const updateElementContentCallback = useCallback(
    (elementId: string, content: string) => {
      if (currentSlideId) {
        commitHistory();
        updateElementContent(currentSlideId, elementId, content);
      }
    },
    [currentSlideId, updateElementContent, commitHistory]
  );

  const updateNestedElementContentCallback = useCallback(
    (elementId: string, content: string) => {
      if (currentSlideId) {
        commitHistory();
        updateNestedElementContent(currentSlideId, elementId, content);
      }
    },
    [currentSlideId, updateNestedElementContent, commitHistory]
  );

  const findSmartContainer = useCallback(
    (elements: CanvasElement[], id: string): CanvasElement | null => {
      for (const el of elements) {
        if (el.id === id && el.type === "smartContainer") return el;
        if ("elements" in el && Array.isArray(el.elements)) {
          const found = findSmartContainer(el.elements, id);
          if (found) return found;
        }
      }
      return null;
    },
    []
  );

  const handleDragEnd = useCallback(
    (result: { destination?: { droppableId: string; index: number } | null; source: { droppableId: string; index: number } }) => {
      if (!result.destination || !currentSlideId) return;
      const { destination, source } = result;
      if (source.index === destination.index && source.droppableId === destination.droppableId) return;
      const slide = presentation.slides.find((s) => s.id === currentSlideId);
      const el = slide ? findSmartContainer(slide.elements, destination.droppableId) : null;
      if (!el || el.type !== "smartContainer") return;
      commitHistory();
      reorderSmartContainerElements(currentSlideId, destination.droppableId, source.index, destination.index);
    },
    [currentSlideId, presentation, findSmartContainer, reorderSmartContainerElements, commitHistory]
  );

  const closeIconPicker = useCallback(() => onCloseIconPicker(), [onCloseIconPicker]);

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
    <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0, overflow: "hidden" }}>
      <div
        ref={canvasRef}
        className="slide-canvas"
        onClick={(e) => e.target === e.currentTarget && clearSelection()}
        onMouseMove={(e) => localAwareness.setCursor(e.clientX, e.clientY)}
        style={{
          ...themeVars,
          flex: 1,
          minHeight: 0,
          aspectRatio: "16/9",
          width: "100%",
          maxWidth: "100%",
          position: "relative",
          background: "var(--theme-lt1)",
          backgroundImage: "radial-gradient(circle, rgba(148,163,184,0.12) 1px, transparent 1px)",
          backgroundSize: "12px 12px",
          borderRadius: 12,
          overflow: "hidden",
          boxShadow: "0 4px 6px -1px rgba(0,0,0,0.07), 0 2px 4px -2px rgba(0,0,0,0.05)",
          border: "2px solid #8b5cf6",
        }}
      >
        {currentSlideId &&
          dimensions.width > 0 &&
          dimensions.height > 0 && (
            <>
              {boundingBox && isMultiSelected && (
                <div
                  style={{
                    position: "absolute",
                    left: boundingBox.minX * dimensions.width,
                    top: boundingBox.minY * dimensions.height,
                    width:
                      (boundingBox.maxRight - boundingBox.minX) *
                      dimensions.width,
                    height:
                      (boundingBox.maxBottom - boundingBox.minY) *
                      dimensions.height,
                    border: "2px dashed #3b82f6",
                    borderRadius: 4,
                    pointerEvents: "none",
                    zIndex: 9999,
                  }}
                />
              )}
              {elements.map((el) =>
                el.type === "smartContainer" ? (
                  <SmartContainerComponent
                    key={el.id}
                    element={el}
                    isSelected={selectedIds.has(el.id)}
                    canvasWidth={dimensions.width}
                    canvasHeight={dimensions.height}
                    slideId={currentSlideId}
                    onSelect={(e) =>
                      toggleSelectElement(currentSlideId, el.id, e.shiftKey)
                    }
                    onTransformChange={updateElementTransform}
                    onContentChange={updateNestedElementContentCallback}
                  />
                ) : el.type === "group" ? (
                  <GroupElementRnd
                    key={el.id}
                    element={el}
                    isSelected={selectedIds.has(el.id)}
                    canvasWidth={dimensions.width}
                    canvasHeight={dimensions.height}
                    onSelect={(e) =>
                      toggleSelectElement(currentSlideId, el.id, e.shiftKey)
                    }
                    onTransformChange={updateElementTransform}
                  />
                ) : (
                  <CanvasElementRnd
                    key={el.id}
                    element={el}
                    isSelected={selectedIds.has(el.id)}
                    canvasWidth={dimensions.width}
                    canvasHeight={dimensions.height}
                    onSelect={(e) =>
                      toggleSelectElement(currentSlideId, el.id, e.shiftKey)
                    }
                    onTransformChange={updateElementTransform}
                    onContentChange={updateElementContentCallback}
                  />
                )
              )}
              <LiveCursors
                awareness={yjsContext?.provider?.awareness}
                containerRef={canvasRef}
              />
            </>
          )}
      </div>

      <IconPickerModal
        isOpen={iconPickerOpen}
        onClose={closeIconPicker}
        slideId={currentSlideId}
      />
    </div>
    </DragDropContext>
  );
}
