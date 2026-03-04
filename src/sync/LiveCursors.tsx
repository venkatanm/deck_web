/**
 * LiveCursors - Renders remote users' cursors and names on the canvas.
 * Uses Yjs Awareness protocol for (x, y) client coords and user info.
 */

import { useState, useEffect } from "react";
import { useAwarenessStates } from "./useAwareness";

interface LiveCursorsProps {
  awareness: import("y-protocols/awareness").Awareness | undefined;
  containerRef: React.RefObject<HTMLDivElement | null>;
}

export function LiveCursors({ awareness, containerRef }: LiveCursorsProps) {
  const states = useAwarenessStates(awareness);
  const [rect, setRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => setRect(el.getBoundingClientRect());
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [containerRef]);

  if (states.size === 0 || !rect) return null;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        zIndex: 10000,
      }}
    >
      {Array.from(states.values()).map((s) => {
        if (s.x == null || s.y == null) return null;
        const left = s.x - rect.left;
        const top = s.y - rect.top;
        return (
          <div
            key={s.clientID}
            style={{
              position: "absolute",
              left,
              top,
              transform: "translate(12px, 4px)",
            }}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.3))" }}
            >
              <path
                d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 0 1 .35-.15h6.87a.5.5 0 0 0 .35-.85L6.35 2.86a.5.5 0 0 0-.85.35Z"
                fill={s.color ?? "#3B82F6"}
                stroke="white"
                strokeWidth="1.5"
              />
            </svg>
            <div
              style={{
                position: "absolute",
                left: 20,
                top: 0,
                padding: "2px 8px",
                background: s.color ?? "#3B82F6",
                color: "white",
                fontSize: 12,
                fontWeight: 500,
                borderRadius: 4,
                whiteSpace: "nowrap",
                maxWidth: 150,
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {s.name ?? `User ${s.clientID}`}
            </div>
          </div>
        );
      })}
    </div>
  );
}
