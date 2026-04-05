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
import { useAuth } from "@/context/AuthContext";

const navItems = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/router", label: "Green Router", icon: Route },
  { href: "/dashboard/agents", label: "Agents", icon: Bot },
  { href: "/dashboard/wallets", label: "Carbon Wallets", icon: Wallet },
  { href: "/dashboard/levy", label: "Carbon Levy", icon: DollarSign },
  { href: "/dashboard/receipts", label: "Receipts", icon: Receipt },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <aside className="fixed left-0 top-0 h-screen w-60 flex flex-col border-r"
      style={{ backgroundColor: "var(--bg-secondary)", borderColor: "var(--border)" }}
    >
      {/* Logo */}
      <div className="px-5 py-5 border-b" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-center gap-2">
          <Leaf className="w-6 h-6" style={{ color: "var(--green-accent)" }} />
          <span className="text-lg font-bold tracking-tight" style={{ color: "var(--green-accent)" }}>
            GreenLedger
          </span>
        </div>
        <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
          Carbon-Aware AI Dashboard
        </p>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors"
              style={{
                backgroundColor: isActive ? "var(--bg-card-hover)" : "transparent",
                color: isActive ? "var(--green-accent)" : "var(--text-secondary)",
                borderLeft: isActive ? "2px solid var(--green-accent)" : "2px solid transparent",
              }}
            >
              <item.icon className="w-4 h-4" />
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
                {user.displayName || "User"}
              </p>
              <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>
                {user.email}
              </p>
            </div>
            <button
              onClick={logout}
              className="p-1.5 rounded-md hover:opacity-80 transition-opacity"
              style={{ color: "var(--text-muted)" }}
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
