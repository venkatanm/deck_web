/**
 * ThemeSettingsPanel - Edit global theme colors and fonts.
 * Mutations update the Zustand store; CSS variables propagate to the canvas.
 */

import { useState } from "react";
import { Lock } from "lucide-react";
import type { ThemeColorSlot } from "@deck-web/schema";
import { isSafeExportFont } from "@deck-web/schema";
import { usePresentationStore } from "../store/usePresentationStore";

const HEX_REGEX = /^#[0-9A-Fa-f]{6}$/;

const COLOR_SLOTS: { slot: ThemeColorSlot; label: string }[] = [
  { slot: "dk1", label: "Dark 1" },
  { slot: "lt1", label: "Light 1" },
  { slot: "dk2", label: "Dark 2" },
  { slot: "lt2", label: "Light 2" },
  { slot: "accent1", label: "Accent 1" },
  { slot: "accent2", label: "Accent 2" },
  { slot: "accent3", label: "Accent 3" },
  { slot: "accent4", label: "Accent 4" },
  { slot: "accent5", label: "Accent 5" },
  { slot: "accent6", label: "Accent 6" },
  { slot: "hlink", label: "Hyperlink" },
  { slot: "folHlink", label: "Followed Hyperlink" },
];

const panelStyle: React.CSSProperties = {
  width: 220,
  flexShrink: 0,
  padding: 20,
  background: "#f8fafc",
  borderLeft: "1px solid #e2e8f0",
  display: "flex",
  flexDirection: "column",
  gap: 20,
};

const sectionStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 8,
};

const labelStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  color: "#475569",
};

const colorRowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
};

const colorInputStyle: React.CSSProperties = {
  width: 32,
  height: 24,
  padding: 0,
  border: "1px solid rgba(255,255,255,0.2)",
  borderRadius: 4,
  cursor: "pointer",
  background: "transparent",
};

const hexInputStyle: React.CSSProperties = {
  flex: 1,
  padding: "4px 8px",
  fontSize: 11,
  fontWeight: "monospace",
  background: "rgba(255,255,255,0.1)",
  color: "#eee",
  border: "1px solid rgba(255,255,255,0.2)",
  borderRadius: 4,
};

const fontInputStyle: React.CSSProperties = {
  width: "100%",
  padding: "6px 8px",
  fontSize: 12,
  background: "rgba(255,255,255,0.1)",
  color: "#eee",
  border: "1px solid rgba(255,255,255,0.2)",
  borderRadius: 4,
};

export function ThemeSettingsPanel() {
  const theme = usePresentationStore((s) => s.presentation.theme);
  const isThemeLocked = usePresentationStore((s) => s.presentation.isThemeLocked ?? false);
  const updateThemeColor = usePresentationStore((s) => s.updateThemeColor);
  const updateThemeFont = usePresentationStore((s) => s.updateThemeFont);
  const toggleThemeLock = usePresentationStore((s) => s.toggleThemeLock);
  const [editingHex, setEditingHex] = useState<{ slot: ThemeColorSlot; value: string } | null>(null);

  const commitHex = (slot: ThemeColorSlot, value: string) => {
    const hex = value.startsWith("#") ? value : `#${value}`;
    if (HEX_REGEX.test(hex)) updateThemeColor(slot, hex);
    setEditingHex(null);
  };

  return (
    <aside style={panelStyle}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={labelStyle}>Theme Settings</div>
        <button
          type="button"
          onClick={toggleThemeLock}
          title={isThemeLocked ? "Unlock theme" : "Lock theme"}
          style={{
            padding: 6,
            background: isThemeLocked ? "#dbeafe" : "#fff",
            border: "1px solid #e2e8f0",
            borderRadius: 6,
            cursor: "pointer",
            color: isThemeLocked ? "#3b82f6" : "#64748b",
          }}
        >
          <Lock size={14} strokeWidth={2} />
        </button>
      </div>

      <div style={sectionStyle}>
        <div style={labelStyle}>Colors</div>
        {COLOR_SLOTS.map(({ slot, label }) => (
          <div key={slot} style={colorRowStyle}>
            <input
              type="color"
              value={theme.colorScheme[slot]}
              onChange={(e) => !isThemeLocked && updateThemeColor(slot, e.target.value)}
              disabled={isThemeLocked}
              style={colorInputStyle}
              title={label}
            />
            <input
              type="text"
              value={editingHex?.slot === slot ? editingHex.value : theme.colorScheme[slot]}
              onChange={(e) => {
                const v = e.target.value;
                if (/^#?[0-9A-Fa-f]{0,6}$/.test(v)) setEditingHex({ slot, value: v });
              }}
              onFocus={() => setEditingHex({ slot, value: theme.colorScheme[slot] })}
              onBlur={() => commitHex(slot, editingHex?.slot === slot ? editingHex.value : theme.colorScheme[slot])}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  (e.target as HTMLInputElement).blur();
                }
              }}
              style={hexInputStyle}
              placeholder="#000000"
              maxLength={7}
            />
            <span style={{ fontSize: 11, color: "#64748b", minWidth: 60 }}>{label}</span>
          </div>
        ))}
      </div>

      <div style={sectionStyle}>
        <div style={labelStyle}>Fonts</div>
        {(!isSafeExportFont(theme.fontScheme.headFont) ||
          !isSafeExportFont(theme.fontScheme.bodyFont)) && (
          <div
            style={{
              padding: 8,
              fontSize: 11,
              background: "rgba(245, 158, 11, 0.2)",
              border: "1px solid rgba(245, 158, 11, 0.5)",
              borderRadius: 4,
              color: "#fbbf24",
            }}
          >
            Non-standard font. Export will use Calibri for compatibility. Use
            Arial, Calibri, Georgia, Times New Roman, or Verdana for embedded
            export.
          </div>
        )}
        <div>
          <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4, fontWeight: 500 }}>Heading</div>
          <input
            type="text"
            value={theme.fontScheme.headFont}
            onChange={(e) => !isThemeLocked && updateThemeFont("headFont", e.target.value)}
            style={fontInputStyle}
            placeholder="Calibri Light"
            disabled={isThemeLocked}
          />
        </div>
        <div>
          <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4, fontWeight: 500 }}>Body</div>
          <input
            type="text"
            value={theme.fontScheme.bodyFont}
            onChange={(e) => !isThemeLocked && updateThemeFont("bodyFont", e.target.value)}
            style={fontInputStyle}
            placeholder="Calibri"
            disabled={isThemeLocked}
          />
        </div>
      </div>
    </aside>
  );
}
