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
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  GripVertical,
  Square,
  Type,
  Image as ImageIcon,
  Minus,
  Pencil,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Layers,
  Search,
} from "lucide-react";
import useEditorStore from "../store/useEditorStore";

function SortableLayerRow({ el, index }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: el.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 999 : "auto",
  };

  const selectedIds = useEditorStore((s) => s.selectedIds);
  const setSelectedIds = useEditorStore((s) => s.setSelectedIds);
  const isSelected = selectedIds.includes(el.id);

  const [renaming, setRenaming] = useState(false);
  const [nameVal, setNameVal] = useState("");

  const displayName =
    el.name ||
    `${el.type.charAt(0).toUpperCase() + el.type.slice(1)} ${index + 1}`;

  const getIcon = () => {
    switch (el.type) {
      case "text":
        return <Type className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />;
      case "image":
        return <ImageIcon className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />;
      case "line":
      case "arrow":
        return <Minus className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />;
      case "group":
        return <Layers className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />;
      case "drawing":
        return <Pencil className="w-3.5 h-3.5 text-purple-500 flex-shrink-0" />;
      default:
        return <Square className="w-3.5 h-3.5 text-purple-500 flex-shrink-0" />;
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={() => setSelectedIds([el.id])}
      className={`
        flex items-center gap-1.5 px-2 h-9 rounded-md cursor-pointer
        group transition-colors select-none
        ${isSelected
          ? "bg-purple-50 border-l-2 border-purple-500"
          : "hover:bg-gray-50 border-l-2 border-transparent"}
        ${el.visible === false ? "opacity-40" : ""}
        ${isDragging ? "shadow-lg bg-white" : ""}
      `}
    >
      {/* Drag handle — ONLY this element gets the dnd listeners */}
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-0.5 rounded hover:bg-gray-200 flex-shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical className="w-3 h-3 text-gray-300" />
      </div>

      {getIcon()}

      {/* Layer name */}
      {renaming ? (
        <input
          autoFocus
          value={nameVal}
          onChange={(e) => setNameVal(e.target.value)}
          onBlur={() => {
            if (nameVal.trim()) useEditorStore.getState().updateElement(el.id, { name: nameVal.trim() });
            setRenaming(false);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              if (nameVal.trim()) useEditorStore.getState().updateElement(el.id, { name: nameVal.trim() });
              setRenaming(false);
            }
            if (e.key === "Escape") setRenaming(false);
            e.stopPropagation();
          }}
          className="flex-1 text-xs border border-purple-400 rounded px-1 py-0.5 outline-none min-w-0"
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <span
          className="flex-1 text-xs text-gray-700 truncate min-w-0"
          onDoubleClick={(e) => {
            e.stopPropagation();
            setNameVal(displayName);
            setRenaming(true);
          }}
        >
          {displayName}
        </span>
      )}

      {/* Hover action buttons */}
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
        <button
          type="button"
          title={el.visible === false ? "Show layer" : "Hide layer"}
          onClick={(e) => {
            e.stopPropagation();
            useEditorStore.getState().updateElement(el.id, {
              visible: el.visible === false ? true : false,
            });
          }}
          className="p-0.5 rounded hover:bg-gray-200"
        >
          {el.visible === false ? (
            <EyeOff className="w-3 h-3 text-gray-400" />
          ) : (
            <Eye className="w-3 h-3 text-gray-400" />
          )}
        </button>
        <button
          type="button"
          title={el.locked ? "Unlock layer" : "Lock layer"}
          onClick={(e) => {
            e.stopPropagation();
            useEditorStore.getState().updateElement(el.id, {
              locked: el.locked === true ? false : true,
            });
          }}
          className="p-0.5 rounded hover:bg-gray-200"
        >
          {el.locked ? (
            <Lock className="w-3 h-3 text-amber-500" />
          ) : (
            <Unlock className="w-3 h-3 text-gray-400" />
          )}
        </button>
      </div>
    </div>
  );
}

export function LayersPanel() {
  const elements = useEditorStore((s) => {
    const page = (s.pages || []).find((p) => p.id === s.currentPageId);
    return page?.elements || [];
  });
  const reorderElements = useEditorStore((s) => s.reorderElements);
  const [search, setSearch] = useState("");

  // Display in REVERSE order (top of list = frontmost on canvas)
  const reversed = [...elements].reverse();
  const filtered = reversed.filter((el) => {
    if (!search) return true;
    const name = el.name || el.type;
    return name.toLowerCase().includes(search.toLowerCase());
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 }, // prevents accidental drags
    })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!active || !over || active.id === over.id || search.trim()) return;

    const oldIndex = reversed.findIndex((el) => el.id === active.id);
    const newIndex = reversed.findIndex((el) => el.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    // Store expects display indices (0 = top of list)
    reorderElements(oldIndex, newIndex);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-sm font-medium text-gray-700">Layers</span>
        <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
          {elements.length}
        </span>
      </div>

      {/* Search */}
      <div className="relative mb-2">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
        <input
          type="text"
          placeholder="Search layers..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-7 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-purple-400"
        />
      </div>

      {/* Empty state */}
      {elements.length === 0 && (
        <div className="text-center py-8 text-gray-400">
          <Layers className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-xs">No layers yet</p>
          <p className="text-xs opacity-60">Add elements to the canvas</p>
        </div>
      )}

      {/* Sortable list */}
      {elements.length > 0 && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={filtered.map((el) => el.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="flex-1 overflow-y-auto scrollbar-hide flex flex-col gap-0.5">
              {filtered.map((el) => (
                <SortableLayerRow
                  key={el.id}
                  el={el}
                  index={reversed.findIndex((e) => e.id === el.id)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}
