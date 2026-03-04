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
import Rulers from "./Rulers";
import MiniMap from "./MiniMap";
import CropOverlay from "./CropOverlay";
import ChartElement from "./charts/ChartElement";

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

  if (el.type === "text") {
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
      textarea.focus();
      textarea.select();

      const finish = () => {
        const newText = textarea.value;
        updateElement(el.id, { text: newText });
        if (textarea.parentNode) document.body.removeChild(textarea);
        node.show();
        setEditing(false);
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
        <KonvaText
          ref={textRef}
          x={el.x}
          y={el.y}
          width={el.width}
          text={el.text || "Double-click to edit"}
          fontSize={el.fontSize || 24}
          fontFamily={el.fontFamily || "Inter"}
          fontStyle={el.fontStyle || "normal"}
          fill={el.fill || "#1e293b"}
          align={el.align || "left"}
          textDecoration={el.textDecoration || ""}
          lineHeight={el.lineHeight ?? 1.2}
          letterSpacing={el.letterSpacing ?? 0}
          wrap="word"
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
  prevProps.isSelected === nextProps.isSelected &&
  prevProps.el?.id === nextProps.el?.id &&
  JSON.stringify(prevProps.el) === JSON.stringify(nextProps.el)
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

function ImageElement({ el, commonProps, shapeRef, isSelected, selectedIds = [], transformerRef }) {
  const [img, status] = useImage(el.src || "", "anonymous");
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
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
  const drawPointsRef = useRef([]);
  const [guides, setGuides] = useState([]);
  const [marquee, setMarquee] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawPoints, setDrawPoints] = useState([]);
  const [hoverElement, setHoverElement] = useState(false);
  const toast = useToast();

  useEffect(() => {
    const updatePos = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      setStagePos({ x: rect.left, y: rect.top });
    };
    updatePos();
    window.addEventListener('resize', updatePos);
    window.addEventListener('scroll', updatePos, true);
    return () => {
      window.removeEventListener('resize', updatePos);
      window.removeEventListener('scroll', updatePos, true);
    };
  }, []);
  const {
    canvasSize,
    setSelectedIds,
    clearSelection,
    getCurrentElements,
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
    zoom,
    zoomIn,
    zoomOut,
    showGrid,
    showRulers,
    snapEnabled,
    drawMode,
    setDrawMode,
    drawColor,
    drawSize,
    drawOpacity,
    addElement,
    setShowShortcuts,
    fitToScreen,
    toggleGrid,
    toggleRulers,
    saveProject,
    title,
    setPresentMode,
  } = useEditorStore();

  const elements = getCurrentElements();
  const currentPageId = useEditorStore((s) => s.currentPageId);

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
        {/* Chart HTML overlays */}
        <div className="absolute inset-0 pointer-events-none">
          {elements
            .filter((el) => el.type === "chart" && el.visible !== false)
            .map((el) => (
              <ChartElement
                key={el.id}
                el={el}
                stagePos={stagePos}
                zoom={zoom}
              />
            ))}
        </div>
        <CropOverlay />
      </div>
    </div>
  );
}
