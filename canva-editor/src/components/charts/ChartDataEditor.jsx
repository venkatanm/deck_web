import { useState } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import useEditorStore from '../../store/useEditorStore';

export default function ChartDataEditor({ el, onClose }) {
  const updateElement = useEditorStore(s => s.updateElement);
  const [data, setData] = useState(JSON.parse(JSON.stringify(el.data || [])));
  const [series, setSeries] = useState(JSON.parse(JSON.stringify(el.series || [])));
  const [progressValue, setProgressValue] = useState(el.value ?? 72);

  const isPie = el.chartType === 'pie';
  const isProgress = el.chartType === 'progress';
  const isScatter = el.chartType === 'scatter';

  const save = () => {
    updateElement(el.id, { data, series });
    onClose();
  };

  const saveProgress = () => {
    updateElement(el.id, { value: progressValue });
    onClose();
  };

  // PIE / FUNNEL / TREEMAP — simple label + value table
  if (isPie || el.chartType === 'funnel' || el.chartType === 'treemap') {
    return (
      <DataEditorShell title="Edit Data" onClose={onClose} onSave={save}>
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-gray-50">
              <th className="border border-gray-200 px-3 py-2 text-left font-medium text-gray-600">Label</th>
              <th className="border border-gray-200 px-3 py-2 text-left font-medium text-gray-600">Value</th>
              <th className="w-8"></th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr key={i} className="hover:bg-gray-50">
                <td className="border border-gray-200 p-1">
                  <input
                    className="w-full px-2 py-1 text-xs outline-none focus:bg-purple-50 rounded"
                    value={row.label || ''}
                    onChange={e => {
                      const d = [...data];
                      d[i] = { ...d[i], label: e.target.value };
                      setData(d);
                    }}
                  />
                </td>
                <td className="border border-gray-200 p-1">
                  <input
                    type="number"
                    className="w-full px-2 py-1 text-xs outline-none focus:bg-purple-50 rounded"
                    value={row.value ?? 0}
                    onChange={e => {
                      const d = [...data];
                      d[i] = { ...d[i], value: Number(e.target.value) };
                      setData(d);
                    }}
                  />
                </td>
                <td className="border border-gray-200 p-1">
                  <button onClick={() => setData(data.filter((_, j) => j !== i))}
                    className="text-red-400 hover:text-red-600 p-1">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <button
          onClick={() => setData([...data, { label: `Item ${data.length + 1}`, value: 10 }])}
          className="mt-2 text-xs text-purple-600 flex items-center gap-1 hover:text-purple-800"
        >
          <Plus className="w-3 h-3" /> Add row
        </button>
      </DataEditorShell>
    );
  }

  // PROGRESS — single value
  if (isProgress) {
    return (
      <DataEditorShell title="Edit Progress" onClose={onClose} onSave={saveProgress}>
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-gray-600">Value (%)</label>
          <input
            type="number"
            min={0}
            max={100}
            value={progressValue}
            onChange={e => setProgressValue(Number(e.target.value))}
            className="w-20 px-2 py-1 text-xs border border-gray-200 rounded focus:outline-none focus:border-purple-400"
          />
        </div>
      </DataEditorShell>
    );
  }

  // SCATTER — x, y, z table
  if (isScatter) {
    return (
      <DataEditorShell title="Edit Data" onClose={onClose} onSave={save}>
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-gray-50">
              <th className="border border-gray-200 px-3 py-2 text-left font-medium text-gray-600">X</th>
              <th className="border border-gray-200 px-3 py-2 text-left font-medium text-gray-600">Y</th>
              <th className="border border-gray-200 px-3 py-2 text-left font-medium text-gray-600">Z</th>
              <th className="w-8"></th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr key={i} className="hover:bg-gray-50">
                <td className="border border-gray-200 p-1">
                  <input
                    type="number"
                    className="w-full px-2 py-1 text-xs outline-none focus:bg-purple-50 rounded"
                    value={row.x ?? 0}
                    onChange={e => {
                      const d = [...data];
                      d[i] = { ...d[i], x: Number(e.target.value) };
                      setData(d);
                    }}
                  />
                </td>
                <td className="border border-gray-200 p-1">
                  <input
                    type="number"
                    className="w-full px-2 py-1 text-xs outline-none focus:bg-purple-50 rounded"
                    value={row.y ?? 0}
                    onChange={e => {
                      const d = [...data];
                      d[i] = { ...d[i], y: Number(e.target.value) };
                      setData(d);
                    }}
                  />
                </td>
                <td className="border border-gray-200 p-1">
                  <input
                    type="number"
                    className="w-full px-2 py-1 text-xs outline-none focus:bg-purple-50 rounded"
                    value={row.z ?? 0}
                    onChange={e => {
                      const d = [...data];
                      d[i] = { ...d[i], z: Number(e.target.value) };
                      setData(d);
                    }}
                  />
                </td>
                <td className="border border-gray-200 p-1">
                  <button onClick={() => setData(data.filter((_, j) => j !== i))}
                    className="text-red-400 hover:text-red-600 p-1">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <button
          onClick={() => setData([...data, { x: 0, y: 0, z: 100 }])}
          className="mt-2 text-xs text-purple-600 flex items-center gap-1 hover:text-purple-800"
        >
          <Plus className="w-3 h-3" /> Add row
        </button>
      </DataEditorShell>
    );
  }

  // MULTI-SERIES — label + series columns
  return (
    <DataEditorShell title="Edit Data" onClose={onClose} onSave={save}>
      {/* Series management */}
      <div className="flex items-center gap-2 flex-wrap mb-3">
        {series.map((s, i) => (
          <div key={i} className="flex items-center gap-1 bg-gray-100 rounded-full px-2 py-1">
            <input
              type="color"
              value={s.color || '#7c3aed'}
              onChange={e => {
                const ns = [...series];
                ns[i] = { ...ns[i], color: e.target.value };
                setSeries(ns);
              }}
              className="w-4 h-4 rounded-full cursor-pointer border-0"
            />
            <input
              value={s.name || ''}
              onChange={e => {
                const ns = [...series];
                ns[i] = { ...ns[i], name: e.target.value };
                setSeries(ns);
              }}
              className="text-xs w-20 outline-none bg-transparent"
            />
            {series.length > 1 && (
              <button onClick={() => {
                const ns = series.filter((_, j) => j !== i);
                const nd = data.map(row => {
                  const r = { ...row };
                  delete r[s.key];
                  return r;
                });
                setSeries(ns);
                setData(nd);
              }}>
                <X className="w-3 h-3 text-gray-400" />
              </button>
            )}
          </div>
        ))}
        <button
          onClick={() => {
            const key = `series${series.length + 1}`;
            setSeries([...series, { key, name: `Series ${series.length + 1}`, color: '#06b6d4' }]);
            setData(data.map(row => ({ ...row, [key]: 0 })));
          }}
          className="text-xs text-purple-600 flex items-center gap-1 hover:text-purple-800"
        >
          <Plus className="w-3 h-3" /> Add series
        </button>
      </div>

      {/* Data table */}
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="bg-gray-50">
            <th className="border border-gray-200 px-3 py-2 text-left font-medium text-gray-600">Label</th>
            {series.map(s => (
              <th key={s.key} className="border border-gray-200 px-3 py-2 text-left font-medium" style={{ color: s.color }}>
                {s.name}
              </th>
            ))}
            <th className="w-8"></th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} className="hover:bg-gray-50">
              <td className="border border-gray-200 p-1">
                <input
                  className="w-full px-2 py-1 text-xs outline-none focus:bg-purple-50 rounded"
                  value={row.label || ''}
                  onChange={e => {
                    const d = [...data];
                    d[i] = { ...d[i], label: e.target.value };
                    setData(d);
                  }}
                />
              </td>
              {series.map(s => (
                <td key={s.key} className="border border-gray-200 p-1">
                  <input
                    type="number"
                    className="w-full px-2 py-1 text-xs outline-none focus:bg-purple-50 rounded"
                    value={row[s.key] ?? 0}
                    onChange={e => {
                      const d = [...data];
                      d[i] = { ...d[i], [s.key]: Number(e.target.value) };
                      setData(d);
                    }}
                  />
                </td>
              ))}
              <td className="border border-gray-200 p-1">
                <button onClick={() => setData(data.filter((_, j) => j !== i))}
                  className="text-red-400 hover:text-red-600 p-1">
                  <Trash2 className="w-3 h-3" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button
        onClick={() => {
          const newRow = { label: `Item ${data.length + 1}` };
          series.forEach(s => { newRow[s.key] = 0; });
          setData([...data, newRow]);
        }}
        className="mt-2 text-xs text-purple-600 flex items-center gap-1 hover:text-purple-800"
      >
        <Plus className="w-3 h-3" /> Add row
      </button>
    </DataEditorShell>
  );
}

function DataEditorShell({ title, onClose, onSave, children }) {
  return (
    <div className="fixed inset-0 z-[9990] flex items-end justify-center"
      onClick={onClose}>
      <div className="bg-white rounded-t-2xl shadow-2xl w-full max-w-2xl max-h-[70vh] flex flex-col"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800 text-sm">{title}</h3>
          <div className="flex gap-2">
            <button onClick={onClose} className="text-xs text-gray-400 px-3 py-1.5 rounded-lg hover:bg-gray-100">Cancel</button>
            <button onClick={onSave} className="text-xs bg-purple-600 text-white px-4 py-1.5 rounded-lg hover:bg-purple-700 font-medium">
              Apply
            </button>
          </div>
        </div>
        <div className="overflow-y-auto p-4 flex-1">
          {children}
        </div>
      </div>
    </div>
  );
}
