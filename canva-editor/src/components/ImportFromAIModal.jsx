import { useState, useRef } from "react";
import {
  Wand2,
  FileText,
  AlertCircle,
  CheckCircle2,
  X,
  Loader2,
  Download,
  FolderOpen,
} from "lucide-react";
import useEditorStore from "../store/useEditorStore";
import { track } from "../api/analytics";
import {
  importContentSchema,
  applyBrandKitToPages,
} from "../utils/importContentSchema";
import {
  validateContentSchema,
  DOCUMENT_TYPE_TO_TEMPLATE,
} from "../data/contentSchema";
import { PRESENTATION_TEMPLATES } from "../data/presentationTemplates";

const ACCEPTED_DOC_TYPES = ".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt";

export default function ImportFromAIModal({ onClose }) {
  const [tab, setTab] = useState("convert");
  const [json, setJson] = useState("");
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Convert tab state
  const [docFile, setDocFile] = useState(null);
  const [converting, setConverting] = useState(false);
  // Result from pipeline — { canva_schema?, pptx_filename? }
  const [result, setResult] = useState(null);

  const docFileRef = useRef();

  const brandKit = useEditorStore((s) => s.brandKit);
  const canvasSize = useEditorStore((s) => s.canvasSize);
  const setPages = useEditorStore((s) => s.setPages);
  const setCurrentPageId = useEditorStore((s) => s.setCurrentPageId);
  const clearSelection = useEditorStore((s) => s.clearSelection);
  const setTitle = useEditorStore((s) => s.setTitle);
  const _snapshot = useEditorStore((s) => s._snapshot);

  const doImport = (schema) => {
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

  const handleDocFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) { setDocFile(file); setResult(null); }
  };

  const handleDocDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) { setDocFile(file); setResult(null); }
  };

  const handleConvert = async () => {
    if (!docFile) return;
    setError(null);
    setResult(null);
    setConverting(true);
    track('ai.import_started', { file_type: docFile?.name?.split('.').pop() });

    try {
      const form = new FormData();
      form.append("file", docFile);
      form.append("output_mode", "both");

      const res = await fetch("/pipeline/api/doc-to-deck", {
        method: "POST",
        body: form,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `Pipeline error ${res.status}`);
      }

      const envelope = await res.json();
      if (!envelope.canva_schema && !envelope.pptx_url) {
        throw new Error("Pipeline returned no usable output.");
      }
      setResult(envelope);
      track('ai.import_completed');
    } catch (err) {
      track('ai.import_failed', { error: err.message });
      setError(err.message);
    } finally {
      setConverting(false);
    }
  };

  const handleOpenInVeloxDecks = () => {
    const schema = result?.canva_schema;
    if (!schema) { setError("No schema available to open in Velox Decks."); return; }
    const { valid, errors } = validateContentSchema(schema);
    if (!valid) { setError("Schema errors:\n" + errors.join("\n")); return; }
    doImport(schema);
  };

  const handleDownloadPptx = () => {
    const pptxUrl = result?.pptx_url;
    if (!pptxUrl) return;
    // pptx_url is a path like "/download/Deck_Title_123456.pptx"
    // Prefix with /pipeline so Nginx routes it to the pipeline service
    const a = document.createElement("a");
    a.href = `/pipeline${pptxUrl}`;
    a.download = pptxUrl.split("/").pop();
    a.click();
  };

  const handlePasteImport = () => {
    setError(null);
    let schema;
    try {
      schema = JSON.parse(json);
    } catch {
      setError("Invalid JSON — check for syntax errors.");
      return;
    }
    const { valid, errors } = validateContentSchema(schema);
    if (!valid) { setError("Schema errors:\n" + errors.join("\n")); return; }
    doImport(schema);
  };

  const TABS = [
    { id: "convert", label: "Convert Doc" },
    { id: "paste",   label: "Paste JSON" },
  ];

  return (
    <div className="fixed inset-0 z-[9999] bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Wand2 className="w-5 h-5 text-purple-600" />
            <h2 className="font-bold text-gray-900">AI Doc Converter</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => { setTab(t.id); setError(null); setResult(null); }}
              className={`px-5 py-2.5 text-xs font-medium transition-colors ${
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
              <p className="text-sm text-gray-500">Closing…</p>
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
                    Upload a document and the AI pipeline will convert it into a presentation.
                  </p>

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
                        <span className="text-xs text-gray-300">PDF, Word, Excel, PowerPoint, or plain text</span>
                      </>
                    )}
                  </button>

                  {/* Convert button — only shown before result */}
                  {!result && (
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
                          Convert
                        </>
                      )}
                    </button>
                  )}

                  {/* Result actions */}
                  {result && (
                    <div className="flex flex-col gap-2">
                      <p className="text-xs text-center text-green-600 font-medium">
                        Conversion complete — choose what to do:
                      </p>
                      {result.canva_schema && (
                        <button
                          onClick={handleOpenInVeloxDecks}
                          className="w-full py-3 bg-purple-600 text-white text-sm rounded-xl font-medium hover:bg-purple-700 flex items-center justify-center gap-2"
                        >
                          <FolderOpen className="w-4 h-4" />
                          Open in Velox Decks
                        </button>
                      )}
                      {result.pptx_url && (
                        <button
                          onClick={handleDownloadPptx}
                          className="w-full py-3 bg-white border border-gray-200 text-gray-700 text-sm rounded-xl font-medium hover:bg-gray-50 flex items-center justify-center gap-2"
                        >
                          <Download className="w-4 h-4" />
                          Download PPTX
                        </button>
                      )}
                      <button
                        onClick={() => { setResult(null); setError(null); }}
                        className="text-xs text-gray-400 hover:text-gray-600 text-center mt-1"
                      >
                        Convert another file
                      </button>
                    </div>
                  )}

                  <p className="text-[10px] text-gray-400 text-center -mt-1">
                    Requires the doc-to-deck pipeline service running on port 8001.
                  </p>
                </div>
              )}

              {/* PASTE tab */}
              {tab === "paste" && (
                <div className="flex flex-col gap-3">
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Paste the JSON schema output from the doc-to-deck pipeline.
                  </p>
                  <textarea
                    value={json}
                    onChange={(e) => setJson(e.target.value)}
                    placeholder={'{\n  "meta": { "title": "..." },\n  "slides": [...]\n}'}
                    className="w-full h-48 text-xs font-mono border border-gray-200 rounded-xl p-3 focus:outline-none focus:border-purple-400 resize-none bg-gray-50"
                    spellCheck={false}
                  />
                  <button
                    onClick={handlePasteImport}
                    disabled={!json.trim()}
                    className="w-full py-3 bg-purple-600 text-white text-sm rounded-xl font-medium hover:bg-purple-700 disabled:opacity-40 flex items-center justify-center gap-2"
                  >
                    <Wand2 className="w-4 h-4" />
                    Open in Velox Decks
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
