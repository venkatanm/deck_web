import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Upload, Users, Shield, Trash2, ChevronLeft,
  FileUp, Globe, User, Check, X, AlertTriangle,
} from "lucide-react";
import { useToast } from "../components/Toast";
import { logout } from "../api/auth";

export default function AdminPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [tab, setTab] = useState("templates");

  // Verify admin on mount
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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="h-14 bg-white border-b border-gray-200 flex items-center px-6 gap-4 flex-shrink-0">
        <button
          type="button"
          onClick={() => navigate("/home")}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
        >
          <ChevronLeft size={16} /> Back
        </button>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-purple-600 rounded-lg flex items-center justify-center">
            <Shield size={14} className="text-white" />
          </div>
          <span className="font-semibold text-gray-800">Admin Panel</span>
        </div>
        <div className="ml-auto">
          <button
            type="button"
            onClick={logout}
            className="text-xs text-gray-500 hover:text-red-500 transition-colors"
          >
            Sign out
          </button>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar nav */}
        <nav className="w-52 bg-white border-r border-gray-200 py-4 flex flex-col gap-1 px-2">
          {[
            { id: "templates", label: "Global Templates", icon: Globe },
            { id: "users", label: "User Management", icon: Users },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                tab === id
                  ? "bg-purple-100 text-purple-700"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </nav>

        <main className="flex-1 p-8 overflow-y-auto">
          {tab === "templates" && <GlobalTemplatesTab toast={toast} />}
          {tab === "users" && <UsersTab toast={toast} />}
        </main>
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
      <h1 className="text-xl font-bold text-gray-900 mb-1">Global Templates</h1>
      <p className="text-sm text-gray-500 mb-6">
        Templates uploaded here are available to all users. Upload a .pptx file and it will be parsed and added to the standard library.
      </p>

      {/* Upload section */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6">
        <h2 className="text-sm font-semibold text-gray-800 mb-4">Upload PPTX Template</h2>
        <div className="flex gap-3 mb-3">
          <input
            type="text"
            placeholder="Template name (optional)"
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-purple-400"
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-purple-400"
          >
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="flex items-center justify-center gap-2 w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-sm font-medium text-gray-500 hover:border-purple-400 hover:text-purple-600 hover:bg-purple-50 transition-all disabled:opacity-50"
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

      {/* Global templates list */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-800">
            Global Library ({templates.length})
          </span>
        </div>
        {loading ? (
          <div className="p-6 text-center text-sm text-gray-400">Loading…</div>
        ) : templates.length === 0 ? (
          <div className="p-8 text-center">
            <Globe size={28} className="text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-400">No global templates yet. Upload one above.</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {templates.map((t) => (
              <li key={t.id} className="flex items-center gap-4 px-5 py-3">
                <div
                  className="w-14 h-10 rounded-lg flex-shrink-0 border border-gray-200"
                  style={{ background: t.thumbnail?.bg || "#f1f5f9" }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{t.name}</p>
                  <p className="text-xs text-gray-400">{t.category} · {t.slides?.length || 0} slides · PPTX</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(t.id, t.name)}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
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
      <h1 className="text-xl font-bold text-gray-900 mb-1">User Management</h1>
      <p className="text-sm text-gray-500 mb-6">View all users and grant admin privileges.</p>

      {/* Promote to admin */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6">
        <h2 className="text-sm font-semibold text-gray-800 mb-3">Grant Admin Access</h2>
        <div className="flex gap-3">
          <input
            type="email"
            placeholder="user@example.com"
            value={promoteEmail}
            onChange={(e) => setPromoteEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handlePromote()}
            className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-purple-400"
          />
          <button
            type="button"
            onClick={handlePromote}
            disabled={promoting || !promoteEmail.trim()}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-colors"
          >
            {promoting ? "Granting…" : "Grant Admin"}
          </button>
        </div>
      </div>

      {/* Users list */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100">
          <span className="text-sm font-semibold text-gray-800">All Users ({users.length})</span>
        </div>
        {loading ? (
          <div className="p-6 text-center text-sm text-gray-400">Loading…</div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {users.map((u) => (
              <li key={u.id} className="flex items-center gap-3 px-5 py-3">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-semibold text-xs flex-shrink-0">
                  {u.email[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{u.email}</p>
                  <p className="text-xs text-gray-400">
                    Joined {new Date(u.created_at).toLocaleDateString()}
                  </p>
                </div>
                {u.is_admin && (
                  <span className="flex items-center gap-1 text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">
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
