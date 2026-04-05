"use client";

import { useUser } from "@auth0/nextjs-auth0/client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Leaf, LogIn } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const { user } = useUser();
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

        <a
          href="/api/auth/login"
          className="flex items-center justify-center gap-2.5 w-full px-4 py-2.5 rounded-lg text-sm font-medium transition-opacity hover:opacity-80"
          style={{
            backgroundColor: "var(--green-accent)",
            color: "#000",
            fontFamily: "var(--font-display)",
          }}
        >
          <LogIn className="w-4 h-4" />
          Sign in with Google
        </a>
      </div>

      {/* Footer note */}
      <p className="mt-6 text-xs" style={{ color: "var(--text-muted)" }}>
        Don&apos;t have access?{" "}
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
