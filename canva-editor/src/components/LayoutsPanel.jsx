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

// Accurate per-layout miniature previews — 16:9 viewBox (160×90)
const LAYOUT_PREVIEWS = {
  'title-center': (
    <>
      <rect x="8" y="34" width="90" height="10" rx="2" fill="#111" />
      <rect x="8" y="48" width="60" height="5" rx="1.5" fill="#555" />
    </>
  ),
  'title-center-centered': (
    <>
      <rect x="44" y="12" width="72" height="7" rx="10" fill="none" stroke="#111" strokeWidth="1.5" />
      <rect x="20" y="32" width="120" height="14" rx="2" fill="#111" />
      <rect x="16" y="52" width="128" height="6" rx="1.5" fill="#444" />
    </>
  ),
  'title-subtitle-below': (
    <>
      <rect x="20" y="22" width="120" height="18" rx="2" fill="#111" />
      <rect x="36" y="54" width="88" height="6" rx="1.5" fill="#555" />
    </>
  ),
  'section-divider': (
    <>
      <rect x="8" y="20" width="100" height="16" rx="2" fill="#111" />
      <rect x="8" y="42" width="70" height="5" rx="1.5" fill="#666" />
    </>
  ),
  'dark-title': (
    <>
      <rect x="0" y="0" width="160" height="90" rx="3" fill="#111" />
      <rect x="16" y="26" width="128" height="14" rx="2" fill="#fff" />
      <rect x="32" y="46" width="96" height="5" rx="1.5" fill="#888" />
    </>
  ),
  'thank-you': (
    <>
      <rect x="16" y="24" width="128" height="20" rx="2" fill="#111" />
      <rect x="32" y="54" width="96" height="5" rx="1.5" fill="#888" />
    </>
  ),
  cta: (
    <>
      <rect x="0" y="0" width="160" height="90" rx="3" fill="#111" />
      <rect x="12" y="18" width="136" height="16" rx="2" fill="#fff" />
      <rect x="20" y="42" width="120" height="6" rx="1.5" fill="#888" />
      <rect x="48" y="58" width="64" height="14" rx="7" fill="#fff" />
    </>
  ),
  'agenda-list': (
    <>
      <rect x="4" y="6" width="50" height="10" rx="2" fill="#111" />
      {[20, 34, 48, 62, 76].map((y, i) => (
        <g key={i}>
          <circle cx="68" cy={y + 4} r="5" fill="#111" />
          <rect x="78" cy={y} y={y} width="74" height="9" rx="1.5" fill="#111" />
        </g>
      ))}
    </>
  ),
  'agenda-grid': (
    <>
      <rect x="4" y="4" width="50" height="9" rx="2" fill="#111" />
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const col = i % 3; const row = Math.floor(i / 3);
        return <rect key={i} x={4 + col * 52} y={18 + row * 34} width="48" height="30" rx="4" fill="#111" />;
      })}
    </>
  ),
  'agenda-3col': (
    <>
      <rect x="32" y="4" width="96" height="10" rx="2" fill="#111" />
      {[0, 1, 2].map((i) => (
        <g key={i}>
          <circle cx={28 + i * 52} cy="36" r="10" fill="#111" />
          <rect x={4 + i * 52} y="52" width="48" height="8" rx="2" fill="#333" />
        </g>
      ))}
    </>
  ),
  'title-bullets': (
    <>
      <rect x="4" y="4" width="100" height="12" rx="2" fill="#111" />
      <rect x="4" y="20" width="152" height="1.5" fill="#ddd" />
      {[26, 37, 48, 59, 70].map((y, i) => (
        <g key={i}>
          <circle cx="10" cy={y + 3} r="2.5" fill="#111" />
          <rect x="16" y={y} width="138" height="6" rx="1.5" fill="#444" />
        </g>
      ))}
    </>
  ),
  'two-column': (
    <>
      <rect x="4" y="4" width="152" height="12" rx="2" fill="#111" />
      <rect x="4" y="22" width="72" height="6" rx="1.5" fill="#555" />
      <rect x="4" y="32" width="68" height="5" rx="1.5" fill="#777" />
      <rect x="4" y="41" width="70" height="5" rx="1.5" fill="#777" />
      <rect x="84" y="22" width="72" height="6" rx="1.5" fill="#555" />
      <rect x="84" y="32" width="68" height="5" rx="1.5" fill="#777" />
      <rect x="84" y="41" width="70" height="5" rx="1.5" fill="#777" />
    </>
  ),
  'title-two-col-body': (
    <>
      <rect x="4" y="4" width="100" height="12" rx="2" fill="#111" />
      {[22, 32, 42, 52, 62, 72].map((y, i) => (
        <rect key={i} x={i < 3 ? 4 : 84} y={22 + (i % 3) * 16} width="68" height="6" rx="1.5" fill="#555" />
      ))}
    </>
  ),
  blockquote: (
    <>
      <rect x="4" y="2" width="18" height="24" rx="2" fill="#ddd" />
      <rect x="8" y="30" width="144" height="18" rx="2" fill="#111" />
      <rect x="8" y="54" width="40" height="5" rx="1.5" fill="#888" />
    </>
  ),
  'dark-quote': (
    <>
      <rect x="0" y="0" width="160" height="90" rx="3" fill="#111" />
      <rect x="8" y="4" width="18" height="24" rx="2" fill="#444" />
      <rect x="8" y="30" width="144" height="18" rx="2" fill="#fff" />
      <rect x="8" y="56" width="40" height="5" rx="1.5" fill="#888" />
    </>
  ),
  'big-number': (
    <>
      <rect x="16" y="10" width="128" height="40" rx="2" fill="#111" />
      <rect x="32" y="58" width="96" height="7" rx="2" fill="#555" />
    </>
  ),
  'two-cards': (
    <>
      <rect x="4" y="6" width="72" height="78" rx="6" fill="#111" />
      <circle cx="24" cy="24" r="8" fill="#fff" />
      <rect x="10" y="52" width="60" height="8" rx="2" fill="#fff" />
      <rect x="84" y="6" width="72" height="78" rx="6" fill="#111" />
      <circle cx="104" cy="24" r="8" fill="#fff" />
      <rect x="90" y="52" width="60" height="8" rx="2" fill="#fff" />
    </>
  ),
  'four-cards': (
    <>
      {[0, 1, 2, 3].map((i) => {
        const col = i % 2; const row = Math.floor(i / 2);
        return (
          <g key={i}>
            <rect x={4 + col * 78} y={4 + row * 42} width="74" height="38" rx="5" fill="#111" />
            <rect x={14 + col * 78} y={18 + row * 42} width="54" height="6" rx="2" fill="#fff" />
          </g>
        );
      })}
    </>
  ),
  'image-right': (
    <>
      <rect x="0" y="0" width="74" height="90" rx="0" fill="#d0d0d0" />
      <rect x="82" y="14" width="70" height="14" rx="2" fill="#111" />
      <rect x="82" y="34" width="66" height="5" rx="1.5" fill="#555" />
      <rect x="82" y="43" width="60" height="5" rx="1.5" fill="#777" />
      <rect x="82" y="52" width="64" height="5" rx="1.5" fill="#777" />
    </>
  ),
  'image-left': (
    <>
      <rect x="8" y="14" width="70" height="14" rx="2" fill="#111" />
      <rect x="8" y="34" width="66" height="5" rx="1.5" fill="#555" />
      <rect x="8" y="43" width="60" height="5" rx="1.5" fill="#777" />
      <rect x="86" y="0" width="74" height="90" rx="0" fill="#d0d0d0" />
    </>
  ),
  'image-left-bullets': (
    <>
      <rect x="0" y="0" width="68" height="90" rx="0" fill="#d0d0d0" />
      <rect x="74" y="10" width="78" height="10" rx="2" fill="#111" />
      {[28, 42, 56].map((y, i) => (
        <g key={i}>
          <circle cx="80" cy={y + 3} r="2.5" fill="#111" />
          <rect x="86" y={y} width="64" height="5" rx="1.5" fill="#444" />
        </g>
      ))}
    </>
  ),
  'heading-three-images': (
    <>
      <rect x="16" y="3" width="128" height="12" rx="2" fill="#111" />
      <rect x="8" y="22" width="44" height="62" rx="4" fill="#d0d0d0" />
      <rect x="58" y="22" width="44" height="62" rx="4" fill="#d0d0d0" />
      <rect x="108" y="22" width="44" height="62" rx="4" fill="#d0d0d0" />
    </>
  ),
  venn: (
    <>
      <circle cx="56" cy="48" r="36" fill="#888" opacity="0.6" />
      <circle cx="104" cy="48" r="36" fill="#333" opacity="0.7" />
    </>
  ),
  'full-bleed-text': (
    <>
      <rect x="0" y="0" width="160" height="90" rx="3" fill="#333" />
      <rect x="0" y="48" width="160" height="42" rx="0" fill="#111" opacity="0.8" />
      <rect x="8" y="54" width="110" height="12" rx="2" fill="#fff" />
      <rect x="8" y="72" width="70" height="5" rx="1.5" fill="#aaa" />
    </>
  ),
  'highlight-box': (
    <>
      <rect x="8" y="4" width="100" height="12" rx="2" fill="#111" />
      <rect x="10" y="24" width="140" height="52" rx="8" fill="#111" />
      <rect x="20" y="38" width="120" height="8" rx="2" fill="#fff" />
      <rect x="30" y="52" width="100" height="6" rx="1.5" fill="#888" />
    </>
  ),
  'photo-grid-4': (
    <>
      <rect x="1" y="1" width="78" height="43" rx="3" fill="#d0d0d0" />
      <rect x="81" y="1" width="78" height="43" rx="3" fill="#bbb" />
      <rect x="1" y="46" width="78" height="43" rx="3" fill="#bbb" />
      <rect x="81" y="46" width="78" height="43" rx="3" fill="#d0d0d0" />
    </>
  ),
  'photo-grid-3': (
    <>
      <rect x="1" y="1" width="78" height="88" rx="3" fill="#d0d0d0" />
      <rect x="81" y="1" width="78" height="42" rx="3" fill="#bbb" />
      <rect x="81" y="46" width="78" height="43" rx="3" fill="#bbb" />
    </>
  ),
  'team-grid': (
    <>
      <rect x="4" y="4" width="100" height="10" rx="2" fill="#111" />
      {[0, 1, 2, 3].map((i) => {
        const col = i % 2; const row = Math.floor(i / 2);
        const cx = 24 + col * 76; const cy = 24 + row * 36;
        return (
          <g key={i}>
            <circle cx={cx} cy={cy} r="10" fill="#ddd" />
            <rect x={cx - 20} y={cy + 14} width="40" height="5" rx="1.5" fill="#333" />
          </g>
        );
      })}
    </>
  ),
  'hub-spoke': (
    <>
      <circle cx="80" cy="52" r="12" fill="#111" />
      {[0, 1, 2, 3, 4].map((i) => {
        const angle = (i / 5) * Math.PI * 2 - Math.PI / 2;
        const sx = 80 + Math.cos(angle) * 34;
        const sy = 52 + Math.sin(angle) * 30;
        return (
          <g key={i}>
            <line x1="80" y1="52" x2={sx} y2={sy} stroke="#aaa" strokeWidth="1.5" />
            <rect x={sx - 14} y={sy - 7} width="28" height="14" rx="4" fill="#f0f0f0" stroke="#111" strokeWidth="1" />
          </g>
        );
      })}
      <rect x="66" y="46" width="28" height="12" rx="2" fill="#111" />
    </>
  ),
  pyramid: (
    <>
      {[
        { w: 36, fill: '#111' },
        { w: 72, fill: '#444' },
        { w: 108, fill: '#888' },
        { w: 144, fill: '#ccc' },
      ].map((l, i) => (
        <rect key={i} x={(160 - l.w) / 2} y={8 + i * 20} width={l.w} height="17" rx="3" fill={l.fill} />
      ))}
    </>
  ),
  'horizontal-timeline': (
    <>
      <rect x="4" y="4" width="80" height="12" rx="2" fill="#111" />
      <rect x="4" y="42" width="152" height="3" fill="#111" rx="1.5" />
      {[4, 56, 108].map((x, i) => (
        <g key={i}>
          <circle cx={x + 5} cy="43" r="6" fill="#111" />
          <rect x={x - 8} y="54" width="36" height="5" rx="1.5" fill="#333" />
          <rect x={x - 8} y="63" width="30" height="4" rx="1.5" fill="#888" />
        </g>
      ))}
      <circle cx="155" cy="43" r="6" fill="#111" />
    </>
  ),
  'vertical-timeline': (
    <>
      <rect x="4" y="4" width="80" height="12" rx="2" fill="#111" />
      <rect x="20" y="22" width="3" height="64" rx="1.5" fill="#111" />
      {[22, 42, 62].map((y, i) => (
        <g key={i}>
          <circle cx="21" cy={y + 4} r="5" fill="#111" />
          <rect x="32" y={y} width="80" height="6" rx="1.5" fill="#333" />
          <rect x="32" y={y + 10} width="60" height="4" rx="1.5" fill="#aaa" />
        </g>
      ))}
    </>
  ),
  'three-steps': (
    <>
      <rect x="16" y="4" width="128" height="10" rx="2" fill="#111" />
      {[0, 1, 2].map((i) => (
        <g key={i}>
          <circle cx={26 + i * 54} cy="38" r="12" fill="#111" />
          <rect x={4 + i * 54} y="56" width="44" height="6" rx="2" fill="#333" />
          <rect x={8 + i * 54} y="66" width="36" height="4" rx="1.5" fill="#aaa" />
        </g>
      ))}
    </>
  ),
  'four-steps': (
    <>
      <rect x="16" y="4" width="128" height="10" rx="2" fill="#111" />
      {[0, 1, 2, 3].map((i) => (
        <rect key={i} x={4 + i * 39} y="22" width="35" height="62" rx="5" fill={i % 2 === 0 ? '#111' : '#333'} />
      ))}
    </>
  ),
  'before-after': (
    <>
      <rect x="4" y="4" width="100" height="10" rx="2" fill="#111" />
      <rect x="4" y="20" width="72" height="66" rx="6" fill="#eee" />
      <rect x="10" y="24" width="60" height="6" rx="1.5" fill="#999" />
      <rect x="84" y="20" width="72" height="66" rx="6" fill="#111" />
      <rect x="90" y="24" width="60" height="6" rx="1.5" fill="#888" />
    </>
  ),
  'pros-cons': (
    <>
      <rect x="16" y="2" width="128" height="10" rx="2" fill="#111" />
      <rect x="4" y="16" width="72" height="70" rx="6" fill="#eee" />
      <rect x="84" y="16" width="72" height="70" rx="6" fill="#111" />
      {[26, 38, 50].map((y, i) => (
        <g key={i}>
          <rect x="10" y={y} width="60" height="5" rx="1.5" fill="#777" />
          <rect x="90" y={y} width="60" height="5" rx="1.5" fill="#aaa" />
        </g>
      ))}
    </>
  ),
  'three-pillars': (
    <>
      <rect x="4" y="4" width="80" height="10" rx="2" fill="#111" />
      {[0, 1, 2].map((i) => (
        <rect key={i} x={4 + i * 52} y="20" width="48" height="66" rx="5"
          fill={i === 1 ? '#111' : '#eee'} stroke={i === 1 ? 'none' : '#ccc'} strokeWidth="1" />
      ))}
    </>
  ),
  swot: (
    <>
      {[
        { x: 1, y: 1, fill: '#111' }, { x: 81, y: 1, fill: '#444' },
        { x: 1, y: 46, fill: '#eee' }, { x: 81, y: 46, fill: '#ddd' },
      ].map((q, i) => (
        <g key={i}>
          <rect x={q.x} y={q.y} width="78" height="43" rx="3" fill={q.fill} />
          <rect x={q.x + 6} y={q.y + 8} width="40" height="6" rx="1.5"
            fill={i < 2 ? '#fff' : '#555'} />
        </g>
      ))}
    </>
  ),
  'numbered-list': (
    <>
      <rect x="4" y="4" width="80" height="10" rx="2" fill="#111" />
      {[22, 38, 54, 70].map((y, i) => (
        <g key={i}>
          <rect x="4" y={y} width="10" height="10" rx="1" fill="#ddd" />
          <rect x="20" y={y + 2} width="134" height="1.5" fill="#eee" />
          <rect x="20" y={y + 4} width="110" height="6" rx="1.5" fill="#444" />
        </g>
      ))}
    </>
  ),
  'five-features': (
    <>
      <rect x="4" y="4" width="80" height="10" rx="2" fill="#111" />
      {[20, 33, 46, 59, 72].map((y, i) => (
        <g key={i}>
          <rect x="4" y={y} width="10" height="5" rx="1" fill="#ccc" />
          <rect x="4" y={y + 7} width="152" height="1" fill="#eee" />
          <rect x="20" y={y} width="44" height="6" rx="1.5" fill="#333" />
          <rect x="72" y={y} width="84" height="5" rx="1.5" fill="#888" />
        </g>
      ))}
    </>
  ),
  'heading-buttons': (
    <>
      <rect x="20" y="14" width="120" height="18" rx="2" fill="#111" />
      <rect x="24" y="42" width="48" height="16" rx="8" fill="#111" />
      <rect x="88" y="42" width="48" height="16" rx="8" fill="#111" />
    </>
  ),
  'two-stats': (
    <>
      <rect x="20" y="4" width="120" height="8" rx="2" fill="#111" />
      <rect x="4" y="16" width="72" height="70" rx="6" fill="#111" />
      <rect x="84" y="16" width="72" height="70" rx="6" fill="#eee" />
      <rect x="8" y="34" width="64" height="18" rx="2" fill="#fff" />
      <rect x="88" y="34" width="64" height="18" rx="2" fill="#111" />
    </>
  ),
  'four-stats': (
    <>
      <rect x="20" y="2" width="120" height="9" rx="2" fill="#111" />
      {[0, 1, 2, 3].map((i) => {
        const col = i % 2; const row = Math.floor(i / 2);
        return (
          <g key={i}>
            <rect x={4 + col * 78} y={14 + row * 38} width="74" height="34" rx="5"
              fill={i % 2 === 0 ? '#111' : '#eee'} />
            <rect x={14 + col * 78} y={22 + row * 38} width="54" height="10" rx="2"
              fill={i % 2 === 0 ? '#fff' : '#111'} />
          </g>
        );
      })}
    </>
  ),
  'kpi-grid': (
    <>
      <rect x="4" y="4" width="80" height="10" rx="2" fill="#111" />
      {[0, 1, 2, 3].map((i) => {
        const col = i % 2; const row = Math.floor(i / 2);
        return (
          <g key={i}>
            <rect x={4 + col * 78} y={20 + row * 36} width="74" height="32" rx="4" fill="#f4f4f4" />
            <rect x={8 + col * 78} y={26 + row * 36} width="44" height="8" rx="2" fill="#111" />
          </g>
        );
      })}
    </>
  ),
  table: (
    <>
      <rect x="4" y="4" width="90" height="10" rx="2" fill="#111" />
      <rect x="4" y="18" width="152" height="10" rx="2" fill="#111" />
      {[30, 42, 54, 66].map((y, i) => (
        <g key={i}>
          <rect x="4" y={y} width="152" height="10" rx="0" fill={i % 2 === 0 ? '#f4f4f4' : '#fff'} />
          <rect x="8" y={y + 2} width="36" height="5" rx="1.5" fill="#555" />
          <rect x="52" y={y + 2} width="24" height="5" rx="1.5" fill="#777" />
          <rect x="84" y={y + 2} width="24" height="5" rx="1.5" fill="#777" />
          <rect x="122" y={y + 2} width="28" height="5" rx="1.5" fill="#777" />
        </g>
      ))}
    </>
  ),
  'bar-chart': (
    <>
      <rect x="4" y="4" width="80" height="10" rx="2" fill="#111" />
      <rect x="14" y="70" width="136" height="2" fill="#ccc" />
      {[
        { h: 28, x: 20 }, { h: 42, x: 42 }, { h: 34, x: 64 },
        { h: 52, x: 86 }, { h: 46, x: 108 }, { h: 58, x: 130 },
      ].map((b, i) => (
        <rect key={i} x={b.x} y={72 - b.h} width="16" height={b.h} rx="2" fill="#111" />
      ))}
    </>
  ),
  'chart-bullets': (
    <>
      <rect x="4" y="4" width="60" height="10" rx="2" fill="#111" />
      {[22, 34, 46, 58, 70].map((y, i) => (
        <g key={i}>
          <circle cx="10" cy={y + 3} r="2.5" fill="#111" />
          <rect x="16" y={y} width="52" height="5" rx="1.5" fill="#555" />
        </g>
      ))}
      <rect x="84" y="16" width="2" height="60" fill="#ccc" />
      <rect x="84" y="74" width="72" height="2" fill="#ccc" />
      {[
        { h: 24, x: 88 }, { h: 38, x: 100 }, { h: 30, x: 112 },
        { h: 50, x: 124 }, { h: 44, x: 136 },
      ].map((b, i) => (
        <rect key={i} x={b.x} y={76 - b.h} width="10" height={b.h} rx="2" fill="#111" />
      ))}
    </>
  ),
  testimonial: (
    <>
      <circle cx="80" cy="18" r="12" fill="#ddd" />
      <rect x="8" y="22" width="24" height="20" rx="2" fill="#eee" />
      <rect x="16" y="38" width="128" height="10" rx="2" fill="#111" />
      <rect x="24" y="52" width="112" height="7" rx="2" fill="#555" />
      <rect x="48" y="66" width="64" height="6" rx="1.5" fill="#888" />
      <rect x="56" y="76" width="48" height="5" rx="1.5" fill="#aaa" />
    </>
  ),
  roadmap: (
    <>
      <rect x="4" y="4" width="80" height="10" rx="2" fill="#111" />
      <rect x="4" y="18" width="152" height="10" rx="2" fill="#111" />
      {[0, 1, 2].map((ri) => (
        <g key={ri}>
          <rect x="4" y={32 + ri * 20} width="152" height="17" rx="0"
            fill={ri % 2 === 0 ? '#f4f4f4' : '#fff'} />
          <rect x={4 + [0, 38, 19][ri]} y={35 + ri * 20}
            width={[57, 76, 96][ri]} height="10" rx="4"
            fill={['#111', '#444', '#888'][ri]} />
        </g>
      ))}
    </>
  ),
  gantt: (
    <>
      <rect x="4" y="4" width="80" height="10" rx="2" fill="#111" />
      <rect x="4" y="18" width="152" height="8" rx="2" fill="#111" />
      {[
        { start: 0, span: 2 }, { start: 1, span: 3 },
        { start: 3, span: 5 }, { start: 6, span: 2 }, { start: 7, span: 2 },
      ].map((t, i) => {
        const unit = 17;
        return (
          <g key={i}>
            <rect x="4" y={30 + i * 12} width="152" height="10"
              fill={i % 2 === 0 ? '#f4f4f4' : '#fff'} />
            <rect x={28 + t.start * unit} y={32 + i * 12}
              width={t.span * unit - 2} height="6" rx="2"
              fill={['#111', '#333', '#555', '#777', '#999'][i]} />
          </g>
        );
      })}
    </>
  ),
  'hub-spoke': (
    <>
      <circle cx="80" cy="52" r="12" fill="#111" />
      {[0, 1, 2, 3, 4].map((i) => {
        const angle = (i / 5) * Math.PI * 2 - Math.PI / 2;
        const sx = 80 + Math.cos(angle) * 34;
        const sy = 52 + Math.sin(angle) * 30;
        return (
          <g key={i}>
            <line x1="80" y1="52" x2={sx} y2={sy} stroke="#ccc" strokeWidth="1.5" />
            <rect x={sx - 14} y={sy - 7} width="28" height="14" rx="4"
              fill="#f0f0f0" stroke="#111" strokeWidth="1" />
          </g>
        );
      })}
    </>
  ),
};

function LayoutPreviewIcon({ layout }) {
  const preview = LAYOUT_PREVIEWS[layout.id];
  return (
    <svg
      width="100%"
      viewBox="0 0 160 90"
      className="flex-shrink-0 bg-white rounded-lg w-full border border-gray-100"
      style={{ height: 56 }}
    >
      {preview ?? (
        <rect x="4" y="4" width="152" height="82" rx="4" fill="#f0f0f0" />
      )}
    </svg>
  );
}
