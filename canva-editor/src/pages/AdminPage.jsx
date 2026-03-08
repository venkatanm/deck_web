import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Upload, Users, Shield, Trash2, ChevronLeft,
  FileUp, Globe, Check, X,
  BarChart2, Activity, TrendingUp, Download, Wand2,
  MessageSquare, Star, ChevronDown, ChevronUp, Filter,
} from "lucide-react";
import { useToast } from "../components/Toast";
import { logout } from "../api/auth";
import { VeloxDecksLogo } from "../components/brand/VeloxDecksLogo";

export default function AdminPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [tab, setTab] = useState("analytics");

  useEffect(() => {
    import("../api/auth").then(({ getMe }) =>
      getMe()
        .then((me) => {
          if (!me.is_admin) {
            toast("Admin access required", "error");
            navigate("/home");
          }
        })
        .catch(() => navigate("/home"))
    );
  }, [navigate, toast]);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--bg)" }}>
      {/* Header */}
      <header className="h-14 flex items-center px-6 gap-4 flex-shrink-0" style={{ background: "var(--bg-deep)", borderBottom: "1px solid var(--border)" }}>
        <button
          type="button"
          onClick={() => navigate("/home")}
          className="flex items-center gap-1.5 text-sm transition-colors"
          style={{ color: "var(--text-lo)" }}
          onMouseEnter={(e) => { e.currentTarget.style.color = "var(--text-hi)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-lo)"; }}
        >
          <ChevronLeft size={16} /> Back
        </button>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "var(--cyan-dim)", border: "1px solid rgba(45,212,240,0.25)" }}>
            <Shield size={14} style={{ color: "var(--cyan)" }} />
          </div>
          <span className="font-semibold" style={{ color: "var(--text-hi)" }}>Admin Panel</span>
        </div>
        <div className="ml-auto">
          <button
            type="button"
            onClick={logout}
            className="text-xs transition-colors"
            style={{ color: "var(--text-lo)" }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "#f87171"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-lo)"; }}
          >
            Sign out
          </button>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar nav */}
        <nav className="w-52 py-4 flex flex-col gap-1 px-2 flex-shrink-0" style={{ background: "var(--bg-deep)", borderRight: "1px solid var(--border)" }}>
          {[
            { id: "analytics", label: "Analytics", icon: BarChart2 },
            { id: "feedback", label: "Feedback", icon: MessageSquare },
            { id: "templates", label: "Global Templates", icon: Globe },
            { id: "users", label: "User Management", icon: Users },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors"
              style={tab === id ? { background: "var(--cyan-dim)", color: "var(--cyan)" } : { color: "var(--text-lo)" }}
              onMouseEnter={(e) => { if (tab !== id) { e.currentTarget.style.background = "var(--card2)"; e.currentTarget.style.color = "var(--text-hi)"; }}}
              onMouseLeave={(e) => { if (tab !== id) { e.currentTarget.style.background = ""; e.currentTarget.style.color = "var(--text-lo)"; }}}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </nav>

        <main className="flex-1 p-8 overflow-y-auto">
          {tab === "analytics" && <AnalyticsTab />}
          {tab === "feedback" && <FeedbackTab toast={toast} />}
          {tab === "templates" && <GlobalTemplatesTab toast={toast} />}
          {tab === "users" && <UsersTab toast={toast} />}
        </main>
      </div>
    </div>
  );
}

// ── Feedback Tab ──────────────────────────────────────────────────────────────

const SENTIMENT_COLORS = {
  positive: { bg: "rgba(34,197,94,0.12)", color: "#4ade80", label: "Positive" },
  neutral:  { bg: "rgba(148,163,184,0.12)", color: "var(--text-mid)", label: "Neutral" },
  negative: { bg: "rgba(239,68,68,0.12)", color: "#f87171", label: "Negative" },
};

const TRIGGER_LABELS = {
  first_export:   "First Export",
  doc_to_deck:    "AI Doc→Deck",
  brand_kit_save: "Brand Kit",
  nps:            "NPS Survey",
};

function SentimentBadge({ sentiment }) {
  if (!sentiment) return null;
  const s = SENTIMENT_COLORS[sentiment] || SENTIMENT_COLORS.neutral;
  return (
    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
      style={{ background: s.bg, color: s.color }}>
      {s.label}
    </span>
  );
}

function RatingStars({ rating, max = 5 }) {
  if (!rating) return null;
  return (
    <span className="flex gap-px">
      {Array.from({ length: max }, (_, i) => (
        <span key={i} className="text-xs" style={{ color: i < rating ? "var(--cyan)" : "var(--border)" }}>★</span>
      ))}
    </span>
  );
}

function FeedbackRow({ entry, onUpdate }) {
  const [expanded, setExpanded] = useState(false);
  const [note, setNote] = useState(entry.admin_note || "");
  const [saving, setSaving] = useState(false);

  const handleToggleRead = async () => {
    try {
      const { updateFeedbackEntry } = await import("../api/feedback");
      const updated = await updateFeedbackEntry(entry.id, { is_read: !entry.is_read });
      onUpdate(updated);
    } catch {}
  };

  const handleArchive = async () => {
    try {
      const { updateFeedbackEntry } = await import("../api/feedback");
      const updated = await updateFeedbackEntry(entry.id, { is_archived: !entry.is_archived });
      onUpdate(updated);
    } catch {}
  };

  const handleSaveNote = async () => {
    setSaving(true);
    try {
      const { updateFeedbackEntry } = await import("../api/feedback");
      const updated = await updateFeedbackEntry(entry.id, { admin_note: note });
      onUpdate(updated);
    } catch {} finally {
      setSaving(false);
    }
  };

  const borderStyle = !entry.is_read
    ? { borderLeft: "3px solid var(--cyan)" }
    : { borderLeft: "3px solid transparent" };

  return (
    <li style={{ ...borderStyle, borderTop: "1px solid var(--border)", opacity: entry.is_archived ? 0.5 : 1 }}>
      <div className="flex items-start gap-3 px-4 py-3">
        {/* Type icon */}
        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
          style={{ background: entry.type === "survey" ? "var(--cyan-dim)" : "var(--card2)" }}>
          {entry.type === "survey"
            ? <Star size={13} style={{ color: "var(--cyan)" }} />
            : <MessageSquare size={13} style={{ color: "var(--text-mid)" }} />}
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center flex-wrap gap-2 mb-1">
            <SentimentBadge sentiment={entry.sentiment} />
            {entry.survey_trigger && (
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                style={{ background: "var(--card2)", color: "var(--text-lo)" }}>
                {TRIGGER_LABELS[entry.survey_trigger] || entry.survey_trigger}
              </span>
            )}
            {entry.rating != null && <RatingStars rating={entry.rating} />}
            <span className="text-[10px] ml-auto flex-shrink-0" style={{ color: "var(--text-lo)" }}>
              {new Date(entry.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>

          <p className="text-sm" style={{ color: "var(--text-hi)" }}>{entry.primary_answer}</p>
          {entry.follow_up_text && (
            <p className="text-xs mt-1" style={{ color: "var(--text-mid)" }}>Follow-up: {entry.follow_up_text}</p>
          )}
          <p className="text-xs mt-0.5" style={{ color: "var(--text-lo)" }}>{entry.user_email}</p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <button type="button" onClick={() => setExpanded(v => !v)}
            className="p-1.5 rounded-lg transition-colors text-xs"
            style={{ color: "var(--text-lo)" }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "var(--text-hi)"; e.currentTarget.style.background = "var(--card2)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-lo)"; e.currentTarget.style.background = ""; }}
            title={expanded ? "Collapse" : "Expand"}>
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          <button type="button" onClick={handleToggleRead}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: entry.is_read ? "var(--text-lo)" : "var(--cyan)" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--card2)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = ""; }}
            title={entry.is_read ? "Mark unread" : "Mark read"}>
            <Check size={14} />
          </button>
          <button type="button" onClick={handleArchive}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: "var(--text-lo)" }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "#f87171"; e.currentTarget.style.background = "rgba(239,68,68,0.08)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-lo)"; e.currentTarget.style.background = ""; }}
            title={entry.is_archived ? "Unarchive" : "Archive"}>
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Expanded admin note */}
      {expanded && (
        <div className="px-4 pb-3 pl-14" style={{ borderTop: "1px solid var(--border)" }}>
          <p className="text-[10px] uppercase font-semibold mt-2 mb-1" style={{ color: "var(--text-lo)" }}>Admin note</p>
          <textarea
            rows={2}
            className="panel-input resize-none text-xs w-full"
            placeholder="Add a private note…"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <button type="button" onClick={handleSaveNote} disabled={saving}
            className="mt-1 text-xs font-medium px-3 py-1 rounded-lg disabled:opacity-50 transition-opacity hover:opacity-90"
            style={{ background: "var(--cyan)", color: "var(--text-inv)" }}>
            {saving ? "Saving…" : "Save note"}
          </button>
        </div>
      )}
    </li>
  );
}

function FeedbackTab({ toast }) {
  const [stats, setStats] = useState(null);
  const [entries, setEntries] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;

  // Filters
  const [filterType, setFilterType] = useState("");
  const [filterSentiment, setFilterSentiment] = useState("");
  const [filterRead, setFilterRead] = useState("");
  const [search, setSearch] = useState("");
  const [showArchived, setShowArchived] = useState(false);

  const fetchStats = async () => {
    try {
      const { getFeedbackStats } = await import("../api/feedback");
      setStats(await getFeedbackStats(30));
    } catch {}
  };

  const fetchEntries = async (pg = 1) => {
    setLoading(true);
    try {
      const { getFeedbackList } = await import("../api/feedback");
      const params = { page: pg, page_size: PAGE_SIZE };
      if (filterType) params.type = filterType;
      if (filterSentiment) params.sentiment = filterSentiment;
      if (filterRead === "unread") params.is_read = false;
      if (filterRead === "read") params.is_read = true;
      if (showArchived) params.is_archived = true;
      if (search.trim()) params.search = search.trim();
      const res = await getFeedbackList(params);
      setEntries(res.items || []);
      setTotal(res.total || 0);
      setPage(pg);
    } catch {
      toast("Failed to load feedback", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStats(); }, []);
  useEffect(() => { fetchEntries(1); }, [filterType, filterSentiment, filterRead, showArchived]);

  const handleSearch = (e) => {
    if (e.key === "Enter") fetchEntries(1);
  };

  const handleUpdate = (updated) => {
    setEntries(prev => prev.map(e => e.id === updated.id ? updated : e));
    fetchStats();
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const npsColor = stats?.nps_score != null
    ? stats.nps_score >= 50 ? "#4ade80" : stats.nps_score >= 0 ? "var(--cyan)" : "#f87171"
    : "var(--text-hi)";

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h1 className="text-xl font-bold mb-1" style={{ color: "var(--text-hi)" }}>Feedback</h1>
        <p className="text-sm" style={{ color: "var(--text-lo)" }}>User surveys and free-text feedback from the last 30 days.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Responses" value={stats?.total ?? "—"} icon={MessageSquare} />
        <StatCard label="Unread" value={stats?.unread ?? "—"} sub="Needs review" icon={Activity} accent={stats?.unread > 0} />
        <StatCard
          label="NPS Score"
          value={stats?.nps_score != null ? stats.nps_score : "—"}
          sub="Promoters − Detractors"
          icon={TrendingUp}
        />
        <StatCard
          label="Avg Export Rating"
          value={stats?.avg_rating_by_trigger?.first_export != null
            ? `${Number(stats.avg_rating_by_trigger.first_export).toFixed(1)} / 5`
            : "—"}
          sub="first_export survey"
          icon={Star}
        />
      </div>

      {/* Sparkline chart */}
      {stats?.daily_volume?.length > 0 && (
        <div className="rounded-2xl p-5" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <p className="text-sm font-semibold mb-1" style={{ color: "var(--text-hi)" }}>Response Volume (14d)</p>
          <SparkLine data={stats.daily_volume} valueKey="count" />
          <div className="flex justify-between text-[10px] mt-1" style={{ color: "var(--text-lo)" }}>
            <span>{stats.daily_volume[0]?.date}</span>
            <span>{stats.daily_volume[stats.daily_volume.length - 1]?.date}</span>
          </div>
        </div>
      )}

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1.5 text-xs" style={{ color: "var(--text-lo)" }}>
          <Filter size={13} /> Filters:
        </div>
        {[
          { label: "All types", value: "", setter: setFilterType, current: filterType },
          { label: "Survey", value: "survey", setter: setFilterType, current: filterType },
          { label: "Button", value: "button", setter: setFilterType, current: filterType },
        ].map(({ label, value, setter, current }) => (
          <button key={label} type="button" onClick={() => { setter(value); }}
            className="text-xs px-3 py-1 rounded-full transition-colors"
            style={current === value
              ? { background: "var(--cyan-dim)", color: "var(--cyan)", border: "1px solid rgba(45,212,240,0.3)" }
              : { background: "var(--card2)", color: "var(--text-lo)", border: "1px solid var(--border)" }}>
            {label}
          </button>
        ))}
        <div className="w-px h-4 flex-shrink-0" style={{ background: "var(--border)" }} />
        {[
          { label: "Any sentiment", value: "" },
          { label: "Positive", value: "positive" },
          { label: "Neutral", value: "neutral" },
          { label: "Negative", value: "negative" },
        ].map(({ label, value }) => (
          <button key={label} type="button" onClick={() => setFilterSentiment(value)}
            className="text-xs px-3 py-1 rounded-full transition-colors"
            style={filterSentiment === value
              ? { background: "var(--cyan-dim)", color: "var(--cyan)", border: "1px solid rgba(45,212,240,0.3)" }
              : { background: "var(--card2)", color: "var(--text-lo)", border: "1px solid var(--border)" }}>
            {label}
          </button>
        ))}
        <div className="w-px h-4 flex-shrink-0" style={{ background: "var(--border)" }} />
        <button type="button" onClick={() => setFilterRead(v => v === "unread" ? "" : "unread")}
          className="text-xs px-3 py-1 rounded-full transition-colors"
          style={filterRead === "unread"
            ? { background: "var(--cyan-dim)", color: "var(--cyan)", border: "1px solid rgba(45,212,240,0.3)" }
            : { background: "var(--card2)", color: "var(--text-lo)", border: "1px solid var(--border)" }}>
          Unread only
        </button>
        <button type="button" onClick={() => setShowArchived(v => !v)}
          className="text-xs px-3 py-1 rounded-full transition-colors"
          style={showArchived
            ? { background: "var(--cyan-dim)", color: "var(--cyan)", border: "1px solid rgba(45,212,240,0.3)" }
            : { background: "var(--card2)", color: "var(--text-lo)", border: "1px solid var(--border)" }}>
          Show archived
        </button>
        <input
          type="text"
          placeholder="Search…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={handleSearch}
          className="panel-input text-xs ml-auto"
          style={{ width: 180 }}
        />
      </div>

      {/* Feedback list */}
      <div className="rounded-2xl overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
        <div className="px-5 py-3 flex items-center justify-between" style={{ borderBottom: "1px solid var(--border)" }}>
          <span className="text-sm font-semibold" style={{ color: "var(--text-hi)" }}>
            {total} {total === 1 ? "response" : "responses"}
          </span>
          {total > PAGE_SIZE && (
            <span className="text-xs" style={{ color: "var(--text-lo)" }}>Page {page} of {totalPages}</span>
          )}
        </div>

        {loading ? (
          <div className="py-12 text-center text-sm" style={{ color: "var(--text-lo)" }}>Loading…</div>
        ) : entries.length === 0 ? (
          <div className="py-12 text-center">
            <MessageSquare size={28} className="mx-auto mb-2" style={{ color: "var(--text-lo)" }} />
            <p className="text-sm" style={{ color: "var(--text-lo)" }}>No feedback yet.</p>
          </div>
        ) : (
          <ul>
            {entries.map(entry => (
              <FeedbackRow key={entry.id} entry={entry} onUpdate={handleUpdate} />
            ))}
          </ul>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 px-5 py-3" style={{ borderTop: "1px solid var(--border)" }}>
            <button type="button" disabled={page <= 1} onClick={() => fetchEntries(page - 1)}
              className="text-xs px-3 py-1.5 rounded-lg disabled:opacity-40 transition-colors"
              style={{ background: "var(--card2)", color: "var(--text-mid)" }}>
              ← Prev
            </button>
            <span className="text-xs" style={{ color: "var(--text-lo)" }}>{page} / {totalPages}</span>
            <button type="button" disabled={page >= totalPages} onClick={() => fetchEntries(page + 1)}
              className="text-xs px-3 py-1.5 rounded-lg disabled:opacity-40 transition-colors"
              style={{ background: "var(--card2)", color: "var(--text-mid)" }}>
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Global Templates Tab ─────────────────────────────────────────────────────
function GlobalTemplatesTab({ toast }) {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const [templateName, setTemplateName] = useState("");
  const [category, setCategory] = useState("Business");

  const CATEGORIES = ["Business", "Technology", "Education", "Creative", "Marketing", "General"];

  const fetchTemplates = async () => {
    try {
      const { listTemplates } = await import("../api/templates");
      const all = await listTemplates();
      setTemplates((all || []).filter((t) => t.is_global));
    } catch {
      toast("Failed to load templates", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTemplates(); }, []);

  const handleUpload = async (file) => {
    if (!file) return;
    if (!file.name.endsWith(".pptx")) {
      toast("Only .pptx files are supported", "error");
      return;
    }
    setUploading(true);
    try {
      const { uploadPptxTemplate } = await import("../api/templates");
      const result = await uploadPptxTemplate(file, templateName || "", true);
      toast(`"${result.name}" added to global library`, "success");
      setTemplateName("");
      fetchTemplates();
    } catch (e) {
      toast(e.message || "Upload failed", "error");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}" from the global library?`)) return;
    try {
      const { deleteTemplate } = await import("../api/templates");
      await deleteTemplate(id);
      setTemplates((prev) => prev.filter((t) => t.id !== id));
      toast("Template deleted", "success");
    } catch {
      toast("Failed to delete", "error");
    }
  };

  return (
    <div className="max-w-3xl">
      <h1 className="text-xl font-bold mb-1" style={{ color: "var(--text-hi)" }}>Global Templates</h1>
      <p className="text-sm mb-6" style={{ color: "var(--text-lo)" }}>
        Templates uploaded here are available to all users.
      </p>

      <div className="rounded-2xl p-6 mb-6" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
        <h2 className="text-sm font-semibold mb-4" style={{ color: "var(--text-hi)" }}>Upload PPTX Template</h2>
        <div className="flex gap-3 mb-3">
          <input
            type="text"
            placeholder="Template name (optional)"
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            className="flex-1 panel-input"
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="panel-input"
            style={{ width: "auto" }}
          >
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="flex items-center justify-center gap-2 w-full py-3 border-2 border-dashed rounded-xl text-sm font-medium transition-all disabled:opacity-50"
          style={{ borderColor: "var(--border)", color: "var(--text-lo)" }}
          onMouseEnter={(e) => { if (!uploading) { e.currentTarget.style.borderColor = "var(--cyan)"; e.currentTarget.style.color = "var(--cyan)"; e.currentTarget.style.background = "var(--cyan-dim)"; }}}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text-lo)"; e.currentTarget.style.background = ""; }}
        >
          {uploading ? (
            <><span className="animate-spin">⟳</span> Importing…</>
          ) : (
            <><FileUp size={16} /> Click to select .pptx file</>
          )}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pptx"
          className="hidden"
          onChange={(e) => { handleUpload(e.target.files?.[0]); e.target.value = ""; }}
        />
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
        <div className="px-5 py-3 flex items-center justify-between" style={{ borderBottom: "1px solid var(--border)" }}>
          <span className="text-sm font-semibold" style={{ color: "var(--text-hi)" }}>
            Global Library ({templates.length})
          </span>
        </div>
        {loading ? (
          <div className="p-6 text-center text-sm" style={{ color: "var(--text-lo)" }}>Loading…</div>
        ) : templates.length === 0 ? (
          <div className="p-8 text-center">
            <Globe size={28} className="mx-auto mb-2" style={{ color: "var(--text-lo)" }} />
            <p className="text-sm" style={{ color: "var(--text-lo)" }}>No global templates yet.</p>
          </div>
        ) : (
          <ul>
            {templates.map((t, i) => (
              <li key={t.id} className="flex items-center gap-4 px-5 py-3" style={{ borderTop: i > 0 ? "1px solid var(--border)" : undefined }}>
                <div className="w-14 h-10 rounded-lg flex-shrink-0" style={{ background: t.thumbnail?.bg || "var(--card2)", border: "1px solid var(--border)" }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: "var(--text-hi)" }}>{t.name}</p>
                  <p className="text-xs" style={{ color: "var(--text-lo)" }}>{t.category} · {t.slides?.length || 0} slides</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(t.id, t.name)}
                  className="p-2 rounded-lg transition-colors"
                  style={{ color: "var(--text-lo)" }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = "#f87171"; e.currentTarget.style.background = "rgba(239,68,68,0.1)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-lo)"; e.currentTarget.style.background = ""; }}
                >
                  <Trash2 size={15} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

// ── Users Tab ────────────────────────────────────────────────────────────────
function UsersTab({ toast }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [promoteEmail, setPromoteEmail] = useState("");
  const [promoting, setPromoting] = useState(false);

  const fetchUsers = async () => {
    try {
      const { listAdminUsers } = await import("../api/templates");
      setUsers(await listAdminUsers());
    } catch {
      toast("Failed to load users", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handlePromote = async () => {
    if (!promoteEmail.trim()) return;
    setPromoting(true);
    try {
      const { promoteToAdmin } = await import("../api/templates");
      await promoteToAdmin(promoteEmail.trim());
      toast(`${promoteEmail} is now an admin`, "success");
      setPromoteEmail("");
      fetchUsers();
    } catch (e) {
      toast(e.message || "Failed to promote", "error");
    } finally {
      setPromoting(false);
    }
  };

  return (
    <div className="max-w-3xl">
      <h1 className="text-xl font-bold mb-1" style={{ color: "var(--text-hi)" }}>User Management</h1>
      <p className="text-sm mb-6" style={{ color: "var(--text-lo)" }}>View all users and grant admin privileges.</p>

      <div className="rounded-2xl p-6 mb-6" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
        <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--text-hi)" }}>Grant Admin Access</h2>
        <div className="flex gap-3">
          <input
            type="email"
            placeholder="user@example.com"
            value={promoteEmail}
            onChange={(e) => setPromoteEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handlePromote()}
            className="flex-1 panel-input"
          />
          <button
            type="button"
            onClick={handlePromote}
            disabled={promoting || !promoteEmail.trim()}
            className="px-4 py-2 disabled:opacity-50 text-sm font-medium rounded-xl transition-opacity hover:opacity-90"
            style={{ background: "var(--cyan)", color: "var(--text-inv)" }}
          >
            {promoting ? "Granting…" : "Grant Admin"}
          </button>
        </div>
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
        <div className="px-5 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
          <span className="text-sm font-semibold" style={{ color: "var(--text-hi)" }}>All Users ({users.length})</span>
        </div>
        {loading ? (
          <div className="p-6 text-center text-sm" style={{ color: "var(--text-lo)" }}>Loading…</div>
        ) : (
          <ul>
            {users.map((u, i) => (
              <li key={u.id} className="flex items-center gap-3 px-5 py-3" style={{ borderTop: i > 0 ? "1px solid var(--border)" : undefined }}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center font-semibold text-xs flex-shrink-0" style={{ background: "var(--cyan-dim)", color: "var(--cyan)" }}>
                  {u.email[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: "var(--text-hi)" }}>{u.email}</p>
                  <p className="text-xs" style={{ color: "var(--text-lo)" }}>
                    Joined {new Date(u.created_at).toLocaleDateString()}
                  </p>
                </div>
                {u.is_admin && (
                  <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: "var(--cyan-dim)", color: "var(--cyan)", border: "1px solid rgba(45,212,240,0.25)" }}>
                    <Shield size={11} /> Admin
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

// ── Analytics Tab ─────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, icon: Icon, accent = false }) {
  return (
    <div className="rounded-2xl p-5 flex items-start gap-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: accent ? "var(--cyan)" : "var(--cyan-dim)", color: accent ? "var(--text-inv)" : "var(--cyan)" }}>
        <Icon size={18} />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--text-lo)" }}>{label}</p>
        <p className="text-2xl font-bold mt-0.5" style={{ color: "var(--text-hi)" }}>{value ?? "—"}</p>
        {sub && <p className="text-xs mt-0.5" style={{ color: "var(--text-lo)" }}>{sub}</p>}
      </div>
    </div>
  );
}

function MiniBar({ label, count, max }) {
  const pct = max > 0 ? Math.round((count / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs w-40 truncate flex-shrink-0" style={{ color: "var(--text-mid)" }}>{label}</span>
      <div className="flex-1 rounded-full h-2" style={{ background: "var(--card2)" }}>
        <div className="h-2 rounded-full transition-all" style={{ width: `${pct}%`, background: "var(--cyan)" }} />
      </div>
      <span className="text-xs font-semibold w-8 text-right flex-shrink-0" style={{ color: "var(--text-hi)" }}>{count}</span>
    </div>
  );
}

function SparkLine({ data, valueKey, color = "#2DD4F0" }) {
  if (!data?.length) return <div className="h-16 flex items-center justify-center text-xs" style={{ color: "var(--text-lo)" }}>No data yet</div>;
  const vals = data.map(d => d[valueKey]);
  const max = Math.max(...vals, 1);
  const W = 280, H = 52;
  const pts = vals.map((v, i) => {
    const x = (i / Math.max(vals.length - 1, 1)) * W;
    const y = H - (v / max) * H;
    return `${x},${y}`;
  }).join(" ");
  const area = `0,${H} ${pts} ${W},${H}`;
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="w-full" style={{ height: 52 }}>
      <polygon points={area} fill={color} opacity="0.15" />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function AnalyticsTab() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    import("../api/analytics").then(({ getAnalyticsStats }) =>
      getAnalyticsStats()
        .then(setStats)
        .catch((e) => setError(e.message))
        .finally(() => setLoading(false))
    );
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center py-32">
      <div className="flex flex-col items-center gap-3" style={{ color: "var(--text-lo)" }}>
        <Activity size={28} className="animate-pulse" style={{ color: "var(--cyan)" }} />
        <span className="text-sm">Loading analytics…</span>
      </div>
    </div>
  );

  if (error) return (
    <div className="flex items-center justify-center py-32">
      <div className="text-center">
        <p className="text-sm font-semibold mb-1" style={{ color: "#f87171" }}>Failed to load analytics</p>
        <p className="text-xs" style={{ color: "var(--text-lo)" }}>{error}</p>
      </div>
    </div>
  );

  const { users, projects, saves, ai, downloads, event_counts, dau_chart, events_chart, top_users } = stats;

  const maxEvent = event_counts?.[0]?.count || 1;
  const maxDownload = Math.max(...(downloads?.map(d => d.count) || [1]), 1);

  return (
    <div className="max-w-5xl space-y-8">
      <div>
        <h1 className="text-xl font-bold mb-1" style={{ color: "var(--text-hi)" }}>Analytics Dashboard</h1>
        <p className="text-sm" style={{ color: "var(--text-lo)" }}>Last 30 days unless noted. Data updates on page load.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Users" value={users.total} sub={`+${users.new_7d} this week`} icon={Users} />
        <StatCard label="DAU" value={users.dau} sub={`WAU ${users.wau} · MAU ${users.mau}`} icon={Activity} accent />
        <StatCard label="Total Decks" value={projects.total} sub={`+${projects.created_7d} this week`} icon={BarChart2} />
        <StatCard label="Save Rate (7d)" value={saves.success_rate != null ? `${saves.success_rate}%` : "—"} sub={`${saves.ok_7d} ok · ${saves.failed_7d} failed`} icon={TrendingUp} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[
          { title: "Daily Active Users (14d)", sub: "Distinct users with any event", data: dau_chart, key: "users" },
          { title: "Event Volume (14d)", sub: "Total events fired per day", data: events_chart, key: "events" },
        ].map(({ title, sub, data, key }) => (
          <div key={key} className="rounded-2xl p-5" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <p className="text-sm font-semibold mb-1" style={{ color: "var(--text-hi)" }}>{title}</p>
            <p className="text-xs mb-3" style={{ color: "var(--text-lo)" }}>{sub}</p>
            <SparkLine data={data} valueKey={key} />
            <div className="flex justify-between text-[10px] mt-1" style={{ color: "var(--text-lo)" }}>
              <span>{data?.[0]?.date}</span>
              <span>{data?.[data.length - 1]?.date}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl p-5" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <p className="text-sm font-semibold mb-4" style={{ color: "var(--text-hi)" }}>Feature Usage (30d)</p>
          <div className="space-y-2.5">
            {event_counts?.length ? event_counts.slice(0, 12).map(e => (
              <MiniBar key={e.name} label={e.name} count={e.count} max={maxEvent} />
            )) : <p className="text-xs text-center py-4" style={{ color: "var(--text-lo)" }}>No events yet</p>}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl p-5" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <p className="text-sm font-semibold mb-1 flex items-center gap-2" style={{ color: "var(--text-hi)" }}>
              <Download size={14} style={{ color: "var(--text-lo)" }} /> Download Formats (30d)
            </p>
            <div className="space-y-2.5 mt-3">
              {downloads?.length ? downloads.map(d => (
                <MiniBar key={d.format} label={d.format.toUpperCase()} count={d.count} max={maxDownload} />
              )) : <p className="text-xs text-center py-4" style={{ color: "var(--text-lo)" }}>No downloads yet</p>}
            </div>
          </div>

          <div className="rounded-2xl p-5" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <p className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: "var(--text-hi)" }}>
              <Wand2 size={14} style={{ color: "var(--text-lo)" }} /> AI Import Funnel (30d)
            </p>
            <div className="space-y-2">
              {[
                { label: "Started", value: ai.import_started_30d },
                { label: "Completed", value: ai.import_completed_30d },
                { label: "Completion rate", value: ai.completion_rate != null ? `${ai.completion_rate}%` : "—", highlight: ai.completion_rate != null && ai.completion_rate < 50 },
              ].map(({ label, value, highlight }) => (
                <div key={label} className="flex justify-between text-sm">
                  <span style={{ color: "var(--text-mid)" }}>{label}</span>
                  <span className="font-semibold" style={{ color: highlight ? "#f87171" : "var(--text-hi)" }}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
        <div className="px-5 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
          <span className="text-sm font-semibold" style={{ color: "var(--text-hi)" }}>Most Active Users (30d)</span>
        </div>
        {top_users?.length ? (
          <ul>
            {top_users.map((u, i) => (
              <li key={u.email} className="flex items-center gap-3 px-5 py-2.5" style={{ borderTop: i > 0 ? "1px solid var(--border)" : undefined }}>
                <span className="text-xs font-bold w-4" style={{ color: "var(--text-lo)" }}>{i + 1}</span>
                <div className="w-7 h-7 rounded-full flex items-center justify-center font-semibold text-xs flex-shrink-0" style={{ background: "var(--cyan-dim)", color: "var(--cyan)" }}>
                  {u.email[0].toUpperCase()}
                </div>
                <span className="flex-1 text-sm truncate" style={{ color: "var(--text-hi)" }}>{u.email}</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ color: "var(--text-mid)", background: "var(--card2)" }}>{u.events} events</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-center py-8" style={{ color: "var(--text-lo)" }}>No user activity yet</p>
        )}
      </div>
    </div>
  );
}
