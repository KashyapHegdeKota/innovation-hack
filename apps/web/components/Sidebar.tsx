"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Receipt, Bot, Leaf, LogOut,
  Route, Wallet, DollarSign,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const navItems = [
  { href: "/dashboard",          label: "Overview",       icon: LayoutDashboard },
  { href: "/dashboard/router",   label: "Green Router",   icon: Route },
  { href: "/dashboard/agents",   label: "Agents",         icon: Bot },
  { href: "/dashboard/wallets",  label: "Carbon Wallets", icon: Wallet },
  { href: "/dashboard/levy",     label: "Carbon Levy",    icon: DollarSign },
  { href: "/dashboard/receipts", label: "Receipts",       icon: Receipt },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <aside className="fixed left-0 top-0 h-screen w-60 flex flex-col border-r glass"
      style={{ borderColor: "var(--border)" }}>

      {/* Logo */}
      <div className="px-5 py-6 border-b" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center green-glow"
            style={{ background: "linear-gradient(135deg, rgba(34,197,94,0.2), rgba(34,197,94,0.05))", border: "1px solid rgba(34,197,94,0.3)" }}>
            <Leaf className="w-4 h-4" style={{ color: "var(--green-accent)" }} />
          </div>
          <div>
            <span className="text-base font-bold tracking-tight gradient-text">GreenLedger</span>
            <p className="text-[10px] leading-tight" style={{ color: "var(--text-muted)" }}>Carbon-Aware AI</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map((item) => {
          const isActive = item.href === "/dashboard"
            ? pathname === "/dashboard"
            : pathname.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${isActive ? "nav-active" : "hover:bg-[#161f1b]"}`}
              style={{ color: isActive ? "var(--green-accent)" : "var(--text-secondary)" }}>
              <item.icon className="w-4 h-4 shrink-0" />
              {item.label}
              {isActive && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full pulse-live"
                  style={{ backgroundColor: "var(--green-accent)" }} />
              )}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className="px-4 py-4 border-t" style={{ borderColor: "var(--border)" }}>
        {user && (
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
              style={{ background: "linear-gradient(135deg, rgba(34,197,94,0.3), rgba(34,197,94,0.1))", color: "var(--green-accent)", border: "1px solid rgba(34,197,94,0.2)" }}>
              {(user.displayName || "U")[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold truncate" style={{ color: "var(--text-primary)" }}>
                {user.displayName || "User"}
              </p>
              <p className="text-[10px] truncate" style={{ color: "var(--text-muted)" }}>
                {user.email}
              </p>
            </div>
            <button onClick={logout} className="p-1.5 rounded-md transition-opacity hover:opacity-80 shrink-0"
              style={{ color: "var(--text-muted)" }} title="Logout">
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
