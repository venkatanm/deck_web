// Layouts categorize elements and rearrange them
export const LAYOUT_DEFINITIONS = [
  {
    id: 'title-center',
    name: 'Title Center',
    description: 'Centered title with subtitle below',
    preview: { structure: 'center' },
    apply: (elements, canvasSize) => {
      const { width: W, height: H } = canvasSize;
      const texts = elements.filter((e) => e.type === 'text');
      const shapes = elements.filter((e) => e.type !== 'text');
      const [title, subtitle, ...rest] = texts;
      return [
        ...shapes,
        title && { ...title, x: W * 0.1, y: H * 0.3, width: W * 0.8, align: 'center', fontSize: Math.max(title.fontSize || 36, 48) },
        subtitle && { ...subtitle, x: W * 0.15, y: H * 0.55, width: W * 0.7, align: 'center', fontSize: 20 },
        ...rest.map((t, i) => ({ ...t, x: W * 0.1, y: H * 0.7 + i * 30, width: W * 0.8, align: 'center' })),
      ].filter(Boolean);
    },
  },
  {
    id: 'title-left-content-right',
    name: 'Left Title, Right Content',
    preview: { structure: 'split-lr' },
    apply: (elements, canvasSize) => {
      const { width: W, height: H } = canvasSize;
      const texts = elements.filter((e) => e.type === 'text');
      const shapes = elements.filter((e) => e.type !== 'text');
      const [title, ...body] = texts;
      return [
        title && { ...title, x: W * 0.04, y: H * 0.15, width: W * 0.4, fontSize: Math.max(title.fontSize || 36, 40), align: 'left' },
        ...body.map((t, i) => ({ ...t, x: W * 0.5, y: H * 0.1 + i * (H * 0.18), width: W * 0.46 })),
        ...shapes.map((s) => ({ ...s, x: W * 0.5, y: H * 0.1, width: W * 0.46, height: H * 0.7 })),
      ].filter(Boolean);
    },
  },
  {
    id: 'big-stat',
    name: 'Big Stat',
    preview: { structure: 'stat' },
    apply: (elements, canvasSize) => {
      const { width: W, height: H } = canvasSize;
      const texts = elements.filter((e) => e.type === 'text');
      const shapes = elements.filter((e) => e.type !== 'text');
      const [headline, ...rest] = texts;
      return [
        ...shapes,
        headline && { ...headline, x: W * 0.05, y: H * 0.2, width: W * 0.9, fontSize: 96, align: 'center', fontStyle: 'bold' },
        ...rest.map((t, i) => ({ ...t, x: W * 0.1, y: H * 0.65 + i * 36, width: W * 0.8, align: 'center', fontSize: 18 })),
      ].filter(Boolean);
    },
  },
  {
    id: 'three-columns',
    name: 'Three Columns',
    preview: { structure: 'cols-3' },
    apply: (elements, canvasSize) => {
      const { width: W, height: H } = canvasSize;
      const texts = elements.filter((e) => e.type === 'text');
      const shapes = elements.filter((e) => e.type !== 'text');
      const colW = W * 0.28;
      const gap = W * 0.06;
      return [
        ...shapes,
        ...texts.map((t, i) => ({
          ...t,
          x: gap + (i % 3) * (colW + gap),
          y: i < 3 ? H * 0.15 : H * 0.45 + Math.floor(i / 3) * 60,
          width: colW,
        })),
      ].filter(Boolean);
    },
  },
  {
    id: 'full-bleed-left',
    name: 'Full Bleed Left',
    preview: { structure: 'bleed-l' },
    apply: (elements, canvasSize) => {
      const { width: W, height: H } = canvasSize;
      const texts = elements.filter((e) => e.type === 'text');
      const shapes = elements.filter((e) => e.type !== 'text');
      return [
        ...shapes.map((s) => ({ ...s, x: 0, y: 0, width: W * 0.5, height: H })),
        ...texts.map((t, i) => ({ ...t, x: W * 0.54, y: H * 0.15 + i * (H * 0.2), width: W * 0.42 })),
      ].filter(Boolean);
    },
  },
  {
    id: 'quote-style',
    name: 'Quote',
    preview: { structure: 'quote' },
    apply: (elements, canvasSize) => {
      const { width: W, height: H } = canvasSize;
      const texts = elements.filter((e) => e.type === 'text');
      const shapes = elements.filter((e) => e.type !== 'text');
      const [quote, attribution, ...rest] = texts;
      return [
        ...shapes,
        quote && { ...quote, x: W * 0.1, y: H * 0.2, width: W * 0.8, fontSize: 32, align: 'center', fontStyle: 'italic' },
        attribution && { ...attribution, x: W * 0.1, y: H * 0.68, width: W * 0.8, align: 'center', fontSize: 16 },
        ...rest.map((t, i) => ({ ...t, x: W * 0.1, y: H * 0.78 + i * 24, width: W * 0.8, align: 'center' })),
      ].filter(Boolean);
    },
  },
  {
    id: 'title-top-grid',
    name: 'Title + Grid',
    preview: { structure: 'grid' },
    apply: (elements, canvasSize) => {
      const { width: W, height: H } = canvasSize;
      const texts = elements.filter((e) => e.type === 'text');
      const shapes = elements.filter((e) => e.type !== 'text');
      const [title, ...body] = texts;
      const cols = 2;
      const cellW = W * 0.44;
      const cellH = H * 0.3;
      return [
        title && { ...title, x: W * 0.05, y: H * 0.04, width: W * 0.9, fontSize: 32, align: 'center' },
        ...body.map((t, i) => ({
          ...t,
          x: W * 0.04 + (i % cols) * (cellW + W * 0.08),
          y: H * 0.25 + Math.floor(i / cols) * (cellH + H * 0.04),
          width: cellW,
        })),
        ...shapes,
      ].filter(Boolean);
    },
  },
  {
    id: 'timeline-horizontal',
    name: 'Horizontal Timeline',
    preview: { structure: 'timeline' },
    apply: (elements, canvasSize) => {
      const { width: W, height: H } = canvasSize;
      const texts = elements.filter((e) => e.type === 'text');
      const shapes = elements.filter((e) => e.type !== 'text');
      const n = Math.max(texts.length, 1);
      const step = W / (n + 1);
      return [
        ...shapes,
        ...texts.map((t, i) => ({
          ...t,
          x: step * (i + 1) - 80,
          y: i % 2 === 0 ? H * 0.15 : H * 0.55,
          width: 160,
          align: 'center',
          fontSize: Math.min(t.fontSize || 18, 16),
        })),
      ].filter(Boolean);
    },
  },
];
