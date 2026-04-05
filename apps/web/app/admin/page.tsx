"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Shield, LogIn, Eye, EyeOff } from "lucide-react";
import Link from "next/link";

const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "greenledger2026";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem("greenledger_admin") === "true") {
      router.push("/admin/dashboard");
    }
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Simulate brief delay
    await new Promise((r) => setTimeout(r, 400));

    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      sessionStorage.setItem("greenledger_admin", "true");
      router.push("/admin/dashboard");
    } else {
      setError("Invalid credentials");
      setLoading(false);
    }
  };

  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ backgroundColor: "var(--bg-primary)" }}
    >
      {/* Back to landing */}
      <div className="absolute top-5 left-6">
        <Link
          href="/"
          className="flex items-center gap-2 text-xs transition-colors duration-100"
          style={{ color: "var(--text-muted)" }}
          onMouseEnter={e => (e.currentTarget.style.color = "var(--text-secondary)")}
          onMouseLeave={e => (e.currentTarget.style.color = "var(--text-muted)")}
        >
          <Shield className="w-3.5 h-3.5" style={{ color: "var(--blue-accent)" }} />
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 600 }}>GreenLedger Admin</span>
        </Link>
      </div>

      {/* Card */}
      <div
        className="w-full max-w-sm rounded-2xl p-8 text-center"
        style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border)" }}
      >
        {/* Logo mark */}
        <div className="flex justify-center mb-6">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center"
            style={{
              backgroundColor: "rgba(96,165,250,0.08)",
              border: "1px solid rgba(96,165,250,0.18)",
            }}
          >
            <Shield className="w-6 h-6" style={{ color: "var(--blue-accent)" }} />
          </div>
        </div>

        <h1
          className="font-black mb-1"
          style={{ fontSize: "1.35rem", letterSpacing: "-0.03em", color: "var(--text-primary)" }}
        >
          Admin Access
        </h1>
        <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
          GreenLedger platform administration
        </p>

        <form onSubmit={handleLogin} className="space-y-3">
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={e => setUsername(e.target.value)}
            className="w-full px-4 py-2.5 rounded-lg text-sm outline-none transition-colors"
            style={{
              backgroundColor: "var(--bg-secondary)",
              border: "1px solid var(--border)",
              color: "var(--text-primary)",
              fontFamily: "var(--font-display)",
            }}
            onFocus={e => (e.currentTarget.style.borderColor = "var(--blue-accent)")}
            onBlur={e => (e.currentTarget.style.borderColor = "var(--border)")}
          />

          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 pr-10 rounded-lg text-sm outline-none transition-colors"
              style={{
                backgroundColor: "var(--bg-secondary)",
                border: "1px solid var(--border)",
                color: "var(--text-primary)",
                fontFamily: "var(--font-display)",
              }}
              onFocus={e => (e.currentTarget.style.borderColor = "var(--blue-accent)")}
              onBlur={e => (e.currentTarget.style.borderColor = "var(--border)")}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2"
              style={{ color: "var(--text-muted)" }}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {error && (
            <p className="text-xs text-left" style={{ color: "var(--red-accent)" }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex items-center justify-center gap-2.5 w-full px-4 py-2.5 rounded-lg text-sm font-medium transition-opacity hover:opacity-80 disabled:opacity-50"
            style={{
              backgroundColor: "var(--blue-accent)",
              color: "#000",
              fontFamily: "var(--font-display)",
            }}
          >
            <LogIn className="w-4 h-4" />
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>

      {/* Footer note */}
      <p className="mt-6 text-xs" style={{ color: "var(--text-muted)" }}>
        <Link
          href="/login"
          className="transition-colors duration-100"
          style={{ color: "var(--text-secondary)" }}
          onMouseEnter={e => (e.currentTarget.style.color = "var(--text-primary)")}
          onMouseLeave={e => (e.currentTarget.style.color = "var(--text-secondary)")}
        >
          Go to user login
        </Link>
      </p>
    </main>
  );
}
