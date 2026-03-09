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
import useFeedback from "../store/useFeedback";
import { buildSlideElements, applyBrandKitToPages } from "../utils/importContentSchema";
import { formatPipelineError } from "../utils/pipelineErrors";
import { LAYOUT_DEFINITIONS } from "../data/layoutDefinitions";
import { v4 as uuidv4 } from "uuid";

const PERSONAS = ["Executive", "VC", "TPM", "PMM", "Consultant", "Engineer"];
const DENSITIES = ["outline", "standard", "detailed"];

/* Light theme for AI panel to match editor sidebar (white / gray) */
const LIGHT = {
  bg: "#ffffff",
  bgCard: "#f9fafb",
  border: "#e5e7eb",
  textHi: "#111827",
  textMid: "#6b7280",
  textLo: "#9ca3af",
  accent: "#0891b2",
  accentDim: "rgba(8, 145, 178, 0.12)",
  accentBorder: "rgba(8, 145, 178, 0.3)",
  accentOnWhite: "#0e7490",
  btnText: "#ffffff",
};

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
  "bar chart": "bar-chart", "barchart": "bar-chart", "bar graph": "bar-chart",
  "pie chart": "bar-chart", "pie graph": "bar-chart",
  "two stats": "two-stats", "four stats": "four-stats",
  testimonial: "testimonial", "dark quote": "dark-quote", "thank you": "thank-you",
  cta: "cta", "call to action": "cta",
};

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

  // "add a blank slide" / "insert blank page" — explicit blank, no layout name
  if (/\bblank\s+(slide|page)\b/.test(t) || /\b(add|insert|new)\s+a?\s*(new\s+)?(slide|page)\b$/.test(t))
    return { type: "add_blank" };

  // "add a SWOT slide" / "insert a timeline" — but NOT "turn this into a SWOT analysis"
  const isStructural = /\b(add|insert|use|apply)\b/.test(t);
  if (isStructural) {
    // Count how many distinct layout aliases match — if multiple, let API handle it
    const matchedLayouts = Object.entries(LAYOUT_ALIASES).filter(([alias]) => t.includes(alias));
    const uniqueIds = new Set(matchedLayouts.map(([, id]) => id));
    if (uniqueIds.size === 1) {
      return { type: "add_layout", layoutId: [...uniqueIds][0] };
    } else if (uniqueIds.size > 1) {
      // Multiple different layouts requested — fall through to API
      return null;
    }
    // Also check layout names directly (single match only)
    const directMatches = LAYOUT_DEFINITIONS.filter(l => t.includes(l.name.toLowerCase()));
    if (directMatches.length === 1) return { type: "add_layout", layoutId: directMatches[0].id };
  }

  // "add X to slide 3"
  const slideNMatch = t.match(/\bslide\s+(\d+)\b/);
  if (slideNMatch && /\b(add|put|insert|append)\b/.test(t))
    return { type: "edit_slide_n", slideIndex: parseInt(slideNMatch[1], 10) - 1 };

  // "add X to this/current slide" — requires explicit this/current qualifier
  if (/\b(add|put|insert|append)\b.*(this|current)\s*slide/.test(t))
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
        <div className="max-w-[85%] text-sm rounded-2xl rounded-tr-sm px-4 py-2.5 leading-relaxed" style={{ background: LIGHT.accentDim, color: LIGHT.textHi, border: `1px solid ${LIGHT.accentBorder}` }}>
          {msg.text}
        </div>
      </div>
    );
  }

  if (msg.role === "error") {
    return (
      <div className="flex justify-start">
        <div className="max-w-[85%] text-sm rounded-2xl rounded-tl-sm px-4 py-2.5 leading-relaxed" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", color: "#dc2626" }}>
          <p>{msg.text}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-2 flex items-center gap-1 text-xs font-semibold transition-colors"
              style={{ color: "#dc2626" }}
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
      <div className="max-w-[85%] text-sm rounded-2xl rounded-tl-sm px-4 py-2.5 leading-relaxed" style={{ background: LIGHT.bgCard, border: `1px solid ${LIGHT.border}`, color: LIGHT.textMid }}>
        {msg.slideCount > 0 && (
          <div className="flex items-center gap-1.5 mb-1.5 text-xs font-semibold" style={{ color: LIGHT.accent }}>
            <Wand2 size={11} />
            AI generated {msg.slideCount} slide{msg.slideCount !== 1 ? "s" : ""}
          </div>
        )}
        <p className="text-xs" style={{ color: LIGHT.textMid }}>{msg.text}</p>
        {msg.slideNames?.length > 0 && (
          <ul className="mt-1.5 space-y-0.5">
            {msg.slideNames.map((name, i) => (
              <li key={i} className="flex items-center gap-1.5 text-xs" style={{ color: LIGHT.textHi }}>
                <span className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0" style={{ background: LIGHT.accentDim, color: LIGHT.accent }}>
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
  const triggerSurvey = useFeedback((s) => s.triggerSurvey);
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

  const doSend = async (body, userMsgText, maxSlides = null) => {
    setInstructionError("");
    setContentError("");
    setWarnings([]);
    setLastFailedBody(null);
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
        const friendlyText = formatPipelineError(detail);
        setMessages((prev) => [...prev, { role: "error", text: friendlyText, canRetry: true }]);
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
      // Trigger doc-to-deck survey after a successful AI import
      triggerSurvey("doc_to_deck", {
        isDirty: false,
        isModalOpen: false,
        pageContext: "editor",
      });
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
      case "add_blank": {
        _snapshot(true);
        const newPage = { id: uuidv4(), name: "Blank slide", elements: [], backgroundColor: null };
        const insertAt = currentIndex >= 0 ? currentIndex + 1 : list.length;
        insertPageAt(newPage, insertAt);
        setCurrentPageId(newPage.id);
        return "Added a blank slide.";
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

    // Infer desired slide count — handles digits ("3 slides") and words ("two slides")
    const WORD_NUMS = { one:1, two:2, three:3, four:4, five:5, six:6, seven:7, eight:8, nine:9, ten:10, eleven:11, twelve:12 };
    const digitHint = /\b(\d+)\s+slides?\b/.exec(trimmed);
    const wordHint  = /\b(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\s+slides?\b/i.exec(trimmed);
    const numSlides = digitHint
      ? Math.min(parseInt(digitHint[1], 10), 12)
      : wordHint
        ? WORD_NUMS[wordHint[1].toLowerCase()]
        : 1;

    const body = {
      instruction: trimmed,
      mode,
      persona,
      density,
      content: resolvedContent,
      num_slides: numSlides,
    };
    const userMsgText = autoExtracted
      ? trimmed
      : `${trimmed}\n\nContext: ${resolvedContent}`;
    setMessages((prev) => [...prev, { role: "user", text: trimmed }]);
    setInstruction("");
    setContent("");
    doSend(body, userMsgText, numSlides);
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
    <div className="ai-panel-light fixed right-0 top-14 bottom-[140px] w-[360px] z-[9990] flex flex-col" style={{ background: LIGHT.bg, borderLeft: `1px solid ${LIGHT.border}` }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 flex-shrink-0" style={{ borderBottom: `1px solid ${LIGHT.border}` }}>
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: LIGHT.accentDim, border: `1px solid ${LIGHT.accentBorder}` }}>
            <Wand2 size={14} style={{ color: LIGHT.accent }} />
          </div>
          <div>
            <p className="text-sm font-bold leading-tight" style={{ color: LIGHT.textHi }}>AI Slide Assistant</p>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: LIGHT.accent, boxShadow: `0 0 4px ${LIGHT.accent}` }} />
              <p className="text-[10px]" style={{ color: LIGHT.textLo }}>Curates your content into slides</p>
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg transition-colors"
          style={{ color: LIGHT.textLo }}
          onMouseEnter={(e) => { e.currentTarget.style.background = LIGHT.bgCard; e.currentTarget.style.color = LIGHT.textHi; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = ""; e.currentTarget.style.color = LIGHT.textLo; }}
        >
          <X size={16} />
        </button>
      </div>

      {/* Mode toggle */}
      <div className="px-4 pt-3 pb-2 flex-shrink-0">
        <div className="flex rounded-xl overflow-hidden text-xs font-semibold" style={{ border: `1px solid ${LIGHT.border}` }}>
          {[["fast", Zap, "Quick"], ["detailed", BarChart2, "Detailed"]].map(([m, Icon, label]) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 transition-colors"
              style={mode === m ? { background: LIGHT.accent, color: LIGHT.btnText, fontWeight: 700 } : { color: LIGHT.textLo, background: "transparent" }}
            >
              <Icon size={12} />
              {label}
            </button>
          ))}
        </div>
        <p className="text-[10px] mt-1.5 text-center" style={{ color: LIGHT.textLo }}>
          {mode === "fast" ? "Single LLM call — fast results" : "Full pipeline — richer layouts & voice"}
        </p>
      </div>

      {/* Advanced options */}
      <div className="px-4 pb-2 flex-shrink-0">
        <button
          onClick={() => setShowAdvanced((v) => !v)}
          className="flex items-center gap-1 text-[11px] transition-colors"
          style={{ color: LIGHT.textLo }}
        >
          {showAdvanced ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          Advanced options
        </button>
        {showAdvanced && (
          <div className="mt-2 flex gap-2">
            {[["Persona", persona, setPersona, PERSONAS, false], ["Density", density, setDensity, DENSITIES, mode === "fast"]].map(([lbl, val, setter, opts, dis]) => (
              <div key={lbl} className="flex-1">
                <label className="block text-[10px] mb-1 font-medium" style={{ color: LIGHT.textLo }}>{lbl}</label>
                <select
                  value={val}
                  onChange={(e) => setter(e.target.value)}
                  disabled={dis}
                  className="w-full text-xs rounded-lg px-2 py-1.5 focus:outline-none disabled:opacity-50"
                  style={{ border: `1px solid ${LIGHT.border}`, background: LIGHT.bgCard, color: LIGHT.textHi }}
                >
                  {opts.map((o) => <option key={o}>{o}</option>)}
                </select>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Warning toasts */}
      {warnings.length > 0 && (
        <div className="px-4 pt-2 flex-shrink-0 space-y-1">
          {warnings.map((w, i) => (
            <div key={i} className="flex items-start gap-2 rounded-lg px-3 py-2 text-xs" style={{ background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.35)", color: "#b45309" }}>
              <AlertTriangle size={12} className="flex-shrink-0 mt-0.5" style={{ color: "#d97706" }} />
              <span className="flex-1">{w}</span>
              <button onClick={() => setWarnings((prev) => prev.filter((_, j) => j !== i))} style={{ color: "#d97706" }}>
                <X size={11} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto scrollbar-dark px-4 py-2 space-y-3 min-h-0">
        {messages.map((msg, i) => (
          <MessageBubble key={i} msg={msg} onRetry={msg.canRetry ? handleRetry : null} />
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2" style={{ background: LIGHT.bgCard, border: `1px solid ${LIGHT.border}` }}>
              <Loader2 size={14} className="animate-spin" style={{ color: LIGHT.accent }} />
              <span className="text-xs" style={{ color: LIGHT.textMid }}>
                {mode === "fast" ? "Generating slide…" : "Building your slide deck…"}
              </span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div className="px-4 pt-3 pb-4 flex-shrink-0 space-y-2" style={{ borderTop: `1px solid ${LIGHT.border}` }}>
        {/* Instruction + send (user chat box) */}
        <div>
          <div className="flex gap-2 items-end">
            <textarea
              ref={textareaRef}
              value={instruction}
              onChange={(e) => { setInstruction(e.target.value); setInstructionError(""); }}
              onKeyDown={handleKeyDown}
              placeholder='e.g. "Create a 3-slide summary of our Q4 results"'
              className="flex-1 text-sm rounded-xl px-3 py-2 focus:outline-none resize-none panel-input"
              style={instructionError ? { borderColor: "rgba(239,68,68,0.6)" } : {}}
              rows={2}
            />
            <button
              onClick={handleSend}
              disabled={!instruction.trim() || loading}
              className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center disabled:opacity-40 transition-opacity"
              style={{ background: LIGHT.accent, color: LIGHT.btnText }}
            >
              <Send size={15} />
            </button>
          </div>
          {instructionError && <p className="text-[10px] mt-0.5 px-0.5" style={{ color: "#dc2626" }}>{instructionError}</p>}
        </div>
        <p className="text-[10px] text-center" style={{ color: LIGHT.textLo }}>Enter to send · Shift+Enter for new line</p>

        {/* Optional context — paste source text below */}
        <div>
          <textarea
            value={content}
            onChange={(e) => { setContent(e.target.value); setContentError(""); }}
            placeholder="Paste your source text here — reports, notes, docs, data (plain text, max ~8,000 words)"
            className="w-full text-xs rounded-xl px-3 py-2 focus:outline-none resize-none panel-input"
            style={contentError ? { borderColor: "rgba(239,68,68,0.6)" } : {}}
            rows={2}
          />
          <div className="flex justify-between items-center mt-0.5 px-0.5">
            {contentError
              ? <p className="text-[10px]" style={{ color: "#dc2626" }}>{contentError}</p>
              : content.length >= CONTENT_SOFT_LIMIT
              ? <p className="text-[10px]" style={{ color: "#b45309" }}>Content will be intelligently trimmed to what's most relevant.</p>
              : <span />
            }
            <p className="text-[10px]" style={{ color: content.length >= CONTENT_SOFT_LIMIT ? "#b45309" : LIGHT.textLo }}>
              {content.length.toLocaleString()} chars
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
