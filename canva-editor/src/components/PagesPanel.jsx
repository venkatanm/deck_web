import { useState } from "react";
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
import { Plus } from "lucide-react";
import useEditorStore from "../store/useEditorStore";
import { usePageThumbnail } from "../hooks/usePageThumbnail";

function SortablePageThumb({ page, index, isActive }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: page.id });

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
    setMenuPos({ x: e.clientX, y: e.clientY });
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
      onClick={() => setCurrentPage(page.id)}
      onContextMenu={handleContextMenu}
    >
      <p className="absolute top-0 left-0 text-[10px] text-gray-400 -translate-y-4">
        {index + 1}
      </p>
      <div
        className={`rounded-lg overflow-hidden border-2 transition-all ${
          isActive
            ? "border-purple-500 shadow-md"
            : "border-transparent hover:border-gray-300"
        }`}
        style={{ width: thumbWidth, height: thumbHeight }}
      >
        {loading ? (
          <div
            className="w-full h-full bg-gray-200 animate-pulse"
            style={{ width: thumbWidth, height: thumbHeight }}
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
            className="w-full h-full bg-gray-100"
            style={{ width: thumbWidth, height: thumbHeight }}
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
            className="fixed z-50 bg-white rounded-lg shadow-xl border border-gray-200 py-1 min-w-[140px]"
            style={{ left: menuPos.x, top: menuPos.y }}
          >
            <button
              type="button"
              onClick={handleDuplicate}
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
            >
              Duplicate Page
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={pages.length === 1}
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Delete Page
            </button>
            <button
              type="button"
              onClick={handleMoveLeft}
              disabled={index === 0}
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Move Left
            </button>
            <button
              type="button"
              onClick={handleMoveRight}
              disabled={index === pages.length - 1}
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Move Right
            </button>
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
  const reorderPages = useEditorStore((s) => s.reorderPages);
  const canvasSize = useEditorStore((s) => s.canvasSize);

  const aspectRatio = canvasSize.height / canvasSize.width;
  const thumbWidth = 88;
  const thumbHeight = thumbWidth * aspectRatio;

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!active || !over || active.id === over.id) return;

    const oldIndex = pages.findIndex((p) => p.id === active.id);
    const newIndex = pages.findIndex((p) => p.id === over.id);
    if (oldIndex !== -1 && newIndex !== -1) {
      reorderPages(oldIndex, newIndex);
    }
  };

  return (
    <div className="h-[140px] bg-gray-100 border-t border-gray-200 flex items-center gap-3 px-4 overflow-x-auto scrollbar-hide">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={pages.map((p) => p.id)}
          strategy={horizontalListSortingStrategy}
        >
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {pages.map((page, index) => (
              <SortablePageThumb
                key={page.id}
                page={page}
                index={index}
                isActive={page.id === currentPageId}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Add page button */}
      <button
        type="button"
        onClick={addPage}
        className="flex-shrink-0 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center hover:border-purple-400 hover:bg-purple-50 transition-colors"
        style={{ width: thumbWidth, height: thumbHeight }}
      >
        <Plus className="w-6 h-6 text-gray-400" />
        <span className="text-xs text-gray-500 mt-1">Add page</span>
      </button>
    </div>
  );
}
