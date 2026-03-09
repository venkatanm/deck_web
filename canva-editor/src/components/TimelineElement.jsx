import React from "react";
import useEditorStore from "../store/useEditorStore";

function HorizontalTimeline({ el }) {
  const items = el.items || [];
  const n = items.length;
  const accent = el.accentColor || "#7c3aed";
  const font = "Inter, sans-serif";

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        fontFamily: font,
        position: "relative",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: `${(1 / (n * 2)) * 100}%`,
          right: `${(1 / (n * 2)) * 100}%`,
          height: 3,
          background: el.lineColor || "#e2e8f0",
          transform: "translateY(-50%)",
          zIndex: 0,
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${(items.filter((i) => i.done).length / Math.max(n - 1, 1)) * 100}%`,
            background: accent,
            borderRadius: 2,
            transition: "width 0.4s ease",
          }}
        />
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          position: "relative",
          zIndex: 1,
          padding: "0 4px",
        }}
      >
        {items.map((item, i) => {
          const doneCount = items.filter((x) => x.done).length;
          const isActive = i === doneCount;
          const isDone = item.done;
          const dotColor = isDone || isActive ? accent : el.lineColor || "#e2e8f0";
          const textW = Math.floor(el.width / n) - 8;

          return (
            <div
              key={i}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 8,
                width: `${100 / n}%`,
              }}
            >
              <div
                style={{
                  textAlign: "center",
                  width: textW,
                  fontSize: Math.min(el.width * 0.018, 13),
                  fontWeight: 700,
                  color: isDone ? "#1e293b" : "#94a3b8",
                  lineHeight: 1.3,
                }}
              >
                {item.label}
              </div>

              {(el.style || "dots") === "arrows" ? (
                <div style={{ color: isDone || isActive ? accent : el.lineColor || "#e2e8f0", fontSize: isActive ? 22 : 18, lineHeight: 1, flexShrink: 0 }}>
                  ➤
                </div>
              ) : (el.style || "dots") === "numbered" ? (
                <div style={{
                  width: isActive ? 26 : 20, height: isActive ? 26 : 20,
                  borderRadius: "50%",
                  background: isDone || isActive ? accent : el.lineColor || "#e2e8f0",
                  color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: isActive ? 12 : 10, fontWeight: 700, flexShrink: 0,
                  boxShadow: isActive ? `0 0 0 4px ${accent}33` : "none",
                }}>
                  {i + 1}
                </div>
              ) : (
                <div
                  style={{
                    width: isActive ? 20 : 14,
                    height: isActive ? 20 : 14,
                    borderRadius: "50%",
                    background: dotColor,
                    border: `3px solid ${isDone || isActive ? accent : el.lineColor || "#e2e8f0"}`,
                    boxShadow: isActive ? `0 0 0 4px ${accent}33` : "none",
                    flexShrink: 0,
                    transition: "all 0.2s",
                  }}
                />
              )}

              <div
                style={{
                  textAlign: "center",
                  width: textW,
                  fontSize: Math.min(el.width * 0.014, 11),
                  fontWeight: 600,
                  color: isDone ? accent : "#94a3b8",
                }}
              >
                {item.sublabel}
              </div>

              {item.description && (
                <div
                  style={{
                    textAlign: "center",
                    width: textW,
                    fontSize: Math.min(el.width * 0.012, 10),
                    color: "#94a3b8",
                    lineHeight: 1.3,
                  }}
                >
                  {item.description}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function VerticalTimeline({ el }) {
  const items = el.items || [];
  const accent = el.accentColor || "#7c3aed";

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        fontFamily: "Inter, sans-serif",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "4px 0",
        position: "relative",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 12,
          top: 12,
          bottom: 12,
          width: 3,
          background: el.lineColor || "#e2e8f0",
          borderRadius: 2,
          zIndex: 0,
        }}
      />

      {items.map((item, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            gap: 16,
            alignItems: "flex-start",
            position: "relative",
            zIndex: 1,
          }}
        >
          <div
            style={{
              width: 26,
              height: 26,
              borderRadius: "50%",
              background: accent,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontSize: 11,
              fontWeight: 700,
              flexShrink: 0,
              boxShadow: `0 0 0 4px ${accent}22`,
            }}
          >
            {i + 1}
          </div>

          <div style={{ paddingTop: 2 }}>
            <div
              style={{
                fontSize: Math.min(el.width * 0.04, 14),
                fontWeight: 700,
                color: "#1e293b",
                lineHeight: 1.2,
              }}
            >
              {item.label}
            </div>
            {item.sublabel && (
              <div
                style={{
                  fontSize: Math.min(el.width * 0.034, 11),
                  color: accent,
                  fontWeight: 600,
                  marginTop: 1,
                }}
              >
                {item.sublabel}
              </div>
            )}
            {item.description && (
              <div
                style={{
                  fontSize: Math.min(el.width * 0.03, 11),
                  color: "#64748b",
                  lineHeight: 1.4,
                  marginTop: 3,
                }}
              >
                {item.description}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function StepsTimeline({ el }) {
  const items = el.items || [];
  const n = items.length;
  const accent = el.accentColor || "#7c3aed";

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        fontFamily: "Inter, sans-serif",
        display: "flex",
        alignItems: "center",
        gap: 0,
      }}
    >
      {items.map((item, i) => (
        <React.Fragment key={i}>
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 8,
              padding: "0 6px",
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: "50%",
                background: i === 0 ? accent : `${accent}22`,
                color: i === 0 ? "#fff" : accent,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 18,
                fontWeight: 800,
                flexShrink: 0,
              }}
            >
              {String(i + 1).padStart(2, "0")}
            </div>
            <div
              style={{
                fontSize: Math.min(el.width * 0.02, 14),
                fontWeight: 700,
                color: "#1e293b",
                textAlign: "center",
              }}
            >
              {item.label}
            </div>
            {item.description && (
              <div
                style={{
                  fontSize: Math.min(el.width * 0.016, 11),
                  color: "#64748b",
                  textAlign: "center",
                  lineHeight: 1.4,
                }}
              >
                {item.description}
              </div>
            )}
          </div>

          {i < n - 1 && (
            <div
              style={{
                color: el.lineColor || "#e2e8f0",
                fontSize: 20,
                flexShrink: 0,
                marginBottom: 32,
              }}
            >
              →
            </div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

const TimelineElement = React.memo(function TimelineElement({ el, zoom }) {
  const isSelected = useEditorStore(
    (s) => s.selectedId === el.id || s.selectedIds?.includes(el.id)
  );

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
        pointerEvents: isSelected ? "auto" : "none",
        zIndex: isSelected ? 5 : 2,
      }}
    >
      <div
        style={{
          transform: `scale(${zoom})`,
          transformOrigin: "top left",
          width: el.width,
          height: el.height,
        }}
      >
        {el.subtype === "horizontal" && <HorizontalTimeline el={el} />}
        {el.subtype === "vertical" && <VerticalTimeline el={el} />}
        {el.subtype === "steps" && <StepsTimeline el={el} />}
      </div>
    </div>
  );
}, (prev, next) => prev.el === next.el && prev.zoom === next.zoom);

export default TimelineElement;
