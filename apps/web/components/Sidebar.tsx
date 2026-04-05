"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Receipt,
  Bot,
  Leaf,
  LogOut,
  Route,
  Wallet,
  DollarSign,
} from "lucide-react";
import { useUser } from "@auth0/nextjs-auth0/client";

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
  const { user } = useUser();

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

      {/* User / Logout */}
      <div className="px-4 py-4 border-t" style={{ borderColor: "var(--border)" }}>
        {user && (
          <div className="flex items-center justify-between">
            <div className="truncate">
              <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>
                {user.name || "User"}
              </p>
              <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>
                {user.email}
              </p>
            </div>
            <a href = "/api/auth/logout" className="text-muted hover:text-primary transition-colors">
              <LogOut className="w-4 h-4" />
            </a>
          </div>
        )}
      </div>
    </aside>
  );
}
