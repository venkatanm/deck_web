/**
 * AppHeader - Canva-style top bar with global controls.
 * Home, File, Undo/Redo, editable title, Share, Present.
 */

import { useState, useRef, useEffect } from "react";
import {
  Home,
  FileText,
  Undo2,
  Redo2,
  Cloud,
  Presentation,
  User,
  Download,
} from "lucide-react";
import { usePresentationStore } from "../store/usePresentationStore";

export function AppHeader() {
  const {
    presentation,
    undo,
    redo,
    past,
    future,
    updatePresentationTitle,
  } = usePresentationStore();
  const [exportStatus, setExportStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const handleExport = async () => {
    setExportStatus("loading");
    try {
      const res = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(presentation),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? res.statusText);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "export.pptx";
      a.click();
      URL.revokeObjectURL(url);
      setExportStatus("success");
    } catch {
      setExportStatus("error");
    }
  };

  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(presentation.title ?? "");
  const inputRef = useRef<HTMLInputElement>(null);

  const title = presentation.title ?? "Untitled presentation";

  useEffect(() => {
    setEditValue(presentation.title ?? "");
  }, [presentation.title]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleBlur = () => {
    setIsEditing(false);
    const trimmed = editValue.trim();
    if (trimmed) updatePresentationTitle(trimmed);
  };

  return (
    <header
      style={{
        height: 52,
        flexShrink: 0,
        background: "linear-gradient(135deg, #8b7dd8 0%, #a78bfa 100%)",
        display: "flex",
        alignItems: "center",
        padding: "0 16px",
        gap: 16,
        boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <button
          type="button"
          title="Home"
          style={headerBtnStyle}
        >
          <Home size={20} />
        </button>
        <button type="button" title="File" style={headerBtnStyle}>
          <FileText size={20} />
        </button>
        <button type="button" title="Resize" style={headerBtnStyle}>
          Resize
        </button>
        <button type="button" title="Editing" style={headerBtnStyle}>
          Edit
        </button>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <button
          type="button"
          onClick={undo}
          disabled={past.length === 0}
          title="Undo"
          style={{ ...headerBtnStyle, opacity: past.length === 0 ? 0.5 : 1 }}
        >
          <Undo2 size={18} />
        </button>
        <button
          type="button"
          onClick={redo}
          disabled={future.length === 0}
          title="Redo"
          style={{ ...headerBtnStyle, opacity: future.length === 0 ? 0.5 : 1 }}
        >
          <Redo2 size={18} />
        </button>
      </div>

      <button type="button" title="Sync" style={headerBtnStyle}>
        <Cloud size={18} />
      </button>

      <div style={{ flex: 1, display: "flex", justifyContent: "center", minWidth: 0 }}>
        {isEditing ? (
          <input
            ref={inputRef}
            style={{
              width: "100%",
              maxWidth: 320,
              padding: "4px 8px",
              fontSize: 15,
              fontWeight: 500,
              color: "#fff",
              background: "rgba(255,255,255,0.2)",
              border: "1px solid rgba(255,255,255,0.4)",
              borderRadius: 6,
              outline: "none",
            }}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleBlur();
            }}
          />
        ) : (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            style={{
              padding: "4px 12px",
              fontSize: 15,
              fontWeight: 500,
              color: "#fff",
              background: "transparent",
              border: "1px solid transparent",
              borderRadius: 6,
              cursor: "pointer",
              maxWidth: "100%",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {title}
          </button>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <button
          type="button"
          onClick={handleExport}
          disabled={exportStatus === "loading"}
          style={{
            ...headerBtnStyle,
            background: "rgba(255,255,255,0.25)",
            padding: "6px 12px",
            fontSize: 12,
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
          title="Export to PPTX"
        >
          <Download size={16} />
          {exportStatus === "loading" ? "Exporting…" : "Share"}
        </button>
        <button type="button" title="Present" style={headerBtnStyle}>
          <Presentation size={18} />
        </button>
        <button type="button" title="Profile" style={headerBtnStyle}>
          <User size={20} />
        </button>
      </div>
    </header>
  );
}

const headerBtnStyle: React.CSSProperties = {
  padding: 6,
  background: "transparent",
  border: "none",
  borderRadius: 6,
  color: "#fff",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  transition: "background 0.15s",
};
