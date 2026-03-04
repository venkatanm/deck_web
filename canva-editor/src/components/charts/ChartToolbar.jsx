import { useState } from 'react';
import { Table2, Grid, List } from 'lucide-react';
import useEditorStore from '../../store/useEditorStore';
import { CHART_COLOR_SCHEMES } from '../../utils/defaults';
import ChartDataEditor from './ChartDataEditor';

const Divider = () => (
  <div className="w-px h-6 bg-gray-200 mx-1 flex-shrink-0" />
);

const ToolBtn = ({ onClick, active, disabled, title, children }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={`
      p-1.5 rounded-md text-sm flex items-center justify-center
      transition-colors duration-100 flex-shrink-0
      ${active ? 'bg-purple-100 text-purple-700' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}
      ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
    `}
  >
    {children}
  </button>
);

const OpacityControl = ({ value, onChange }) => (
  <div className="flex items-center gap-2 flex-shrink-0">
    <span className="text-xs text-gray-500 w-14 text-right flex-shrink-0">
      {Math.round((value ?? 1) * 100)}%
    </span>
    <input
      type="range"
      min={0}
      max={100}
      value={Math.round((value ?? 1) * 100)}
      onChange={(e) => onChange(Number(e.target.value) / 100)}
      className="w-20 accent-purple-600 cursor-pointer"
    />
  </div>
);

export function ChartToolbar({ el }) {
  const update = (props) => useEditorStore.getState().updateElement(el.id, props);
  const [showDataEditor, setShowDataEditor] = useState(false);

  return (
    <div className="h-12 bg-white border-b border-gray-200 flex items-center px-4 gap-2 overflow-x-auto">
      {/* Chart type badge */}
      <span className="text-xs font-semibold text-purple-600 bg-purple-50 px-2 py-1 rounded-md capitalize flex-shrink-0">
        {el.chartType} chart
      </span>

      <Divider />

      {/* Edit Data button */}
      <ToolBtn
        onClick={() => setShowDataEditor(true)}
        title="Edit chart data"
      >
        <Table2 className="w-4 h-4" />
        <span className="text-xs ml-1 font-medium">Edit Data</span>
      </ToolBtn>

      <Divider />

      {/* Variant selector */}
      {el.chartType === 'bar' && (
        <div className="flex gap-1 flex-shrink-0">
          {['grouped', 'stacked', 'horizontal'].map(v => (
            <ToolBtn key={v} active={el.variant === v}
              onClick={() => update({ variant: v })}
              title={v + ' bar'}>
              <span className="text-[10px] capitalize">{v}</span>
            </ToolBtn>
          ))}
        </div>
      )}
      {el.chartType === 'line' && (
        <div className="flex gap-1 flex-shrink-0">
          {['linear', 'smooth', 'step'].map(v => (
            <ToolBtn key={v} active={el.variant === v}
              onClick={() => update({ variant: v })}
              title={v + ' line'}>
              <span className="text-[10px] capitalize">{v}</span>
            </ToolBtn>
          ))}
        </div>
      )}
      {el.chartType === 'pie' && (
        <div className="flex gap-1 flex-shrink-0">
          <ToolBtn active={el.variant === 'pie'} onClick={() => update({ variant: 'pie' })}>
            <span className="text-[10px]">Pie</span>
          </ToolBtn>
          <ToolBtn active={el.variant === 'donut'} onClick={() => update({ variant: 'donut' })}>
            <span className="text-[10px]">Donut</span>
          </ToolBtn>
        </div>
      )}
      {el.chartType === 'area' && (
        <div className="flex gap-1 flex-shrink-0">
          <ToolBtn active={el.variant === 'stacked'} onClick={() => update({ variant: 'stacked' })}>
            <span className="text-[10px]">Stacked</span>
          </ToolBtn>
          <ToolBtn active={el.variant === 'unstacked'} onClick={() => update({ variant: 'unstacked' })}>
            <span className="text-[10px]">Unstacked</span>
          </ToolBtn>
        </div>
      )}
      {el.chartType === 'progress' && (
        <div className="flex gap-1 flex-shrink-0">
          <ToolBtn active={el.variant === 'ring'} onClick={() => update({ variant: 'ring' })}>
            <span className="text-[10px]">Ring</span>
          </ToolBtn>
          <ToolBtn active={el.variant === 'bar'} onClick={() => update({ variant: 'bar' })}>
            <span className="text-[10px]">Bar</span>
          </ToolBtn>
        </div>
      )}

      <Divider />

      {/* Color scheme */}
      <div className="flex gap-1 flex-shrink-0">
        {Object.entries(CHART_COLOR_SCHEMES).map(([name, colors]) => (
          <button
            key={name}
            title={name}
            onClick={() => update({ colorScheme: name })}
            className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all
              ${el.colorScheme === name ? 'border-gray-800 scale-110' : 'border-transparent'}`}
            style={{ background: `linear-gradient(135deg, ${colors[0]}, ${colors[2]})` }}
          />
        ))}
      </div>

      <Divider />

      {/* Toggles */}
      {el.showGrid !== undefined && (
        <ToolBtn active={el.showGrid} onClick={() => update({ showGrid: !el.showGrid })}
          title="Toggle grid">
          <Grid className="w-4 h-4" />
        </ToolBtn>
      )}
      {el.showLegend !== undefined && (
        <ToolBtn active={el.showLegend} onClick={() => update({ showLegend: !el.showLegend })}
          title="Toggle legend">
          <List className="w-4 h-4" />
        </ToolBtn>
      )}

      <Divider />

      {/* Title edit */}
      <input
        value={el.title || ''}
        onChange={e => update({ title: e.target.value })}
        placeholder="Chart title..."
        className="text-xs border border-gray-200 rounded-md px-2 py-1 w-32 focus:outline-none focus:border-purple-400"
      />

      <Divider />

      {/* Opacity */}
      <OpacityControl value={el.opacity} onChange={v => update({ opacity: v })} />

      {/* Data editor modal */}
      {showDataEditor && (
        <ChartDataEditor el={el} onClose={() => setShowDataEditor(false)} />
      )}
    </div>
  );
}
