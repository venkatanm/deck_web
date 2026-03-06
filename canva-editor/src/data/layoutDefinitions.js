import { v4 as uuidv4 } from 'uuid';

// ── Helpers ────────────────────────────────────────────────────────────────────
function makeText(o) {
  return {
    id: uuidv4(), type: 'text', rotation: 0, opacity: 1,
    fontFamily: 'Inter', fontStyle: 'normal', align: 'left',
    fill: '#1e293b', fontSize: 18, content: 'Text',
    width: 200, height: 60, x: 0, y: 0,
    ...o,
  };
}

function makeRect(o) {
  return {
    id: uuidv4(), type: 'rect', rotation: 0, opacity: 1,
    fill: '#7c3aed', stroke: null, strokeWidth: 0, cornerRadius: 0,
    x: 0, y: 0, width: 100, height: 100,
    ...o,
  };
}

function makeEllipse(o) {
  return {
    id: uuidv4(), type: 'ellipse', rotation: 0, opacity: 1,
    fill: '#7c3aed', stroke: null, strokeWidth: 0,
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

export const LAYOUT_DEFINITIONS = [
  // ═══════════════ INTRO & FRAMING ═══════════════

  {
    id: 'title-center', name: 'Title Slide', category: 'intro',
    tone: 'light', tags: ['opener', 'title', 'minimal'],
    generate({ width: W, height: H }) {
      return [
        makeRect({ x: W * 0.42, y: H * 0.535, width: W * 0.16, height: 4, fill: '#7c3aed', cornerRadius: 2 }),
        makeText({ content: 'Your Presentation Title', x: W * 0.08, y: H * 0.26, width: W * 0.84, fontSize: 58, fontStyle: 'bold', align: 'center', fill: '#0f172a' }),
        makeText({ content: 'Subtitle · Presenter Name · Month Year', x: W * 0.2, y: H * 0.59, width: W * 0.6, fontSize: 20, align: 'center', fill: '#64748b' }),
      ];
    },
    apply: applyGeneric,
  },

  {
    id: 'agenda', name: 'Agenda / TOC', category: 'intro',
    tone: 'light', tags: ['list', 'agenda', 'text-heavy'],
    generate({ width: W, height: H }) {
      const items = ['Introduction & Context', 'Problem & Opportunity', 'Our Solution', 'Market & Traction', 'Team & Roadmap'];
      return [
        makeRect({ x: 0, y: 0, width: W * 0.32, height: H, fill: '#0f172a', cornerRadius: 0 }),
        makeText({ content: 'Agenda', x: W * 0.04, y: H * 0.35, width: W * 0.24, fontSize: 42, fontStyle: 'bold', fill: '#ffffff', align: 'left' }),
        makeRect({ x: W * 0.04, y: H * 0.53, width: W * 0.14, height: 3, fill: '#7c3aed', cornerRadius: 2 }),
        ...items.flatMap((item, i) => [
          makeRect({ x: W * 0.37, y: H * 0.1 + i * (H * 0.16), width: 36, height: 36, fill: '#7c3aed', cornerRadius: 18 }),
          makeText({ content: String(i + 1).padStart(2, '0'), x: W * 0.37, y: H * 0.1 + i * (H * 0.16) + 7, width: 36, fontSize: 14, fontStyle: 'bold', align: 'center', fill: '#ffffff' }),
          makeText({ content: item, x: W * 0.42, y: H * 0.108 + i * (H * 0.16), width: W * 0.52, fontSize: 20, fontStyle: 'bold', fill: '#1e293b' }),
        ]),
      ];
    },
    apply: applyGeneric,
  },

  {
    id: 'executive-summary', name: 'Executive Summary', category: 'intro',
    tone: 'light', tags: ['text-heavy', 'summary'],
    generate({ width: W, height: H }) {
      const cols = [
        { label: 'Challenge', body: 'Describe the core problem or market gap you are addressing.', color: '#ef4444' },
        { label: 'Solution', body: 'Summarize your approach and what makes it uniquely effective.', color: '#7c3aed' },
        { label: 'Impact', body: 'Quantify the outcome — growth, savings, or market opportunity.', color: '#0891b2' },
      ];
      return [
        makeText({ content: 'Executive Summary', x: W * 0.05, y: H * 0.06, width: W * 0.6, fontSize: 36, fontStyle: 'bold', fill: '#0f172a' }),
        makeRect({ x: W * 0.05, y: H * 0.18, width: W * 0.02, height: H * 0.6, fill: '#e2e8f0', cornerRadius: 2 }),
        ...cols.flatMap((col, i) => {
          const cx = W * 0.1 + i * (W * 0.3);
          return [
            makeRect({ x: cx, y: H * 0.22, width: W * 0.27, height: H * 0.52, fill: '#f8fafc', cornerRadius: 12, stroke: col.color, strokeWidth: 2 }),
            makeRect({ x: cx, y: H * 0.22, width: W * 0.27, height: 4, fill: col.color, cornerRadius: 2 }),
            makeText({ content: col.label, x: cx + 20, y: H * 0.29, width: W * 0.23, fontSize: 22, fontStyle: 'bold', fill: col.color }),
            makeText({ content: col.body, x: cx + 20, y: H * 0.42, width: W * 0.23, fontSize: 15, fill: '#475569' }),
          ];
        }),
      ];
    },
    apply: applyGeneric,
  },

  {
    id: 'problem-statement', name: 'Problem Statement', category: 'intro',
    tone: 'dark', tags: ['impact', 'opener', 'minimal'],
    generate({ width: W, height: H }) {
      return [
        makeRect({ x: 0, y: 0, width: W, height: H, fill: '#0f172a', cornerRadius: 0 }),
        makeRect({ x: W * 0.05, y: H * 0.08, width: 6, height: H * 0.84, fill: '#ef4444', cornerRadius: 3 }),
        makeText({ content: 'The Problem', x: W * 0.1, y: H * 0.1, width: W * 0.8, fontSize: 22, fill: '#ef4444', fontStyle: 'bold' }),
        makeText({ content: '73% of companies lose revenue\nto a problem they cannot yet name.', x: W * 0.1, y: H * 0.28, width: W * 0.78, fontSize: 52, fontStyle: 'bold', fill: '#f1f5f9', align: 'left' }),
        makeText({ content: 'Add your supporting context or data source here to frame the scale of the problem.', x: W * 0.1, y: H * 0.74, width: W * 0.6, fontSize: 17, fill: '#94a3b8' }),
      ];
    },
    apply: applyGeneric,
  },

  {
    id: 'value-prop', name: 'Value Proposition', category: 'intro',
    tone: 'light', tags: ['opener', 'text-heavy'],
    generate({ width: W, height: H }) {
      const pillars = [
        { icon: '⚡', label: 'Speed', body: 'Deploy in days, not months. Immediate ROI from day one.', color: '#f59e0b' },
        { icon: '🔒', label: 'Security', body: 'Enterprise-grade compliance, audit trails and zero-trust access.', color: '#3b82f6' },
        { icon: '📈', label: 'Scale', body: 'Grows with you from 10 to 10,000 users without re-architecting.', color: '#10b981' },
      ];
      return [
        makeText({ content: 'Why We Win', x: W * 0.05, y: H * 0.06, width: W * 0.6, fontSize: 38, fontStyle: 'bold', fill: '#0f172a' }),
        makeText({ content: 'Three pillars that set us apart', x: W * 0.05, y: H * 0.19, width: W * 0.5, fontSize: 18, fill: '#64748b' }),
        ...pillars.flatMap((p, i) => {
          const cx = W * 0.05 + i * (W * 0.32);
          return [
            makeRect({ x: cx, y: H * 0.3, width: W * 0.28, height: H * 0.56, fill: '#ffffff', cornerRadius: 14, stroke: '#e2e8f0', strokeWidth: 1 }),
            makeEllipse({ x: cx + 16, y: H * 0.35, width: 52, height: 52, fill: p.color + '22' }),
            makeText({ content: p.icon, x: cx + 22, y: H * 0.365, width: 40, fontSize: 24, align: 'center' }),
            makeText({ content: p.label, x: cx + 14, y: H * 0.5, width: W * 0.24, fontSize: 22, fontStyle: 'bold', fill: '#0f172a' }),
            makeText({ content: p.body, x: cx + 14, y: H * 0.62, width: W * 0.24, fontSize: 14, fill: '#475569' }),
          ];
        }),
      ];
    },
    apply: applyGeneric,
  },

  {
    id: 'mission-vision', name: 'Mission & Vision', category: 'intro',
    tone: 'light', tags: ['opener', 'minimal'],
    generate({ width: W, height: H }) {
      return [
        makeText({ content: 'Our Purpose', x: W * 0.05, y: H * 0.06, width: W * 0.5, fontSize: 34, fontStyle: 'bold', fill: '#0f172a' }),
        makeRect({ x: W * 0.05, y: H * 0.22, width: W * 0.43, height: H * 0.62, fill: '#0f172a', cornerRadius: 16 }),
        makeText({ content: 'MISSION', x: W * 0.08, y: H * 0.28, width: W * 0.37, fontSize: 13, fontStyle: 'bold', fill: '#7c3aed', align: 'left' }),
        makeText({ content: 'To make world-class software tools accessible to every team on the planet.', x: W * 0.08, y: H * 0.38, width: W * 0.37, fontSize: 22, fontStyle: 'bold', fill: '#f1f5f9', align: 'left' }),
        makeRect({ x: W * 0.52, y: H * 0.22, width: W * 0.43, height: H * 0.62, fill: '#7c3aed', cornerRadius: 16 }),
        makeText({ content: 'VISION', x: W * 0.55, y: H * 0.28, width: W * 0.37, fontSize: 13, fontStyle: 'bold', fill: '#c4b5fd', align: 'left' }),
        makeText({ content: 'A future where every person works with the productivity of a Fortune 500 team.', x: W * 0.55, y: H * 0.38, width: W * 0.37, fontSize: 22, fontStyle: 'bold', fill: '#ffffff', align: 'left' }),
      ];
    },
    apply: applyGeneric,
  },

  {
    id: 'presenter-bio', name: 'Presenter Bio', category: 'intro',
    tone: 'light', tags: ['image', 'team', 'opener'],
    generate({ width: W, height: H }) {
      const photoD = H * 0.52;
      return [
        makeRect({ x: W * 0.06, y: H * 0.16, width: photoD, height: photoD, fill: '#e2e8f0', cornerRadius: photoD }),
        makeText({ content: 'Photo', x: W * 0.06, y: H * 0.16 + photoD / 2 - 12, width: photoD, fontSize: 14, align: 'center', fill: '#94a3b8' }),
        makeText({ content: 'Alexandra Chen', x: W * 0.42, y: H * 0.16, width: W * 0.52, fontSize: 40, fontStyle: 'bold', fill: '#0f172a' }),
        makeText({ content: 'Chief Executive Officer', x: W * 0.42, y: H * 0.35, width: W * 0.52, fontSize: 20, fill: '#7c3aed', fontStyle: 'bold' }),
        makeRect({ x: W * 0.42, y: H * 0.46, width: W * 0.14, height: 3, fill: '#e2e8f0', cornerRadius: 2 }),
        makeText({ content: '15 years building enterprise SaaS. Former VP at Salesforce, Stanford MBA. Led 3 successful exits totaling $2.4B in value.', x: W * 0.42, y: H * 0.52, width: W * 0.52, fontSize: 16, fill: '#475569' }),
      ];
    },
    apply: applyGeneric,
  },

  {
    id: 'section-divider', name: 'Section Divider', category: 'intro',
    tone: 'dark', tags: ['minimal', 'opener'],
    generate({ width: W, height: H }) {
      return [
        makeRect({ x: 0, y: 0, width: W, height: H, fill: '#0f172a', cornerRadius: 0 }),
        makeRect({ x: 0, y: H * 0.38, width: W, height: H * 0.24, fill: '#7c3aed', cornerRadius: 0 }),
        makeText({ content: '02', x: W * 0.05, y: H * 0.07, width: W * 0.9, fontSize: 80, fontStyle: 'bold', align: 'center', fill: '#1e293b' }),
        makeText({ content: 'Market Opportunity', x: W * 0.1, y: H * 0.415, width: W * 0.8, fontSize: 46, fontStyle: 'bold', align: 'center', fill: '#ffffff' }),
        makeText({ content: 'Understanding the landscape and the size of the prize', x: W * 0.2, y: H * 0.69, width: W * 0.6, fontSize: 18, align: 'center', fill: '#94a3b8' }),
      ];
    },
    apply: applyGeneric,
  },

  // ═══════════════ CORE TEXT & CONCEPTS ═══════════════

  {
    id: 'title-bullets', name: 'Title & Bullets', category: 'text',
    tone: 'light', tags: ['list', 'text-heavy'],
    generate({ width: W, height: H }) {
      const bullets = [
        'Key insight or supporting point goes here with enough detail to be useful',
        'Second bullet point — keep it concise and action-oriented',
        'Third supporting argument or data point for your audience',
        'Fourth item — visual consistency keeps readers engaged',
        'Final point — end with a call to action or memorable takeaway',
      ];
      return [
        makeRect({ x: W * 0.05, y: H * 0.06, width: 6, height: H * 0.12, fill: '#7c3aed', cornerRadius: 3 }),
        makeText({ content: 'Slide Heading Goes Here', x: W * 0.08, y: H * 0.06, width: W * 0.87, fontSize: 38, fontStyle: 'bold', fill: '#0f172a' }),
        makeRect({ x: W * 0.05, y: H * 0.215, width: W * 0.9, height: 1, fill: '#e2e8f0', cornerRadius: 1 }),
        ...bullets.flatMap((b, i) => [
          makeEllipse({ x: W * 0.05, y: H * 0.27 + i * (H * 0.135), width: 10, height: 10, fill: '#7c3aed' }),
          makeText({ content: b, x: W * 0.08, y: H * 0.265 + i * (H * 0.135), width: W * 0.87, fontSize: 18, fill: '#334155' }),
        ]),
      ];
    },
    apply: applyGeneric,
  },

  {
    id: 'two-column', name: 'Two Column', category: 'text',
    tone: 'light', tags: ['split', 'text-heavy'],
    generate({ width: W, height: H }) {
      return [
        makeText({ content: 'Two-Column Layout', x: W * 0.05, y: H * 0.06, width: W * 0.9, fontSize: 36, fontStyle: 'bold', fill: '#0f172a' }),
        makeRect({ x: W * 0.05, y: H * 0.19, width: W * 0.9, height: 1, fill: '#e2e8f0', cornerRadius: 1 }),
        makeRect({ x: W * 0.495, y: H * 0.22, width: 1, height: H * 0.65, fill: '#e2e8f0', cornerRadius: 1 }),
        makeText({ content: 'Left Column Heading', x: W * 0.05, y: H * 0.23, width: W * 0.41, fontSize: 22, fontStyle: 'bold', fill: '#7c3aed' }),
        makeText({ content: 'Add your left column content here. This area supports extended text for detailed explanations, lists, or supporting arguments.', x: W * 0.05, y: H * 0.36, width: W * 0.41, fontSize: 16, fill: '#475569' }),
        makeText({ content: 'Right Column Heading', x: W * 0.52, y: H * 0.23, width: W * 0.43, fontSize: 22, fontStyle: 'bold', fill: '#0891b2' }),
        makeText({ content: 'Add your right column content here. Balance with the left side for a clean, professional layout that guides the reader.', x: W * 0.52, y: H * 0.36, width: W * 0.43, fontSize: 16, fill: '#475569' }),
      ];
    },
    apply: applyGeneric,
  },

  {
    id: 'three-column', name: 'Three Column Pillars', category: 'text',
    tone: 'light', tags: ['text-heavy', 'split'],
    generate({ width: W, height: H }) {
      const cols = [
        { num: '01', label: 'Discover', body: 'Research and identify the core opportunity through data and customer interviews.' },
        { num: '02', label: 'Define', body: 'Synthesize insights into a clear problem statement and success criteria.' },
        { num: '03', label: 'Deliver', body: 'Execute with precision, measure outcomes, and iterate continuously.' },
      ];
      return [
        makeText({ content: 'Our Approach', x: W * 0.05, y: H * 0.06, width: W * 0.9, fontSize: 36, fontStyle: 'bold', fill: '#0f172a' }),
        ...cols.flatMap((col, i) => {
          const cx = W * 0.05 + i * (W * 0.32);
          return [
            makeRect({ x: cx, y: H * 0.22, width: W * 0.28, height: H * 0.62, fill: i === 1 ? '#0f172a' : '#f8fafc', cornerRadius: 14, stroke: i === 1 ? 'none' : '#e2e8f0', strokeWidth: 1 }),
            makeText({ content: col.num, x: cx + 16, y: H * 0.28, width: W * 0.24, fontSize: 36, fontStyle: 'bold', fill: i === 1 ? '#7c3aed' : '#e2e8f0' }),
            makeText({ content: col.label, x: cx + 16, y: H * 0.46, width: W * 0.24, fontSize: 24, fontStyle: 'bold', fill: i === 1 ? '#ffffff' : '#0f172a' }),
            makeText({ content: col.body, x: cx + 16, y: H * 0.59, width: W * 0.24, fontSize: 14, fill: i === 1 ? '#94a3b8' : '#475569' }),
          ];
        }),
      ];
    },
    apply: applyGeneric,
  },

  {
    id: 'big-number', name: 'Big Number / Stat', category: 'text',
    tone: 'any', tags: ['data', 'minimal', 'impact'],
    generate({ width: W, height: H }) {
      return [
        makeText({ content: '$4.2B', x: W * 0.05, y: H * 0.1, width: W * 0.9, fontSize: 160, fontStyle: 'bold', align: 'center', fill: '#7c3aed' }),
        makeRect({ x: W * 0.38, y: H * 0.71, width: W * 0.24, height: 4, fill: '#e2e8f0', cornerRadius: 2 }),
        makeText({ content: 'Total Addressable Market by 2027', x: W * 0.1, y: H * 0.75, width: W * 0.8, fontSize: 26, align: 'center', fill: '#0f172a' }),
        makeText({ content: 'Source: Gartner Market Research 2024', x: W * 0.2, y: H * 0.88, width: W * 0.6, fontSize: 13, align: 'center', fill: '#94a3b8' }),
      ];
    },
    apply: applyGeneric,
  },

  {
    id: 'blockquote', name: 'Blockquote', category: 'text',
    tone: 'light', tags: ['quote', 'minimal', 'impact'],
    generate({ width: W, height: H }) {
      return [
        makeText({ content: '\u201c', x: W * 0.06, y: H * 0.04, width: 120, fontSize: 160, fontStyle: 'bold', fill: '#e2e8f0', align: 'left' }),
        makeText({ content: 'The best way to predict the future is to create it. Innovation distinguishes between a leader and a follower.', x: W * 0.1, y: H * 0.25, width: W * 0.8, fontSize: 36, fontStyle: 'bold', fill: '#0f172a', align: 'left' }),
        makeRect({ x: W * 0.1, y: H * 0.74, width: W * 0.1, height: 4, fill: '#7c3aed', cornerRadius: 2 }),
        makeText({ content: 'Steve Jobs, Co-founder of Apple Inc.', x: W * 0.1, y: H * 0.8, width: W * 0.6, fontSize: 16, fill: '#64748b' }),
      ];
    },
    apply: applyGeneric,
  },

  {
    id: 'text-sidebar', name: 'Text with Sidebar', category: 'text',
    tone: 'dark', tags: ['split', 'text-heavy'],
    generate({ width: W, height: H }) {
      return [
        makeRect({ x: 0, y: 0, width: W * 0.3, height: H, fill: '#0f172a', cornerRadius: 0 }),
        makeText({ content: 'Key Context', x: W * 0.03, y: H * 0.08, width: W * 0.24, fontSize: 26, fontStyle: 'bold', fill: '#ffffff' }),
        makeRect({ x: W * 0.03, y: H * 0.22, width: W * 0.22, height: 3, fill: '#7c3aed', cornerRadius: 2 }),
        makeText({ content: 'Add sidebar context, definitions, or supporting data that frames the main content.', x: W * 0.03, y: H * 0.28, width: W * 0.24, fontSize: 14, fill: '#94a3b8' }),
        makeText({ content: 'Main Content Heading', x: W * 0.35, y: H * 0.08, width: W * 0.6, fontSize: 36, fontStyle: 'bold', fill: '#0f172a' }),
        makeText({ content: 'Your primary narrative or detailed explanation goes in this wider content area. Use this space for the bulk of your argument, data analysis, or storytelling. Keep paragraphs short and scannable.', x: W * 0.35, y: H * 0.24, width: W * 0.6, fontSize: 17, fill: '#334155' }),
        makeText({ content: 'Supporting detail or secondary paragraph can go here, expanding on the main point above with additional context, evidence, or recommendations for the audience.', x: W * 0.35, y: H * 0.54, width: W * 0.6, fontSize: 17, fill: '#475569' }),
      ];
    },
    apply: applyGeneric,
  },

  {
    id: 'key-takeaways', name: 'Key Takeaways', category: 'text',
    tone: 'light', tags: ['list', 'text-heavy', 'summary'],
    generate({ width: W, height: H }) {
      const items = [
        'Revenue grew 42% YoY — driven by enterprise segment expansion',
        'Net Promoter Score reached 68, up from 51 at the start of the year',
        'Launched 3 new product lines ahead of schedule with 97% uptime SLA',
        'Pipeline coverage now stands at 3.8x, ensuring a strong Q1 close',
      ];
      return [
        makeRect({ x: 0, y: 0, width: W, height: H * 0.18, fill: '#0f172a', cornerRadius: 0 }),
        makeText({ content: '✦  Key Takeaways', x: W * 0.05, y: H * 0.04, width: W * 0.9, fontSize: 34, fontStyle: 'bold', fill: '#ffffff' }),
        ...items.flatMap((item, i) => [
          makeRect({ x: W * 0.05, y: H * 0.24 + i * (H * 0.175), width: W * 0.9, height: H * 0.14, fill: i % 2 === 0 ? '#f8fafc' : '#ffffff', cornerRadius: 10, stroke: '#e2e8f0', strokeWidth: 1 }),
          makeText({ content: String(i + 1), x: W * 0.07, y: H * 0.265 + i * (H * 0.175), width: 36, fontSize: 28, fontStyle: 'bold', fill: '#7c3aed', align: 'center' }),
          makeText({ content: item, x: W * 0.13, y: H * 0.272 + i * (H * 0.175), width: W * 0.8, fontSize: 17, fill: '#0f172a', fontStyle: 'bold' }),
        ]),
      ];
    },
    apply: applyGeneric,
  },

  // ═══════════════ DATA & FINANCIALS ═══════════════

  {
    id: 'bar-chart', name: 'Bar Chart', category: 'data',
    tone: 'light', tags: ['data', 'chart'],
    generate({ width: W, height: H }) {
      const bars = [
        { label: 'Q1 2023', val: '$1.8M', h: H * 0.34 },
        { label: 'Q2 2023', val: '$2.4M', h: H * 0.44 },
        { label: 'Q3 2023', val: '$2.1M', h: H * 0.39 },
        { label: 'Q4 2023', val: '$3.0M', h: H * 0.56 },
        { label: 'Q1 2024', val: '$3.4M', h: H * 0.62 },
        { label: 'Q2 2024', val: '$4.2M', h: H * 0.76 },
      ];
      const bW = W * 0.09, gap = W * 0.04, left = W * 0.1, base = H * 0.82;
      return [
        makeText({ content: 'Revenue Growth by Quarter', x: W * 0.05, y: H * 0.06, width: W * 0.6, fontSize: 32, fontStyle: 'bold', fill: '#0f172a' }),
        makeText({ content: '+133% YoY', x: W * 0.72, y: H * 0.08, width: W * 0.22, fontSize: 28, fontStyle: 'bold', fill: '#10b981', align: 'right' }),
        makeRect({ x: left - 2, y: H * 0.18, width: 2, height: base - H * 0.18, fill: '#e2e8f0', cornerRadius: 1 }),
        makeRect({ x: left, y: base, width: W * 0.8, height: 2, fill: '#e2e8f0', cornerRadius: 1 }),
        ...bars.flatMap((b, i) => {
          const x = left + i * (bW + gap);
          return [
            makeRect({ x, y: base - b.h, width: bW, height: b.h, fill: i >= 4 ? '#7c3aed' : '#c4b5fd', cornerRadius: 4 }),
            makeText({ content: b.val, x: x - 4, y: base - b.h - H * 0.07, width: bW + 8, fontSize: 12, fontStyle: 'bold', align: 'center', fill: '#0f172a' }),
            makeText({ content: b.label, x: x - 8, y: base + H * 0.02, width: bW + 16, fontSize: 11, align: 'center', fill: '#64748b' }),
          ];
        }),
      ];
    },
    apply: applyGeneric,
  },

  {
    id: 'dashboard', name: 'Dashboard / KPIs', category: 'data',
    tone: 'light', tags: ['data', 'chart', 'kpi'],
    generate({ width: W, height: H }) {
      const kpis = [
        { label: 'ARR', val: '$12.4M', delta: '+42%', color: '#7c3aed' },
        { label: 'Customers', val: '1,840', delta: '+28%', color: '#0891b2' },
        { label: 'NPS Score', val: '68', delta: '+17pt', color: '#10b981' },
        { label: 'Churn Rate', val: '1.2%', delta: '-0.4%', color: '#f59e0b' },
      ];
      const barHeights = [H*0.18, H*0.28, H*0.22, H*0.32, H*0.38, H*0.29];
      const bW = W * 0.07, left = W * 0.06, base = H * 0.92;
      return [
        makeText({ content: 'Performance Dashboard', x: W * 0.05, y: H * 0.04, width: W * 0.6, fontSize: 28, fontStyle: 'bold', fill: '#0f172a' }),
        makeText({ content: 'Q2 2024 · All metrics vs prior quarter', x: W * 0.05, y: H * 0.13, width: W * 0.5, fontSize: 14, fill: '#64748b' }),
        ...kpis.flatMap((k, i) => {
          const cx = W * 0.05 + i * (W * 0.235);
          return [
            makeRect({ x: cx, y: H * 0.22, width: W * 0.21, height: H * 0.26, fill: '#ffffff', cornerRadius: 12, stroke: '#e2e8f0', strokeWidth: 1 }),
            makeRect({ x: cx, y: H * 0.22, width: W * 0.21, height: 4, fill: k.color, cornerRadius: 2 }),
            makeText({ content: k.label, x: cx + 12, y: H * 0.29, width: W * 0.17, fontSize: 13, fill: '#64748b', fontStyle: 'bold' }),
            makeText({ content: k.val, x: cx + 12, y: H * 0.34, width: W * 0.17, fontSize: 26, fontStyle: 'bold', fill: '#0f172a' }),
            makeText({ content: k.delta, x: cx + 12, y: H * 0.43, width: W * 0.17, fontSize: 13, fontStyle: 'bold', fill: '#10b981' }),
          ];
        }),
        makeRect({ x: W * 0.05, y: H * 0.54, width: W * 0.9, height: H * 0.38, fill: '#f8fafc', cornerRadius: 10, stroke: '#e2e8f0', strokeWidth: 1 }),
        makeText({ content: 'Monthly Revenue Trend', x: W * 0.08, y: H * 0.57, width: W * 0.4, fontSize: 14, fontStyle: 'bold', fill: '#0f172a' }),
        ...barHeights.map((bh, i) => makeRect({ x: left + W * 0.07 + i * (bW + W * 0.04), y: base - bh, width: bW, height: bh, fill: '#7c3aed', cornerRadius: 4, opacity: 0.7 + i * 0.05 })),
      ];
    },
    apply: applyGeneric,
  },

  {
    id: 'data-table', name: 'Data Table', category: 'data',
    tone: 'light', tags: ['data', 'text-heavy'],
    generate({ width: W, height: H }) {
      const headers = ['Product', 'Q1 Revenue', 'Q2 Revenue', 'Growth', 'Status'];
      const rows = [
        ['Enterprise Suite', '$3.2M', '$4.6M', '+44%', 'On Track'],
        ['Starter Plan', '$0.9M', '$1.1M', '+22%', 'On Track'],
        ['Professional', '$1.8M', '$2.1M', '+17%', 'At Risk'],
        ['Add-ons & APIs', '$0.4M', '$0.6M', '+50%', 'On Track'],
      ];
      const colW = W * 0.17, rowH = H * 0.12, tableX = W * 0.04, tableY = H * 0.23;
      return [
        makeText({ content: 'Revenue by Product Line', x: W * 0.05, y: H * 0.06, width: W * 0.7, fontSize: 32, fontStyle: 'bold', fill: '#0f172a' }),
        makeRect({ x: tableX, y: tableY, width: W * 0.92, height: rowH * 0.85, fill: '#0f172a', cornerRadius: 8 }),
        ...headers.map((h, i) => makeText({ content: h, x: tableX + 12 + i * colW, y: tableY + H * 0.03, width: colW - 8, fontSize: 13, fontStyle: 'bold', fill: '#ffffff' })),
        ...rows.flatMap((row, ri) => [
          makeRect({ x: tableX, y: tableY + rowH * (0.85 + ri), width: W * 0.92, height: rowH * 0.9, fill: ri % 2 === 0 ? '#f8fafc' : '#ffffff', cornerRadius: 0, stroke: '#e2e8f0', strokeWidth: 1 }),
          ...row.map((cell, ci) => makeText({ content: cell, x: tableX + 12 + ci * colW, y: tableY + rowH * (0.85 + ri) + H * 0.028, width: colW - 8, fontSize: 14, fill: ci === 3 ? '#10b981' : ci === 4 && cell === 'At Risk' ? '#ef4444' : '#334155', fontStyle: ci === 3 || ci === 4 ? 'bold' : 'normal' })),
        ]),
      ];
    },
    apply: applyGeneric,
  },

  {
    id: 'waterfall', name: 'Waterfall Chart', category: 'data',
    tone: 'light', tags: ['data', 'chart', 'financial'],
    generate({ width: W, height: H }) {
      const steps = [
        { label: 'Starting ARR', val: '+$8.2M', h: H * 0.42, y0: H * 0.35, color: '#0f172a' },
        { label: 'New Logos', val: '+$2.8M', h: H * 0.23, y0: H * 0.12, color: '#10b981' },
        { label: 'Expansion', val: '+$1.6M', h: H * 0.13, y0: H * 0.0, color: '#10b981' },
        { label: 'Churn', val: '-$0.9M', h: H * 0.08, y0: H * 0.08, color: '#ef4444' },
        { label: 'Contraction', val: '-$0.4M', h: H * 0.04, y0: H * 0.13, color: '#ef4444' },
        { label: 'Ending ARR', val: '$11.3M', h: H * 0.58, y0: H * 0.19, color: '#7c3aed' },
      ];
      const bW = W * 0.1, gap = W * 0.04, left = W * 0.08, base = H * 0.82;
      return [
        makeText({ content: 'ARR Waterfall — FY 2024', x: W * 0.05, y: H * 0.05, width: W * 0.7, fontSize: 30, fontStyle: 'bold', fill: '#0f172a' }),
        makeRect({ x: left, y: base, width: W * 0.84, height: 2, fill: '#e2e8f0', cornerRadius: 1 }),
        ...steps.flatMap((s, i) => {
          const x = left + i * (bW + gap);
          const topY = base - s.y0 - s.h;
          return [
            makeRect({ x, y: topY, width: bW, height: s.h, fill: s.color, cornerRadius: 4 }),
            makeText({ content: s.val, x: x - 6, y: topY - H * 0.07, width: bW + 12, fontSize: 12, fontStyle: 'bold', align: 'center', fill: s.color }),
            makeText({ content: s.label, x: x - 8, y: base + H * 0.025, width: bW + 16, fontSize: 11, align: 'center', fill: '#64748b' }),
          ];
        }),
      ];
    },
    apply: applyGeneric,
  },

  {
    id: 'scatter-plot', name: 'Scatter Plot', category: 'data',
    tone: 'light', tags: ['data', 'chart'],
    generate({ width: W, height: H }) {
      const dots = [
        { cx: 0.18, cy: 0.72, r: 14 }, { cx: 0.28, cy: 0.58, r: 18 }, { cx: 0.35, cy: 0.42, r: 22 },
        { cx: 0.45, cy: 0.65, r: 12 }, { cx: 0.52, cy: 0.35, r: 28 }, { cx: 0.61, cy: 0.28, r: 16 },
        { cx: 0.69, cy: 0.48, r: 20 }, { cx: 0.76, cy: 0.22, r: 32 }, { cx: 0.82, cy: 0.38, r: 14 },
      ];
      const left = W * 0.1, base = H * 0.82;
      return [
        makeText({ content: 'Market Share vs Growth Rate', x: W * 0.05, y: H * 0.05, width: W * 0.7, fontSize: 30, fontStyle: 'bold', fill: '#0f172a' }),
        makeRect({ x: left, y: H * 0.18, width: 2, height: base - H * 0.18, fill: '#e2e8f0', cornerRadius: 1 }),
        makeRect({ x: left, y: base, width: W * 0.82, height: 2, fill: '#e2e8f0', cornerRadius: 1 }),
        makeText({ content: 'Market Share →', x: W * 0.35, y: H * 0.88, width: W * 0.3, fontSize: 12, fill: '#94a3b8', align: 'center' }),
        makeText({ content: '↑ Growth', x: W * 0.02, y: H * 0.48, width: 60, fontSize: 12, fill: '#94a3b8', align: 'center', rotation: -90 }),
        ...dots.map((d) => makeEllipse({ x: left + d.cx * W * 0.82 - d.r, y: base - (1 - d.cy) * (base - H * 0.18) - d.r, width: d.r * 2, height: d.r * 2, fill: '#7c3aed', opacity: 0.6 })),
      ];
    },
    apply: applyGeneric,
  },

  {
    id: 'financial-summary', name: 'Financial Summary', category: 'data',
    tone: 'light', tags: ['data', 'financial'],
    generate({ width: W, height: H }) {
      const metrics = [
        { label: 'Total Revenue', val: '$24.8M', sub: 'FY 2024' },
        { label: 'Gross Margin', val: '74%', sub: 'vs 68% prior year' },
        { label: 'EBITDA', val: '$6.2M', sub: '25% margin' },
        { label: 'Cash on Hand', val: '$18.4M', sub: '14 months runway' },
      ];
      return [
        makeRect({ x: 0, y: 0, width: W, height: H * 0.2, fill: '#0f172a', cornerRadius: 0 }),
        makeText({ content: 'Financial Summary — FY 2024', x: W * 0.05, y: H * 0.05, width: W * 0.7, fontSize: 32, fontStyle: 'bold', fill: '#ffffff' }),
        makeText({ content: 'All figures in USD · Unaudited', x: W * 0.05, y: H * 0.13, width: W * 0.5, fontSize: 14, fill: '#94a3b8' }),
        ...metrics.flatMap((m, i) => {
          const cx = W * 0.05 + i * (W * 0.235);
          return [
            makeRect({ x: cx, y: H * 0.26, width: W * 0.21, height: H * 0.3, fill: '#ffffff', cornerRadius: 12, stroke: '#e2e8f0', strokeWidth: 1 }),
            makeText({ content: m.label, x: cx + 12, y: H * 0.3, width: W * 0.18, fontSize: 13, fill: '#64748b', fontStyle: 'bold' }),
            makeText({ content: m.val, x: cx + 12, y: H * 0.38, width: W * 0.18, fontSize: 30, fontStyle: 'bold', fill: '#0f172a' }),
            makeText({ content: m.sub, x: cx + 12, y: H * 0.49, width: W * 0.18, fontSize: 12, fill: '#7c3aed' }),
          ];
        }),
        makeRect({ x: W * 0.05, y: H * 0.63, width: W * 0.9, height: H * 0.3, fill: '#f8fafc', cornerRadius: 10, stroke: '#e2e8f0', strokeWidth: 1 }),
        makeText({ content: 'Revenue mix: Enterprise 62%  ·  Mid-Market 28%  ·  SMB 10%', x: W * 0.1, y: H * 0.72, width: W * 0.8, fontSize: 16, fill: '#334155', align: 'center' }),
        makeText({ content: 'Gross margin expansion driven by cloud infrastructure optimization and pricing adjustments effective Q3.', x: W * 0.1, y: H * 0.82, width: W * 0.8, fontSize: 14, fill: '#64748b', align: 'center' }),
      ];
    },
    apply: applyGeneric,
  },

  {
    id: 'kpi-grid', name: 'KPI Grid', category: 'data',
    tone: 'light', tags: ['data', 'kpi', 'dashboard'],
    generate({ width: W, height: H }) {
      const kpis = [
        { label: 'Monthly Active Users', val: '284K', delta: '↑ 34%', color: '#7c3aed' },
        { label: 'Avg Session Length', val: '18 min', delta: '↑ 12%', color: '#0891b2' },
        { label: 'Conversion Rate', val: '3.8%', delta: '↑ 0.6pp', color: '#10b981' },
        { label: 'Support CSAT', val: '94%', delta: '↑ 3pp', color: '#f59e0b' },
        { label: 'API Uptime', val: '99.97%', delta: '→ Stable', color: '#6366f1' },
        { label: 'Avg Revenue/User', val: '$42', delta: '↑ 18%', color: '#ec4899' },
      ];
      return [
        makeText({ content: 'Key Performance Indicators', x: W * 0.05, y: H * 0.05, width: W * 0.9, fontSize: 32, fontStyle: 'bold', fill: '#0f172a' }),
        makeText({ content: 'Q2 2024 vs Q2 2023', x: W * 0.05, y: H * 0.15, width: W * 0.4, fontSize: 14, fill: '#64748b' }),
        ...kpis.flatMap((k, i) => {
          const col = i % 3, row = Math.floor(i / 3);
          const cx = W * 0.05 + col * (W * 0.31);
          const cy = H * 0.26 + row * (H * 0.33);
          return [
            makeRect({ x: cx, y: cy, width: W * 0.28, height: H * 0.28, fill: '#ffffff', cornerRadius: 12, stroke: k.color + '44', strokeWidth: 2 }),
            makeRect({ x: cx, y: cy, width: W * 0.28, height: 5, fill: k.color, cornerRadius: 2 }),
            makeText({ content: k.label, x: cx + 14, y: cy + H * 0.06, width: W * 0.22, fontSize: 12, fill: '#64748b', fontStyle: 'bold' }),
            makeText({ content: k.val, x: cx + 14, y: cy + H * 0.12, width: W * 0.22, fontSize: 28, fontStyle: 'bold', fill: '#0f172a' }),
            makeText({ content: k.delta, x: cx + 14, y: cy + H * 0.2, width: W * 0.22, fontSize: 13, fontStyle: 'bold', fill: '#10b981' }),
          ];
        }),
      ];
    },
    apply: applyGeneric,
  },

  {
    id: 'funnel', name: 'Funnel Chart', category: 'data',
    tone: 'light', tags: ['data', 'chart', 'process'],
    generate({ width: W, height: H }) {
      const stages = [
        { label: 'Awareness', val: '120,000', pct: '100%', w: 0.7 },
        { label: 'Interest', val: '48,000', pct: '40%', w: 0.56 },
        { label: 'Consideration', val: '18,000', pct: '15%', w: 0.42 },
        { label: 'Intent', val: '6,000', pct: '5%', w: 0.28 },
        { label: 'Purchase', val: '1,800', pct: '1.5%', w: 0.14 },
      ];
      const colors = ['#0f172a', '#1e3a5f', '#1d4ed8', '#4f46e5', '#7c3aed'];
      const stageH = H * 0.14, topY = H * 0.22;
      return [
        makeText({ content: 'Sales Funnel — Q2 2024', x: W * 0.05, y: H * 0.05, width: W * 0.9, fontSize: 32, fontStyle: 'bold', fill: '#0f172a' }),
        ...stages.flatMap((s, i) => {
          const fw = W * s.w, fx = (W - fw) / 2;
          return [
            makeRect({ x: fx, y: topY + i * stageH, width: fw, height: stageH * 0.85, fill: colors[i], cornerRadius: 4 }),
            makeText({ content: s.label, x: fx + 16, y: topY + i * stageH + stageH * 0.2, width: fw * 0.4, fontSize: 16, fontStyle: 'bold', fill: '#ffffff' }),
            makeText({ content: s.val, x: fx + fw * 0.5, y: topY + i * stageH + stageH * 0.2, width: fw * 0.25, fontSize: 16, fontStyle: 'bold', fill: '#ffffff', align: 'center' }),
            makeText({ content: s.pct, x: fx + fw * 0.78, y: topY + i * stageH + stageH * 0.2, width: fw * 0.18, fontSize: 16, fontStyle: 'bold', fill: '#a5b4fc', align: 'right' }),
          ];
        }),
      ];
    },
    apply: applyGeneric,
  },

  {
    id: 'donut-chart', name: 'Donut Chart', category: 'data',
    tone: 'light', tags: ['data', 'chart'],
    generate({ width: W, height: H }) {
      const segments = [
        { label: 'Enterprise', pct: '54%', color: '#7c3aed' },
        { label: 'Mid-Market', pct: '28%', color: '#0891b2' },
        { label: 'SMB', pct: '12%', color: '#10b981' },
        { label: 'Other', pct: '6%', color: '#e2e8f0' },
      ];
      const cx = W * 0.3, cy = H * 0.54, r = H * 0.3;
      return [
        makeText({ content: 'Revenue by Segment', x: W * 0.05, y: H * 0.06, width: W * 0.9, fontSize: 32, fontStyle: 'bold', fill: '#0f172a' }),
        makeEllipse({ x: cx - r, y: cy - r, width: r * 2, height: r * 2, fill: '#7c3aed' }),
        makeEllipse({ x: cx - r * 0.75, y: cy - r * 0.75, width: r * 1.5, height: r * 1.5, fill: '#0891b2' }),
        makeEllipse({ x: cx - r * 0.55, y: cy - r * 0.55, width: r * 1.1, height: r * 1.1, fill: '#10b981' }),
        makeEllipse({ x: cx - r * 0.4, y: cy - r * 0.4, width: r * 0.8, height: r * 0.8, fill: '#f1f5f9' }),
        makeEllipse({ x: cx - r * 0.28, y: cy - r * 0.28, width: r * 0.56, height: r * 0.56, fill: '#ffffff' }),
        makeText({ content: '54%', x: cx - 30, y: cy - 18, width: 60, fontSize: 22, fontStyle: 'bold', align: 'center', fill: '#0f172a' }),
        ...segments.map((s, i) => [
          makeRect({ x: W * 0.58, y: H * 0.32 + i * (H * 0.13), width: 16, height: 16, fill: s.color, cornerRadius: 4 }),
          makeText({ content: `${s.label}`, x: W * 0.61, y: H * 0.318 + i * (H * 0.13), width: W * 0.2, fontSize: 16, fill: '#334155' }),
          makeText({ content: s.pct, x: W * 0.82, y: H * 0.318 + i * (H * 0.13), width: W * 0.1, fontSize: 16, fontStyle: 'bold', fill: '#0f172a', align: 'right' }),
        ]).flat(),
      ];
    },
    apply: applyGeneric,
  },

  // ═══════════════ VISUALS & MEDIA ═══════════════

  {
    id: 'full-bleed-image', name: 'Full-Bleed Image', category: 'visual',
    tone: 'dark', tags: ['image', 'minimal', 'impact'],
    generate({ width: W, height: H }) {
      return [
        makeRect({ x: 0, y: 0, width: W, height: H, fill: '#1e293b', cornerRadius: 0 }),
        makeText({ content: '[ Insert full-width image here ]', x: 0, y: 0, width: W, height: H, fontSize: 18, align: 'center', fill: '#475569' }),
        makeRect({ x: 0, y: H * 0.65, width: W, height: H * 0.35, fill: '#000000', cornerRadius: 0, opacity: 0.5 }),
        makeText({ content: 'Powerful headline over image', x: W * 0.06, y: H * 0.7, width: W * 0.7, fontSize: 42, fontStyle: 'bold', fill: '#ffffff' }),
        makeText({ content: 'Add caption or supporting text here', x: W * 0.06, y: H * 0.87, width: W * 0.5, fontSize: 17, fill: '#cbd5e1' }),
      ];
    },
    apply: applyGeneric,
  },

  {
    id: 'picture-caption', name: 'Picture with Caption', category: 'visual',
    tone: 'light', tags: ['image', 'minimal'],
    generate({ width: W, height: H }) {
      return [
        makeText({ content: 'Visual Reference', x: W * 0.05, y: H * 0.05, width: W * 0.9, fontSize: 32, fontStyle: 'bold', fill: '#0f172a' }),
        makeRect({ x: W * 0.05, y: H * 0.2, width: W * 0.58, height: H * 0.65, fill: '#e2e8f0', cornerRadius: 12 }),
        makeText({ content: '[ Insert image ]', x: W * 0.05, y: H * 0.48, width: W * 0.58, fontSize: 16, align: 'center', fill: '#94a3b8' }),
        makeText({ content: 'Caption or Insight', x: W * 0.67, y: H * 0.22, width: W * 0.28, fontSize: 22, fontStyle: 'bold', fill: '#0f172a' }),
        makeText({ content: 'Describe what this image shows and why it matters to your audience. Connect the visual to your core argument.', x: W * 0.67, y: H * 0.36, width: W * 0.28, fontSize: 15, fill: '#475569' }),
        makeRect({ x: W * 0.67, y: H * 0.64, width: W * 0.28, height: 3, fill: '#e2e8f0', cornerRadius: 2 }),
        makeText({ content: 'Fig. 1 — Source: Company Photography', x: W * 0.67, y: H * 0.69, width: W * 0.28, fontSize: 12, fill: '#94a3b8' }),
      ];
    },
    apply: applyGeneric,
  },

  {
    id: 'image-gallery', name: 'Image Gallery', category: 'visual',
    tone: 'light', tags: ['image'],
    generate({ width: W, height: H }) {
      const photos = [
        { x: 0.05, y: 0.22, w: 0.43, h: 0.7 },
        { x: 0.52, y: 0.22, w: 0.2, h: 0.32 },
        { x: 0.75, y: 0.22, w: 0.2, h: 0.32 },
        { x: 0.52, y: 0.6, w: 0.43, h: 0.32 },
      ];
      return [
        makeText({ content: 'Gallery', x: W * 0.05, y: H * 0.05, width: W * 0.9, fontSize: 32, fontStyle: 'bold', fill: '#0f172a' }),
        ...photos.map((p, i) => [
          makeRect({ x: W * p.x, y: H * p.y, width: W * p.w, height: H * p.h, fill: `hsl(${220 + i * 15}, 20%, ${88 - i * 5}%)`, cornerRadius: 10 }),
          makeText({ content: `Image ${i + 1}`, x: W * p.x, y: H * (p.y + p.h / 2) - 10, width: W * p.w, fontSize: 13, align: 'center', fill: '#94a3b8' }),
        ]).flat(),
      ];
    },
    apply: applyGeneric,
  },

  {
    id: 'video-placeholder', name: 'Video Placeholder', category: 'visual',
    tone: 'dark', tags: ['image', 'minimal'],
    generate({ width: W, height: H }) {
      return [
        makeText({ content: 'Product Demo', x: W * 0.05, y: H * 0.04, width: W * 0.9, fontSize: 32, fontStyle: 'bold', fill: '#0f172a' }),
        makeRect({ x: W * 0.05, y: H * 0.18, width: W * 0.9, height: H * 0.64, fill: '#0f172a', cornerRadius: 14 }),
        makeEllipse({ x: W * 0.44, y: H * 0.41, width: W * 0.12, height: W * 0.12 * (H / W), fill: '#7c3aed', opacity: 0.9 }),
        makeText({ content: '▶', x: W * 0.44, y: H * 0.43, width: W * 0.12, fontSize: 36, align: 'center', fill: '#ffffff' }),
        makeText({ content: 'Click to play · 2 min 34 sec', x: W * 0.25, y: H * 0.72, width: W * 0.5, fontSize: 14, align: 'center', fill: '#64748b' }),
        makeText({ content: 'Add a short description of what the video covers and the key takeaway for viewers.', x: W * 0.1, y: H * 0.87, width: W * 0.8, fontSize: 14, align: 'center', fill: '#475569' }),
      ];
    },
    apply: applyGeneric,
  },

  {
    id: 'icon-grid', name: 'Icon Grid', category: 'visual',
    tone: 'light', tags: ['visual', 'text-heavy'],
    generate({ width: W, height: H }) {
      const items = [
        { icon: '🔐', label: 'Security', body: 'SOC 2 Type II certified' },
        { icon: '⚡', label: 'Performance', body: '99th pct <40ms latency' },
        { icon: '🌍', label: 'Global', body: '12 regions worldwide' },
        { icon: '📊', label: 'Analytics', body: 'Real-time dashboards' },
        { icon: '🔗', label: 'Integrations', body: '200+ native connectors' },
        { icon: '🎯', label: 'Compliance', body: 'GDPR, HIPAA, FedRAMP' },
      ];
      return [
        makeText({ content: 'Platform Capabilities', x: W * 0.05, y: H * 0.05, width: W * 0.9, fontSize: 32, fontStyle: 'bold', fill: '#0f172a' }),
        ...items.flatMap((item, i) => {
          const col = i % 3, row = Math.floor(i / 3);
          const cx = W * 0.05 + col * (W * 0.32);
          const cy = H * 0.22 + row * (H * 0.35);
          return [
            makeRect({ x: cx, y: cy, width: W * 0.28, height: H * 0.3, fill: '#f8fafc', cornerRadius: 12, stroke: '#e2e8f0', strokeWidth: 1 }),
            makeText({ content: item.icon, x: cx + 16, y: cy + H * 0.05, width: 50, fontSize: 28 }),
            makeText({ content: item.label, x: cx + 16, y: cy + H * 0.14, width: W * 0.24, fontSize: 18, fontStyle: 'bold', fill: '#0f172a' }),
            makeText({ content: item.body, x: cx + 16, y: cy + H * 0.21, width: W * 0.24, fontSize: 13, fill: '#64748b' }),
          ];
        }),
      ];
    },
    apply: applyGeneric,
  },

  {
    id: 'device-mockup', name: 'Device Mockup', category: 'visual',
    tone: 'light', tags: ['image', 'visual', 'minimal'],
    generate({ width: W, height: H }) {
      const phoneW = W * 0.18, phoneH = H * 0.7;
      const laptopW = W * 0.46, laptopH = H * 0.5;
      return [
        makeText({ content: 'Built for Every Device', x: W * 0.05, y: H * 0.06, width: W * 0.52, fontSize: 34, fontStyle: 'bold', fill: '#0f172a' }),
        makeText({ content: 'Seamless experience across desktop, tablet, and mobile — no compromises.', x: W * 0.05, y: H * 0.2, width: W * 0.48, fontSize: 17, fill: '#475569' }),
        makeRect({ x: W * 0.07, y: H * 0.37, width: laptopW, height: laptopH, fill: '#1e293b', cornerRadius: 12 }),
        makeRect({ x: W * 0.09, y: H * 0.39, width: laptopW - W * 0.04, height: laptopH - H * 0.06, fill: '#e2e8f0', cornerRadius: 8 }),
        makeText({ content: 'Desktop View', x: W * 0.09, y: H * 0.59, width: laptopW - W * 0.04, fontSize: 14, align: 'center', fill: '#94a3b8' }),
        makeRect({ x: W * 0.74, y: H * 0.16, width: phoneW, height: phoneH, fill: '#1e293b', cornerRadius: 24 }),
        makeRect({ x: W * 0.75, y: H * 0.2, width: phoneW - W * 0.02, height: phoneH - H * 0.08, fill: '#e2e8f0', cornerRadius: 18 }),
        makeText({ content: 'Mobile', x: W * 0.75, y: H * 0.52, width: phoneW - W * 0.02, fontSize: 13, align: 'center', fill: '#94a3b8' }),
      ];
    },
    apply: applyGeneric,
  },

  {
    id: 'architecture-diagram', name: 'Architecture Diagram', category: 'visual',
    tone: 'light', tags: ['visual', 'process'],
    generate({ width: W, height: H }) {
      const layers = [
        { label: 'Frontend / Client Apps', color: '#7c3aed', y: H * 0.22 },
        { label: 'API Gateway & Load Balancer', color: '#0891b2', y: H * 0.4 },
        { label: 'Microservices Layer', color: '#10b981', y: H * 0.58 },
        { label: 'Data & Storage Layer', color: '#f59e0b', y: H * 0.76 },
      ];
      return [
        makeText({ content: 'System Architecture', x: W * 0.05, y: H * 0.05, width: W * 0.9, fontSize: 32, fontStyle: 'bold', fill: '#0f172a' }),
        ...layers.flatMap((l) => [
          makeRect({ x: W * 0.06, y: l.y, width: W * 0.88, height: H * 0.14, fill: l.color + '18', cornerRadius: 10, stroke: l.color + '44', strokeWidth: 2 }),
          makeText({ content: l.label, x: W * 0.1, y: l.y + H * 0.046, width: W * 0.8, fontSize: 16, fontStyle: 'bold', fill: l.color }),
        ]),
        makeRect({ x: W * 0.495, y: H * 0.36, width: 2, height: H * 0.04, fill: '#e2e8f0', cornerRadius: 1 }),
        makeRect({ x: W * 0.495, y: H * 0.54, width: 2, height: H * 0.04, fill: '#e2e8f0', cornerRadius: 1 }),
        makeRect({ x: W * 0.495, y: H * 0.72, width: 2, height: H * 0.04, fill: '#e2e8f0', cornerRadius: 1 }),
      ];
    },
    apply: applyGeneric,
  },

  {
    id: 'user-flow', name: 'User Flow', category: 'visual',
    tone: 'light', tags: ['process', 'visual'],
    generate({ width: W, height: H }) {
      const steps = ['Sign Up', 'Onboarding', 'Core Feature', 'Aha Moment', 'Retention'];
      const colors = ['#7c3aed', '#4f46e5', '#0891b2', '#0d9488', '#10b981'];
      const nodeW = W * 0.12, nodeH = H * 0.15;
      return [
        makeText({ content: 'User Flow — Core Journey', x: W * 0.05, y: H * 0.05, width: W * 0.9, fontSize: 30, fontStyle: 'bold', fill: '#0f172a' }),
        ...steps.flatMap((s, i) => {
          const x = W * 0.05 + i * (W * 0.19);
          const y = H * 0.35;
          return [
            makeRect({ x, y, width: nodeW, height: nodeH, fill: colors[i], cornerRadius: 10 }),
            makeText({ content: s, x, y: y + nodeH * 0.35, width: nodeW, fontSize: 14, fontStyle: 'bold', align: 'center', fill: '#ffffff' }),
            i < steps.length - 1 ? makeRect({ x: x + nodeW + 2, y: y + nodeH * 0.46, width: W * 0.07, height: 3, fill: '#e2e8f0', cornerRadius: 1 }) : null,
            makeEllipse({ x: x + nodeW * 0.35, y: y - H * 0.12, width: nodeW * 0.3, height: nodeW * 0.3, fill: colors[i] + '33' }),
            makeText({ content: String(i + 1), x: x + nodeW * 0.35, y: y - H * 0.11, width: nodeW * 0.3, fontSize: 14, fontStyle: 'bold', align: 'center', fill: colors[i] }),
          ].filter(Boolean);
        }),
        makeText({ content: 'Average time to Aha Moment: 4.2 days  ·  D30 Retention: 62%', x: W * 0.15, y: H * 0.74, width: W * 0.7, fontSize: 15, align: 'center', fill: '#64748b' }),
      ];
    },
    apply: applyGeneric,
  },

  {
    id: 'before-after', name: 'Before & After', category: 'visual',
    tone: 'light', tags: ['split', 'visual', 'impact'],
    generate({ width: W, height: H }) {
      return [
        makeText({ content: 'Before & After', x: W * 0.05, y: H * 0.05, width: W * 0.9, fontSize: 32, fontStyle: 'bold', fill: '#0f172a' }),
        makeRect({ x: W * 0.05, y: H * 0.2, width: W * 0.43, height: H * 0.66, fill: '#fef2f2', cornerRadius: 12, stroke: '#fca5a5', strokeWidth: 2 }),
        makeText({ content: 'BEFORE', x: W * 0.05, y: H * 0.22, width: W * 0.43, fontSize: 14, fontStyle: 'bold', align: 'center', fill: '#ef4444' }),
        makeText({ content: '● Manual, error-prone processes\n● 3-week reporting cycle\n● No visibility into real-time data\n● Siloed teams and tools', x: W * 0.09, y: H * 0.34, width: W * 0.35, fontSize: 17, fill: '#7f1d1d' }),
        makeRect({ x: W * 0.52, y: H * 0.2, width: W * 0.43, height: H * 0.66, fill: '#f0fdf4', cornerRadius: 12, stroke: '#86efac', strokeWidth: 2 }),
        makeText({ content: 'AFTER', x: W * 0.52, y: H * 0.22, width: W * 0.43, fontSize: 14, fontStyle: 'bold', align: 'center', fill: '#10b981' }),
        makeText({ content: '● Automated workflows, zero errors\n● Real-time dashboards & alerts\n● Single source of truth for all data\n● Unified platform, one login', x: W * 0.56, y: H * 0.34, width: W * 0.35, fontSize: 17, fill: '#14532d' }),
      ];
    },
    apply: applyGeneric,
  },

  // ═══════════════ PROCESS & TIMELINES ═══════════════

  {
    id: 'horizontal-timeline', name: 'Horizontal Timeline', category: 'process',
    tone: 'light', tags: ['timeline', 'process'],
    generate({ width: W, height: H }) {
      const events = [
        { year: '2020', label: 'Founded', body: 'Seed round' },
        { year: '2021', label: 'Series A', body: '$8M raised' },
        { year: '2022', label: 'Launch', body: 'Product GA' },
        { year: '2023', label: 'Series B', body: '$34M raised' },
        { year: '2024', label: '1,800+', body: 'Customers' },
      ];
      const y = H * 0.5, left = W * 0.07, right = W * 0.93;
      return [
        makeText({ content: 'Company Timeline', x: W * 0.05, y: H * 0.07, width: W * 0.9, fontSize: 32, fontStyle: 'bold', fill: '#0f172a' }),
        makeRect({ x: left, y: y - 2, width: right - left, height: 4, fill: '#e2e8f0', cornerRadius: 2 }),
        ...events.flatMap((e, i) => {
          const x = left + i * ((right - left) / (events.length - 1));
          const above = i % 2 === 0;
          return [
            makeEllipse({ x: x - 10, y: y - 10, width: 20, height: 20, fill: '#7c3aed' }),
            makeRect({ x: x - 1, y: above ? y - H * 0.22 : y + H * 0.02, width: 2, height: H * 0.2, fill: '#c4b5fd', cornerRadius: 1 }),
            makeText({ content: e.year, x: x - 36, y: above ? y - H * 0.3 : y + H * 0.23, width: 72, fontSize: 16, fontStyle: 'bold', align: 'center', fill: '#7c3aed' }),
            makeText({ content: e.label, x: x - 50, y: above ? y - H * 0.22 : y + H * 0.32, width: 100, fontSize: 14, fontStyle: 'bold', align: 'center', fill: '#0f172a' }),
            makeText({ content: e.body, x: x - 50, y: above ? y - H * 0.14 : y + H * 0.4, width: 100, fontSize: 12, align: 'center', fill: '#64748b' }),
          ];
        }),
      ];
    },
    apply: applyGeneric,
  },

  {
    id: 'vertical-timeline', name: 'Vertical Timeline', category: 'process',
    tone: 'light', tags: ['timeline', 'process', 'text-heavy'],
    generate({ width: W, height: H }) {
      const steps = [
        { label: 'Discovery & Research', body: 'User interviews, market analysis, competitive benchmarking', date: 'Week 1–2' },
        { label: 'Design & Prototyping', body: 'Wireframes, high-fidelity mockups, stakeholder review', date: 'Week 3–5' },
        { label: 'Development Sprint', body: 'Agile sprints, QA testing, code review and staging', date: 'Week 6–10' },
        { label: 'Launch & Measure', body: 'Phased rollout, analytics monitoring, iteration loop', date: 'Week 11–12' },
      ];
      const lineX = W * 0.08;
      return [
        makeText({ content: 'Project Roadmap', x: W * 0.05, y: H * 0.05, width: W * 0.9, fontSize: 32, fontStyle: 'bold', fill: '#0f172a' }),
        makeRect({ x: lineX - 1, y: H * 0.19, width: 2, height: H * 0.73, fill: '#e2e8f0', cornerRadius: 1 }),
        ...steps.flatMap((s, i) => {
          const y = H * 0.2 + i * (H * 0.19);
          return [
            makeEllipse({ x: lineX - 10, y: y - 10, width: 20, height: 20, fill: '#7c3aed' }),
            makeText({ content: s.date, x: W * 0.12, y: y - 10, width: W * 0.2, fontSize: 12, fontStyle: 'bold', fill: '#7c3aed' }),
            makeText({ content: s.label, x: W * 0.12, y: y + H * 0.025, width: W * 0.82, fontSize: 20, fontStyle: 'bold', fill: '#0f172a' }),
            makeText({ content: s.body, x: W * 0.12, y: y + H * 0.085, width: W * 0.82, fontSize: 14, fill: '#475569' }),
          ];
        }),
      ];
    },
    apply: applyGeneric,
  },

  {
    id: 'chevron-steps', name: 'Chevron Steps', category: 'process',
    tone: 'light', tags: ['process', 'timeline'],
    generate({ width: W, height: H }) {
      const steps = ['Assess', 'Plan', 'Build', 'Launch', 'Grow'];
      const colors = ['#0f172a', '#1e3a5f', '#1d4ed8', '#4f46e5', '#7c3aed'];
      const stepW = W * 0.185, stepH = H * 0.22, topY = H * 0.36;
      return [
        makeText({ content: 'Implementation Phases', x: W * 0.05, y: H * 0.07, width: W * 0.9, fontSize: 32, fontStyle: 'bold', fill: '#0f172a' }),
        ...steps.flatMap((s, i) => {
          const x = W * 0.02 + i * (stepW - W * 0.02);
          return [
            makeRect({ x, y: topY, width: stepW, height: stepH, fill: colors[i], cornerRadius: i === 0 ? 8 : 0 }),
            makeText({ content: String(i + 1), x, y: topY + H * 0.03, width: stepW * 0.9, fontSize: 28, fontStyle: 'bold', align: 'center', fill: '#ffffff66' }),
            makeText({ content: s, x, y: topY + H * 0.12, width: stepW * 0.9, fontSize: 18, fontStyle: 'bold', align: 'center', fill: '#ffffff' }),
          ];
        }),
        makeText({ content: 'Avg 12-week end-to-end delivery with dedicated customer success team', x: W * 0.1, y: H * 0.66, width: W * 0.8, fontSize: 16, align: 'center', fill: '#64748b' }),
      ];
    },
    apply: applyGeneric,
  },

  {
    id: 'circular-lifecycle', name: 'Circular Lifecycle', category: 'process',
    tone: 'light', tags: ['process', 'visual'],
    generate({ width: W, height: H }) {
      const stages = ['Plan', 'Build', 'Test', 'Deploy', 'Monitor', 'Improve'];
      const cx = W * 0.5, cy = H * 0.55, r = H * 0.3;
      return [
        makeText({ content: 'Continuous Improvement Cycle', x: W * 0.05, y: H * 0.05, width: W * 0.9, fontSize: 30, fontStyle: 'bold', fill: '#0f172a' }),
        makeEllipse({ x: cx - r, y: cy - r, width: r * 2, height: r * 2, fill: '#f8fafc', stroke: '#e2e8f0', strokeWidth: 3 }),
        makeEllipse({ x: cx - r * 0.38, y: cy - r * 0.38, width: r * 0.76, height: r * 0.76, fill: '#ffffff', stroke: '#7c3aed', strokeWidth: 4 }),
        makeText({ content: 'AGILE\nDELIVERY', x: cx - 44, y: cy - 22, width: 88, fontSize: 13, fontStyle: 'bold', align: 'center', fill: '#7c3aed' }),
        ...stages.map((s, i) => {
          const angle = (i / stages.length) * Math.PI * 2 - Math.PI / 2;
          const lx = cx + Math.cos(angle) * (r * 0.78) - 40;
          const ly = cy + Math.sin(angle) * (r * 0.78) - 14;
          return makeText({ content: s, x: lx, y: ly, width: 80, fontSize: 14, fontStyle: 'bold', align: 'center', fill: '#0f172a' });
        }),
      ];
    },
    apply: applyGeneric,
  },

  {
    id: 'gantt', name: 'Gantt Chart', category: 'process',
    tone: 'light', tags: ['timeline', 'process', 'data'],
    generate({ width: W, height: H }) {
      const tasks = [
        { label: 'Discovery', start: 0, dur: 2, color: '#7c3aed' },
        { label: 'Design', start: 1.5, dur: 2.5, color: '#0891b2' },
        { label: 'Development', start: 3, dur: 5, color: '#4f46e5' },
        { label: 'QA & Testing', start: 6.5, dur: 2, color: '#10b981' },
        { label: 'Launch', start: 8, dur: 1.5, color: '#f59e0b' },
      ];
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'];
      const labelW = W * 0.18, chartW = W * 0.74, left = W * 0.06 + labelW;
      const rowH = H * 0.11, topY = H * 0.26, totalM = 10;
      return [
        makeText({ content: 'Project Timeline', x: W * 0.05, y: H * 0.07, width: W * 0.6, fontSize: 30, fontStyle: 'bold', fill: '#0f172a' }),
        makeRect({ x: W * 0.06, y: topY - H * 0.07, width: W * 0.88, height: H * 0.07, fill: '#0f172a', cornerRadius: 8 }),
        ...months.slice(0, totalM).map((m, i) => makeText({ content: m, x: left + (i / totalM) * chartW, y: topY - H * 0.06, width: chartW / totalM, fontSize: 11, fontStyle: 'bold', align: 'center', fill: '#94a3b8' })),
        ...tasks.flatMap((t, i) => {
          const y = topY + i * rowH;
          const barX = left + (t.start / totalM) * chartW;
          const barW = (t.dur / totalM) * chartW;
          return [
            makeRect({ x: W * 0.06, y, width: W * 0.88, height: rowH * 0.85, fill: i % 2 === 0 ? '#f8fafc' : '#ffffff', cornerRadius: 0, stroke: '#e2e8f0', strokeWidth: 1 }),
            makeText({ content: t.label, x: W * 0.08, y: y + rowH * 0.24, width: labelW - 16, fontSize: 13, fill: '#334155', fontStyle: 'bold' }),
            makeRect({ x: barX, y: y + rowH * 0.18, width: barW, height: rowH * 0.52, fill: t.color, cornerRadius: 4 }),
          ];
        }),
      ];
    },
    apply: applyGeneric,
  },

  {
    id: 'product-roadmap', name: 'Product Roadmap', category: 'process',
    tone: 'light', tags: ['timeline', 'process'],
    generate({ width: W, height: H }) {
      const quarters = ['Q1 2025', 'Q2 2025', 'Q3 2025', 'Q4 2025'];
      const lanes = [
        { label: 'Core Product', items: ['SSO & SAML', 'Bulk Export', 'AI Suggestions', 'Custom Workflows'] },
        { label: 'Integrations', items: ['Salesforce v2', 'HubSpot Deep', 'Slack App', 'Zapier Actions'] },
        { label: 'Platform', items: ['Audit Logs', 'Role-Based Access', 'Multi-Org', 'SLA Guarantees'] },
      ];
      const qW = W * 0.2, laneH = H * 0.22, topY = H * 0.26, lLabelW = W * 0.14;
      const left = W * 0.04 + lLabelW;
      return [
        makeText({ content: 'Product Roadmap 2025', x: W * 0.05, y: H * 0.05, width: W * 0.9, fontSize: 30, fontStyle: 'bold', fill: '#0f172a' }),
        makeRect({ x: W * 0.04, y: topY - H * 0.07, width: W * 0.92, height: H * 0.07, fill: '#0f172a', cornerRadius: 8 }),
        ...quarters.map((q, i) => makeText({ content: q, x: left + i * qW, y: topY - H * 0.055, width: qW, fontSize: 13, fontStyle: 'bold', align: 'center', fill: '#94a3b8' })),
        ...lanes.flatMap((lane, li) => {
          const y = topY + li * laneH;
          const colors = ['#7c3aed', '#0891b2', '#10b981'];
          return [
            makeRect({ x: W * 0.04, y, width: W * 0.92, height: laneH * 0.88, fill: li % 2 === 0 ? '#f8fafc' : '#f0f9ff', cornerRadius: 0, stroke: '#e2e8f0', strokeWidth: 1 }),
            makeText({ content: lane.label, x: W * 0.05, y: y + laneH * 0.3, width: lLabelW, fontSize: 12, fontStyle: 'bold', fill: colors[li] }),
            ...lane.items.map((item, qi) => makeRect({ x: left + qi * qW + qW * 0.05, y: y + laneH * 0.18, width: qW * 0.85, height: laneH * 0.55, fill: colors[li], cornerRadius: 6, opacity: 0.85 })),
            ...lane.items.map((item, qi) => makeText({ content: item, x: left + qi * qW + qW * 0.08, y: y + laneH * 0.3, width: qW * 0.78, fontSize: 11, fontStyle: 'bold', fill: '#ffffff' })),
          ];
        }),
      ];
    },
    apply: applyGeneric,
  },

  {
    id: 'swimlane', name: 'Swimlane Diagram', category: 'process',
    tone: 'light', tags: ['process', 'data'],
    generate({ width: W, height: H }) {
      const lanes = [
        { label: 'Customer', color: '#7c3aed', steps: ['Submit Request', '', 'Review Draft', '', 'Approve & Sign'] },
        { label: 'Sales Team', color: '#0891b2', steps: ['', 'Qualify & Scope', '', 'Prepare Proposal', ''] },
        { label: 'Engineering', color: '#10b981', steps: ['', '', '', 'Technical Review', ''] },
      ];
      const stepsN = 5, laneH = H * 0.24, topY = H * 0.2, lLabelW = W * 0.14;
      const stepW = (W * 0.82) / stepsN, left = W * 0.06 + lLabelW;
      return [
        makeText({ content: 'Sales Process Swimlane', x: W * 0.05, y: H * 0.05, width: W * 0.9, fontSize: 28, fontStyle: 'bold', fill: '#0f172a' }),
        ...lanes.flatMap((lane, li) => {
          const y = topY + li * laneH;
          return [
            makeRect({ x: W * 0.06, y, width: W * 0.88, height: laneH * 0.9, fill: li % 2 === 0 ? '#f8fafc' : '#ffffff', cornerRadius: 0, stroke: '#e2e8f0', strokeWidth: 1 }),
            makeRect({ x: W * 0.06, y, width: lLabelW, height: laneH * 0.9, fill: lane.color + '22', cornerRadius: 0 }),
            makeText({ content: lane.label, x: W * 0.06 + 4, y: y + laneH * 0.33, width: lLabelW - 8, fontSize: 13, fontStyle: 'bold', align: 'center', fill: lane.color }),
            ...lane.steps.flatMap((step, si) => step ? [
              makeRect({ x: left + si * stepW + stepW * 0.05, y: y + laneH * 0.12, width: stepW * 0.85, height: laneH * 0.65, fill: lane.color, cornerRadius: 8 }),
              makeText({ content: step, x: left + si * stepW + stepW * 0.07, y: y + laneH * 0.32, width: stepW * 0.8, fontSize: 12, fontStyle: 'bold', align: 'center', fill: '#ffffff' }),
            ] : []),
          ];
        }),
      ];
    },
    apply: applyGeneric,
  },

  // ═══════════════ STRATEGY & FRAMEWORKS ═══════════════

  {
    id: 'swot', name: 'SWOT Analysis', category: 'strategy',
    tone: 'light', tags: ['strategy', 'framework'],
    generate({ width: W, height: H }) {
      const quads = [
        { label: 'Strengths', color: '#10b981', body: '· Market-leading retention\n· 180+ enterprise customers\n· Proprietary AI technology' },
        { label: 'Weaknesses', color: '#f59e0b', body: '· Limited brand awareness\n· SMB segment underdeveloped\n· Long enterprise sales cycle' },
        { label: 'Opportunities', color: '#0891b2', body: '· $4B TAM expanding fast\n· AI-driven product differentiation\n· International expansion ready' },
        { label: 'Threats', color: '#ef4444', body: '· Big tech entering the space\n· Regulatory headwinds in EU\n· Talent competition increasing' },
      ];
      return [
        makeText({ content: 'SWOT Analysis', x: W * 0.05, y: H * 0.04, width: W * 0.9, fontSize: 32, fontStyle: 'bold', fill: '#0f172a' }),
        makeRect({ x: W * 0.495, y: H * 0.16, width: 2, height: H * 0.78, fill: '#e2e8f0', cornerRadius: 1 }),
        makeRect({ x: W * 0.05, y: H * 0.54, width: W * 0.9, height: 2, fill: '#e2e8f0', cornerRadius: 1 }),
        ...quads.flatMap((q, i) => {
          const col = i % 2, row = Math.floor(i / 2);
          const cx = W * 0.05 + col * (W * 0.46);
          const cy = H * 0.16 + row * (H * 0.39);
          return [
            makeRect({ x: cx, y: cy, width: W * 0.44, height: H * 0.36, fill: q.color + '10', cornerRadius: 8 }),
            makeText({ content: q.label, x: cx + 14, y: cy + H * 0.04, width: W * 0.38, fontSize: 20, fontStyle: 'bold', fill: q.color }),
            makeText({ content: q.body, x: cx + 14, y: cy + H * 0.12, width: W * 0.38, fontSize: 14, fill: '#334155' }),
          ];
        }),
      ];
    },
    apply: applyGeneric,
  },

  {
    id: 'competitor-quadrant', name: 'Competitor Quadrant', category: 'strategy',
    tone: 'light', tags: ['strategy', 'data', 'chart'],
    generate({ width: W, height: H }) {
      const players = [
        { name: 'Us', x: 0.72, y: 0.22, r: 22, color: '#7c3aed', bold: true },
        { name: 'Rival A', x: 0.55, y: 0.38, r: 16, color: '#64748b', bold: false },
        { name: 'Rival B', x: 0.3, y: 0.28, r: 18, color: '#64748b', bold: false },
        { name: 'Rival C', x: 0.42, y: 0.68, r: 14, color: '#64748b', bold: false },
        { name: 'Legacy', x: 0.22, y: 0.74, r: 20, color: '#94a3b8', bold: false },
      ];
      const left = W * 0.1, top = H * 0.2, right = W * 0.92, base = H * 0.88;
      const cx = (left + right) / 2, cy = (top + base) / 2;
      return [
        makeText({ content: 'Competitive Landscape', x: W * 0.05, y: H * 0.05, width: W * 0.9, fontSize: 30, fontStyle: 'bold', fill: '#0f172a' }),
        makeRect({ x: cx - 1, y: top, width: 2, height: base - top, fill: '#e2e8f0', cornerRadius: 1 }),
        makeRect({ x: left, y: cy - 1, width: right - left, height: 2, fill: '#e2e8f0', cornerRadius: 1 }),
        makeText({ content: '← Feature Depth →', x: left, y: base + H * 0.02, width: right - left, fontSize: 11, align: 'center', fill: '#94a3b8' }),
        makeText({ content: '↑ Market Presence', x: W * 0.01, y: cy - 30, width: 70, fontSize: 11, fill: '#94a3b8', rotation: -90 }),
        makeText({ content: 'Challengers', x: left, y: top + H * 0.01, width: (right - left) / 2, fontSize: 11, fill: '#94a3b8', align: 'center' }),
        makeText({ content: 'Leaders', x: cx, y: top + H * 0.01, width: (right - left) / 2, fontSize: 11, fontStyle: 'bold', fill: '#7c3aed', align: 'center' }),
        makeText({ content: 'Niche', x: left, y: cy + H * 0.01, width: (right - left) / 2, fontSize: 11, fill: '#94a3b8', align: 'center' }),
        makeText({ content: 'Visionaries', x: cx, y: cy + H * 0.01, width: (right - left) / 2, fontSize: 11, fill: '#94a3b8', align: 'center' }),
        ...players.flatMap((p) => {
          const px = left + p.x * (right - left) - p.r;
          const py = top + p.y * (base - top) - p.r;
          return [
            makeEllipse({ x: px, y: py, width: p.r * 2, height: p.r * 2, fill: p.color }),
            makeText({ content: p.name, x: px - 20, y: py + p.r * 2 + 4, width: p.r * 2 + 40, fontSize: 12, fontStyle: p.bold ? 'bold' : 'normal', align: 'center', fill: p.color }),
          ];
        }),
      ];
    },
    apply: applyGeneric,
  },

  {
    id: 'persona', name: 'Customer Persona', category: 'strategy',
    tone: 'light', tags: ['strategy', 'image'],
    generate({ width: W, height: H }) {
      const avatarD = H * 0.28;
      return [
        makeRect({ x: 0, y: 0, width: W * 0.34, height: H, fill: '#0f172a', cornerRadius: 0 }),
        makeEllipse({ x: W * 0.07, y: H * 0.15, width: avatarD, height: avatarD, fill: '#1e3a5f' }),
        makeText({ content: '👤', x: W * 0.07, y: H * 0.25, width: avatarD, fontSize: 40, align: 'center' }),
        makeText({ content: 'Marcus Taylor', x: W * 0.04, y: H * 0.5, width: W * 0.26, fontSize: 24, fontStyle: 'bold', fill: '#ffffff', align: 'center' }),
        makeText({ content: 'VP of Engineering', x: W * 0.04, y: H * 0.62, width: W * 0.26, fontSize: 14, fill: '#7c3aed', align: 'center' }),
        makeText({ content: 'SaaS · 500-2K employees · Series B', x: W * 0.04, y: H * 0.7, width: W * 0.26, fontSize: 12, fill: '#64748b', align: 'center' }),
        makeText({ content: 'Goals & Motivations', x: W * 0.38, y: H * 0.08, width: W * 0.26, fontSize: 16, fontStyle: 'bold', fill: '#0f172a' }),
        makeText({ content: '· Ship faster with fewer incidents\n· Keep team velocity high\n· Earn trust of the C-suite', x: W * 0.38, y: H * 0.18, width: W * 0.26, fontSize: 14, fill: '#475569' }),
        makeText({ content: 'Pain Points', x: W * 0.38, y: H * 0.52, width: W * 0.26, fontSize: 16, fontStyle: 'bold', fill: '#ef4444' }),
        makeText({ content: '· Too many tools, no single view\n· Alert fatigue and false positives\n· Onboarding new devs takes weeks', x: W * 0.38, y: H * 0.62, width: W * 0.26, fontSize: 14, fill: '#475569' }),
        makeText({ content: 'Quote', x: W * 0.68, y: H * 0.08, width: W * 0.27, fontSize: 16, fontStyle: 'bold', fill: '#0f172a' }),
        makeRect({ x: W * 0.68, y: H * 0.19, width: W * 0.27, height: H * 0.46, fill: '#f8fafc', cornerRadius: 12, stroke: '#e2e8f0', strokeWidth: 1 }),
        makeText({ content: '"I don\'t need another dashboard. I need fewer surprises and faster answers when things go wrong."', x: W * 0.7, y: H * 0.27, width: W * 0.23, fontSize: 15, fill: '#334155' }),
      ];
    },
    apply: applyGeneric,
  },

  {
    id: 'pricing-tiers', name: 'Pricing Tiers', category: 'strategy',
    tone: 'light', tags: ['strategy', 'text-heavy'],
    generate({ width: W, height: H }) {
      const tiers = [
        { name: 'Starter', price: '$29', period: '/mo per seat', features: ['Up to 10 users', 'Core features', 'Email support', '5GB storage'], color: '#64748b', highlight: false },
        { name: 'Professional', price: '$79', period: '/mo per seat', features: ['Up to 100 users', 'All features', 'Priority support', '100GB storage', 'SSO & SAML'], color: '#7c3aed', highlight: true },
        { name: 'Enterprise', price: 'Custom', period: 'contact sales', features: ['Unlimited users', 'Custom features', 'Dedicated CSM', 'Unlimited storage', 'SLA guarantee'], color: '#0f172a', highlight: false },
      ];
      return [
        makeText({ content: 'Simple, Transparent Pricing', x: W * 0.05, y: H * 0.04, width: W * 0.9, fontSize: 32, fontStyle: 'bold', fill: '#0f172a', align: 'center' }),
        makeText({ content: 'All plans include a 14-day free trial · No credit card required', x: W * 0.15, y: H * 0.14, width: W * 0.7, fontSize: 15, fill: '#64748b', align: 'center' }),
        ...tiers.flatMap((t, i) => {
          const cx = W * 0.05 + i * (W * 0.31);
          return [
            makeRect({ x: cx, y: H * 0.22, width: W * 0.28, height: H * 0.7, fill: t.highlight ? t.color : '#ffffff', cornerRadius: 16, stroke: t.highlight ? 'none' : '#e2e8f0', strokeWidth: 1 }),
            t.highlight ? makeText({ content: 'Most Popular', x: cx, y: H * 0.23, width: W * 0.28, fontSize: 11, fontStyle: 'bold', align: 'center', fill: '#c4b5fd' }) : null,
            makeText({ content: t.name, x: cx + 16, y: H * (t.highlight ? 0.29 : 0.27), width: W * 0.24, fontSize: 18, fontStyle: 'bold', fill: t.highlight ? '#ffffff' : t.color }),
            makeText({ content: t.price, x: cx + 16, y: H * 0.38, width: W * 0.24, fontSize: 38, fontStyle: 'bold', fill: t.highlight ? '#ffffff' : '#0f172a' }),
            makeText({ content: t.period, x: cx + 16, y: H * 0.52, width: W * 0.24, fontSize: 13, fill: t.highlight ? '#c4b5fd' : '#64748b' }),
            makeRect({ x: cx + 16, y: H * 0.59, width: W * 0.2, height: 1, fill: t.highlight ? '#ffffff33' : '#e2e8f0', cornerRadius: 1 }),
            ...t.features.map((f, fi) => makeText({ content: '✓  ' + f, x: cx + 16, y: H * 0.63 + fi * (H * 0.07), width: W * 0.24, fontSize: 13, fill: t.highlight ? '#e0e7ff' : '#475569' })),
          ].filter(Boolean);
        }),
      ];
    },
    apply: applyGeneric,
  },

  {
    id: 'org-chart', name: 'Org Chart', category: 'strategy',
    tone: 'light', tags: ['strategy', 'team'],
    generate({ width: W, height: H }) {
      const ceoX = W * 0.43, ceoY = H * 0.1, boxW = W * 0.14, boxH = H * 0.13;
      const vps = [
        { label: 'CTO', sub: 'Technology', x: W * 0.1 },
        { label: 'CFO', sub: 'Finance', x: W * 0.29 },
        { label: 'CMO', sub: 'Marketing', x: W * 0.57 },
        { label: 'CRO', sub: 'Revenue', x: W * 0.76 },
      ];
      const dirY = H * 0.62;
      const dirs = [
        { label: 'Eng Lead', x: W * 0.04 }, { label: 'Product', x: W * 0.2 },
        { label: 'Analytics', x: W * 0.36 }, { label: 'Growth', x: W * 0.52 },
        { label: 'Sales', x: W * 0.68 }, { label: 'Success', x: W * 0.82 },
      ];
      return [
        makeRect({ x: ceoX, y: ceoY, width: boxW, height: boxH, fill: '#0f172a', cornerRadius: 10 }),
        makeText({ content: 'CEO', x: ceoX, y: ceoY + H * 0.03, width: boxW, fontSize: 18, fontStyle: 'bold', align: 'center', fill: '#ffffff' }),
        makeText({ content: 'Executive', x: ceoX, y: ceoY + H * 0.075, width: boxW, fontSize: 12, align: 'center', fill: '#94a3b8' }),
        makeRect({ x: ceoX + boxW / 2 - 1, y: ceoY + boxH, width: 2, height: H * 0.14, fill: '#e2e8f0', cornerRadius: 1 }),
        makeRect({ x: W * 0.17, y: H * 0.37, width: W * 0.66, height: 2, fill: '#e2e8f0', cornerRadius: 1 }),
        ...vps.flatMap((v) => [
          makeRect({ x: v.x, y: H * 0.37, width: boxW, height: boxH, fill: '#7c3aed', cornerRadius: 10 }),
          makeText({ content: v.label, x: v.x, y: H * 0.4, width: boxW, fontSize: 16, fontStyle: 'bold', align: 'center', fill: '#ffffff' }),
          makeText({ content: v.sub, x: v.x, y: H * 0.455, width: boxW, fontSize: 11, align: 'center', fill: '#c4b5fd' }),
          makeRect({ x: v.x + boxW / 2 - 1, y: H * 0.37 + boxH, width: 2, height: H * 0.12, fill: '#e2e8f0', cornerRadius: 1 }),
        ]),
        makeRect({ x: W * 0.07, y: dirY - 2, width: W * 0.86, height: 2, fill: '#f1f5f9', cornerRadius: 1 }),
        ...dirs.flatMap((d) => [
          makeRect({ x: d.x, y: dirY, width: boxW, height: boxH * 0.8, fill: '#f1f5f9', cornerRadius: 8, stroke: '#e2e8f0', strokeWidth: 1 }),
          makeText({ content: d.label, x: d.x, y: dirY + H * 0.03, width: boxW, fontSize: 13, fontStyle: 'bold', align: 'center', fill: '#334155' }),
        ]),
      ];
    },
    apply: applyGeneric,
  },

  {
    id: 'meet-the-team', name: 'Meet the Team', category: 'strategy',
    tone: 'light', tags: ['team', 'image', 'strategy'],
    generate({ width: W, height: H }) {
      const members = [
        { name: 'Jane Smith', role: 'CEO & Co-founder', bg: '#7c3aed' },
        { name: 'Tom Lee', role: 'CTO & Co-founder', bg: '#0891b2' },
        { name: 'Priya Rao', role: 'Chief Product Officer', bg: '#10b981' },
        { name: 'Alex Kim', role: 'VP of Sales', bg: '#f59e0b' },
      ];
      const avatarD = H * 0.22;
      return [
        makeText({ content: 'Meet the Team', x: W * 0.05, y: H * 0.05, width: W * 0.9, fontSize: 34, fontStyle: 'bold', fill: '#0f172a', align: 'center' }),
        makeText({ content: '60+ years combined experience across SaaS, enterprise sales, and AI/ML.', x: W * 0.15, y: H * 0.15, width: W * 0.7, fontSize: 16, fill: '#64748b', align: 'center' }),
        ...members.flatMap((m, i) => {
          const cx = W * 0.08 + i * (W * 0.23);
          return [
            makeEllipse({ x: cx + (W * 0.19 - avatarD) / 2, y: H * 0.28, width: avatarD, height: avatarD, fill: m.bg }),
            makeText({ content: m.name.split(' ').map(w => w[0]).join(''), x: cx + (W * 0.19 - avatarD) / 2, y: H * 0.28 + avatarD * 0.33, width: avatarD, fontSize: 28, fontStyle: 'bold', align: 'center', fill: '#ffffff' }),
            makeText({ content: m.name, x: cx, y: H * 0.61, width: W * 0.19, fontSize: 18, fontStyle: 'bold', align: 'center', fill: '#0f172a' }),
            makeText({ content: m.role, x: cx, y: H * 0.71, width: W * 0.19, fontSize: 13, align: 'center', fill: '#64748b' }),
          ];
        }),
        makeText({ content: '→ Backed by top-tier investors. Advisory board includes Fortune 100 executives.', x: W * 0.1, y: H * 0.88, width: W * 0.8, fontSize: 14, fill: '#7c3aed', align: 'center', fontStyle: 'bold' }),
      ];
    },
    apply: applyGeneric,
  },

  {
    id: 'maturity-model', name: 'Maturity Model', category: 'strategy',
    tone: 'light', tags: ['strategy', 'data'],
    generate({ width: W, height: H }) {
      const levels = [
        { label: 'Initial', desc: 'Ad-hoc processes, no documentation', color: '#ef4444' },
        { label: 'Developing', desc: 'Some processes defined, inconsistent', color: '#f59e0b' },
        { label: 'Defined', desc: 'Standardized processes across teams', color: '#0891b2' },
        { label: 'Managed', desc: 'Measured and actively controlled', color: '#4f46e5' },
        { label: 'Optimizing', desc: 'Continuous improvement culture', color: '#10b981' },
      ];
      const barH = H * 0.1, left = W * 0.22, barBase = H * 0.82;
      return [
        makeText({ content: 'Operational Maturity Model', x: W * 0.05, y: H * 0.05, width: W * 0.9, fontSize: 30, fontStyle: 'bold', fill: '#0f172a' }),
        makeText({ content: 'Current state: Level 3 — Defined', x: W * 0.05, y: H * 0.15, width: W * 0.5, fontSize: 16, fill: '#0891b2', fontStyle: 'bold' }),
        makeRect({ x: left - 2, y: H * 0.22, width: 2, height: barBase - H * 0.22, fill: '#e2e8f0', cornerRadius: 1 }),
        makeRect({ x: left, y: barBase, width: W * 0.72, height: 2, fill: '#e2e8f0', cornerRadius: 1 }),
        ...levels.map((l, i) => {
          const bh = H * 0.08 * (i + 1.5);
          const bx = left + i * (W * 0.145);
          return [
            makeRect({ x: bx, y: barBase - bh, width: W * 0.13, height: bh, fill: l.color + (i === 2 ? 'ff' : '88'), cornerRadius: 4 }),
            makeText({ content: l.label, x: bx - 8, y: barBase + H * 0.025, width: W * 0.14, fontSize: 11, fontStyle: 'bold', align: 'center', fill: l.color }),
          ].flat();
        }).flat(),
        ...levels.map((l, i) => makeText({ content: l.desc, x: W * 0.04, y: H * 0.22 + (4 - i) * (H * 0.12), width: W * 0.14, fontSize: 10, fill: '#64748b' })),
      ];
    },
    apply: applyGeneric,
  },

  {
    id: 'gtm-strategy', name: 'Go-to-Market Strategy', category: 'strategy',
    tone: 'light', tags: ['strategy', 'text-heavy'],
    generate({ width: W, height: H }) {
      const quadrants = [
        { label: 'Target Segment', body: 'Series B+ SaaS companies\n500–5,000 employees\nEng-led buying decisions', color: '#7c3aed' },
        { label: 'Value Proposition', body: 'Reduce deployment time by 60%\nSingle pane of glass for ops\nROI positive in 90 days', color: '#0891b2' },
        { label: 'Channels', body: 'Inbound SEO & content\nPartner ecosystem\nProduct-led growth motion', color: '#10b981' },
        { label: 'Success Metrics', body: 'CAC < $8,000\nLTV : CAC > 4:1\nTime-to-value < 14 days', color: '#f59e0b' },
      ];
      return [
        makeRect({ x: 0, y: 0, width: W, height: H * 0.18, fill: '#0f172a', cornerRadius: 0 }),
        makeText({ content: 'Go-to-Market Strategy', x: W * 0.05, y: H * 0.04, width: W * 0.9, fontSize: 32, fontStyle: 'bold', fill: '#ffffff' }),
        makeText({ content: 'Enterprise SaaS · North American Market · 2025 Execution Plan', x: W * 0.05, y: H * 0.12, width: W * 0.9, fontSize: 14, fill: '#94a3b8' }),
        ...quadrants.flatMap((q, i) => {
          const col = i % 2, row = Math.floor(i / 2);
          const cx = W * 0.04 + col * (W * 0.48);
          const cy = H * 0.22 + row * (H * 0.37);
          return [
            makeRect({ x: cx, y: cy, width: W * 0.44, height: H * 0.33, fill: '#ffffff', cornerRadius: 12, stroke: q.color + '55', strokeWidth: 2 }),
            makeRect({ x: cx, y: cy, width: 6, height: H * 0.33, fill: q.color, cornerRadius: 3 }),
            makeText({ content: q.label, x: cx + 18, y: cy + H * 0.05, width: W * 0.38, fontSize: 18, fontStyle: 'bold', fill: q.color }),
            makeText({ content: q.body, x: cx + 18, y: cy + H * 0.14, width: W * 0.38, fontSize: 14, fill: '#334155' }),
          ];
        }),
      ];
    },
    apply: applyGeneric,
  },

  {
    id: 'pros-cons', name: 'Pros & Cons', category: 'strategy',
    tone: 'light', tags: ['strategy', 'split', 'text-heavy'],
    generate({ width: W, height: H }) {
      const pros = ['Fastest time-to-value in the category', 'Zero-touch deployment — no professional services', 'Native integrations with 200+ enterprise tools', 'Transparent usage-based pricing model'];
      const cons = ['Requires modern cloud infrastructure', 'Limited support for legacy on-premise systems', 'Advanced configuration needs technical expertise'];
      return [
        makeText({ content: 'Pros & Cons Analysis', x: W * 0.05, y: H * 0.05, width: W * 0.9, fontSize: 32, fontStyle: 'bold', fill: '#0f172a' }),
        makeRect({ x: W * 0.05, y: H * 0.2, width: W * 0.43, height: H * 0.72, fill: '#f0fdf4', cornerRadius: 14, stroke: '#86efac', strokeWidth: 2 }),
        makeText({ content: '✓  Advantages', x: W * 0.07, y: H * 0.23, width: W * 0.39, fontSize: 18, fontStyle: 'bold', fill: '#10b981' }),
        ...pros.map((p, i) => makeText({ content: '·  ' + p, x: W * 0.08, y: H * 0.34 + i * (H * 0.13), width: W * 0.38, fontSize: 15, fill: '#14532d' })),
        makeRect({ x: W * 0.52, y: H * 0.2, width: W * 0.43, height: H * 0.72, fill: '#fef2f2', cornerRadius: 14, stroke: '#fca5a5', strokeWidth: 2 }),
        makeText({ content: '✗  Considerations', x: W * 0.54, y: H * 0.23, width: W * 0.39, fontSize: 18, fontStyle: 'bold', fill: '#ef4444' }),
        ...cons.map((c, i) => makeText({ content: '·  ' + c, x: W * 0.55, y: H * 0.34 + i * (H * 0.13), width: W * 0.38, fontSize: 15, fill: '#7f1d1d' })),
      ];
    },
    apply: applyGeneric,
  },

  {
    id: 'venn', name: 'Venn Diagram', category: 'strategy',
    tone: 'light', tags: ['strategy', 'visual'],
    generate({ width: W, height: H }) {
      const r = H * 0.28, cy = H * 0.57;
      return [
        makeText({ content: 'Our Unique Positioning', x: W * 0.05, y: H * 0.06, width: W * 0.9, fontSize: 32, fontStyle: 'bold', fill: '#0f172a' }),
        makeEllipse({ x: W * 0.18, y: cy - r, width: r * 2, height: r * 2, fill: '#7c3aed', opacity: 0.55 }),
        makeEllipse({ x: W * 0.36, y: cy - r, width: r * 2, height: r * 2, fill: '#0891b2', opacity: 0.55 }),
        makeEllipse({ x: W * 0.27, y: cy - r * 0.72, width: r * 2, height: r * 2, fill: '#10b981', opacity: 0.55 }),
        makeText({ content: 'Deep\nDomain\nExpertise', x: W * 0.12, y: cy - H * 0.18, width: W * 0.16, fontSize: 14, fontStyle: 'bold', align: 'center', fill: '#ffffff' }),
        makeText({ content: 'AI-First\nPlatform', x: W * 0.5, y: cy - H * 0.18, width: W * 0.14, fontSize: 14, fontStyle: 'bold', align: 'center', fill: '#ffffff' }),
        makeText({ content: 'Enterprise\nScale', x: W * 0.27, y: cy + H * 0.06, width: W * 0.16, fontSize: 14, fontStyle: 'bold', align: 'center', fill: '#ffffff' }),
        makeText({ content: 'ONLY\nUS', x: W * 0.31, y: cy - H * 0.06, width: W * 0.08, fontSize: 14, fontStyle: 'bold', align: 'center', fill: '#ffffff' }),
        makeText({ content: 'Why it matters: No competitor combines all three. This intersection creates a durable, defensible moat.', x: W * 0.62, y: H * 0.3, width: W * 0.33, fontSize: 16, fill: '#334155' }),
      ];
    },
    apply: applyGeneric,
  },

  {
    id: 'pyramid', name: 'Pyramid Framework', category: 'strategy',
    tone: 'light', tags: ['strategy', 'visual'],
    generate({ width: W, height: H }) {
      const levels = [
        { label: 'Vision', body: 'The ultimate goal', color: '#7c3aed', hFrac: 0.11, wFrac: 0.15 },
        { label: 'Strategy', body: 'How we get there', color: '#4f46e5', hFrac: 0.11, wFrac: 0.3 },
        { label: 'Initiatives', body: 'Key programs & projects', color: '#0891b2', hFrac: 0.11, wFrac: 0.48 },
        { label: 'Tactics', body: 'Day-to-day execution', color: '#0d9488', hFrac: 0.11, wFrac: 0.66 },
        { label: 'Operations', body: 'Foundation & infrastructure', color: '#10b981', hFrac: 0.11, wFrac: 0.84 },
      ];
      return [
        makeText({ content: 'Strategic Alignment Pyramid', x: W * 0.05, y: H * 0.05, width: W * 0.9, fontSize: 30, fontStyle: 'bold', fill: '#0f172a' }),
        ...levels.flatMap((l, i) => {
          const bw = W * l.wFrac;
          const bx = (W - bw) / 2;
          const by = H * 0.17 + i * (H * 0.13);
          return [
            makeRect({ x: bx, y: by, width: bw, height: H * 0.12, fill: l.color, cornerRadius: 4 }),
            makeText({ content: l.label, x: bx + 12, y: by + H * 0.033, width: bw * 0.4, fontSize: 16, fontStyle: 'bold', fill: '#ffffff' }),
            makeText({ content: l.body, x: bx + bw * 0.45, y: by + H * 0.033, width: bw * 0.5, fontSize: 13, fill: '#ffffff99' }),
          ];
        }),
      ];
    },
    apply: applyGeneric,
  },

  {
    id: 'hub-spoke', name: 'Hub & Spoke', category: 'strategy',
    tone: 'light', tags: ['strategy', 'visual'],
    generate({ width: W, height: H }) {
      const spokes = ['Sales', 'Marketing', 'Support', 'Finance', 'Product', 'Engineering'];
      const cx = W * 0.5, cy = H * 0.56, hubR = 70, spokeR = H * 0.27;
      return [
        makeText({ content: 'Platform Ecosystem', x: W * 0.05, y: H * 0.05, width: W * 0.9, fontSize: 30, fontStyle: 'bold', fill: '#0f172a' }),
        makeEllipse({ x: cx - hubR, y: cy - hubR, width: hubR * 2, height: hubR * 2, fill: '#7c3aed' }),
        makeText({ content: 'Core\nPlatform', x: cx - hubR, y: cy - 22, width: hubR * 2, fontSize: 14, fontStyle: 'bold', align: 'center', fill: '#ffffff' }),
        ...spokes.map((s, i) => {
          const angle = (i / spokes.length) * Math.PI * 2 - Math.PI / 2;
          const sx = cx + Math.cos(angle) * spokeR;
          const sy = cy + Math.sin(angle) * spokeR;
          const nodeR = 44;
          return [
            makeRect({ x: Math.min(cx, sx) - 1, y: Math.min(cy, sy) - 1, width: Math.abs(sx - cx) + 2, height: 2, fill: '#e2e8f0', cornerRadius: 1 }),
            makeEllipse({ x: sx - nodeR, y: sy - nodeR, width: nodeR * 2, height: nodeR * 2, fill: '#f1f5f9', stroke: '#7c3aed', strokeWidth: 2 }),
            makeText({ content: s, x: sx - nodeR, y: sy - 10, width: nodeR * 2, fontSize: 13, fontStyle: 'bold', align: 'center', fill: '#0f172a' }),
          ].filter(Boolean);
        }).flat(),
      ];
    },
    apply: applyGeneric,
  },

  {
    id: 'business-model-canvas', name: 'Business Model Canvas', category: 'strategy',
    tone: 'light', tags: ['strategy', 'framework', 'text-heavy'],
    generate({ width: W, height: H }) {
      const blocks = [
        { label: 'Key Partners', body: 'Cloud providers\nSystem integrators\nReseller network', x: 0.02, y: 0.18, w: 0.16, h: 0.72, color: '#7c3aed' },
        { label: 'Key Activities', body: 'Product development\nCustomer success\nSales & marketing', x: 0.19, y: 0.18, w: 0.16, h: 0.35, color: '#4f46e5' },
        { label: 'Key Resources', body: 'IP & platform\nTalent & team\nData assets', x: 0.19, y: 0.55, w: 0.16, h: 0.35, color: '#4f46e5' },
        { label: 'Value Proposition', body: 'Faster deployment\nHigher reliability\nLower total cost', x: 0.36, y: 0.18, w: 0.2, h: 0.72, color: '#0891b2' },
        { label: 'Customer Relations', body: 'Dedicated CSM\nSelf-service portal\nCommunity forum', x: 0.57, y: 0.18, w: 0.16, h: 0.35, color: '#10b981' },
        { label: 'Channels', body: 'Direct sales\nProduct-led\nPartner network', x: 0.57, y: 0.55, w: 0.16, h: 0.35, color: '#10b981' },
        { label: 'Customer Segments', body: 'Enterprise SaaS\nMid-market tech\nFin-tech / health', x: 0.74, y: 0.18, w: 0.24, h: 0.72, color: '#f59e0b' },
        { label: 'Cost Structure', body: 'R&D · Salaries · Infrastructure · Sales & marketing', x: 0.02, y: 0.92, w: 0.46, h: 0.06, color: '#334155' },
        { label: 'Revenue Streams', body: 'SaaS subscriptions · Usage-based · Professional services', x: 0.5, y: 0.92, w: 0.48, h: 0.06, color: '#334155' },
      ];
      return [
        makeText({ content: 'Business Model Canvas', x: W * 0.05, y: H * 0.05, width: W * 0.9, fontSize: 28, fontStyle: 'bold', fill: '#0f172a' }),
        ...blocks.flatMap((b) => [
          makeRect({ x: W * b.x, y: H * b.y, width: W * b.w, height: H * b.h, fill: b.color + '15', cornerRadius: 6, stroke: b.color + '44', strokeWidth: 1 }),
          makeText({ content: b.label, x: W * b.x + 8, y: H * b.y + 6, width: W * b.w - 12, fontSize: 11, fontStyle: 'bold', fill: b.color }),
          makeText({ content: b.body, x: W * b.x + 8, y: H * b.y + H * 0.045, width: W * b.w - 12, fontSize: 11, fill: '#334155' }),
        ]),
      ];
    },
    apply: applyGeneric,
  },

  // ═══════════════ CLOSING & NEXT STEPS ═══════════════

  {
    id: 'investment-ask', name: 'Investment Ask', category: 'closing',
    tone: 'dark', tags: ['closing', 'impact', 'data'],
    generate({ width: W, height: H }) {
      return [
        makeRect({ x: 0, y: 0, width: W, height: H, fill: '#0f172a', cornerRadius: 0 }),
        makeText({ content: 'We are raising', x: W * 0.08, y: H * 0.1, width: W * 0.84, fontSize: 26, align: 'center', fill: '#94a3b8' }),
        makeText({ content: '$18M', x: W * 0.08, y: H * 0.2, width: W * 0.84, fontSize: 110, fontStyle: 'bold', align: 'center', fill: '#7c3aed' }),
        makeText({ content: 'Series A · Lead investor preferred · Closing Q3 2025', x: W * 0.15, y: H * 0.6, width: W * 0.7, fontSize: 18, align: 'center', fill: '#64748b' }),
        makeRect({ x: W * 0.06, y: H * 0.72, width: W * 0.88, height: 1, fill: '#1e3a5f', cornerRadius: 1 }),
        ...['Product & R&D  40%', 'Sales & GTM  35%', 'G&A  15%', 'Reserve  10%'].map((item, i) =>
          makeText({ content: item, x: W * 0.06 + i * (W * 0.22), y: H * 0.78, width: W * 0.2, fontSize: 15, fontStyle: 'bold', align: 'center', fill: '#e2e8f0' })
        ),
        makeText({ content: 'Use of Funds', x: W * 0.06, y: H * 0.73, width: W * 0.3, fontSize: 11, fill: '#475569' }),
      ];
    },
    apply: applyGeneric,
  },

  {
    id: 'cta', name: 'Call to Action', category: 'closing',
    tone: 'dark', tags: ['closing', 'minimal', 'impact'],
    generate({ width: W, height: H }) {
      return [
        makeRect({ x: 0, y: 0, width: W, height: H, fill: '#0f172a', cornerRadius: 0 }),
        makeRect({ x: W * 0.1, y: H * 0.08, width: W * 0.8, height: H * 0.84, fill: '#7c3aed', cornerRadius: 24 }),
        makeText({ content: 'Ready to transform\nyour operations?', x: W * 0.15, y: H * 0.18, width: W * 0.7, fontSize: 52, fontStyle: 'bold', align: 'center', fill: '#ffffff' }),
        makeRect({ x: W * 0.3, y: H * 0.55, width: W * 0.4, height: H * 0.12, fill: '#ffffff', cornerRadius: 50 }),
        makeText({ content: 'Start your free trial →', x: W * 0.3, y: H * 0.583, width: W * 0.4, fontSize: 20, fontStyle: 'bold', align: 'center', fill: '#7c3aed' }),
        makeText({ content: 'No credit card · 14-day trial · Cancel anytime', x: W * 0.2, y: H * 0.73, width: W * 0.6, fontSize: 14, align: 'center', fill: '#c4b5fd' }),
        makeText({ content: 'hello@company.com  ·  +1 (415) 555-0100  ·  company.com', x: W * 0.15, y: H * 0.84, width: W * 0.7, fontSize: 13, align: 'center', fill: '#ffffff66' }),
      ];
    },
    apply: applyGeneric,
  },

  {
    id: 'qa-slide', name: 'Q&A', category: 'closing',
    tone: 'dark', tags: ['closing', 'minimal'],
    generate({ width: W, height: H }) {
      return [
        makeRect({ x: 0, y: 0, width: W, height: H, fill: '#0f172a', cornerRadius: 0 }),
        makeText({ content: '?', x: W * 0.05, y: H * 0.02, width: W * 0.9, fontSize: 260, fontStyle: 'bold', align: 'center', fill: '#1e293b' }),
        makeText({ content: 'Questions & Discussion', x: W * 0.1, y: H * 0.52, width: W * 0.8, fontSize: 48, fontStyle: 'bold', align: 'center', fill: '#ffffff' }),
        makeText({ content: 'We\'d love to hear your thoughts', x: W * 0.15, y: H * 0.73, width: W * 0.7, fontSize: 20, align: 'center', fill: '#64748b' }),
      ];
    },
    apply: applyGeneric,
  },

  {
    id: 'resource-links', name: 'Resource Links', category: 'closing',
    tone: 'light', tags: ['closing', 'text-heavy'],
    generate({ width: W, height: H }) {
      const resources = [
        { label: 'Product Documentation', url: 'docs.company.com', icon: '📄', color: '#7c3aed' },
        { label: 'ROI Calculator', url: 'company.com/roi', icon: '📊', color: '#0891b2' },
        { label: 'Case Studies', url: 'company.com/customers', icon: '⭐', color: '#10b981' },
        { label: 'Book a Demo', url: 'company.com/demo', icon: '📅', color: '#f59e0b' },
      ];
      return [
        makeText({ content: 'Additional Resources', x: W * 0.05, y: H * 0.06, width: W * 0.9, fontSize: 34, fontStyle: 'bold', fill: '#0f172a' }),
        makeText({ content: 'Everything you need to take the next step', x: W * 0.05, y: H * 0.17, width: W * 0.6, fontSize: 17, fill: '#64748b' }),
        ...resources.flatMap((r, i) => {
          const cx = i % 2 === 0 ? W * 0.05 : W * 0.52;
          const cy = H * 0.28 + Math.floor(i / 2) * (H * 0.3);
          return [
            makeRect({ x: cx, y: cy, width: W * 0.43, height: H * 0.24, fill: '#ffffff', cornerRadius: 14, stroke: r.color + '44', strokeWidth: 2 }),
            makeRect({ x: cx, y: cy, width: W * 0.43, height: 4, fill: r.color, cornerRadius: 2 }),
            makeText({ content: r.icon, x: cx + 16, y: cy + H * 0.065, width: 40, fontSize: 28 }),
            makeText({ content: r.label, x: cx + 62, y: cy + H * 0.075, width: W * 0.32, fontSize: 18, fontStyle: 'bold', fill: '#0f172a' }),
            makeText({ content: r.url, x: cx + 62, y: cy + H * 0.14, width: W * 0.32, fontSize: 13, fill: r.color }),
          ];
        }),
      ];
    },
    apply: applyGeneric,
  },

  {
    id: 'contact-thankyou', name: 'Contact / Thank You', category: 'closing',
    tone: 'light', tags: ['closing', 'minimal'],
    generate({ width: W, height: H }) {
      return [
        makeRect({ x: 0, y: 0, width: W * 0.5, height: H, fill: '#7c3aed', cornerRadius: 0 }),
        makeText({ content: 'Thank\nYou', x: W * 0.03, y: H * 0.28, width: W * 0.44, fontSize: 72, fontStyle: 'bold', align: 'center', fill: '#ffffff' }),
        makeText({ content: 'We appreciate your time.', x: W * 0.03, y: H * 0.71, width: W * 0.44, fontSize: 18, align: 'center', fill: '#c4b5fd' }),
        makeText({ content: 'Get in touch', x: W * 0.56, y: H * 0.2, width: W * 0.38, fontSize: 28, fontStyle: 'bold', fill: '#0f172a' }),
        makeRect({ x: W * 0.56, y: H * 0.32, width: W * 0.38, height: 2, fill: '#e2e8f0', cornerRadius: 1 }),
        makeText({ content: '✉  hello@company.com', x: W * 0.56, y: H * 0.38, width: W * 0.38, fontSize: 17, fill: '#334155' }),
        makeText({ content: '📞  +1 (415) 555-0100', x: W * 0.56, y: H * 0.49, width: W * 0.38, fontSize: 17, fill: '#334155' }),
        makeText({ content: '🌐  www.company.com', x: W * 0.56, y: H * 0.6, width: W * 0.38, fontSize: 17, fill: '#334155' }),
        makeText({ content: '📍  San Francisco, CA', x: W * 0.56, y: H * 0.71, width: W * 0.38, fontSize: 17, fill: '#334155' }),
        makeText({ content: 'Schedule a call: company.com/demo', x: W * 0.56, y: H * 0.84, width: W * 0.38, fontSize: 14, fill: '#7c3aed', fontStyle: 'bold' }),
      ];
    },
    apply: applyGeneric,
  },

  {
    id: 'appendix', name: 'Appendix', category: 'closing',
    tone: 'light', tags: ['closing', 'text-heavy'],
    generate({ width: W, height: H }) {
      return [
        makeRect({ x: 0, y: 0, width: W, height: H * 0.15, fill: '#f1f5f9', cornerRadius: 0 }),
        makeText({ content: 'Appendix', x: W * 0.05, y: H * 0.03, width: W * 0.4, fontSize: 34, fontStyle: 'bold', fill: '#0f172a' }),
        makeText({ content: 'Supplementary data and references', x: W * 0.05, y: H * 0.1, width: W * 0.5, fontSize: 14, fill: '#64748b' }),
        makeText({ content: 'A.1  Methodology & Data Sources', x: W * 0.05, y: H * 0.2, width: W * 0.9, fontSize: 18, fontStyle: 'bold', fill: '#0f172a' }),
        makeText({ content: 'Customer survey: n=840, enterprise companies, North America, Q4 2024. Margin of error ±3.2%. Market size data sourced from Gartner and IDC annual reports.', x: W * 0.05, y: H * 0.3, width: W * 0.9, fontSize: 14, fill: '#475569' }),
        makeRect({ x: W * 0.05, y: H * 0.43, width: W * 0.9, height: 1, fill: '#e2e8f0', cornerRadius: 1 }),
        makeText({ content: 'A.2  Competitive Analysis Detail', x: W * 0.05, y: H * 0.47, width: W * 0.9, fontSize: 18, fontStyle: 'bold', fill: '#0f172a' }),
        makeText({ content: 'Competitor pricing and feature comparison based on publicly available information as of February 2025. All trademarks belong to respective owners.', x: W * 0.05, y: H * 0.57, width: W * 0.9, fontSize: 14, fill: '#475569' }),
        makeRect({ x: W * 0.05, y: H * 0.7, width: W * 0.9, height: 1, fill: '#e2e8f0', cornerRadius: 1 }),
        makeText({ content: 'A.3  Financial Assumptions', x: W * 0.05, y: H * 0.74, width: W * 0.9, fontSize: 18, fontStyle: 'bold', fill: '#0f172a' }),
        makeText({ content: 'Projections are based on current pipeline, historical conversion rates, and planned headcount expansion. These are forward-looking statements and subject to risks.', x: W * 0.05, y: H * 0.83, width: W * 0.9, fontSize: 14, fill: '#475569' }),
      ];
    },
    apply: applyGeneric,
  },
];

// ── Smart suggestions ──────────────────────────────────────────────────────────
export function suggestLayouts(elements) {
  if (!elements || elements.length === 0) return [];
  const texts = elements.filter((e) => e.type === 'text');
  const images = elements.filter((e) => e.type === 'image');
  const manyTexts = texts.length >= 4;
  const fewTexts = texts.length <= 2;
  const hasImages = images.length > 0;
  const hasData = texts.some((t) => /\d{2,}|%|\$/.test(t.content || ''));
  const hasQuote = texts.some((t) => (t.content || '').length > 80);

  const scores = {};
  LAYOUT_DEFINITIONS.forEach((layout) => {
    let score = 0;
    const tags = layout.tags || [];
    if (hasImages && tags.includes('image')) score += 3;
    if (manyTexts && tags.includes('text-heavy')) score += 3;
    if (manyTexts && tags.includes('list')) score += 2;
    if (fewTexts && tags.includes('minimal')) score += 2;
    if (hasData && tags.includes('data')) score += 3;
    if (hasData && tags.includes('chart')) score += 2;
    if (hasQuote && tags.includes('quote')) score += 3;
    if (texts.length === 2 && tags.includes('opener')) score += 2;
    scores[layout.id] = score;
  });

  return LAYOUT_DEFINITIONS
    .filter((l) => scores[l.id] > 0)
    .sort((a, b) => scores[b.id] - scores[a.id])
    .slice(0, 4)
    .map((l) => l.id);
}
