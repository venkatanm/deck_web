import React, { useRef, useEffect, useState, useCallback } from "react";
import {
  Stage,
  Layer,
  Rect,
  Ellipse,
  RegularPolygon,
  Star,
  Line,
  Arrow,
  Text as KonvaText,
  Image as KonvaImage,
  Transformer,
  Path,
  Group,
} from "react-konva";
import useImage from "use-image";
import Konva from "konva";
import { getStroke } from "perfect-freehand";
import useEditorStore from "../store/useEditorStore";
import { useToast } from "./Toast.jsx";
import { getSnapPosition } from "../utils/snapGuides";
import { useImageSrc } from "../hooks/useImageSrc";
import Rulers from "./Rulers";
import MiniMap from "./MiniMap";
import CropOverlay from "./CropOverlay";
import ChartElement from "./charts/ChartElement";
import TableElement from "./TableElement";
import GraphicElement from "./GraphicElement";
import StatBlockElement from "./StatBlockElement";
import TimelineElement from "./TimelineElement";

function getSvgPathFromStroke(points, closed = true) {
  const len = points.length;
  if (len < 4) return "";
  const average = (a, b) => (a + b) / 2;
  let a = points[0];
  let b = points[1];
  const c = points[2];
  let result = `M${a[0].toFixed(2)},${a[1].toFixed(2)} Q${b[0].toFixed(2)},${b[1].toFixed(2)} ${average(b[0], c[0]).toFixed(2)},${average(b[1], c[1]).toFixed(2)} T`;
  for (let i = 2, max = len - 1; i < max; i++) {
    a = points[i];
    b = points[i + 1];
    result += `${average(a[0], b[0]).toFixed(2)},${average(a[1], b[1]).toFixed(2)} `;
  }
  if (closed) result += "Z";
  return result;
}

const HEART_PATH = "M28 46 C28 46 8 34 8 20 C8 13 13 8 20 8 C24 8 28 12 28 12 C28 12 32 8 36 8 C43 8 48 13 48 20 C48 34 28 46 28 46Z";
const DIAMOND_PATH = "M28,4 L52,28 L28,52 L4,28 Z";

function getAnchorPoint(el, anchor) {
  const cx = el.x + el.width / 2;
  const cy = el.y + el.height / 2;
  switch (anchor) {
    case "top":
      return { x: cx, y: el.y };
    case "bottom":
      return { x: cx, y: el.y + el.height };
    case "left":
      return { x: el.x, y: cy };
    case "right":
      return { x: el.x + el.width, y: cy };
    default:
      return { x: cx, y: cy };
  }
}

function getElbowPoints(from, to) {
  const midX = (from.x + to.x) / 2;
  const midY = (from.y + to.y) / 2;
  const dx = Math.abs(to.x - from.x);
  const dy = Math.abs(to.y - from.y);
  if (dx > dy) {
    return [from.x, from.y, midX, from.y, midX, to.y, to.x, to.y];
  }
  return [from.x, from.y, from.x, midY, to.x, midY, to.x, to.y];
}

function getFlowchartPath(subtype, w, h) {
  switch (subtype) {
    case "decision":
      return `M ${w / 2} 0 L ${w} ${h / 2} L ${w / 2} ${h} L 0 ${h / 2} Z`;
    case "terminal": {
      const r = Math.min(h / 2, 20);
      return `M ${r} 0 L ${w - r} 0 Q ${w} 0 ${w} ${r} L ${w} ${h - r} Q ${w} ${h} ${w - r} ${h} L ${r} ${h} Q 0 ${h} 0 ${h - r} L 0 ${r} Q 0 0 ${r} 0 Z`;
    }
    case "document":
      return `M 0 0 L ${w} 0 L ${w} ${h * 0.8} Q ${w * 0.75} ${h} ${w * 0.5} ${h * 0.8} Q ${w * 0.25} ${h * 0.6} 0 ${h * 0.8} Z`;
    case "database": {
      const ry = h * 0.15;
      return `M 0 ${ry} Q 0 0 ${w / 2} 0 Q ${w} 0 ${w} ${ry} L ${w} ${h - ry} Q ${w} ${h} ${w / 2} ${h} Q 0 ${h} 0 ${h - ry} Z`;
    }
    case "parallelogram": {
      const skew = w * 0.15;
      return `M ${skew} 0 L ${w} 0 L ${w - skew} ${h} L 0 ${h} Z`;
    }
    case "hexagon": {
      const cx = w / 2;
      const cy = h / 2;
      const rx = w / 2;
      const ry = h / 2;
      const pts = Array.from({ length: 6 }, (_, i) => {
        const a = (Math.PI / 3) * i - Math.PI / 6;
        return `${cx + rx * Math.cos(a)} ${cy + ry * Math.sin(a)}`;
      });
      return `M ${pts.join(" L ")} Z`;
    }
    case "cloud":
      return `M ${w * 0.35} ${h * 0.85} Q ${w * 0.05} ${h * 0.85} ${w * 0.05} ${h * 0.6} Q ${w * 0.05} ${h * 0.35} ${w * 0.25} ${h * 0.3} Q ${w * 0.2} ${h * 0.1} ${w * 0.45} ${h * 0.1} Q ${w * 0.55} 0 ${w * 0.65} ${h * 0.1} Q ${w * 0.85} ${h * 0.05} ${w * 0.9} ${h * 0.3} Q ${w * 1.05} ${h * 0.3} ${w * 0.98} ${h * 0.55} Q ${w} ${h * 0.85} ${w * 0.7} ${h * 0.85} Z`;
    default:
      return null;
  }
}

function getCalloutPath(width, height, tailDir, cornerRadius = 8) {
  const r = cornerRadius;
  const tw = width * 0.2;
  const th = height * 0.28;
  const tx = width * 0.25;

  switch (tailDir) {
    case "bottom-left":
      return `M ${r} 0 L ${width - r} 0 Q ${width} 0 ${width} ${r} L ${width} ${height - r - th} Q ${width} ${height - th} ${width - r} ${height - th} L ${tx + tw} ${height - th} L ${tx - tw * 0.5} ${height} L ${tx} ${height - th} L ${r} ${height - th} Q 0 ${height - th} 0 ${height - r - th} L 0 ${r} Q 0 0 ${r} 0 Z`;
    case "bottom-right":
      return `M ${r} 0 L ${width - r} 0 Q ${width} 0 ${width} ${r} L ${width} ${height - r - th} Q ${width} ${height - th} ${width - r} ${height - th} L ${width - tx + tw * 0.5} ${height - th} L ${width - tx + tw} ${height} L ${width - tx} ${height - th} L ${r} ${height - th} Q 0 ${height - th} 0 ${height - r - th} L 0 ${r} Q 0 0 ${r} 0 Z`;
    case "top-left":
      return `M ${r} ${th} L ${tx} ${th} L ${tx - tw * 0.5} 0 L ${tx + tw} ${th} L ${width - r} ${th} Q ${width} ${th} ${width} ${r + th} L ${width} ${height - r} Q ${width} ${height} ${width - r} ${height} L ${r} ${height} Q 0 ${height} 0 ${height - r} L 0 ${r + th} Q 0 ${th} ${r} ${th} Z`;
    case "top-right":
      return `M ${width - r} ${th} L ${width - tx} ${th} L ${width - tx + tw * 0.5} 0 L ${width - tx - tw} ${th} L ${r} ${th} Q 0 ${th} 0 ${r + th} L 0 ${height - r} Q 0 ${height} ${r} ${height} L ${width - r} ${height} Q ${width} ${height} ${width} ${height - r} L ${width} ${r + th} Q ${width} ${th} ${width - r} ${th} Z`;
    case "left":
      return `M ${tw} ${r} L ${tw + width - tw - r} ${r} Q ${width} ${r} ${width} ${r * 2} L ${width} ${height - r} Q ${width} ${height} ${width - r} ${height} L ${tw + r} ${height} Q ${tw} ${height} ${tw} ${height - r} L ${tw} ${height * 0.5 + th * 0.5} L 0 ${height * 0.5} L ${tw} ${height * 0.5 - th * 0.5} L ${tw} ${r} Q ${tw} 0 ${tw + r} 0 L ${width - r} 0 Q ${width} 0 ${width} ${r} Z`;
    default:
      return `M ${r} 0 L ${width - tw - r} 0 Q ${width - tw} 0 ${width - tw} ${r} L ${width - tw} ${height * 0.5 - th * 0.5} L ${width} ${height * 0.5} L ${width - tw} ${height * 0.5 + th * 0.5} L ${width - tw} ${height - r} Q ${width - tw} ${height} ${width - tw - r} ${height} L ${r} ${height} Q 0 ${height} 0 ${height - r} L 0 ${r} Q 0 0 ${r} 0 Z`;
  }
}

// Shapes that Konva positions from center, not top-left
const CENTERED_TYPES = ["circle", "triangle", "star", "pentagon"];

// Convert Konva's center-based x/y back to top-left for the store
function centerToTopLeft(e, el) {
  const node = e.target;
  if (CENTERED_TYPES.includes(el.type)) {
    return {
      x: node.x() - el.width / 2,
      y: node.y() - el.height / 2,
    };
  }
  return {
    x: node.x(),
    y: node.y(),
  };
}

// Clamp drag position to canvas bounds (used by dragBoundFunc)
function makeDragBound(el, canvasSize) {
  return (pos) => {
    const zoom = useEditorStore.getState().zoom;

    // Lines: just clamp the origin point, don't constrain by width
    if (el.type === "line" || el.type === "arrow") {
      return {
        x: Math.min(Math.max(pos.x, 0), canvasSize.width * zoom),
        y: Math.min(Math.max(pos.y, 0), canvasSize.height * zoom),
      };
    }

    const isCentered = CENTERED_TYPES.includes(el.type);
    const hasFlip = el.scaleX === -1 || el.scaleY === -1;
    let x = pos.x / zoom;
    let y = pos.y / zoom;

    if (isCentered || hasFlip) {
      x = x - el.width / 2;
      y = y - el.height / 2;
    }

    const clampedX = Math.min(Math.max(x, 0), canvasSize.width - el.width);
    const clampedY = Math.min(Math.max(y, 0), canvasSize.height - el.height);

    if (isCentered || hasFlip) {
      return {
        x: (clampedX + el.width / 2) * zoom,
        y: (clampedY + el.height / 2) * zoom,
      };
    }
    return {
      x: clampedX * zoom,
      y: clampedY * zoom,
    };
  };
}

const ElementNode = React.memo(function ElementNode({ el, isSelected, selectedIds, stageContainerRef, setGuides, getCurrentElements, canvasSize, snapEnabled, isInGroup = false }) {
  const shapeRef = useRef(null);
  const transformerRef = useRef(null);
  const textRef = useRef(null);
  const [editing, setEditing] = useState(false);
  const {
    setSelectedIds,
    toggleSelectedId,
    updateElement,
    deleteElement,
    undo,
    redo,
    duplicateElement,
    copyElement,
    pasteElement,
    moveElementUp,
    moveElementDown,
    selectedId,
    history,
    future,
    clipboardElement,
  } = useEditorStore();

  if (el.visible === false) return null;

  useEffect(() => {
    if (isSelected && shapeRef.current && transformerRef.current) {
      transformerRef.current.nodes([shapeRef.current]);
      transformerRef.current.getLayer().batchDraw();
    } else if (transformerRef.current) {
      transformerRef.current.nodes([]);
    }
  }, [isSelected, el.id]);

  const isCentered = CENTERED_TYPES.includes(el.type);
  const hasFlip = el.scaleX === -1 || el.scaleY === -1;

  const commonProps = {
    ref: shapeRef,
    id: el.id,
    name: el.id,
    hitStrokeWidth: 20,
    draggable: !isInGroup && el.locked !== true,
    dragBoundFunc: isInGroup ? undefined : makeDragBound(el, canvasSize),
    listening: !isInGroup,
    onClick: isInGroup ? undefined : (e) => {
      e.cancelBubble = true;
      const isShift = e.evt.shiftKey;
      if (isShift) {
        toggleSelectedId(el.id);
      } else {
        setSelectedIds([el.id]);
      }
    },
    onDragMove: isInGroup ? undefined : (e) => {
      const node = e.target;
      const zoom = useEditorStore.getState().zoom;
      const isCenteredType = CENTERED_TYPES.includes(el.type);

      // node.x()/y() are in stage coords — convert to canvas coords
      const nodeX = node.x() / zoom;
      const nodeY = node.y() / zoom;

      // Convert to top-left canvas coords
      const rawX = (isCenteredType || hasFlip) ? nodeX - el.width / 2 : nodeX;
      const rawY = (isCenteredType || hasFlip) ? nodeY - el.height / 2 : nodeY;

      const allElements = useEditorStore.getState().getCurrentElements();
      const otherEls = allElements.filter((elem) => elem.id !== el.id);
      const snapEnabledState = useEditorStore.getState().snapEnabled;

      const { x: snappedX, y: snappedY, guides } = getSnapPosition({
        dragEl: { x: rawX, y: rawY, width: el.width, height: el.height },
        elements: otherEls,
        canvasSize,
        enabled: snapEnabledState,
      });

      // Convert snapped canvas coords back to stage coords and apply
      if (isCenteredType || hasFlip) {
        node.x((snappedX + el.width / 2) * zoom);
        node.y((snappedY + el.height / 2) * zoom);
      } else {
        node.x(snappedX * zoom);
        node.y(snappedY * zoom);
      }

      setGuides(guides);
    },
    onDragEnd: isInGroup ? undefined : (e) => {
      setGuides([]);
      let x, y;
      if (CENTERED_TYPES.includes(el.type)) {
        ({ x, y } = centerToTopLeft(e, el));
      } else {
        const node = e.target;
        x = node.x();
        y = node.y();
        if (el.scaleX === -1 || el.scaleY === -1) {
          if (el.width) x = x - el.width / 2;
          if (el.height) y = y - el.height / 2;
        }
      }
      updateElement(el.id, { x, y });
    },
    onTransformEnd: isInGroup ? undefined : (e) => {
      const node = shapeRef.current;
      if (!node) return;
      const nodeScaleX = node.scaleX();
      const nodeScaleY = node.scaleY();
      node.scaleX(1);
      node.scaleY(1);
      const newWidth = Math.max(10, (node.width ? node.width() : el.width) * nodeScaleX);
      const newHeight = Math.max(10, (node.height ? node.height() : el.height) * nodeScaleY);
      let newX, newY;
      if (CENTERED_TYPES.includes(el.type)) {
        newX = node.x() - newWidth / 2;
        newY = node.y() - newHeight / 2;
      } else if (el.scaleX === -1 || el.scaleY === -1) {
        newX = node.x() - newWidth / 2;
        newY = node.y() - newHeight / 2;
      } else {
        newX = node.x();
        newY = node.y();
      }
      updateElement(el.id, {
        x: newX,
        y: newY,
        width: newWidth,
        height: newHeight,
        rotation: node.rotation(),
      });
    },
    opacity: el.opacity ?? 1,
    rotation: el.rotation ?? 0,
    scaleX: el.scaleX ?? 1,
    scaleY: el.scaleY ?? 1,
  };

  const isLineOrArrow = el.type === "line" || el.type === "arrow";
  const isText = el.type === "text";
  const transformerAnchors =
    isText
      ? ["middle-left", "middle-right"]
      : isLineOrArrow
        ? ["middle-left", "middle-right"]
        : undefined;

  if (el.type === "rect") {
    const isGradient =
      Array.isArray(el.fillLinearGradientColorStops) &&
      el.fillLinearGradientColorStops.length > 0;
    const hasFlip = el.scaleX === -1 || el.scaleY === -1;
    const rectPos = hasFlip
      ? { offsetX: el.width / 2, offsetY: el.height / 2, x: el.x + el.width / 2, y: el.y + el.height / 2 }
      : { x: el.x, y: el.y };
    return (
      <>
        <Rect
          {...commonProps}
          {...rectPos}
          width={el.width}
          height={el.height}
          fill={isGradient ? undefined : (el.fill || "#cccccc")}
          stroke={el.stroke || ""}
          strokeWidth={el.strokeWidth || 0}
          cornerRadius={el.cornerRadius ?? 0}
          fillLinearGradientStartPoint={isGradient ? (el.fillLinearGradientStartPoint || { x: 0, y: 0 }) : undefined}
          fillLinearGradientEndPoint={isGradient ? (el.fillLinearGradientEndPoint || { x: el.width, y: el.height }) : undefined}
          fillLinearGradientColorStops={isGradient ? el.fillLinearGradientColorStops : undefined}
        />
        {isSelected && selectedIds.length === 1 && (
          <Transformer
            ref={transformerRef}
            rotateEnabled={!el.locked}
            resizeEnabled={!el.locked}
            enabledAnchors={el.locked ? [] : transformerAnchors}
            borderDash={el.locked ? [3, 3] : undefined}
            borderStroke={el.locked ? "#f59e0b" : undefined}
            boundBoxFunc={(oldBox, newBox) => {
              if (newBox.width < 10 || newBox.height < 10) return oldBox;
              return newBox;
            }}
          />
        )}
      </>
    );
  }

  if (el.type === "circle") {
    return (
      <>
        <Ellipse
          {...commonProps}
          x={el.x + el.width / 2}
          y={el.y + el.height / 2}
          radiusX={el.width / 2}
          radiusY={el.height / 2}
          fill={el.fill}
          stroke={el.stroke || undefined}
          strokeWidth={el.strokeWidth || 0}
        />
        {isSelected && selectedIds.length === 1 && (
          <Transformer
            ref={transformerRef}
            rotateEnabled={!el.locked}
            resizeEnabled={!el.locked}
            enabledAnchors={el.locked ? [] : transformerAnchors}
            borderDash={el.locked ? [3, 3] : undefined}
            borderStroke={el.locked ? "#f59e0b" : undefined}
            boundBoxFunc={(oldBox, newBox) => {
              if (newBox.width < 10 || newBox.height < 10) return oldBox;
              return newBox;
            }}
          />
        )}
      </>
    );
  }

  if (el.type === "triangle") {
    return (
      <>
        <RegularPolygon
          {...commonProps}
          x={el.x + el.width / 2}
          y={el.y + el.height / 2}
          sides={3}
          radius={el.width / 2}
          fill={el.fill}
          stroke={el.stroke || undefined}
          strokeWidth={el.strokeWidth || 0}
        />
        {isSelected && selectedIds.length === 1 && (
          <Transformer
            ref={transformerRef}
            rotateEnabled={!el.locked}
            resizeEnabled={!el.locked}
            enabledAnchors={el.locked ? [] : transformerAnchors}
            borderDash={el.locked ? [3, 3] : undefined}
            borderStroke={el.locked ? "#f59e0b" : undefined}
            boundBoxFunc={(oldBox, newBox) => {
              if (newBox.width < 10 || newBox.height < 10) return oldBox;
              return newBox;
            }}
          />
        )}
      </>
    );
  }

  if (el.type === "star") {
    return (
      <>
        <Star
          {...commonProps}
          x={el.x + el.width / 2}
          y={el.y + el.height / 2}
          numPoints={5}
          innerRadius={el.width * 0.22}
          outerRadius={el.width * 0.5}
          fill={el.fill}
          stroke={el.stroke || undefined}
          strokeWidth={el.strokeWidth || 0}
        />
        {isSelected && selectedIds.length === 1 && (
          <Transformer
            ref={transformerRef}
            rotateEnabled={!el.locked}
            resizeEnabled={!el.locked}
            enabledAnchors={el.locked ? [] : transformerAnchors}
            borderDash={el.locked ? [3, 3] : undefined}
            borderStroke={el.locked ? "#f59e0b" : undefined}
            boundBoxFunc={(oldBox, newBox) => {
              if (newBox.width < 10 || newBox.height < 10) return oldBox;
              return newBox;
            }}
          />
        )}
      </>
    );
  }

  if (el.type === "pentagon") {
    return (
      <>
        <RegularPolygon
          {...commonProps}
          x={el.x + el.width / 2}
          y={el.y + el.height / 2}
          sides={5}
          radius={el.width / 2}
          fill={el.fill}
          stroke={el.stroke || undefined}
          strokeWidth={el.strokeWidth || 0}
        />
        {isSelected && selectedIds.length === 1 && (
          <Transformer
            ref={transformerRef}
            rotateEnabled={!el.locked}
            resizeEnabled={!el.locked}
            enabledAnchors={el.locked ? [] : transformerAnchors}
            borderDash={el.locked ? [3, 3] : undefined}
            borderStroke={el.locked ? "#f59e0b" : undefined}
            boundBoxFunc={(oldBox, newBox) => {
              if (newBox.width < 10 || newBox.height < 10) return oldBox;
              return newBox;
            }}
          />
        )}
      </>
    );
  }

  if (el.type === "heart" || el.type === "diamond") {
    const scaleX = el.width / 56;
    const scaleY = el.height / 56;
    const pathData = el.type === "heart" ? HEART_PATH : DIAMOND_PATH;
    const hasFlip = el.scaleX === -1 || el.scaleY === -1;
    const pathPos = hasFlip
      ? { offsetX: el.width / 2, offsetY: el.height / 2, x: el.x + el.width / 2, y: el.y + el.height / 2 }
      : { x: el.x, y: el.y };
    return (
      <>
        <Path
          {...commonProps}
          {...pathPos}
          data={pathData}
          scaleX={scaleX * (el.scaleX || 1)}
          scaleY={scaleY * (el.scaleY || 1)}
          fill={el.fill}
          stroke={el.stroke || undefined}
          strokeWidth={el.strokeWidth || 0}
        />
        {isSelected && selectedIds.length === 1 && (
          <Transformer
            ref={transformerRef}
            rotateEnabled={!el.locked}
            resizeEnabled={!el.locked}
            enabledAnchors={el.locked ? [] : transformerAnchors}
            borderDash={el.locked ? [3, 3] : undefined}
            borderStroke={el.locked ? "#f59e0b" : undefined}
            boundBoxFunc={(oldBox, newBox) => {
              if (newBox.width < 10 || newBox.height < 10) return oldBox;
              return newBox;
            }}
          />
        )}
      </>
    );
  }

  if (el.type === "line") {
    const hasFlip = el.scaleX === -1 || el.scaleY === -1;
    const linePos = hasFlip
      ? { offsetX: el.width / 2, offsetY: 0, x: el.x + el.width / 2, y: el.y }
      : { x: el.x, y: el.y };
    return (
      <>
        <Line
          {...commonProps}
          {...linePos}
          points={[0, 0, el.width, 0]}
          stroke={el.stroke || "#1e293b"}
          strokeWidth={el.strokeWidth || 3}
          dash={el.dash || []}
        />
        {isSelected && selectedIds.length === 1 && (
          <Transformer
            ref={transformerRef}
            rotateEnabled={true}
            enabledAnchors={["middle-left", "middle-right"]}
            boundBoxFunc={(oldBox, newBox) => {
              if (newBox.width < 10 || newBox.height < 10) return oldBox;
              return newBox;
            }}
          />
        )}
      </>
    );
  }

  if (el.type === "arrow") {
    const hasFlip = el.scaleX === -1 || el.scaleY === -1;
    const arrowPos = hasFlip
      ? { offsetX: el.width / 2, offsetY: 0, x: el.x + el.width / 2, y: el.y }
      : { x: el.x, y: el.y };
    return (
      <>
        <Arrow
          {...commonProps}
          {...arrowPos}
          points={[0, 0, el.width, 0]}
          stroke={el.stroke || "#1e293b"}
          strokeWidth={el.strokeWidth || 3}
          fill={el.stroke || "#1e293b"}
        />
        {isSelected && selectedIds.length === 1 && (
          <Transformer
            ref={transformerRef}
            rotateEnabled={true}
            enabledAnchors={["middle-left", "middle-right"]}
            boundBoxFunc={(oldBox, newBox) => {
              if (newBox.width < 10 || newBox.height < 10) return oldBox;
              return newBox;
            }}
          />
        )}
      </>
    );
  }

  function applyTextCase(text, textCase) {
    if (!text) return text;
    if (textCase === "upper") return text.toUpperCase();
    if (textCase === "lower") return text.toLowerCase();
    if (textCase === "title") return text.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
    return text;
  }

  if (el.type === "text") {
    const effectProps = {};
    if (el.textEffect === "shadow") {
      effectProps.shadowColor = el.effectColor || "#000000";
      effectProps.shadowBlur = el.effectBlur ?? 8;
      effectProps.shadowOffsetX = el.effectOffset?.x ?? 3;
      effectProps.shadowOffsetY = el.effectOffset?.y ?? 3;
      effectProps.shadowOpacity = el.effectOpacity ?? 0.4;
      effectProps.shadowEnabled = true;
    }
    if (el.textEffect === "glow") {
      effectProps.shadowColor = el.effectColor || el.fill || "#7c3aed";
      effectProps.shadowBlur = el.effectBlur ?? 16;
      effectProps.shadowOffsetX = 0;
      effectProps.shadowOffsetY = 0;
      effectProps.shadowOpacity = 0.8;
      effectProps.shadowEnabled = true;
    }
    if (el.textEffect === "lifted") {
      effectProps.shadowColor = "#000000";
      effectProps.shadowBlur = 20;
      effectProps.shadowOffsetX = 0;
      effectProps.shadowOffsetY = 8;
      effectProps.shadowOpacity = 0.25;
      effectProps.shadowEnabled = true;
    }
    if (el.textEffect === "hollow") {
      effectProps.fillEnabled = false;
      effectProps.stroke = el.fill || "#1e293b";
      effectProps.strokeWidth = 1.5;
    }
    if (el.textEffect === "neon") {
      effectProps.fill = "#ffffff";
      effectProps.shadowColor = el.effectColor || "#7c3aed";
      effectProps.shadowBlur = 20;
      effectProps.shadowOffsetX = 0;
      effectProps.shadowOffsetY = 0;
      effectProps.shadowOpacity = 1;
      effectProps.shadowEnabled = true;
    }
    const showBgRect = el.textEffect === "background";

    const handleDblClick = () => {
      const node = textRef.current;
      if (!node || !stageContainerRef?.current) return;
      const stage = node.getStage();
      const stageBox = stage.container().getBoundingClientRect();
      const absPos = node.getAbsolutePosition();

      const textarea = document.createElement("textarea");
      document.body.appendChild(textarea);

      textarea.value = el.text || "";
      textarea.style.position = "fixed";
      textarea.style.top = stageBox.top + absPos.y + "px";
      textarea.style.left = stageBox.left + absPos.x + "px";
      textarea.style.width = (el.width || 300) + "px";
      textarea.style.minHeight = "40px";
      textarea.style.fontSize = (el.fontSize || 24) + "px";
      textarea.style.fontFamily = el.fontFamily || "Inter";
      textarea.style.fontWeight = el.fontStyle === "bold" ? "bold" : "normal";
      textarea.style.fontStyle = el.fontStyle === "italic" ? "italic" : "normal";
      textarea.style.color = el.fill || "#1e293b";
      textarea.style.border = "2px solid #7c3aed";
      textarea.style.borderRadius = "2px";
      textarea.style.padding = "0px";
      textarea.style.margin = "0px";
      textarea.style.overflow = "hidden";
      textarea.style.background = "white";
      textarea.style.outline = "none";
      textarea.style.resize = "none";
      textarea.style.lineHeight = "1.2";
      textarea.style.transformOrigin = "top left";
      textarea.style.transform = `rotate(${el.rotation || 0}deg)`;
      textarea.style.zIndex = "1000";

      node.hide();
      setEditing(true);
      useEditorStore.getState().setTextEditing(true);
      textarea.focus();
      textarea.select();

      const finish = () => {
        const newText = textarea.value;
        updateElement(el.id, { text: newText });
        if (textarea.parentNode) document.body.removeChild(textarea);
        node.show();
        setEditing(false);
        useEditorStore.getState().commitTextSnapshot();
        setTimeout(() => {
          if (node) {
            const h = node.height();
            if (h) updateElement(el.id, { text: newText, height: h });
          }
        }, 50);
      };

      textarea.addEventListener("blur", finish);
      textarea.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
          if (textarea.parentNode) document.body.removeChild(textarea);
          node.show();
          setEditing(false);
          useEditorStore.getState().setTextEditing(false);
        }
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          finish();
        }
        e.stopPropagation();
      });
    };

    return (
      <>
        {showBgRect && (
          <Rect
            x={el.x - (el.bgPadding || 8)}
            y={el.y - (el.bgPadding || 8) / 2}
            width={(el.width || 200) + (el.bgPadding || 8) * 2}
            height={(el.fontSize || 16) * 1.3 + (el.bgPadding || 8)}
            fill={el.bgColor || "#000000"}
            opacity={el.bgOpacity ?? 0.6}
            cornerRadius={4}
            listening={false}
          />
        )}
        <KonvaText
          ref={textRef}
          x={el.x}
          y={el.y}
          width={el.width}
          text={applyTextCase(el.text || "Double-click to edit", el.textCase)}
          fontSize={el.fontSize || 24}
          fontFamily={el.fontFamily || "Inter"}
          fontStyle={el.fontStyle || "normal"}
          fill={el.textEffect === "hollow" ? "transparent" : el.fill || "#1e293b"}
          align={el.align || "left"}
          textDecoration={el.textDecoration || ""}
          lineHeight={el.lineHeight ?? 1.2}
          letterSpacing={el.letterSpacing ?? 0}
          wrap="word"
          {...effectProps}
          {...commonProps}
          onDblClick={handleDblClick}
          onDblTap={handleDblClick}
        />
        {isSelected && selectedIds.length === 1 && (
          <Transformer
            ref={transformerRef}
            rotateEnabled={true}
            enabledAnchors={["middle-left", "middle-right"]}
            boundBoxFunc={(oldBox, newBox) => {
              if (newBox.width < 10 || newBox.height < 10) return oldBox;
              return newBox;
            }}
          />
        )}
      </>
    );
  }

  if (el.type === "drawing") {
    const drawingProps = {
      ...commonProps,
      dragBoundFunc: makeDragBound(el, canvasSize),
      onDragMove: undefined,
      onTransformEnd: undefined,
    };
    return (
      <>
        <Path
          ref={shapeRef}
          id={el.id}
          data={el.pathData}
          fill={el.fill || "#1e293b"}
          opacity={el.opacity ?? 1}
          rotation={el.rotation || 0}
          x={el.x}
          y={el.y}
          draggable={!el.locked}
          onClick={(e) => {
            e.cancelBubble = true;
            setSelectedIds([el.id]);
          }}
          onDragEnd={(e) => {
            updateElement(el.id, { x: e.target.x(), y: e.target.y() });
          }}
          {...drawingProps}
        />
        {isSelected && selectedIds.length === 1 && (
          <Rect
            x={el.x}
            y={el.y}
            width={el.width}
            height={el.height}
            stroke="#7c3aed"
            strokeWidth={2}
            dash={[4, 4]}
            listening={false}
          />
        )}
      </>
    );
  }

  if (el.type === "image") {
    const { ref: _r, ...restProps } = commonProps;
    return (
      <ImageElement
        el={el}
        commonProps={restProps}
        shapeRef={shapeRef}
        isSelected={isSelected}
        selectedIds={selectedIds}
        transformerRef={transformerRef}
      />
    );
  }

  if (el.type === "chart") {
    return (
      <>
        <Rect
          {...commonProps}
          x={el.x}
          y={el.y}
          width={el.width}
          height={el.height}
          fill="transparent"
          stroke={isSelected ? "#7c3aed" : "transparent"}
          strokeWidth={isSelected ? 2 : 0}
          dash={[4, 3]}
        />
        {isSelected && selectedIds.length === 1 && (
          <Transformer
            ref={transformerRef}
            rotateEnabled={!el.locked}
            resizeEnabled={!el.locked}
            boundBoxFunc={(oldBox, newBox) => {
              if (newBox.width < 200 || newBox.height < 150) return oldBox;
              return newBox;
            }}
          />
        )}
      </>
    );
  }

  if (el.type === "table") {
    return (
      <>
        <Rect
          {...commonProps}
          x={el.x}
          y={el.y}
          width={el.width}
          height={el.height}
          fill="transparent"
          stroke={isSelected ? "#7c3aed" : "transparent"}
          strokeWidth={isSelected ? 2 : 0}
          dash={[4, 3]}
        />
        {isSelected && selectedIds.length === 1 && (
          <Transformer
            ref={transformerRef}
            rotateEnabled={!el.locked}
            resizeEnabled={!el.locked}
            boundBoxFunc={(oldBox, newBox) => {
              if (newBox.width < 100 || newBox.height < 60) return oldBox;
              return newBox;
            }}
          />
        )}
      </>
    );
  }

  if (el.type === "statBlock") {
    return (
      <>
        <Rect
          {...commonProps}
          x={el.x}
          y={el.y}
          width={el.width}
          height={el.height}
          fill="transparent"
          stroke={isSelected ? "#7c3aed" : "transparent"}
          strokeWidth={isSelected ? 2 : 0}
          dash={[4, 3]}
        />
        {isSelected && selectedIds.length === 1 && (
          <Transformer
            ref={transformerRef}
            rotateEnabled={!el.locked}
            resizeEnabled={!el.locked}
            boundBoxFunc={(oldBox, newBox) => {
              if (newBox.width < 100 || newBox.height < 60) return oldBox;
              return newBox;
            }}
          />
        )}
      </>
    );
  }

  if (el.type === "timeline") {
    return (
      <>
        <Rect
          {...commonProps}
          x={el.x}
          y={el.y}
          width={el.width}
          height={el.height}
          fill="transparent"
          stroke={isSelected ? "#7c3aed" : "transparent"}
          strokeWidth={isSelected ? 2 : 0}
          dash={[4, 3]}
        />
        {isSelected && selectedIds.length === 1 && (
          <Transformer
            ref={transformerRef}
            rotateEnabled={!el.locked}
            resizeEnabled={!el.locked}
            boundBoxFunc={(oldBox, newBox) => {
              if (newBox.width < 200 || newBox.height < 80) return oldBox;
              return newBox;
            }}
          />
        )}
      </>
    );
  }

  if (el.type === "callout") {
    const pathData = getCalloutPath(
      el.width,
      el.height,
      el.tailDir || "bottom-left",
      el.cornerRadius || 10
    );
    const tailHeight = el.height * 0.28;
    return (
      <>
        <Group
          ref={shapeRef}
          id={el.id}
          x={el.x}
          y={el.y}
          rotation={el.rotation || 0}
          draggable={!el.locked}
          onClick={(e) => {
            e.cancelBubble = true;
            setSelectedIds([el.id]);
          }}
          onDragEnd={(e) => {
            updateElement(el.id, { x: e.target.x(), y: e.target.y() });
          }}
          onTransformEnd={(e) => {
            const node = shapeRef.current;
            if (!node) return;
            const sx = node.scaleX();
            node.scaleX(1);
            const sy = node.scaleY();
            node.scaleY(1);
            updateElement(el.id, {
              x: node.x(),
              y: node.y(),
              width: Math.max(60, el.width * sx),
              height: Math.max(40, el.height * sy),
              rotation: node.rotation(),
            });
          }}
        >
          <Path
            data={pathData}
            fill={el.fill || "#7c3aed"}
            stroke={el.stroke || undefined}
            strokeWidth={el.strokeWidth || 0}
            opacity={el.opacity ?? 1}
            listening={true}
          />
          {el.text && (
            <KonvaText
              x={12}
              y={12}
              width={el.width - 24}
              height={el.height - 24 - tailHeight}
              text={el.text}
              fontSize={el.fontSize || 14}
              fontFamily={el.fontFamily || "Inter"}
              fill={el.textColor || "#ffffff"}
              align="center"
              verticalAlign="middle"
              wrap="word"
              listening={false}
            />
          )}
        </Group>
        {isSelected && selectedIds.length === 1 && (
          <Transformer
            ref={transformerRef}
            rotateEnabled={!el.locked}
            resizeEnabled={!el.locked}
            boundBoxFunc={(oldBox, newBox) => {
              if (newBox.width < 60 || newBox.height < 40) return oldBox;
              return newBox;
            }}
          />
        )}
      </>
    );
  }

  if (el.type === "frame") {
    return (
      <FrameElement
        el={el}
        commonProps={commonProps}
        shapeRef={shapeRef}
        transformerRef={transformerRef}
        isSelected={isSelected}
        selectedIds={selectedIds}
        updateElement={updateElement}
        setSelectedIds={setSelectedIds}
      />
    );
  }

  if (el.type === "connector") {
    const elements = useEditorStore.getState().getCurrentElements();
    const fromEl = elements.find((e) => e.id === el.fromId);
    const toEl = elements.find((e) => e.id === el.toId);

    let points;
    if (el.staticPoints && el.staticPoints.length >= 4) {
      points = el.staticPoints;
    } else if (fromEl && toEl) {
      const from = getAnchorPoint(fromEl, el.fromAnchor || "bottom");
      const to = getAnchorPoint(toEl, el.toAnchor || "top");
      points =
        el.routing === "elbow"
          ? getElbowPoints(from, to)
          : [from.x, from.y, to.x, to.y];
    } else {
      points = [el.x || 0, el.y || 0, (el.x || 0) + 100, (el.y || 0) + 100];
    }

    const hasArrow = el.arrowEnd !== false;

    return (
      <>
        <Arrow
          ref={shapeRef}
          id={el.id}
          points={points}
          pointerLength={hasArrow ? 10 : 0}
          pointerWidth={hasArrow ? 8 : 0}
          fill={el.stroke || "#7c3aed"}
          stroke={el.stroke || "#7c3aed"}
          strokeWidth={el.strokeWidth ?? 2}
          opacity={el.opacity ?? 1}
          tension={el.routing === "curved" ? 0.5 : 0}
          onClick={(e) => {
            e.cancelBubble = true;
            setSelectedIds([el.id]);
          }}
          listening={true}
          hitStrokeWidth={12}
        />
        {el.label && points.length >= 4 && (
          <KonvaText
            x={(points[0] + points[points.length - 2]) / 2 - 40}
            y={(points[1] + points[points.length - 1]) / 2 - 10}
            width={80}
            height={20}
            text={el.label}
            fontSize={el.labelFontSize || 11}
            fill={el.stroke || "#7c3aed"}
            align="center"
            fontFamily="Inter"
            listening={false}
          />
        )}
      </>
    );
  }

  if (el.type === "flowchart") {
    const pathData = getFlowchartPath(el.subtype, el.width, el.height);
    const ShapeEl = pathData ? Path : Rect;
    const shapeProps = pathData
      ? { data: pathData }
      : { width: el.width, height: el.height, cornerRadius: 6 };

    const handleFlowchartClick = (e) => {
      e.cancelBubble = true;
      const connectionFromId = useEditorStore.getState().connectionFromId;
      if (connectionFromId && connectionFromId !== el.id) {
        useEditorStore.getState().addElement({
          type: "connector",
          fromId: connectionFromId,
          toId: el.id,
          fromAnchor: "bottom",
          toAnchor: "top",
          routing: "elbow",
          stroke: "#7c3aed",
          strokeWidth: 2,
          arrowEnd: true,
          arrowStart: false,
          label: "",
          x: 0,
          y: 0,
          width: 0,
          height: 0,
          rotation: 0,
          opacity: 1,
        });
        useEditorStore.getState().clearConnectionFrom();
      }
      setSelectedIds([el.id]);
    };

    return (
      <>
        <ShapeEl
          ref={shapeRef}
          id={el.id}
          x={el.x}
          y={el.y}
          {...shapeProps}
          fill={el.fill || "#ede9fe"}
          stroke={el.stroke || "#7c3aed"}
          strokeWidth={el.strokeWidth ?? 2}
          opacity={el.opacity ?? 1}
          rotation={el.rotation || 0}
          draggable={!el.locked}
          onClick={handleFlowchartClick}
          onDragEnd={(e) => {
            updateElement(el.id, { x: e.target.x(), y: e.target.y() });
          }}
          onTransformEnd={(e) => {
            const node = shapeRef.current;
            if (!node) return;
            const sx = node.scaleX();
            node.scaleX(1);
            const sy = node.scaleY();
            node.scaleY(1);
            updateElement(el.id, {
              x: node.x(),
              y: node.y(),
              width: Math.max(40, el.width * sx),
              height: Math.max(30, el.height * sy),
              rotation: node.rotation(),
            });
          }}
        />
        {el.text && (
          <KonvaText
            x={el.x + 6}
            y={el.y + 6}
            width={el.width - 12}
            height={el.height - 12}
            text={el.text}
            fontSize={el.fontSize || 13}
            fontFamily={el.fontFamily || "Inter"}
            fill={el.textColor || "#1e293b"}
            align="center"
            verticalAlign="middle"
            wrap="word"
            listening={false}
          />
        )}
        {isSelected && selectedIds.length === 1 && (
          <Transformer
            ref={transformerRef}
            rotateEnabled={!el.locked}
            resizeEnabled={!el.locked}
            boundBoxFunc={(oldBox, newBox) => {
              if (newBox.width < 40 || newBox.height < 30) return oldBox;
              return newBox;
            }}
          />
        )}
      </>
    );
  }

  if (el.type === "graphic") {
    return (
      <>
        <Rect
          {...commonProps}
          x={el.x}
          y={el.y}
          width={el.width}
          height={el.height}
          fill="transparent"
          stroke={isSelected ? "#7c3aed" : "transparent"}
          strokeWidth={isSelected ? 2 : 0}
          dash={[4, 3]}
        />
        {isSelected && selectedIds.length === 1 && (
          <Transformer
            ref={transformerRef}
            rotateEnabled={!el.locked}
            resizeEnabled={!el.locked}
            boundBoxFunc={(oldBox, newBox) => {
              if (newBox.width < 20 || newBox.height < 20) return oldBox;
              return newBox;
            }}
          />
        )}
      </>
    );
  }

  if (el.type === "group") {
    const groupRef = useRef();
    const groupTransformerRef = useRef();
    const groupIsSelected = selectedIds.includes(el.id);

    useEffect(() => {
      if (groupIsSelected && selectedIds.length === 1 && groupRef.current && groupTransformerRef.current) {
        groupTransformerRef.current.nodes([groupRef.current]);
        groupTransformerRef.current.getLayer()?.batchDraw();
      } else if (groupTransformerRef.current) {
        groupTransformerRef.current.nodes([]);
      }
    }, [groupIsSelected, selectedIds.length, el.id]);

    return (
      <>
        <Group
          ref={groupRef}
          id={el.id}
          x={el.x}
          y={el.y}
          rotation={el.rotation || 0}
          opacity={el.opacity ?? 1}
          draggable={el.locked !== true}
          dragBoundFunc={makeDragBound(el, canvasSize)}
          onClick={(e) => {
            e.cancelBubble = true;
            const isShift = e.evt.shiftKey;
            if (isShift) {
              toggleSelectedId(el.id);
            } else {
              setSelectedIds([el.id]);
            }
          }}
          onDragMove={(e) => {
            const node = e.target;
            const zoom = useEditorStore.getState().zoom;
            const rawX = node.x() / zoom;
            const rawY = node.y() / zoom;
            const allElements = useEditorStore.getState().getCurrentElements();
            const otherEls = allElements.filter((elem) => elem.id !== el.id);
            const snapEnabledState = useEditorStore.getState().snapEnabled;
            const { x: snappedX, y: snappedY, guides } = getSnapPosition({
              dragEl: { x: rawX, y: rawY, width: el.width, height: el.height },
              elements: otherEls,
              canvasSize,
              enabled: snapEnabledState,
            });
            node.x(snappedX * zoom);
            node.y(snappedY * zoom);
            setGuides(guides);
          }}
          onDragEnd={(e) => {
            setGuides([]);
            updateElement(el.id, { x: e.target.x(), y: e.target.y() });
          }}
          onTransformEnd={() => {
            const node = groupRef.current;
            if (!node) return;
            const scaleX = node.scaleX();
            const scaleY = node.scaleY();
            node.scaleX(1);
            node.scaleY(1);
            updateElement(el.id, {
              x: node.x(),
              y: node.y(),
              width: el.width * scaleX,
              height: el.height * scaleY,
              rotation: node.rotation(),
            });
          }}
        >
          <Rect
            width={el.width}
            height={el.height}
            fill="transparent"
          />
          {el.children?.map((child) => (
            <ElementNode
              key={child.id}
              el={child}
              isSelected={false}
              selectedIds={[]}
              stageContainerRef={stageContainerRef}
              setGuides={setGuides}
              getCurrentElements={getCurrentElements}
              canvasSize={canvasSize}
              snapEnabled={snapEnabled}
              isInGroup={true}
            />
          ))}
        </Group>
        {groupIsSelected && selectedIds.length === 1 && (
          <Transformer
            ref={groupTransformerRef}
            rotateEnabled={true}
            boundBoxFunc={(oldBox, newBox) =>
              newBox.width < 10 || newBox.height < 10 ? oldBox : newBox
            }
          />
        )}
      </>
    );
  }

  return null;
}, (prevProps, nextProps) =>
  prevProps.el === nextProps.el &&
  prevProps.isSelected === nextProps.isSelected &&
  prevProps.canvasSize === nextProps.canvasSize &&
  prevProps.snapEnabled === nextProps.snapEnabled
);

function MultiTransformer({ selectedIds }) {
  const trRef = useRef();
  const updateElement = useEditorStore((s) => s.updateElement);

  useEffect(() => {
    if (!trRef.current) return;
    const stage = trRef.current.getStage();
    if (!stage) return;
    const nodes = selectedIds
      .map((id) => stage.findOne("#" + id))
      .filter(Boolean);
    trRef.current.nodes(nodes);
    trRef.current.getLayer()?.batchDraw();
  }, [selectedIds]);

  return (
    <Transformer
      ref={trRef}
      rotateEnabled={true}
      boundBoxFunc={(oldBox, newBox) => {
        if (newBox.width < 10 || newBox.height < 10) return oldBox;
        return newBox;
      }}
      onTransformEnd={() => {
        const stage = trRef.current?.getStage();
        if (!stage) return;
        selectedIds.forEach((id) => {
          const node = stage.findOne("#" + id);
          if (!node) return;
          const scaleX = node.scaleX();
          const scaleY = node.scaleY();
          node.scaleX(1);
          node.scaleY(1);
          updateElement(id, {
            x: node.x(),
            y: node.y(),
            width: Math.max(10, (node.width ? node.width() : 0) * scaleX),
            height: Math.max(10, (node.height ? node.height() : 0) * scaleY),
            rotation: node.rotation(),
          });
        });
      }}
    />
  );
}

function getFrameClipFunc(shape, w, h, cornerRadius = 20) {
  return (ctx) => {
    ctx.beginPath();
    switch (shape) {
      case "circle":
        ctx.arc(w / 2, h / 2, Math.min(w, h) / 2, 0, Math.PI * 2);
        break;
      case "roundedRect": {
        const r = cornerRadius;
        ctx.moveTo(r, 0);
        ctx.lineTo(w - r, 0);
        ctx.quadraticCurveTo(w, 0, w, r);
        ctx.lineTo(w, h - r);
        ctx.quadraticCurveTo(w, h, w - r, h);
        ctx.lineTo(r, h);
        ctx.quadraticCurveTo(0, h, 0, h - r);
        ctx.lineTo(0, r);
        ctx.quadraticCurveTo(0, 0, r, 0);
        break;
      }
      case "hexagon": {
        const cx = w / 2;
        const cy = h / 2;
        const rx = w / 2;
        const ry = h / 2;
        for (let i = 0; i < 6; i++) {
          const angle = (Math.PI / 3) * i - Math.PI / 6;
          const px = cx + rx * Math.cos(angle);
          const py = cy + ry * Math.sin(angle);
          i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
        }
        ctx.closePath();
        break;
      }
      case "diamond": {
        const cx = w / 2;
        const cy = h / 2;
        ctx.moveTo(cx, 0);
        ctx.lineTo(w, cy);
        ctx.lineTo(cx, h);
        ctx.lineTo(0, cy);
        ctx.closePath();
        break;
      }
      case "triangle":
        ctx.moveTo(w / 2, 0);
        ctx.lineTo(w, h);
        ctx.lineTo(0, h);
        ctx.closePath();
        break;
      default:
        ctx.rect(0, 0, w, h);
    }
    ctx.clip();
  };
}

function FrameElement({ el, commonProps, shapeRef, transformerRef, isSelected, selectedIds, updateElement, setSelectedIds }) {
  const [img] = useImage(el.src || null);
  const w = el.width;
  const h = el.height;
  const scale = el.imageScale || 1;
  const offsetX = el.imageOffsetX || 0;
  const offsetY = el.imageOffsetY || 0;
  let imgX = offsetX;
  let imgY = offsetY;
  let imgW = w * scale;
  let imgH = h * scale;

  if (img) {
    const imgAspect = img.width / img.height;
    const frameAspect = w / h;
    if (el.imageFit === "cover") {
      if (imgAspect > frameAspect) {
        imgH = h * scale;
        imgW = imgH * imgAspect;
        imgX = (w - imgW) / 2 + offsetX;
        imgY = offsetY;
      } else {
        imgW = w * scale;
        imgH = imgW / imgAspect;
        imgX = offsetX;
        imgY = (h - imgH) / 2 + offsetY;
      }
    } else if (el.imageFit === "contain") {
      if (imgAspect > frameAspect) {
        imgW = w * scale;
        imgH = imgW / imgAspect;
        imgX = offsetX;
        imgY = (h - imgH) / 2 + offsetY;
      } else {
        imgH = h * scale;
        imgW = imgH * imgAspect;
        imgX = (w - imgW) / 2 + offsetX;
        imgY = offsetY;
      }
    }
  }

  const clip = getFrameClipFunc(el.frameShape, w, h, el.cornerRadius || 20);

  useEffect(() => {
    if (isSelected && shapeRef.current && transformerRef.current) {
      transformerRef.current.nodes([shapeRef.current]);
      transformerRef.current.getLayer().batchDraw();
    } else if (transformerRef.current) {
      transformerRef.current.nodes([]);
    }
  }, [isSelected, el.id]);

  return (
    <>
      <Group
        ref={shapeRef}
        id={el.id}
        x={el.x}
        y={el.y}
        clipFunc={clip}
        opacity={el.opacity ?? 1}
        rotation={el.rotation || 0}
        draggable={!el.locked}
        onClick={(e) => {
          e.cancelBubble = true;
          setSelectedIds([el.id]);
        }}
        onDragEnd={(e) => {
          updateElement(el.id, { x: e.target.x(), y: e.target.y() });
        }}
        onTransformEnd={(e) => {
          const node = shapeRef.current;
          if (!node) return;
          const sx = node.scaleX();
          node.scaleX(1);
          const sy = node.scaleY();
          node.scaleY(1);
          updateElement(el.id, {
            x: node.x(),
            y: node.y(),
            width: Math.max(40, el.width * sx),
            height: Math.max(40, el.height * sy),
            rotation: node.rotation(),
          });
        }}
      >
        {img ? (
          <KonvaImage
            image={img}
            x={imgX}
            y={imgY}
            width={imgW}
            height={imgH}
            listening={false}
          />
        ) : (
          <>
            <Rect x={0} y={0} width={w} height={h} fill="#f1f5f9" listening={false} />
            <KonvaText
              x={0}
              y={h / 2 - 10}
              width={w}
              height={20}
              text="Drop image here"
              fontSize={12}
              fill="#94a3b8"
              align="center"
              verticalAlign="middle"
              listening={false}
            />
          </>
        )}
      </Group>
      {el.strokeWidth > 0 && (
        <FrameBorderShape el={el} />
      )}
      {isSelected && selectedIds.length === 1 && (
        <Transformer
          ref={transformerRef}
          rotateEnabled={!el.locked}
          resizeEnabled={!el.locked}
          boundBoxFunc={(oldBox, newBox) => {
            if (newBox.width < 40 || newBox.height < 40) return oldBox;
            return newBox;
          }}
        />
      )}
    </>
  );
}

function FrameBorderShape({ el }) {
  const w = el.width;
  const h = el.height;
  const stroke = el.strokeColor || "#7c3aed";
  const sw = el.strokeWidth || 2;

  switch (el.frameShape) {
    case "circle":
      return (
        <Ellipse
          x={el.x + w / 2}
          y={el.y + h / 2}
          radiusX={w / 2}
          radiusY={h / 2}
          stroke={stroke}
          strokeWidth={sw}
          fill="transparent"
          listening={false}
        />
      );
    case "roundedRect":
      return (
        <Rect
          x={el.x}
          y={el.y}
          width={w}
          height={h}
          cornerRadius={el.cornerRadius || 20}
          stroke={stroke}
          strokeWidth={sw}
          fill="transparent"
          listening={false}
        />
      );
    case "hexagon": {
      const cx = w / 2;
      const cy = h / 2;
      const rx = w / 2;
      const ry = h / 2;
      const pts = [];
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i - Math.PI / 6;
        pts.push(`${cx + rx * Math.cos(angle)} ${cy + ry * Math.sin(angle)}`);
      }
      const pathData = `M ${pts.join(" L ")} Z`;
      return (
        <Path
          x={el.x}
          y={el.y}
          data={pathData}
          stroke={stroke}
          strokeWidth={sw}
          fill="transparent"
          listening={false}
        />
      );
    }
    case "diamond": {
      const cx = w / 2;
      const cy = h / 2;
      const pathData = `M ${cx} 0 L ${w} ${cy} L ${cx} ${h} L 0 ${cy} Z`;
      return (
        <Path
          x={el.x}
          y={el.y}
          data={pathData}
          stroke={stroke}
          strokeWidth={sw}
          fill="transparent"
          listening={false}
        />
      );
    }
    case "triangle": {
      const pathData = `M ${w / 2} 0 L ${w} ${h} L 0 ${h} Z`;
      return (
        <Path
          x={el.x}
          y={el.y}
          data={pathData}
          stroke={stroke}
          strokeWidth={sw}
          fill="transparent"
          listening={false}
        />
      );
    }
    default:
      return (
        <Rect
          x={el.x}
          y={el.y}
          width={w}
          height={h}
          stroke={stroke}
          strokeWidth={sw}
          fill="transparent"
          listening={false}
        />
      );
  }
}

function ImageElement({ el, commonProps, shapeRef, isSelected, selectedIds = [], transformerRef }) {
  const srcFromId = useImageSrc(el.imageId);
  const effectiveSrc = el.src || srcFromId;
  const [img, status] = useImage(effectiveSrc || "", "anonymous");
  const hasFlip = el.scaleX === -1 || el.scaleY === -1;
  const imgPos = hasFlip
    ? { offsetX: el.width / 2, offsetY: el.height / 2, x: el.x + el.width / 2, y: el.y + el.height / 2 }
    : { x: el.x, y: el.y };

  useEffect(() => {
    if (isSelected && shapeRef.current && transformerRef.current) {
      transformerRef.current.nodes([shapeRef.current]);
      transformerRef.current.getLayer().batchDraw();
    } else if (transformerRef.current) {
      transformerRef.current.nodes([]);
    }
  }, [isSelected, el.id]);

  useEffect(() => {
    if (!shapeRef.current || !img) return;
    const node = shapeRef.current;
    const filters = [];
    if (el.filters?.includes("grayscale")) filters.push(Konva.Filters.Grayscale);
    if (el.brightness !== undefined && el.brightness !== 0) filters.push(Konva.Filters.Brighten);
    if (el.contrast !== undefined && el.contrast !== 0) filters.push(Konva.Filters.Contrast);
    if (filters.length > 0) {
      node.cache();
      node.filters(filters);
      if (el.brightness !== undefined) node.brightness(el.brightness);
      if (el.contrast !== undefined) node.contrast(el.contrast);
    } else {
      node.clearCache();
      node.filters([]);
    }
    node.getLayer()?.batchDraw();
  }, [el.filters, el.brightness, el.contrast, img]);

  const transformerEl = (
    <Transformer
      ref={transformerRef}
      rotateEnabled={!el.locked}
      resizeEnabled={!el.locked}
      borderDash={el.locked ? [3, 3] : undefined}
      borderStroke={el.locked ? "#f59e0b" : undefined}
      boundBoxFunc={(oldBox, newBox) => {
        if (newBox.width < 10 || newBox.height < 10) return oldBox;
        return newBox;
      }}
    />
  );

  if (status === "loading" || !img) {
    return (
      <>
        <Rect
          ref={shapeRef}
          {...imgPos}
          width={el.width}
          height={el.height}
          fill="#e2e8f0"
          stroke="#cbd5e1"
          strokeWidth={1}
          scaleX={el.scaleX ?? 1}
          scaleY={el.scaleY ?? 1}
          {...commonProps}
        />
        {isSelected && selectedIds.length === 1 && transformerEl}
      </>
    );
  }

  if (status === "failed") {
    return (
      <>
        <Rect
          ref={shapeRef}
          {...imgPos}
          width={el.width}
          height={el.height}
          fill="#fee2e2"
          stroke="#fca5a5"
          strokeWidth={1}
          scaleX={el.scaleX ?? 1}
          scaleY={el.scaleY ?? 1}
          {...commonProps}
        />
        {isSelected && selectedIds.length === 1 && transformerEl}
      </>
    );
  }

  const hasCrop = el.cropX != null || el.cropY != null || el.cropWidth != null || el.cropHeight != null;
  const origW = el.originalWidth ?? el.width;
  const origH = el.originalHeight ?? el.height;
  const cropX = el.cropX ?? 0;
  const cropY = el.cropY ?? 0;

  if (hasCrop) {
    return (
      <>
        <Group
          ref={shapeRef}
          x={el.x}
          y={el.y}
          clip={{ x: 0, y: 0, width: el.width, height: el.height }}
          {...commonProps}
        >
          <KonvaImage
            image={img}
            x={-cropX}
            y={-cropY}
            width={origW}
            height={origH}
            listening={false}
          />
        </Group>
        {isSelected && selectedIds.length === 1 && transformerEl}
      </>
    );
  }

  return (
    <>
      <KonvaImage
        ref={shapeRef}
        image={img}
        {...imgPos}
        width={el.width}
        height={el.height}
        {...commonProps}
      />
      {isSelected && selectedIds.length === 1 && transformerEl}
    </>
  );
}

export function Canvas({ onContextMenu }) {
  const stageContainerRef = useRef(null);
  const stageRef = useRef(null);
  const containerRef = useRef(null);
  const drawPointsRef = useRef([]);
  const [guides, setGuides] = useState([]);
  const [marquee, setMarquee] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawPoints, setDrawPoints] = useState([]);
  const [hoverElement, setHoverElement] = useState(false);
  const toast = useToast();

  const canvasSize = useEditorStore((s) => s.canvasSize);
  const currentPageId = useEditorStore((s) => s.currentPageId);
  const elements = useEditorStore((s) => {
    const page = s.pages.find((p) => p.id === s.currentPageId);
    return page?.elements ?? [];
  });
  const selectedId = useEditorStore((s) => s.selectedId);
  const selectedIds = useEditorStore((s) => s.selectedIds);
  const zoom = useEditorStore((s) => s.zoom);
  const snapEnabled = useEditorStore((s) => s.snapEnabled);
  const showGrid = useEditorStore((s) => s.showGrid);
  const showRulers = useEditorStore((s) => s.showRulers);
  const drawMode = useEditorStore((s) => s.drawMode);

  const setSelectedIds = useEditorStore((s) => s.setSelectedIds);
  const clearSelection = useEditorStore((s) => s.clearSelection);
  const deleteElement = useEditorStore((s) => s.deleteElement);
  const deleteSelected = useEditorStore((s) => s.deleteSelected);
  const undo = useEditorStore((s) => s.undo);
  const redo = useEditorStore((s) => s.redo);
  const duplicateElement = useEditorStore((s) => s.duplicateElement);
  const duplicateSelected = useEditorStore((s) => s.duplicateSelected);
  const copyElement = useEditorStore((s) => s.copyElement);
  const pasteElement = useEditorStore((s) => s.pasteElement);
  const moveElementUp = useEditorStore((s) => s.moveElementUp);
  const moveElementDown = useEditorStore((s) => s.moveElementDown);
  const moveSelected = useEditorStore((s) => s.moveSelected);
  const groupSelected = useEditorStore((s) => s.groupSelected);
  const ungroupSelected = useEditorStore((s) => s.ungroupSelected);
  const zoomIn = useEditorStore((s) => s.zoomIn);
  const zoomOut = useEditorStore((s) => s.zoomOut);
  const setDrawMode = useEditorStore((s) => s.setDrawMode);
  const addElement = useEditorStore((s) => s.addElement);
  const setShowShortcuts = useEditorStore((s) => s.setShowShortcuts);
  const fitToScreen = useEditorStore((s) => s.fitToScreen);
  const toggleGrid = useEditorStore((s) => s.toggleGrid);
  const toggleRulers = useEditorStore((s) => s.toggleRulers);
  const saveProject = useEditorStore((s) => s.saveProject);
  const setPresentMode = useEditorStore((s) => s.setPresentMode);

  const drawColor = useEditorStore((s) => s.drawColor);
  const drawSize = useEditorStore((s) => s.drawSize);
  const drawOpacity = useEditorStore((s) => s.drawOpacity);
  const title = useEditorStore((s) => s.title);

  const getCurrentElements = useEditorStore((s) => s.getCurrentElements);

  useEffect(() => {
    clearSelection();
  }, [currentPageId, clearSelection]);

  useEffect(() => {
    const handler = (e) => {
      if (
        e.target.tagName === "INPUT" ||
        e.target.tagName === "TEXTAREA" ||
        e.target.isContentEditable
      )
        return;

      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        if (selectedIds.length > 1) deleteSelected();
        else if (selectedId) deleteElement(selectedId);
      } else if ((e.ctrlKey || e.metaKey) && e.key === "a") {
        e.preventDefault();
        const all = getCurrentElements().map((el) => el.id);
        setSelectedIds(all);
      } else if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        if (e.shiftKey) {
          e.preventDefault();
          redo();
        } else {
          e.preventDefault();
          undo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key === "y") {
        e.preventDefault();
        redo();
      } else if ((e.ctrlKey || e.metaKey) && e.key === "d") {
        e.preventDefault();
        if (selectedIds.length > 1) duplicateSelected();
        else if (selectedId) duplicateElement(selectedId);
      } else if ((e.ctrlKey || e.metaKey) && e.key === "g") {
        e.preventDefault();
        if (e.shiftKey) {
          ungroupSelected();
        } else if (selectedIds.length >= 2) {
          groupSelected();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key === "c") {
        if (selectedId) copyElement(selectedId);
      } else if ((e.ctrlKey || e.metaKey) && e.key === "v") {
        e.preventDefault();
        pasteElement();
      } else if ((e.ctrlKey || e.metaKey) && e.key === "]") {
        e.preventDefault();
        if (selectedId) moveElementUp(selectedId);
      } else if ((e.ctrlKey || e.metaKey) && e.key === "[") {
        e.preventDefault();
        if (selectedId) moveElementDown(selectedId);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        const step = e.shiftKey ? 10 : 1;
        moveSelected(-step, 0);
        stageRef.current?.batchDraw();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        const step = e.shiftKey ? 10 : 1;
        moveSelected(step, 0);
        stageRef.current?.batchDraw();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        const step = e.shiftKey ? 10 : 1;
        moveSelected(0, -step);
        stageRef.current?.batchDraw();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        const step = e.shiftKey ? 10 : 1;
        moveSelected(0, step);
        stageRef.current?.batchDraw();
      } else if (e.key === "Escape") {
        if (drawMode) {
          setDrawMode(false);
        } else {
          clearSelection();
        }
      } else if (e.key === "?" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        setShowShortcuts(true);
      } else if ((e.key === "v" || e.key === "V") && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setDrawMode(false);
        clearSelection();
      } else if ((e.key === "p" || e.key === "P") && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setDrawMode(true);
      } else if ((e.key === "t" || e.key === "T") && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        const textEl = {
          type: "text",
          x: canvasSize.width / 2 - 150,
          y: canvasSize.height / 2 - 20,
          width: 300,
          text: "Double-click to edit",
          fontSize: 24,
          fontFamily: "Inter",
          fill: "#1e293b",
        };
        addElement(textEl);
      } else if ((e.ctrlKey || e.metaKey) && (e.key === "=" || e.key === "+")) {
        e.preventDefault();
        zoomIn();
      } else if ((e.ctrlKey || e.metaKey) && e.key === "-") {
        e.preventDefault();
        zoomOut();
      } else if ((e.ctrlKey || e.metaKey) && e.key === "0") {
        e.preventDefault();
        fitToScreen();
      } else if ((e.ctrlKey || e.metaKey) && e.key === "'") {
        e.preventDefault();
        toggleGrid();
      } else if ((e.ctrlKey || e.metaKey) && (e.key === "r" || e.key === "R")) {
        e.preventDefault();
        toggleRulers();
      } else if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        saveProject(title || "Untitled Design");
        toast("Project saved!", "success");
      } else if ((e.ctrlKey || e.metaKey) && e.key === "p") {
        e.preventDefault();
        setPresentMode(true);
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [
    selectedId,
    selectedIds,
    deleteElement,
    deleteSelected,
    undo,
    redo,
    duplicateElement,
    duplicateSelected,
    copyElement,
    pasteElement,
    moveElementUp,
    moveElementDown,
    moveSelected,
    groupSelected,
    ungroupSelected,
    setSelectedIds,
    clearSelection,
    getCurrentElements,
    drawMode,
    setDrawMode,
    setShowShortcuts,
    zoomIn,
    zoomOut,
    fitToScreen,
    toggleGrid,
    toggleRulers,
    addElement,
    canvasSize,
    saveProject,
    title,
    setPresentMode,
    toast,
  ]);

  const canvasAreaWidth = canvasSize.width * zoom;
  const canvasAreaHeight = canvasSize.height * zoom;

  const cursor = drawMode ? "crosshair" : selectedIds.length > 0 ? "move" : hoverElement ? "move" : "default";

  const lastTouchDist = useRef(0);
  const getTouchDist = (e) => {
    const t = e.touches;
    if (t.length < 2) return 0;
    return Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);
  };

  const isTouchDevice = typeof window !== "undefined" && "ontouchstart" in window;

  return (
    <div
      ref={stageContainerRef}
      className={`flex-1 overflow-auto bg-gray-100 flex items-start justify-center relative ${showRulers ? "pt-5 pl-5" : "p-10"}`}
      onContextMenu={(e) => e.preventDefault()}
      onWheel={(e) => {
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          if (e.deltaY < 0) zoomIn();
          else zoomOut();
        }
      }}
      onTouchStart={(e) => {
        if (e.touches.length === 2) lastTouchDist.current = getTouchDist(e);
      }}
      onTouchMove={(e) => {
        if (e.touches.length === 2) {
          e.preventDefault();
          const dist = getTouchDist(e);
          if (lastTouchDist.current > 0) {
            const delta = dist - lastTouchDist.current;
            lastTouchDist.current = dist;
            const { zoom: z, setZoom } = useEditorStore.getState();
            setZoom(z + delta * 0.005);
          } else {
            lastTouchDist.current = dist;
          }
        }
      }}
      onMouseLeave={() => setHoverElement(false)}
      style={{ cursor }}
    >
      <Rulers canvasAreaWidth={canvasAreaWidth} canvasAreaHeight={canvasAreaHeight} />
      <MiniMap />
      <div
        ref={containerRef}
        className="relative flex-shrink-0"
        style={{ width: canvasAreaWidth, height: canvasAreaHeight }}
      >
        <Stage
        ref={stageRef}
        width={canvasSize.width * zoom}
        height={canvasSize.height * zoom}
        scaleX={zoom}
        scaleY={zoom}
        style={{ background: "white", boxShadow: "0 8px 40px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08)", borderRadius: "2px", cursor }}
        onMouseDown={(e) => {
          const target = e.target;
          if (target !== target.getStage() && target.name() !== "background") return;
          const pos = target.getStage().getPointerPosition();
          const zoomVal = useEditorStore.getState().zoom;
          const canvasX = pos.x / zoomVal;
          const canvasY = pos.y / zoomVal;

          if (drawMode) {
            const pts = [[canvasX, canvasY, 0.5]];
            drawPointsRef.current = pts;
            setIsDrawing(true);
            setDrawPoints(pts);
            return;
          }
          setMarquee({
            startX: canvasX,
            startY: canvasY,
            currentX: canvasX,
            currentY: canvasY,
          });
          clearSelection();
        }}
        onMouseMove={(e) => {
          const target = e.target;
          const stage = target.getStage();
          const pos = stage.getPointerPosition();
          const zoomVal = useEditorStore.getState().zoom;
          const canvasX = pos.x / zoomVal;
          const canvasY = pos.y / zoomVal;

          const isStageOrBg = target === stage || target.name() === "background";
          setHoverElement(!isStageOrBg);

          if (drawMode && isDrawing) {
            const next = [...drawPointsRef.current, [canvasX, canvasY, 0.5]];
            drawPointsRef.current = next;
            setDrawPoints(next);
            return;
          }
          if (!marquee) return;
          setMarquee((prev) => ({
            ...prev,
            currentX: canvasX,
            currentY: canvasY,
          }));
        }}
        onMouseUp={(e) => {
          if (drawMode && isDrawing) {
            const pts = drawPointsRef.current;
            setIsDrawing(false);
            drawPointsRef.current = [];
            setDrawPoints([]);
            if (pts.length < 2) return;
            const stroke = getStroke(pts, {
              size: drawSize,
              thinning: 0.5,
              smoothing: 0.5,
              streamline: 0.5,
            });
            const pathData = getSvgPathFromStroke(stroke);
            let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
            stroke.forEach(([px, py]) => {
              minX = Math.min(minX, px);
              minY = Math.min(minY, py);
              maxX = Math.max(maxX, px);
              maxY = Math.max(maxY, py);
            });
            const pad = drawSize + 2;
            const bx = Math.max(0, minX - pad);
            const by = Math.max(0, minY - pad);
            const bw = Math.max(20, Math.min(canvasSize.width - bx, maxX - minX + pad * 2));
            const bh = Math.max(20, Math.min(canvasSize.height - by, maxY - minY + pad * 2));
            const relPath = pathData.replace(/(\d+\.?\d*),(\d+\.?\d*)/g, (_, x, y) =>
              `${(Number(x) - bx).toFixed(2)},${(Number(y) - by).toFixed(2)}`
            );
            addElement({
              type: "drawing",
              x: bx,
              y: by,
              width: Math.max(20, bw),
              height: Math.max(20, bh),
              pathData: relPath,
              fill: drawColor,
              opacity: drawOpacity,
              rotation: 0,
            });
            return;
          }
          if (!marquee) return;
          const selRect = {
            x: Math.min(marquee.startX, marquee.currentX),
            y: Math.min(marquee.startY, marquee.currentY),
            width: Math.abs(marquee.currentX - marquee.startX),
            height: Math.abs(marquee.currentY - marquee.startY),
          };
          if (selRect.width > 4 && selRect.height > 4) {
            const elementsList = useEditorStore.getState().getCurrentElements();
            const hit = elementsList.filter((el) => {
              return !(
                el.x + (el.width || 0) < selRect.x ||
                el.x > selRect.x + selRect.width ||
                el.y + (el.height || 0) < selRect.y ||
                el.y > selRect.y + selRect.height
              );
            });
            if (hit.length > 0) {
              useEditorStore.getState().setSelectedIds(hit.map((el) => el.id));
            }
          }
          setMarquee(null);
        }}
        onClick={(e) => {
          if (e.target === e.target.getStage()) clearSelection();
        }}
        onTap={(e) => {
          if (e.target === e.target.getStage()) clearSelection();
        }}
        onContextMenu={(e) => {
          e.evt.preventDefault();
          if (isTouchDevice) return;
          const target = e.target;
          if (target === target.getStage() || target.name() === "background") {
            clearSelection();
            return;
          }
          const id = target.name() || selectedId;
          if (id) setSelectedIds([id]);
          onContextMenu?.(e.evt.clientX, e.evt.clientY, id || selectedId);
        }}
        >
        <Layer>
          <Rect
            name="background"
            width={canvasSize.width}
            height={canvasSize.height}
            fill={canvasSize.backgroundColor || "#ffffff"}
            listening={true}
          />
          {showGrid &&
            Array.from({ length: Math.ceil(canvasSize.width / 40) }, (_, i) => (
              <Line
                key={`v${i}`}
                points={[i * 40, 0, i * 40, canvasSize.height]}
                stroke="#e2e8f0"
                strokeWidth={0.5}
                listening={false}
              />
            ))}
          {showGrid &&
            Array.from({ length: Math.ceil(canvasSize.height / 40) }, (_, i) => (
              <Line
                key={`h${i}`}
                points={[0, i * 40, canvasSize.width, i * 40]}
                stroke="#e2e8f0"
                strokeWidth={0.5}
                listening={false}
              />
            ))}
          {elements.length === 0 && (
            <KonvaText
              text="Click the sidebar to add elements"
              fontSize={14}
              fill="#94a3b8"
              x={canvasSize.width / 2}
              y={canvasSize.height / 2}
              offsetX={150}
              align="center"
              width={300}
              listening={false}
            />
          )}
          {elements.map((el) => (
            <ElementNode
              key={el.id}
              el={el}
              isSelected={selectedIds.includes(el.id)}
              selectedIds={selectedIds}
              stageContainerRef={stageContainerRef}
              setGuides={setGuides}
              getCurrentElements={getCurrentElements}
              canvasSize={canvasSize}
              snapEnabled={snapEnabled}
            />
          ))}
          {selectedIds.length > 1 && <MultiTransformer selectedIds={selectedIds} />}
        </Layer>
        <Layer listening={false}>
          {guides.map((guide, i) =>
            guide.type === "vertical" ? (
              <Line
                key={i}
                points={[guide.position, 0, guide.position, canvasSize.height]}
                stroke="#7c3aed"
                strokeWidth={1}
                dash={[4, 4]}
                listening={false}
              />
            ) : (
              <Line
                key={i}
                points={[0, guide.position, canvasSize.width, guide.position]}
                stroke="#7c3aed"
                strokeWidth={1}
                dash={[4, 4]}
                listening={false}
              />
            )
          )}
          {marquee &&
            (() => {
              const rx = Math.min(marquee.startX, marquee.currentX);
              const ry = Math.min(marquee.startY, marquee.currentY);
              const rw = Math.abs(marquee.currentX - marquee.startX);
              const rh = Math.abs(marquee.currentY - marquee.startY);
              return (
                <Rect
                  x={rx}
                  y={ry}
                  width={rw}
                  height={rh}
                  fill="rgba(124,58,237,0.08)"
                  stroke="#7c3aed"
                  strokeWidth={1}
                  dash={[4, 3]}
                  listening={false}
                />
              );
            })()}
          {isDrawing && drawPoints.length > 1 &&
            (() => {
              const stroke = getStroke(drawPoints, {
                size: drawSize,
                thinning: 0.5,
                smoothing: 0.5,
                streamline: 0.5,
              });
              const pathData = getSvgPathFromStroke(stroke);
              return (
                <Path
                  data={pathData}
                  fill={drawColor}
                  opacity={drawOpacity}
                  listening={false}
                />
              );
            })()}
        </Layer>
      </Stage>
        {/* Chart, Table, Graphic HTML overlays — positioned relative to Stage container */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ zIndex: 10 }}
        >
          {elements
            .filter((el) => el.type === "chart" && el.visible !== false)
            .map((el) => (
              <ChartElement key={el.id} el={el} zoom={zoom} />
            ))}
          {elements
            .filter((el) => el.type === "table" && el.visible !== false)
            .map((el) => (
              <TableElement key={el.id} el={el} zoom={zoom} />
            ))}
          {elements
            .filter((el) => el.type === "graphic" && el.visible !== false)
            .map((el) => (
              <GraphicElement key={el.id} el={el} zoom={zoom} />
            ))}
          {elements
            .filter((el) => el.type === "statBlock" && el.visible !== false)
            .map((el) => (
              <StatBlockElement key={el.id} el={el} zoom={zoom} />
            ))}
          {elements
            .filter((el) => el.type === "timeline" && el.visible !== false)
            .map((el) => (
              <TimelineElement key={el.id} el={el} zoom={zoom} />
            ))}
        </div>
        <CropOverlay />
      </div>
    </div>
  );
}
