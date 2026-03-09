import { useEffect, useRef } from "react";
import {
  ArrowUp,
  ArrowDown,
  ChevronUp,
  ChevronDown,
  Copy,
  Pipette,
  Clipboard,
  Trash2,
  Group,
  Ungroup,
} from "lucide-react";
import useEditorStore from "../store/useEditorStore";

export function ContextMenu({ x, y, elementId, onClose }) {
  const menuRef = useRef(null);
  const {
    bringToFront,
    sendToBack,
    moveElementUp,
    moveElementDown,
    duplicateElement,
    duplicateSelected,
    copyStyle,
    pasteStyle,
    deleteElement,
    deleteSelected,
    groupSelected,
    ungroupSelected,
    clipboardStyle,
    selectedIds,
    pages,
    currentPageId,
  } = useEditorStore();

  const page = pages?.find((p) => p.id === currentPageId);
  const element = page?.elements?.find((e) => e.id === elementId);
  const isGroup = element?.type === "group";
  const isMultiSelect = selectedIds?.length >= 2 && selectedIds?.includes(elementId);

  useEffect(() => {
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) onClose();
    };
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    setTimeout(() => document.addEventListener("mousedown", handleClick), 0);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  const handleItem = (fn) => {
    fn();
    onClose();
  };

  return (
    <div
      ref={menuRef}
      className="fixed bg-white rounded-lg shadow-2xl border border-gray-200 min-w-[200px] py-1 z-[9999] text-gray-800"
      style={{ left: x, top: y }}
      onClick={(e) => e.stopPropagation()}
    >
      {isGroup && (
        <button
          type="button"
          className="w-full px-4 py-2 hover:bg-gray-50 flex items-center gap-2 text-sm cursor-pointer text-left"
          onClick={() => handleItem(ungroupSelected)}
        >
          <Ungroup size={16} />
          Ungroup
        </button>
      )}
      {isMultiSelect && (
        <>
          <button
            type="button"
            className="w-full px-4 py-2 hover:bg-gray-50 flex items-center gap-2 text-sm cursor-pointer text-left"
            onClick={() => handleItem(groupSelected)}
          >
            <Group size={16} />
            Group selection
          </button>
          <button
            type="button"
            className="w-full px-4 py-2 hover:bg-gray-50 flex items-center gap-2 text-sm cursor-pointer text-left"
            onClick={() => handleItem(duplicateSelected)}
          >
            <Copy size={16} />
            Duplicate selection
          </button>
          <button
            type="button"
            className="w-full px-4 py-2 hover:bg-gray-50 flex items-center gap-2 text-sm cursor-pointer text-left text-red-600"
            onClick={() => handleItem(deleteSelected)}
          >
            <Trash2 size={16} />
            Delete selection
          </button>
        </>
      )}
      {!isMultiSelect && (
        <>
      <button
        type="button"
        className="w-full px-4 py-2 hover:bg-gray-50 flex items-center gap-2 text-sm cursor-pointer text-left"
        onClick={() => handleItem(() => elementId && bringToFront(elementId))}
      >
        <ArrowUp size={16} />
        Bring to Front
      </button>
      <button
        type="button"
        className="w-full px-4 py-2 hover:bg-gray-50 flex items-center gap-2 text-sm cursor-pointer text-left"
        onClick={() => handleItem(() => elementId && sendToBack(elementId))}
      >
        <ArrowDown size={16} />
        Send to Back
      </button>
      <button
        type="button"
        className="w-full px-4 py-2 hover:bg-gray-50 flex items-center gap-2 text-sm cursor-pointer text-left"
        onClick={() => handleItem(() => elementId && moveElementUp(elementId))}
      >
        <ChevronUp size={16} />
        Move Up a Layer
      </button>
      <button
        type="button"
        className="w-full px-4 py-2 hover:bg-gray-50 flex items-center gap-2 text-sm cursor-pointer text-left"
        onClick={() => handleItem(() => elementId && moveElementDown(elementId))}
      >
        <ChevronDown size={16} />
        Move Down a Layer
      </button>
      <div className="border-t border-gray-100 my-1" />
      <button
        type="button"
        className="w-full px-4 py-2 hover:bg-gray-50 flex items-center gap-2 text-sm cursor-pointer text-left"
        onClick={() => handleItem(() => elementId && duplicateElement(elementId))}
      >
        <Copy size={16} />
        Duplicate
      </button>
      <button
        type="button"
        className="w-full px-4 py-2 hover:bg-gray-50 flex items-center gap-2 text-sm cursor-pointer text-left"
        onClick={() => handleItem(() => elementId && copyStyle(elementId))}
      >
        <Pipette size={16} />
        Copy Style
      </button>
      <button
        type="button"
        className="w-full px-4 py-2 hover:bg-gray-50 flex items-center gap-2 text-sm cursor-pointer text-left disabled:opacity-50 disabled:cursor-not-allowed"
        onClick={() => handleItem(() => elementId && pasteStyle(elementId))}
        disabled={!clipboardStyle}
      >
        <Clipboard size={16} />
        Paste Style
      </button>
      <div className="border-t border-gray-100 my-1" />
      <button
        type="button"
        className="w-full px-4 py-2 hover:bg-gray-50 flex items-center gap-2 text-sm cursor-pointer text-left text-red-600"
        onClick={() => handleItem(() => elementId && deleteElement(elementId))}
      >
        <Trash2 size={16} />
        Delete
      </button>
        </>
      )}
    </div>
  );
}
