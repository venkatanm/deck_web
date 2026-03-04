import React from 'react';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  PieChart, Pie, Cell, ScatterChart, Scatter,
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  RadialBarChart, RadialBar, Treemap, FunnelChart, Funnel,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  LabelList, ZAxis,
} from 'recharts';
import useEditorStore from '../../store/useEditorStore';
import { CHART_COLOR_SCHEMES } from '../../utils/defaults';

// Progress ring using SVG (not recharts)
function ProgressRing({ el }) {
  const r = (Math.min(el.width, el.height) / 2) - (el.strokeWidth || 20);
  const cx = el.width / 2;
  const cy = el.height / 2;
  const circumference = 2 * Math.PI * r;
  const dash = ((el.value || 0) / 100) * circumference;

  return (
    <svg width={el.width} height={el.height}>
      <circle cx={cx} cy={cy} r={r}
        fill="none" stroke={el.trackColor || '#e9d5ff'}
        strokeWidth={el.strokeWidth || 20} />
      <circle cx={cx} cy={cy} r={r}
        fill="none" stroke={el.color || '#7c3aed'}
        strokeWidth={el.strokeWidth || 20}
        strokeDasharray={`${dash} ${circumference}`}
        strokeDashoffset={circumference * 0.25}
        strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cy})`} />
      {el.showLabel && (
        <text x={cx} y={cy} textAnchor="middle" dy="0.35em"
          fontSize={el.width * 0.15} fontWeight="bold"
          fill={el.color || '#7c3aed'}>
          {el.value}%
        </text>
      )}
    </svg>
  );
}

// Progress bar (horizontal)
function ProgressBar({ el }) {
  const barW = ((el.value || 0) / 100) * (el.width - 40);
  return (
    <svg width={el.width} height={el.height}>
      <rect x={20} y={el.height / 2 - (el.strokeWidth || 16) / 2}
        width={el.width - 40} height={el.strokeWidth || 16}
        rx={8} fill={el.trackColor || '#e9d5ff'} />
      <rect x={20} y={el.height / 2 - (el.strokeWidth || 16) / 2}
        width={barW} height={el.strokeWidth || 16}
        rx={8} fill={el.color || '#7c3aed'} />
      {el.showLabel && (
        <text x={el.width / 2} y={el.height / 2 + (el.strokeWidth || 16) / 2 + 20}
          textAnchor="middle" fontSize={14} fontWeight="bold"
          fill={el.color || '#7c3aed'}>
          {el.value}%
        </text>
      )}
    </svg>
  );
}

// Main chart renderer - exported for ChartsPanel previews
export function renderChart(el) {
  const colors = CHART_COLOR_SCHEMES[el.colorScheme || 'purple'];
  const { width, height, data = [], series = [] } = el;

  const commonProps = {
    width,
    height,
    margin: { top: 20, right: 20, bottom: 20, left: 20 },
  };
  const gridProps = el.showGrid
    ? <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
    : null;
  const tooltipEl = el.showTooltip !== false
    ? <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
    : null;
  const legendEl = el.showLegend
    ? <Legend wrapperStyle={{ fontSize: 12 }} />
    : null;

  switch (el.chartType) {
    case 'bar': {
      const isHorizontal = el.variant === 'horizontal';
      const isStacked = el.variant === 'stacked';
      return (
        <BarChart
          {...commonProps}
          layout={isHorizontal ? 'vertical' : 'horizontal'}
          data={data}
        >
          {gridProps}
          {isHorizontal
            ? <><XAxis type="number" tick={{ fontSize: 10 }} /><YAxis dataKey="label" type="category" tick={{ fontSize: 10 }} width={70} /></>
            : <><XAxis dataKey="label" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 10 }} /></>
          }
          {tooltipEl}{legendEl}
          {series.map((s, i) => (
            <Bar key={s.key} dataKey={s.key} name={s.name}
              stackId={isStacked ? 'stack' : undefined}
              fill={s.color || colors[i % colors.length]}
              radius={isStacked ? 0 : [4, 4, 0, 0]}
            />
          ))}
        </BarChart>
      );
    }

    case 'line': {
      const curveType = el.variant === 'smooth' ? 'monotone'
        : el.variant === 'step' ? 'step' : 'linear';
      return (
        <LineChart {...commonProps} data={data}>
          {gridProps}
          <XAxis dataKey="label" tick={{ fontSize: 10 }} />
          <YAxis tick={{ fontSize: 10 }} />
          {tooltipEl}{legendEl}
          {series.map((s, i) => (
            <Line key={s.key} type={curveType}
              dataKey={s.key} name={s.name}
              stroke={s.color || colors[i % colors.length]}
              strokeWidth={2.5}
              dot={{ r: 4, fill: s.color || colors[i % colors.length] }}
              activeDot={{ r: 6 }}
            />
          ))}
        </LineChart>
      );
    }

    case 'area': {
      const isStacked = el.variant === 'stacked';
      return (
        <AreaChart {...commonProps} data={data}>
          <defs>
            {series.map((s, i) => (
              <linearGradient key={s.key} id={`grad_${s.key}_${el.id || ''}`}
                x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={s.color || colors[i % colors.length]}
                  stopOpacity={0.3} />
                <stop offset="95%" stopColor={s.color || colors[i % colors.length]}
                  stopOpacity={0.05} />
              </linearGradient>
            ))}
          </defs>
          {gridProps}
          <XAxis dataKey="label" tick={{ fontSize: 10 }} />
          <YAxis tick={{ fontSize: 10 }} />
          {tooltipEl}{legendEl}
          {series.map((s, i) => (
            <Area key={s.key} type="monotone"
              dataKey={s.key} name={s.name}
              stackId={isStacked ? 'stack' : undefined}
              stroke={s.color || colors[i % colors.length]}
              fill={`url(#grad_${s.key}_${el.id || ''})`}
              strokeWidth={2}
            />
          ))}
        </AreaChart>
      );
    }

    case 'pie': {
      const isDonut = el.variant === 'donut';
      const innerR = isDonut ? Math.min(width, height) * 0.18 : 0;
      const outerR = Math.min(width, height) * 0.35;
      return (
        <PieChart width={width} height={height}>
          {tooltipEl}
          {legendEl}
          <Pie data={data} dataKey="value" nameKey="label"
            cx="50%" cy="50%"
            innerRadius={innerR} outerRadius={outerR}
            paddingAngle={isDonut ? 3 : 1}
            label={({ label, percent }) =>
              `${label} ${(percent * 100).toFixed(0)}%`
            }
            labelLine={false}
          >
            {data.map((entry, i) => (
              <Cell key={i}
                fill={entry.color || colors[i % colors.length]} />
            ))}
          </Pie>
        </PieChart>
      );
    }

    case 'scatter': {
      return (
        <ScatterChart {...commonProps}>
          {gridProps}
          <XAxis dataKey="x" name="X" tick={{ fontSize: 10 }} />
          <YAxis dataKey="y" name="Y" tick={{ fontSize: 10 }} />
          <ZAxis dataKey="z" range={[40, 400]} />
          {tooltipEl}{legendEl}
          <Scatter name="Data" data={data}
            fill={colors[0]} opacity={0.8} />
        </ScatterChart>
      );
    }

    case 'radar': {
      return (
        <RadarChart {...commonProps} data={data}
          cx="50%" cy="50%"
          outerRadius={Math.min(width, height) * 0.35}
        >
          <PolarGrid stroke="#e2e8f0" />
          <PolarAngleAxis dataKey="label"
            tick={{ fontSize: 11, fill: '#64748b' }} />
          {tooltipEl}{legendEl}
          {series.map((s, i) => (
            <Radar key={s.key} name={s.name} dataKey={s.key}
              stroke={s.color || colors[i % colors.length]}
              fill={s.color || colors[i % colors.length]}
              fillOpacity={0.25}
            />
          ))}
        </RadarChart>
      );
    }

    case 'funnel': {
      return (
        <FunnelChart width={width} height={height}>
          {tooltipEl}
          <Funnel dataKey="value" nameKey="label" data={data} isAnimationActive>
            {data.map((entry, i) => (
              <Cell key={i}
                fill={entry.color || colors[i % colors.length]} />
            ))}
            <LabelList position="center" fill="#fff"
              fontSize={12} fontWeight="bold"
              formatter={(v, entry) => entry?.payload?.label || v} />
          </Funnel>
        </FunnelChart>
      );
    }

    case 'treemap': {
      const TREEMAP_COLORS = colors;
      const treemapData = data.map((d, i) => ({
        name: d.label,
        value: d.value,
        fill: d.color || TREEMAP_COLORS[i % TREEMAP_COLORS.length],
      }));
      return (
        <Treemap width={width} height={height}
          data={treemapData}
          dataKey="value"
          aspectRatio={width / height}
          content={({ x, y, width: w, height: h, name, fill }) => (
            <g>
              <rect x={x + 1} y={y + 1} width={w - 2} height={h - 2}
                fill={fill} rx={4} />
              {w > 50 && h > 30 && (
                <text x={x + w / 2} y={y + h / 2}
                  textAnchor="middle" dominantBaseline="middle"
                  fontSize={Math.min(12, w / 6)} fill="#fff"
                  fontWeight="bold">
                  {name}
                </text>
              )}
            </g>
          )}
        />
      );
    }

    case 'radialBar': {
      const radialData = data.map((d, i) => ({
        name: d.label,
        value: d.value,
        fill: d.color || colors[i % colors.length],
      }));
      return (
        <RadialBarChart width={width} height={height}
          innerRadius="20%" outerRadius="90%"
          data={radialData}
          cx="50%" cy="50%"
        >
          <RadialBar dataKey="value" background
            label={{ position: 'insideStart', fill: '#fff', fontSize: 11 }}
          />
          {legendEl}
          {tooltipEl}
        </RadialBarChart>
      );
    }

    case 'progress': {
      if (el.variant === 'bar') return <ProgressBar el={el} />;
      return <ProgressRing el={el} />;
    }

    default:
      return <div className="flex items-center justify-center w-full h-full text-gray-400 text-sm">Unknown chart type</div>;
  }
}

export default function ChartElement({ el, stagePos, zoom }) {
  const setSelectedIds = useEditorStore(s => s.setSelectedIds);
  const toggleSelectedId = useEditorStore(s => s.toggleSelectedId);
  const isSelected = useEditorStore(s => s.selectedId === el.id ||
    s.selectedIds.includes(el.id));

  const handleClick = (e) => {
    e.stopPropagation();
    if (e.shiftKey) {
      toggleSelectedId(el.id);
    } else {
      setSelectedIds([el.id]);
    }
  };

  const style = {
    position: 'absolute',
    left: el.x * zoom + stagePos.x,
    top: el.y * zoom + stagePos.y,
    width: el.width * zoom,
    height: el.height * zoom,
    transform: `rotate(${el.rotation || 0}deg)`,
    opacity: el.opacity ?? 1,
    transformOrigin: 'top left',
    pointerEvents: isSelected ? 'none' : 'auto',
    overflow: 'hidden',
  };

  return (
    <div style={style} onClick={handleClick}>
      <div style={{
        transform: `scale(${zoom})`,
        transformOrigin: 'top left',
        width: el.width,
        height: el.height,
        background: 'transparent',
      }}>
        {el.title && (
          <div style={{
            textAlign: 'center',
            fontSize: 13,
            fontWeight: 600,
            color: '#1e293b',
            marginBottom: 4,
            fontFamily: 'Inter, sans-serif',
          }}>
            {el.title}
          </div>
        )}
        {renderChart(el)}
      </div>
    </div>
  );
}
