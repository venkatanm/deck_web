import { v4 as uuidv4 } from 'uuid';

// ── Helpers ────────────────────────────────────────────────────────────────────
function makeText(o) {
  return {
    id: uuidv4(), type: 'text', rotation: 0, opacity: 1,
    fontFamily: 'Inter', fontStyle: 'normal', align: 'left',
    fill: '#111111', fontSize: 18, text: 'Text',
    width: 200, height: 300, x: 0, y: 0,
    ...o,
  };
}

function makeRect(o) {
  return {
    id: uuidv4(), type: 'rect', rotation: 0, opacity: 1,
    fill: '#111111', stroke: null, strokeWidth: 0, cornerRadius: 0,
    x: 0, y: 0, width: 100, height: 100,
    ...o,
  };
}

function makeEllipse(o) {
  return {
    id: uuidv4(), type: 'circle', rotation: 0, opacity: 1,
    fill: '#111111', stroke: null, strokeWidth: 0,
    x: 0, y: 0, width: 80, height: 80,
    ...o,
  };
}

// Categorize elements by role for layout application
function categorize(elements) {
  const texts = elements.filter((e) => e.type === 'text');
  const images = elements.filter((e) => e.type === 'image');
  const shapes = elements.filter((e) => e.type !== 'text' && e.type !== 'image');
  const sortedTexts = [...texts].sort((a, b) => (b.fontSize || 16) - (a.fontSize || 16));
  return { sortedTexts, images, shapes };
}

// Generic fallback apply — title top, body stacked below
function applyGeneric(elements, canvasSize) {
  const { width: W, height: H } = canvasSize;
  const { sortedTexts, images, shapes } = categorize(elements);
  const [title, ...body] = sortedTexts;
  return [
    ...shapes,
    title && { ...title, x: W * 0.05, y: H * 0.06, width: W * 0.9, fontSize: Math.max(title.fontSize || 36, 36), fontStyle: 'bold', align: 'left' },
    ...body.map((t, i) => ({ ...t, x: W * 0.05, y: H * 0.22 + i * (H * 0.13), width: W * 0.88, fontSize: 18 })),
    ...images.map((img, i) => ({ ...img, x: W * 0.5 + i * 10, y: H * 0.22, width: W * 0.44, height: H * 0.65 })),
  ].filter(Boolean);
}

// Suggest layouts based on current slide elements
export function suggestLayouts(elements) {
  if (!elements || elements.length === 0) return [];
  const hasImage = elements.some((e) => e.type === 'image');
  const textCount = elements.filter((e) => e.type === 'text').length;
  const suggested = [];
  if (hasImage && textCount >= 1) suggested.push('image-right', 'image-left');
  if (textCount >= 4) suggested.push('title-bullets');
  if (textCount === 2) suggested.push('two-column', 'before-after');
  if (textCount === 1) suggested.push('title-center', 'big-number');
  return [...new Set(suggested)].slice(0, 4);
}

export const LAYOUT_DEFINITIONS = [

  // ═══════════════ TITLE SLIDES ═══════════════

  {
    id: 'title-center', name: 'Title Slide', category: 'intro',
    tone: 'light', tags: ['opener', 'title', 'minimal'],
    generate({ width: W, height: H }) {
      return [
        makeText({ text: 'Title Page', x: W * 0.08, y: H * 0.36, width: W * 0.84, fontSize: 72, fontStyle: 'bold', align: 'left', fill: '#111111' }),
        makeText({ text: 'Write a date or subtitle', x: W * 0.08, y: H * 0.62, width: W * 0.7, fontSize: 22, align: 'left', fill: '#111111' }),
      ];
    },
    apply: applyGeneric,
  },

  {
    id: 'title-center-centered', name: 'Title Centered', category: 'intro',
    tone: 'light', tags: ['opener', 'title', 'minimal'],
    generate({ width: W, height: H }) {
      return [
        makeText({ text: 'Write a pretitle', x: W * 0.25, y: H * 0.18, width: W * 0.5, fontSize: 18, align: 'center', fill: '#111111',
          // pill border effect via surrounding rect handled separately
        }),
        makeRect({ x: W * 0.22, y: H * 0.15, width: W * 0.56, height: H * 0.1, fill: 'transparent', stroke: '#111111', strokeWidth: 2, cornerRadius: 40 }),
        makeText({ text: 'Title Page', x: W * 0.1, y: H * 0.36, width: W * 0.8, fontSize: 80, fontStyle: 'bold', align: 'center', fill: '#111111' }),
        makeText({ text: 'Start inspired with thousands of templates, collaborate with ease, and engage your audience with a memorable presentation.', x: W * 0.12, y: H * 0.64, width: W * 0.76, fontSize: 20, align: 'center', fill: '#111111', fontStyle: 'bold' }),
      ];
    },
    apply: applyGeneric,
  },

  {
    id: 'title-subtitle-below', name: 'Title + Subtitle Below', category: 'intro',
    tone: 'light', tags: ['opener', 'title', 'minimal'],
    generate({ width: W, height: H }) {
      return [
        makeText({ text: 'Title Page', x: W * 0.1, y: H * 0.3, width: W * 0.8, fontSize: 80, fontStyle: 'bold', align: 'center', fill: '#111111' }),
        makeText({ text: 'Write a date or subtitle', x: W * 0.15, y: H * 0.62, width: W * 0.7, fontSize: 22, align: 'center', fill: '#111111', fontStyle: 'bold' }),
      ];
    },
    apply: applyGeneric,
  },

  {
    id: 'section-divider', name: 'Section Divider', category: 'intro',
    tone: 'light', tags: ['minimal', 'opener'],
    generate({ width: W, height: H }) {
      return [
        makeText({ text: 'Add a heading', x: W * 0.06, y: H * 0.18, width: W * 0.55, fontSize: 68, fontStyle: 'bold', align: 'left', fill: '#111111' }),
        makeText({ text: 'Write a subtitle', x: W * 0.06, y: H * 0.56, width: W * 0.5, fontSize: 20, align: 'left', fill: '#111111', fontStyle: 'bold' }),
      ];
    },
    apply: applyGeneric,
  },

  // ═══════════════ AGENDA ═══════════════

  {
    id: 'agenda-list', name: 'Agenda List', category: 'intro',
    tone: 'light', tags: ['list', 'agenda'],
    generate({ width: W, height: H }) {
      const items = ['Agenda point 1', 'Agenda point 2', 'Agenda point 3', 'Agenda point 4', 'Agenda point 5'];
      return [
        makeText({ text: 'Agenda', x: W * 0.04, y: H * 0.06, width: W * 0.35, fontSize: 54, fontStyle: 'bold', fill: '#111111', align: 'left' }),
        ...items.flatMap((item, i) => [
          makeEllipse({ x: W * 0.42, y: H * 0.07 + i * (H * 0.165), width: 44, height: 44, fill: '#111111' }),
          makeText({ text: String(i + 1), x: W * 0.42, y: H * 0.078 + i * (H * 0.165), width: 44, fontSize: 18, fontStyle: 'bold', align: 'center', fill: '#ffffff' }),
          makeRect({ x: W * 0.5, y: H * 0.07 + i * (H * 0.165), width: W * 0.46, height: 44, fill: '#111111', cornerRadius: 4 }),
          makeText({ text: item, x: W * 0.52, y: H * 0.08 + i * (H * 0.165), width: W * 0.42, fontSize: 16, fontStyle: 'bold', fill: '#ffffff', align: 'left' }),
        ]),
      ];
    },
    apply: applyGeneric,
  },

  {
    id: 'agenda-grid', name: 'Agenda Grid', category: 'intro',
    tone: 'light', tags: ['list', 'agenda'],
    generate({ width: W, height: H }) {
      const items = [
        'Agenda point 1', 'Agenda point 2', 'Agenda point 3',
        'Agenda point 4', 'Agenda point 5', 'Agenda point 6',
      ];
      return [
        makeText({ text: 'Agenda', x: W * 0.04, y: H * 0.04, width: W * 0.9, fontSize: 48, fontStyle: 'bold', fill: '#111111', align: 'left' }),
        ...items.flatMap((item, i) => {
          const col = i % 3;
          const row = Math.floor(i / 3);
          const cx = W * 0.04 + col * (W * 0.32);
          const cy = H * 0.2 + row * (H * 0.38);
          return [
            makeRect({ x: cx, y: cy, width: W * 0.29, height: H * 0.34, fill: '#111111', cornerRadius: 14 }),
            makeEllipse({ x: cx + W * 0.02, y: cy + H * 0.03, width: 36, height: 36, fill: '#ffffff' }),
            makeText({ text: String(i + 1), x: cx + W * 0.02, y: cy + H * 0.044, width: 36, fontSize: 14, fontStyle: 'bold', align: 'center', fill: '#111111' }),
            makeText({ text: item, x: cx + W * 0.02, y: cy + H * 0.22, width: W * 0.25, fontSize: 16, fontStyle: 'bold', fill: '#ffffff', align: 'left' }),
          ];
        }),
      ];
    },
    apply: applyGeneric,
  },

  {
    id: 'agenda-3col', name: 'Agenda 3 Items', category: 'intro',
    tone: 'light', tags: ['list', 'agenda'],
    generate({ width: W, height: H }) {
      const items = ['Write your agenda point', 'Write your agenda point', 'Write your agenda point'];
      return [
        makeText({ text: 'Agenda', x: W * 0.1, y: H * 0.06, width: W * 0.8, fontSize: 52, fontStyle: 'bold', fill: '#111111', align: 'center' }),
        ...items.flatMap((item, i) => {
          const cx = W * 0.06 + i * (W * 0.32);
          return [
            makeEllipse({ x: cx + W * 0.08, y: H * 0.28, width: 80, height: 80, fill: '#111111' }),
            makeText({ text: String(i + 1), x: cx + W * 0.08, y: H * 0.306, width: 80, fontSize: 32, fontStyle: 'bold', align: 'center', fill: '#ffffff' }),
            makeText({ text: item, x: cx, y: H * 0.54, width: W * 0.28, fontSize: 22, fontStyle: 'bold', fill: '#111111', align: 'center' }),
          ];
        }),
      ];
    },
    apply: applyGeneric,
  },

  // ═══════════════ TEXT LAYOUTS ═══════════════

  {
    id: 'title-bullets', name: 'Title & Bullets', category: 'text',
    tone: 'light', tags: ['list', 'text-heavy'],
    generate({ width: W, height: H }) {
      const bullets = [
        'Elaborate on what you want to discuss.',
        'Elaborate on what you want to discuss.',
        'Elaborate on what you want to discuss.',
        'Elaborate on what you want to discuss.',
        'Elaborate on what you want to discuss.',
      ];
      return [
        makeText({ text: 'Add a heading', x: W * 0.05, y: H * 0.06, width: W * 0.9, fontSize: 52, fontStyle: 'bold', fill: '#111111' }),
        ...bullets.map((b, i) => makeText({ text: '• ' + b, x: W * 0.05, y: H * 0.3 + i * (H * 0.125), width: W * 0.9, fontSize: 20, fill: '#111111', fontStyle: 'bold' })),
      ];
    },
    apply: applyGeneric,
  },

  {
    id: 'two-column', name: 'Two Column', category: 'text',
    tone: 'light', tags: ['split', 'text-heavy'],
    generate({ width: W, height: H }) {
      return [
        makeText({ text: 'Add a heading', x: W * 0.1, y: H * 0.06, width: W * 0.8, fontSize: 52, fontStyle: 'bold', fill: '#111111', align: 'center' }),
        makeText({ text: 'Present with ease and wow any audience with Canva Presentations. Choose from over a thousand professionally-made templates to fit any objective or topic. Make it your own by customizing it with text and photos.', x: W * 0.04, y: H * 0.32, width: W * 0.44, fontSize: 18, fill: '#111111', fontStyle: 'bold' }),
        makeText({ text: 'Present with ease and wow any audience with Canva Presentations. Choose from over a thousand professionally-made templates to fit any objective or topic. Make it your own by customizing it with text and photos.', x: W * 0.52, y: H * 0.32, width: W * 0.44, fontSize: 18, fill: '#111111', fontStyle: 'bold' }),
      ];
    },
    apply: applyGeneric,
  },

  {
    id: 'title-two-col-body', name: 'Heading + Two Body Columns', category: 'text',
    tone: 'light', tags: ['split', 'text-heavy'],
    generate({ width: W, height: H }) {
      return [
        makeText({ text: 'Add a heading', x: W * 0.05, y: H * 0.08, width: W * 0.9, fontSize: 52, fontStyle: 'bold', fill: '#111111', align: 'left' }),
        makeText({ text: 'Present with ease and wow any audience with Canva Presentations. Choose from over a thousand professionally-made templates to fit any objective or topic. Make it your own by customizing it with text and photos. Apply page animations and transitions to your Canva Presentation to emphasize ideas and make them even more memorable.', x: W * 0.05, y: H * 0.32, width: W * 0.43, fontSize: 18, fill: '#111111', fontStyle: 'bold' }),
        makeText({ text: 'Present with ease and wow any audience with Canva Presentations. Choose from over a thousand professionally-made templates to fit any objective or topic. Make it your own by customizing it with text and photos. Apply page animations and transitions to your Canva Presentation to emphasize ideas and make them even more memorable.', x: W * 0.52, y: H * 0.32, width: W * 0.43, fontSize: 18, fill: '#111111', fontStyle: 'bold' }),
      ];
    },
    apply: applyGeneric,
  },

  {
    id: 'blockquote', name: 'Big Quote', category: 'text',
    tone: 'light', tags: ['quote', 'minimal', 'impact'],
    generate({ width: W, height: H }) {
      return [
        makeText({ text: '\u201c', x: W * 0.05, y: H * 0.02, width: W * 0.15, fontSize: 160, fontStyle: 'bold', fill: '#111111', align: 'left' }),
        makeText({ text: 'The best way to predict the future is to create it.', x: W * 0.08, y: H * 0.22, width: W * 0.84, fontSize: 48, fontStyle: 'bold', fill: '#111111', align: 'left' }),
        makeText({ text: 'Steve Jobs', x: W * 0.08, y: H * 0.76, width: W * 0.6, fontSize: 20, fill: '#111111', fontStyle: 'bold' }),
      ];
    },
    apply: applyGeneric,
  },

  {
    id: 'big-number', name: 'Big Stat', category: 'text',
    tone: 'light', tags: ['data', 'minimal', 'impact'],
    generate({ width: W, height: H }) {
      return [
        makeText({ text: '100%', x: W * 0.05, y: H * 0.14, width: W * 0.9, fontSize: 200, fontStyle: 'bold', align: 'center', fill: '#111111' }),
        makeText({ text: 'Add a description for this statistic', x: W * 0.15, y: H * 0.74, width: W * 0.7, fontSize: 26, align: 'center', fill: '#111111', fontStyle: 'bold' }),
      ];
    },
    apply: applyGeneric,
  },

  // ═══════════════ TWO-TOPIC CARDS ═══════════════

  {
    id: 'two-cards', name: 'Two Topic Cards', category: 'text',
    tone: 'light', tags: ['split', 'cards'],
    generate({ width: W, height: H }) {
      return [
        makeRect({ x: W * 0.04, y: H * 0.1, width: W * 0.44, height: H * 0.8, fill: '#111111', cornerRadius: 14 }),
        makeEllipse({ x: W * 0.155, y: H * 0.16, width: 60, height: 60, fill: '#ffffff' }),
        makeText({ text: '1', x: W * 0.155, y: H * 0.178, width: 60, fontSize: 26, fontStyle: 'bold', align: 'center', fill: '#111111' }),
        makeText({ text: 'Write your first topic or idea', x: W * 0.08, y: H * 0.48, width: W * 0.34, fontSize: 28, fontStyle: 'bold', fill: '#ffffff', align: 'center' }),
        makeRect({ x: W * 0.52, y: H * 0.1, width: W * 0.44, height: H * 0.8, fill: '#111111', cornerRadius: 14 }),
        makeEllipse({ x: W * 0.635, y: H * 0.16, width: 60, height: 60, fill: '#ffffff' }),
        makeText({ text: '2', x: W * 0.635, y: H * 0.178, width: 60, fontSize: 26, fontStyle: 'bold', align: 'center', fill: '#111111' }),
        makeText({ text: 'Write your second topic or idea', x: W * 0.56, y: H * 0.48, width: W * 0.34, fontSize: 28, fontStyle: 'bold', fill: '#ffffff', align: 'center' }),
      ];
    },
    apply: applyGeneric,
  },

  {
    id: 'four-cards', name: 'Four Topic Cards', category: 'text',
    tone: 'light', tags: ['grid', 'cards'],
    generate({ width: W, height: H }) {
      const items = [
        'Write your topic or idea', 'Write your topic or idea',
        'Write your topic or idea', 'Write your topic or idea',
      ];
      return items.flatMap((item, i) => {
        const col = i % 2;
        const row = Math.floor(i / 2);
        const cx = W * 0.04 + col * (W * 0.49);
        const cy = H * 0.06 + row * (H * 0.48);
        return [
          makeRect({ x: cx, y: cy, width: W * 0.45, height: H * 0.44, fill: '#111111', cornerRadius: 12 }),
          makeText({ text: item, x: cx + W * 0.04, y: cy + H * 0.18, width: W * 0.37, fontSize: 24, fontStyle: 'bold', fill: '#ffffff', align: 'center' }),
        ];
      });
    },
    apply: applyGeneric,
  },

  // ═══════════════ IMAGE + TEXT ═══════════════

  {
    id: 'image-right', name: 'Image Right', category: 'visual',
    tone: 'light', tags: ['image', 'split'],
    generate({ width: W, height: H }) {
      return [
        makeRect({ x: 0, y: 0, width: W * 0.5, height: H, fill: '#d0e8f0', cornerRadius: 0 }),
        makeText({ text: 'Add a heading', x: W * 0.54, y: H * 0.2, width: W * 0.42, fontSize: 52, fontStyle: 'bold', fill: '#111111', align: 'left' }),
        makeText({ text: 'Start inspired with thousands of templates, collaborate with ease, and engage your audience with a memorable presentation.', x: W * 0.54, y: H * 0.52, width: W * 0.42, fontSize: 18, fill: '#111111', fontStyle: 'bold' }),
      ];
    },
    apply: applyGeneric,
  },

  {
    id: 'image-left', name: 'Image Left', category: 'visual',
    tone: 'light', tags: ['image', 'split'],
    generate({ width: W, height: H }) {
      return [
        makeText({ text: 'Add a heading', x: W * 0.04, y: H * 0.2, width: W * 0.42, fontSize: 52, fontStyle: 'bold', fill: '#111111', align: 'left' }),
        makeText({ text: 'Start inspired with thousands of templates, collaborate with ease, and engage your audience with a memorable presentation.', x: W * 0.04, y: H * 0.52, width: W * 0.42, fontSize: 18, fill: '#111111', fontStyle: 'bold' }),
        makeRect({ x: W * 0.5, y: 0, width: W * 0.5, height: H, fill: '#d0e8f0', cornerRadius: 0 }),
      ];
    },
    apply: applyGeneric,
  },

  {
    id: 'heading-three-images', name: 'Heading + Three Images', category: 'visual',
    tone: 'light', tags: ['image', 'gallery'],
    generate({ width: W, height: H }) {
      return [
        makeText({ text: 'Add a heading', x: W * 0.1, y: H * 0.04, width: W * 0.8, fontSize: 52, fontStyle: 'bold', fill: '#111111', align: 'center' }),
        makeText({ text: 'Write a subtitle', x: W * 0.2, y: H * 0.18, width: W * 0.6, fontSize: 18, align: 'center', fill: '#111111', fontStyle: 'bold' }),
        makeRect({ x: W * 0.03, y: H * 0.3, width: W * 0.29, height: H * 0.62, fill: '#d0e8f0', cornerRadius: 8 }),
        makeRect({ x: W * 0.355, y: H * 0.3, width: W * 0.29, height: H * 0.62, fill: '#d0e8f0', cornerRadius: 8 }),
        makeRect({ x: W * 0.68, y: H * 0.3, width: W * 0.29, height: H * 0.62, fill: '#d0e8f0', cornerRadius: 8 }),
      ];
    },
    apply: applyGeneric,
  },

  // ═══════════════ VENN DIAGRAM ═══════════════

  {
    id: 'venn', name: 'Venn Diagram', category: 'visual',
    tone: 'light', tags: ['visual', 'split', 'diagram'],
    generate({ width: W, height: H }) {
      const r = H * 0.38;
      return [
        makeEllipse({ x: W * 0.12, y: H * 0.12, width: r * 2, height: r * 2, fill: '#888888', opacity: 0.7 }),
        makeEllipse({ x: W * 0.36, y: H * 0.12, width: r * 2, height: r * 2, fill: '#333333', opacity: 0.8 }),
        makeText({ text: 'Write your first topic or idea', x: W * 0.12, y: H * 0.38, width: r * 1.2, fontSize: 22, fontStyle: 'bold', fill: '#ffffff', align: 'center' }),
        makeText({ text: 'Write your second topic or idea', x: W * 0.5, y: H * 0.38, width: r * 1.2, fontSize: 22, fontStyle: 'bold', fill: '#ffffff', align: 'center' }),
      ];
    },
    apply: applyGeneric,
  },

  // ═══════════════ TIMELINE ═══════════════

  {
    id: 'horizontal-timeline', name: 'Horizontal Timeline', category: 'process',
    tone: 'light', tags: ['timeline', 'process'],
    generate({ width: W, height: H }) {
      const events = [
        { label: 'Write an event or milestone', body: 'Briefly elaborate on what you want to discuss.' },
        { label: 'Write an event or milestone', body: 'Briefly elaborate on what you want to discuss.' },
        { label: 'Write an event or milestone', body: 'Briefly elaborate on what you want to discuss.' },
        { label: 'Write an event or milestone', body: 'Briefly elaborate on what you want to discuss.' },
      ];
      const left = W * 0.04;
      const right = W * 0.96;
      const lineY = H * 0.42;
      const spacing = (right - left) / (events.length - 1);
      return [
        makeText({ text: 'Timeline', x: W * 0.04, y: H * 0.06, width: W * 0.9, fontSize: 52, fontStyle: 'bold', fill: '#111111', align: 'left' }),
        makeRect({ x: left, y: lineY - 1, width: right - left, height: 3, fill: '#111111', cornerRadius: 2 }),
        ...events.flatMap((e, i) => {
          const x = left + i * spacing;
          return [
            makeEllipse({ x: x - 14, y: lineY - 14, width: 28, height: 28, fill: '#111111' }),
            makeText({ text: e.label, x: x - W * 0.1, y: lineY + H * 0.09, width: W * 0.2, fontSize: 18, fontStyle: 'bold', fill: '#111111', align: 'left' }),
            makeText({ text: e.body, x: x - W * 0.1, y: lineY + H * 0.21, width: W * 0.2, fontSize: 14, fill: '#111111', align: 'left', fontStyle: 'bold' }),
          ];
        }),
      ];
    },
    apply: applyGeneric,
  },

  {
    id: 'vertical-timeline', name: 'Vertical Timeline', category: 'process',
    tone: 'light', tags: ['timeline', 'process'],
    generate({ width: W, height: H }) {
      const steps = [
        { label: 'Write an event or milestone', body: 'Briefly elaborate on what you want to discuss.' },
        { label: 'Write an event or milestone', body: 'Briefly elaborate on what you want to discuss.' },
        { label: 'Write an event or milestone', body: 'Briefly elaborate on what you want to discuss.' },
      ];
      const lineX = W * 0.08;
      return [
        makeText({ text: 'Timeline', x: W * 0.04, y: H * 0.04, width: W * 0.9, fontSize: 48, fontStyle: 'bold', fill: '#111111', align: 'left' }),
        makeRect({ x: lineX - 1, y: H * 0.2, width: 3, height: H * 0.72, fill: '#111111', cornerRadius: 2 }),
        ...steps.flatMap((s, i) => {
          const y = H * 0.22 + i * (H * 0.26);
          return [
            makeEllipse({ x: lineX - 12, y: y - 12, width: 24, height: 24, fill: '#111111' }),
            makeText({ text: s.label, x: W * 0.14, y: y - 10, width: W * 0.8, fontSize: 22, fontStyle: 'bold', fill: '#111111' }),
            makeText({ text: s.body, x: W * 0.14, y: y + H * 0.07, width: W * 0.8, fontSize: 16, fill: '#111111', fontStyle: 'bold' }),
          ];
        }),
      ];
    },
    apply: applyGeneric,
  },

  // ═══════════════ CHART ═══════════════

  {
    id: 'chart-bullets', name: 'Chart + Bullets', category: 'data',
    tone: 'light', tags: ['data', 'chart'],
    generate({ width: W, height: H }) {
      const bars = [
        { label: 'Item 1', h: H * 0.28 },
        { label: 'Item 2', h: H * 0.42 },
        { label: 'Item 3', h: H * 0.54 },
        { label: 'Item 4', h: H * 0.36 },
        { label: 'Item 5', h: H * 0.62 },
      ];
      const bullets = [
        'Elaborate on what you want to discuss.',
        'Elaborate on what you want to discuss.',
        'Elaborate on what you want to discuss.',
        'Elaborate on what you want to discuss.',
        'Elaborate on what you want to discuss.',
      ];
      const base = H * 0.88;
      const bW = W * 0.065;
      const chartLeft = W * 0.5;
      const chartSpacing = W * 0.082;
      return [
        makeText({ text: 'Chart Page', x: W * 0.04, y: H * 0.06, width: W * 0.42, fontSize: 48, fontStyle: 'bold', fill: '#111111' }),
        ...bullets.map((b, i) => makeText({ text: '• ' + b, x: W * 0.04, y: H * 0.34 + i * (H * 0.115), width: W * 0.42, fontSize: 16, fill: '#111111', fontStyle: 'bold' })),
        makeRect({ x: chartLeft, y: H * 0.12, width: 2, height: base - H * 0.12, fill: '#aaaaaa', cornerRadius: 1 }),
        makeRect({ x: chartLeft, y: base, width: W * 0.48, height: 2, fill: '#aaaaaa', cornerRadius: 1 }),
        ...bars.flatMap((b, i) => {
          const x = chartLeft + W * 0.03 + i * chartSpacing;
          return [
            makeRect({ x, y: base - b.h, width: bW, height: b.h, fill: '#111111', cornerRadius: 2 }),
            makeText({ text: b.label, x: x - 6, y: base + H * 0.02, width: bW + 12, fontSize: 11, align: 'center', fill: '#111111' }),
          ];
        }),
      ];
    },
    apply: applyGeneric,
  },

  {
    id: 'bar-chart', name: 'Bar Chart', category: 'data',
    tone: 'light', tags: ['data', 'chart'],
    generate({ width: W, height: H }) {
      const bars = [
        { label: 'Item 1', h: H * 0.25 },
        { label: 'Item 2', h: H * 0.42 },
        { label: 'Item 3', h: H * 0.34 },
        { label: 'Item 4', h: H * 0.55 },
        { label: 'Item 5', h: H * 0.48 },
        { label: 'Item 6', h: H * 0.62 },
      ];
      const base = H * 0.82;
      const bW = W * 0.088;
      const left = W * 0.1;
      const spacing = W * 0.122;
      return [
        makeText({ text: 'Chart Page', x: W * 0.05, y: H * 0.05, width: W * 0.9, fontSize: 48, fontStyle: 'bold', fill: '#111111' }),
        makeRect({ x: left, y: H * 0.16, width: 2, height: base - H * 0.16, fill: '#aaaaaa', cornerRadius: 1 }),
        makeRect({ x: left, y: base, width: W * 0.82, height: 2, fill: '#aaaaaa', cornerRadius: 1 }),
        ...bars.flatMap((b, i) => {
          const x = left + W * 0.02 + i * spacing;
          return [
            makeRect({ x, y: base - b.h, width: bW, height: b.h, fill: '#111111', cornerRadius: 2 }),
            makeText({ text: b.label, x: x - 6, y: base + H * 0.02, width: bW + 12, fontSize: 11, align: 'center', fill: '#111111' }),
          ];
        }),
      ];
    },
    apply: applyGeneric,
  },

  // ═══════════════ BUTTON / CTA ═══════════════

  {
    id: 'heading-buttons', name: 'Heading + Buttons', category: 'text',
    tone: 'light', tags: ['cta', 'minimal'],
    generate({ width: W, height: H }) {
      return [
        makeText({ text: 'Write a heading with button links', x: W * 0.1, y: H * 0.2, width: W * 0.8, fontSize: 60, fontStyle: 'bold', fill: '#111111', align: 'center' }),
        makeRect({ x: W * 0.22, y: H * 0.62, width: W * 0.24, height: H * 0.1, fill: '#111111', cornerRadius: 40 }),
        makeText({ text: 'Link Name', x: W * 0.22, y: H * 0.647, width: W * 0.24, fontSize: 18, fontStyle: 'bold', fill: '#ffffff', align: 'center' }),
        makeRect({ x: W * 0.54, y: H * 0.62, width: W * 0.24, height: H * 0.1, fill: '#111111', cornerRadius: 40 }),
        makeText({ text: 'Link Name', x: W * 0.54, y: H * 0.647, width: W * 0.24, fontSize: 18, fontStyle: 'bold', fill: '#ffffff', align: 'center' }),
      ];
    },
    apply: applyGeneric,
  },

  // ═══════════════ PROCESS ═══════════════

  {
    id: 'three-steps', name: 'Three Steps', category: 'process',
    tone: 'light', tags: ['process', 'steps'],
    generate({ width: W, height: H }) {
      const steps = ['Step One', 'Step Two', 'Step Three'];
      const bodies = [
        'Briefly describe what happens in this step.',
        'Briefly describe what happens in this step.',
        'Briefly describe what happens in this step.',
      ];
      return [
        makeText({ text: 'How It Works', x: W * 0.1, y: H * 0.06, width: W * 0.8, fontSize: 52, fontStyle: 'bold', fill: '#111111', align: 'center' }),
        ...steps.flatMap((s, i) => {
          const cx = W * 0.06 + i * (W * 0.32);
          return [
            makeEllipse({ x: cx + W * 0.07, y: H * 0.24, width: 64, height: 64, fill: '#111111' }),
            makeText({ text: String(i + 1), x: cx + W * 0.07, y: H * 0.265, width: 64, fontSize: 28, fontStyle: 'bold', align: 'center', fill: '#ffffff' }),
            makeText({ text: s, x: cx, y: H * 0.5, width: W * 0.28, fontSize: 22, fontStyle: 'bold', fill: '#111111', align: 'center' }),
            makeText({ text: bodies[i], x: cx, y: H * 0.64, width: W * 0.28, fontSize: 15, fill: '#444444', align: 'center', fontStyle: 'bold' }),
          ];
        }),
      ];
    },
    apply: applyGeneric,
  },

  {
    id: 'four-steps', name: 'Four Steps', category: 'process',
    tone: 'light', tags: ['process', 'steps'],
    generate({ width: W, height: H }) {
      const steps = ['Step One', 'Step Two', 'Step Three', 'Step Four'];
      return [
        makeText({ text: 'Our Process', x: W * 0.05, y: H * 0.06, width: W * 0.9, fontSize: 48, fontStyle: 'bold', fill: '#111111', align: 'center' }),
        ...steps.flatMap((s, i) => {
          const cx = W * 0.04 + i * (W * 0.245);
          return [
            makeRect({ x: cx, y: H * 0.24, width: W * 0.22, height: H * 0.56, fill: '#111111', cornerRadius: 12 }),
            makeText({ text: String(i + 1).padStart(2, '0'), x: cx + W * 0.01, y: H * 0.28, width: W * 0.2, fontSize: 36, fontStyle: 'bold', fill: '#ffffff', align: 'left' }),
            makeText({ text: s, x: cx + W * 0.01, y: H * 0.56, width: W * 0.2, fontSize: 20, fontStyle: 'bold', fill: '#ffffff', align: 'left' }),
          ];
        }),
      ];
    },
    apply: applyGeneric,
  },

  // ═══════════════ COMPARISON ═══════════════

  {
    id: 'before-after', name: 'Before & After', category: 'text',
    tone: 'light', tags: ['split', 'compare'],
    generate({ width: W, height: H }) {
      return [
        makeText({ text: 'Before & After', x: W * 0.05, y: H * 0.05, width: W * 0.9, fontSize: 48, fontStyle: 'bold', fill: '#111111' }),
        makeRect({ x: W * 0.04, y: H * 0.22, width: W * 0.44, height: H * 0.68, fill: '#eeeeee', cornerRadius: 12 }),
        makeText({ text: 'BEFORE', x: W * 0.04, y: H * 0.25, width: W * 0.44, fontSize: 16, fontStyle: 'bold', align: 'center', fill: '#555555' }),
        makeText({ text: 'Describe the situation before your solution.', x: W * 0.08, y: H * 0.42, width: W * 0.36, fontSize: 18, fill: '#111111', align: 'center', fontStyle: 'bold' }),
        makeRect({ x: W * 0.52, y: H * 0.22, width: W * 0.44, height: H * 0.68, fill: '#111111', cornerRadius: 12 }),
        makeText({ text: 'AFTER', x: W * 0.52, y: H * 0.25, width: W * 0.44, fontSize: 16, fontStyle: 'bold', align: 'center', fill: '#ffffff' }),
        makeText({ text: 'Describe the improved outcome with your solution.', x: W * 0.56, y: H * 0.42, width: W * 0.36, fontSize: 18, fill: '#ffffff', align: 'center', fontStyle: 'bold' }),
      ];
    },
    apply: applyGeneric,
  },

  {
    id: 'pros-cons', name: 'Pros & Cons', category: 'text',
    tone: 'light', tags: ['split', 'compare'],
    generate({ width: W, height: H }) {
      const pros = ['Benefit one goes here', 'Benefit two goes here', 'Benefit three goes here'];
      const cons = ['Drawback one goes here', 'Drawback two goes here', 'Drawback three goes here'];
      return [
        makeText({ text: 'Pros vs Cons', x: W * 0.1, y: H * 0.04, width: W * 0.8, fontSize: 48, fontStyle: 'bold', fill: '#111111', align: 'center' }),
        makeRect({ x: W * 0.04, y: H * 0.2, width: W * 0.44, height: H * 0.72, fill: '#f5f5f5', cornerRadius: 12 }),
        makeText({ text: 'Pros', x: W * 0.04, y: H * 0.23, width: W * 0.44, fontSize: 26, fontStyle: 'bold', align: 'center', fill: '#111111' }),
        ...pros.map((p, i) => makeText({ text: '+ ' + p, x: W * 0.08, y: H * 0.36 + i * (H * 0.14), width: W * 0.36, fontSize: 17, fill: '#111111', fontStyle: 'bold' })),
        makeRect({ x: W * 0.52, y: H * 0.2, width: W * 0.44, height: H * 0.72, fill: '#111111', cornerRadius: 12 }),
        makeText({ text: 'Cons', x: W * 0.52, y: H * 0.23, width: W * 0.44, fontSize: 26, fontStyle: 'bold', align: 'center', fill: '#ffffff' }),
        ...cons.map((c, i) => makeText({ text: '– ' + c, x: W * 0.56, y: H * 0.36 + i * (H * 0.14), width: W * 0.36, fontSize: 17, fill: '#ffffff', fontStyle: 'bold' })),
      ];
    },
    apply: applyGeneric,
  },

  // ═══════════════ TEAM ═══════════════

  {
    id: 'team-grid', name: 'Team Grid', category: 'visual',
    tone: 'light', tags: ['team', 'image'],
    generate({ width: W, height: H }) {
      const members = ['Name Surname', 'Name Surname', 'Name Surname', 'Name Surname'];
      const roles = ['Job Title', 'Job Title', 'Job Title', 'Job Title'];
      return [
        makeText({ text: 'Meet the Team', x: W * 0.1, y: H * 0.04, width: W * 0.8, fontSize: 48, fontStyle: 'bold', fill: '#111111', align: 'center' }),
        ...members.flatMap((name, i) => {
          const col = i % 2;
          const row = Math.floor(i / 2);
          const cx = W * 0.08 + col * (W * 0.46);
          const cy = H * 0.18 + row * (H * 0.42);
          const avatarSize = H * 0.16;
          return [
            makeEllipse({ x: cx + W * 0.07, y: cy, width: avatarSize, height: avatarSize, fill: '#dddddd' }),
            makeText({ text: name, x: cx, y: cy + avatarSize + H * 0.02, width: W * 0.38, fontSize: 20, fontStyle: 'bold', fill: '#111111', align: 'center' }),
            makeText({ text: roles[i], x: cx, y: cy + avatarSize + H * 0.09, width: W * 0.38, fontSize: 15, fill: '#555555', align: 'center', fontStyle: 'bold' }),
          ];
        }),
      ];
    },
    apply: applyGeneric,
  },

  // ═══════════════ DATA / KPI ═══════════════

  {
    id: 'kpi-grid', name: 'KPI Cards', category: 'data',
    tone: 'light', tags: ['data', 'kpi'],
    generate({ width: W, height: H }) {
      const kpis = [
        { label: 'Metric One', val: '84%', delta: '+12%' },
        { label: 'Metric Two', val: '1,200', delta: '+8%' },
        { label: 'Metric Three', val: '$48K', delta: '+22%' },
        { label: 'Metric Four', val: '99.9%', delta: 'Stable' },
      ];
      return [
        makeText({ text: 'Key Metrics', x: W * 0.05, y: H * 0.05, width: W * 0.9, fontSize: 48, fontStyle: 'bold', fill: '#111111' }),
        ...kpis.flatMap((k, i) => {
          const col = i % 2;
          const row = Math.floor(i / 2);
          const cx = W * 0.05 + col * (W * 0.475);
          const cy = H * 0.22 + row * (H * 0.36);
          return [
            makeRect({ x: cx, y: cy, width: W * 0.44, height: H * 0.3, fill: '#f5f5f5', cornerRadius: 12 }),
            makeText({ text: k.val, x: cx + W * 0.02, y: cy + H * 0.04, width: W * 0.36, fontSize: 52, fontStyle: 'bold', fill: '#111111' }),
            makeText({ text: k.label, x: cx + W * 0.02, y: cy + H * 0.19, width: W * 0.28, fontSize: 15, fill: '#555555', fontStyle: 'bold' }),
            makeText({ text: k.delta, x: cx + W * 0.3, y: cy + H * 0.19, width: W * 0.12, fontSize: 15, fontStyle: 'bold', fill: '#111111', align: 'right' }),
          ];
        }),
      ];
    },
    apply: applyGeneric,
  },

  {
    id: 'table', name: 'Table', category: 'data',
    tone: 'light', tags: ['data', 'table'],
    generate({ width: W, height: H }) {
      const headers = ['Category', 'Value A', 'Value B', 'Change'];
      const rows = [
        ['Row One', '120', '148', '+23%'],
        ['Row Two', '85', '92', '+8%'],
        ['Row Three', '200', '175', '-13%'],
        ['Row Four', '64', '88', '+38%'],
      ];
      const colW = W * 0.215;
      const rowH = H * 0.1;
      const tableX = W * 0.04;
      const tableY = H * 0.22;
      return [
        makeText({ text: 'Data Overview', x: W * 0.04, y: H * 0.06, width: W * 0.9, fontSize: 48, fontStyle: 'bold', fill: '#111111' }),
        makeRect({ x: tableX, y: tableY, width: W * 0.92, height: rowH, fill: '#111111', cornerRadius: 8 }),
        ...headers.map((h, i) => makeText({ text: h, x: tableX + W * 0.01 + i * colW, y: tableY + H * 0.025, width: colW - W * 0.01, fontSize: 14, fontStyle: 'bold', fill: '#ffffff' })),
        ...rows.flatMap((row, ri) => [
          makeRect({ x: tableX, y: tableY + rowH * (ri + 1), width: W * 0.92, height: rowH, fill: ri % 2 === 0 ? '#f5f5f5' : '#ffffff', cornerRadius: 0, stroke: '#e0e0e0', strokeWidth: 1 }),
          ...row.map((cell, ci) => makeText({ text: cell, x: tableX + W * 0.01 + ci * colW, y: tableY + rowH * (ri + 1) + H * 0.027, width: colW - W * 0.01, fontSize: 14, fill: '#111111', fontStyle: 'bold' })),
        ]),
      ];
    },
    apply: applyGeneric,
  },

  // ═══════════════ FULLSCREEN / IMPACT ═══════════════

  {
    id: 'dark-title', name: 'Dark Title', category: 'intro',
    tone: 'dark', tags: ['impact', 'minimal', 'opener'],
    generate({ width: W, height: H }) {
      return [
        makeRect({ x: 0, y: 0, width: W, height: H, fill: '#111111', cornerRadius: 0 }),
        makeText({ text: 'Add a heading', x: W * 0.08, y: H * 0.3, width: W * 0.84, fontSize: 72, fontStyle: 'bold', align: 'center', fill: '#ffffff' }),
        makeText({ text: 'Write a subtitle or description here', x: W * 0.15, y: H * 0.65, width: W * 0.7, fontSize: 22, align: 'center', fill: '#aaaaaa', fontStyle: 'bold' }),
      ];
    },
    apply: applyGeneric,
  },

  {
    id: 'dark-quote', name: 'Dark Quote', category: 'text',
    tone: 'dark', tags: ['quote', 'impact', 'minimal'],
    generate({ width: W, height: H }) {
      return [
        makeRect({ x: 0, y: 0, width: W, height: H, fill: '#111111', cornerRadius: 0 }),
        makeText({ text: '\u201c', x: W * 0.06, y: H * 0.02, width: W * 0.15, fontSize: 160, fontStyle: 'bold', fill: '#ffffff', align: 'left' }),
        makeText({ text: 'The best way to predict the future is to create it.', x: W * 0.08, y: H * 0.22, width: W * 0.84, fontSize: 48, fontStyle: 'bold', fill: '#ffffff', align: 'left' }),
        makeText({ text: 'Steve Jobs', x: W * 0.08, y: H * 0.76, width: W * 0.6, fontSize: 20, fill: '#aaaaaa', fontStyle: 'bold' }),
      ];
    },
    apply: applyGeneric,
  },

  // ═══════════════ THREE COLUMN PILLARS ═══════════════

  {
    id: 'three-pillars', name: 'Three Pillars', category: 'text',
    tone: 'light', tags: ['columns', 'features'],
    generate({ width: W, height: H }) {
      const items = [
        { num: '01', label: 'First Pillar', body: 'Briefly describe the first key point or feature here.' },
        { num: '02', label: 'Second Pillar', body: 'Briefly describe the second key point or feature here.' },
        { num: '03', label: 'Third Pillar', body: 'Briefly describe the third key point or feature here.' },
      ];
      return [
        makeText({ text: 'Add a heading', x: W * 0.05, y: H * 0.05, width: W * 0.9, fontSize: 46, fontStyle: 'bold', fill: '#111111' }),
        ...items.flatMap((item, i) => {
          const cx = W * 0.04 + i * (W * 0.323);
          return [
            makeRect({ x: cx, y: H * 0.24, width: W * 0.3, height: H * 0.66, fill: i === 1 ? '#111111' : '#f4f4f4', cornerRadius: 12 }),
            makeText({ text: item.num, x: cx + W * 0.02, y: H * 0.29, width: W * 0.26, fontSize: 32, fontStyle: 'bold', fill: i === 1 ? '#ffffff' : '#cccccc' }),
            makeText({ text: item.label, x: cx + W * 0.02, y: H * 0.5, width: W * 0.26, fontSize: 22, fontStyle: 'bold', fill: i === 1 ? '#ffffff' : '#111111' }),
            makeText({ text: item.body, x: cx + W * 0.02, y: H * 0.64, width: W * 0.26, fontSize: 14, fill: i === 1 ? '#cccccc' : '#555555', fontStyle: 'bold' }),
          ];
        }),
      ];
    },
    apply: applyGeneric,
  },

  // ═══════════════ SWOT ═══════════════

  {
    id: 'swot', name: 'SWOT Analysis', category: 'text',
    tone: 'light', tags: ['strategy', 'framework', 'grid'],
    generate({ width: W, height: H }) {
      const quadrants = [
        { label: 'Strengths', sub: 'Internal · Positive', fill: '#111111', textFill: '#ffffff', subFill: '#aaaaaa' },
        { label: 'Weaknesses', sub: 'Internal · Negative', fill: '#444444', textFill: '#ffffff', subFill: '#aaaaaa' },
        { label: 'Opportunities', sub: 'External · Positive', fill: '#f4f4f4', textFill: '#111111', subFill: '#666666' },
        { label: 'Threats', sub: 'External · Negative', fill: '#e0e0e0', textFill: '#111111', subFill: '#666666' },
      ];
      const pad = W * 0.01;
      const qW = W * 0.5 - pad * 1.5;
      const qH = H * 0.5 - pad * 1.5;
      return [
        ...quadrants.flatMap((q, i) => {
          const col = i % 2;
          const row = Math.floor(i / 2);
          const cx = pad + col * (qW + pad);
          const cy = pad + row * (qH + pad);
          return [
            makeRect({ x: cx, y: cy, width: qW, height: qH, fill: q.fill, cornerRadius: 8 }),
            makeText({ text: q.label, x: cx + W * 0.03, y: cy + H * 0.08, width: qW - W * 0.04, fontSize: 28, fontStyle: 'bold', fill: q.textFill }),
            makeText({ text: q.sub, x: cx + W * 0.03, y: cy + H * 0.2, width: qW - W * 0.04, fontSize: 13, fill: q.subFill, fontStyle: 'bold' }),
            makeText({ text: '• Add your point here\n• Add your point here\n• Add your point here', x: cx + W * 0.03, y: cy + H * 0.3, width: qW - W * 0.04, fontSize: 14, fill: q.subFill, fontStyle: 'bold' }),
          ];
        }),
      ];
    },
    apply: applyGeneric,
  },

  // ═══════════════ NUMBERED LIST ═══════════════

  {
    id: 'numbered-list', name: 'Numbered List', category: 'text',
    tone: 'light', tags: ['list', 'steps'],
    generate({ width: W, height: H }) {
      const items = [
        'Write your first point or key takeaway here.',
        'Write your second point or key takeaway here.',
        'Write your third point or key takeaway here.',
        'Write your fourth point or key takeaway here.',
      ];
      return [
        makeText({ text: 'Add a heading', x: W * 0.05, y: H * 0.05, width: W * 0.9, fontSize: 46, fontStyle: 'bold', fill: '#111111' }),
        ...items.flatMap((item, i) => [
          makeText({ text: String(i + 1), x: W * 0.05, y: H * 0.23 + i * (H * 0.17), width: W * 0.08, fontSize: 52, fontStyle: 'bold', fill: '#cccccc', align: 'left' }),
          makeRect({ x: W * 0.14, y: H * 0.235 + i * (H * 0.17), width: W * 0.81, height: 2, fill: '#eeeeee', cornerRadius: 1 }),
          makeText({ text: item, x: W * 0.14, y: H * 0.245 + i * (H * 0.17), width: W * 0.81, fontSize: 19, fill: '#111111', fontStyle: 'bold' }),
        ]),
      ];
    },
    apply: applyGeneric,
  },

  // ═══════════════ TWO STATS ═══════════════

  {
    id: 'two-stats', name: 'Two Stats', category: 'data',
    tone: 'light', tags: ['data', 'impact', 'minimal'],
    generate({ width: W, height: H }) {
      return [
        makeText({ text: 'Add a heading', x: W * 0.1, y: H * 0.06, width: W * 0.8, fontSize: 36, fontStyle: 'bold', fill: '#111111', align: 'center' }),
        makeRect({ x: W * 0.04, y: H * 0.22, width: W * 0.44, height: H * 0.62, fill: '#111111', cornerRadius: 14 }),
        makeText({ text: '84%', x: W * 0.04, y: H * 0.3, width: W * 0.44, fontSize: 96, fontStyle: 'bold', fill: '#ffffff', align: 'center' }),
        makeText({ text: 'Add a description for this statistic', x: W * 0.07, y: H * 0.64, width: W * 0.38, fontSize: 16, fill: '#aaaaaa', align: 'center', fontStyle: 'bold' }),
        makeRect({ x: W * 0.52, y: H * 0.22, width: W * 0.44, height: H * 0.62, fill: '#f4f4f4', cornerRadius: 14 }),
        makeText({ text: '2.4x', x: W * 0.52, y: H * 0.3, width: W * 0.44, fontSize: 96, fontStyle: 'bold', fill: '#111111', align: 'center' }),
        makeText({ text: 'Add a description for this statistic', x: W * 0.55, y: H * 0.64, width: W * 0.38, fontSize: 16, fill: '#666666', align: 'center', fontStyle: 'bold' }),
      ];
    },
    apply: applyGeneric,
  },

  {
    id: 'four-stats', name: 'Four Stats', category: 'data',
    tone: 'light', tags: ['data', 'impact', 'kpi'],
    generate({ width: W, height: H }) {
      const stats = [
        { val: '84%', label: 'Describe this metric' },
        { val: '2.4x', label: 'Describe this metric' },
        { val: '$12K', label: 'Describe this metric' },
        { val: '99%', label: 'Describe this metric' },
      ];
      return [
        makeText({ text: 'Key Numbers', x: W * 0.1, y: H * 0.05, width: W * 0.8, fontSize: 44, fontStyle: 'bold', fill: '#111111', align: 'center' }),
        ...stats.flatMap((s, i) => {
          const col = i % 2;
          const row = Math.floor(i / 2);
          const cx = W * 0.04 + col * (W * 0.48);
          const cy = H * 0.2 + row * (H * 0.38);
          return [
            makeRect({ x: cx, y: cy, width: W * 0.44, height: H * 0.32, fill: i % 2 === 0 ? '#111111' : '#f4f4f4', cornerRadius: 12 }),
            makeText({ text: s.val, x: cx, y: cy + H * 0.04, width: W * 0.44, fontSize: 64, fontStyle: 'bold', fill: i % 2 === 0 ? '#ffffff' : '#111111', align: 'center' }),
            makeText({ text: s.label, x: cx + W * 0.02, y: cy + H * 0.22, width: W * 0.4, fontSize: 14, fill: i % 2 === 0 ? '#aaaaaa' : '#666666', align: 'center', fontStyle: 'bold' }),
          ];
        }),
      ];
    },
    apply: applyGeneric,
  },

  // ═══════════════ FULL BLEED / IMPACT ═══════════════

  {
    id: 'full-bleed-text', name: 'Full Bleed Text', category: 'visual',
    tone: 'dark', tags: ['impact', 'image', 'minimal'],
    generate({ width: W, height: H }) {
      return [
        makeRect({ x: 0, y: 0, width: W, height: H, fill: '#222222', cornerRadius: 0 }),
        makeRect({ x: 0, y: H * 0.55, width: W, height: H * 0.45, fill: '#111111', cornerRadius: 0, opacity: 0.7 }),
        makeText({ text: 'Add a powerful headline here', x: W * 0.06, y: H * 0.6, width: W * 0.75, fontSize: 52, fontStyle: 'bold', fill: '#ffffff' }),
        makeText({ text: 'Add caption or supporting text', x: W * 0.06, y: H * 0.84, width: W * 0.5, fontSize: 18, fill: '#cccccc', fontStyle: 'bold' }),
      ];
    },
    apply: applyGeneric,
  },

  {
    id: 'highlight-box', name: 'Highlight Box', category: 'text',
    tone: 'light', tags: ['impact', 'minimal', 'cta'],
    generate({ width: W, height: H }) {
      return [
        makeText({ text: 'Add a heading', x: W * 0.1, y: H * 0.06, width: W * 0.8, fontSize: 44, fontStyle: 'bold', fill: '#111111', align: 'center' }),
        makeRect({ x: W * 0.08, y: H * 0.28, width: W * 0.84, height: H * 0.44, fill: '#111111', cornerRadius: 16 }),
        makeText({ text: 'Write your key message or most important insight here. Keep it short and impactful.', x: W * 0.12, y: H * 0.36, width: W * 0.76, fontSize: 28, fontStyle: 'bold', fill: '#ffffff', align: 'center' }),
      ];
    },
    apply: applyGeneric,
  },

  // ═══════════════ PHOTO GRID ═══════════════

  {
    id: 'photo-grid-4', name: 'Photo Grid', category: 'visual',
    tone: 'light', tags: ['image', 'gallery', 'grid'],
    generate({ width: W, height: H }) {
      const pad = W * 0.01;
      const iW = W * 0.5 - pad * 1.5;
      const iH = H * 0.5 - pad * 1.5;
      return [
        ...[0, 1, 2, 3].map((i) => {
          const col = i % 2;
          const row = Math.floor(i / 2);
          return makeRect({
            x: pad + col * (iW + pad),
            y: pad + row * (iH + pad),
            width: iW, height: iH,
            fill: '#dddddd', cornerRadius: 6,
          });
        }),
      ];
    },
    apply: applyGeneric,
  },

  {
    id: 'photo-grid-3', name: 'Three Photos', category: 'visual',
    tone: 'light', tags: ['image', 'gallery'],
    generate({ width: W, height: H }) {
      return [
        makeRect({ x: W * 0.01, y: H * 0.01, width: W * 0.49, height: H * 0.98, fill: '#dddddd', cornerRadius: 8 }),
        makeRect({ x: W * 0.51, y: H * 0.01, width: W * 0.48, height: H * 0.48, fill: '#cccccc', cornerRadius: 8 }),
        makeRect({ x: W * 0.51, y: H * 0.51, width: W * 0.48, height: H * 0.48, fill: '#cccccc', cornerRadius: 8 }),
      ];
    },
    apply: applyGeneric,
  },

  // ═══════════════ ROADMAP ═══════════════

  {
    id: 'roadmap', name: 'Roadmap', category: 'process',
    tone: 'light', tags: ['timeline', 'planning', 'process'],
    generate({ width: W, height: H }) {
      const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];
      const lanes = ['Feature Area 1', 'Feature Area 2', 'Feature Area 3'];
      const tasks = [
        [{ col: 0, span: 1 }, { col: 2, span: 2 }],
        [{ col: 0, span: 2 }, { col: 3, span: 1 }],
        [{ col: 1, span: 1 }, { col: 2, span: 2 }],
      ];
      const labelW = W * 0.16;
      const qW = (W * 0.82) / 4;
      const left = W * 0.04 + labelW;
      const rowH = H * 0.18;
      const topY = H * 0.2;
      const colors = ['#111111', '#444444', '#888888'];
      return [
        makeText({ text: 'Product Roadmap', x: W * 0.04, y: H * 0.04, width: W * 0.9, fontSize: 38, fontStyle: 'bold', fill: '#111111' }),
        makeRect({ x: W * 0.04, y: topY - H * 0.07, width: W * 0.92, height: H * 0.07, fill: '#111111', cornerRadius: 6 }),
        ...quarters.map((q, i) => makeText({ text: q, x: left + i * qW, y: topY - H * 0.058, width: qW, fontSize: 14, fontStyle: 'bold', align: 'center', fill: '#ffffff' })),
        ...lanes.flatMap((lane, ri) => {
          const y = topY + ri * (rowH + H * 0.02);
          return [
            makeRect({ x: W * 0.04, y, width: W * 0.92, height: rowH, fill: ri % 2 === 0 ? '#f4f4f4' : '#ffffff', cornerRadius: 0, stroke: '#e0e0e0', strokeWidth: 1 }),
            makeText({ text: lane, x: W * 0.05, y: y + rowH * 0.35, width: labelW - W * 0.02, fontSize: 13, fontStyle: 'bold', fill: '#111111' }),
            ...tasks[ri].map((t) => makeRect({
              x: left + t.col * qW + W * 0.005,
              y: y + rowH * 0.2,
              width: t.span * qW - W * 0.01,
              height: rowH * 0.6,
              fill: colors[ri],
              cornerRadius: 6,
            })),
          ];
        }),
      ];
    },
    apply: applyGeneric,
  },

  // ═══════════════ HUB & SPOKE ═══════════════

  {
    id: 'hub-spoke', name: 'Hub & Spoke', category: 'visual',
    tone: 'light', tags: ['diagram', 'visual', 'process'],
    generate({ width: W, height: H }) {
      const cx = W * 0.5;
      const cy = H * 0.52;
      const r = H * 0.32;
      const spokes = ['Topic One', 'Topic Two', 'Topic Three', 'Topic Four', 'Topic Five'];
      return [
        makeText({ text: 'Add a heading', x: W * 0.1, y: H * 0.04, width: W * 0.8, fontSize: 40, fontStyle: 'bold', fill: '#111111', align: 'center' }),
        makeEllipse({ x: cx - H * 0.1, y: cy - H * 0.1, width: H * 0.2, height: H * 0.2, fill: '#111111' }),
        makeText({ text: 'Core', x: cx - H * 0.1, y: cy - H * 0.04, width: H * 0.2, fontSize: 15, fontStyle: 'bold', fill: '#ffffff', align: 'center' }),
        ...spokes.map((s, i) => {
          const angle = (i / spokes.length) * Math.PI * 2 - Math.PI / 2;
          const sx = cx + Math.cos(angle) * r;
          const sy = cy + Math.sin(angle) * r;
          const bW = W * 0.14;
          const bH = H * 0.12;
          return [
            makeRect({ x: W * 0.04, y: H * 0.04, width: 0, height: 0, fill: 'transparent' }), // placeholder for line (not supported)
            makeRect({ x: sx - bW / 2, y: sy - bH / 2, width: bW, height: bH, fill: '#f4f4f4', cornerRadius: 10, stroke: '#111111', strokeWidth: 2 }),
            makeText({ text: s, x: sx - bW / 2, y: sy - bH / 4, width: bW, fontSize: 14, fontStyle: 'bold', fill: '#111111', align: 'center' }),
          ];
        }).flat().filter((e) => e.width > 0 || e.type !== 'rect' || e.fill !== 'transparent'),
      ];
    },
    apply: applyGeneric,
  },

  // ═══════════════ PYRAMID ═══════════════

  {
    id: 'pyramid', name: 'Pyramid', category: 'visual',
    tone: 'light', tags: ['diagram', 'hierarchy', 'visual'],
    generate({ width: W, height: H }) {
      const levels = [
        { label: 'Top Level', fill: '#111111', textFill: '#ffffff', w: 0.22 },
        { label: 'Second Level', fill: '#444444', textFill: '#ffffff', w: 0.44 },
        { label: 'Third Level', fill: '#888888', textFill: '#ffffff', w: 0.66 },
        { label: 'Base Level', fill: '#cccccc', textFill: '#111111', w: 0.88 },
      ];
      const rowH = H * 0.17;
      const topY = H * 0.14;
      return [
        makeText({ text: 'Hierarchy Title', x: W * 0.1, y: H * 0.03, width: W * 0.8, fontSize: 40, fontStyle: 'bold', fill: '#111111', align: 'center' }),
        ...levels.map((l, i) => {
          const rW = W * l.w;
          return makeRect({ x: (W - rW) / 2, y: topY + i * rowH, width: rW, height: rowH - H * 0.01, fill: l.fill, cornerRadius: 4 });
        }),
        ...levels.map((l, i) => {
          const rW = W * l.w;
          return makeText({ text: l.label, x: (W - rW) / 2, y: topY + i * rowH + rowH * 0.28, width: rW, fontSize: 18, fontStyle: 'bold', fill: l.textFill, align: 'center' });
        }),
      ];
    },
    apply: applyGeneric,
  },

  // ═══════════════ CLOSING / THANK YOU ═══════════════

  {
    id: 'thank-you', name: 'Thank You', category: 'intro',
    tone: 'light', tags: ['closing', 'cta', 'minimal'],
    generate({ width: W, height: H }) {
      return [
        makeText({ text: 'Thank You', x: W * 0.05, y: H * 0.28, width: W * 0.9, fontSize: 88, fontStyle: 'bold', fill: '#111111', align: 'center' }),
        makeText({ text: 'yourname@email.com  ·  linkedin.com/in/yourname', x: W * 0.1, y: H * 0.68, width: W * 0.8, fontSize: 20, fill: '#555555', align: 'center', fontStyle: 'bold' }),
      ];
    },
    apply: applyGeneric,
  },

  {
    id: 'cta', name: 'Call to Action', category: 'intro',
    tone: 'dark', tags: ['closing', 'cta'],
    generate({ width: W, height: H }) {
      return [
        makeRect({ x: 0, y: 0, width: W, height: H, fill: '#111111', cornerRadius: 0 }),
        makeText({ text: 'Ready to get started?', x: W * 0.08, y: H * 0.22, width: W * 0.84, fontSize: 64, fontStyle: 'bold', fill: '#ffffff', align: 'center' }),
        makeText({ text: 'Write a supporting line that motivates the audience to take the next step.', x: W * 0.12, y: H * 0.54, width: W * 0.76, fontSize: 20, fill: '#aaaaaa', align: 'center', fontStyle: 'bold' }),
        makeRect({ x: W * 0.35, y: H * 0.72, width: W * 0.3, height: H * 0.1, fill: '#ffffff', cornerRadius: 40 }),
        makeText({ text: 'Get in touch', x: W * 0.35, y: H * 0.745, width: W * 0.3, fontSize: 18, fontStyle: 'bold', fill: '#111111', align: 'center' }),
      ];
    },
    apply: applyGeneric,
  },

  // ═══════════════ FIVE FEATURE LIST ═══════════════

  {
    id: 'five-features', name: 'Five Features', category: 'text',
    tone: 'light', tags: ['list', 'features'],
    generate({ width: W, height: H }) {
      const items = [
        { num: '01', label: 'Feature Name', body: 'Brief description of this feature or benefit.' },
        { num: '02', label: 'Feature Name', body: 'Brief description of this feature or benefit.' },
        { num: '03', label: 'Feature Name', body: 'Brief description of this feature or benefit.' },
        { num: '04', label: 'Feature Name', body: 'Brief description of this feature or benefit.' },
        { num: '05', label: 'Feature Name', body: 'Brief description of this feature or benefit.' },
      ];
      return [
        makeText({ text: 'Key Features', x: W * 0.04, y: H * 0.04, width: W * 0.55, fontSize: 44, fontStyle: 'bold', fill: '#111111' }),
        ...items.flatMap((item, i) => {
          const y = H * 0.2 + i * (H * 0.155);
          return [
            makeText({ text: item.num, x: W * 0.04, y, width: W * 0.06, fontSize: 13, fontStyle: 'bold', fill: '#aaaaaa' }),
            makeRect({ x: W * 0.04, y: y + H * 0.06, width: W * 0.92, height: 1, fill: '#e0e0e0' }),
            makeText({ text: item.label, x: W * 0.11, y, width: W * 0.28, fontSize: 17, fontStyle: 'bold', fill: '#111111' }),
            makeText({ text: item.body, x: W * 0.42, y, width: W * 0.54, fontSize: 15, fill: '#555555', fontStyle: 'bold' }),
          ];
        }),
      ];
    },
    apply: applyGeneric,
  },

  // ═══════════════ TESTIMONIAL ═══════════════

  {
    id: 'testimonial', name: 'Testimonial', category: 'text',
    tone: 'light', tags: ['quote', 'social proof'],
    generate({ width: W, height: H }) {
      return [
        makeEllipse({ x: W * 0.42, y: H * 0.1, width: H * 0.16, height: H * 0.16, fill: '#dddddd' }),
        makeText({ text: '\u201c', x: W * 0.1, y: H * 0.28, width: W * 0.1, fontSize: 80, fontStyle: 'bold', fill: '#cccccc' }),
        makeText({ text: 'Write the testimonial quote here. Keep it concise and focused on the specific result or experience that matters most to your audience.', x: W * 0.1, y: H * 0.36, width: W * 0.8, fontSize: 26, fontStyle: 'bold', fill: '#111111', align: 'center' }),
        makeText({ text: 'Name Surname', x: W * 0.1, y: H * 0.72, width: W * 0.8, fontSize: 20, fontStyle: 'bold', fill: '#111111', align: 'center' }),
        makeText({ text: 'Job Title, Company Name', x: W * 0.1, y: H * 0.82, width: W * 0.8, fontSize: 15, fill: '#777777', align: 'center', fontStyle: 'bold' }),
      ];
    },
    apply: applyGeneric,
  },

  // ═══════════════ SPLIT IMAGE WITH BULLETS ═══════════════

  {
    id: 'image-left-bullets', name: 'Image + Bullets', category: 'visual',
    tone: 'light', tags: ['image', 'list', 'split'],
    generate({ width: W, height: H }) {
      const bullets = [
        'First key point about this topic.',
        'Second key point about this topic.',
        'Third key point about this topic.',
      ];
      return [
        makeRect({ x: 0, y: 0, width: W * 0.44, height: H, fill: '#dddddd', cornerRadius: 0 }),
        makeText({ text: 'Add a heading', x: W * 0.48, y: H * 0.14, width: W * 0.48, fontSize: 38, fontStyle: 'bold', fill: '#111111' }),
        ...bullets.map((b, i) => makeText({ text: '• ' + b, x: W * 0.48, y: H * 0.36 + i * (H * 0.17), width: W * 0.48, fontSize: 18, fill: '#111111', fontStyle: 'bold' })),
      ];
    },
    apply: applyGeneric,
  },

  // ═══════════════ GANTT ═══════════════

  {
    id: 'gantt', name: 'Gantt Chart', category: 'process',
    tone: 'light', tags: ['timeline', 'planning', 'process'],
    generate({ width: W, height: H }) {
      const tasks = [
        { label: 'Discovery', start: 0, span: 2 },
        { label: 'Design', start: 1, span: 3 },
        { label: 'Development', start: 3, span: 5 },
        { label: 'Testing', start: 6, span: 2 },
        { label: 'Launch', start: 7, span: 2 },
      ];
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'];
      const total = 9;
      const labelW = W * 0.18;
      const chartW = W * 0.76;
      const left = W * 0.04 + labelW;
      const rowH = H * 0.11;
      const topY = H * 0.22;
      const fills = ['#111111', '#333333', '#555555', '#777777', '#999999'];
      return [
        makeText({ text: 'Project Timeline', x: W * 0.04, y: H * 0.05, width: W * 0.7, fontSize: 40, fontStyle: 'bold', fill: '#111111' }),
        makeRect({ x: W * 0.04, y: topY - H * 0.07, width: W * 0.92, height: H * 0.07, fill: '#111111', cornerRadius: 6 }),
        ...months.map((m, i) => makeText({ text: m, x: left + (i / total) * chartW, y: topY - H * 0.057, width: chartW / total, fontSize: 11, fontStyle: 'bold', align: 'center', fill: '#ffffff' })),
        ...tasks.flatMap((t, i) => {
          const y = topY + i * (rowH + H * 0.01);
          const barX = left + (t.start / total) * chartW;
          const barW = (t.span / total) * chartW - W * 0.005;
          return [
            makeRect({ x: W * 0.04, y, width: W * 0.92, height: rowH, fill: i % 2 === 0 ? '#f4f4f4' : '#ffffff', cornerRadius: 0, stroke: '#e0e0e0', strokeWidth: 1 }),
            makeText({ text: t.label, x: W * 0.05, y: y + rowH * 0.28, width: labelW - W * 0.02, fontSize: 13, fontStyle: 'bold', fill: '#111111' }),
            makeRect({ x: barX, y: y + rowH * 0.18, width: barW, height: rowH * 0.62, fill: fills[i], cornerRadius: 4 }),
          ];
        }),
      ];
    },
    apply: applyGeneric,
  },

];
