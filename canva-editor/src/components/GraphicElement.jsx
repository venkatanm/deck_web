import React from "react";
import * as Icons from "lucide-react";

const GraphicElement = React.memo(function GraphicElement({ el, zoom }) {
  const IconComp = Icons[el.iconName];

  if (!IconComp) return null;

  return (
    <div
      style={{
        position: "absolute",
        left: el.x * zoom,
        top: el.y * zoom,
        width: el.width * zoom,
        height: el.height * zoom,
        opacity: el.opacity ?? 1,
        transform: `rotate(${el.rotation || 0}deg)`,
        transformOrigin: "top left",
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          transform: `scale(${zoom})`,
          transformOrigin: "top left",
          width: el.width,
          height: el.height,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <IconComp
          width={el.width}
          height={el.height}
          style={{ color: el.fill || "#7c3aed" }}
          strokeWidth={el.strokeWidth || 1.5}
        />
      </div>
    </div>
  );
}, (prev, next) => prev.el === next.el && prev.zoom === next.zoom);

export default GraphicElement;
