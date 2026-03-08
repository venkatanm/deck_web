import { useMemo, useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { RefreshCw, Shuffle, Sparkles, Undo2 } from "lucide-react";
import useEditorStore from "../store/useEditorStore";
import { LAYOUT_DEFINITIONS, suggestLayouts } from "../data/layoutDefinitions";
import { useToast } from "./Toast";
import { track } from "../api/analytics";

// Group layouts by the category field on each layout definition
const LAYOUT_CATEGORIES = [
  { id: 'intro',    label: 'Intro & Framing' },
  { id: 'text',     label: 'Text & Concepts' },
  { id: 'data',     label: 'Data & Financials' },
  { id: 'visual',   label: 'Visuals & Media' },
  { id: 'process',  label: 'Process & Timelines' },
  { id: 'strategy', label: 'Strategy & Frameworks' },
  { id: 'closing',  label: 'Closing & Next Steps' },
];

function categorizePanelLayouts(layouts) {
  return LAYOUT_CATEGORIES
    .map((cat) => ({ ...cat, layouts: layouts.filter((l) => l.category === cat.id) }))
    .filter((cat) => cat.layouts.length > 0);
}

export default function LayoutsPanel() {
  const elements = useEditorStore((s) => {
    const page = (s.pages || []).find((p) => p.id === s.currentPageId);
    return page?.elements || [];
  });
  const canvasSize = useEditorStore((s) => s.canvasSize);
  const currentPageId = useEditorStore((s) => s.currentPageId);
  const pages = useEditorStore((s) => s.pages);
  const updatePage = useEditorStore((s) => s.updatePage);
  const _snapshot = useEditorStore((s) => s._snapshot);
  const toast = useToast();

  const [hoveredId, setHoveredId] = useState(null);
  const [rearrangeMode, setRearrangeMode] = useState(false);
  const [lastRearranged, setLastRearranged] = useState(null); // { name } after rearrange apply

  // Clear undo banner when user navigates to a different slide
  useEffect(() => { setLastRearranged(null); }, [currentPageId]);

  // Current page's applied layout
  const currentPage = pages?.find((p) => p.id === currentPageId);
  const appliedLayoutId = currentPage?.appliedLayoutId ?? null;

  // In rearrange mode all layouts are available; in fresh mode lock once one is applied
  const isLayoutLocked = (layout) =>
    !rearrangeMode && appliedLayoutId !== null && layout.id !== appliedLayoutId;

  // Smart suggestions based on current slide content
  const suggestedIds = useMemo(() => suggestLayouts(elements), [elements]);
  const hasSuggestions = suggestedIds.length > 0;

  // All layouts except those in suggested
  const remainingLayouts = LAYOUT_DEFINITIONS.filter((l) => !suggestedIds.includes(l.id));
  const suggestedLayouts = LAYOUT_DEFINITIONS.filter((l) => suggestedIds.includes(l.id));
  const panelCategories = useMemo(() => categorizePanelLayouts(remainingLayouts), [remainingLayouts]);

  const applyLayout = (layout) => {
    _snapshot?.(true);
    let newElements;

    if (rearrangeMode && elements.length > 0) {
      newElements = layout.apply(elements.map((e) => ({ ...e })), canvasSize);
      setLastRearranged({ name: layout.name });
    } else {
      newElements = layout.generate
        ? layout.generate(canvasSize)
        : layout.apply(elements.map((e) => ({ ...e })), canvasSize);
      setLastRearranged(null);
      toast(`"${layout.name}" applied! Press Ctrl+Z to undo.`, "success");
    }

    updatePage(currentPageId, {
      elements: newElements.map((e) => ({ ...e, id: e.id || uuidv4() })),
      appliedLayoutId: layout.id,
    });
    track('layout.applied', { layout_id: layout.id, layout_name: layout.name, mode: rearrangeMode ? 'rearrange' : 'fresh' });
  };

  const undo = useEditorStore((s) => s.undo);

  const handleRearrangeUndo = () => {
    undo?.();
    setLastRearranged(null);
  };

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-gray-500 leading-relaxed">
        Click a layout to apply it. <strong>Ctrl+Z</strong> to undo.
      </p>

      {/* Mode toggle */}
      <div className="flex items-center gap-2 bg-gray-50 rounded-xl p-2">
        <button
          type="button"
          onClick={() => { setRearrangeMode(false); setLastRearranged(null); }}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-lg transition-colors ${
            !rearrangeMode ? "bg-white text-purple-700 shadow-sm" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <RefreshCw size={12} />
          Fresh layout
        </button>
        <button
          type="button"
          onClick={() => { setRearrangeMode(true); setLastRearranged(null); }}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-lg transition-colors ${
            rearrangeMode ? "bg-white text-purple-700 shadow-sm" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <Shuffle size={12} />
          Rearrange mine
        </button>
      </div>

      <p className="text-[11px] text-gray-400 leading-relaxed -mt-1">
        {rearrangeMode
          ? "Your existing content will be repositioned into the selected layout structure."
          : "Placeholder content is created — then edit the text and images to your liking."}
      </p>

      {/* Rearrange undo banner */}
      {lastRearranged && (
        <div className="flex items-center justify-between gap-2 bg-blue-50 border border-blue-200 rounded-xl px-3 py-2">
          <span className="text-[11px] text-blue-700 leading-snug">
            <strong>"{lastRearranged.name}"</strong> applied to your slide.
          </span>
          <button
            type="button"
            onClick={handleRearrangeUndo}
            className="flex items-center gap-1 text-[11px] font-semibold text-blue-700 hover:text-blue-900 whitespace-nowrap"
          >
            <Undo2 size={12} />
            Undo
          </button>
        </div>
      )}

      {/* Layout lock notice */}
      {appliedLayoutId && (
        <div className="flex gap-2 bg-amber-50 border border-amber-200 rounded-xl p-2.5 text-[11px] text-amber-800 leading-relaxed">
          <span className="flex-shrink-0 mt-0.5">🔒</span>
          <span>
            A layout has been applied to this slide and cannot be changed.
            To use a different layout, <strong>add a new page</strong> or <strong>delete this page</strong> and start fresh.
          </span>
        </div>
      )}

      {/* Smart suggestions */}
      {hasSuggestions && (
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <Sparkles size={12} className="text-amber-500" />
            <span className="text-[11px] font-semibold text-amber-600 uppercase tracking-wider">Suggested for this slide</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {suggestedLayouts.map((layout) => (
              <LayoutButton
                key={layout.id}
                layout={layout}
                isActive={appliedLayoutId === layout.id}
                isHovered={hoveredId === layout.id}
                onHover={setHoveredId}
                onApply={applyLayout}
                locked={isLayoutLocked(layout)}
                highlight
              />
            ))}
          </div>
          <div className="my-3 border-t border-gray-100" />
        </div>
      )}

      {/* Categorized layout list */}
      {panelCategories.map((cat) => (
        <div key={cat.id}>
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">{cat.label}</p>
          <div className="grid grid-cols-2 gap-2">
            {cat.layouts.map((layout) => (
              <LayoutButton
                key={layout.id}
                layout={layout}
                isActive={appliedLayoutId === layout.id}
                isHovered={hoveredId === layout.id}
                onHover={setHoveredId}
                onApply={applyLayout}
                locked={isLayoutLocked(layout)}
              />
            ))}
          </div>
          <div className="mt-3" />
        </div>
      ))}
    </div>
  );
}

function LayoutButton({ layout, isActive, isHovered, onHover, onApply, locked, highlight }) {
  const lockTitle = locked
    ? "Not compatible with this slide's layout category. Add a new page or delete this page to use it."
    : (layout.description || layout.name);

  return (
    <button
      type="button"
      onMouseEnter={() => !locked && onHover(layout.id)}
      onMouseLeave={() => !locked && onHover(null)}
      onClick={() => !locked && onApply(layout)}
      title={lockTitle}
      disabled={locked}
      className={`flex flex-col items-center gap-1.5 p-2 rounded-xl border transition-all text-left relative ${
        locked
          ? "border-gray-100 bg-gray-50 opacity-35 cursor-not-allowed"
          : isActive
          ? "border-purple-500 bg-purple-50 shadow-sm ring-1 ring-purple-300 cursor-pointer"
          : isHovered
          ? "border-purple-400 bg-purple-50 shadow-sm cursor-pointer"
          : highlight
          ? "border-amber-200 bg-amber-50 hover:border-amber-400 cursor-pointer"
          : "border-gray-200 hover:border-gray-300 bg-white cursor-pointer"
      }`}
    >
      {isActive && !locked && (
        <div className="absolute top-1.5 right-1.5 w-2 h-2 bg-purple-500 rounded-full" />
      )}
      {locked && (
        <div className="absolute top-1.5 right-1.5 text-gray-400" style={{ fontSize: 10 }}>🔒</div>
      )}
      <LayoutPreviewIcon layout={layout} />
      <p className="text-xs font-medium text-gray-600 text-center leading-tight">{layout.name}</p>
    </button>
  );
}

// Legacy hand-coded previews — kept for reference but no longer used
const LAYOUT_PREVIEWS = {
  /* ── INTRO & FRAMING ─────────────────────── */
  'title-center': (
    <>
      {/* Big title bar, subtitle bar */}
      <rect x="10" y="32" width="107" height="9" rx="1.5" fill="#111111" />
      <rect x="10" y="56" width="89" height="3" rx="1" fill="#111111" />
    </>
  ),
  'title-center-centered': (
    <>
      {/* Pill border, big title, body */}
      <rect x="28" y="14" width="72" height="9" rx="5" fill="none" stroke="#111111" strokeWidth="1" />
      <rect x="13" y="33" width="102" height="10" rx="1.5" fill="#111111" />
      <rect x="15" y="58" width="97" height="3" rx="1" fill="#111111" />
    </>
  ),
  'title-subtitle-below': (
    <>
      <rect x="13" y="27" width="102" height="10" rx="1.5" fill="#111111" />
      <rect x="19" y="56" width="89" height="3" rx="1" fill="#111111" />
    </>
  ),
  'section-divider': (
    <>
      <rect x="8" y="16" width="70" height="9" rx="1.5" fill="#111111" />
      <rect x="8" y="51" width="64" height="3" rx="1" fill="#111111" />
    </>
  ),
  'dark-title': (
    <>
      {/* Full black bg */}
      <rect x="0" y="0" width="160" height="90" fill="#111111" />
      <rect x="10" y="22" width="89" height="9" rx="1.5" fill="#ffffff" />
      <rect x="13" y="36" width="64" height="3" rx="1" fill="#888888" />
    </>
  ),
  'thank-you': (
    <>
      <rect x="10" y="29" width="102" height="10" rx="1.5" fill="#111111" />
      <rect x="13" y="48" width="64" height="3" rx="1" fill="#888888" />
    </>
  ),
  cta: (
    <>
      {/* Full black bg */}
      <rect x="0" y="0" width="160" height="90" fill="#111111" />
      <rect x="10" y="16" width="102" height="8" rx="1.5" fill="#ffffff" />
      <rect x="10" y="30" width="89" height="3" rx="1" fill="#888888" />
      {/* Pill button */}
      <rect x="38" y="52" width="51" height="11" rx="5" fill="#111111" stroke="#ffffff" strokeWidth="1.5" />
      <rect x="44" y="55" width="39" height="3" rx="1" fill="#ffffff" />
    </>
  ),
  'agenda-list': (
    <>
      {/* Title */}
      <rect x="5" y="5" width="45" height="7" rx="1.5" fill="#111111" />
      {/* 5 rows: circle + label bar */}
      {[18, 27, 36, 45, 54].map((y, i) => (
        <g key={i}>
          <circle cx="61" cy={y + 4} r="4" fill="#111111" />
          <rect x="57" y={y + 1} width="4" height="4" rx="0.5" fill="#ffffff" />
          <rect x="64" y={y} width="59" height="6" rx="1" fill="#111111" />
          <rect x="67" y={y + 1.5} width="40" height="3" rx="0.5" fill="#ffffff" />
        </g>
      ))}
    </>
  ),
  'agenda-grid': (
    <>
      {/* Title */}
      <rect x="5" y="4" width="57" height="6" rx="1.5" fill="#111111" />
      {/* 6 cards 3×2 */}
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const col = i % 3; const row = Math.floor(i / 3);
        return (
          <g key={i}>
            <rect x={col * 52 + 4} y={row * 34 + 18} width="47" height="30" rx="4" fill="#111111" />
            <circle cx={col * 52 + 12} cy={row * 34 + 26} r="4" fill="#ffffff" opacity="0.8" />
            <rect x={col * 52 + 8} y={row * 34 + 38} width="35" height="4" rx="1" fill="#ffffff" opacity="0.7" />
          </g>
        );
      })}
    </>
  ),
  'agenda-3col': (
    <>
      {/* Centered title */}
      <rect x="13" y="5" width="77" height="7" rx="1.5" fill="#111111" />
      {/* 3 columns */}
      {[0, 1, 2].map((i) => (
        <g key={i}>
          <circle cx={22 + i * 51} cy="32" r="5" fill="#111111" />
          <rect cx={22 + i * 51} cy="32" width="6" height="6" fill="#ffffff" opacity="0.8" />
          <rect x={22 + i * 51 - 18} y="48" width="36" height="3" rx="1" fill="#111111" />
        </g>
      ))}
    </>
  ),

  /* ── TEXT & CONCEPTS ─────────────────────── */
  'title-bullets': (
    <>
      <rect x="6" y="5" width="115" height="7" rx="1.5" fill="#111111" />
      {[27, 36, 45, 54, 63].map((y, i) => (
        <g key={i}>
          <circle cx="9" cy={y + 1.5} r="1.5" fill="#111111" />
          <rect x="13" y={y} width="115" height="3" rx="1" fill="#111111" />
        </g>
      ))}
    </>
  ),
  'two-column': (
    <>
      <rect x="13" y="5" width="115" height="7" rx="1.5" fill="#111111" />
      {[0, 1, 2].map((i) => (
        <g key={i}>
          <rect x="5" y={29 + i * 9} width="69" height="3" rx="1" fill="#111111" />
          <rect x="83" y={29 + i * 9} width="69" height="3" rx="1" fill="#111111" />
        </g>
      ))}
    </>
  ),
  'title-two-col-body': (
    <>
      <rect x="6" y="7" width="115" height="7" rx="1.5" fill="#111111" />
      {[0, 1, 2].map((i) => (
        <g key={i}>
          <rect x="6" y={29 + i * 9} width="55" height="3" rx="1" fill="#111111" />
          <rect x="67" y={29 + i * 9} width="55" height="3" rx="1" fill="#111111" />
        </g>
      ))}
    </>
  ),
  blockquote: (
    <>
      {/* Large quote mark block */}
      <rect x="6" y="2" width="10" height="14" rx="1" fill="#111111" />
      <rect x="10" y="20" width="120" height="8" rx="1.5" fill="#111111" />
      <rect x="10" y="32" width="100" height="8" rx="1.5" fill="#111111" />
      <rect x="10" y="48" width="40" height="3" rx="1" fill="#111111" />
    </>
  ),
  'dark-quote': (
    <>
      <rect x="0" y="0" width="160" height="90" fill="#111111" />
      <rect x="6" y="2" width="10" height="14" rx="1" fill="#444444" />
      <rect x="10" y="20" width="120" height="8" rx="1.5" fill="#ffffff" />
      <rect x="10" y="32" width="100" height="8" rx="1.5" fill="#ffffff" />
      <rect x="10" y="48" width="40" height="3" rx="1" fill="#888888" />
    </>
  ),
  'big-number': (
    <>
      {/* Very large stat bar */}
      <rect x="6" y="13" width="115" height="25" rx="2" fill="#111111" />
      <rect x="19" y="53" width="89" height="4" rx="1" fill="#111111" />
    </>
  ),
  'two-cards': (
    <>
      {/* Left dark card */}
      <rect x="5" y="9" width="56" height="72" rx="4" fill="#111111" />
      <circle cx="19" cy="19" r="4" fill="#ffffff" opacity="0.8" />
      <rect x="10" y="43" width="43" height="5" rx="1" fill="#ffffff" />
      {/* Right dark card */}
      <rect x="66" y="9" width="56" height="72" rx="4" fill="#111111" />
      <circle cx="81" cy="19" r="4" fill="#ffffff" opacity="0.8" />
      <rect x="71" y="43" width="43" height="5" rx="1" fill="#ffffff" />
    </>
  ),
  'four-cards': (
    <>
      {[0, 1, 2, 3].map((i) => {
        const col = i % 2; const row = Math.floor(i / 2);
        return (
          <g key={i}>
            <rect x={col * 79 + 5} y={row * 43 + 5} width="57" height="40" rx="3" fill="#111111" />
            <rect x={col * 79 + 9} y={row * 43 + 25} width="40" height="4" rx="1" fill="#ffffff" opacity="0.8" />
          </g>
        );
      })}
    </>
  ),
  'highlight-box': (
    <>
      <rect x="6" y="4" width="64" height="6" rx="1.5" fill="#111111" />
      <rect x="8" y="18" width="115" height="53" rx="5" fill="#111111" />
      <rect x="13" y="27" width="80" height="7" rx="1.5" fill="#ffffff" />
      <rect x="13" y="38" width="64" height="3" rx="1" fill="#ffffff" />
    </>
  ),

  /* ── VISUALS & MEDIA ─────────────────────── */
  'image-right': (
    <>
      {/* Left image area */}
      <rect x="0" y="0" width="80" height="90" fill="#d0e8f0" />
      {/* Right text */}
      <rect x="68" y="18" width="53" height="7" rx="1.5" fill="#111111" />
      <rect x="68" y="30" width="50" height="3" rx="1" fill="#111111" />
      <rect x="68" y="38" width="50" height="3" rx="1" fill="#111111" />
      <rect x="68" y="46" width="50" height="3" rx="1" fill="#111111" />
    </>
  ),
  'image-left': (
    <>
      {/* Right image area */}
      <rect x="80" y="0" width="80" height="90" fill="#d0e8f0" />
      {/* Left text */}
      <rect x="5" y="18" width="53" height="7" rx="1.5" fill="#111111" />
      <rect x="5" y="30" width="50" height="3" rx="1" fill="#111111" />
      <rect x="5" y="38" width="50" height="3" rx="1" fill="#111111" />
      <rect x="5" y="46" width="50" height="3" rx="1" fill="#111111" />
    </>
  ),
  'image-left-bullets': (
    <>
      {/* Left image */}
      <rect x="0" y="0" width="55" height="90" fill="#d0e8f0" />
      {/* Right: title + bullets */}
      <rect x="59" y="9" width="62" height="6" rx="1.5" fill="#111111" />
      {[0, 1, 2].map((i) => (
        <g key={i}>
          <circle cx="62" cy={26 + i * 12 + 1.5} r="1.5" fill="#111111" />
          <rect x="66" y={26 + i * 12} width="51" height="3" rx="1" fill="#111111" />
        </g>
      ))}
    </>
  ),
  'heading-three-images': (
    <>
      {/* Centered title + subtitle */}
      <rect x="13" y="3" width="102" height="7" rx="1.5" fill="#111111" />
      <rect x="25" y="13" width="77" height="3" rx="1" fill="#111111" />
      {/* 3 image rects */}
      {[0, 1, 2].map((i) => (
        <rect key={i} x={4 + i * 50} y="27" width="47" height="56" rx="3" fill="#d0e8f0" />
      ))}
    </>
  ),
  'full-bleed-text': (
    <>
      {/* Dark background */}
      <rect x="0" y="0" width="160" height="90" fill="#333333" />
      {/* Dark overlay bottom */}
      <rect x="0" y="45" width="160" height="45" fill="#111111" opacity="0.8" />
      <rect x="8" y="52" width="89" height="8" rx="1.5" fill="#ffffff" />
      <rect x="8" y="64" width="56" height="3" rx="1" fill="#aaaaaa" />
    </>
  ),
  'photo-grid-4': (
    <>
      <rect x="1" y="1" width="78" height="43" rx="2" fill="#d0e8f0" />
      <rect x="81" y="1" width="78" height="43" rx="2" fill="#b8d4e8" />
      <rect x="1" y="46" width="78" height="43" rx="2" fill="#b8d4e8" />
      <rect x="81" y="46" width="78" height="43" rx="2" fill="#d0e8f0" />
    </>
  ),
  'photo-grid-3': (
    <>
      <rect x="1" y="1" width="78" height="88" rx="2" fill="#d0e8f0" />
      <rect x="81" y="1" width="78" height="42" rx="2" fill="#b8d4e8" />
      <rect x="81" y="46" width="78" height="43" rx="2" fill="#b8d4e8" />
    </>
  ),
  venn: (
    <>
      <circle cx="40" cy="48" r="30" fill="#888888" opacity="0.7" />
      <circle cx="80" cy="48" r="30" fill="#333333" opacity="0.8" />
      {/* White text bars in each zone */}
      <rect x="12" y="44" width="30" height="4" rx="1" fill="#ffffff" opacity="0.8" />
      <rect x="90" y="44" width="30" height="4" rx="1" fill="#ffffff" opacity="0.8" />
      <rect x="48" y="44" width="20" height="4" rx="1" fill="#ffffff" opacity="0.9" />
    </>
  ),
  'team-grid': (
    <>
      <rect x="13" y="4" width="102" height="6" rx="1.5" fill="#111111" />
      {[0, 1, 2, 3].map((i) => {
        const col = i % 2; const row = Math.floor(i / 2);
        const cx = 19 + col * 59; const cy = 18 + row * 38;
        return (
          <g key={i}>
            <circle cx={cx} cy={cy} r="7" fill="#dddddd" />
            <rect x={cx - 15} y={cy + 10} width="30" height="4" rx="1" fill="#111111" />
            <rect x={cx - 12} y={cy + 16} width="24" height="3" rx="1" fill="#555555" />
          </g>
        );
      })}
    </>
  ),
  testimonial: (
    <>
      {/* Avatar */}
      <circle cx="80" cy="16" r="9" fill="#dddddd" />
      {/* Quote mark block */}
      <rect x="6" y="2" width="8" height="10" rx="1" fill="#111111" opacity="0.3" />
      {/* Heading + body + attribution */}
      <rect x="13" y="32" width="102" height="7" rx="1.5" fill="#111111" />
      <rect x="19" y="44" width="89" height="3" rx="1" fill="#555555" />
      <rect x="19" y="51" width="60" height="3" rx="1" fill="#555555" />
      <rect x="38" y="62" width="45" height="3" rx="1" fill="#888888" />
    </>
  ),

  /* ── DATA & FINANCIALS ───────────────────── */
  'two-stats': (
    <>
      <rect x="13" y="4" width="102" height="6" rx="1.5" fill="#111111" />
      {/* Left dark card */}
      <rect x="5" y="18" width="56" height="65" rx="3" fill="#111111" />
      <rect x="10" y="35" width="40" height="14" rx="2" fill="#ffffff" opacity="0.9" />
      <rect x="10" y="54" width="30" height="3" rx="1" fill="#ffffff" opacity="0.6" />
      {/* Right light card */}
      <rect x="66" y="18" width="56" height="65" rx="3" fill="#eeeeee" />
      <rect x="71" y="35" width="40" height="14" rx="2" fill="#111111" opacity="0.85" />
      <rect x="71" y="54" width="30" height="3" rx="1" fill="#111111" opacity="0.5" />
    </>
  ),
  'four-stats': (
    <>
      <rect x="13" y="4" width="102" height="6" rx="1.5" fill="#111111" />
      {[0, 1, 2, 3].map((i) => {
        const col = i % 2; const row = Math.floor(i / 2);
        const dark = i % 2 === 0;
        return (
          <g key={i}>
            <rect x={col * 79 + 5} y={row * 38 + 14} width="57" height="34" rx="3" fill={dark ? '#111111' : '#eeeeee'} />
            <rect x={col * 79 + 10} y={row * 38 + 21} width="35" height="10" rx="2" fill={dark ? '#ffffff' : '#111111'} opacity="0.9" />
            <rect x={col * 79 + 10} y={row * 38 + 34} width="25" height="3" rx="1" fill={dark ? '#ffffff' : '#111111'} opacity="0.5" />
          </g>
        );
      })}
    </>
  ),
  'kpi-grid': (
    <>
      <rect x="13" y="4" width="102" height="6" rx="1.5" fill="#111111" />
      {[0, 1, 2, 3].map((i) => {
        const col = i % 2; const row = Math.floor(i / 2);
        return (
          <g key={i}>
            <rect x={col * 79 + 5} y={row * 36 + 14} width="57" height="32" rx="3" fill="#ffffff" stroke="#888888" strokeWidth="0.75" />
            {/* Dark accent line on left */}
            <rect x={col * 79 + 7} y={row * 36 + 18} width="2" height="20" rx="1" fill="#111111" />
            <rect x={col * 79 + 12} y={row * 36 + 19} width="30" height="7" rx="1.5" fill="#111111" />
            <rect x={col * 79 + 12} y={row * 36 + 29} width="22" height="3" rx="1" fill="#555555" />
          </g>
        );
      })}
    </>
  ),
  table: (
    <>
      <rect x="6" y="4" width="64" height="7" rx="1.5" fill="#111111" />
      {/* Header row */}
      <rect x="4" y="14" width="152" height="9" rx="1" fill="#111111" />
      <rect x="8" y="16" width="36" height="5" rx="1" fill="#ffffff" opacity="0.8" />
      <rect x="52" y="16" width="24" height="5" rx="1" fill="#ffffff" opacity="0.5" />
      <rect x="84" y="16" width="24" height="5" rx="1" fill="#ffffff" opacity="0.5" />
      <rect x="122" y="16" width="28" height="5" rx="1" fill="#ffffff" opacity="0.5" />
      {/* 4 data rows alternating */}
      {[26, 36, 46, 56].map((y, i) => (
        <g key={i}>
          <rect x="4" y={y} width="152" height="9" fill={i % 2 === 0 ? '#f5f5f5' : '#ffffff'} />
          <rect x="8" y={y + 2} width="36" height="5" rx="1" fill="#111111" opacity="0.7" />
          <rect x="52" y={y + 2} width="24" height="5" rx="1" fill="#555555" opacity="0.6" />
          <rect x="84" y={y + 2} width="24" height="5" rx="1" fill="#555555" opacity="0.6" />
          <rect x="122" y={y + 2} width="28" height="5" rx="1" fill="#555555" opacity="0.6" />
        </g>
      ))}
    </>
  ),
  'bar-chart': (
    <>
      <rect x="6" y="5" width="64" height="7" rx="1.5" fill="#111111" />
      {/* Axis lines */}
      <rect x="14" y="18" width="2" height="54" rx="1" fill="#aaaaaa" />
      <rect x="14" y="70" width="132" height="2" rx="1" fill="#aaaaaa" />
      {/* 6 bars varying heights */}
      {[
        { h: 20, x: 22 }, { h: 36, x: 38 }, { h: 28, x: 54 },
        { h: 44, x: 70 }, { h: 38, x: 86 }, { h: 50, x: 102 },
      ].map((b, i) => (
        <rect key={i} x={b.x} y={72 - b.h} width="12" height={b.h} rx="1" fill="#111111" />
      ))}
    </>
  ),
  'chart-bullets': (
    <>
      <rect x="6" y="4" width="55" height="7" rx="1.5" fill="#111111" />
      {/* Left bullet list */}
      {[18, 28, 38, 48, 58].map((y, i) => (
        <g key={i}>
          <circle cx="9" cy={y + 1.5} r="1.5" fill="#111111" />
          <rect x="13" y={y} width="52" height="3" rx="1" fill="#111111" />
        </g>
      ))}
      {/* Right mini bar chart */}
      <rect x="80" y="14" width="2" height="56" rx="1" fill="#aaaaaa" />
      <rect x="80" y="68" width="76" height="2" rx="1" fill="#aaaaaa" />
      {[
        { h: 20, x: 85 }, { h: 34, x: 97 }, { h: 26, x: 109 },
        { h: 44, x: 121 }, { h: 36, x: 133 },
      ].map((b, i) => (
        <rect key={i} x={b.x} y={70 - b.h} width="9" height={b.h} rx="1" fill="#111111" />
      ))}
    </>
  ),
  roadmap: (
    <>
      <rect x="6" y="4" width="64" height="7" rx="1.5" fill="#111111" />
      {/* Header row */}
      <rect x="4" y="14" width="152" height="8" rx="1" fill="#111111" />
      <rect x="8" y="15.5" width="50" height="5" rx="1" fill="#ffffff" opacity="0.6" />
      {/* 3 task rows */}
      {[0, 1, 2].map((ri) => (
        <g key={ri}>
          <rect x="4" y={26 + ri * 18} width="152" height="15" fill={ri % 2 === 0 ? '#f5f5f5' : '#ffffff'} />
          <rect x={6 + [0, 30, 15][ri]} y={29 + ri * 18} width={[60, 80, 100][ri]} height="9" rx="3" fill="#111111" />
        </g>
      ))}
    </>
  ),
  gantt: (
    <>
      <rect x="6" y="4" width="64" height="7" rx="1.5" fill="#111111" />
      {/* Header */}
      <rect x="4" y="14" width="152" height="8" rx="1" fill="#111111" />
      {/* 5 task rows */}
      {[
        { start: 0, span: 2 }, { start: 1, span: 3 },
        { start: 3, span: 5 }, { start: 5, span: 2 }, { start: 6, span: 3 },
      ].map((t, i) => {
        const unit = 14;
        return (
          <g key={i}>
            <rect x="4" y={26 + i * 12} width="152" height="10" fill={i % 2 === 0 ? '#f5f5f5' : '#ffffff'} />
            <rect x={26 + t.start * unit} y={28 + i * 12} width={t.span * unit - 2} height="6" rx="2" fill="#111111" />
          </g>
        );
      })}
    </>
  ),

  /* ── PROCESS & TIMELINES ─────────────────── */
  'three-steps': (
    <>
      <rect x="13" y="5" width="102" height="7" rx="1.5" fill="#111111" />
      {/* Connecting line */}
      <rect x="22" y="33" width="116" height="2" rx="1" fill="#aaaaaa" />
      {[0, 1, 2].map((i) => (
        <g key={i}>
          <circle cx={22 + i * 53} cy="34" r="9" fill="#111111" />
          <rect x={22 + i * 53 - 7} y="31" width="14" height="6" rx="1" fill="#ffffff" opacity="0.8" />
          <rect x={22 + i * 53 - 15} y="49" width="30" height="5" rx="1" fill="#111111" />
          <rect x={22 + i * 53 - 12} y="57" width="24" height="3" rx="1" fill="#555555" />
        </g>
      ))}
    </>
  ),
  'four-steps': (
    <>
      <rect x="6" y="5" width="115" height="6" rx="1.5" fill="#111111" />
      {/* 4 vertical dark cards */}
      {[0, 1, 2, 3].map((i) => (
        <g key={i}>
          <rect x={5 + i * 39} y="22" width="35" height="62" rx="3" fill="#111111" />
          {/* Large number at top */}
          <rect x={9 + i * 39} y="28" width="20" height="14" rx="2" fill="#ffffff" opacity="0.9" />
          {/* Step name smaller */}
          <rect x={9 + i * 39} y="46" width="26" height="4" rx="1" fill="#ffffff" opacity="0.7" />
          <rect x={9 + i * 39} y="53" width="20" height="3" rx="1" fill="#ffffff" opacity="0.5" />
        </g>
      ))}
    </>
  ),
  'horizontal-timeline': (
    <>
      <rect x="5" y="5" width="64" height="7" rx="1.5" fill="#111111" />
      {/* Horizontal line */}
      <rect x="5" y="39" width="150" height="2" rx="1" fill="#111111" />
      {/* 4 nodes */}
      {[5, 55, 105, 150].map((x, i) => (
        <g key={i}>
          <circle cx={x} cy="40" r="5" fill="#111111" />
          <rect x={x - 15} y="50" width="30" height="3" rx="1" fill="#111111" />
          <rect x={x - 12} y="56" width="24" height="3" rx="1" fill="#555555" />
        </g>
      ))}
    </>
  ),
  'vertical-timeline': (
    <>
      <rect x="5" y="5" width="64" height="6" rx="1.5" fill="#111111" />
      {/* Vertical line */}
      <rect x="12" y="20" width="2" height="64" rx="1" fill="#111111" />
      {/* 3 nodes */}
      {[26, 46, 66].map((cy, i) => (
        <g key={i}>
          <circle cx="13" cy={cy} r="5" fill="#111111" />
          <rect x="22" y={cy - 5} width="70" height="5" rx="1" fill="#111111" />
          <rect x="22" y={cy + 2} width="55" height="3" rx="1" fill="#555555" />
        </g>
      ))}
    </>
  ),

  /* ── STRATEGY & FRAMEWORKS ───────────────── */
  'before-after': (
    <>
      <rect x="6" y="5" width="115" height="6" rx="1.5" fill="#111111" />
      {/* Before card */}
      <rect x="5" y="20" width="56" height="61" rx="3" fill="#eeeeee" />
      <rect x="5" y="23" width="56" height="8" rx="2" fill="#555555" />
      <rect x="9" y="26" width="30" height="4" rx="1" fill="#ffffff" opacity="0.8" />
      <rect x="9" y="35" width="44" height="3" rx="1" fill="#555555" />
      <rect x="9" y="41" width="38" height="3" rx="1" fill="#555555" />
      <rect x="9" y="47" width="42" height="3" rx="1" fill="#555555" />
      {/* After card */}
      <rect x="66" y="20" width="56" height="61" rx="3" fill="#111111" />
      <rect x="66" y="23" width="56" height="8" rx="2" fill="#444444" />
      <rect x="70" y="26" width="30" height="4" rx="1" fill="#ffffff" opacity="0.8" />
      <rect x="70" y="35" width="44" height="3" rx="1" fill="#ffffff" opacity="0.7" />
      <rect x="70" y="41" width="38" height="3" rx="1" fill="#ffffff" opacity="0.7" />
      <rect x="70" y="47" width="42" height="3" rx="1" fill="#ffffff" opacity="0.7" />
    </>
  ),
  'pros-cons': (
    <>
      <rect x="13" y="4" width="102" height="6" rx="1.5" fill="#111111" />
      {/* Pros card — light */}
      <rect x="5" y="18" width="56" height="65" rx="3" fill="#f5f5f5" />
      <rect x="9" y="22" width="30" height="5" rx="1" fill="#111111" />
      {[32, 42, 52].map((y, i) => (
        <g key={i}>
          <circle cx="11" cy={y + 1.5} r="1.5" fill="#111111" />
          <rect x="15" y={y} width="40" height="3" rx="1" fill="#555555" />
        </g>
      ))}
      {/* Cons card — dark */}
      <rect x="66" y="18" width="56" height="65" rx="3" fill="#111111" />
      <rect x="70" y="22" width="30" height="5" rx="1" fill="#ffffff" opacity="0.9" />
      {[32, 42, 52].map((y, i) => (
        <g key={i}>
          <circle cx="72" cy={y + 1.5} r="1.5" fill="#ffffff" opacity="0.8" />
          <rect x="76" y={y} width="40" height="3" rx="1" fill="#ffffff" opacity="0.7" />
        </g>
      ))}
    </>
  ),
  'three-pillars': (
    <>
      <rect x="5" y="4" width="64" height="6" rx="1.5" fill="#111111" />
      {[0, 1, 2].map((i) => {
        const dark = i === 1;
        return (
          <g key={i}>
            <rect x={4 + i * 52} y="18" width="48" height="66" rx="3" fill={dark ? '#111111' : '#eeeeee'} />
            <rect x={8 + i * 52} y="22" width="28" height="5" rx="1" fill={dark ? '#ffffff' : '#111111'} opacity="0.9" />
            <rect x={8 + i * 52} y="30" width="36" height="3" rx="1" fill={dark ? '#ffffff' : '#555555'} opacity="0.7" />
            <rect x={8 + i * 52} y="36" width="30" height="3" rx="1" fill={dark ? '#ffffff' : '#555555'} opacity="0.6" />
          </g>
        );
      })}
    </>
  ),
  swot: (
    <>
      {/* TL dark */}
      <rect x="1" y="1" width="78" height="43" rx="2" fill="#111111" />
      <rect x="5" y="5" width="30" height="5" rx="1" fill="#ffffff" opacity="0.85" />
      <rect x="5" y="13" width="60" height="3" rx="1" fill="#ffffff" opacity="0.5" />
      <rect x="5" y="19" width="48" height="3" rx="1" fill="#ffffff" opacity="0.4" />
      {/* TR dark gray */}
      <rect x="81" y="1" width="78" height="43" rx="2" fill="#444444" />
      <rect x="85" y="5" width="30" height="5" rx="1" fill="#ffffff" opacity="0.85" />
      <rect x="85" y="13" width="60" height="3" rx="1" fill="#ffffff" opacity="0.5" />
      <rect x="85" y="19" width="48" height="3" rx="1" fill="#ffffff" opacity="0.4" />
      {/* BL light */}
      <rect x="1" y="46" width="78" height="43" rx="2" fill="#eeeeee" />
      <rect x="5" y="50" width="30" height="5" rx="1" fill="#111111" opacity="0.85" />
      <rect x="5" y="58" width="60" height="3" rx="1" fill="#111111" opacity="0.5" />
      <rect x="5" y="64" width="48" height="3" rx="1" fill="#111111" opacity="0.4" />
      {/* BR lightest */}
      <rect x="81" y="46" width="78" height="43" rx="2" fill="#dddddd" />
      <rect x="85" y="50" width="30" height="5" rx="1" fill="#111111" opacity="0.85" />
      <rect x="85" y="58" width="60" height="3" rx="1" fill="#111111" opacity="0.5" />
      <rect x="85" y="64" width="48" height="3" rx="1" fill="#111111" opacity="0.4" />
    </>
  ),
  'hub-spoke': (
    <>
      {/* Center hub */}
      <circle cx="80" cy="48" r="10" fill="#111111" />
      <rect x="72" y="44" width="16" height="8" rx="2" fill="#ffffff" opacity="0.85" />
      {/* 5 spokes with nodes */}
      {[0, 1, 2, 3, 4].map((i) => {
        const angle = (i / 5) * Math.PI * 2 - Math.PI / 2;
        const sx = 80 + Math.cos(angle) * 32;
        const sy = 48 + Math.sin(angle) * 28;
        return (
          <g key={i}>
            <line x1="80" y1="48" x2={sx} y2={sy} stroke="#111111" strokeWidth="1" />
            <rect x={sx - 12} y={sy - 6} width="24" height="12" rx="3"
              fill="#eeeeee" stroke="#111111" strokeWidth="0.75" />
          </g>
        );
      })}
    </>
  ),
  pyramid: (
    <>
      {/* 4 stacked bars widths: 32, 66, 100, 144 centered, fills #111,#444,#888,#aaaaaa */}
      {[
        { w: 32, fill: '#111111' },
        { w: 66, fill: '#444444' },
        { w: 100, fill: '#888888' },
        { w: 144, fill: '#aaaaaa' },
      ].map((l, i) => (
        <g key={i}>
          <rect x={(160 - l.w) / 2} y={8 + i * 19} width={l.w} height="16" rx="2" fill={l.fill} />
        </g>
      ))}
    </>
  ),

  /* ── CLOSING & NEXT STEPS ─────────────────── */
  'heading-buttons': (
    <>
      {/* Centered title */}
      <rect x="13" y="12" width="102" height="8" rx="1.5" fill="#111111" />
      {/* 2 pill buttons */}
      <rect x="28" y="56" width="44" height="11" rx="5" fill="#111111" />
      <rect x="32" y="59" width="36" height="4" rx="1" fill="#ffffff" opacity="0.8" />
      <rect x="89" y="56" width="44" height="11" rx="5" fill="#111111" />
      <rect x="93" y="59" width="36" height="4" rx="1" fill="#ffffff" opacity="0.8" />
    </>
  ),
  'numbered-list': (
    <>
      <rect x="5" y="4" width="64" height="7" rx="1.5" fill="#111111" />
      {/* 4 rows: number badge + text bar */}
      {[18, 32, 46, 60].map((y, i) => (
        <g key={i}>
          <rect x="4" y={y} width="11" height="11" rx="2" fill="#dddddd" />
          <rect x="6" y={y + 2} width="7" height="7" rx="1" fill="#111111" opacity="0.6" />
          <rect x="18" y={y + 2} width="100" height="6" rx="1" fill="#111111" />
        </g>
      ))}
    </>
  ),
  'five-features': (
    <>
      <rect x="5" y="4" width="64" height="7" rx="1.5" fill="#111111" />
      {/* 5 rows: icon rect + divider + label + description */}
      {[16, 28, 40, 52, 64].map((y, i) => (
        <g key={i}>
          <rect x="5" y={y} width="8" height="8" rx="2" fill="#111111" />
          <rect x="16" y={y} width="44" height="5" rx="1" fill="#111111" />
          <rect x="64" y={y} width="70" height="4" rx="1" fill="#555555" opacity="0.7" />
          <rect x="5" y={y + 10} width="152" height="0.75" fill="#888888" opacity="0.4" />
        </g>
      ))}
    </>
  ),
};

// Scale from 1280×720 canvas to 160×90 SVG viewBox
const SX = 160 / 1280;
const SY = 90 / 720;

function px(v) { return Math.round(v * 10) / 10; }

function LayoutPreviewSVGEl({ el }) {
  const x = px(el.x * SX);
  const y = px(el.y * SY);
  const w = px(Math.max((el.width || 80) * SX, 1));
  const h = px(Math.max((el.height || 20) * SY, 1));
  const fill = el.fill || '#111111';
  const stroke = el.stroke || 'none';
  const sw = (el.strokeWidth || 0) * SX;

  if (el.type === 'text') {
    // Render text as a filled rounded rect — height proportional to fontSize
    const fh = px(Math.max((el.fontSize || 16) * SY * 0.85, 1.5));
    const color = el.fill || '#111111';
    const align = el.align || 'left';
    const lines = (el.text || '').split('\n').filter(Boolean);
    const lineCount = Math.max(lines.length, 1);
    // For large titles: one solid bar. For body text: multiple thin lines.
    if (fh >= 5) {
      return (
        <rect
          x={align === 'center' ? px(x + w * 0.05) : x}
          y={y}
          width={align === 'center' ? px(w * 0.9) : w}
          height={px(Math.min(fh * lineCount + (lineCount - 1) * fh * 0.3, h))}
          rx="1"
          fill={color}
        />
      );
    }
    // Small text: draw as thin lines
    return (
      <>
        {Array.from({ length: Math.min(lineCount, 4) }).map((_, i) => (
          <rect
            key={i}
            x={align === 'center' ? px(x + w * 0.1) : x}
            y={px(y + i * (fh + 1.5))}
            width={align === 'center' ? px(w * 0.8) : i === lineCount - 1 ? px(w * 0.6) : w}
            height={Math.max(fh, 1)}
            rx="0.5"
            fill={color}
          />
        ))}
      </>
    );
  }

  if (el.type === 'rect' || el.type === 'roundedRect') {
    const cr = Math.min((el.cornerRadius || 0) * SX, Math.min(w, h) / 2);
    if (fill === 'transparent' || fill === 'none') {
      return <rect x={x} y={y} width={w} height={h} rx={cr} fill="none" stroke={stroke} strokeWidth={Math.max(sw, 0.5)} />;
    }
    return <rect x={x} y={y} width={w} height={h} rx={cr} fill={fill} stroke={stroke === 'none' ? undefined : stroke} strokeWidth={sw || undefined} />;
  }

  if (el.type === 'circle' || el.type === 'ellipse') {
    return <ellipse cx={px(x + w / 2)} cy={px(y + h / 2)} rx={px(w / 2)} ry={px(h / 2)} fill={fill} stroke={stroke === 'none' ? undefined : stroke} strokeWidth={sw || undefined} />;
  }

  if (el.type === 'line' || el.type === 'arrow') {
    return <line x1={x} y1={y} x2={px(x + w)} y2={px(y + h)} stroke={stroke === 'none' ? '#111111' : stroke} strokeWidth={Math.max(sw, 0.5)} />;
  }

  if (el.type === 'image') {
    return <rect x={x} y={y} width={w} height={h} rx="2" fill="#d0e8f0" />;
  }

  // Triangle
  if (el.type === 'triangle') {
    const pts = `${px(x + w/2)},${y} ${px(x + w)},${px(y + h)} ${x},${px(y + h)}`;
    return <polygon points={pts} fill={fill} />;
  }

  return null;
}

// Cache generated elements per layout id so we don't regenerate on every render
const PREVIEW_CANVAS = { width: 1280, height: 720 };
const _previewCache = {};
function getPreviewElements(layout) {
  if (!_previewCache[layout.id]) {
    try {
      _previewCache[layout.id] = layout.generate ? layout.generate(PREVIEW_CANVAS) : [];
    } catch {
      _previewCache[layout.id] = [];
    }
  }
  return _previewCache[layout.id];
}

function LayoutPreviewIcon({ layout }) {
  const elements = getPreviewElements(layout);
  // Check if layout has a dark background element (full-canvas rect)
  const bgEl = elements.find(
    (el) => el.type === 'rect' && el.x <= 0 && el.y <= 0 && el.width >= 1200 && el.height >= 680
  );
  const bgColor = bgEl ? bgEl.fill : '#ffffff';
  const visibleEls = bgEl ? elements.filter((el) => el !== bgEl) : elements;

  return (
    <svg
      width="100%"
      viewBox="0 0 160 90"
      className="flex-shrink-0 rounded-lg w-full border border-gray-200"
      style={{ height: 80, background: bgColor }}
    >
      {visibleEls.map((el, i) => (
        <LayoutPreviewSVGEl key={el.id || i} el={el} />
      ))}
    </svg>
  );
}
