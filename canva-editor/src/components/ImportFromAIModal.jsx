import { useState, useRef } from "react";
import {
  Wand2,
  Upload,
  FileJson,
  AlertCircle,
  CheckCircle2,
  X,
} from "lucide-react";
import useEditorStore from "../store/useEditorStore";
import {
  importContentSchema,
  applyBrandKitToPages,
} from "../utils/importContentSchema";
import {
  validateContentSchema,
  EXAMPLE_CONTENT_SCHEMA,
  DOCUMENT_TYPE_TO_TEMPLATE,
} from "../data/contentSchema";
import { PRESENTATION_TEMPLATES } from "../data/presentationTemplates";
import StreamingImportPanel from "./StreamingImportPanel";

export default function ImportFromAIModal({ onClose }) {
  const [tab, setTab] = useState("paste");
  // paste | file | example
  const [json, setJson] = useState("");
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const fileRef = useRef();

  const brandKit = useEditorStore((s) => s.brandKit);
  const canvasSize = useEditorStore((s) => s.canvasSize);
  const setPages = useEditorStore((s) => s.setPages);
  const setCurrentPageId = useEditorStore((s) => s.setCurrentPageId);
  const clearSelection = useEditorStore((s) => s.clearSelection);
  const setTitle = useEditorStore((s) => s.setTitle);
  const _snapshot = useEditorStore((s) => s._snapshot);

  const doImport = (jsonString) => {
    setError(null);
    let schema;
    try {
      schema = JSON.parse(jsonString);
    } catch {
      setError("Invalid JSON — check for syntax errors.");
      return;
    }

    const { valid, errors } = validateContentSchema(schema);
    if (!valid) {
      setError("Schema errors:\n" + errors.join("\n"));
      return;
    }

    _snapshot(true);

    // Step 1: Determine canvas size
    // Use suggested template's canvas size if available
    const templateId =
      schema.meta?.suggestedTemplate ||
      DOCUMENT_TYPE_TO_TEMPLATE[schema.meta?.documentType] ||
      null;

    const template = templateId
      ? PRESENTATION_TEMPLATES.find((t) => t.id === templateId)
      : null;

    const targetCanvasSize = template?.canvasSize || canvasSize;

    // Step 2: Build slides from content schema
    let { pages } = importContentSchema(
      schema,
      brandKit,
      targetCanvasSize
    );

    // Step 3: Apply brand kit on top
    // (only if brand kit has been configured)
    const hasBrandKit =
      (brandKit?.colors?.length ?? 0) > 0 ||
      (brandKit?.fonts?.length ?? 0) > 0;

    if (hasBrandKit) {
      pages = applyBrandKitToPages(pages, brandKit, targetCanvasSize);
    }

    // Step 4: Load into editor
    setPages(pages);
    setCurrentPageId(pages[0].id);
    clearSelection();
    setTitle(schema.meta?.title || "Imported Deck");

    // Update canvas size if template changed it
    if (template?.canvasSize) {
      useEditorStore.getState().setCanvasSize(targetCanvasSize);
    }

    setSuccess(true);
    setTimeout(() => onClose(), 1200);
  };

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    setJson(text);
    doImport(text);
  };

  const handleExample = () => {
    doImport(JSON.stringify(EXAMPLE_CONTENT_SCHEMA));
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Wand2 className="w-5 h-5 text-purple-600" />
            <h2 className="font-bold text-gray-900">Import from AI Pipeline</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100">
          {[
            { id: "paste", label: "Paste JSON" },
            { id: "file", label: "Upload File" },
            { id: "example", label: "Load Example" },
            { id: "stream", label: "Live Stream" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => {
                setTab(t.id);
                setError(null);
              }}
              className={`flex-1 py-2.5 text-xs font-medium transition-colors ${
                tab === t.id
                  ? "text-purple-700 border-b-2 border-purple-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* Success state */}
          {success && (
            <div className="flex flex-col items-center gap-3 py-6">
              <CheckCircle2 className="w-12 h-12 text-green-500" />
              <p className="font-semibold text-gray-800">
                Slides imported successfully!
              </p>
              <p className="text-sm text-gray-500">Closing editor...</p>
            </div>
          )}

          {/* Error banner */}
          {error && !success && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <pre className="text-xs text-red-700 whitespace-pre-wrap">
                {error}
              </pre>
            </div>
          )}

          {!success && (
            <>
              {/* PASTE tab */}
              {tab === "paste" && (
                <div className="flex flex-col gap-3">
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Paste the JSON output from your doc-to-deck AI pipeline
                    below.
                  </p>
                  <textarea
                    value={json}
                    onChange={(e) => setJson(e.target.value)}
                    placeholder={'{\n  "meta": { "title": "..." },\n  "slides": [...]\n}'}
                    className="w-full h-48 text-xs font-mono border border-gray-200 rounded-xl p-3 focus:outline-none focus:border-purple-400 resize-none bg-gray-50"
                    spellCheck={false}
                  />
                  <button
                    onClick={() => doImport(json)}
                    disabled={!json.trim()}
                    className="w-full py-3 bg-purple-600 text-white text-sm rounded-xl font-medium hover:bg-purple-700 disabled:opacity-40 flex items-center justify-center gap-2"
                  >
                    <Wand2 className="w-4 h-4" />
                    Import & Generate Slides
                  </button>
                </div>
              )}

              {/* FILE tab */}
              {tab === "file" && (
                <div className="flex flex-col gap-3">
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Upload a .json file from your pipeline. Your pipeline should
                    save its output as a JSON file matching the schema.
                  </p>
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".json,application/json"
                    className="hidden"
                    onChange={handleFile}
                  />
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="w-full py-8 border-2 border-dashed border-gray-300 rounded-xl text-sm text-gray-400 hover:border-purple-400 hover:text-purple-600 hover:bg-purple-50 transition-all flex flex-col items-center gap-3"
                  >
                    <FileJson className="w-8 h-8" />
                    <span>Click to select .json file</span>
                    <span className="text-xs text-gray-300">
                      or drag and drop
                    </span>
                  </button>
                </div>
              )}

              {/* STREAM tab */}
              {tab === "stream" && <StreamingImportPanel />}

              {/* EXAMPLE tab */}
              {tab === "example" && (
                <div className="flex flex-col gap-3">
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Load a sample 5-slide pitch deck to see how the import works.
                    Great for testing your brand kit and template settings.
                  </p>
                  <div className="bg-gray-50 rounded-xl p-3 text-xs font-mono text-gray-500 max-h-40 overflow-y-auto">
                    {JSON.stringify(EXAMPLE_CONTENT_SCHEMA, null, 2).slice(
                      0,
                      400
                    )}
                    ...
                  </div>
                  <button
                    onClick={handleExample}
                    className="w-full py-3 bg-purple-600 text-white text-sm rounded-xl font-medium hover:bg-purple-700 flex items-center justify-center gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    Load Example Deck
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer note */}
        {!success && (
          <div className="px-6 pb-4">
            <p className="text-[10px] text-gray-400 text-center">
              Your brand kit colors and fonts will be applied automatically on
              import. Set them up in the Brand tab first.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
