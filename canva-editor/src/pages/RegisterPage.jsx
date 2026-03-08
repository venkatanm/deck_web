import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { register } from "../api/auth";
import { track } from "../api/analytics";
import { VeloxDecksLogo } from "../components/brand/VeloxDecksLogo";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    setLoading(true);
    try {
      await register(email, password);
      track('user.registered');
      navigate("/home", { replace: true });
    } catch (err) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "var(--bg)" }}>
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-[0.04]"
          style={{ background: "radial-gradient(circle, #2DD4F0, transparent 70%)" }} />
      </div>

      <div className="relative w-full max-w-sm rounded-2xl p-8" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
        <div className="mb-8">
          <VeloxDecksLogo size="md" />
        </div>
        <h1 className="text-xl font-semibold mb-6" style={{ color: "var(--text-hi)" }}>Create account</h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label htmlFor="email" className="panel-label">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="panel-input"
            />
          </div>
          <div>
            <label htmlFor="password" className="panel-label">Password (min 8 characters)</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
              className="panel-input"
            />
          </div>
          {error && (
            <p className="text-xs rounded-lg px-3 py-2" style={{ color: "#f87171", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)" }}>
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 disabled:opacity-50 font-semibold rounded-lg transition-opacity hover:opacity-90"
            style={{ background: "var(--cyan)", color: "var(--text-inv)" }}
          >
            {loading ? "Creating account…" : "Register"}
          </button>
        </form>
        <p className="mt-6 text-center text-sm" style={{ color: "var(--text-lo)" }}>
          Already have an account?{" "}
          <Link to="/login" className="font-medium transition-colors hover:opacity-80" style={{ color: "var(--cyan)" }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
