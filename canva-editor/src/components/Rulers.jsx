import { useEffect, useRef } from "react";
import useEditorStore from "../store/useEditorStore";

function HorizontalRuler({ width }) {
  const canvasRef = useRef();
  const zoom = useEditorStore((s) => s.zoom);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;

    canvas.width = width * dpr;
    canvas.height = 20 * dpr;
    canvas.style.width = width + "px";
    canvas.style.height = "20px";

    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, 20);
    ctx.fillStyle = "#f8fafc";
    ctx.fillRect(0, 0, width, 20);

    ctx.strokeStyle = "#cbd5e1";
    ctx.fillStyle = "#94a3b8";
    ctx.font = "9px Inter, sans-serif";
    ctx.textAlign = "center";

    const step = 10 * zoom;
    const majStep = 100 * zoom;

    for (let x = 0; x <= width; x += step) {
      const isMajor = Math.round(x / step) % 10 === 0;
      const tickH = isMajor ? 10 : 5;

      ctx.beginPath();
      ctx.moveTo(x, 20 - tickH);
      ctx.lineTo(x, 20);
      ctx.strokeStyle = isMajor ? "#94a3b8" : "#cbd5e1";
      ctx.stroke();

      if (isMajor && x > 0) {
        ctx.fillText(Math.round(x / zoom), x, 9);
      }
    }
  }, [width, zoom]);

  return (
    <canvas
      ref={canvasRef}
      style={{ display: "block", cursor: "default" }}
    />
  );
}

function VerticalRuler({ height }) {
  const canvasRef = useRef();
  const zoom = useEditorStore((s) => s.zoom);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;

    canvas.width = 20 * dpr;
    canvas.height = height * dpr;
    canvas.style.width = "20px";
    canvas.style.height = height + "px";

    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, 20, height);
    ctx.fillStyle = "#f8fafc";
    ctx.fillRect(0, 0, 20, height);

    ctx.strokeStyle = "#cbd5e1";
    ctx.fillStyle = "#94a3b8";
    ctx.font = "9px Inter, sans-serif";
    ctx.textAlign = "center";

    const step = 10 * zoom;

    for (let y = 0; y <= height; y += step) {
      const isMajor = Math.round(y / step) % 10 === 0;
      const tickW = isMajor ? 10 : 5;

      ctx.beginPath();
      ctx.moveTo(20 - tickW, y);
      ctx.lineTo(20, y);
      ctx.strokeStyle = isMajor ? "#94a3b8" : "#cbd5e1";
      ctx.stroke();

      if (isMajor && y > 0) {
        ctx.save();
        ctx.translate(9, y);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText(Math.round(y / zoom), 0, 0);
        ctx.restore();
      }
    }
  }, [height, zoom]);

  return (
    <canvas
      ref={canvasRef}
      style={{ display: "block", cursor: "default" }}
    />
  );
}

export default function Rulers({ canvasAreaWidth, canvasAreaHeight }) {
  const showRulers = useEditorStore((s) => s.showRulers);
  if (!showRulers) return null;

  return (
    <>
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: 20,
          height: 20,
          zIndex: 10,
          background: "#f1f5f9",
          borderRight: "1px solid #e2e8f0",
          borderBottom: "1px solid #e2e8f0",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 20,
          right: 0,
          height: 20,
          zIndex: 10,
          overflow: "hidden",
          borderBottom: "1px solid #e2e8f0",
        }}
      >
        <HorizontalRuler width={canvasAreaWidth} />
      </div>
      <div
        style={{
          position: "absolute",
          top: 20,
          left: 0,
          bottom: 0,
          width: 20,
          zIndex: 10,
          overflow: "hidden",
          borderRight: "1px solid #e2e8f0",
        }}
      >
        <VerticalRuler height={canvasAreaHeight} />
      </div>
    </>
  );
}
