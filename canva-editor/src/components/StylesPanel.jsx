import { useState } from 'react';
import useEditorStore from '../store/useEditorStore';
import { STYLE_DEFINITIONS } from '../data/styleDefinitions';
import { useToast } from './Toast';

export default function StylesPanel() {
  const pages = useEditorStore((s) => s.pages);
  const setPages = useEditorStore((s) => s.setPages);
  const canvasSize = useEditorStore((s) => s.canvasSize);
  const setCanvasSize = useEditorStore((s) => s.setCanvasSize);
  const _snapshot = useEditorStore((s) => s._snapshot);
  const toast = useToast();

  const [activeTab, setActiveTab] = useState('palettes');

  const applyPalette = (palette) => {
    _snapshot?.(true);
    const { colors } = palette;
    const { width: cw, height: ch } = canvasSize;

    setCanvasSize({ ...canvasSize, backgroundColor: colors.bg });

    const newPages = pages.map((page) => ({
      ...page,
      elements: page.elements.map((el) => {
        if (el.type === 'rect') {
          if (el.x <= 10 && el.y <= 10 && el.width >= cw * 0.8) {
            return { ...el, fill: colors.bg };
          }
          if (el.width < cw * 0.3) {
            return { ...el, fill: colors.primary };
          }
          if (el.height < 100) {
            return { ...el, fill: colors.primary };
          }
          return { ...el, fill: colors.secondary, opacity: el.opacity ?? 1 };
        }
        if (el.type === 'text') {
          const fs = el.fontSize || 16;
          if (fs >= 36) return { ...el, fill: colors.text };
          if (fs >= 24) return { ...el, fill: colors.primary };
          return { ...el, fill: colors.subtle };
        }
        if (el.type === 'line') return { ...el, stroke: colors.primary };
        return el;
      }),
    }));
    setPages(newPages);
    toast(`"${palette.name}" palette applied to all slides!`, 'success');
  };

  const applyFontPairing = (pairing) => {
    _snapshot?.(true);
    const newPages = pages.map((page) => ({
      ...page,
      elements: page.elements.map((el) => {
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
      }),
    }));
    setPages(newPages);
    toast(`"${pairing.name}" fonts applied to all slides!`, 'success');
  };

  return (
    <div className="flex flex-col gap-4">
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

      {activeTab === 'palettes' && (
        <div className="flex flex-col gap-2">
          <p className="text-xs text-gray-500">
            Applies to all slides. Background, text, and accent colors will update.
          </p>
          {STYLE_DEFINITIONS.palettes.map((palette) => (
            <button
              key={palette.id}
              type="button"
              onClick={() => applyPalette(palette)}
              className="flex items-center gap-3 p-2.5 rounded-xl border border-gray-200 hover:border-purple-400 hover:bg-purple-50 transition-all group text-left"
            >
              <div className="flex rounded-lg overflow-hidden flex-shrink-0 shadow-sm">
                {palette.preview.map((color, i) => (
                  <div key={i} className="w-8 h-10" style={{ background: color }} />
                ))}
              </div>
              <span className="text-xs font-medium text-gray-700 group-hover:text-purple-700">
                {palette.name}
              </span>
            </button>
          ))}
        </div>
      )}

      {activeTab === 'fonts' && (
        <div className="flex flex-col gap-3">
          <p className="text-xs text-gray-500">
            Applies to all slides. Large text gets the heading font, body text gets
            the body font.
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
