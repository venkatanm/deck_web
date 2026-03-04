import { useState } from "react";
import {
  Upload,
  Trash2,
  Wand2,
  Save,
  Plus,
} from "lucide-react";
import useEditorStore from "../store/useEditorStore";
import { useToast } from "./Toast.jsx";
import { v4 as uuidv4 } from "uuid";

export default function BrandKitPanel() {
  const brandKit = useEditorStore((s) => s.brandKit);
  const setBrandKit = useEditorStore((s) => s.setBrandKit);
  const addBrandColor = useEditorStore((s) => s.addBrandColor);
  const addBrandFont = useEditorStore((s) => s.addBrandFont);
  const addBrandLogo = useEditorStore((s) => s.addBrandLogo);
  const addBrandIcon = useEditorStore((s) => s.addBrandIcon);
  const addElement = useEditorStore((s) => s.addElement);

  const [section, setSection] = useState("logos");

  return (
    <div className="flex flex-col h-full">
      <div className="mb-3">
        <input
          value={brandKit?.name || "My Brand"}
          onChange={(e) => setBrandKit({ name: e.target.value })}
          className="w-full text-sm font-semibold text-gray-800 border-0 border-b border-gray-200 pb-1 focus:outline-none focus:border-purple-400 bg-transparent"
          placeholder="Your Brand Name"
        />
        <p className="text-[10px] text-gray-400 mt-1">
          Brand assets available everywhere in the editor
        </p>
      </div>

      <div className="flex gap-1 flex-wrap mb-3">
        {[
          { id: "logos", label: "Logos" },
          { id: "colors", label: "Colors" },
          { id: "fonts", label: "Fonts" },
          { id: "icons", label: "Graphics" },
          { id: "templates", label: "Templates" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSection(tab.id)}
            className={`text-[11px] px-2.5 py-1 rounded-full font-medium transition-colors ${
              section === tab.id
                ? "bg-purple-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        {section === "logos" && (
          <LogosSection
            brandKit={brandKit}
            addBrandLogo={addBrandLogo}
            addElement={addElement}
            setBrandKit={setBrandKit}
          />
        )}
        {section === "colors" && (
          <ColorsSection
            brandKit={brandKit}
            addBrandColor={addBrandColor}
            setBrandKit={setBrandKit}
          />
        )}
        {section === "fonts" && (
          <FontsSection
            brandKit={brandKit}
            addBrandFont={addBrandFont}
            setBrandKit={setBrandKit}
          />
        )}
        {section === "icons" && (
          <IconsSection
            brandKit={brandKit}
            addBrandIcon={addBrandIcon}
            addElement={addElement}
            setBrandKit={setBrandKit}
          />
        )}
        {section === "templates" && (
          <TemplatesSection brandKit={brandKit} setBrandKit={setBrandKit} />
        )}
      </div>
    </div>
  );
}

function LogosSection({ brandKit, addBrandLogo, addElement, setBrandKit }) {
  const toast = useToast();

  const uploadLogo = (type) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*,.svg";
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        addBrandLogo({
          name: file.name.replace(/\.[^.]+$/, ""),
          src: ev.target.result,
          type,
          fileType: file.type,
        });
        toast("Logo uploaded!", "success");
      };
      reader.readAsDataURL(file);
    };
    input.click();
  };

  const addLogoToCanvas = (logo) => {
    addElement({
      type: "image",
      src: logo.src,
      x: 60,
      y: 60,
      width: 200,
      height: 80,
      rotation: 0,
      opacity: 1,
      imageId: logo.id,
      maintainAspectRatio: true,
    });
    toast("Logo added to canvas", "success");
  };

  const logos = brandKit?.logos || [];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        {[
          {
            type: "primary",
            label: "Primary Logo",
            hint: "Main brand logo",
          },
          {
            type: "secondary",
            label: "Secondary Logo",
            hint: "Alternative version",
          },
          {
            type: "icon",
            label: "Logo Mark / Icon",
            hint: "Icon or symbol only",
          },
        ].map((slot) => {
          const existing = logos.filter((l) => l.type === slot.type);
          return (
            <div key={slot.type}>
              <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                {slot.label}
              </p>
              {existing.length > 0 && (
                <div className="flex gap-2 flex-wrap mb-2">
                  {existing.map((logo) => (
                    <div
                      key={logo.id}
                      className="relative group w-20 h-14 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-center overflow-hidden cursor-pointer hover:border-purple-400"
                      onClick={() => addLogoToCanvas(logo)}
                      title={`Click to add "${logo.name}" to canvas`}
                    >
                      <img
                        src={logo.src}
                        alt={logo.name}
                        className="max-w-full max-h-full object-contain p-1"
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setBrandKit({
                            logos: logos.filter((l) => l.id !== logo.id),
                          });
                        }}
                        className="absolute top-0.5 right-0.5 w-4 h-4 bg-red-500 text-white rounded-full text-[9px] hidden group-hover:flex items-center justify-center"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <button
                onClick={() => uploadLogo(slot.type)}
                className="w-full py-2.5 border-2 border-dashed border-gray-300 rounded-xl text-xs text-gray-400 hover:border-purple-400 hover:text-purple-600 hover:bg-purple-50 transition-all flex items-center justify-center gap-2"
              >
                <Upload className="w-3.5 h-3.5" />
                Upload {slot.label}
              </button>
              <p className="text-[10px] text-gray-400 mt-0.5 pl-1">
                {slot.hint} · SVG, PNG, JPG
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ColorsSection({ brandKit, addBrandColor, setBrandKit }) {
  const toast = useToast();
  const [newColor, setNewColor] = useState("#7c3aed");
  const [newName, setNewName] = useState("");
  const colors = brandKit?.colors || [];

  const addColor = () => {
    if (!newColor) return;
    addBrandColor({
      hex: newColor,
      name: newName || newColor,
    });
    setNewName("");
    toast("Brand color added", "success");
  };

  const applyBrandColors = () => {
    if (colors.length < 2) {
      toast("Add at least 2 brand colors first", "error");
      return;
    }
    const store = useEditorStore.getState();
    const primary = colors[0]?.hex || "#7c3aed";
    const secondary = colors[1]?.hex || "#a78bfa";
    const bg =
      colors.find(
        (c) =>
          c.name?.toLowerCase().includes("background") ||
          c.name?.toLowerCase().includes("bg")
      )?.hex || "#ffffff";

    store._snapshot(true);
    const { pages, canvasSize } = store;
    store.setPages(
      pages.map((page) => ({
        ...page,
        elements: page.elements.map((el) => {
          if (el.type === "rect") {
            if (el.width >= canvasSize.width * 0.8) return { ...el, fill: bg };
            if (el.height < 100) return { ...el, fill: primary };
            return { ...el, fill: secondary };
          }
          if (el.type === "text") {
            if ((el.fontSize || 16) >= 32) return { ...el, fill: "#0f172a" };
            if ((el.fontSize || 16) >= 20) return { ...el, fill: primary };
            return { ...el, fill: "#64748b" };
          }
          if (el.type === "line") return { ...el, stroke: primary };
          return el;
        }),
      }))
    );
    store.setCanvasSize({ ...canvasSize, backgroundColor: bg });
    toast("Brand colors applied to all slides!", "success");
  };

  return (
    <div className="flex flex-col gap-4">
      {colors.length > 0 && (
        <div>
          <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Brand Colors ({colors.length})
          </p>
          <div className="flex flex-wrap gap-2">
            {colors.map((color) => (
              <div key={color.id} className="group relative">
                <div
                  className="w-10 h-10 rounded-xl shadow-sm cursor-pointer hover:scale-110 transition-transform border-2 border-transparent hover:border-white"
                  style={{ background: color.hex }}
                  title={`${color.name}: ${color.hex}`}
                  onClick={() => {
                    navigator.clipboard.writeText(color.hex);
                    toast(`Copied ${color.hex}`, "success");
                  }}
                />
                <span className="text-[9px] text-gray-400 text-center block mt-0.5 max-w-[40px] truncate">
                  {color.name}
                </span>
                <button
                  onClick={() =>
                    setBrandKit({
                      colors: colors.filter((c) => c.id !== color.id),
                    })
                  }
                  className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-[9px] hidden group-hover:flex items-center justify-center"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-2">
          Add Color
        </p>
        <div className="flex gap-2 items-center mb-2">
          <input
            type="color"
            value={newColor}
            onChange={(e) => setNewColor(e.target.value)}
            className="w-9 h-9 rounded-lg cursor-pointer border-0 flex-shrink-0"
          />
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Color name (e.g. Primary)"
            className="flex-1 text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-purple-400"
          />
          <button
            onClick={addColor}
            className="px-3 py-1.5 bg-purple-600 text-white text-xs rounded-lg hover:bg-purple-700 font-medium flex-shrink-0"
          >
            Add
          </button>
        </div>
        <p className="text-[10px] text-gray-400">
          Tip: Click a color to copy its hex value
        </p>
      </div>

      {colors.length >= 2 && (
        <button
          onClick={applyBrandColors}
          className="w-full py-2.5 bg-purple-600 text-white text-xs rounded-xl font-medium hover:bg-purple-700 flex items-center justify-center gap-2"
        >
          <Wand2 className="w-3.5 h-3.5" />
          Apply Brand Colors to All Slides
        </button>
      )}
    </div>
  );
}

function FontsSection({ brandKit, addBrandFont, setBrandKit }) {
  const toast = useToast();
  const fonts = brandKit?.fonts || [];

  const uploadFont = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".ttf,.otf,.woff,.woff2";
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (ev) => {
        const fontName = file.name
          .replace(/\.[^.]+$/, "")
          .replace(/[-_]/g, " ");
        const fontData = ev.target.result;
        const source =
          typeof fontData === "string" && fontData.startsWith("data:")
            ? `url(${fontData})`
            : fontData;

        const fontFace = new FontFace(fontName, source);
        fontFace
          .load()
          .then((loadedFace) => {
            document.fonts.add(loadedFace);
            addBrandFont({
              name: fontName,
              family: fontName,
              url: fontData,
              weight: "normal",
              style: "normal",
              isBrand: true,
            });
            toast(`Font "${fontName}" added to Brand Kit!`, "success");
          })
          .catch((err) => {
            toast(`Failed to load font: ${err.message}`, "error");
          });
      };
      reader.readAsDataURL(file);
    };
    input.click();
  };

  const applyBrandFonts = () => {
    if (fonts.length === 0) {
      toast("Upload at least one brand font first", "error");
      return;
    }
    const store = useEditorStore.getState();
    const headingFont = fonts[0].family;
    const bodyFont = (fonts[1] || fonts[0]).family;

    store._snapshot(true);
    store.setPages(
      store.pages.map((page) => ({
        ...page,
        elements: page.elements.map((el) => {
          if (el.type !== "text") return el;
          const isHeading = (el.fontSize || 16) >= 28;
          return {
            ...el,
            fontFamily: isHeading ? headingFont : bodyFont,
          };
        }),
      }))
    );
    toast("Brand fonts applied to all slides!", "success");
  };

  return (
    <div className="flex flex-col gap-4">
      {fonts.length > 0 && (
        <div>
          <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Brand Fonts
          </p>
          {fonts.map((font, i) => (
            <div
              key={font.id}
              className="flex items-center justify-between p-2.5 rounded-xl border border-gray-200 mb-2 group"
            >
              <div>
                <p
                  className="text-sm font-medium"
                  style={{ fontFamily: font.family }}
                >
                  {font.name}
                </p>
                <p className="text-[10px] text-gray-400">
                  {i === 0
                    ? "Heading font"
                    : i === 1
                    ? "Body font"
                    : "Additional font"}
                </p>
              </div>
              <button
                onClick={() =>
                  setBrandKit({
                    fonts: fonts.filter((f) => f.id !== font.id),
                  })
                }
                className="text-gray-300 hover:text-red-400 hidden group-hover:block"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={uploadFont}
        className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-xs text-gray-400 hover:border-purple-400 hover:text-purple-600 hover:bg-purple-50 transition-all flex items-center justify-center gap-2"
      >
        <Upload className="w-3.5 h-3.5" />
        Upload Brand Font
      </button>
      <p className="text-[10px] text-gray-400 -mt-2">
        TTF, OTF, WOFF, WOFF2 · First font = heading, second = body
      </p>

      {fonts.length > 0 && (
        <button
          onClick={applyBrandFonts}
          className="w-full py-2.5 bg-purple-600 text-white text-xs rounded-xl font-medium hover:bg-purple-700 flex items-center justify-center gap-2"
        >
          <Wand2 className="w-3.5 h-3.5" />
          Apply Brand Fonts to All Slides
        </button>
      )}
    </div>
  );
}

function IconsSection({ brandKit, addBrandIcon, addElement, setBrandKit }) {
  const toast = useToast();
  const brandIcons = brandKit?.brandIcons || [];

  const uploadIcon = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/svg+xml,image/png,image/jpeg";
    input.multiple = true;
    input.onchange = async (e) => {
      const files = Array.from(e.target.files);
      for (const file of files) {
        const reader = new FileReader();
        await new Promise((resolve) => {
          reader.onload = (ev) => {
            addBrandIcon({
              name: file.name.replace(/\.[^.]+$/, ""),
              src: ev.target.result,
              fileType: file.type,
            });
            resolve();
          };
          reader.readAsDataURL(file);
        });
      }
      toast(`${files.length} brand graphic(s) uploaded!`, "success");
    };
    input.click();
  };

  const addIconToCanvas = (icon) => {
    const isSvg = icon.fileType === "image/svg+xml";
    addElement({
      type: "image",
      src: icon.src,
      x: 80,
      y: 80,
      width: isSvg ? 80 : 120,
      height: isSvg ? 80 : 80,
      rotation: 0,
      opacity: 1,
      imageId: icon.id,
    });
    toast(`"${icon.name}" added to canvas`, "success");
  };

  return (
    <div className="flex flex-col gap-3">
      <button
        onClick={uploadIcon}
        className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-xs text-gray-400 hover:border-purple-400 hover:text-purple-600 hover:bg-purple-50 transition-all flex items-center justify-center gap-2"
      >
        <Upload className="w-3.5 h-3.5" />
        Upload Brand Icons & Graphics
      </button>
      <p className="text-[10px] text-gray-400 -mt-1">
        SVG, PNG, JPG · Multiple files supported
      </p>

      {brandIcons.length > 0 && (
        <div>
          <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Brand Graphics ({brandIcons.length})
          </p>
          <div className="grid grid-cols-3 gap-2">
            {brandIcons.map((icon) => (
              <div
                key={icon.id}
                className="relative group aspect-square bg-gray-50 rounded-xl border border-gray-200 hover:border-purple-400 cursor-pointer flex items-center justify-center overflow-hidden p-2"
                onClick={() => addIconToCanvas(icon)}
                title={`Click to add "${icon.name}" to canvas`}
              >
                <img
                  src={icon.src}
                  alt={icon.name}
                  className="max-w-full max-h-full object-contain"
                />
                <div className="absolute inset-0 bg-purple-600/0 group-hover:bg-purple-600/10 transition-colors rounded-xl flex items-center justify-center">
                  <Plus className="w-5 h-5 text-purple-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setBrandKit({
                      brandIcons: brandIcons.filter((i) => i.id !== icon.id),
                    });
                  }}
                  className="absolute top-0.5 right-0.5 w-4 h-4 bg-red-500 text-white rounded-full text-[9px] hidden group-hover:flex items-center justify-center"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-gray-400 mt-1.5">
            Click any graphic to add it to the canvas
          </p>
        </div>
      )}
    </div>
  );
}

function TemplatesSection({ brandKit, setBrandKit }) {
  const toast = useToast();
  const setPages = useEditorStore((s) => s.setPages);
  const setCurrentPageId = useEditorStore((s) => s.setCurrentPageId);
  const setCanvasSize = useEditorStore((s) => s.setCanvasSize);
  const clearSelection = useEditorStore((s) => s.clearSelection);

  const saveCurrentAsTemplate = () => {
    const store = useEditorStore.getState();
    setBrandKit({
      corporateTemplate: {
        name: `${brandKit?.name || "My Brand"} Template`,
        slides: JSON.parse(JSON.stringify(store.pages)),
        canvasSize: { ...store.canvasSize },
        savedAt: new Date().toISOString(),
      },
    });
    toast("Current slides saved as brand template!", "success");
  };

  const applyTemplate = () => {
    if (!brandKit?.corporateTemplate) return;
    const { slides, canvasSize } = brandKit.corporateTemplate;
    const newPages = slides.map((page) => ({
      ...page,
      id: uuidv4(),
      elements: page.elements.map((el) => ({ ...el, id: uuidv4() })),
    }));
    setPages(newPages);
    setCurrentPageId(newPages[0].id);
    setCanvasSize(canvasSize);
    clearSelection();
    toast("Brand template applied!", "success");
  };

  const addTemplateSlide = () => {
    if (!brandKit?.corporateTemplate) return;
    const store = useEditorStore.getState();
    const templateSlide = brandKit.corporateTemplate.slides[0];
    const newPage = {
      ...templateSlide,
      id: uuidv4(),
      name: `Slide ${store.pages.length + 1}`,
      elements: templateSlide.elements.map((el) => ({ ...el, id: uuidv4() })),
    };
    store.setPages([...store.pages, newPage]);
    store.setCurrentPageId(newPage.id);
    toast("Brand template slide added!", "success");
  };

  const applyFullBrandKit = () => {
    const store = useEditorStore.getState();
    const kit = brandKit || {};
    const colors = kit.colors || [];
    const fonts = kit.fonts || [];

    if (colors.length >= 2) {
      const primary = colors[0]?.hex;
      const bg =
        colors.find(
          (c) =>
            c.name?.toLowerCase().includes("bg") ||
            c.name?.toLowerCase().includes("background")
        )?.hex || "#ffffff";

      store._snapshot(true);
      store.setCanvasSize({
        ...store.canvasSize,
        backgroundColor: bg,
      });
      store.setPages(
        store.pages.map((page) => ({
          ...page,
          elements: page.elements.map((el) => {
            if (
              el.type === "rect" &&
              el.width >= store.canvasSize.width * 0.8
            )
              return { ...el, fill: bg };
            if (el.type === "rect" && el.height < 100)
              return { ...el, fill: primary };
            if (el.type === "text" && (el.fontSize || 16) >= 28)
              return { ...el, fill: "#0f172a" };
            if (el.type === "text") return { ...el, fill: "#64748b" };
            if (el.type === "line") return { ...el, stroke: primary };
            return el;
          }),
        }))
      );
    }

    if (fonts.length > 0) {
      const hFont = fonts[0].family;
      const bFont = (fonts[1] || fonts[0]).family;
      store.setPages(
        store.pages.map((page) => ({
          ...page,
          elements: page.elements.map((el) => {
            if (el.type !== "text") return el;
            return {
              ...el,
              fontFamily: (el.fontSize || 16) >= 28 ? hFont : bFont,
            };
          }),
        }))
      );
    }

    toast("Brand Kit applied across all slides!", "success");
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-2">
          Create Brand Template
        </p>
        <p className="text-xs text-gray-500 mb-3 leading-relaxed">
          Design your branded slide master — set background, add logo, define
          layout — then save it as your corporate template. It will be
          available across all new presentations.
        </p>
        <button
          onClick={saveCurrentAsTemplate}
          className="w-full py-2.5 border-2 border-dashed border-purple-300 text-purple-600 rounded-xl text-xs font-medium hover:bg-purple-50 hover:border-purple-500 transition-all flex items-center justify-center gap-2"
        >
          <Save className="w-3.5 h-3.5" />
          Save Current Slides as Brand Template
        </button>
      </div>

      {brandKit?.corporateTemplate && (
        <div>
          <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Saved Template
          </p>
          <div className="p-3 rounded-xl border border-purple-200 bg-purple-50">
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="text-xs font-semibold text-purple-800">
                  {brandKit.corporateTemplate.name}
                </p>
                <p className="text-[10px] text-purple-500">
                  {brandKit.corporateTemplate.slides.length} slides · Saved{" "}
                  {new Date(
                    brandKit.corporateTemplate.savedAt
                  ).toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={() => setBrandKit({ corporateTemplate: null })}
                className="text-purple-300 hover:text-red-400"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="flex gap-2">
              <button
                onClick={applyTemplate}
                className="flex-1 py-2 bg-purple-600 text-white text-xs rounded-lg font-medium hover:bg-purple-700"
              >
                Apply to New Deck
              </button>
              <button
                onClick={addTemplateSlide}
                className="flex-1 py-2 border border-purple-400 text-purple-600 text-xs rounded-lg font-medium hover:bg-purple-100"
              >
                Add Template Slide
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="border-t border-gray-100 pt-4">
        <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-2">
          One-Click Brand Apply
        </p>
        <p className="text-xs text-gray-500 mb-3 leading-relaxed">
          Apply ALL brand settings — colors, fonts — to every slide in your
          current presentation at once.
        </p>
        <button
          onClick={applyFullBrandKit}
          className="w-full py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white text-xs rounded-xl font-semibold hover:from-purple-700 hover:to-purple-800 transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-200"
        >
          <Wand2 className="w-4 h-4" />
          Apply Full Brand Kit to All Slides
        </button>
      </div>
    </div>
  );
}
