import { useMemo, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { RefreshCw, Shuffle, Sparkles } from "lucide-react";
import useEditorStore from "../store/useEditorStore";
import { LAYOUT_DEFINITIONS, suggestLayouts } from "../data/layoutDefinitions";
import { useToast } from "./Toast";

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

  // Current page's applied layout
  const currentPage = pages?.find((p) => p.id === currentPageId);
  const appliedLayoutId = currentPage?.appliedLayoutId ?? null;

  // Once any layout is applied, all other layouts are locked
  const isLayoutLocked = (layout) =>
    appliedLayoutId !== null && layout.id !== appliedLayoutId;

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
    } else {
      newElements = layout.generate
        ? layout.generate(canvasSize)
        : layout.apply(elements.map((e) => ({ ...e })), canvasSize);
    }

    updatePage(currentPageId, {
      elements: newElements.map((e) => ({ ...e, id: e.id || uuidv4() })),
      appliedLayoutId: layout.id,
    });
    toast(`"${layout.name}" applied! Press Ctrl+Z to undo.`, "success");
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
          onClick={() => setRearrangeMode(false)}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-lg transition-colors ${
            !rearrangeMode ? "bg-white text-purple-700 shadow-sm" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <RefreshCw size={12} />
          Fresh layout
        </button>
        <button
          type="button"
          onClick={() => setRearrangeMode(true)}
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

const CATEGORY_DEFAULTS = {
  intro: 'center', text: 'bullets', data: 'chart', visual: 'cover',
  process: 'timeline', strategy: 'grid', closing: 'cta',
};

const LAYOUT_ICON_OVERRIDES = {
  agenda: 'agenda', 'section-divider': 'divider', 'two-column': 'cols-2',
  'three-column': 'cols-3', blockquote: 'quote', 'presenter-bio': 'team',
  'title-bullets': 'bullets', 'bar-chart': 'chart', 'scatter-plot': 'process',
  waterfall: 'waterfall', dashboard: 'kpi', 'kpi-grid': 'kpi',
  funnel: 'funnel', 'donut-chart': 'stat', 'data-table': 'grid',
  'financial-summary': 'chart', 'full-bleed-image': 'cover',
  'picture-caption': 'bleed-r', 'image-gallery': 'grid', 'video-placeholder': 'cover',
  'icon-grid': 'grid', 'device-mockup': 'bleed-r', 'before-after': 'compare',
  'horizontal-timeline': 'timeline', 'vertical-timeline': 'timeline',
  'chevron-steps': 'process', 'circular-lifecycle': 'venn',
  gantt: 'gantt', 'product-roadmap': 'roadmap', swimlane: 'gantt',
  swot: 'swot', 'competitor-quadrant': 'chart', persona: 'persona',
  'pricing-tiers': 'cols-3', 'org-chart': 'org', 'meet-the-team': 'grid',
  'maturity-model': 'chart', 'gtm-strategy': 'grid',
  'business-model-canvas': 'grid', 'pros-cons': 'compare',
  pyramid: 'funnel', 'hub-spoke': 'hub', venn: 'venn',
  'investment-ask': 'stat', cta: 'cta', 'qa-slide': 'center',
  'resource-links': 'grid', 'contact-thankyou': 'split-lr', appendix: 'bullets',
  'title-center': 'center', 'mission-vision': 'cols-2',
  'value-prop': 'cols-3', 'executive-summary': 'cols-3',
  'problem-statement': 'cover', 'user-flow': 'process',
  'architecture-diagram': 'process', 'big-number': 'stat', 'key-takeaways': 'bullets',
  'text-sidebar': 'bleed-l',
};

function LayoutPreviewIcon({ layout }) {
  const structure = LAYOUT_ICON_OVERRIDES[layout.id]
    ?? layout.preview?.structure
    ?? CATEGORY_DEFAULTS[layout.category]
    ?? 'default';
  const icons = {
    center: (
      <>
        <rect x="4" y="22" width="56" height="8" rx="3" fill="#7c3aed" />
        <rect x="12" y="34" width="40" height="5" rx="2" fill="#c4b5fd" />
        <rect x="18" y="43" width="28" height="4" rx="2" fill="#e9d5ff" />
      </>
    ),
    "split-lr": (
      <>
        <rect x="2" y="2" width="24" height="60" rx="3" fill="#7c3aed" opacity="0.8" />
        <rect x="30" y="8" width="32" height="8" rx="2" fill="#7c3aed" />
        <rect x="30" y="20" width="32" height="5" rx="2" fill="#c4b5fd" />
        <rect x="30" y="29" width="24" height="5" rx="2" fill="#c4b5fd" opacity="0.7" />
        <rect x="30" y="42" width="32" height="8" rx="2" fill="#7c3aed" opacity="0.5" />
        <rect x="30" y="54" width="24" height="5" rx="2" fill="#c4b5fd" opacity="0.5" />
      </>
    ),
    stat: (
      <>
        <rect x="6" y="10" width="52" height="26" rx="3" fill="#7c3aed" />
        <rect x="14" y="42" width="36" height="7" rx="2" fill="#c4b5fd" />
        <rect x="20" y="53" width="24" height="5" rx="2" fill="#e9d5ff" />
      </>
    ),
    "cols-3": (
      <>
        <rect x="2" y="4" width="60" height="7" rx="2" fill="#7c3aed" opacity="0.8" />
        <rect x="2" y="15" width="17" height="36" rx="3" fill="#c4b5fd" opacity="0.8" />
        <rect x="23" y="15" width="18" height="36" rx="3" fill="#c4b5fd" opacity="0.6" />
        <rect x="45" y="15" width="17" height="36" rx="3" fill="#c4b5fd" opacity="0.4" />
      </>
    ),
    "bleed-l": (
      <>
        <rect x="2" y="2" width="26" height="60" rx="3" fill="#94a3b8" opacity="0.5" />
        <rect x="32" y="8" width="30" height="9" rx="2" fill="#7c3aed" />
        <rect x="32" y="21" width="30" height="5" rx="2" fill="#c4b5fd" />
        <rect x="32" y="30" width="22" height="5" rx="2" fill="#c4b5fd" opacity="0.7" />
        <rect x="32" y="46" width="30" height="5" rx="2" fill="#e9d5ff" />
      </>
    ),
    "bleed-r": (
      <>
        <rect x="4" y="8" width="28" height="9" rx="2" fill="#7c3aed" />
        <rect x="4" y="21" width="28" height="5" rx="2" fill="#c4b5fd" />
        <rect x="4" y="30" width="22" height="5" rx="2" fill="#c4b5fd" opacity="0.7" />
        <rect x="4" y="46" width="28" height="5" rx="2" fill="#e9d5ff" />
        <rect x="36" y="2" width="26" height="60" rx="3" fill="#94a3b8" opacity="0.5" />
      </>
    ),
    quote: (
      <>
        <rect x="6" y="8" width="12" height="16" rx="2" fill="#7c3aed" opacity="0.6" />
        <rect x="8" y="26" width="48" height="10" rx="2" fill="#7c3aed" opacity="0.4" />
        <rect x="14" y="40" width="36" height="6" rx="2" fill="#c4b5fd" />
        <rect x="22" y="50" width="20" height="4" rx="2" fill="#e9d5ff" />
      </>
    ),
    grid: (
      <>
        <rect x="2" y="2" width="60" height="9" rx="2" fill="#7c3aed" />
        <rect x="2" y="15" width="28" height="21" rx="3" fill="#c4b5fd" opacity="0.7" />
        <rect x="34" y="15" width="28" height="21" rx="3" fill="#c4b5fd" opacity="0.7" />
        <rect x="2" y="40" width="28" height="21" rx="3" fill="#e9d5ff" />
        <rect x="34" y="40" width="28" height="21" rx="3" fill="#e9d5ff" />
      </>
    ),
    timeline: (
      <>
        <rect x="4" y="30" width="56" height="4" rx="2" fill="#c4b5fd" />
        <rect x="10" y="12" width="10" height="16" rx="2" fill="#7c3aed" />
        <circle cx="15" cy="32" r="4" fill="#7c3aed" />
        <rect x="27" y="36" width="10" height="14" rx="2" fill="#a78bfa" />
        <circle cx="32" cy="32" r="4" fill="#7c3aed" />
        <rect x="44" y="12" width="10" height="16" rx="2" fill="#7c3aed" opacity="0.6" />
        <circle cx="49" cy="32" r="4" fill="#7c3aed" />
      </>
    ),
    agenda: (
      <>
        <rect x="4" y="4" width="36" height="8" rx="2" fill="#7c3aed" />
        <rect x="4" y="18" width="8" height="8" rx="2" fill="#7c3aed" opacity="0.8" />
        <rect x="16" y="20" width="44" height="4" rx="2" fill="#c4b5fd" />
        <rect x="4" y="30" width="8" height="8" rx="2" fill="#7c3aed" opacity="0.7" />
        <rect x="16" y="32" width="40" height="4" rx="2" fill="#c4b5fd" opacity="0.8" />
        <rect x="4" y="42" width="8" height="8" rx="2" fill="#7c3aed" opacity="0.6" />
        <rect x="16" y="44" width="44" height="4" rx="2" fill="#c4b5fd" opacity="0.7" />
        <rect x="4" y="54" width="8" height="8" rx="2" fill="#7c3aed" opacity="0.5" />
        <rect x="16" y="56" width="36" height="4" rx="2" fill="#c4b5fd" opacity="0.6" />
      </>
    ),
    divider: (
      <>
        <rect x="2" y="2" width="60" height="60" rx="3" fill="#0f172a" />
        <rect x="6" y="28" width="12" height="4" rx="2" fill="#7c3aed" />
        <rect x="6" y="36" width="50" height="10" rx="2" fill="#ffffff" opacity="0.9" />
        <rect x="6" y="50" width="32" height="5" rx="2" fill="#94a3b8" opacity="0.6" />
      </>
    ),
    "cols-2": (
      <>
        <rect x="2" y="2" width="60" height="8" rx="2" fill="#7c3aed" />
        <rect x="2" y="14" width="28" height="46" rx="3" fill="#c4b5fd" opacity="0.5" />
        <rect x="34" y="14" width="28" height="46" rx="3" fill="#c4b5fd" opacity="0.3" />
      </>
    ),
    compare: (
      <>
        <rect x="2" y="4" width="60" height="7" rx="2" fill="#1e293b" opacity="0.6" />
        <rect x="2" y="15" width="28" height="44" rx="3" fill="#fca5a5" opacity="0.7" />
        <rect x="34" y="15" width="28" height="44" rx="3" fill="#86efac" opacity="0.7" />
        <rect x="26" y="34" width="12" height="12" rx="6" fill="#1e293b" opacity="0.7" />
      </>
    ),
    process: (
      <>
        <rect x="2" y="22" width="12" height="28" rx="3" fill="#7c3aed" />
        <rect x="17" y="16" width="12" height="34" rx="3" fill="#a78bfa" />
        <rect x="32" y="28" width="12" height="22" rx="3" fill="#c4b5fd" />
        <rect x="47" y="10" width="12" height="40" rx="3" fill="#7c3aed" />
        <rect x="2" y="52" width="57" height="3" rx="2" fill="#e2e8f0" />
      </>
    ),
    cover: (
      <>
        <rect x="2" y="2" width="60" height="60" rx="3" fill="#0f172a" />
        <rect x="2" y="2" width="60" height="60" rx="3" fill="#7c3aed" opacity="0.2" />
        <rect x="6" y="22" width="50" height="12" rx="3" fill="#ffffff" opacity="0.9" />
        <rect x="6" y="38" width="30" height="6" rx="2" fill="#94a3b8" opacity="0.7" />
        <rect x="6" y="48" width="20" height="4" rx="2" fill="#64748b" opacity="0.5" />
      </>
    ),
    cta: (
      <>
        <rect x="4" y="12" width="56" height="12" rx="3" fill="#7c3aed" opacity="0.8" />
        <rect x="10" y="28" width="44" height="7" rx="2" fill="#c4b5fd" opacity="0.6" />
        <rect x="10" y="42" width="18" height="10" rx="5" fill="#7c3aed" />
        <rect x="32" y="42" width="18" height="10" rx="5" fill="none" stroke="#7c3aed" strokeWidth="2" />
      </>
    ),
    team: (
      <>
        <circle cx="20" cy="32" r="18" fill="#e2e8f0" />
        <rect x="42" y="10" width="18" height="10" rx="2" fill="#7c3aed" opacity="0.8" />
        <rect x="42" y="24" width="18" height="6" rx="2" fill="#c4b5fd" />
        <rect x="42" y="34" width="18" height="5" rx="2" fill="#e2e8f0" />
        <rect x="42" y="43" width="18" height="5" rx="2" fill="#e2e8f0" />
        <rect x="42" y="52" width="12" height="5" rx="2" fill="#e2e8f0" />
      </>
    ),
    bullets: (
      <>
        <rect x="4" y="4" width="48" height="8" rx="2" fill="#7c3aed" />
        <rect x="4" y="16" width="56" height="2" rx="1" fill="#e2e8f0" />
        {[22, 32, 42, 52].map((y, i) => (
          <g key={i}>
            <rect x="4" y={y + 2} width="5" height="5" rx="2.5" fill="#7c3aed" opacity={0.9 - i * 0.15} />
            <rect x="12" y={y} width="48" height="7" rx="2" fill="#94a3b8" opacity={0.5 - i * 0.05} />
          </g>
        ))}
      </>
    ),
    chart: (
      <>
        <rect x="2" y="50" width="60" height="2" rx="1" fill="#e2e8f0" />
        <rect x="5"  y="28" width="8" height="24" rx="2" fill="#c4b5fd" />
        <rect x="16" y="18" width="8" height="34" rx="2" fill="#c4b5fd" />
        <rect x="27" y="34" width="8" height="18" rx="2" fill="#c4b5fd" />
        <rect x="38" y="10" width="8" height="42" rx="2" fill="#7c3aed" />
        <rect x="49" y="22" width="8" height="30" rx="2" fill="#c4b5fd" />
      </>
    ),
    funnel: (
      <>
        <rect x="4" y="8" width="56" height="11" rx="3" fill="#0f172a" />
        <rect x="10" y="22" width="44" height="10" rx="3" fill="#4f46e5" />
        <rect x="16" y="35" width="32" height="10" rx="3" fill="#7c3aed" />
        <rect x="22" y="48" width="20" height="10" rx="3" fill="#c4b5fd" />
      </>
    ),
    kpi: (
      <>
        <rect x="2" y="2" width="27" height="27" rx="4" fill="#7c3aed" opacity="0.15" stroke="#7c3aed" strokeWidth="1.5" />
        <rect x="35" y="2" width="27" height="27" rx="4" fill="#0891b2" opacity="0.15" stroke="#0891b2" strokeWidth="1.5" />
        <rect x="2" y="35" width="27" height="27" rx="4" fill="#10b981" opacity="0.15" stroke="#10b981" strokeWidth="1.5" />
        <rect x="35" y="35" width="27" height="27" rx="4" fill="#f59e0b" opacity="0.15" stroke="#f59e0b" strokeWidth="1.5" />
        <rect x="6" y="14" width="18" height="8" rx="2" fill="#7c3aed" />
        <rect x="39" y="14" width="18" height="8" rx="2" fill="#0891b2" />
        <rect x="6" y="47" width="18" height="8" rx="2" fill="#10b981" />
        <rect x="39" y="47" width="18" height="8" rx="2" fill="#f59e0b" />
      </>
    ),
    swot: (
      <>
        <rect x="2" y="2" width="28" height="28" rx="3" fill="#10b981" opacity="0.25" />
        <rect x="34" y="2" width="28" height="28" rx="3" fill="#f59e0b" opacity="0.25" />
        <rect x="2" y="34" width="28" height="28" rx="3" fill="#0891b2" opacity="0.25" />
        <rect x="34" y="34" width="28" height="28" rx="3" fill="#ef4444" opacity="0.25" />
        <rect x="5" y="8" width="22" height="5" rx="2" fill="#10b981" opacity="0.8" />
        <rect x="37" y="8" width="22" height="5" rx="2" fill="#f59e0b" opacity="0.8" />
        <rect x="5" y="40" width="22" height="5" rx="2" fill="#0891b2" opacity="0.8" />
        <rect x="37" y="40" width="22" height="5" rx="2" fill="#ef4444" opacity="0.8" />
      </>
    ),
    venn: (
      <>
        <circle cx="22" cy="34" r="20" fill="#7c3aed" opacity="0.45" />
        <circle cx="42" cy="34" r="20" fill="#0891b2" opacity="0.45" />
        <circle cx="32" cy="22" r="20" fill="#10b981" opacity="0.45" />
      </>
    ),
    org: (
      <>
        <rect x="22" y="4" width="20" height="12" rx="3" fill="#0f172a" />
        <rect x="31" y="16" width="2" height="8" rx="1" fill="#e2e8f0" />
        <rect x="8" y="24" width="20" height="11" rx="3" fill="#7c3aed" />
        <rect x="36" y="24" width="20" height="11" rx="3" fill="#7c3aed" />
        <rect x="8" y="47" width="14" height="10" rx="3" fill="#c4b5fd" opacity="0.7" />
        <rect x="25" y="47" width="14" height="10" rx="3" fill="#c4b5fd" opacity="0.7" />
        <rect x="42" y="47" width="14" height="10" rx="3" fill="#c4b5fd" opacity="0.7" />
      </>
    ),
    persona: (
      <>
        <rect x="2" y="2" width="20" height="60" rx="3" fill="#0f172a" />
        <circle cx="12" cy="20" r="8" fill="#1e3a5f" />
        <rect x="4" y="36" width="16" height="5" rx="2" fill="#7c3aed" opacity="0.8" />
        <rect x="4" y="44" width="16" height="4" rx="2" fill="#475569" />
        <rect x="26" y="6" width="36" height="8" rx="2" fill="#7c3aed" />
        <rect x="26" y="18" width="36" height="4" rx="2" fill="#c4b5fd" opacity="0.7" />
        <rect x="26" y="26" width="28" height="4" rx="2" fill="#c4b5fd" opacity="0.5" />
        <rect x="26" y="38" width="36" height="8" rx="2" fill="#ef4444" opacity="0.5" />
        <rect x="26" y="50" width="28" height="4" rx="2" fill="#fca5a5" opacity="0.5" />
      </>
    ),
    gantt: (
      <>
        <rect x="2" y="2" width="60" height="9" rx="2" fill="#0f172a" />
        <rect x="2" y="14" width="60" height="11" rx="0" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="1" />
        <rect x="4" y="17" width="30" height="5" rx="2" fill="#7c3aed" />
        <rect x="2" y="27" width="60" height="11" rx="0" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1" />
        <rect x="18" y="30" width="36" height="5" rx="2" fill="#0891b2" />
        <rect x="2" y="40" width="60" height="11" rx="0" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="1" />
        <rect x="30" y="43" width="24" height="5" rx="2" fill="#10b981" />
        <rect x="2" y="53" width="60" height="9" rx="0" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1" />
        <rect x="42" y="56" width="16" height="4" rx="2" fill="#f59e0b" />
      </>
    ),
    hub: (
      <>
        <circle cx="32" cy="32" r="10" fill="#7c3aed" />
        <circle cx="12" cy="14" r="7" fill="#f1f5f9" stroke="#7c3aed" strokeWidth="1.5" />
        <circle cx="52" cy="14" r="7" fill="#f1f5f9" stroke="#7c3aed" strokeWidth="1.5" />
        <circle cx="12" cy="50" r="7" fill="#f1f5f9" stroke="#7c3aed" strokeWidth="1.5" />
        <circle cx="52" cy="50" r="7" fill="#f1f5f9" stroke="#7c3aed" strokeWidth="1.5" />
        <line x1="32" y1="32" x2="12" y2="14" stroke="#e2e8f0" strokeWidth="2" />
        <line x1="32" y1="32" x2="52" y2="14" stroke="#e2e8f0" strokeWidth="2" />
        <line x1="32" y1="32" x2="12" y2="50" stroke="#e2e8f0" strokeWidth="2" />
        <line x1="32" y1="32" x2="52" y2="50" stroke="#e2e8f0" strokeWidth="2" />
      </>
    ),
    waterfall: (
      <>
        <rect x="2" y="52" width="60" height="2" rx="1" fill="#e2e8f0" />
        <rect x="4" y="22" width="8" height="30" rx="2" fill="#0f172a" />
        <rect x="15" y="10" width="8" height="18" rx="2" fill="#10b981" />
        <rect x="26" y="18" width="8" height="10" rx="2" fill="#10b981" />
        <rect x="37" y="26" width="8" height="8" rx="2" fill="#ef4444" />
        <rect x="48" y="14" width="8" height="36" rx="2" fill="#7c3aed" />
      </>
    ),
    roadmap: (
      <>
        <rect x="2" y="2" width="60" height="9" rx="2" fill="#0f172a" />
        <rect x="2" y="14" width="14" height="9" rx="2" fill="#7c3aed" opacity="0.9" />
        <rect x="18" y="14" width="14" height="9" rx="2" fill="#7c3aed" opacity="0.7" />
        <rect x="34" y="14" width="14" height="9" rx="2" fill="#7c3aed" opacity="0.5" />
        <rect x="50" y="14" width="12" height="9" rx="2" fill="#7c3aed" opacity="0.3" />
        <rect x="2" y="26" width="10" height="9" rx="2" fill="#0891b2" opacity="0.9" />
        <rect x="14" y="26" width="22" height="9" rx="2" fill="#0891b2" opacity="0.7" />
        <rect x="38" y="26" width="16" height="9" rx="2" fill="#0891b2" opacity="0.5" />
        <rect x="2" y="38" width="18" height="9" rx="2" fill="#10b981" opacity="0.9" />
        <rect x="22" y="38" width="12" height="9" rx="2" fill="#10b981" opacity="0.7" />
        <rect x="36" y="38" width="26" height="9" rx="2" fill="#10b981" opacity="0.5" />
      </>
    ),
    default: (
      <rect x="4" y="4" width="56" height="56" rx="4" fill="#e2e8f0" />
    ),
  };

  return (
    <svg
      width="64"
      height="64"
      viewBox="0 0 64 64"
      className="flex-shrink-0 bg-gray-50 rounded-lg w-full"
      style={{ height: 56 }}
    >
      {icons[structure] ?? icons.default}
    </svg>
  );
}
