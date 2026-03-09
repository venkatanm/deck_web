import { Grid3X3, Trash2 } from "lucide-react";
import useEditorStore from "../store/useEditorStore";
import { generateDefaultCells } from "../utils/tableDefaults";
import { CHART_COLOR_SCHEMES } from "../utils/defaults";

const Divider = () => <div className="w-px h-6 bg-gray-200 mx-1 flex-shrink-0" />;

const STYLES = [
  { id: "clean", label: "Clean" },
  { id: "striped", label: "Striped" },
  { id: "bordered", label: "Bordered" },
  { id: "minimal", label: "Minimal" },
  { id: "dark", label: "Dark" },
];

const COLOR_SCHEMES = ["purple", "blue", "teal", "warm", "mono"];

export default function TableToolbar({ el }) {
  const updateElement = useEditorStore((s) => s.updateElement);
  const deleteElement = useEditorStore((s) => s.deleteElement);

  const rows = el.rows ?? el.cells?.length ?? 2;
  const cols = el.cols ?? el.cells?.[0]?.length ?? 2;

  const addRow = () => {
    const cells = el.cells || [];
    const lastRow = cells[cells.length - 1];
    const newRow = lastRow
      ? lastRow.map((c) => ({ ...c, text: "" }))
      : Array.from({ length: cols }, (_, c) => ({
          text: "",
          bold: false,
          align: c === 0 ? "left" : "center",
          bg: "#ffffff",
          color: "#1e293b",
        }));
    const newCells = [...cells, newRow];
    updateElement(el.id, { cells: newCells, rows: newCells.length });
  };

  const removeRow = () => {
    if (rows <= 1) return;
    const newCells = (el.cells || []).slice(0, -1);
    updateElement(el.id, { cells: newCells, rows: newCells.length });
  };

  const addCol = () => {
    const cells = el.cells || [];
    const newCells = cells.map((row, ri) => {
      const lastCell = row[row.length - 1];
      const newCell = lastCell
        ? { ...lastCell, text: "" }
        : {
            text: "",
            bold: ri === 0,
            align: "center",
            bg: ri === 0 ? CHART_COLOR_SCHEMES[el.colorScheme || "purple"][0] : "#ffffff",
            color: ri === 0 ? "#ffffff" : "#1e293b",
          };
      return [...row, newCell];
    });
    updateElement(el.id, { cells: newCells, cols: cols + 1 });
  };

  const removeCol = () => {
    if (cols <= 1) return;
    const newCells = (el.cells || []).map((row) => row.slice(0, -1));
    updateElement(el.id, { cells: newCells, cols: cols - 1 });
  };

  const setStyle = (style) => {
    const cells = generateDefaultCells(rows, cols, el.colorScheme, style);
    updateElement(el.id, { style, cells });
  };

  const setColorScheme = (colorScheme) => {
    const cells = generateDefaultCells(rows, cols, colorScheme, el.style);
    updateElement(el.id, { colorScheme, cells });
  };

  const setHeaderRow = (headerRow) => {
    const cells = (el.cells || []).map((row, ri) =>
      row.map((cell, ci) =>
        ri === 0 && headerRow
          ? { ...cell, bold: true, bg: CHART_COLOR_SCHEMES[el.colorScheme || "purple"][0], color: "#ffffff" }
          : ri === 0 && !headerRow
            ? { ...cell, bold: false, bg: "#ffffff", color: "#1e293b" }
            : cell
      )
    );
    updateElement(el.id, { headerRow, cells });
  };

  const setHeaderCol = (headerCol) => {
    const colors = CHART_COLOR_SCHEMES[el.colorScheme || "purple"];
    const primary = colors[0];
    const cells = (el.cells || []).map((row, ri) =>
      row.map((cell, ci) =>
        ci === 0 && headerCol
          ? { ...cell, bold: true, bg: primary, color: "#ffffff" }
          : ci === 0 && !headerCol
            ? { ...cell, bold: false, bg: row[0]?.bg === primary ? "#ffffff" : cell.bg, color: "#1e293b" }
            : cell
      )
    );
    updateElement(el.id, { headerCol, cells });
  };

  return (
    <div className="h-12 bg-white border-b border-gray-200 flex items-center gap-1 px-4 overflow-x-auto text-gray-900">
      <div className="flex items-center gap-1 text-sm text-gray-600">
        <Grid3X3 className="w-4 h-4" />
        <span>Table</span>
      </div>
      <Divider />
      <div className="flex items-center gap-1">
        <span className="text-xs text-gray-500">Rows:</span>
        <button
          type="button"
          onClick={removeRow}
          disabled={rows <= 1}
          className="w-6 h-6 rounded border border-gray-200 text-gray-600 hover:bg-gray-100 disabled:opacity-40 text-sm font-medium"
        >
          −
        </button>
        <span className="text-xs w-6 text-center">{rows}</span>
        <button
          type="button"
          onClick={addRow}
          className="w-6 h-6 rounded border border-gray-200 text-gray-600 hover:bg-gray-100 text-sm font-medium"
        >
          +
        </button>
      </div>
      <div className="flex items-center gap-1">
        <span className="text-xs text-gray-500">Cols:</span>
        <button
          type="button"
          onClick={removeCol}
          disabled={cols <= 1}
          className="w-6 h-6 rounded border border-gray-200 text-gray-600 hover:bg-gray-100 disabled:opacity-40 text-sm font-medium"
        >
          −
        </button>
        <span className="text-xs w-6 text-center">{cols}</span>
        <button
          type="button"
          onClick={addCol}
          className="w-6 h-6 rounded border border-gray-200 text-gray-600 hover:bg-gray-100 text-sm font-medium"
        >
          +
        </button>
      </div>
      <Divider />
      <select
        value={el.style || "clean"}
        onChange={(e) => setStyle(e.target.value)}
        className="text-xs text-gray-900 border border-gray-200 rounded px-2 py-1 bg-white"
      >
        {STYLES.map((s) => (
          <option key={s.id} value={s.id}>
            {s.label}
          </option>
        ))}
      </select>
      <Divider />
      <div className="flex gap-1">
        {COLOR_SCHEMES.map((scheme) => (
          <button
            key={scheme}
            type="button"
            onClick={() => setColorScheme(scheme)}
            className="w-5 h-5 rounded border-2 border-transparent hover:border-purple-400 transition-colors"
            style={{ background: CHART_COLOR_SCHEMES[scheme][0] }}
            title={scheme}
          />
        ))}
      </div>
      <Divider />
      <label className="flex items-center gap-1 text-xs">
        <input
          type="checkbox"
          checked={el.headerRow !== false}
          onChange={(e) => setHeaderRow(e.target.checked)}
        />
        Header Row
      </label>
      <label className="flex items-center gap-1 text-xs">
        <input
          type="checkbox"
          checked={el.headerCol === true}
          onChange={(e) => setHeaderCol(e.target.checked)}
        />
        Header Col
      </label>
      <Divider />
      <div className="flex items-center gap-1">
        <span className="text-xs text-gray-500">Opacity:</span>
        <input
          type="range"
          min="0.1"
          max="1"
          step="0.1"
          value={el.opacity ?? 1}
          onChange={(e) => updateElement(el.id, { opacity: parseFloat(e.target.value) })}
          className="w-16"
        />
      </div>
      <Divider />
      <button
        type="button"
        onClick={() => deleteElement(el.id)}
        className="p-1.5 rounded-md text-red-600 hover:bg-red-50"
        title="Delete"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}
