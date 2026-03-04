import { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import useEditorStore from "../store/useEditorStore";
import { LAYOUT_DEFINITIONS } from "../data/layoutDefinitions";
import { useToast } from "./Toast";

export default function LayoutsPanel() {
  const elements = useEditorStore((s) => s.getCurrentElements?.() ?? []);
  const canvasSize = useEditorStore((s) => s.canvasSize);
  const currentPageId = useEditorStore((s) => s.currentPageId);
  const updatePage = useEditorStore((s) => s.updatePage);
  const _snapshot = useEditorStore((s) => s._snapshot);
  const toast = useToast();

  const [hoveredId, setHoveredId] = useState(null);

  const applyLayout = (layout) => {
    _snapshot?.(true);
    const newElements = layout.apply(
      elements.map((e) => ({ ...e })),
      canvasSize
    );
    updatePage(currentPageId, {
      elements: newElements.map((e) => ({ ...e, id: e.id || uuidv4() })),
    });
    toast(`Layout "${layout.name}" applied!`, "success");
  };

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-gray-500">
        Layouts rearrange your current slide content into a new structure. Your
        text and shapes stay the same — only positions change.
      </p>

      <div className="flex flex-col gap-2">
        {LAYOUT_DEFINITIONS.map((layout) => (
          <button
            key={layout.id}
            type="button"
            onMouseEnter={() => setHoveredId(layout.id)}
            onMouseLeave={() => setHoveredId(null)}
            onClick={() => applyLayout(layout)}
            className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
              hoveredId === layout.id
                ? "border-purple-500 bg-purple-50"
                : "border-gray-200 hover:border-gray-300 bg-white"
            }`}
          >
            <LayoutStructureIcon structure={layout.preview.structure} />
            <div>
              <p className="text-xs font-semibold text-gray-800">{layout.name}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function LayoutStructureIcon({ structure }) {
  const icons = {
    center: (
      <>
        <rect x="8" y="14" width="48" height="6" rx="2" fill="#7c3aed" />
        <rect x="16" y="24" width="32" height="4" rx="2" fill="#c4b5fd" />
      </>
    ),
    "split-lr": (
      <>
        <rect x="2" y="8" width="26" height="48" rx="2" fill="#7c3aed" opacity="0.3" />
        <rect x="36" y="8" width="26" height="10" rx="2" fill="#7c3aed" />
        <rect x="36" y="22" width="26" height="8" rx="2" fill="#c4b5fd" />
        <rect x="36" y="34" width="26" height="8" rx="2" fill="#c4b5fd" opacity="0.5" />
      </>
    ),
    stat: (
      <>
        <rect x="10" y="16" width="44" height="18" rx="2" fill="#7c3aed" />
        <rect x="20" y="38" width="24" height="6" rx="2" fill="#c4b5fd" />
      </>
    ),
    "cols-3": (
      <>
        <rect x="2" y="8" width="18" height="48" rx="2" fill="#7c3aed" opacity="0.6" />
        <rect x="23" y="8" width="18" height="48" rx="2" fill="#7c3aed" opacity="0.4" />
        <rect x="44" y="8" width="18" height="48" rx="2" fill="#7c3aed" opacity="0.2" />
      </>
    ),
    "bleed-l": (
      <>
        <rect x="2" y="2" width="30" height="60" rx="2" fill="#7c3aed" opacity="0.4" />
        <rect x="36" y="12" width="26" height="10" rx="2" fill="#7c3aed" />
        <rect x="36" y="26" width="26" height="8" rx="2" fill="#c4b5fd" />
      </>
    ),
    quote: (
      <>
        <rect x="10" y="20" width="8" height="12" rx="1" fill="#7c3aed" opacity="0.5" />
        <rect x="10" y="38" width="44" height="6" rx="2" fill="#c4b5fd" />
        <rect x="20" y="48" width="24" height="4" rx="2" fill="#e9d5ff" />
      </>
    ),
    grid: (
      <>
        <rect x="2" y="4" width="60" height="8" rx="2" fill="#7c3aed" />
        <rect x="2" y="16" width="28" height="22" rx="2" fill="#c4b5fd" opacity="0.7" />
        <rect x="34" y="16" width="28" height="22" rx="2" fill="#c4b5fd" opacity="0.7" />
        <rect x="2" y="42" width="28" height="18" rx="2" fill="#e9d5ff" />
        <rect x="34" y="42" width="28" height="18" rx="2" fill="#e9d5ff" />
      </>
    ),
    timeline: (
      <>
        <rect x="2" y="30" width="60" height="3" rx="1" fill="#7c3aed" opacity="0.3" />
        <rect x="8" y="14" width="12" height="14" rx="2" fill="#7c3aed" />
        <rect x="26" y="34" width="12" height="14" rx="2" fill="#c4b5fd" />
        <rect x="44" y="14" width="12" height="14" rx="2" fill="#7c3aed" opacity="0.6" />
      </>
    ),
  };

  return (
    <svg
      width="64"
      height="64"
      viewBox="0 0 64 64"
      className="flex-shrink-0 bg-gray-50 rounded-lg"
    >
      {icons[structure] || null}
    </svg>
  );
}
