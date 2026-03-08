import { useState, useCallback, useEffect } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  horizontalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Plus, Trash2 } from "lucide-react";
import useEditorStore from "../store/useEditorStore";
import { usePageThumbnail } from "../hooks/usePageThumbnail";

function SortablePageThumb({ page, index, isActive, isSelected, stableId, onSelect }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: stableId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 999 : "auto",
  };

  const canvasSize = useEditorStore((s) => s.canvasSize);
  const setCurrentPage = useEditorStore((s) => s.setCurrentPage);
  const duplicatePage = useEditorStore((s) => s.duplicatePage);
  const deletePage = useEditorStore((s) => s.deletePage);
  const reorderPages = useEditorStore((s) => s.reorderPages);
  const pages = useEditorStore((s) => s.pages);

  const { thumbnail, loading } = usePageThumbnail(page, canvasSize, [
    JSON.stringify(page.elements),
  ]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ x: 0, y: 0 });

  const aspectRatio = canvasSize.height / canvasSize.width;
  const thumbWidth = 88;
  const thumbHeight = thumbWidth * aspectRatio;

  const handleContextMenu = (e) => {
    e.preventDefault();
    const MENU_H = 4 * 36 + 8; // 4 items × ~36px + padding
    const MENU_W = 160;
    const x = Math.min(e.clientX, window.innerWidth - MENU_W - 8);
    const y = Math.min(e.clientY, window.innerHeight - MENU_H - 8);
    setMenuPos({ x, y });
    setMenuOpen(true);
  };

  const handleDuplicate = () => {
    duplicatePage(page.id);
    setMenuOpen(false);
  };

  const handleDelete = () => {
    deletePage(page.id);
    setMenuOpen(false);
  };

  const handleMoveLeft = () => {
    if (index > 0) reorderPages(index, index - 1);
    setMenuOpen(false);
  };

  const handleMoveRight = () => {
    if (index < pages.length - 1) reorderPages(index, index + 1);
    setMenuOpen(false);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="relative flex-shrink-0 cursor-grab active:cursor-grabbing group"
      onClick={(e) => { onSelect(index, e.shiftKey, e.ctrlKey || e.metaKey); setCurrentPage(page.id); }}
      onContextMenu={handleContextMenu}
    >
      <p className="absolute top-0 left-0 text-[10px] -translate-y-4" style={{ color: "var(--text-lo)" }}>
        {index + 1}
      </p>
      <div
        className="rounded-lg overflow-hidden border-2 transition-all"
        style={{
          width: thumbWidth,
          height: thumbHeight,
          borderColor: isActive
            ? "var(--cyan)"
            : isSelected
            ? "rgba(45,212,240,0.4)"
            : "transparent",
          boxShadow: isActive ? "0 0 0 2px rgba(45,212,240,0.2)" : undefined,
        }}
      >
        {loading ? (
          <div
            className="w-full h-full animate-pulse"
            style={{ width: thumbWidth, height: thumbHeight, background: "var(--card2)" }}
          />
        ) : thumbnail ? (
          <img
            src={thumbnail}
            alt={`Page ${index + 1}`}
            className="w-full h-full object-cover"
            draggable={false}
          />
        ) : (
          <div
            className="w-full h-full"
            style={{ width: thumbWidth, height: thumbHeight, background: "var(--card)" }}
          />
        )}
      </div>

      {menuOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setMenuOpen(false)}
            aria-hidden="true"
          />
          <div
            className="fixed z-50 rounded-lg shadow-xl py-1 min-w-[140px]"
            style={{ left: menuPos.x, top: menuPos.y, background: "var(--card)", border: "1px solid var(--border)" }}
          >
            {[
              { label: "Duplicate Page", onClick: handleDuplicate, disabled: false },
              { label: "Delete Page", onClick: handleDelete, disabled: pages.length === 1 },
              { label: "Move Left", onClick: handleMoveLeft, disabled: index === 0 },
              { label: "Move Right", onClick: handleMoveRight, disabled: index === pages.length - 1 },
            ].map(({ label, onClick, disabled }) => (
              <button
                key={label}
                type="button"
                onClick={onClick}
                disabled={disabled}
                className="w-full px-4 py-2 text-left text-sm disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                style={{ color: "var(--text-hi)" }}
                onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.background = "var(--card2)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = ""; }}
              >
                {label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function PagesPanel() {
  const pages = useEditorStore((s) => s.pages);
  const currentPageId = useEditorStore((s) => s.currentPageId);
  const addPage = useEditorStore((s) => s.addPage);
  const deletePage = useEditorStore((s) => s.deletePage);
  const reorderPages = useEditorStore((s) => s.reorderPages);
  const canvasSize = useEditorStore((s) => s.canvasSize);

  const [selectedIndices, setSelectedIndices] = useState(new Set());

  const aspectRatio = canvasSize.height / canvasSize.width;
  const thumbWidth = 88;
  const thumbHeight = thumbWidth * aspectRatio;

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  const handleSelect = useCallback((index, shiftKey, ctrlKey) => {
    setSelectedIndices((prev) => {
      const next = new Set(prev);
      if (ctrlKey) {
        if (next.has(index)) next.delete(index);
        else next.add(index);
      } else if (shiftKey && prev.size > 0) {
        const last = Math.max(...prev);
        const min = Math.min(last, index);
        const max = Math.max(last, index);
        for (let i = min; i <= max; i++) next.add(i);
      } else {
        next.clear();
        next.add(index);
      }
      return next;
    });
  }, []);

  const handleDeleteSelected = useCallback(() => {
    const list = pages || [];
    if (selectedIndices.size === 0 || list.length <= selectedIndices.size) return;
    // Delete from highest index to lowest to avoid index shifting
    const sorted = [...selectedIndices].sort((a, b) => b - a);
    sorted.forEach((i) => {
      if (list[i]) deletePage(list[i].id);
    });
    setSelectedIndices(new Set());
  }, [selectedIndices, pages, deletePage]);

  // Delete key handler
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Delete" && selectedIndices.size > 1) {
        // only intercept when multiple slides selected (single-slide delete handled by canvas)
        const active = document.activeElement;
        const isInput = active && (active.tagName === "INPUT" || active.tagName === "TEXTAREA" || active.isContentEditable);
        if (!isInput) {
          e.stopPropagation();
          handleDeleteSelected();
        }
      }
    };
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [selectedIndices, handleDeleteSelected]);

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!active || !over || active.id === over.id) return;
    const parseIndex = (id) => {
      const m = String(id).match(/^page-(\d+)$/);
      return m ? parseInt(m[1], 10) : -1;
    };
    const oldIndex = parseIndex(active.id);
    const newIndex = parseIndex(over.id);
    if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
      reorderPages(oldIndex, newIndex);
      setSelectedIndices(new Set());
    }
  };

  const currentIndex = (pages || []).findIndex((p) => p.id === currentPageId);

  return (
    <div className="h-[140px] flex items-center gap-3 px-4 overflow-x-auto scrollbar-hide" style={{ background: "var(--bg-deep)", borderTop: "1px solid var(--border)" }}>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={(pages || []).map((_, i) => `page-${i}`)}
          strategy={horizontalListSortingStrategy}
        >
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {(pages || []).filter(Boolean).map((page, index) => (
              <SortablePageThumb
                key={`page-${index}`}
                page={page}
                index={index}
                isActive={page.id === currentPageId}
                isSelected={selectedIndices.has(index)}
                stableId={`page-${index}`}
                onSelect={handleSelect}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Bulk delete button */}
      {selectedIndices.size > 1 && (
        <button
          type="button"
          onClick={handleDeleteSelected}
          disabled={(pages || []).length <= selectedIndices.size}
          className="flex-shrink-0 flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg border transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-xs font-medium"
          style={{ background: "rgba(239,68,68,0.1)", borderColor: "rgba(239,68,68,0.3)", color: "#f87171" }}
        >
          <Trash2 size={16} />
          Delete {selectedIndices.size}
        </button>
      )}

      {/* Add page button */}
      <button
        type="button"
        onClick={addPage}
        className="flex-shrink-0 border-2 border-dashed rounded-lg flex flex-col items-center justify-center transition-colors"
        style={{ width: thumbWidth, height: thumbHeight, borderColor: "rgba(107,127,160,0.4)", color: "var(--text-mid)" }}
        onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--cyan)"; e.currentTarget.style.color = "var(--cyan)"; e.currentTarget.style.background = "var(--cyan-dim)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(107,127,160,0.4)"; e.currentTarget.style.color = "var(--text-mid)"; e.currentTarget.style.background = ""; }}
      >
        <Plus className="w-6 h-6" />
        <span className="text-xs mt-1">Add page</span>
      </button>
    </div>
  );
}
