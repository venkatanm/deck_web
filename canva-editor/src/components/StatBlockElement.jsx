import React from "react";
import * as Icons from "lucide-react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import useEditorStore from "../store/useEditorStore";

function KPICard({ el }) {
  const TrendIcon =
    el.trendDir === "up"
      ? TrendingUp
      : el.trendDir === "down"
        ? TrendingDown
        : Minus;
  const trendColor =
    el.trendDir === "up"
      ? "#16a34a"
      : el.trendDir === "down"
        ? "#dc2626"
        : "#64748b";

  const isDark = el.style === "dark";
  const bg = isDark ? "#1e293b" : el.bgColor || "#ffffff";
  const fg = isDark ? "#ffffff" : el.textColor || "#1e293b";
  const border =
    el.style === "bordered" ? `2px solid ${el.accentColor}` : "none";
  const shadow = el.style === "flat" ? "none" : "0 2px 12px rgba(0,0,0,0.08)";

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: bg,
        borderRadius: 12,
        border,
        boxShadow: shadow,
        padding: "16px 18px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        fontFamily: "Inter, sans-serif",
        overflow: "hidden",
        position: "relative",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 4,
          background: el.accentColor || "#7c3aed",
          borderRadius: "12px 12px 0 0",
        }}
      />
      <div
        style={{
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: "0.06em",
          color: isDark ? "#94a3b8" : "#64748b",
          textTransform: "uppercase",
          marginTop: 4,
        }}
      >
        {el.label}
      </div>
      <div
        style={{
          fontSize: Math.min(el.width * 0.16, 42),
          fontWeight: 800,
          color: fg,
          lineHeight: 1.1,
        }}
      >
        {el.value}
      </div>
      {el.trend && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            fontSize: 12,
            color: trendColor,
            fontWeight: 600,
          }}
        >
          <TrendIcon size={14} />
          <span>{el.trend}</span>
          <span
            style={{
              color: isDark ? "#64748b" : "#94a3b8",
              fontWeight: 400,
            }}
          >
            {el.trendLabel}
          </span>
        </div>
      )}
    </div>
  );
}

function ComparisonCard({ el }) {
  const isDark = el.style === "dark";
  const bg = isDark ? "#1e293b" : el.bgColor || "#ffffff";
  const fg = isDark ? "#ffffff" : el.textColor || "#1e293b";

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: bg,
        borderRadius: 12,
        boxShadow: el.style === "flat" ? "none" : "0 2px 12px rgba(0,0,0,0.08)",
        display: "flex",
        alignItems: "center",
        fontFamily: "Inter, sans-serif",
        overflow: "hidden",
        position: "relative",
      }}
    >
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "12px 8px",
          borderRight: `1px solid ${isDark ? "#334155" : "#f1f5f9"}`,
        }}
      >
        <span
          style={{
            fontSize: Math.min(el.width * 0.12, 38),
            fontWeight: 800,
            color: el.accentColor || "#7c3aed",
            lineHeight: 1,
          }}
        >
          {el.leftValue}
        </span>
        <span
          style={{
            fontSize: 11,
            color: isDark ? "#94a3b8" : "#64748b",
            marginTop: 4,
          }}
        >
          {el.leftLabel}
        </span>
      </div>
      <div
        style={{
          width: 36,
          textAlign: "center",
          fontSize: 11,
          fontWeight: 700,
          color: isDark ? "#475569" : "#cbd5e1",
          flexShrink: 0,
        }}
      >
        {el.vsLabel || "vs"}
      </div>
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "12px 8px",
          borderLeft: `1px solid ${isDark ? "#334155" : "#f1f5f9"}`,
        }}
      >
        <span
          style={{
            fontSize: Math.min(el.width * 0.12, 38),
            fontWeight: 800,
            color: fg,
            lineHeight: 1,
          }}
        >
          {el.rightValue}
        </span>
        <span
          style={{
            fontSize: 11,
            color: isDark ? "#94a3b8" : "#64748b",
            marginTop: 4,
          }}
        >
          {el.rightLabel}
        </span>
      </div>
    </div>
  );
}

function ProgressStatCard({ el }) {
  const pct = Math.min(100, Math.max(0, el.value || 0));
  const isDark = el.style === "dark";
  const bg = isDark ? "#1e293b" : el.bgColor || "#ffffff";
  const fg = isDark ? "#ffffff" : el.textColor || "#1e293b";

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: bg,
        borderRadius: 12,
        boxShadow: el.style === "flat" ? "none" : "0 2px 12px rgba(0,0,0,0.08)",
        padding: "14px 16px",
        display: "flex",
        flexDirection: "column",
        gap: 8,
        fontFamily: "Inter, sans-serif",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
        }}
      >
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: isDark ? "#94a3b8" : "#64748b",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
          }}
        >
          {el.label}
        </span>
        <span
          style={{
            fontSize: 22,
            fontWeight: 800,
            color: el.accentColor || "#7c3aed",
          }}
        >
          {pct}%
        </span>
      </div>
      <div
        style={{
          height: 10,
          borderRadius: 5,
          background: el.trackColor || "#e9d5ff",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${pct}%`,
            background: el.accentColor || "#7c3aed",
            borderRadius: 5,
            transition: "width 0.3s ease",
          }}
        />
      </div>
      {el.sublabel && (
        <span
          style={{
            fontSize: 11,
            color: isDark ? "#64748b" : "#94a3b8",
          }}
        >
          {el.sublabel}
        </span>
      )}
    </div>
  );
}

function RankedListCard({ el }) {
  const isDark = el.style === "dark";
  const bg = isDark ? "#1e293b" : el.bgColor || "#ffffff";
  const fg = isDark ? "#ffffff" : el.textColor || "#1e293b";
  const items = el.items || [];
  const max = Math.max(...items.map((i) => i.value), 1);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: bg,
        borderRadius: 12,
        boxShadow: el.style === "flat" ? "none" : "0 2px 12px rgba(0,0,0,0.08)",
        padding: "12px 14px",
        display: "flex",
        flexDirection: "column",
        gap: 4,
        fontFamily: "Inter, sans-serif",
        overflow: "hidden",
      }}
    >
      {el.title && (
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: isDark ? "#94a3b8" : "#64748b",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            marginBottom: 4,
          }}
        >
          {el.title}
        </div>
      )}
      {items.map((item, i) => (
        <div key={i} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: 12,
              color: fg,
              fontWeight: 500,
            }}
          >
            <span>{item.label}</span>
            <span style={{ color: item.color, fontWeight: 700 }}>{item.value}%</span>
          </div>
          <div
            style={{
              height: 6,
              borderRadius: 3,
              background: isDark ? "#334155" : "#f1f5f9",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${(item.value / max) * 100}%`,
                background: item.color,
                borderRadius: 3,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function IconStatCard({ el }) {
  const IconComp = Icons[el.iconName] || Icons.Star;
  const isDark = el.style === "dark";
  const bg = isDark ? "#1e293b" : el.bgColor || "#f5f3ff";
  const fg = isDark ? "#ffffff" : el.textColor || "#1e293b";

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: bg,
        borderRadius: 12,
        boxShadow: el.style === "flat" ? "none" : "0 2px 12px rgba(0,0,0,0.08)",
        padding: 16,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        fontFamily: "Inter, sans-serif",
        textAlign: "center",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: 12,
          background: (el.accentColor || "#7c3aed") + "22",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <IconComp
          size={26}
          style={{ color: el.accentColor || "#7c3aed" }}
        />
      </div>
      <div
        style={{
          fontSize: Math.min(el.width * 0.14, 32),
          fontWeight: 800,
          color: fg,
        }}
      >
        {el.value}
      </div>
      <div
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: isDark ? "#94a3b8" : "#64748b",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
        }}
      >
        {el.label}
      </div>
    </div>
  );
}

function renderStatBlock(el) {
  switch (el.subtype) {
    case "kpi":
      return <KPICard el={el} />;
    case "comparison":
      return <ComparisonCard el={el} />;
    case "progressStat":
      return <ProgressStatCard el={el} />;
    case "rankedList":
      return <RankedListCard el={el} />;
    case "iconStat":
      return <IconStatCard el={el} />;
    default:
      return <KPICard el={el} />;
  }
}

const StatBlockElement = React.memo(function StatBlockElement({ el, zoom }) {
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
        {renderStatBlock(el)}
      </div>
    </div>
  );
}, (prev, next) => prev.el === next.el && prev.zoom === next.zoom);

export default StatBlockElement;
