import { useState } from "react";
import useEditorStore from "../store/useEditorStore";
import { TABLE_PRESETS, generateDefaultCells } from "../utils/tableDefaults";
import { useToast } from "./Toast";

function TablePreview({ preset, onAdd }) {
  const rows = preset.cells?.length ?? preset.rows ?? 2;
  const cols = preset.cells?.[0]?.length ?? preset.cols ?? 2;
  const cells = preset.cells ?? generateDefaultCells(rows, cols, preset.colorScheme, preset.style);

  return (
    <button
      type="button"
      onClick={onAdd}
      className="flex flex-col items-center gap-1.5 p-2 rounded-xl border border-gray-200 hover:border-purple-400 hover:bg-purple-50 transition-all group"
    >
      <div className="w-full h-20 overflow-hidden rounded-lg bg-gray-50 flex items-center justify-center pointer-events-none">
        <table
          style={{
            width: "100%",
            height: "100%",
            borderCollapse: "collapse",
            tableLayout: "fixed",
            fontSize: 8,
            fontFamily: "Inter, sans-serif",
          }}
        >
          <tbody>
            {cells.slice(0, 3).map((row, ri) => (
              <tr key={ri}>
                {row.slice(0, 4).map((cell, ci) => (
                  <td
                    key={ci}
                    style={{
                      background: cell.bg,
                      color: cell.color,
                      fontWeight: cell.bold ? 700 : 400,
                      textAlign: cell.align,
                      padding: "2px 4px",
                      border: "1px solid #e2e8f0",
                    }}
                  >
                    {String(cell.text).slice(0, 6)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <span className="text-[11px] text-gray-600 group-hover:text-purple-700 font-medium text-center leading-tight">
        {preset.label}
      </span>
    </button>
  );
}

export default function TablesPanel() {
  const addElement = useEditorStore((s) => s.addElement);
  const toast = useToast();

  const handleAdd = (preset) => {
    const rows = preset.rows ?? preset.cells?.length ?? 2;
    const cols = preset.cols ?? preset.cells?.[0]?.length ?? 2;
    const cells =
      preset.cells ?? generateDefaultCells(rows, cols, preset.colorScheme, preset.style);

    addElement({
      type: "table",
      x: 80,
      y: 80,
      width: 500,
      height: Math.max(120, rows * 40),
      rotation: 0,
      opacity: 1,
      rows,
      cols,
      headerRow: preset.headerRow ?? true,
      headerCol: preset.headerCol ?? false,
      style: preset.style ?? "clean",
      colorScheme: preset.colorScheme ?? "purple",
      cells,
      fontSize: 13,
      cellPadding: 8,
      borderColor: "#e2e8f0",
    });
    toast("Table added!", "success");
  };

  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs text-gray-500">
        Click a table to add it to your canvas. Double-click cells to edit.
      </p>
      <div className="grid grid-cols-2 gap-2">
        {TABLE_PRESETS.map((preset) => (
          <TablePreview key={preset.id} preset={preset} onAdd={() => handleAdd(preset)} />
        ))}
      </div>
    </div>
  );
}
