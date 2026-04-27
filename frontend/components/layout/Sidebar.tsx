"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { logout } from "@/lib/auth";
import { ThemeSwitcher } from "./ThemeSwitcher";

const NAV = [
  { href: "/dashboard",   icon: "⊞", label: "Дашборд"   },
  { href: "/training",    icon: "⚡", label: "Тренування" },
  { href: "/tournaments", icon: "🏆", label: "Турніри"   },
  { href: "/analytics",   icon: "📊", label: "Аналітика" },
  { href: "/profile",     icon: "◉",  label: "Профіль"   },
];

export function Sidebar() {
  const pathname = usePathname();
  const router   = useRouter();

  const handleLogout = () => { logout(); router.push("/"); };

  return (
    <aside className="fixed left-0 top-0 h-full w-56 z-40 flex flex-col
      glass-strong border-r border-[var(--border)]">

      {/* Logo */}
      <div className="px-5 pt-6 pb-5 border-b border-[var(--border)]">
        <span className="font-bold text-lg tracking-tight text-foreground glow-text"
          style={{ color: "var(--accent)" }}>
          Over The Top
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV.map(({ href, icon, label }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                ${active
                  ? "bg-[var(--accent-dim)] text-[var(--accent)] border border-[var(--accent)]/30 glow-sm"
                  : "text-muted hover:text-foreground hover:bg-[var(--surface-hover)]"}`}
            >
              <span className="text-base w-5 text-center">{icon}</span>
              {label}
              {active && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full glow"
                  style={{ background: "var(--accent)" }} />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="px-3 pb-5 space-y-2 border-t border-[var(--border)] pt-3">
        <ThemeSwitcher />
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-muted
            hover:text-red-400 hover:bg-red-500/10 transition-all duration-200"
        >
          <span className="text-base w-5 text-center">→</span>
          Вийти
        </button>
      </div>
    </aside>
  );
}
