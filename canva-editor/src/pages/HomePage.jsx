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
import { logout } from "../api/auth";
import { useToast } from "../components/Toast";

// Quick-start templates with richer gradient identities
const STARTER_TEMPLATES = [
  {
    id: "blank",
    name: "Blank",
    description: "Start from scratch",
    gradient: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)",
    accentColor: "#7c3aed",
    isBlank: true,
  },
  {
    id: "business",
    name: "Business Pitch",
    description: "Investor-ready deck",
    gradient: "linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4c1d95 100%)",
    accentColor: "#a78bfa",
    lines: ["#a78bfa", "#7c3aed", "#6d28d9"],
  },
  {
    id: "corporate",
    name: "Corporate Report",
    description: "Clean data narrative",
    gradient: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)",
    accentColor: "#38bdf8",
    lines: ["#38bdf8", "#0ea5e9", "#0284c7"],
  },
  {
    id: "minimal",
    name: "Clean Minimal",
    description: "Elegant & focused",
    gradient: "linear-gradient(135deg, #fafaf9 0%, #f5f5f4 100%)",
    accentColor: "#1c1917",
    lines: ["#1c1917", "#44403c", "#78716c"],
  },
  {
    id: "strategy",
    name: "Strategy Deck",
    description: "Bold & impactful",
    gradient: "linear-gradient(135deg, #064e3b 0%, #065f46 50%, #047857 100%)",
    accentColor: "#34d399",
    lines: ["#34d399", "#10b981", "#059669"],
  },
  {
    id: "data",
    name: "Data Report",
    description: "Stats & insights",
    gradient: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
    accentColor: "#06b6d4",
    lines: ["#06b6d4", "#0891b2", "#0e7490"],
  },
];

function TemplatePreview({ tpl }) {
  if (tpl.isBlank) {
    return (
      <div
        className="w-full aspect-video rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center group-hover:border-violet-400 group-hover:bg-violet-50/50 transition-all"
        style={{ background: tpl.gradient }}
      >
        <div className="flex flex-col items-center gap-1.5">
          <div className="w-8 h-8 rounded-full border-2 border-dashed border-gray-300 group-hover:border-violet-400 flex items-center justify-center transition-colors">
            <Plus size={16} className="text-gray-300 group-hover:text-violet-500 transition-colors" />
          </div>
          <span className="text-[10px] text-gray-400 group-hover:text-violet-500 font-medium transition-colors">Blank canvas</span>
        </div>
      </div>
    );
  }
  return (
    <div
      className="w-full aspect-video rounded-xl flex flex-col items-start justify-end p-3 border border-white/10 group-hover:ring-2 group-hover:ring-violet-400/60 transition-all overflow-hidden relative"
      style={{ background: tpl.gradient }}
    >
      {/* Slide content preview */}
      <div className="absolute inset-0 p-3 flex flex-col justify-center gap-1.5">
        <div className="w-3/4 h-2 rounded-full opacity-90" style={{ background: tpl.lines?.[0] }} />
        <div className="w-1/2 h-1.5 rounded-full opacity-60" style={{ background: tpl.lines?.[1] }} />
        <div className="w-2/5 h-1 rounded-full opacity-40" style={{ background: tpl.lines?.[2] }} />
      </div>
      {/* Subtle bottom label */}
      <div className="relative z-10 flex items-center gap-1 bg-black/20 backdrop-blur-sm px-2 py-1 rounded-lg self-stretch justify-between">
        <span className="text-[9px] text-white/70 font-medium">{tpl.description}</span>
        <ChevronRight size={10} className="text-white/50" />
      </div>
    </div>
  );
}

function ProjectCard({ project, onOpen, onDelete, onRename }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [nameVal, setNameVal] = useState(project.name);

  const handleRename = () => {
    setMenuOpen(false);
    setRenaming(true);
  };

  const commitRename = () => {
    setRenaming(false);
    if (nameVal.trim() && nameVal.trim() !== project.name) {
      onRename(project.id, nameVal.trim());
    } else {
      setNameVal(project.name);
    }
  };

  const updatedAt = project.updated_at
    ? new Date(project.updated_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
    : "Unknown date";

  // Pick a subtle gradient tint for thumbnail bg based on project id
  const bgTints = [
    "linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)",
    "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)",
    "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)",
    "linear-gradient(135deg, #fff7ed 0%, #fed7aa 100%)",
    "linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%)",
    "linear-gradient(135deg, #f0fdfa 0%, #ccfbf1 100%)",
  ];
  const tintIdx = project.id?.charCodeAt(0) % bgTints.length || 0;
  const thumbnailBg = project.thumbnail_bg
    ? undefined
    : bgTints[tintIdx];

  return (
    <div
      className="group bg-white border border-gray-200 rounded-2xl overflow-hidden hover:border-violet-300 hover:shadow-lg transition-all cursor-pointer"
      onClick={() => !menuOpen && !renaming && onOpen(project)}
    >
      {/* Thumbnail */}
      <div
        className="h-36 flex items-center justify-center relative"
        style={{ background: project.thumbnail_bg || undefined, backgroundImage: thumbnailBg }}
      >
        {project.thumbnail_url ? (
          <img src={project.thumbnail_url} alt={project.name} className="w-full h-full object-cover" />
        ) : (
          <Presentation size={32} className="text-gray-300 group-hover:text-violet-300 transition-colors" />
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-violet-600/0 group-hover:bg-violet-600/5 transition-colors" />

        {/* Options button */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="relative">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setMenuOpen((v) => !v); }}
              className="p-1.5 bg-white rounded-lg shadow-md hover:bg-gray-50 transition-colors"
            >
              <MoreHorizontal size={14} className="text-gray-600" />
            </button>
            {menuOpen && (
              <div
                className="absolute right-0 top-full mt-1 w-40 bg-white border border-gray-200 rounded-xl shadow-xl z-20 py-1"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={() => { setMenuOpen(false); onOpen(project); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <Edit3 size={13} /> Open
                </button>
                <button
                  type="button"
                  onClick={handleRename}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <Copy size={13} /> Rename
                </button>
                <div className="my-1 border-t border-gray-100" />
                <button
                  type="button"
                  onClick={() => { setMenuOpen(false); onDelete(project.id); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  <Trash2 size={13} /> Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="px-3 py-2.5 border-t border-gray-100">
        {renaming ? (
          <input
            autoFocus
            value={nameVal}
            onChange={(e) => setNameVal(e.target.value)}
            onBlur={commitRename}
            onKeyDown={(e) => { if (e.key === "Enter") commitRename(); if (e.key === "Escape") { setNameVal(project.name); setRenaming(false); } }}
            onClick={(e) => e.stopPropagation()}
            className="w-full text-sm font-medium border border-violet-400 rounded px-1 py-0.5 focus:outline-none"
          />
        ) : (
          <p className="text-sm font-semibold text-gray-800 truncate">{project.name}</p>
        )}
        <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
          <Clock size={10} /> {updatedAt}
        </p>
      </div>
    </div>
  );
}

export default function HomePage() {
  const navigate = useNavigate();
  const toast = useToast();
  const newDesign = useEditorStore((s) => s.newDesign);
  const loadProject = useEditorStore((s) => s.loadProject);

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
      await loadProject(project);
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
    navigate("/editor");
    toast(`Starting with ${tpl.name}`, "success");
  };

  const filtered = projects.filter((p) =>
    p.name?.toLowerCase().includes(search.toLowerCase())
  );

  const firstNameInitial = userEmail ? userEmail[0].toUpperCase() : "?";

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#f8f9fb" }}>
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header className="h-14 bg-white border-b border-gray-200 flex items-center px-6 gap-4 flex-shrink-0 shadow-sm">
        <div className="flex items-center gap-2.5">
          {/* Logo */}
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center shadow-sm"
            style={{ background: "linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)" }}
          >
            <span className="text-white font-black text-sm select-none">D</span>
          </div>
          <div>
            <span className="font-black text-gray-900 text-base tracking-tight">DeckWeb</span>
            <span className="ml-1.5 text-[10px] font-semibold text-violet-600 bg-violet-100 px-1.5 py-0.5 rounded-md uppercase tracking-wider">Enterprise</span>
          </div>
        </div>

        {/* Search */}
        <div className="flex-1 max-w-md mx-auto">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search your projects…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-gray-100 border border-transparent rounded-xl text-sm focus:outline-none focus:border-violet-400 focus:bg-white transition-colors placeholder:text-gray-400"
            />
          </div>
        </div>

        {/* Right nav */}
        <div className="flex items-center gap-2 ml-auto">
          {isAdmin && (
            <button
              type="button"
              onClick={() => navigate("/admin")}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-violet-700 bg-violet-100 hover:bg-violet-200 rounded-xl transition-colors"
            >
              <Shield size={13} /> Admin
            </button>
          )}
          {/* New button in header */}
          <button
            type="button"
            onClick={handleCreateNew}
            className="flex items-center gap-1.5 px-3 py-1.5 text-white text-sm font-semibold rounded-xl transition-opacity hover:opacity-90 shadow-sm"
            style={{ background: "linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)" }}
          >
            <Plus size={15} />
            New
          </button>
          {userEmail && (
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-sm"
              style={{ background: "linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)" }}
              title={userEmail}
            >
              {firstNameInitial}
            </div>
          )}
          <button
            type="button"
            onClick={logout}
            title="Sign out"
            className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-red-500 transition-colors"
          >
            <LogOut size={16} />
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-8">

        {/* ── Quick-start templates ─────────────────────────────────────── */}
        <section className="mb-10">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-1 h-5 rounded-full bg-gradient-to-b from-violet-500 to-indigo-500" />
            <h2 className="text-base font-bold text-gray-900">Start a new presentation</h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {STARTER_TEMPLATES.map((tpl) => (
              <button
                key={tpl.id}
                type="button"
                onClick={tpl.isBlank ? handleCreateNew : () => handleUseTemplate(tpl)}
                className="flex flex-col items-start gap-2 group text-left"
              >
                <TemplatePreview tpl={tpl} />
                <div>
                  <span className="text-xs font-semibold text-gray-700 group-hover:text-violet-700 transition-colors">{tpl.name}</span>
                  {tpl.description && (
                    <p className="text-[10px] text-gray-400 leading-tight">{tpl.description}</p>
                  )}
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* ── AI Highlight banner ──────────────────────────────────────── */}
        <section className="mb-10">
          <div
            className="rounded-2xl p-5 flex items-center gap-5 border border-teal-100 overflow-hidden relative"
            style={{ background: "linear-gradient(135deg, #f0fdfa 0%, #e0f2fe 100%)" }}
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center flex-shrink-0 shadow-sm">
              <Sparkles size={20} className="text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-gray-900">AI-powered slide generation</p>
              <p className="text-xs text-gray-500 mt-0.5">Describe your presentation and let AI build the first draft — then refine it in the editor.</p>
            </div>
            <button
              type="button"
              onClick={handleCreateNew}
              className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 text-white text-sm font-semibold rounded-xl transition-opacity hover:opacity-90 shadow-sm"
              style={{ background: "linear-gradient(135deg, #0d9488 0%, #0891b2 100%)" }}
            >
              Try it <ChevronRight size={14} />
            </button>
          </div>
        </section>

        {/* ── Recent projects ───────────────────────────────────────────── */}
        <section>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-1 h-5 rounded-full bg-gradient-to-b from-indigo-500 to-blue-500" />
            <h2 className="text-base font-bold text-gray-900 flex-1">Recent projects</h2>
            {projects.length > 0 && (
              <span className="text-xs text-gray-400 font-medium">{projects.length} project{projects.length !== 1 ? "s" : ""}</span>
            )}
          </div>

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="bg-white border border-gray-200 rounded-2xl overflow-hidden animate-pulse">
                  <div className="h-36 bg-gray-100" />
                  <div className="px-3 py-2.5 border-t border-gray-100">
                    <div className="h-3 bg-gray-100 rounded w-3/4 mb-1.5" />
                    <div className="h-2.5 bg-gray-100 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center bg-white rounded-2xl border border-gray-200">
              {search ? (
                <>
                  <Search size={32} className="text-gray-300 mb-3" />
                  <p className="text-sm font-semibold text-gray-600">No projects match "{search}"</p>
                  <p className="text-xs text-gray-400 mt-1">Try a different search term</p>
                </>
              ) : (
                <>
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 shadow-sm"
                    style={{ background: "linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)" }}
                  >
                    <LayoutTemplate size={24} className="text-violet-400" />
                  </div>
                  <p className="text-sm font-semibold text-gray-700">No presentations yet</p>
                  <p className="text-xs text-gray-400 mt-1 mb-4">Create your first deck to get started</p>
                  <button
                    type="button"
                    onClick={handleCreateNew}
                    className="flex items-center gap-2 px-4 py-2 text-white text-sm font-semibold rounded-xl transition-opacity hover:opacity-90 shadow-sm"
                    style={{ background: "linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)" }}
                  >
                    <Plus size={16} /> New presentation
                  </button>
                </>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {filtered.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onOpen={handleOpenProject}
                  onDelete={handleDeleteProject}
                  onRename={handleRenameProject}
                />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
