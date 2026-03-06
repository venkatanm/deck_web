import { useState, useEffect } from "react";
import { apiFetch } from "../api/client";

const STEPS = [
  { id: "sidebar", title: "👈 Start here", body: "Click Elements, Text or Uploads in the sidebar to add content to your canvas.", position: { left: 80, top: 120 }, arrow: "left" },
  { id: "canvas", title: "🎨 Your canvas", body: "Click any element to select it. Drag to move. Use handles to resize or rotate.", position: { left: "50%", top: "40%", transform: "translate(-50%, -50%)" }, arrow: null },
  { id: "toolbar", title: "🛠 Context toolbar", body: "When you select an element, this bar shows controls for color, font, size and more.", position: { left: "50%", top: 70, transform: "translateX(-50%)" }, arrow: "top" },
  { id: "pages", title: "📄 Pages", body: "Add multiple pages to build a presentation or multi-page document.", position: { left: "50%", bottom: 160, transform: "translateX(-50%)" }, arrow: "bottom" },
];

export default function Onboarding() {
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let t;
    apiFetch("/api/settings")
      .then(({ onboarding_done }) => {
        if (!onboarding_done) {
          t = setTimeout(() => setVisible(true), 1500);
        }
      })
      .catch(() => {});
    return () => { if (t) clearTimeout(t); };
  }, []);

  const dismiss = () => {
    apiFetch("/api/settings/onboarding", { method: "PUT" }).catch(() => {});
    setVisible(false);
  };

  const next = () => {
    if (step < STEPS.length - 1) setStep((s) => s + 1);
    else dismiss();
  };

  if (!visible) return null;

  const current = STEPS[step];

  return (
    <>
      <div className="fixed inset-0 z-[9998] bg-black/30 backdrop-blur-[1px]" onClick={dismiss} />
      <div className="fixed z-[9999] w-72 bg-white rounded-2xl shadow-2xl p-5 border border-gray-100" style={{ ...current.position }} onClick={(e) => e.stopPropagation()}>
        {current.arrow === "left" && <div className="absolute -left-2 top-6 w-4 h-4 bg-white border-l border-b border-gray-100 rotate-45" />}
        {current.arrow === "top" && <div className="absolute -top-2 left-8 w-4 h-4 bg-white border-l border-t border-gray-100 rotate-45" />}
        {current.arrow === "bottom" && <div className="absolute -bottom-2 left-8 w-4 h-4 bg-white border-r border-b border-gray-100 rotate-45" />}
        <div className="flex gap-1 mb-3">
          {STEPS.map((_, i) => (
            <div key={i} className={`h-1 rounded-full flex-1 transition-colors ${i <= step ? "bg-purple-500" : "bg-gray-200"}`} />
          ))}
        </div>
        <h3 className="font-bold text-gray-900 text-sm mb-1">{current.title}</h3>
        <p className="text-xs text-gray-500 leading-relaxed mb-4">{current.body}</p>
        <div className="flex items-center justify-between">
          <button type="button" onClick={dismiss} className="text-xs text-gray-400 hover:text-gray-600">Skip tour</button>
          <button type="button" onClick={next} className="text-xs bg-purple-600 text-white px-4 py-1.5 rounded-lg hover:bg-purple-700 font-medium">{step < STEPS.length - 1 ? "Next →" : "Get started!"}</button>
        </div>
      </div>
    </>
  );
}
