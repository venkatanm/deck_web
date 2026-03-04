/**
 * IconPickerModal - Search and pick Lucide icons to add to the canvas.
 * On click, creates an IconElement with colorized SVG and adds it via addElement.
 * Rendered via portal to avoid parent overflow/stacking-context issues.
 */

import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { icons } from "lucide-react";
import type { IconElement } from "@deck-web/schema";
import { resolveColorRef } from "@deck-web/schema";
import { iconToSvgString } from "../utils/iconUtils";
import { usePresentationStore } from "../store/usePresentationStore";

/** Curated list of icon names for the picker (PascalCase) - must match lucide-react exports */
const ICON_NAMES = [
  "Camera", "Heart", "Star", "Home", "User", "Settings", "Search", "Mail",
  "Phone", "Calendar", "Clock", "MapPin", "Link", "Image", "File", "Folder",
  "Download", "Upload", "Share2", "Pencil", "Trash2", "Plus", "Minus", "Check",
  "X", "CircleAlert", "Info", "HelpCircle", "Zap", "Sun", "Moon", "Cloud",
  "Wifi", "Battery", "Volume2", "Play", "Pause", "Music", "Video", "Book",
  "Bookmark", "Tag", "Gift", "ShoppingCart", "CreditCard", "DollarSign",
  "TrendingUp", "BarChart3", "ChartPie", "Target", "Award", "Rocket",
  "Lightbulb", "Code", "Terminal", "Database", "Server", "Cpu", "HardDrive",
  "Monitor", "Smartphone", "Tablet", "Headphones", "Mic",
  "Send", "MessageCircle", "AtSign", "Hash", "Asterisk", "Percent",
  "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "ChevronUp",
  "ChevronDown", "ChevronLeft", "ChevronRight", "ExternalLink", "Copy",
  "RefreshCw", "RotateCw", "ZoomIn", "ZoomOut", "Maximize2", "Minimize2",
  "Lock", "Unlock", "Eye", "EyeOff", "Shield", "Key", "LogIn", "LogOut",
] as const;

type IconName = (typeof ICON_NAMES)[number];

function toKebab(name: string): string {
  return name
    .replace(/([a-z])([A-Z])/g, "$1-$2")
    .replace(/([A-Z])([A-Z][a-z])/g, "$1-$2")
    .toLowerCase();
}

interface IconPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  slideId: string | null;
}

export function IconPickerModal({
  isOpen,
  onClose,
  slideId,
}: IconPickerModalProps) {
  const [search, setSearch] = useState("");
  const addElement = usePresentationStore((s) => s.addElement);
  const presentation = usePresentationStore((s) => s.presentation);

  const filteredIcons = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return [...ICON_NAMES];
    return ICON_NAMES.filter((name) =>
      toKebab(name).includes(q) || name.toLowerCase().includes(q)
    );
  }, [search]);

  const handleSelect = (iconName: IconName) => {
    if (!slideId) return;
    try {
      const IconComponent = (icons as Record<string, React.ComponentType<{ color?: string; size?: number }>>)[iconName];
      if (!IconComponent || typeof IconComponent !== "function") {
        console.warn("[IconPicker] Icon not found:", iconName);
        return;
      }

      const colorRef = "accent1" as const;
      const hex = resolveColorRef(
        colorRef,
        presentation.theme.colorScheme
      );
      const svgData = iconToSvgString(IconComponent as Parameters<typeof iconToSvgString>[0], hex, 24);
      if (!svgData || !svgData.trim().startsWith("<svg")) {
        console.error("[IconPicker] Invalid SVG from icon:", iconName);
        return;
      }

      const el: IconElement = {
        id: "",
        type: "icon",
        svgData,
        color: colorRef,
        transform: { x: 0.15, y: 0.15, w: 0.12, h: 0.12, z: 0 },
      };
      addElement(slideId, el);
      onClose();
    } catch (err) {
      console.error("[IconPicker] Failed to add icon:", err);
    }
  };

  if (!isOpen) return null;

  const modalContent = (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="icon-picker-title"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15,23,42,0.4)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10000,
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          width: "min(480px, 90vw)",
          maxHeight: "80vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ padding: 16, borderBottom: "1px solid #e2e8f0" }}>
          <h3 id="icon-picker-title" style={{ margin: "0 0 12px 0", color: "#334155", fontSize: 18, fontWeight: 600 }}>
            Add Icon
          </h3>
          <input
            type="text"
            placeholder="Search icons..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
            style={{
              width: "100%",
              padding: "10px 14px",
              fontSize: 14,
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: 8,
              color: "#334155",
              outline: "none",
            }}
          />
        </div>
        <div
          style={{
            padding: 12,
            overflowY: "auto",
            display: "grid",
            gridTemplateColumns: "repeat(6, 1fr)",
            gap: 8,
          }}
        >
          {filteredIcons.map((name) => {
            const IconComponent = (icons as Record<string, React.ComponentType<{ size?: number }>>)[name];
            if (!IconComponent) return null;
            return (
              <button
                key={name}
                type="button"
                onClick={() => handleSelect(name)}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 12,
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  borderRadius: 8,
                  cursor: "pointer",
                  color: "#475569",
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#f1f5f9";
                  e.currentTarget.style.color = "#334155";
                  e.currentTarget.style.borderColor = "#cbd5e1";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#f8fafc";
                  e.currentTarget.style.color = "#475569";
                  e.currentTarget.style.borderColor = "#e2e8f0";
                }}
                title={toKebab(name)}
              >
                <IconComponent size={24} />
                <span style={{ fontSize: 10, overflow: "hidden", textOverflow: "ellipsis", maxWidth: "100%" }}>
                  {toKebab(name)}
                </span>
              </button>
            );
          })}
        </div>
        {filteredIcons.length === 0 && (
          <div style={{ padding: 24, color: "#64748b", textAlign: "center" }}>
            No icons match &quot;{search}&quot;
          </div>
        )}
      </div>
    </div>
  );

  return typeof document !== "undefined"
    ? createPortal(modalContent, document.body)
    : null;
}
