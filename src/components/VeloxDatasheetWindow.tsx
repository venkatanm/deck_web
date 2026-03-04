/**
 * VeloxDatasheetWindow - Floating spreadsheet for editing ChartElement data.
 * Binds directly to the selected chart's data in the Zustand store.
 * Top row = categories, left column = series.name, inner cells = series.values.
 */

import { useCallback, useEffect, useState } from "react";
import type { ChartData, ChartElement, ChartSeries } from "@deck-web/schema";
import { usePresentationStore } from "../store/usePresentationStore";

/** Find a ChartElement by id in the element tree */
function findChartElement(
  elements: import("@deck-web/schema").CanvasElement[],
  elementId: string
): ChartElement | null {
  for (const el of elements) {
    if (el.id === elementId && el.type === "chart") return el;
    if (el.type === "group" && "elements" in el) {
      const found = findChartElement(el.elements, elementId);
      if (found) return found;
    }
    if (el.type === "smartContainer" && "elements" in el) {
      const found = findChartElement(el.elements, elementId);
      if (found) return found;
    }
  }
  return null;
}

const ACCENT_KEYS = [
  "accent1",
  "accent2",
  "accent3",
  "accent4",
  "accent5",
  "accent6",
] as const;

function nextColorToken(seriesIndex: number): (typeof ACCENT_KEYS)[number] {
  return ACCENT_KEYS[seriesIndex % ACCENT_KEYS.length]!;
}

const cellStyle: React.CSSProperties = {
  padding: "8px 12px",
  border: "1px solid #e2e8f0",
  outline: "none",
  fontSize: 13,
  background: "#fff",
  color: "#334155",
  minWidth: 80,
};

const headerCellStyle: React.CSSProperties = {
  ...cellStyle,
  background: "#f8fafc",
  fontWeight: 600,
  color: "#475569",
};

export function VeloxDatasheetWindow() {
  const presentation = usePresentationStore((s) => s.presentation);
  const currentSlideId = usePresentationStore((s) => s.currentSlideId);
  const selectedElementIds = usePresentationStore((s) => s.selectedElementIds);
  const updateChartElementData = usePresentationStore(
    (s) => s.updateChartElementData
  );
  const commitHistory = usePresentationStore((s) => s.commitHistory);

  const [localData, setLocalData] = useState<ChartData | null>(null);
  const [editingCell, setEditingCell] = useState<{
    row: number;
    col: number;
    value: string;
  } | null>(null);

  const selection = selectedElementIds[0];
  const isSingleChartSelected =
    selectedElementIds.length === 1 &&
    selection?.slideId === currentSlideId;

  const chartElement = isSingleChartSelected
    ? (() => {
        const slide = presentation.slides.find((s) => s.id === selection!.slideId);
        return slide ? findChartElement(slide.elements, selection!.elementId) : null;
      })()
    : null;

  useEffect(() => {
    if (chartElement) {
      setLocalData(chartElement.data);
    } else {
      setLocalData(null);
    }
  }, [chartElement?.id, chartElement ? JSON.stringify(chartElement.data) : null]);

  const handleDataChange = useCallback(
    (newData: ChartData) => {
      if (!selection || !currentSlideId) return;
      commitHistory();
      updateChartElementData(selection.slideId, selection.elementId, newData);
      setLocalData(newData);
    },
    [selection, currentSlideId, updateChartElementData, commitHistory]
  );

  const handleCategoryChange = useCallback(
    (colIndex: number, value: string) => {
      if (!localData) return;
      const categories = [...localData.categories];
      categories[colIndex] = value;
      handleDataChange({ ...localData, categories });
    },
    [localData, handleDataChange]
  );

  const handleSeriesNameChange = useCallback(
    (rowIndex: number, value: string) => {
      if (!localData) return;
      const series = [...localData.series];
      series[rowIndex] = { ...series[rowIndex]!, name: value };
      handleDataChange({ ...localData, series });
    },
    [localData, handleDataChange]
  );

  const handleValueChange = useCallback(
    (rowIndex: number, colIndex: number, value: string) => {
      if (!localData) return;
      const num = parseFloat(value);
      if (Number.isNaN(num)) return;
      const series = [...localData.series];
      const values = [...series[rowIndex]!.values];
      values[colIndex] = num;
      series[rowIndex] = { ...series[rowIndex]!, values };
      handleDataChange({ ...localData, series });
    },
    [localData, handleDataChange]
  );

  const handleAddColumn = useCallback(() => {
    if (!localData) return;
    const categories = [...localData.categories, `C${localData.categories.length + 1}`];
    const series = localData.series.map((s) => ({
      ...s,
      values: [...s.values, 0],
    }));
    handleDataChange({ categories, series });
  }, [localData, handleDataChange]);

  const handleAddRow = useCallback(() => {
    if (!localData) return;
    const newSeries: ChartSeries = {
      name: `Series ${localData.series.length + 1}`,
      colorToken: nextColorToken(localData.series.length),
      values: localData.categories.map(() => 0),
    };
    handleDataChange({
      ...localData,
      series: [...localData.series, newSeries],
    });
  }, [localData, handleDataChange]);

  const handleRemoveColumn = useCallback(
    (colIndex: number) => {
      if (!localData || localData.categories.length <= 1) return;
      const categories = localData.categories.filter((_, i) => i !== colIndex);
      const series = localData.series.map((s) => ({
        ...s,
        values: s.values.filter((_, i) => i !== colIndex),
      }));
      handleDataChange({ categories, series });
    },
    [localData, handleDataChange]
  );

  const handleRemoveRow = useCallback(
    (rowIndex: number) => {
      if (!localData || localData.series.length <= 1) return;
      const series = localData.series.filter((_, i) => i !== rowIndex);
      handleDataChange({ ...localData, series });
    },
    [localData, handleDataChange]
  );

  if (!chartElement || !localData) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 80,
        right: 24,
        width: 420,
        maxHeight: "calc(100vh - 120px)",
        background: "#fff",
        borderRadius: 12,
        boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.06)",
        border: "1px solid #e2e8f0",
        zIndex: 9000,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "14px 16px",
          borderBottom: "1px solid #e2e8f0",
          fontSize: 14,
          fontWeight: 600,
          color: "#334155",
        }}
      >
        Chart Data
      </div>
      <div style={{ overflow: "auto", flex: 1, padding: 12 }}>
        <table
          style={{
            borderCollapse: "collapse",
            width: "100%",
            tableLayout: "fixed",
          }}
        >
          <thead>
            <tr>
              <th
                style={{
                  ...headerCellStyle,
                  minWidth: 100,
                  width: 100,
                }}
              />
              {localData.categories.map((cat, i) => (
                <th key={i}>
                  <input
                    type="text"
                    value={cat}
                    onChange={(e) => handleCategoryChange(i, e.target.value)}
                    onBlur={(e) => {
                      const v = e.target.value.trim();
                      if (v !== cat) handleCategoryChange(i, v || `C${i + 1}`);
                    }}
                    style={{ ...headerCellStyle, width: "100%", boxSizing: "border-box" }}
                  />
                </th>
              ))}
              <th style={{ ...headerCellStyle, width: 32, minWidth: 32 }} />
            </tr>
          </thead>
          <tbody>
            {localData.series.map((s, rowIndex) => (
              <tr key={rowIndex}>
                <td>
                  <input
                    type="text"
                    value={s.name}
                    onChange={(e) => handleSeriesNameChange(rowIndex, e.target.value)}
                    onBlur={(e) => {
                      const v = e.target.value.trim();
                      if (v !== s.name)
                        handleSeriesNameChange(rowIndex, v || `Series ${rowIndex + 1}`);
                    }}
                    style={{ ...cellStyle, width: "100%", boxSizing: "border-box" }}
                  />
                </td>
                {s.values.map((val, colIndex) => {
                  const isEditing =
                    editingCell?.row === rowIndex && editingCell?.col === colIndex;
                  const displayValue = isEditing
                    ? editingCell!.value
                    : String(val);
                  return (
                    <td key={colIndex}>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={displayValue}
                        onChange={(e) => {
                          const v = e.target.value;
                          if (v === "" || v === "-" || /^-?\d*\.?\d*$/.test(v)) {
                            setEditingCell({ row: rowIndex, col: colIndex, value: v });
                          }
                        }}
                        onFocus={() =>
                          setEditingCell({
                            row: rowIndex,
                            col: colIndex,
                            value: String(val),
                          })
                        }
                        onBlur={() => {
                          const v = editingCell?.row === rowIndex && editingCell?.col === colIndex
                            ? editingCell.value
                            : displayValue;
                          const num = parseFloat(v);
                          if (!Number.isNaN(num) && num !== val) {
                            handleValueChange(rowIndex, colIndex, v);
                          }
                          setEditingCell(null);
                        }}
                        style={{
                          ...cellStyle,
                          width: "100%",
                          boxSizing: "border-box",
                          textAlign: "right",
                        }}
                      />
                    </td>
                  );
                })}
                <td>
                  <button
                    type="button"
                    onClick={() => handleRemoveRow(rowIndex)}
                    disabled={localData.series.length <= 1}
                    style={{
                      padding: 4,
                      background: "transparent",
                      border: "none",
                      color: "#94a3b8",
                      cursor: localData.series.length > 1 ? "pointer" : "not-allowed",
                      fontSize: 12,
                    }}
                    title="Remove row"
                  >
                    ×
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <button
            type="button"
            onClick={handleAddRow}
            style={{
              padding: "8px 14px",
              fontSize: 12,
              background: "rgba(67,97,238,0.3)",
              color: "#93c5fd",
              border: "1px solid rgba(67,97,238,0.5)",
              borderRadius: 6,
              cursor: "pointer",
            }}
          >
            + Add Row
          </button>
          <button
            type="button"
            onClick={handleAddColumn}
            style={{
              padding: "8px 14px",
              fontSize: 12,
              background: "rgba(67,97,238,0.3)",
              color: "#93c5fd",
              border: "1px solid rgba(67,97,238,0.5)",
              borderRadius: 6,
              cursor: "pointer",
            }}
          >
            + Add Column
          </button>
          <button
            type="button"
            onClick={() => handleRemoveColumn(localData.categories.length - 1)}
            disabled={localData.categories.length <= 1}
            style={{
              padding: "8px 14px",
              fontSize: 12,
              background: "transparent",
              color: "#94a3b8",
              border: "1px solid rgba(255,255,255,0.2)",
              borderRadius: 6,
              cursor: localData.categories.length > 1 ? "pointer" : "not-allowed",
            }}
          >
            − Column
          </button>
        </div>
      </div>
    </div>
  );
}
