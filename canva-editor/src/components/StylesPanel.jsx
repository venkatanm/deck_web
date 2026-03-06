import { useState } from 'react';
import { Lock } from 'lucide-react';
import useEditorStore from '../store/useEditorStore';
import { STYLE_DEFINITIONS } from '../data/styleDefinitions';
import { LAYOUT_DEFINITIONS } from '../data/layoutDefinitions';
import { useToast } from './Toast';

// Returns true when the palette tone is incompatible with the active layout tone.
function isPaletteIncompatible(paletteTone, layoutTone) {
  if (!layoutTone || layoutTone === 'any') return false;
  if (!paletteTone) return false;
  return paletteTone !== layoutTone;
}

export default function StylesPanel() {
  const pages = useEditorStore((s) => s.pages);
  const currentPageId = useEditorStore((s) => s.currentPageId);
  const patchAllPages = useEditorStore((s) => s.patchAllPages);
  const updatePage = useEditorStore((s) => s.updatePage);
  const canvasSize = useEditorStore((s) => s.canvasSize);
  const setCanvasSize = useEditorStore((s) => s.setCanvasSize);
  const _snapshot = useEditorStore((s) => s._snapshot);
  const toast = useToast();

  const [activeTab, setActiveTab] = useState('palettes');
  // Default: apply to current slide only
  const [applyAll, setApplyAll] = useState(false);

  // Determine active layout's tone for compatibility hints
  const currentPage = pages?.find((p) => p.id === currentPageId);
  const appliedLayoutId = currentPage?.appliedLayoutId ?? null;
  const activeLayout = appliedLayoutId
    ? LAYOUT_DEFINITIONS.find((l) => l.id === appliedLayoutId)
    : null;
  const layoutTone = activeLayout?.tone ?? null;

  const applyPalette = (palette) => {
    _snapshot?.(true);
    const { colors } = palette;
    const { width: cw } = canvasSize;

    const coloriseElements = (elements) =>
      elements.map((el) => {
        if (el.type === 'rect' || el.type === 'ellipse' || el.type === 'triangle' || el.type === 'star' || el.type === 'polygon') {
          if (el.x <= 20 && el.y <= 20 && el.width >= cw * 0.7) return { ...el, fill: colors.bg };
          if (el.width < cw * 0.25 || el.height < 60) return { ...el, fill: colors.primary };
          return { ...el, fill: colors.secondary };
        }
        if (el.type === 'text') {
          const fs = el.fontSize || 16;
          if (fs >= 36) return { ...el, fill: colors.text };
          if (fs >= 22) return { ...el, fill: colors.primary };
          return { ...el, fill: colors.subtle };
        }
        if (el.type === 'line' || el.type === 'arrow') return { ...el, stroke: colors.primary };
        return el;
      });

    if (applyAll) {
      setCanvasSize({ ...canvasSize, backgroundColor: colors.bg });
      patchAllPages((pages) =>
        pages.map((page) => ({
          ...page,
          backgroundColor: colors.bg,
          elements: coloriseElements(page.elements),
        }))
      );
      toast(`"${palette.name}" applied to all slides!`, 'success');
    } else {
      updatePage(currentPageId, {
        backgroundColor: colors.bg,
        elements: coloriseElements(currentPage?.elements || []),
      });
      toast(`"${palette.name}" applied to this slide!`, 'success');
    }
  };

  const applyFontPairing = (pairing) => {
    _snapshot?.(true);

    const fontiseElements = (elements) =>
      elements.map((el) => {
        if (el.type !== 'text') return el;
        const isHeading = (el.fontSize || 16) >= 28;
        const font = isHeading ? pairing.heading : pairing.body;
        const existing = el.fontStyle || '';
        return {
          ...el,
          fontFamily: font.family,
          fontStyle:
            (font.weight >= 600 ? 'bold' : 'normal') +
            (existing.includes('italic') ? ' italic' : ''),
        };
      });

    if (applyAll) {
      patchAllPages((pages) =>
        pages.map((page) => ({
          ...page,
          elements: fontiseElements(page.elements),
        }))
      );
      toast(`"${pairing.name}" fonts applied to all slides!`, 'success');
    } else {
      updatePage(currentPageId, {
        elements: fontiseElements(currentPage?.elements || []),
      });
      toast(`"${pairing.name}" fonts applied to this slide!`, 'success');
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Tabs */}
      <div className="bg-gray-50 rounded-xl p-1 flex gap-1">
        {['palettes', 'fonts'].map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`flex-1 text-xs py-1.5 rounded-lg font-medium capitalize transition-colors ${
              activeTab === tab ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-500'
            }`}
          >
            {tab === 'palettes' ? 'Color Palettes' : 'Font Pairings'}
          </button>
        ))}
      </div>

      {/* Scope toggle */}
      <div className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2">
        <span className="text-xs text-gray-600 font-medium">Apply to</span>
        <div className="flex items-center gap-1 bg-white rounded-lg p-0.5 border border-gray-200">
          <button
            type="button"
            onClick={() => setApplyAll(false)}
            className={`text-xs px-2.5 py-1 rounded-md font-medium transition-colors ${
              !applyAll ? 'bg-purple-600 text-white' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            This slide
          </button>
          <button
            type="button"
            onClick={() => setApplyAll(true)}
            className={`text-xs px-2.5 py-1 rounded-md font-medium transition-colors ${
              applyAll ? 'bg-purple-600 text-white' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            All slides
          </button>
        </div>
      </div>

      {/* Compatibility hint when a layout is active and has a tone */}
      {activeLayout && layoutTone && layoutTone !== 'any' && (
        <div className="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
          <Lock size={12} className="text-amber-500 mt-0.5 flex-shrink-0" />
          <p className="text-[11px] text-amber-700 leading-relaxed">
            <strong>{activeLayout.name}</strong> is a <strong>{layoutTone}</strong> layout. Dimmed palettes may clash — you can still apply them.
          </p>
        </div>
      )}

      {activeTab === 'palettes' && (
        <div className="flex flex-col gap-2">
          {STYLE_DEFINITIONS.palettes.map((palette) => {
            const incompatible = isPaletteIncompatible(palette.tone, layoutTone);
            return (
              <button
                key={palette.id}
                type="button"
                onClick={() => applyPalette(palette)}
                title={
                  incompatible
                    ? `Not ideal for "${activeLayout?.name}" — best with a ${layoutTone} palette`
                    : palette.name
                }
                className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all group text-left ${
                  incompatible
                    ? 'border-gray-100 bg-white opacity-40 hover:opacity-70 hover:border-gray-300'
                    : 'border-gray-200 hover:border-purple-400 hover:bg-purple-50'
                }`}
              >
                <div className="flex rounded-lg overflow-hidden flex-shrink-0 shadow-sm">
                  {palette.preview.map((color, i) => (
                    <div key={i} className="w-8 h-10" style={{ background: color }} />
                  ))}
                </div>
                <span className={`text-xs font-medium flex-1 ${incompatible ? 'text-gray-400' : 'text-gray-700 group-hover:text-purple-700'}`}>
                  {palette.name}
                </span>
                {incompatible && (
                  <Lock size={11} className="text-gray-300 flex-shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      )}

      {activeTab === 'fonts' && (
        <div className="flex flex-col gap-3">
          <p className="text-xs text-gray-500">
            Large text gets the heading font, smaller text gets the body font.
          </p>
          {STYLE_DEFINITIONS.fontPairings.map((pairing) => (
            <button
              key={pairing.id}
              type="button"
              onClick={() => applyFontPairing(pairing)}
              className="flex flex-col gap-1 p-3 rounded-xl border border-gray-200 hover:border-purple-400 hover:bg-purple-50 transition-all text-left group"
            >
              <span
                className="text-xl text-gray-900 group-hover:text-purple-800 leading-tight"
                style={{
                  fontFamily: pairing.heading.family,
                  fontWeight: pairing.heading.weight,
                }}
              >
                {pairing.name}
              </span>
              <span
                className="text-xs text-gray-500"
                style={{ fontFamily: pairing.body.family }}
              >
                {pairing.label}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
