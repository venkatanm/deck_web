const CHART_PURPLE = "#7c3aed";
const CHART_TEAL = "#06b6d4";
const CHART_GREEN = "#10b981";
const CHART_AMBER = "#f59e0b";
const CHART_GRID = "#f1f5f9";
const CHART_AXIS = "#cbd5e1";
const CHART_LABEL = "#94a3b8";

const Axes = () => (
  <>
    <line x1="18" y1="8" x2="18" y2="64" stroke={CHART_AXIS} strokeWidth="1.5" />
    <line x1="18" y1="64" x2="112" y2="64" stroke={CHART_AXIS} strokeWidth="1.5" />
  </>
);

const Grid = ({ rows = 3 }) => (
  <>
    {Array.from({ length: rows }, (_, i) => {
      const y = 64 - (i + 1) * (56 / (rows + 1));
      return (
        <line
          key={i}
          x1="18"
          y1={y}
          x2="112"
          y2={y}
          stroke={CHART_GRID}
          strokeWidth="1"
        />
      );
    })}
  </>
);

const XLabels = ({ labels }) => (
  <>
    {labels.map((l, i) => (
      <text
        key={i}
        x={labels.length === 1 ? 65 : 22 + i * (90 / (labels.length - 1))}
        y="73"
        fontSize="7"
        fill={CHART_LABEL}
        textAnchor="middle"
        fontFamily="Inter, sans-serif"
      >
        {l}
      </text>
    ))}
  </>
);

export function GroupedBarIcon({ width = 120, height = 80 }) {
  return (
    <svg width={width} height={height} viewBox="0 0 120 80" style={{ display: "block" }}>
      <Grid />
      <Axes />
      <rect x="24" y="34" width="9" height="30" rx="1.5" fill={CHART_PURPLE} />
      <rect x="34" y="44" width="9" height="20" rx="1.5" fill={CHART_TEAL} opacity="0.7" />
      <rect x="52" y="24" width="9" height="40" rx="1.5" fill={CHART_PURPLE} />
      <rect x="62" y="36" width="9" height="28" rx="1.5" fill={CHART_TEAL} opacity="0.7" />
      <rect x="80" y="30" width="9" height="34" rx="1.5" fill={CHART_PURPLE} />
      <rect x="90" y="48" width="9" height="16" rx="1.5" fill={CHART_TEAL} opacity="0.7" />
      <XLabels labels={["Q2", "Q3", "Q4"]} />
      <text x="28" y="31" fontSize="7" fill={CHART_PURPLE} textAnchor="middle" fontFamily="Inter, sans-serif">
        80
      </text>
    </svg>
  );
}

export function StackedBarIcon({ width = 120, height = 80 }) {
  const bars = [
    { x: 24, h1: 22, h2: 16 },
    { x: 48, h1: 28, h2: 20 },
    { x: 72, h1: 18, h2: 14 },
    { x: 96, h1: 32, h2: 12 },
  ];
  return (
    <svg width={width} height={height} viewBox="0 0 120 80" style={{ display: "block" }}>
      <Grid />
      <Axes />
      {bars.map((b, i) => (
        <g key={i}>
          <rect x={b.x} y={64 - b.h1 - b.h2} width="16" height={b.h2} rx="1.5" fill={CHART_TEAL} opacity="0.8" />
          <rect x={b.x} y={64 - b.h1} width="16" height={b.h1} rx="1.5" fill={CHART_PURPLE} />
        </g>
      ))}
      <text x="104" y={64 - 32 - 12 - 4} fontSize="7" fill={CHART_LABEL} textAnchor="middle" fontFamily="Inter, sans-serif">
        140
      </text>
      <XLabels labels={["Q1", "Q2", "Q3", "Q4"]} />
    </svg>
  );
}

export function StackedBar100Icon({ width = 120, height = 80 }) {
  const segments = [
    [0.4, CHART_PURPLE],
    [0.35, CHART_TEAL],
    [0.25, CHART_GREEN],
  ];
  const barX = [24, 48, 72, 96];
  return (
    <svg width={width} height={height} viewBox="0 0 120 80" style={{ display: "block" }}>
      <Grid />
      <Axes />
      {barX.flatMap((x, bi) => {
        let y = 64;
        return segments.map(([pct, color], si) => {
          const h = 56 * pct;
          y -= h;
          return (
            <rect
              key={`${bi}-${si}`}
              x={x}
              y={y}
              width="16"
              height={h}
              fill={color}
              opacity={1 - si * 0.1}
              rx={si === 0 ? 1.5 : 0}
            />
          );
        });
      })}
      <XLabels labels={["Q1", "Q2", "Q3", "Q4"]} />
    </svg>
  );
}

export function HorizontalBarIcon({ width = 120, height = 80 }) {
  const bars = [
    { y: 14, w: 72, color: CHART_PURPLE },
    { y: 28, w: 52, color: CHART_PURPLE, op: 0.75 },
    { y: 42, w: 84, color: CHART_PURPLE, op: 0.9 },
    { y: 56, w: 40, color: CHART_PURPLE, op: 0.6 },
  ];
  return (
    <svg width={width} height={height} viewBox="0 0 120 80" style={{ display: "block" }}>
      <line x1="30" y1="8" x2="30" y2="70" stroke={CHART_AXIS} strokeWidth="1.5" />
      <line x1="30" y1="70" x2="112" y2="70" stroke={CHART_AXIS} strokeWidth="1.5" />
      {bars.map((b, i) => (
        <g key={i}>
          <rect x="32" y={b.y} width={b.w} height="10" rx="1.5" fill={b.color} opacity={b.op || 1} />
          <text x="26" y={b.y + 8} fontSize="7" fill={CHART_LABEL} textAnchor="end" fontFamily="Inter, sans-serif">
            {["A", "B", "C", "D"][i]}
          </text>
        </g>
      ))}
      <text x={32 + 72} y="12" fontSize="7" fill={CHART_PURPLE} fontFamily="Inter, sans-serif">
        80
      </text>
    </svg>
  );
}

export function LineIcon({ width = 120, height = 80 }) {
  const pts = [
    [22, 52],
    [40, 38],
    [58, 44],
    [76, 28],
    [94, 34],
    [112, 20],
  ];
  const d = pts.map((p, i) => (i === 0 ? "M" : "L") + p[0] + " " + p[1]).join(" ");
  return (
    <svg width={width} height={height} viewBox="0 0 120 80" style={{ display: "block" }}>
      <Grid />
      <Axes />
      <path d={d} fill="none" stroke={CHART_PURPLE} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) => (
        <circle key={i} cx={p[0]} cy={p[1]} r="3" fill="white" stroke={CHART_PURPLE} strokeWidth="1.5" />
      ))}
      <text x="94" y="30" fontSize="7" fill={CHART_PURPLE} fontFamily="Inter, sans-serif">
        80
      </text>
      <XLabels labels={["Jan", "Jun"]} />
    </svg>
  );
}

export function SmoothLineIcon({ width = 120, height = 80 }) {
  const d = `M22 52 C32 52 36 32 46 36 C56 40 56 24 68 26 C80 28 84 38 94 34 C104 30 106 18 112 16`;
  return (
    <svg width={width} height={height} viewBox="0 0 120 80" style={{ display: "block" }}>
      <Grid />
      <Axes />
      <path d={d + " L112 64 L22 64 Z"} fill={CHART_PURPLE} opacity="0.08" />
      <path d={d} fill="none" stroke={CHART_PURPLE} strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="112" cy="16" r="3.5" fill={CHART_PURPLE} />
      <text x="104" y="12" fontSize="7" fill={CHART_PURPLE} fontFamily="Inter, sans-serif">
        80
      </text>
      <XLabels labels={["Jan", "Jun"]} />
    </svg>
  );
}

export function StepLineIcon({ width = 120, height = 80 }) {
  const d = `M22 52 H44 V36 H62 V44 H80 V24 H94 V34 H112`;
  return (
    <svg width={width} height={height} viewBox="0 0 120 80" style={{ display: "block" }}>
      <Grid />
      <Axes />
      <path d={d} fill="none" stroke={CHART_PURPLE} strokeWidth="2.5" strokeLinecap="square" />
      <circle cx="112" cy="34" r="3" fill="white" stroke={CHART_PURPLE} strokeWidth="1.5" />
      <text x="102" y="30" fontSize="7" fill={CHART_PURPLE} fontFamily="Inter, sans-serif">
        80
      </text>
      <XLabels labels={["Jan", "Jun"]} />
    </svg>
  );
}

export function MultiLineIcon({ width = 120, height = 80 }) {
  const l1 = `M22 52 C36 44 56 28 76 24 C96 20 104 26 112 22`;
  const l2 = `M22 44 C36 50 56 42 76 38 C96 34 104 40 112 36`;
  const l3 = `M22 36 C36 28 56 20 76 30 C96 40 104 28 112 26`;
  return (
    <svg width={width} height={height} viewBox="0 0 120 80" style={{ display: "block" }}>
      <Grid />
      <Axes />
      <path d={l1} fill="none" stroke={CHART_PURPLE} strokeWidth="2" strokeLinecap="round" />
      <path d={l2} fill="none" stroke={CHART_TEAL} strokeWidth="2" strokeLinecap="round" />
      <path d={l3} fill="none" stroke={CHART_GREEN} strokeWidth="2" strokeLinecap="round" />
      <text x="100" y="18" fontSize="7" fill={CHART_PURPLE} fontFamily="Inter, sans-serif">
        80
      </text>
      <XLabels labels={["Jan", "Jun"]} />
    </svg>
  );
}

export function BarLineComboIcon({ width = 120, height = 80 }) {
  const bars = [22, 44, 66, 88];
  const line = `M30 46 C44 36 64 30 76 34 C88 38 96 24 104 22`;
  return (
    <svg width={width} height={height} viewBox="0 0 120 80" style={{ display: "block" }}>
      <Grid />
      <Axes />
      {bars.map((x, i) => (
        <rect
          key={i}
          x={x}
          y={[44, 34, 50, 28][i]}
          width="16"
          height={[20, 30, 14, 36][i]}
          rx="1.5"
          fill={CHART_PURPLE}
          opacity="0.6"
        />
      ))}
      <path d={line} fill="none" stroke={CHART_TEAL} strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="104" cy="22" r="3" fill={CHART_TEAL} />
      <text x="96" y="18" fontSize="7" fill={CHART_LABEL} fontFamily="Inter, sans-serif">
        Q4
      </text>
      <XLabels labels={["Q1", "Q2", "Q3", "Q4"]} />
    </svg>
  );
}

export function WaterfallIcon({ width = 120, height = 80 }) {
  const segments = [
    { x: 20, y: 24, h: 30, color: CHART_PURPLE },
    { x: 38, y: 18, h: 6, color: CHART_GREEN },
    { x: 56, y: 24, h: 8, color: "#ef4444" },
    { x: 74, y: 32, h: 4, color: "#ef4444" },
    { x: 92, y: 20, h: 12, color: CHART_GREEN },
    { x: 110, y: 16, h: 38, color: CHART_PURPLE, end: true },
  ];
  return (
    <svg width={width} height={height} viewBox="0 0 120 80" style={{ display: "block" }}>
      <Grid />
      <Axes />
      {segments.map((s, i) => (
        <g key={i}>
          <rect x={s.x} y={s.y} width="14" height={s.h} rx="1.5" fill={s.color} opacity={s.end ? 0.9 : 0.8} />
          {i < segments.length - 1 && (
            <line
              x1={s.x + 14}
              y1={s.y + (s.color === "#ef4444" ? s.h : 0)}
              x2={segments[i + 1].x}
              y2={s.y + (s.color === "#ef4444" ? s.h : 0)}
              stroke={CHART_AXIS}
              strokeWidth="1"
              strokeDasharray="2,2"
            />
          )}
        </g>
      ))}
      <text x="110" y="12" fontSize="7" fill={CHART_LABEL} fontFamily="Inter, sans-serif">
        1400
      </text>
    </svg>
  );
}

export function StackedAreaIcon({ width = 120, height = 80 }) {
  const a1 = `M22 56 C36 50 56 44 76 40 C96 36 104 38 112 34 L112 64 L22 64 Z`;
  const a2 = `M22 44 C36 38 56 28 76 26 C96 24 104 28 112 24 L112 34 C104 38 96 36 76 40 C56 44 36 50 22 56 Z`;
  return (
    <svg width={width} height={height} viewBox="0 0 120 80" style={{ display: "block" }}>
      <Grid />
      <Axes />
      <path d={a1} fill={CHART_PURPLE} opacity="0.5" />
      <path d={a2} fill={CHART_TEAL} opacity="0.5" />
      <path d="M22 56 C36 50 56 44 76 40 C96 36 104 38 112 34" fill="none" stroke={CHART_PURPLE} strokeWidth="1.5" />
      <path d="M22 44 C36 38 56 28 76 26 C96 24 104 28 112 24" fill="none" stroke={CHART_TEAL} strokeWidth="1.5" />
      <text x="100" y="20" fontSize="7" fill={CHART_LABEL} fontFamily="Inter, sans-serif">
        80
      </text>
      <XLabels labels={["Jan", "May"]} />
    </svg>
  );
}

export function UnstackedAreaIcon({ width = 120, height = 80 }) {
  const a1 = `M22 54 C36 46 56 36 76 32 C96 28 104 32 112 28`;
  const a2 = `M22 48 C36 52 56 44 76 38 C96 32 104 40 112 36`;
  return (
    <svg width={width} height={height} viewBox="0 0 120 80" style={{ display: "block" }}>
      <Grid />
      <Axes />
      <path d={a1 + " L112 64 L22 64 Z"} fill={CHART_PURPLE} opacity="0.15" />
      <path d={a2 + " L112 64 L22 64 Z"} fill={CHART_TEAL} opacity="0.15" />
      <path d={a1} fill="none" stroke={CHART_PURPLE} strokeWidth="2" />
      <path d={a2} fill="none" stroke={CHART_TEAL} strokeWidth="2" />
      <text x="100" y="24" fontSize="7" fill={CHART_LABEL} fontFamily="Inter, sans-serif">
        80
      </text>
      <XLabels labels={["Jan", "May"]} />
    </svg>
  );
}

export function PieIcon({ width = 80, height = 80 }) {
  const slices = [
    { start: 0, end: 0.35, color: CHART_PURPLE },
    { start: 0.35, end: 0.63, color: CHART_TEAL },
    { start: 0.63, end: 0.85, color: CHART_GREEN },
    { start: 0.85, end: 1.0, color: CHART_AMBER },
  ];
  const cx = 40,
    cy = 38,
    r = 28;

  function slice(s, e) {
    const a1 = s * 2 * Math.PI - Math.PI / 2;
    const a2 = e * 2 * Math.PI - Math.PI / 2;
    const x1 = cx + r * Math.cos(a1);
    const y1 = cy + r * Math.sin(a1);
    const x2 = cx + r * Math.cos(a2);
    const y2 = cy + r * Math.sin(a2);
    const large = e - s > 0.5 ? 1 : 0;
    return `M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${large} 1 ${x2},${y2} Z`;
  }

  return (
    <svg width={width} height={height} viewBox="0 0 80 80" style={{ display: "block" }}>
      {slices.map((s, i) => (
        <path key={i} d={slice(s.start, s.end)} fill={s.color} stroke="white" strokeWidth="1.5" />
      ))}
      <text x="40" y="76" fontSize="7" fill={CHART_LABEL} textAnchor="middle" fontFamily="Inter, sans-serif">
        Cate
      </text>
    </svg>
  );
}

export function DonutIcon({ width = 80, height = 80 }) {
  const slices = [
    { start: 0, end: 0.42, color: CHART_PURPLE },
    { start: 0.42, end: 0.7, color: CHART_TEAL },
    { start: 0.7, end: 0.87, color: CHART_GREEN },
    { start: 0.87, end: 1.0, color: CHART_AMBER },
  ];
  const cx = 40,
    cy = 38,
    r = 28,
    ri = 14;

  function donutSlice(s, e) {
    const a1 = s * 2 * Math.PI - Math.PI / 2;
    const a2 = e * 2 * Math.PI - Math.PI / 2;
    const ox1 = cx + r * Math.cos(a1),
      oy1 = cy + r * Math.sin(a1);
    const ox2 = cx + r * Math.cos(a2),
      oy2 = cy + r * Math.sin(a2);
    const ix1 = cx + ri * Math.cos(a2),
      iy1 = cy + ri * Math.sin(a2);
    const ix2 = cx + ri * Math.cos(a1),
      iy2 = cy + ri * Math.sin(a1);
    const large = e - s > 0.5 ? 1 : 0;
    return `M${ox1},${oy1} A${r},${r} 0 ${large} 1 ${ox2},${oy2} L${ix1},${iy1} A${ri},${ri} 0 ${large} 0 ${ix2},${iy2} Z`;
  }

  return (
    <svg width={width} height={height} viewBox="0 0 80 80" style={{ display: "block" }}>
      {slices.map((s, i) => (
        <path key={i} d={donutSlice(s.start, s.end)} fill={s.color} stroke="white" strokeWidth="1.5" />
      ))}
      <text x="40" y="41" fontSize="8" fill="#64748b" textAnchor="middle" dominantBaseline="middle" fontFamily="Inter, sans-serif">
        42%
      </text>
      <text x="40" y="76" fontSize="7" fill={CHART_LABEL} textAnchor="middle" fontFamily="Inter, sans-serif">
        Cate
      </text>
    </svg>
  );
}

export function ScatterIcon({ width = 120, height = 80 }) {
  const dots = [
    [30, 52],
    [42, 38],
    [58, 46],
    [48, 28],
    [72, 36],
    [84, 24],
    [96, 42],
    [68, 54],
    [88, 14],
  ];
  return (
    <svg width={width} height={height} viewBox="0 0 120 80" style={{ display: "block" }}>
      <Grid />
      <Axes />
      {dots.map(([x, y], i) => (
        <circle
          key={i}
          cx={x}
          cy={y}
          r={3.5 + (i % 3)}
          fill={i % 2 ? CHART_TEAL : CHART_PURPLE}
          opacity="0.75"
        />
      ))}
    </svg>
  );
}

export function RadarIcon({ width = 80, height = 80 }) {
  const n = 5;
  const cx = 40,
    cy = 38,
    r = 26;
  const pts = (scale) =>
    Array.from({ length: n }, (_, i) => {
      const a = (i / n) * 2 * Math.PI - Math.PI / 2;
      return [cx + r * scale * Math.cos(a), cy + r * scale * Math.sin(a)];
    });

  const d1 = pts(0.85).map((p) => p.join(",")).join(" ");
  const d2 = pts(0.55).map((p) => p.join(",")).join(" ");

  return (
    <svg width={width} height={height} viewBox="0 0 80 80" style={{ display: "block" }}>
      {[1, 0.66, 0.33].map((s) => (
        <polygon
          key={s}
          points={pts(s).map((p) => p.join(",")).join(" ")}
          fill="none"
          stroke={CHART_GRID}
          strokeWidth="1"
        />
      ))}
      {pts(1).map(([x, y], i) => (
        <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke={CHART_GRID} strokeWidth="1" />
      ))}
      <polygon points={d1} fill={CHART_PURPLE} opacity="0.2" />
      <polygon points={d1} fill="none" stroke={CHART_PURPLE} strokeWidth="1.5" />
      <polygon points={d2} fill={CHART_TEAL} opacity="0.2" />
      <polygon points={d2} fill="none" stroke={CHART_TEAL} strokeWidth="1.5" />
    </svg>
  );
}

export function FunnelIcon({ width = 80, height = 80 }) {
  const stages = [
    { w: 72, color: CHART_PURPLE },
    { w: 58, color: CHART_PURPLE },
    { w: 44, color: CHART_PURPLE },
    { w: 30, color: CHART_PURPLE },
  ];
  return (
    <svg width={width} height={height} viewBox="0 0 80 80" style={{ display: "block" }}>
      {stages.map((s, i) => (
        <rect
          key={i}
          x={(80 - s.w) / 2}
          y={8 + i * 17}
          width={s.w}
          height={13}
          rx="3"
          fill={s.color}
          opacity={1 - i * 0.18}
        />
      ))}
      <text x="40" y="78" fontSize="7" fill={CHART_LABEL} textAnchor="middle" fontFamily="Inter, sans-serif">
        Funnel
      </text>
    </svg>
  );
}

export function TreemapIcon({ width = 120, height = 80 }) {
  return (
    <svg width={width} height={height} viewBox="0 0 120 80" style={{ display: "block" }}>
      <rect x="4" y="4" width="66" height="72" rx="3" fill={CHART_PURPLE} opacity="0.8" />
      <rect x="74" y="4" width="42" height="36" rx="3" fill={CHART_TEAL} opacity="0.7" />
      <rect x="74" y="44" width="20" height="32" rx="3" fill={CHART_GREEN} opacity="0.7" />
      <rect x="98" y="44" width="18" height="32" rx="3" fill={CHART_AMBER} opacity="0.7" />
      <text x="37" y="44" fontSize="9" fill="white" textAnchor="middle" fontFamily="Inter, sans-serif" fontWeight="600">
        42%
      </text>
      <text x="95" y="26" fontSize="8" fill="white" textAnchor="middle" fontFamily="Inter, sans-serif">
        24%
      </text>
    </svg>
  );
}

export function RadialBarIcon({ width = 80, height = 80 }) {
  const arcs = [
    { r: 26, pct: 0.82, color: CHART_PURPLE },
    { r: 20, pct: 0.64, color: CHART_TEAL },
    { r: 14, pct: 0.45, color: CHART_GREEN },
  ];
  const cx = 40,
    cy = 40;

  function arc(r, pct, color) {
    const start = -Math.PI / 2;
    const end = start + pct * 2 * Math.PI;
    const x1 = cx + r * Math.cos(start);
    const y1 = cy + r * Math.sin(start);
    const x2 = cx + r * Math.cos(end);
    const y2 = cy + r * Math.sin(end);
    const large = pct > 0.5 ? 1 : 0;
    return (
      <>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={CHART_GRID} strokeWidth="5" />
        <path
          d={`M${x1},${y1} A${r},${r} 0 ${large} 1 ${x2},${y2}`}
          fill="none"
          stroke={color}
          strokeWidth="5"
          strokeLinecap="round"
        />
      </>
    );
  }

  return (
    <svg width={width} height={height} viewBox="0 0 80 80" style={{ display: "block" }}>
      {arcs.map((a, i) => (
        <g key={i}>{arc(a.r, a.pct, a.color)}</g>
      ))}
    </svg>
  );
}

export function ProgressRingIcon({ width = 80, height = 80 }) {
  const cx = 40,
    cy = 38,
    r = 26;
  const pct = 0.72;
  const circ = 2 * Math.PI * r;
  return (
    <svg width={width} height={height} viewBox="0 0 80 80" style={{ display: "block" }}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={CHART_GRID} strokeWidth="8" />
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke={CHART_PURPLE}
        strokeWidth="8"
        strokeDasharray={circ}
        strokeDashoffset={circ * (1 - pct)}
        strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cy})`}
      />
      <text x={cx} y={cy + 1} fontSize="10" fill="#1e293b" textAnchor="middle" dominantBaseline="middle" fontWeight="700" fontFamily="Inter, sans-serif">
        72%
      </text>
    </svg>
  );
}

export function ProgressBarIcon({ width = 120, height = 80 }) {
  const bars = [
    { label: "A", pct: 0.82, y: 18 },
    { label: "B", pct: 0.6, y: 36 },
    { label: "C", pct: 0.44, y: 54 },
  ];
  return (
    <svg width={width} height={height} viewBox="0 0 120 80" style={{ display: "block" }}>
      {bars.map((b, i) => (
        <g key={i}>
          <text x="14" y={b.y + 7} fontSize="7" fill={CHART_LABEL} textAnchor="middle" fontFamily="Inter, sans-serif">
            {b.label}
          </text>
          <rect x="22" y={b.y} width="88" height="10" rx="5" fill={CHART_GRID} />
          <rect x="22" y={b.y} width={88 * b.pct} height="10" rx="5" fill={CHART_PURPLE} opacity={1 - i * 0.15} />
          <text x={22 + 88 * b.pct + 3} y={b.y + 7} fontSize="7" fill={CHART_PURPLE} fontFamily="Inter, sans-serif">
            {Math.round(b.pct * 100)}%
          </text>
        </g>
      ))}
    </svg>
  );
}

export const CHART_ICON_MAP = {
  "bar-grouped": GroupedBarIcon,
  "bar-stacked": StackedBarIcon,
  "bar-stacked100": StackedBar100Icon,
  "bar-horizontal": HorizontalBarIcon,
  line: LineIcon,
  "line-smooth": SmoothLineIcon,
  "line-step": StepLineIcon,
  "line-multi": MultiLineIcon,
  "combo-bar-line": BarLineComboIcon,
  waterfall: WaterfallIcon,
  "area-stacked": StackedAreaIcon,
  "area-unstacked": UnstackedAreaIcon,
  pie: PieIcon,
  donut: DonutIcon,
  scatter: ScatterIcon,
  radar: RadarIcon,
  funnel: FunnelIcon,
  treemap: TreemapIcon,
  radialBar: RadialBarIcon,
  "progress-ring": ProgressRingIcon,
  "progress-bar": ProgressBarIcon,
};
