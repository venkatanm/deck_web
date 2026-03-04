import React from "react";
import useEditorStore from "../store/useEditorStore";

const TableElement = React.memo(function TableElement({ el, zoom }) {
  const updateElement = useEditorStore((s) => s.updateElement);
  const setSelectedIds = useEditorStore((s) => s.setSelectedIds);
  const toggleSelectedId = useEditorStore((s) => s.toggleSelectedId);
  const isSelected = useEditorStore(
    (s) => s.selectedId === el.id || s.selectedIds?.includes(el.id)
  );

  const handleClick = (e) => {
    if (e.target.closest("td[contenteditable]") && document.activeElement?.closest("td")) return;
    e.stopPropagation();
    if (e.shiftKey) {
      toggleSelectedId(el.id);
    } else {
      setSelectedIds([el.id]);
    }
  };

  const updateCell = (r, c, text) => {
    const cells = el.cells || [];
    const newCells = cells.map((row, ri) =>
      row.map((cell, ci) =>
        ri === r && ci === c ? { ...cell, text } : cell
      )
    );
    updateElement(el.id, { cells: newCells });
  };

  const style = {
    position: "absolute",
    left: el.x * zoom,
    top: el.y * zoom,
    width: el.width * zoom,
    height: el.height * zoom,
    opacity: el.opacity ?? 1,
    transform: `rotate(${el.rotation || 0}deg)`,
    transformOrigin: "top left",
    pointerEvents: isSelected ? "auto" : "auto",
    overflow: "hidden",
  };

  const cells = el.cells || [];
  const borderColor = el.borderColor || "#e2e8f0";
  const cellPadding = el.cellPadding ?? 8;
  const fontSize = el.fontSize ?? 13;

  const getCellStyle = (cell, ri, ci) => {
    const base = {
      background: cell.bg || "#ffffff",
      color: cell.color || "#1e293b",
      fontWeight: cell.bold ? 700 : 400,
      textAlign: cell.align || "left",
      padding: `${cellPadding}px`,
      verticalAlign: "middle",
      overflow: "hidden",
      outline: "none",
      cursor: "text",
    };

    const styleName = el.style || "clean";
    if (styleName === "minimal") {
      base.border = "none";
      base.borderBottom = `1px solid ${borderColor}`;
    } else if (styleName === "bordered") {
      base.border = `1px solid ${borderColor}`;
    } else {
      base.border = `1px solid ${borderColor}`;
    }
    return base;
  };

  return (
    <div style={style} onClick={handleClick}>
      <div
        style={{
          transform: `scale(${zoom})`,
          transformOrigin: "top left",
          width: el.width,
          height: el.height,
        }}
      >
        <table
          style={{
            width: "100%",
            height: "100%",
            borderCollapse: "collapse",
            tableLayout: "fixed",
            fontFamily: "Inter, sans-serif",
            fontSize,
          }}
        >
          <tbody>
            {cells.map((row, ri) => (
              <tr key={ri}>
                {row.map((cell, ci) => (
                  <td
                    key={ci}
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => updateCell(ri, ci, e.target.innerText)}
                    onKeyDown={(e) => {
                      if (e.key === "Tab") {
                        e.preventDefault();
                        const next = document.activeElement?.nextElementSibling;
                        if (next) next.focus();
                      }
                    }}
                    style={getCellStyle(cell, ri, ci)}
                  >
                    {cell.text}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}, (prev, next) => prev.el === next.el && prev.zoom === next.zoom);

export default TableElement;
