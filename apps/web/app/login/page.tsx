"use client";

import { useAuth } from "../../context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Leaf, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const { user, loginWithGoogle } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) router.push("/dashboard");
  }, [user, router]);

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
          <Leaf className="w-3.5 h-3.5" style={{ color: "var(--green-accent)" }} />
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 600 }}>GreenLedger</span>
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
              backgroundColor: "rgba(34,197,94,0.08)",
              border: "1px solid rgba(34,197,94,0.18)",
            }}
          >
            <Leaf className="w-6 h-6" style={{ color: "var(--green-accent)" }} />
          </div>
        </div>

        <h1
          className="font-black mb-1"
          style={{ fontSize: "1.35rem", letterSpacing: "-0.03em", color: "var(--text-primary)" }}
        >
          Sign in to GreenLedger
        </h1>
        <p className="text-sm mb-8" style={{ color: "var(--text-muted)" }}>
          Carbon-aware AI infrastructure dashboard
        </p>

        {/* Google sign in */}
        <button
          onClick={loginWithGoogle}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-150"
          style={{
            backgroundColor: "var(--bg-card-hover)",
            border: "1px solid var(--border-bright)",
            color: "var(--text-primary)",
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.borderColor = "var(--border-bright)";
            (e.currentTarget as HTMLElement).style.backgroundColor = "var(--bg-raised)";
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.borderColor = "var(--border-bright)";
            (e.currentTarget as HTMLElement).style.backgroundColor = "var(--bg-card-hover)";
          }}
        >
          {/* Google G icon */}
          <svg width="16" height="16" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Continue with Google
        </button>

        <p className="text-xs mt-6" style={{ color: "var(--text-muted)" }}>
          By signing in, you agree to our terms and privacy policy.
        </p>
      </div>

      {/* Footer note */}
      <p className="mt-6 text-xs" style={{ color: "var(--text-muted)" }}>
        Don't have access?{" "}
        <Link
          href="/"
          className="transition-colors duration-100"
          style={{ color: "var(--text-secondary)" }}
          onMouseEnter={e => (e.currentTarget.style.color = "var(--text-primary)")}
          onMouseLeave={e => (e.currentTarget.style.color = "var(--text-secondary)")}
        >
          Learn about GreenLedger
        </Link>
      </p>
    </main>
  );
}
