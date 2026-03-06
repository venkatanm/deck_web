import { useState, useRef } from "react";
import {
  Wand2,
  Upload,
  FileJson,
  FileText,
  AlertCircle,
  CheckCircle2,
  X,
  Loader2,
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

const ACCEPTED_DOC_TYPES = ".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt";

export default function ImportFromAIModal({ onClose }) {
  // "convert" is the new primary tab; others preserved
  const [tab, setTab] = useState("convert");
  const [json, setJson] = useState("");
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Convert-tab state
  const [docFile, setDocFile] = useState(null);
  const [converting, setConverting] = useState(false);
  const docFileRef = useRef();
  const jsonFileRef = useRef();

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

    const templateId =
      schema.meta?.suggestedTemplate ||
      DOCUMENT_TYPE_TO_TEMPLATE[schema.meta?.documentType] ||
      null;
    const template = templateId
      ? PRESENTATION_TEMPLATES.find((t) => t.id === templateId)
      : null;
    const targetCanvasSize = template?.canvasSize || canvasSize;

    let { pages } = importContentSchema(schema, brandKit, targetCanvasSize);

    const hasBrandKit =
      (brandKit?.colors?.length ?? 0) > 0 ||
      (brandKit?.fonts?.length ?? 0) > 0;
    if (hasBrandKit) {
      pages = applyBrandKitToPages(pages, brandKit, targetCanvasSize);
    }

    setPages(pages);
    setCurrentPageId(pages[0].id);
    clearSelection();
    setTitle(schema.meta?.title || "Imported Deck");

    if (template?.canvasSize) {
      useEditorStore.getState().setCanvasSize(targetCanvasSize);
    }

    setSuccess(true);
    setTimeout(() => onClose(), 1200);
  };

  // ── Convert tab: upload doc → pipeline → import ──────────────────────────
  const handleDocFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) setDocFile(file);
  };

  const handleDocDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) setDocFile(file);
  };

  const handleConvert = async () => {
    if (!docFile) return;
    setError(null);
    setConverting(true);

    try {
      const form = new FormData();
      form.append("file", docFile);
      form.append("output_mode", "json_only");

      const res = await fetch("/pipeline/api/doc-to-deck", {
        method: "POST",
        body: form,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `Pipeline error ${res.status}`);
      }

      const envelope = await res.json();
      // Service returns { output_mode, canva_schema } — unwrap before importing
      const schema = envelope.canva_schema;
      if (!schema) throw new Error("Pipeline returned no canva_schema in response.");
      doImport(JSON.stringify(schema));
    } catch (err) {
      setError(err.message);
    } finally {
      setConverting(false);
    }
  };

  // ── JSON file upload tab ──────────────────────────────────────────────────
  const handleJsonFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    setJson(text);
    doImport(text);
  };

  const handleExample = () => {
    doImport(JSON.stringify(EXAMPLE_CONTENT_SCHEMA));
  };

  const TABS = [
    { id: "convert", label: "Convert Doc" },
    { id: "paste",   label: "Paste JSON" },
    { id: "file",    label: "JSON File" },
    { id: "example", label: "Example" },
    { id: "stream",  label: "Live Stream" },
  ];

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
        <div className="flex border-b border-gray-100 overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => { setTab(t.id); setError(null); }}
              className={`flex-shrink-0 px-4 py-2.5 text-xs font-medium transition-colors ${
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
              <p className="font-semibold text-gray-800">Slides imported successfully!</p>
              <p className="text-sm text-gray-500">Closing...</p>
            </div>
          )}

          {/* Error banner */}
          {error && !success && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <pre className="text-xs text-red-700 whitespace-pre-wrap">{error}</pre>
            </div>
          )}

          {!success && (
            <>
              {/* CONVERT tab */}
              {tab === "convert" && (
                <div className="flex flex-col gap-4">
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Upload a document and the AI pipeline will convert it into a
                    presentation automatically.
                  </p>

                  {/* Drop zone */}
                  <input
                    ref={docFileRef}
                    type="file"
                    accept={ACCEPTED_DOC_TYPES}
                    className="hidden"
                    onChange={handleDocFileChange}
                  />
                  <button
                    type="button"
                    onClick={() => docFileRef.current?.click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleDocDrop}
                    className={`w-full py-8 border-2 border-dashed rounded-xl text-sm transition-all flex flex-col items-center gap-3 ${
                      docFile
                        ? "border-purple-400 bg-purple-50 text-purple-700"
                        : "border-gray-300 text-gray-400 hover:border-purple-400 hover:text-purple-600 hover:bg-purple-50"
                    }`}
                  >
                    <FileText className="w-8 h-8" />
                    {docFile ? (
                      <>
                        <span className="font-medium">{docFile.name}</span>
                        <span className="text-xs opacity-60">Click to change file</span>
                      </>
                    ) : (
                      <>
                        <span>Click to select a file</span>
                        <span className="text-xs text-gray-300">
                          PDF, Word, Excel, PowerPoint, or plain text
                        </span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleConvert}
                    disabled={!docFile || converting}
                    className="w-full py-3 bg-purple-600 text-white text-sm rounded-xl font-medium hover:bg-purple-700 disabled:opacity-40 flex items-center justify-center gap-2"
                  >
                    {converting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Converting…
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-4 h-4" />
                        Convert & Import
                      </>
                    )}
                  </button>

                  <p className="text-[10px] text-gray-400 text-center -mt-1">
                    Requires the doc-to-deck pipeline service running on port 8001.
                  </p>
                </div>
              )}

              {/* PASTE tab */}
              {tab === "paste" && (
                <div className="flex flex-col gap-3">
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Paste the JSON output from your doc-to-deck pipeline below.
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

              {/* JSON FILE tab */}
              {tab === "file" && (
                <div className="flex flex-col gap-3">
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Upload a .json file matching the content schema from your pipeline.
                  </p>
                  <input
                    ref={jsonFileRef}
                    type="file"
                    accept=".json,application/json"
                    className="hidden"
                    onChange={handleJsonFile}
                  />
                  <button
                    onClick={() => jsonFileRef.current?.click()}
                    className="w-full py-8 border-2 border-dashed border-gray-300 rounded-xl text-sm text-gray-400 hover:border-purple-400 hover:text-purple-600 hover:bg-purple-50 transition-all flex flex-col items-center gap-3"
                  >
                    <FileJson className="w-8 h-8" />
                    <span>Click to select .json file</span>
                    <span className="text-xs text-gray-300">or drag and drop</span>
                  </button>
                </div>
              )}

              {/* STREAM tab */}
              {tab === "stream" && <StreamingImportPanel />}

              {/* EXAMPLE tab */}
              {tab === "example" && (
                <div className="flex flex-col gap-3">
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Load a sample 5-slide pitch deck to test brand kit and template settings.
                  </p>
                  <div className="bg-gray-50 rounded-xl p-3 text-xs font-mono text-gray-500 max-h-40 overflow-y-auto">
                    {JSON.stringify(EXAMPLE_CONTENT_SCHEMA, null, 2).slice(0, 400)}...
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
              Brand kit colors and fonts are applied automatically on import. Set them up in the Brand tab first.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
