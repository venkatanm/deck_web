import { useState } from "react";
import {
  Wand2,
  Loader2,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import useEditorStore from "../store/useEditorStore";

const QUICK_PROMPTS = [
  "Make the headline more concise and punchy",
  "Rewrite bullet points as questions",
  "Add urgency and stronger call to action",
  "Use more formal executive language",
  "Simplify — fewer words, bigger ideas",
  "Make numbers and stats more prominent",
];

export default function AIRefinementPanel() {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const [error, setError] = useState(null);
  const [scope, setScope] = useState("slide");
  // slide | deck

  const currentPageId = useEditorStore((s) => s.currentPageId);
  const pages = useEditorStore((s) => s.pages);
  const updatePage = useEditorStore((s) => s.updatePage);
  const _snapshot = useEditorStore((s) => s._snapshot);

  const currentPage = pages.find((p) => p.id === currentPageId);
  const elements = currentPage?.elements || [];

  // Serialize slide content for the API
  // Only send text-bearing fields — not coordinates
  const serializeForAI = (els) =>
    els
      .filter(
        (el) =>
          el.text || el.value || el.label || el.items || el.stats || el.data
      )
      .map((el) => ({
        id: el.id,
        type: el.type,
        subtype: el.subtype,
        text: el.text,
        value: el.value,
        label: el.label,
        trend: el.trend,
        trendLabel: el.trendLabel,
        leftValue: el.leftValue,
        leftLabel: el.leftLabel,
        rightValue: el.rightValue,
        rightLabel: el.rightLabel,
        items: el.items,
        title: el.title,
      }))
      .filter((el) =>
        Object.values(el).some((v) => v !== undefined && v !== null)
      );

  const refine = async (promptText) => {
    const p = promptText || prompt;
    if (!p.trim()) return;

    setLoading(true);
    setError(null);
    setLastResult(null);

    const targetPages = scope === "deck" ? pages : [currentPage].filter(Boolean);
    if (targetPages.length === 0) {
      setError("No slide selected.");
      setLoading(false);
      return;
    }

    const serialized = targetPages.map((pg) => ({
      slideId: pg.id,
      elements: serializeForAI(pg.elements || []),
    }));

    if (serialized.every((s) => s.elements.length === 0)) {
      setError("No text content to refine on this slide.");
      setLoading(false);
      return;
    }

    const systemPrompt =
      scope === "deck"
        ? `You are refining a presentation deck.
         You will receive an array of slides, each with
         text-bearing elements. Apply the user's request
         to ALL slides consistently.
         RULES:
         - Return ONLY a JSON array of slides
         - Each slide: { slideId, elements: [...] }
         - Each element keeps its exact id and type
         - Only change text/value/label/items fields
         - Never change ids, types, positions or sizes
         - Keep all existing elements — do not add or remove
         - Raw JSON only, no markdown, no explanation`
        : `You are refining a single presentation slide.
         You will receive the slide's text-bearing elements.
         Apply the user's request to the slide content.
         RULES:
         - Return ONLY a JSON array of elements
         - Each element keeps its exact id and type
         - Only change text/value/label/items fields
         - Never change ids, types, positions or sizes
         - Keep all existing elements — do not add or remove
         - Raw JSON only, no markdown, no explanation`;

    const userContent =
      scope === "deck"
        ? `Slides: ${JSON.stringify(serialized)}\n\nRequest: ${p}`
        : `Elements: ${JSON.stringify(serialized[0].elements)}\n\nRequest: ${p}`;

    const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
    if (!apiKey) {
      setError(
        "Missing VITE_ANTHROPIC_API_KEY. Add it to your .env file."
      );
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(
        "https://api.anthropic.com/v1/messages",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify({
            model: "claude-sonnet-4-20250514",
            max_tokens: 2000,
            system: systemPrompt,
            messages: [{ role: "user", content: userContent }],
          }),
        }
      );

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(
          errData.error?.message || `API error: ${response.status}`
        );
      }

      const data = await response.json();
      const raw = data.content?.[0]?.text || "";
      const clean = raw.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);

      // Merge updates back into store
      _snapshot(true);

      if (scope === "deck") {
        const slideMap = new Map(
          parsed.map((s) => [s.slideId, s.elements])
        );
        const newPages = pages.map((pg) => {
          const updates = slideMap.get(pg.id);
          if (!updates) return pg;
          return {
            ...pg,
            elements: (pg.elements || []).map((el) => {
              const upd = updates.find((u) => u.id === el.id);
              return upd ? { ...el, ...upd } : el;
            }),
          };
        });
        useEditorStore.getState().setPages(newPages);
      } else {
        const updMap = new Map((parsed || []).map((u) => [u.id, u]));
        const newElements = elements.map((el) => {
          const upd = updMap.get(el.id);
          return upd ? { ...el, ...upd } : el;
        });
        updatePage(currentPageId, { elements: newElements });
      }

      setLastResult(
        `✓ ${scope === "deck" ? "Deck" : "Slide"} updated`
      );
      setPrompt("");
    } catch (e) {
      setError("Refinement failed: " + (e.message || String(e)));
    }

    setLoading(false);
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Header */}
      <div>
        <p className="text-xs font-semibold text-purple-600 uppercase tracking-wide flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5" />
          AI Refinement
        </p>
        <p className="text-[11px] text-gray-400 mt-0.5">
          Ask Claude to improve your slide content
        </p>
      </div>

      {/* Scope selector */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
        <button
          onClick={() => setScope("slide")}
          className={`flex-1 text-[11px] py-1.5 rounded-lg font-medium transition-colors ${
            scope === "slide"
              ? "bg-white text-purple-700 shadow-sm"
              : "text-gray-500"
          }`}
        >
          This Slide
        </button>
        <button
          onClick={() => setScope("deck")}
          className={`flex-1 text-[11px] py-1.5 rounded-lg font-medium transition-colors ${
            scope === "deck"
              ? "bg-white text-purple-700 shadow-sm"
              : "text-gray-500"
          }`}
        >
          Whole Deck
        </button>
      </div>

      {/* Quick prompts */}
      <div>
        <p className="text-[10px] text-gray-400 mb-1.5 uppercase tracking-wide font-medium">
          Quick Actions
        </p>
        <div className="flex flex-col gap-1">
          {QUICK_PROMPTS.map((qp, i) => (
            <button
              key={i}
              onClick={() => refine(qp)}
              disabled={loading}
              className="text-[11px] text-left px-2.5 py-1.5 rounded-lg border border-gray-200 hover:border-purple-400 hover:bg-purple-50 hover:text-purple-700 transition-all text-gray-600 disabled:opacity-40"
            >
              {qp}
            </button>
          ))}
        </div>
      </div>

      {/* Custom prompt */}
      <div>
        <p className="text-[10px] text-gray-400 mb-1.5 uppercase tracking-wide font-medium">
          Custom Instruction
        </p>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              refine();
            }
          }}
          placeholder="e.g. Convert bullets to a numbered list. Make the tone more urgent. Add specific metrics."
          className="w-full h-20 text-xs border border-gray-200 rounded-xl p-2.5 resize-none focus:outline-none focus:border-purple-400 leading-relaxed"
        />
        <button
          onClick={() => refine()}
          disabled={loading || !prompt.trim()}
          className="w-full mt-2 py-2.5 bg-purple-600 text-white text-xs rounded-xl font-medium hover:bg-purple-700 disabled:opacity-40 flex items-center justify-center gap-2 transition-colors"
        >
          {loading ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Refining {scope === "deck" ? "deck" : "slide"}...
            </>
          ) : (
            <>
              <Wand2 className="w-3.5 h-3.5" />
              Refine {scope === "deck" ? "Whole Deck" : "This Slide"}
              <span className="opacity-50 text-[9px] ml-1">⌘↵</span>
            </>
          )}
        </button>
      </div>

      {/* Result / error */}
      {lastResult && (
        <p className="text-xs text-green-600 font-medium flex items-center gap-1">
          <CheckCircle2 className="w-3.5 h-3.5" />
          {lastResult}
        </p>
      )}
      {error && (
        <p className="text-xs text-red-500 bg-red-50 rounded-xl p-2">
          {error}
        </p>
      )}

      <p className="text-[10px] text-gray-400">
        Tip: Ctrl+Z / ⌘Z undoes AI changes if you don't like the result.
      </p>
    </div>
  );
}
