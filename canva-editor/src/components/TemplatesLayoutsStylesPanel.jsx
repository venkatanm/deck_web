import { useState } from "react";
import { TemplatesPanel } from "./SidebarPanels";
import LayoutsPanel from "./LayoutsPanel";
import StylesPanel from "./StylesPanel";

export default function TemplatesLayoutsStylesPanel() {
  const [tab, setTab] = useState("templates");

  return (
    <div className="flex flex-col h-full">
      <div className="flex border-b border-gray-200 mb-4 flex-shrink-0">
        {["templates", "layouts", "styles"].map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`flex-1 py-2.5 text-xs font-medium capitalize transition-colors ${
              tab === t
                ? "text-purple-700 border-b-2 border-purple-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto min-h-0">
        {tab === "templates" && <TemplatesPanel />}
        {tab === "layouts" && <LayoutsPanel />}
        {tab === "styles" && <StylesPanel />}
      </div>
    </div>
  );
}
