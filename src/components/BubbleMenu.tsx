/**
 * BubbleMenu - Contextual floating menu positioned at cursor.
 * Used for chart segment actions (e.g. change series color).
 */

import type { ThemeColorSlot } from "@deck-web/schema";

const ACCENT_SLOTS: ThemeColorSlot[] = [
  "accent1",
  "accent2",
  "accent3",
  "accent4",
  "accent5",
  "accent6",
];

interface BubbleMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  onColorSelect: (colorToken: ThemeColorSlot) => void;
}

export function BubbleMenu({ x, y, onClose, onColorSelect }: BubbleMenuProps) {
  return (
    <>
      <div
        role="presentation"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9998,
        }}
        onClick={onClose}
        onContextMenu={(e) => e.preventDefault()}
      />
      <div
        role="menu"
        style={{
          position: "fixed",
          left: x + 8,
          top: y + 8,
          zIndex: 9999,
          display: "flex",
          gap: 6,
          padding: 8,
          background: "#fff",
          border: "1px solid #e2e8f0",
          borderRadius: 8,
          boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
        }}
      >
        {ACCENT_SLOTS.map((slot) => (
          <button
            key={slot}
            type="button"
            role="menuitem"
            onClick={(e) => {
              e.stopPropagation();
              onColorSelect(slot);
              onClose();
            }}
            style={{
              width: 24,
              height: 24,
              padding: 0,
              border: "2px solid #e2e8f0",
              borderRadius: 6,
              background: `var(--theme-${slot})`,
              cursor: "pointer",
            }}
            title={slot}
          />
        ))}
      </div>
    </>
  );
}
