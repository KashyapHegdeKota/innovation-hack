"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Leaf, LogOut } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const navItems = [
  { href: "/dashboard",          label: "Overview"       },
  { href: "/dashboard/router",   label: "Green Router"   },
  { href: "/dashboard/agents",   label: "Agents"         },
  { href: "/dashboard/wallets",  label: "Carbon Wallets" },
  { href: "/dashboard/levy",     label: "Carbon Levy"    },
  { href: "/dashboard/receipts", label: "Receipts"       },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <aside
      className="fixed left-0 top-0 h-screen w-60 flex flex-col glass"
    >
      {/* Logo */}
      <div className="px-5 py-5" style={{ borderBottom: "1px solid var(--border)" }}>
        <Link href="/dashboard" className="flex items-center gap-2.5 group">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
            style={{
              backgroundColor: "rgba(34,197,94,0.1)",
              border: "1px solid rgba(34,197,94,0.18)",
            }}
          >
            <Leaf className="w-3.5 h-3.5" style={{ color: "var(--green-accent)" }} />
          </div>
          <div>
            <span
              className="text-sm font-bold"
              style={{ color: "var(--text-primary)", fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}
            >
              GreenLedger
            </span>
          </div>
        </Link>
      </div>

      {/* Section label */}
      <div className="px-5 pt-5 pb-2">
        <span className="label">Navigation</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto pb-4">
        {navItems.map((item) => {
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all duration-100 ${
                isActive ? "nav-active" : "hover:bg-[#161616]"
              }`}
              style={{
                color: isActive ? "var(--text-primary)" : "var(--text-secondary)",
                fontFamily: "var(--font-display)",
                fontWeight: isActive ? 500 : 400,
                borderLeft: isActive ? "2px solid var(--green-accent)" : "2px solid transparent",
              }}
            >
              {/* Active indicator dot */}
              <span
                className="w-1 h-1 rounded-full shrink-0 transition-all duration-150"
                style={{
                  backgroundColor: isActive ? "var(--green-accent)" : "transparent",
                  boxShadow: isActive ? "0 0 4px rgba(34,197,94,0.5)" : "none",
                }}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Divider */}
      <div style={{ borderTop: "1px solid var(--border)" }}>
        <div className="px-5 py-4">
          {user && (
            <div className="flex items-center gap-2.5">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
                style={{
                  backgroundColor: "rgba(34,197,94,0.1)",
                  color: "var(--green-accent)",
                  fontFamily: "var(--font-mono)",
                  border: "1px solid rgba(34,197,94,0.12)",
                }}
              >
                {(user.displayName || "U")[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate" style={{ color: "var(--text-primary)" }}>
                  {user.displayName || "User"}
                </p>
                <p className="text-[10px] truncate" style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                  {user.email}
                </p>
              </div>
              <button
                onClick={logout}
                className="p-1 rounded-md transition-colors duration-100"
                style={{ color: "var(--text-muted)" }}
                onMouseEnter={e => (e.currentTarget.style.color = "var(--text-secondary)")}
                onMouseLeave={e => (e.currentTarget.style.color = "var(--text-muted)")}
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
