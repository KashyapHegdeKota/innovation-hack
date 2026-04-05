"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Leaf, LogOut, Sun, Moon, Shield } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

const navItems = [
  { href: "/admin/dashboard",           label: "Platform Overview" },
  { href: "/admin/dashboard/clients",    label: "Clients" },
  { href: "/admin/dashboard/routing",   label: "Routing Intelligence" },
  { href: "/admin/dashboard/carbon",    label: "Carbon Removal" },
  { href: "/admin/dashboard/activity",  label: "Activity Feed" },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();

  const handleLogout = () => {
    sessionStorage.removeItem("greenledger_admin");
    router.push("/admin");
  };

  return (
    <aside className="fixed left-0 top-0 h-screen w-60 flex flex-col glass">
      {/* Logo + theme toggle */}
      <div className="px-5 py-5" style={{ borderBottom: "1px solid var(--border)" }}>
        <div className="flex items-center justify-between">
          <Link href="/admin/dashboard" className="flex items-center gap-2.5 group">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
              style={{
                backgroundColor: "rgba(96,165,250,0.1)",
                border: "1px solid rgba(96,165,250,0.18)",
              }}
            >
              <Shield className="w-3.5 h-3.5" style={{ color: "var(--blue-accent)" }} />
            </div>
            <span
              className="text-sm font-bold"
              style={{ color: "var(--text-primary)", fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}
            >
              GL Admin
            </span>
          </Link>

          <button
            onClick={toggleTheme}
            className="w-7 h-7 rounded-md flex items-center justify-center transition-colors duration-100"
            style={{ color: "var(--text-muted)" }}
            title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = "var(--bg-card-hover)"; (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = "transparent"; (e.currentTarget as HTMLElement).style.color = "var(--text-muted)"; }}
          >
            {theme === "dark" ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Section label */}
      <div className="px-5 pt-5 pb-2">
        <span className="label">Admin Panel</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto pb-4">
        {navItems.map((item) => {
          const isActive =
            item.href === "/admin/dashboard"
              ? pathname === "/admin/dashboard"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all duration-100 ${isActive ? "nav-active" : ""}`}
              style={{
                color: isActive ? "var(--text-primary)" : "var(--text-secondary)",
                fontFamily: "var(--font-display)",
                fontWeight: isActive ? 500 : 400,
                borderLeft: isActive ? "2px solid var(--blue-accent)" : "2px solid transparent",
              }}
              onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.backgroundColor = "var(--bg-card-hover)"; }}
              onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.backgroundColor = "transparent"; }}
            >
              <span
                className="w-1 h-1 rounded-full shrink-0 transition-all duration-150"
                style={{
                  backgroundColor: isActive ? "var(--blue-accent)" : "transparent",
                  boxShadow: isActive ? "0 0 4px rgba(96,165,250,0.5)" : "none",
                }}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Back to user dashboard */}
      <div className="px-3 pb-2">
        <Link
          href="/dashboard"
          className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all duration-100"
          style={{ color: "var(--text-muted)", fontFamily: "var(--font-display)" }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = "var(--bg-card-hover)"; (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = "transparent"; (e.currentTarget as HTMLElement).style.color = "var(--text-muted)"; }}
        >
          <Leaf className="w-3 h-3" style={{ color: "var(--green-accent)" }} />
          User Dashboard
        </Link>
      </div>

      {/* Admin / Logout */}
      <div className="px-5 py-4" style={{ borderTop: "1px solid var(--border)" }}>
        <div className="flex items-center gap-2.5">
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
            style={{
              backgroundColor: "rgba(96,165,250,0.1)",
              color: "var(--blue-accent)",
              fontFamily: "var(--font-mono)",
              border: "1px solid rgba(96,165,250,0.12)",
            }}
          >
            A
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate" style={{ color: "var(--text-primary)" }}>
              Admin
            </p>
            <p className="text-[10px] truncate" style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
              greenledger-admin
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="p-1 rounded-md transition-colors duration-100"
            style={{ color: "var(--text-muted)" }}
            onMouseEnter={e => (e.currentTarget.style.color = "var(--text-secondary)")}
            onMouseLeave={e => (e.currentTarget.style.color = "var(--text-muted)")}
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
