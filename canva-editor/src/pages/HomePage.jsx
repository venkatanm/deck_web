import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Clock,
  Presentation,
  Search,
  MoreHorizontal,
  Trash2,
  Edit3,
  Copy,
  LogOut,
  LayoutTemplate,
  Shield,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import useEditorStore from "../store/useEditorStore";
import { LAYOUT_DEFINITIONS } from "../data/layoutDefinitions";
import { v4 as uuidv4 } from "uuid";
import { logout } from "../api/auth";
import { useToast } from "../components/Toast";
import { track } from "../api/analytics";
import { VeloxDecksLogo } from "../components/brand/VeloxDecksLogo";

const STARTER_TEMPLATES = [
  {
    id: "blank",
    name: "Blank",
    description: "Start from scratch",
    isBlank: true,
  },
  {
    id: "business",
    name: "Business Pitch",
    description: "Investor-ready deck",
    tag: "Popular",
    bg: "#1a1040",
    accent: "#a78bfa",
    preview: "pitch",
  },
  {
    id: "corporate",
    name: "Corporate Report",
    description: "Clean data narrative",
    bg: "#0b1929",
    accent: "#38bdf8",
    preview: "report",
  },
  {
    id: "minimal",
    name: "Clean Minimal",
    description: "Elegant & focused",
    bg: "#ffffff",
    accent: "#1c1917",
    border: true,
    preview: "minimal",
  },
  {
    id: "strategy",
    name: "Strategy Deck",
    description: "Bold & impactful",
    bg: "#021a0e",
    accent: "#34d399",
    preview: "strategy",
  },
  {
    id: "data",
    name: "Data Report",
    description: "Stats & insights",
    bg: "#06001e",
    accent: "#06b6d4",
    preview: "data",
  },
];

function TemplatePreview({ tpl }) {
  if (tpl.isBlank) {
    return (
      <div className="w-full aspect-video rounded-lg border-2 border-dashed flex items-center justify-center group-hover:border-velox-cyan group-hover:bg-velox-cyan-dim transition-all duration-200" style={{ borderColor: "var(--border)" }}>
        <div className="flex flex-col items-center gap-1">
          <Plus size={20} className="group-hover:text-velox-cyan transition-colors" style={{ color: "var(--text-lo)" }} />
          <span className="text-[9px] font-semibold tracking-widest uppercase group-hover:text-velox-cyan transition-colors" style={{ color: "var(--text-lo)" }}>Blank</span>
        </div>
      </div>
    );
  }

  const { bg, accent: a, preview, border, tag } = tpl;

  return (
    <div
      className={`w-full aspect-video rounded-lg overflow-hidden relative transition-all duration-200 group-hover:shadow-xl group-hover:-translate-y-0.5`}
      style={{ background: bg, boxShadow: border ? "0 0 0 1px rgba(255,255,255,0.1)" : undefined }}
    >
      {preview === "pitch" && (
        <svg viewBox="0 0 160 90" className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid meet">
          <rect x="14" y="14" width="2.5" height="62" rx="1.25" fill={a} />
          <rect x="22" y="16" width="78" height="10" rx="2" fill="white" opacity="0.9" />
          <rect x="22" y="31" width="54" height="5" rx="1.5" fill="white" opacity="0.45" />
          <rect x="22" y="40" width="40" height="4" rx="1.5" fill="white" opacity="0.28" />
          <rect x="22" y="52" width="124" height="0.75" fill="white" opacity="0.12" />
          <rect x="22" y="58" width="36" height="20" rx="2.5" fill={a} opacity="0.25" />
          <rect x="64" y="58" width="36" height="20" rx="2.5" fill={a} opacity="0.35" />
          <rect x="106" y="58" width="36" height="20" rx="2.5" fill={a} opacity="0.25" />
          <rect x="27" y="63" width="22" height="5" rx="1" fill="white" opacity="0.7" />
          <rect x="27" y="71" width="14" height="3" rx="1" fill="white" opacity="0.35" />
          <rect x="69" y="63" width="22" height="5" rx="1" fill="white" opacity="0.7" />
          <rect x="69" y="71" width="14" height="3" rx="1" fill="white" opacity="0.35" />
          <rect x="111" y="63" width="22" height="5" rx="1" fill="white" opacity="0.7" />
          <rect x="111" y="71" width="14" height="3" rx="1" fill="white" opacity="0.35" />
        </svg>
      )}
      {preview === "report" && (
        <svg viewBox="0 0 160 90" className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid meet">
          <rect x="0" y="0" width="160" height="26" fill="white" opacity="0.06" />
          <rect x="12" y="8" width="56" height="8" rx="2" fill="white" opacity="0.85" />
          <rect x="12" y="19" width="38" height="4" rx="1" fill="white" opacity="0.4" />
          <rect x="16" y="75" width="132" height="1" fill="white" opacity="0.15" />
          <rect x="16" y="31" width="1" height="44" fill="white" opacity="0.15" />
          <rect x="22" y="50" width="14" height="26" rx="2" fill={a} opacity="0.6" />
          <rect x="42" y="40" width="14" height="36" rx="2" fill={a} opacity="0.8" />
          <rect x="62" y="57" width="14" height="19" rx="2" fill={a} opacity="0.55" />
          <rect x="82" y="44" width="14" height="32" rx="2" fill={a} opacity="0.75" />
          <rect x="102" y="35" width="14" height="41" rx="2" fill={a} />
          <rect x="122" y="48" width="14" height="28" rx="2" fill={a} opacity="0.65" />
        </svg>
      )}
      {preview === "minimal" && (
        <svg viewBox="0 0 160 90" className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid meet">
          <rect x="14" y="28" width="2" height="34" rx="1" fill={a} opacity="0.85" />
          <rect x="22" y="26" width="90" height="10" rx="2" fill={a} opacity="0.9" />
          <rect x="22" y="41" width="64" height="5" rx="1.5" fill={a} opacity="0.38" />
          <rect x="22" y="50" width="76" height="4" rx="1.5" fill={a} opacity="0.22" />
          <rect x="22" y="58" width="52" height="4" rx="1.5" fill={a} opacity="0.16" />
          <rect x="14" y="72" width="132" height="0.75" fill={a} opacity="0.15" />
        </svg>
      )}
      {preview === "strategy" && (
        <svg viewBox="0 0 160 90" className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid meet">
          <rect x="0" y="0" width="160" height="4" fill={a} />
          <rect x="14" y="14" width="96" height="11" rx="2" fill="white" opacity="0.88" />
          <rect x="14" y="30" width="66" height="5" rx="1.5" fill="white" opacity="0.38" />
          <rect x="14" y="44" width="40" height="34" rx="3" fill="white" opacity="0.07" />
          <rect x="60" y="44" width="40" height="34" rx="3" fill={a} opacity="0.22" />
          <rect x="106" y="44" width="40" height="34" rx="3" fill="white" opacity="0.07" />
          <rect x="19" y="50" width="28" height="4" rx="1" fill="white" opacity="0.5" />
          <rect x="65" y="50" width="28" height="4" rx="1" fill="white" opacity="0.7" />
          <rect x="111" y="50" width="28" height="4" rx="1" fill="white" opacity="0.5" />
        </svg>
      )}
      {preview === "data" && (
        <svg viewBox="0 0 160 90" className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid meet">
          <rect x="12" y="10" width="66" height="9" rx="2" fill="white" opacity="0.88" />
          <rect x="12" y="23" width="44" height="4" rx="1" fill="white" opacity="0.35" />
          <rect x="12" y="33" width="30" height="15" rx="2" fill="white" opacity="0.08" />
          <rect x="48" y="33" width="30" height="15" rx="2" fill={a} opacity="0.28" />
          <rect x="84" y="33" width="30" height="15" rx="2" fill="white" opacity="0.08" />
          <rect x="120" y="33" width="28" height="15" rx="2" fill="white" opacity="0.08" />
          <polyline points="12,80 30,68 50,73 70,58 90,63 110,51 130,55 148,46"
            stroke={a} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <polygon points="12,80 30,68 50,73 70,58 90,63 110,51 130,55 148,46 148,83 12,83"
            fill={a} opacity="0.18" />
        </svg>
      )}

      {tag && (
        <div className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded" style={{ background: "var(--cyan)", color: "var(--text-inv)" }}>
          <span className="text-[7px] font-bold tracking-widest uppercase">{tag}</span>
        </div>
      )}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded-lg" />
    </div>
  );
}

const CARD_PALETTES = [
  { bg: "#1a0f3c", accent: "#a78bfa" },
  { bg: "#0b1929", accent: "#38bdf8" },
  { bg: "#021a0e", accent: "#34d399" },
  { bg: "#1a0a00", accent: "#fb923c" },
  { bg: "#1a001a", accent: "#f472b6" },
  { bg: "#001a1a", accent: "#2dd4bf" },
];

const SLIDE_VARIANTS = [
  ({ a }) => (
    <>
      <rect x="0" y="0" width="5" height="90" fill={a} />
      <rect x="14" y="14" width="80" height="10" rx="2" fill="white" opacity="0.9" />
      <rect x="14" y="30" width="55" height="5" rx="1.5" fill="white" opacity="0.45" />
      <rect x="14" y="40" width="65" height="4" rx="1.5" fill="white" opacity="0.3" />
      <rect x="14" y="49" width="48" height="4" rx="1.5" fill="white" opacity="0.22" />
      <rect x="14" y="58" width="55" height="4" rx="1.5" fill="white" opacity="0.18" />
    </>
  ),
  ({ a }) => (
    <>
      <rect x="14" y="10" width="60" height="8" rx="2" fill="white" opacity="0.85" />
      <rect x="14" y="22" width="40" height="4" rx="1" fill="white" opacity="0.4" />
      <rect x="14" y="78" width="132" height="1" fill="white" opacity="0.15" />
      <rect x="20" y="52" width="16" height="27" rx="2" fill={a} opacity="0.7" />
      <rect x="42" y="42" width="16" height="37" rx="2" fill={a} />
      <rect x="64" y="58" width="16" height="21" rx="2" fill={a} opacity="0.6" />
      <rect x="86" y="46" width="16" height="33" rx="2" fill={a} opacity="0.85" />
      <rect x="108" y="36" width="16" height="43" rx="2" fill={a} />
      <rect x="130" y="50" width="16" height="29" rx="2" fill={a} opacity="0.7" />
    </>
  ),
  ({ a }) => (
    <>
      <rect x="0" y="0" width="160" height="4" fill={a} />
      <rect x="14" y="14" width="90" height="10" rx="2" fill="white" opacity="0.85" />
      <rect x="14" y="29" width="60" height="5" rx="1.5" fill="white" opacity="0.4" />
      <rect x="14" y="42" width="40" height="36" rx="3" fill="white" opacity="0.08" />
      <rect x="60" y="42" width="40" height="36" rx="3" fill={a} opacity="0.25" />
      <rect x="106" y="42" width="40" height="36" rx="3" fill="white" opacity="0.08" />
    </>
  ),
  ({ a }) => (
    <>
      <rect x="14" y="10" width="68" height="9" rx="2" fill="white" opacity="0.85" />
      <rect x="14" y="23" width="44" height="4" rx="1" fill="white" opacity="0.35" />
      <polyline points="14,80 30,68 50,72 70,57 90,62 110,50 130,54 146,44" stroke={a} strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <polygon points="14,80 30,68 50,72 70,57 90,62 110,50 130,54 146,44 146,83 14,83" fill={a} opacity="0.2" />
    </>
  ),
  ({ a }) => (
    <>
      <rect x="14" y="12" width="60" height="9" rx="2" fill="white" opacity="0.85" />
      <rect x="14" y="36" width="68" height="42" rx="3" fill="white" opacity="0.07" />
      <rect x="88" y="36" width="58" height="42" rx="3" fill={a} opacity="0.2" />
    </>
  ),
  ({ a }) => (
    <>
      <rect x="14" y="10" width="75" height="9" rx="2" fill="white" opacity="0.85" />
      <rect x="14" y="36" width="60" height="25" rx="3" fill={a} opacity="0.25" />
      <rect x="86" y="36" width="60" height="25" rx="3" fill="white" opacity="0.08" />
      <rect x="19" y="43" width="30" height="8" rx="1.5" fill="white" opacity="0.75" />
      <rect x="91" y="43" width="30" height="8" rx="1.5" fill="white" opacity="0.55" />
    </>
  ),
];

function MiniSlidePreview({ palette, variantIndex }) {
  const { bg, accent: a } = palette;
  const VariantContent = SLIDE_VARIANTS[variantIndex % SLIDE_VARIANTS.length];
  return (
    <svg viewBox="0 0 160 90" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
      <rect width="160" height="90" fill={bg} />
      <VariantContent a={a} />
    </svg>
  );
}

function ProjectCard({ project, onOpen, onDelete, onRename }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [nameVal, setNameVal] = useState(project.name);

  const handleRename = () => { setMenuOpen(false); setRenaming(true); };

  const commitRename = () => {
    setRenaming(false);
    if (nameVal.trim() && nameVal.trim() !== project.name) {
      onRename(project.id, nameVal.trim());
    } else {
      setNameVal(project.name);
    }
  };

  const updatedAt = project.updated_at
    ? (() => {
        const d = new Date(project.updated_at);
        const now = new Date();
        const isToday = d.toDateString() === now.toDateString();
        const isThisYear = d.getFullYear() === now.getFullYear();
        if (isToday) return "Today, " + d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
        if (isThisYear) return d.toLocaleDateString(undefined, { month: "short", day: "numeric" }) + ", " + d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
        return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
      })()
    : null;

  const idSum = (project.id || "").split("").reduce((s, c) => s + c.charCodeAt(0), 0);
  const palette = CARD_PALETTES[idSum % CARD_PALETTES.length];
  const variantIndex = Math.floor(idSum / CARD_PALETTES.length) % SLIDE_VARIANTS.length;

  return (
    <div
      className="group rounded-2xl overflow-hidden cursor-pointer flex flex-col transition-all duration-200"
      style={{ background: "var(--card)", border: "1px solid var(--border)" }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(45,212,240,0.3)"; e.currentTarget.style.boxShadow = "0 4px 24px rgba(0,0,0,0.4)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.boxShadow = ""; }}
      onClick={() => !menuOpen && !renaming && onOpen(project)}
    >
      {/* Thumbnail area */}
      <div className="relative aspect-video overflow-hidden" style={{ background: "var(--card2)" }}>
        {project.thumbnail_url ? (
          <img src={project.thumbnail_url} alt={project.name} className="w-full h-full object-cover" />
        ) : (
          <MiniSlidePreview palette={palette} variantIndex={variantIndex} />
        )}

        {project.slide_count > 0 && (
          <div className="absolute bottom-2 left-2 bg-black/50 backdrop-blur-sm text-white text-[9px] font-semibold px-1.5 py-0.5 rounded-md tracking-wide">
            {project.slide_count} slides
          </div>
        )}

        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-200 flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-all duration-200 scale-95 group-hover:scale-100 text-xs font-bold px-4 py-2 rounded-xl shadow-xl flex items-center gap-1.5" style={{ background: "var(--card)", color: "var(--text-hi)" }}>
            <Edit3 size={11} /> Open
          </div>
        </div>

        <div className="absolute top-2 right-2 z-10">
          <div className="relative">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setMenuOpen((v) => !v); }}
              className="p-1.5 rounded-lg shadow-md transition-colors"
              style={{ background: "rgba(8,12,20,0.85)", color: "var(--text-mid)" }}
            >
              <MoreHorizontal size={13} />
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={(e) => { e.stopPropagation(); setMenuOpen(false); }} />
                <div
                  className="absolute right-0 top-full mt-1 w-40 rounded-xl shadow-xl z-20 py-1"
                  style={{ background: "var(--card)", border: "1px solid var(--border)" }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {[
                    { label: "Open", icon: Edit3, onClick: () => { setMenuOpen(false); onOpen(project); }, danger: false },
                    { label: "Rename", icon: Copy, onClick: handleRename, danger: false },
                    null,
                    { label: "Delete", icon: Trash2, onClick: () => { setMenuOpen(false); onDelete(project.id); }, danger: true },
                  ].map((item, i) =>
                    item === null ? (
                      <div key={i} className="my-1 mx-2" style={{ borderTop: "1px solid var(--border)" }} />
                    ) : (
                      <button
                        key={item.label}
                        type="button"
                        onClick={item.onClick}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors"
                        style={{ color: item.danger ? "#f87171" : "var(--text-hi)" }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = item.danger ? "rgba(239,68,68,0.1)" : "var(--card2)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = ""; }}
                      >
                        <item.icon size={13} style={{ color: item.danger ? "#f87171" : "var(--text-lo)" }} />
                        {item.label}
                      </button>
                    )
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Info footer */}
      <div className="px-3 py-2.5 flex-1 flex flex-col justify-center" style={{ background: "var(--card)" }}>
        {renaming ? (
          <input
            autoFocus
            value={nameVal}
            onChange={(e) => setNameVal(e.target.value)}
            onBlur={commitRename}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitRename();
              if (e.key === "Escape") { setNameVal(project.name); setRenaming(false); }
            }}
            onClick={(e) => e.stopPropagation()}
            className="w-full text-sm font-semibold rounded-lg px-2 py-1 focus:outline-none"
            style={{ background: "var(--card2)", border: "1px solid var(--cyan)", color: "var(--text-hi)" }}
          />
        ) : (
          <p className="text-[13px] font-semibold truncate leading-snug" style={{ color: "var(--text-hi)" }}>{project.name}</p>
        )}
        {updatedAt && (
          <p className="text-[11px] mt-0.5 flex items-center gap-1" style={{ color: "var(--text-lo)" }}>
            <Clock size={10} /> {updatedAt}
          </p>
        )}
      </div>
    </div>
  );
}

export default function HomePage() {
  const navigate = useNavigate();
  const toast = useToast();
  const newDesign = useEditorStore((s) => s.newDesign);
  const loadProject = useEditorStore((s) => s.loadProject);
  const setPages = useEditorStore((s) => s.setPages);
  const setCanvasSize = useEditorStore((s) => s.setCanvasSize);

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  const fetchProjects = useCallback(async () => {
    try {
      const { listProjects } = await import("../api/projects");
      const list = await listProjects();
      setProjects(Array.isArray(list) ? list : []);
    } catch (e) {
      console.error("Failed to load projects", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
    import("../api/auth").then(({ getMe }) =>
      getMe()
        .then((me) => { setUserEmail(me.email || ""); setIsAdmin(!!me.is_admin); })
        .catch(() => {})
    );
  }, [fetchProjects]);

  const handleCreateNew = () => {
    newDesign();
    navigate("/editor");
  };

  const handleOpenProject = async (project) => {
    try {
      const { getProject } = await import("../api/projects");
      const full = await getProject(project.id);
      await loadProject(full);
      navigate("/editor");
    } catch {
      toast("Failed to open project", "error");
    }
  };

  const handleDeleteProject = async (id) => {
    try {
      const { deleteProject } = await import("../api/projects");
      await deleteProject(id);
      setProjects((prev) => prev.filter((p) => p.id !== id));
      track('project.deleted');
      toast("Project deleted", "success");
    } catch {
      toast("Failed to delete project", "error");
    }
  };

  const handleRenameProject = async (id, name) => {
    try {
      const { updateProject } = await import("../api/projects");
      await updateProject(id, { name });
      setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, name } : p)));
    } catch {
      toast("Failed to rename project", "error");
    }
  };

  const handleUseTemplate = (tpl) => {
    newDesign();

    if (!tpl.isBlank) {
      // Canvas size: standard PowerPoint 16:9 widescreen (1280×720)
      const canvasW = 1280;
      const canvasH = 720;
      setCanvasSize({ width: canvasW, height: canvasH, backgroundColor: tpl.bg ?? "#ffffff" });

      // Map template id → layout ids for each slide
      const TEMPLATE_LAYOUTS = {
        business: ["title-center", "title-bullets", "two-column", "big-number"],
        corporate: ["title-center", "title-bullets", "two-column", "image-right"],
        minimal:   ["title-center-centered", "title-bullets", "two-column"],
        strategy:  ["title-center", "big-number", "before-after", "title-bullets"],
        data:      ["title-center", "big-number", "two-column", "title-bullets"],
      };

      const layoutIds = TEMPLATE_LAYOUTS[tpl.id] ?? ["title-center", "title-bullets"];
      const layoutMap = Object.fromEntries(LAYOUT_DEFINITIONS.map((l) => [l.id, l]));
      const textColor = tpl.bg === "#ffffff" ? "#111111" : "#ffffff";
      const accentColor = tpl.accent ?? "#2DD4F0";

      const slides = layoutIds.map((lid) => {
        const layout = layoutMap[lid];
        const elements = layout
          ? layout.generate({ width: canvasW, height: canvasH }).map((el) => ({
              ...el,
              fill: el.type === "text" ? textColor : (el.fill === "#111111" ? accentColor : el.fill),
              stroke: el.stroke === "#111111" ? accentColor : el.stroke,
            }))
          : [];
        return { id: uuidv4(), elements, backgroundColor: tpl.bg ?? null };
      });

      setPages(slides);
    }

    navigate("/editor");
    toast(`Starting with ${tpl.name}`, "success");
  };

  const filtered = projects.filter((p) =>
    p.name?.toLowerCase().includes(search.toLowerCase())
  );

  const firstNameInitial = userEmail ? userEmail[0].toUpperCase() : "?";

  return (
    <div className="min-h-screen flex" style={{ background: "var(--bg)" }}>

      {/* ── Left Sidebar ──────────────────────────────────────────────── */}
      <aside className="w-56 flex-shrink-0 flex flex-col sticky top-0 h-screen" style={{ background: "var(--bg-deep)", borderRight: "1px solid var(--border)" }}>
        {/* Logo */}
        <div className="px-5 py-5" style={{ borderBottom: "1px solid var(--border)" }}>
          <VeloxDecksLogo size="sm" />
        </div>

        {/* New button */}
        <div className="px-4 py-4">
          <button
            type="button"
            onClick={handleCreateNew}
            className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-xl transition-all hover:opacity-90"
            style={{ background: "var(--cyan)", color: "var(--text-inv)" }}
          >
            <Plus size={16} /> New design
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-3 space-y-0.5">
          <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg" style={{ background: "var(--cyan-dim)", color: "var(--cyan)" }}>
            <LayoutTemplate size={15} />
            <span className="text-sm font-semibold">Home</span>
          </div>
          <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-default transition-colors" style={{ color: "var(--text-lo)" }}>
            <Clock size={15} />
            <span className="text-sm font-medium">Recent</span>
          </div>
          {isAdmin && (
            <button
              type="button"
              onClick={() => navigate("/admin")}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors"
              style={{ color: "var(--text-lo)" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "var(--card2)"; e.currentTarget.style.color = "var(--text-hi)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = ""; e.currentTarget.style.color = "var(--text-lo)"; }}
            >
              <Shield size={15} />
              <span className="text-sm font-medium">Admin</span>
            </button>
          )}
        </nav>

        {/* User footer */}
        <div className="px-4 py-4" style={{ borderTop: "1px solid var(--border)" }}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0" style={{ background: "var(--cyan-dim)", color: "var(--cyan)", border: "1px solid rgba(45,212,240,0.25)" }}>
              {firstNameInitial}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold truncate" style={{ color: "var(--text-hi)" }}>{userEmail || "Account"}</p>
            </div>
            <button type="button" onClick={logout} title="Sign out"
              className="p-1 rounded-md transition-colors flex-shrink-0"
              style={{ color: "var(--text-lo)" }}
              onMouseEnter={(e) => { e.currentTarget.style.color = "#f87171"; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-lo)"; }}
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main content ──────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Top bar */}
        <header className="h-14 flex items-center px-6 gap-4 flex-shrink-0 sticky top-0 z-20" style={{ background: "rgba(8,12,20,0.85)", backdropFilter: "blur(12px)", borderBottom: "1px solid var(--border)" }}>
          <h1 className="text-[15px] font-bold hidden sm:block" style={{ color: "var(--text-hi)" }}>Home</h1>
          <div className="flex-1 max-w-lg mx-auto">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--text-lo)" }} />
              <input
                type="text"
                placeholder="Search your projects…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-2 rounded-xl text-sm focus:outline-none transition-all panel-input"
              />
            </div>
          </div>
        </header>

        <main className="flex-1 px-8 py-8 overflow-auto">

          {/* ── AI Banner ──────────────────────────────────────────────── */}
          <section className="mb-10">
            <div className="rounded-2xl overflow-hidden relative" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              {/* Cyan glow */}
              <div className="absolute top-0 right-0 w-96 h-full opacity-20 pointer-events-none"
                style={{ background: "radial-gradient(ellipse at right, #2DD4F0 0%, transparent 65%)" }} />

              <div className="relative z-10 flex items-center gap-6 px-8 py-7">
                <div className="w-12 h-12 rounded-2xl flex-shrink-0 flex items-center justify-center shadow-xl" style={{ background: "var(--cyan-dim)", border: "1px solid rgba(45,212,240,0.3)" }}>
                  <Sparkles size={22} style={{ color: "var(--cyan)" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-base" style={{ color: "var(--text-hi)" }}>AI Slide Assistant</span>
                    <span className="text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-widest" style={{ color: "var(--cyan)", border: "1px solid rgba(45,212,240,0.3)", background: "var(--cyan-dim)" }}>Beta</span>
                  </div>
                  <p className="text-sm leading-relaxed max-w-lg" style={{ color: "var(--text-lo)" }}>
                    Paste reports, strategy docs, or raw notes — AI turns them into a polished slide deck.
                  </p>
                  <div className="flex gap-2 mt-2.5">
                    {["Smart structure", "Brand-aware", "Editable output"].map(f => (
                      <span key={f} className="text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ color: "var(--text-lo)", border: "1px solid var(--border)" }}>{f}</span>
                    ))}
                  </div>
                </div>
                <button type="button" onClick={handleCreateNew}
                  className="flex-shrink-0 flex items-center gap-2 px-5 py-2.5 text-sm font-bold rounded-xl transition-all hover:opacity-90"
                  style={{ background: "var(--cyan)", color: "var(--text-inv)" }}>
                  Try it <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </section>

          {/* ── Templates ──────────────────────────────────────────────── */}
          <section className="mb-10">
            <div className="flex items-center gap-2 mb-5">
              <h2 className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--text-lo)" }}>Start a new presentation</h2>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
              {STARTER_TEMPLATES.map((tpl) => (
                <button key={tpl.id} type="button"
                  onClick={tpl.isBlank ? handleCreateNew : () => handleUseTemplate(tpl)}
                  className="flex flex-col items-start gap-2 group text-left">
                  <TemplatePreview tpl={tpl} />
                  <div>
                    <span className="text-[11px] font-semibold block leading-tight transition-colors group-hover:text-velox-cyan" style={{ color: "var(--text-hi)" }}>{tpl.name}</span>
                    <p className="text-[10px] mt-0.5" style={{ color: "var(--text-lo)" }}>{tpl.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </section>

          {/* ── Recent Projects ────────────────────────────────────────── */}
          <section>
            <div className="flex items-center gap-2 mb-5">
              <h2 className="text-xs font-bold uppercase tracking-widest flex-1" style={{ color: "var(--text-lo)" }}>Recent projects</h2>
              {projects.length > 0 && (
                <span className="text-xs" style={{ color: "var(--text-lo)" }}>{projects.length} project{projects.length !== 1 ? "s" : ""}</span>
              )}
            </div>

            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="rounded-xl overflow-hidden animate-pulse" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                    <div className="aspect-video" style={{ background: "var(--card2)" }} />
                    <div className="px-3 py-2.5 space-y-1.5">
                      <div className="h-3 rounded w-3/4" style={{ background: "var(--card2)" }} />
                      <div className="h-2 rounded w-1/2" style={{ background: "var(--card2)" }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center rounded-2xl" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                {search ? (
                  <>
                    <Search size={32} className="mb-3" style={{ color: "var(--text-lo)" }} />
                    <p className="text-sm font-semibold" style={{ color: "var(--text-mid)" }}>No results for "{search}"</p>
                    <p className="text-xs mt-1" style={{ color: "var(--text-lo)" }}>Try a different search term</p>
                  </>
                ) : (
                  <>
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: "var(--cyan-dim)" }}>
                      <LayoutTemplate size={28} style={{ color: "var(--cyan)" }} />
                    </div>
                    <p className="text-sm font-semibold" style={{ color: "var(--text-hi)" }}>No presentations yet</p>
                    <p className="text-xs mt-1.5 mb-6 max-w-xs" style={{ color: "var(--text-lo)" }}>Pick a template above or start from a blank canvas to create your first deck.</p>
                    <button type="button" onClick={handleCreateNew}
                      className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold rounded-xl transition-opacity hover:opacity-90"
                      style={{ background: "var(--cyan)", color: "var(--text-inv)" }}>
                      <Plus size={15} /> New presentation
                    </button>
                  </>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
                {filtered.map((project) => (
                  <ProjectCard key={project.id} project={project}
                    onOpen={handleOpenProject} onDelete={handleDeleteProject} onRename={handleRenameProject} />
                ))}
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}
