import { useState, useRef, useEffect } from "react";
import {
  X,
  Wand2,
  Loader2,
  Send,
  Zap,
  BarChart2,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";
import useEditorStore from "../store/useEditorStore";
import { buildSlideElements, applyBrandKitToPages } from "../utils/importContentSchema";
import { LAYOUT_DEFINITIONS } from "../data/layoutDefinitions";
import { v4 as uuidv4 } from "uuid";

const PERSONAS = ["Executive", "VC", "TPM", "PMM", "Consultant", "Engineer"];
const DENSITIES = ["outline", "standard", "detailed"];

const CONTENT_SOFT_LIMIT = 10_000;  // chars — show trimming notice above this
const CONTENT_HARD_WARN  = 50_000;  // chars — warn before sending

// ── Local intent classification ────────────────────────────────────────────────
// Layout name → id lookup (case-insensitive, with aliases)
const LAYOUT_ALIASES = {
  swot: "swot", kpi: "kpi-grid", timeline: "horizontal-timeline",
  "horizontal timeline": "horizontal-timeline", "vertical timeline": "vertical-timeline",
  gantt: "gantt", bullets: "title-bullets", quote: "blockquote", "big quote": "blockquote",
  stat: "big-number", "big stat": "big-number", venn: "venn", roadmap: "roadmap",
  steps: "three-steps", "three steps": "three-steps", "four steps": "four-steps",
  agenda: "agenda-list", title: "title-center", team: "team-grid",
  "pros and cons": "pros-cons", "before and after": "before-after",
  "hub and spoke": "hub-spoke", pyramid: "pyramid", table: "table",
  "bar chart": "bar-chart", "two stats": "two-stats", "four stats": "four-stats",
  testimonial: "testimonial", "dark quote": "dark-quote", "thank you": "thank-you",
  cta: "cta", "call to action": "cta",
};

function findLayoutId(text) {
  const lower = text.toLowerCase();
  // Check aliases first
  for (const [alias, id] of Object.entries(LAYOUT_ALIASES)) {
    if (lower.includes(alias)) return id;
  }
  // Check layout names directly
  for (const layout of LAYOUT_DEFINITIONS) {
    if (lower.includes(layout.name.toLowerCase())) return layout.id;
  }
  return null;
}

// Content-transformation verbs → always call the API, never short-circuit locally
const CONTENT_VERBS = /\b(summaris[e]?|summarize|rewrite|tighten|expand|condense|restructure|rephrase|simplify|make|turn\s+into|focus\s+on|add\s+a\s+section|convert|extract|highlight|distil|distill|shorten|lengthen|improve|refine|update|revise|edit|clean\s+up|flesh\s+out)\b/;

// Returns { type, layoutId?, slideIndex? } or null (= call API)
function classifyLocalIntent(instruction) {
  const t = instruction.trim().toLowerCase();

  // If the instruction implies content transformation, always call the API
  if (CONTENT_VERBS.test(t)) return null;

  if (/\b(delete|remove)\b.*(this|current|the)?\s*slide/.test(t))
    return { type: "delete_current" };

  if (/\b(duplicate|copy)\b.*(this|current|the)?\s*slide/.test(t))
    return { type: "duplicate_current" };

  // "add a SWOT slide" / "insert a timeline" — but NOT "turn this into a SWOT analysis"
  const isStructural = /\b(add|insert|use|apply)\b/.test(t);
  if (isStructural) {
    const id = findLayoutId(t);
    if (id) return { type: "add_layout", layoutId: id };
  }

  // "add X to slide 3"
  const slideNMatch = t.match(/\bslide\s+(\d+)\b/);
  if (slideNMatch && /\b(add|put|insert|append)\b/.test(t))
    return { type: "edit_slide_n", slideIndex: parseInt(slideNMatch[1], 10) - 1 };

  // "add X to this/current slide"
  if (/\b(add|put|insert|append)\b.*(this|current|the)?\s*slide/.test(t))
    return { type: "edit_current" };

  return null;
}

// ── Error mapping ──────────────────────────────────────────────────────────────
function map400Detail(detail) {
  const d = (detail || "").replace(/^Invalid request:\s*/i, "");
  if (d.includes("content is required"))
    return { msg: "Please paste or type the source text you want to turn into slides.", field: "content" };
  if (d.includes("content is too short"))
    return { msg: "The content you pasted is too short to curate. Add more detail.", field: "content" };
  if (d.includes("content appears to be garbage"))
    return { msg: "The content doesn't look like readable text. Please check what you pasted.", field: "content" };
  if (d.includes("create content from scratch") || d.includes("from scratch"))
    return { msg: "I can curate and restructure existing content, but I can't create a deck from nothing. Paste your source material first.", field: "content" };
  // Legacy mappings
  if (d.includes("Instruction is empty"))
    return { msg: "Please enter an instruction.", field: "instruction" };
  if (d.includes("Instruction is too short"))
    return { msg: "Your instruction needs a bit more detail.", field: "instruction" };
  if (d.includes("invalid characters"))
    return { msg: "Your instruction contains characters we can't process. Please use plain text.", field: "instruction" };
  if (d.includes("binary or encoded data"))
    return { msg: "The pasted content looks like a file or encoded data. Please paste plain text instead.", field: "content" };
  if (d.includes("non-printable characters"))
    return { msg: "The content contains unsupported characters. Try pasting from a plain text source.", field: "content" };
  if (d.includes("repetitive or spammy"))
    return { msg: "The content appears to be duplicated text. Please paste the original document.", field: "content" };
  if (d.includes("URLs, code") || d.includes("non-prose"))
    return { msg: "Please paste prose text — code and links don't convert well to slides.", field: "content" };
  return { msg: "Something went wrong. Please try again.", field: "instruction" };
}

function mapWarning(w) {
  if (w.includes("Content truncated") && w.includes("BGE-M3"))
    return "Your content was large — we selected the most relevant parts for your slide.";
  if (w.includes("Content truncated") && w.includes("head"))
    return "Your content was trimmed to fit. For best results, paste a shorter excerpt.";
  if (w.includes("unusually long average word length"))
    return "Content may contain code or links — slide quality may vary.";
  return null;
}

function MessageBubble({ msg, onRetry }) {
  if (msg.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] bg-purple-600 text-white text-sm rounded-2xl rounded-tr-sm px-4 py-2.5 leading-relaxed">
          {msg.text}
        </div>
      </div>
    );
  }

  if (msg.role === "error") {
    return (
      <div className="flex justify-start">
        <div className="max-w-[85%] bg-red-50 border border-red-200 text-red-700 text-sm rounded-2xl rounded-tl-sm px-4 py-2.5 leading-relaxed">
          <p>{msg.text}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-2 flex items-center gap-1 text-xs font-semibold text-red-600 hover:text-red-800 transition-colors"
            >
              <RefreshCw size={11} /> Retry
            </button>
          )}
        </div>
      </div>
    );
  }

  // assistant
  return (
    <div className="flex justify-start">
      <div className="max-w-[85%] bg-white border border-gray-200 text-gray-800 text-sm rounded-2xl rounded-tl-sm px-4 py-2.5 leading-relaxed shadow-sm">
        <div className="flex items-center gap-1.5 mb-1.5 text-purple-600 text-xs font-semibold">
          <Wand2 size={11} />
          AI generated {msg.slideCount} slide{msg.slideCount !== 1 ? "s" : ""}
        </div>
        <p className="text-gray-500 text-xs">{msg.text}</p>
        {msg.slideNames?.length > 0 && (
          <ul className="mt-1.5 space-y-0.5">
            {msg.slideNames.map((name, i) => (
              <li key={i} className="flex items-center gap-1.5 text-xs text-gray-600">
                <span className="w-4 h-4 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-[9px] font-bold flex-shrink-0">
                  {i + 1}
                </span>
                {name}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default function AIChatPanel({ onClose }) {
  const [mode, setMode] = useState("fast");
  const [persona, setPersona] = useState("Executive");
  const [density, setDensity] = useState("standard");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [instruction, setInstruction] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [instructionError, setInstructionError] = useState("");
  const [contentError, setContentError] = useState("");
  const [warnings, setWarnings] = useState([]); // dismissable inline warnings
  const [lastFailedBody, setLastFailedBody] = useState(null); // for retry
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "Paste your source material below, then tell me how to turn it into slides. I can also delete, duplicate, or add layouts without any content.",
      slideCount: 0,
    },
  ]);

  const bottomRef = useRef(null);
  const textareaRef = useRef(null);

  const brandKit = useEditorStore((s) => s.brandKit);
  const canvasSize = useEditorStore((s) => s.canvasSize);
  const insertPageAt = useEditorStore((s) => s.insertPageAt);
  const currentPageId = useEditorStore((s) => s.currentPageId);
  const pages = useEditorStore((s) => s.pages);
  const setCurrentPageId = useEditorStore((s) => s.setCurrentPageId);
  const deletePage = useEditorStore((s) => s.deletePage);
  const duplicatePage = useEditorStore((s) => s.duplicatePage);
  const _snapshot = useEditorStore((s) => s._snapshot);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const insertSlides = (schema) => {
    const W = canvasSize.width;
    const H = canvasSize.height;
    const primary = brandKit?.colors?.[0]?.hex || "#7c3aed";

    const newPages = schema.slides.map((slide, i) => {
      const elements = buildSlideElements(slide, brandKit, W, H);
      const isDark =
        slide.slideType === "cover" ||
        slide.slideType === "section-divider" ||
        slide.slideType === "full-bleed-text";
      const bgColor = isDark
        ? brandKit?.colors?.find((c) =>
            c.name?.toLowerCase().includes("background") ||
            c.name?.toLowerCase().includes("bg")
          )?.hex || "#0f172a"
        : "#ffffff";

      return {
        id: uuidv4(),
        name: slide.content?.headline || slide.content?.title || `Slide ${i + 1}`,
        elements,
        backgroundColor: bgColor,
      };
    });

    // Apply brand kit if set
    const hasBrandKit =
      (brandKit?.colors?.length ?? 0) > 0 ||
      (brandKit?.fonts?.length ?? 0) > 0;
    const finalPages = hasBrandKit
      ? applyBrandKitToPages(newPages, brandKit, canvasSize)
      : newPages;

    // Find insertion index — after current page
    _snapshot(true);
    const currentIndex = (pages || []).findIndex((p) => p.id === currentPageId);
    const insertAfter = currentIndex >= 0 ? currentIndex : (pages || []).length - 1;

    // Insert pages in order after the current slide
    finalPages.forEach((page, i) => {
      insertPageAt(page, insertAfter + 1 + i);
    });

    // Navigate to first new slide
    if (finalPages.length > 0) {
      setCurrentPageId(finalPages[0].id);
    }

    return finalPages;
  };

  const doSend = async (body, userMsgText) => {
    setInstructionError("");
    setContentError("");
    setWarnings([]);
    setLastFailedBody(null);
    setMessages((prev) => [...prev, { role: "user", text: userMsgText }]);
    setLoading(true);

    try {
      const res = await fetch("/pipeline/api/canvas-from-instruction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        const detail = err.detail || "";

        if (res.status === 400) {
          const { msg, field } = map400Detail(detail);
          if (field === "content") setContentError(msg);
          else setInstructionError(msg);
          // Remove the user bubble we just added so they can fix and retry
          setMessages((prev) => prev.slice(0, -1));
          return;
        }

        if (res.status === 422) {
          console.error("422 from pipeline:", err);
          setMessages((prev) => [...prev, { role: "error", text: "Something went wrong. Please try again." }]);
          return;
        }

        // 500+
        console.error("Pipeline error:", err);
        setLastFailedBody(body);
        setMessages((prev) => [...prev, { role: "error", text: "Slide generation failed. Please try again in a moment.", canRetry: true }]);
        return;
      }

      const data = await res.json();

      // Service says this was a local intent — execute it
      if (data.mode === "local") {
        const result = executeLocalIntent(data.intent?.intent, data.intent);
        setMessages((prev) => [...prev, { role: "assistant", text: result, slideCount: 0 }]);
        return;
      }

      // Show mapped warnings (dismissable)
      const mappedWarnings = (data.warnings || [])
        .map(mapWarning)
        .filter(Boolean);
      if (mappedWarnings.length) setWarnings(mappedWarnings);

      const schema = data.canva_schema;
      if (!schema?.slides?.length) {
        setMessages((prev) => [...prev, { role: "error", text: "No slides were generated. Try rephrasing your instruction." }]);
        return;
      }

      const inserted = insertSlides(schema);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: "Added after your current slide.",
          slideCount: inserted.length,
          slideNames: inserted.map((p) => p.name),
        },
      ]);
    } catch (err) {
      // Network / timeout
      console.error("Network error:", err);
      setLastFailedBody(body);
      setMessages((prev) => [
        ...prev,
        { role: "error", text: "This is taking longer than expected. Your slide is still being generated — please wait or try again.", canRetry: true },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Execute a local action without calling the API
  const executeLocalIntent = (intentType, intentData) => {
    const list = pages || [];
    const currentIndex = list.findIndex((p) => p.id === currentPageId);

    switch (intentType) {
      case "delete_current": {
        if (list.length <= 1) return "Can't delete the only slide.";
        _snapshot(true);
        deletePage(currentPageId);
        return "Deleted the current slide.";
      }
      case "duplicate_current": {
        _snapshot(true);
        duplicatePage(currentPageId);
        return "Duplicated the current slide.";
      }
      case "add_layout": {
        const layout = LAYOUT_DEFINITIONS.find((l) => l.id === intentData?.layoutId);
        if (!layout) return "Couldn't find that layout.";
        _snapshot(true);
        const elements = layout.generate(canvasSize);
        const newPage = { id: uuidv4(), name: layout.name, elements, backgroundColor: null };
        const insertAt = currentIndex >= 0 ? currentIndex + 1 : list.length;
        insertPageAt(newPage, insertAt);
        setCurrentPageId(newPage.id);
        return `Added a "${layout.name}" slide.`;
      }
      case "edit_slide_n": {
        const idx = intentData?.slideIndex ?? -1;
        if (idx < 0 || idx >= list.length) return `Slide ${(idx ?? 0) + 1} doesn't exist.`;
        setCurrentPageId(list[idx].id);
        return `Navigated to slide ${idx + 1}. Select an element and type to edit it.`;
      }
      case "edit_current":
        return "Select a text element on the current slide and type to edit it.";
      default:
        return "Done.";
    }
  };

  const handleSend = () => {
    const trimmed = instruction.trim();
    if (!trimmed || loading) return;

    setInstructionError("");
    setContentError("");

    // 1. Local intent short-circuit — no API call needed
    const localIntent = classifyLocalIntent(trimmed);
    if (localIntent) {
      setMessages((prev) => [...prev, { role: "user", text: trimmed }]);
      setInstruction("");
      const result = executeLocalIntent(localIntent.type, localIntent);
      setMessages((prev) => [...prev, { role: "assistant", text: result, slideCount: 0 }]);
      return;
    }

    // 2. Determine content to send — prefer user-pasted, fall back to current slide text
    let resolvedContent = content.trim();
    let autoExtracted = false;

    if (!resolvedContent) {
      // Try to extract text from the current slide's elements
      const currentPage = (pages || []).find((p) => p.id === currentPageId);
      const slideText = (currentPage?.elements || [])
        .filter((el) => el.type === "text" && el.text?.trim())
        .map((el) => el.text.trim())
        .join("\n");
      if (slideText) {
        resolvedContent = slideText;
        autoExtracted = true;
      } else {
        setContentError("Paste the source material you want to curate above.");
        return;
      }
    }

    // 3. Warn on very large content before sending
    if (resolvedContent.length > CONTENT_HARD_WARN) {
      setContentError(`This content is very large (${Math.round(resolvedContent.length / 1000)}KB). Consider pasting a shorter excerpt for better results.`);
      return;
    }

    const body = {
      instruction: trimmed,
      mode,
      persona,
      density,
      content: resolvedContent,
    };
    const userMsgText = autoExtracted
      ? trimmed
      : `${trimmed}\n\nContext: ${resolvedContent}`;
    setInstruction("");
    setContent("");
    doSend(body, userMsgText);
  };

  const handleRetry = () => {
    if (!lastFailedBody || loading) return;
    setMessages((prev) => prev.filter((m) => !m.canRetry));
    doSend(lastFailedBody, "↩ Retrying…");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="fixed right-0 top-14 bottom-[140px] w-[360px] bg-white border-l border-gray-200 shadow-2xl z-[9990] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #7c3aed 0%, #0891b2 100%)" }}
          >
            <Wand2 size={14} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900 leading-tight">AI Slide Assistant</p>
            <p className="text-[10px] text-gray-400">Curates your content into slides</p>
          </div>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600">
          <X size={16} />
        </button>
      </div>

      {/* Mode toggle */}
      <div className="px-4 pt-3 pb-2 flex-shrink-0">
        <div className="flex rounded-xl overflow-hidden border border-gray-200 text-xs font-semibold">
          <button
            onClick={() => setMode("fast")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 transition-colors ${
              mode === "fast"
                ? "bg-purple-600 text-white"
                : "bg-white text-gray-500 hover:bg-gray-50"
            }`}
          >
            <Zap size={12} />
            Quick
          </button>
          <button
            onClick={() => setMode("detailed")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 transition-colors ${
              mode === "detailed"
                ? "bg-purple-600 text-white"
                : "bg-white text-gray-500 hover:bg-gray-50"
            }`}
          >
            <BarChart2 size={12} />
            Detailed
          </button>
        </div>
        <p className="text-[10px] text-gray-400 mt-1.5 text-center">
          {mode === "fast"
            ? "Single LLM call — fast results"
            : "Full pipeline — richer layouts & voice"}
        </p>
      </div>

      {/* Advanced options */}
      <div className="px-4 pb-2 flex-shrink-0">
        <button
          onClick={() => setShowAdvanced((v) => !v)}
          className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-gray-600 transition-colors"
        >
          {showAdvanced ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          Advanced options
        </button>
        {showAdvanced && (
          <div className="mt-2 flex gap-2">
            <div className="flex-1">
              <label className="block text-[10px] text-gray-500 mb-1 font-medium">Persona</label>
              <select
                value={persona}
                onChange={(e) => setPersona(e.target.value)}
                className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-purple-400 bg-gray-50"
              >
                {PERSONAS.map((p) => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-[10px] text-gray-500 mb-1 font-medium">Density</label>
              <select
                value={density}
                onChange={(e) => setDensity(e.target.value)}
                className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-purple-400 bg-gray-50"
                disabled={mode === "fast"}
              >
                {DENSITIES.map((d) => <option key={d}>{d}</option>)}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Warning toasts */}
      {warnings.length > 0 && (
        <div className="px-4 pt-2 flex-shrink-0 space-y-1">
          {warnings.map((w, i) => (
            <div key={i} className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-800">
              <AlertTriangle size={12} className="flex-shrink-0 mt-0.5 text-amber-500" />
              <span className="flex-1">{w}</span>
              <button onClick={() => setWarnings((prev) => prev.filter((_, j) => j !== i))} className="text-amber-400 hover:text-amber-600 flex-shrink-0">
                <X size={11} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-3 min-h-0">
        {messages.map((msg, i) => (
          <MessageBubble key={i} msg={msg} onRetry={msg.canRetry ? handleRetry : null} />
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2 shadow-sm">
              <Loader2 size={14} className="animate-spin text-purple-500" />
              <span className="text-xs text-gray-500">
                {mode === "fast" ? "Generating slide…" : "Building your slide deck…"}
              </span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div className="border-t border-gray-100 px-4 pt-3 pb-4 flex-shrink-0 space-y-2">
        {/* Optional context */}
        <div>
          <textarea
            value={content}
            onChange={(e) => { setContent(e.target.value); setContentError(""); }}
            placeholder="Paste your source text here — reports, notes, docs, data (plain text, max ~8,000 words)"
            className={`w-full text-xs border rounded-xl px-3 py-2 focus:outline-none resize-none bg-gray-50 placeholder:text-gray-300 ${
              contentError ? "border-red-300 focus:border-red-400" : "border-gray-200 focus:border-purple-400"
            }`}
            rows={2}
          />
          <div className="flex justify-between items-center mt-0.5 px-0.5">
            {contentError
              ? <p className="text-[10px] text-red-500">{contentError}</p>
              : content.length >= CONTENT_SOFT_LIMIT
              ? <p className="text-[10px] text-amber-600">Content will be intelligently trimmed to what's most relevant.</p>
              : <span />
            }
            <p className={`text-[10px] ${content.length >= CONTENT_SOFT_LIMIT ? "text-amber-500" : "text-gray-300"}`}>
              {content.length.toLocaleString()} chars
            </p>
          </div>
        </div>

        {/* Instruction + send */}
        <div>
          <div className="flex gap-2 items-end">
            <textarea
              ref={textareaRef}
              value={instruction}
              onChange={(e) => { setInstruction(e.target.value); setInstructionError(""); }}
              onKeyDown={handleKeyDown}
              placeholder='e.g. "Create a 3-slide summary of our Q4 results"'
              className={`flex-1 text-sm border rounded-xl px-3 py-2 focus:outline-none resize-none bg-white placeholder:text-gray-300 ${
                instructionError ? "border-red-300 focus:border-red-400" : "border-gray-200 focus:border-purple-400"
              }`}
              rows={2}
            />
            <button
              onClick={handleSend}
              disabled={!instruction.trim() || loading}
              className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-white disabled:opacity-40 transition-opacity hover:opacity-90 shadow-sm"
              style={{ background: "linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)" }}
            >
              <Send size={15} />
            </button>
          </div>
          {instructionError && <p className="text-[10px] text-red-500 mt-0.5 px-0.5">{instructionError}</p>}
        </div>
        <p className="text-[10px] text-gray-300 text-center">Enter to send · Shift+Enter for new line</p>
      </div>
    </div>
  );
}
